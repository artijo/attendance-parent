import { useEffect, useState } from "react";
import { HOSTNAME } from "../config";
import liff from "@line/liff";
import { formatTitle } from "../helper";

export default function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [cancelingStudent, setCancelingStudent] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    
    useEffect(() => {
        // ดึง userId จาก LINE Login ก่อน
        async function getUserProfile() {
            try {
                // รอให้ LIFF พร้อมใช้งาน
                // if (!liff.isLoggedIn()) {
                //     liff.login();
                //     return;
                // }
                
                // ดึงข้อมูล LINE Profile
                const profile = await liff.getProfile();
                setUserId(profile.userId);
            } catch (error) {
                console.error("Error getting LINE profile:", error);
                setError("ไม่สามารถดึง userId ได้ กรุณาลองใหม่อีกครั้ง");
                setLoading(false);
            }
        }
        
        getUserProfile();
    }, []);
    
    // เมื่อ userId มีการเปลี่ยนแปลง (ได้รับค่าแล้ว) จึงดึงข้อมูลนักเรียน
    useEffect(() => {
        if (userId) {
            fetchStudents();
        }
    }, [userId]);

    // ซ่อนข้อความสำเร็จหลังจาก 5 วินาที
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [successMessage]);
    
    const fetchStudents = async () => {
        try {
            setLoading(true);
            
            // ตรวจสอบว่ามี userId หรือไม่
            if (!userId) {
                setError("ไม่พบข้อมูล userId กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
                setLoading(false);
                return;
            }
            
            console.log("Fetching students for userId:", userId);
            
            // เรียกใช้ API ด้วย userId ที่ได้รับ
            const response = await fetch(`${HOSTNAME}/p/students/${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Student data:", data);
            setStudents(data);
            setLoading(false);
            
            // ในกรณีที่ API ยังไม่พร้อม สามารถใช้ข้อมูลจำลอง
            // setStudents([
            //     { id: 1, name: "นักเรียน คนที่หนึ่ง", grade: "ม.1/1", status: "กำลังศึกษา" },
            //     { id: 2, name: "นักเรียน คนที่สอง", grade: "ม.2/3", status: "กำลังศึกษา" }
            // ]);
            // setLoading(false);
        } catch (error) {
            console.error("Error fetching students:", error);
            setError(`ไม่สามารถดึงข้อมูลนักเรียนได้ (${error.message}) กรุณาลองใหม่อีกครั้ง`);
            setLoading(false);
        }
    };

    // ฟังก์ชันยกเลิกรับการแจ้งเตือนของนักเรียน
    const cancelNotification = async (studentId) => {
        try {
            if (!userId || !studentId) {
                setError("ไม่สามารถยกเลิกการรับการแจ้งเตือนได้ ข้อมูลไม่ครบถ้วน");
                return;
            }

            setCancelingStudent(studentId);
            setError(null);

            const response = await fetch(`${HOSTNAME}/p/unsubscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    studentId: studentId,
                }),
            });

            if (!response.ok) {
                throw new Error(`ไม่สามารถยกเลิกการรับการแจ้งเตือนได้ (${response.status})`);
            }

            const result = await response.json();
            console.log("Unsubscribe result:", result);
            
            // อัพเดตข้อมูลนักเรียนหลังจากยกเลิกการรับการแจ้งเตือนเรียบร้อยแล้ว
            setStudents(prevStudents => prevStudents.filter(s => s.student.stdId !== studentId));
            setSuccessMessage(`ยกเลิกการรับการแจ้งเตือนสำหรับนักเรียนเรียบร้อยแล้ว`);
        } catch (error) {
            console.error("Error canceling notification:", error);
            setError(error.message || "ไม่สามารถยกเลิกการรับการแจ้งเตือนได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setCancelingStudent(null);
        }
    };

    // ฟังก์ชันแสดงกล่องยืนยันการยกเลิก
    const confirmCancelNotification = (student) => {
        const studentName = `${formatTitle(student.student.title)}${student.student.fName} ${student.student.lName}`;
        const studentId = student.student.stdId;
        
        if (window.confirm(`คุณต้องการยกเลิกการรับการแจ้งเตือนสำหรับ ${studentName} ใช่หรือไม่?`)) {
            cancelNotification(studentId);
        }
    };

    // ฟังก์ชันสำหรับการโหลดข้อมูลใหม่
    const handleRefresh = () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        // ถ้ายังไม่มี userId ให้ดึงข้อมูล profile ใหม่
        if (!userId) {
            liff.getProfile()
                .then(profile => {
                    setUserId(profile.userId);
                })
                .catch(error => {
                    console.error("Error refreshing profile:", error);
                    setError("ไม่สามารถดึงข้อมูล userId ได้ กรุณาลองใหม่อีกครั้ง");
                    setLoading(false);
                });
        } else {
            // ถ้ามี userId แล้ว ให้โหลดข้อมูลนักเรียนใหม่
            fetchStudents();
        }
    };

    // ฟังก์ชันนำทางไปยังหน้าเพิ่มนักเรียน
    const goToAddStudent = () => {
        window.location.href = '/new-student';
    };

    return (
        <div className="flex flex-col w-full">
            {/* Students list */}
            <div className="bg-white rounded-lg p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-primary mb-3 sm:mb-0 flex items-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        รายชื่อนักเรียนในความดูแล
                    </h2>
                    <button 
                        onClick={goToAddStudent}
                        className="bg-secondary hover:bg-opacity-90 text-white px-3 py-2 sm:px-4 rounded-md text-sm sm:text-base flex items-center shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        เพิ่มนักเรียน
                    </button>
                </div>

                {error && (
                    <div className="p-3 sm:p-4 mb-4 text-center bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="p-3 sm:p-4 mb-4 text-center bg-green-100 border border-green-200 text-green-700 rounded-md text-sm">
                        {successMessage}
                    </div>
                )}
                
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-32 sm:h-40">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary mb-2"></div>
                        <p className="text-sm text-gray-500">{!userId ? "กำลังดึงข้อมูลผู้ใช้..." : "กำลังโหลดข้อมูลนักเรียน..."}</p>
                    </div>
                ) : students.length > 0 ? (
                    <>
                        {/* ตารางสำหรับหน้าจอขนาดกลางขึ้นไป (ซ่อนบนมือถือ) */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-line">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-text-alt uppercase tracking-wider">ลำดับ</th>
                                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-text-alt uppercase tracking-wider">ชื่อ-นามสกุล</th>
                                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-text-alt uppercase tracking-wider">ชั้นเรียน</th>
                                        <th className="px-4 py-3 bg-gray-50 text-center text-xs font-medium text-text-alt uppercase tracking-wider">การแจ้งเตือน</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-line-alt">
                                    {students.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-text">{index + 1}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-medium text-text">{formatTitle(student.student.title)}{student.student.fName} {student.student.lName}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-primary">
                                                    ม.{student.student.classroomMembers[0].classroom.classLevel}/{student.student.classroomMembers[0].classroom.classRoom}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                <button
                                                    onClick={() => confirmCancelNotification(student)}
                                                    disabled={cancelingStudent === student.student.stdId}
                                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                                                >
                                                    {cancelingStudent === student.student.stdId ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            กำลังยกเลิก...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            ยกเลิกการแจ้งเตือน
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* การ์ดสำหรับหน้าจอมือถือ (ซ่อนบนหน้าจอขนาดกลางขึ้นไป) */}
                        <div className="sm:hidden space-y-3">
                            {students.map((student, index) => (
                                <div key={index} className="bg-white rounded-md border border-line-alt p-3 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-sm font-bold text-text">
                                            {student.student.fName} {student.student.lName}
                                        </div>
                                        <span className="text-xs bg-blue-100 text-primary px-2 py-1 rounded-full font-medium">
                                            ม.{student.student.classroomMembers[0].classroom.classLevel}/{student.student.classroomMembers[0].classroom.classRoom}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-text-alt">ลำดับที่: {index + 1}</span>
                                        <button
                                            onClick={() => confirmCancelNotification(student)}
                                            disabled={cancelingStudent === student.student.stdId}
                                            className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                                        >
                                            {cancelingStudent === student.student.stdId ? (
                                                <>
                                                    <svg className="animate-spin -ml-0.5 mr-1 h-3 w-3 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    กำลังยกเลิก...
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    ยกเลิกการแจ้งเตือน
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-text">ยังไม่มีนักเรียนในความดูแลของท่าน</h3>
                        <p className="mt-1 text-sm text-text-alt mb-4">คุณสามารถเพิ่มนักเรียนในความดูแลได้ทันที</p>
                        <button
                            onClick={goToAddStudent}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            เพิ่มนักเรียนใหม่
                        </button>
                    </div>
                )}
                
                <div className="mt-6 sm:mt-8 flex justify-center">
                    <button
                        className="px-4 sm:px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center text-sm sm:text-base"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        โหลดข้อมูลใหม่
                    </button>
                </div>
            </div>
            
            {/* Information card */}
            <div className="mt-4 sm:mt-8 bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-primary">
                <h3 className="text-base sm:text-lg font-bold text-primary mb-2">ข้อมูลการใช้งาน</h3>
                <p className="text-xs sm:text-sm text-text-alt mb-3 sm:mb-4">
                    ระบบนี้เป็นระบบแจ้งเตือนผู้ปกครองเกี่ยวกับการเข้าเรียนและกิจกรรมของนักเรียน 
                    ท่านจะได้รับการแจ้งเตือนผ่าน LINE เมื่อนักเรียนในความดูแลของท่าน:
                </p>
                <ul className="list-disc list-inside text-xs sm:text-sm text-text-alt space-y-1 pl-2">
                    <li>เข้าเรียน</li>
                    <li>ขาดเรียนหรือมาสาย</li>
                    <li>เข้าร่วมกิจกรรม</li>
                </ul>
            </div>
        </div>
    );
}