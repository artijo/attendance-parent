import React, { useState } from "react";
import { HOSTNAME } from "../config";
import liff from "@line/liff";
import { formatTitle, getLineProfile, getLineUserId, hasLineProfile } from "../helper";

function AddStudentForm() {
    const [studentId, setStudentId] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [userId, setUserId] = useState(null);
    const [studentData, setStudentData] = useState(null);
      // ดึงข้อมูล userId จาก sessionStorage หรือ LINE LOGIN
    React.useEffect(() => {
        async function getUserId() {
            try {
                // ตรวจสอบว่ามีข้อมูลใน sessionStorage หรือไม่
                if (hasLineProfile()) {
                    const userId = getLineUserId();
                    setUserId(userId);
                } else {
                    // ถ้าไม่มีข้อมูลใน sessionStorage ให้โหลดใหม่จาก LIFF API
                    const profile = await liff.getProfile();
                    setUserId(profile.userId);
                }
            } catch (err) {
                console.error("Error getting LINE profile:", err);
                setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาล็อกอินใหม่อีกครั้ง");
            }
        }
        
        getUserId();
    }, []);

    // ตรวจสอบข้อมูลนักเรียนเมื่อรหัสนักเรียนเปลี่ยนแปลงและมีความยาวครบ 5 ตัว
    React.useEffect(() => {
        if (studentId.length === 5) {
            checkStudentData(studentId);
        } else {
            // หากรหัสนักเรียนไม่ครบ 5 ตัว ให้ล้างข้อมูลนักเรียน
            setStudentData(null);
        }
    }, [studentId]);
    
    const checkStudentData = async (id) => {
        setIsChecking(true);
        setError(null);
        
        try {
            const response = await fetch(`${HOSTNAME}/p/student/${id}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    setError("ไม่พบข้อมูลนักเรียนที่ระบุ กรุณาตรวจสอบรหัสนักเรียนอีกครั้ง");
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                setStudentData(null);
                setIsChecking(false);
                return;
            }
            
            const data = await response.json();
            setStudentData(data);
        } catch (err) {
            console.error("Error checking student data:", err);
            setError("ไม่สามารถตรวจสอบข้อมูลนักเรียนได้ กรุณาลองใหม่อีกครั้ง");
            setStudentData(null);
        } finally {
            setIsChecking(false);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // ตรวจสอบรหัสนักเรียน
        if (!studentId || studentId.trim() === "") {
            setError("กรุณากรอกรหัสนักเรียน");
            return;
        }
        
        // ตรวจสอบว่ามีข้อมูลนักเรียนหรือไม่
        if (!studentData) {
            setError("ไม่พบข้อมูลนักเรียน กรุณาตรวจสอบรหัสนักเรียนอีกครั้ง");
            return;
        }
        
        // ตรวจสอบ userId
        if (!userId) {
            setError("ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่อีกครั้ง");
            return;
        }
        
        setIsProcessing(true);
        setError(null);
        setSuccess(null);
        
        try {
            // ส่งข้อมูลไปยัง API
            const response = await fetch(`${HOSTNAME}/p/addStudent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userId,
                    studentId: studentId.trim()
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "ไม่สามารถเพิ่มนักเรียนได้");
            }
            
            const data = await response.json();
            setSuccess(`เพิ่มนักเรียน ${formatTitle(studentData.title)}${studentData.fName} ${studentData.lName} เรียบร้อยแล้ว`);
            setStudentId("");
            setStudentData(null);
            
            // รอ 3 วินาทีแล้วกลับไปหน้าหลัก
            setTimeout(() => {
                window.location.href = "/";
            }, 3000);
            
        } catch (err) {
            console.error("Error adding student:", err);
            setError(err.message || "ไม่สามารถเพิ่มนักเรียนได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleCancel = () => {
        window.location.href = "/";
    };

    // แปลงระดับชั้นให้เป็นรูปแบบที่อ่านง่าย
    const formatClass = (classroom) => {
        if (!classroom) return "-";
        return `ม.${classroom.classLevel}/${classroom.classRoom}`;
    };

    // แสดงคะแนนความประพฤติพร้อมสี
    const getBehaviourScoreClass = (score) => {
        if (score >= 90) return "text-green-600";
        if (score >= 70) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            {/* แสดงข้อความผิดพลาด */}
            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* แสดงข้อความสำเร็จ */}
            {success && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">{success}</p>
                            <p className="text-xs text-green-600 mt-1">กำลังกลับไปหน้าหลัก...</p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="studentId" className="block text-sm font-medium text-text-alt mb-1">รหัสนักเรียน</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-3 3h6a3.001 3.001 0 00-3-3z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            id="studentId"
                            name="studentId"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').substring(0, 5))}
                            placeholder="กรอกรหัสนักเรียน 5 หลัก"
                            className="focus:ring-primary focus:border-primary block w-full pl-10 pr-12 py-3 sm:text-sm border-gray-300 rounded-md"
                            disabled={isProcessing}
                            maxLength={5}
                            pattern="\d{5}"
                            title="กรุณากรอกรหัสนักเรียน 5 หลัก"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                            {isChecking ? (
                                <div className="text-gray-500 sm:text-sm mr-3">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            ) : (
                                <div className="text-gray-500 sm:text-sm mr-3">
                                    {studentId.length}/5
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">ตัวอย่าง: 12345</p>
                </div>

                {/* แสดงข้อมูลนักเรียน เมื่อตรวจพบ */}
                {studentData && (
                    <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-primary text-lg mb-2">ข้อมูลนักเรียน</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-md shadow-sm">
                                <div className="text-sm text-gray-500">ชื่อ-นามสกุล</div>
                                <div className="font-medium">{formatTitle(studentData.title)}{studentData.fName} {studentData.lName}</div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-md shadow-sm">
                                <div className="text-sm text-gray-500">รหัสนักเรียน</div>
                                <div className="font-medium">{studentData.stdId}</div>
                            </div>
                            
                            {studentData.classroomMembers && studentData.classroomMembers.length > 0 && (
                                <>
                                    <div className="bg-white p-3 rounded-md shadow-sm">
                                        <div className="text-sm text-gray-500">ชั้นเรียน</div>
                                        <div className="font-medium">{formatClass(studentData.classroomMembers[0].classroom)}</div>
                                    </div>
                                    
                                    <div className="bg-white p-3 rounded-md shadow-sm">
                                        <div className="text-sm text-gray-500">เลขที่</div>
                                        <div className="font-medium">{studentData.classroomMembers[0].stdNo || "-"}</div>
                                    </div>
                                    
                                    <div className="bg-white p-3 rounded-md shadow-sm col-span-1 sm:col-span-2">
                                        <div className="text-sm text-gray-500">คะแนนความประพฤติ</div>
                                        <div className={`font-medium text-lg ${getBehaviourScoreClass(studentData.classroomMembers[0].behaviourScore)}`}>
                                            {studentData.classroomMembers[0].behaviourScore || "-"} คะแนน
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                    <button 
                        type="button" 
                        onClick={handleCancel}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors w-full sm:w-auto text-sm font-medium"
                    >
                        ยกเลิก
                    </button>
                    
                    {studentData && (
                        <button 
                            type="submit" 
                            disabled={isProcessing || isChecking}
                            className={`px-4 py-2 ${isProcessing ? 'bg-primary-dark' : 'bg-primary hover:bg-primary-dark'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors w-full sm:w-auto flex justify-center items-center text-sm font-medium`}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    กำลังดำเนินการ...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    ยืนยันการเพิ่มนักเรียน
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>

            <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-text mb-2">วิธีการค้นหารหัสนักเรียน</h3>
                <ol className="list-decimal list-inside space-y-1 text-xs text-text-alt">
                    <li>สอบถามจากนักเรียน</li>
                    <li>สอบถามจากครูประจำชั้น</li>
                    <li>ติดต่อฝ่ายทะเบียนของโรงเรียน</li>
                </ol>
            </div>
        </div>
    );
}

export default AddStudentForm;