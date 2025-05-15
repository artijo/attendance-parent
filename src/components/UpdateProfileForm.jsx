import React, { useState, useEffect } from "react";
import { HOSTNAME } from "../config";
import liff from "@line/liff";
import { getLineProfile, getLineUserId, hasLineProfile } from "../helper";

function UpdateProfileForm() {
    const [formData, setFormData] = useState({
        displayName: "",
        email: "",
        phone: ""
    });
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [userId, setUserId] = useState(null);
    
    // ดึงข้อมูล userId และข้อมูลผู้ใช้จาก sessionStorage หรือ LINE
    useEffect(() => {
        async function getUserProfile() {
            try {
                let profile;
                
                // ตรวจสอบว่ามีข้อมูลใน sessionStorage หรือไม่
                if (hasLineProfile()) {
                    profile = getLineProfile();
                    setUserId(profile.userId);
                } else {                    // ถ้าไม่มีข้อมูลใน sessionStorage ให้โหลดใหม่จาก LIFF API
                    await liff.ready;
                    profile = await liff.getProfile();
                    setUserId(profile.userId);
                }
                
                // ตั้งค่า displayName จาก LINE profile เป็นค่าเริ่มต้น
                setFormData(prev => ({
                    ...prev,
                    displayName: profile.displayName || ""
                }));
                
                // ดึงข้อมูลผู้ใช้จาก API
                fetchUserData(profile.userId);
                
            } catch (error) {
                console.error("Error getting LINE profile:", error);
                setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
                setLoading(false);
            }
        }
        
        getUserProfile();
    }, []);
    
    // ดึงข้อมูลผู้ใช้จาก API
    const fetchUserData = async (userId) => {
        try {
            setLoading(true);
            
            const response = await fetch(`${HOSTNAME}/p/profile/${userId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    // ถ้าไม่พบข้อมูลผู้ใช้ ให้ใช้ข้อมูลจาก LINE เป็นค่าเริ่มต้น
                    setLoading(false);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // อัปเดตข้อมูลฟอร์มจากข้อมูลที่ได้รับ
            setFormData({
                displayName: data.name || formData.displayName,
                email: data.email || "",
                phone: data.tel || ""
            });
            
        } catch (error) {
            console.error("Error fetching user data:", error);
            setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setLoading(false);
        }
    };
    
    // จัดการการเปลี่ยนแปลงในฟอร์ม
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // จัดการการส่งฟอร์ม
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // ตรวจสอบข้อมูลในฟอร์ม
        if (!formData.displayName.trim()) {
            setError("กรุณากรอกชื่อ-นามสกุล");
            return;
        }
        
        // ตรวจสอบรูปแบบอีเมลถ้ามีการกรอก
        if (formData.email && !validateEmail(formData.email)) {
            setError("รูปแบบอีเมลไม่ถูกต้อง");
            return;
        }
        
        // ตรวจสอบรูปแบบเบอร์โทรศัพท์ถ้ามีการกรอก
        if (formData.phone && !validatePhone(formData.phone)) {
            setError("รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (กรอกเฉพาะตัวเลข)");
            return;
        }
        
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);
        
        try {
            // ส่งข้อมูลไปยัง API
            const response = await fetch(`${HOSTNAME}/p/update-profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userId,
                    name: formData.displayName.trim(),
                    email: formData.email.trim(),
                    tel: formData.phone.trim()
                }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            setSuccess("อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว");
            
            // รอสักครู่แล้วกลับไปหน้าหลัก
            setTimeout(() => {
                window.location.href = "/";
            }, 3000);
            
        } catch (error) {
            console.error("Error updating profile:", error);
            setError("ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // ตรวจสอบรูปแบบอีเมล
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };
    
    // ตรวจสอบรูปแบบเบอร์โทรศัพท์
    const validatePhone = (phone) => {
        // อนุญาตให้มีตัวเลขเท่านั้น
        const re = /^\d+$/;
        return re.test(phone);
    };
    
    // กลับไปยังหน้าหลัก
    const handleCancel = () => {
        window.location.href = "/";
    };
    
    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                แก้ไขข้อมูลส่วนตัว
            </h2>
            
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
            
            {loading ? (
                <div className="flex flex-col justify-center items-center h-40 sm:h-48">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary mb-3"></div>
                    <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-text-alt mb-1">
                            ชื่อ-นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                id="displayName"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleChange}
                                placeholder="กรอกชื่อ-นามสกุล"
                                className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 sm:text-sm border-gray-300 rounded-md"
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-alt mb-1">
                            อีเมล
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="กรอกอีเมล (ไม่บังคับ)"
                                className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 sm:text-sm border-gray-300 rounded-md"
                                disabled={isSubmitting}
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">อีเมลสำหรับติดต่อเพิ่มเติม</p>
                    </div>
                    
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-text-alt mb-1">
                            เบอร์โทรศัพท์
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="กรอกเบอร์โทรศัพท์ (ไม่บังคับ)"
                                className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 sm:text-sm border-gray-300 rounded-md"
                                disabled={isSubmitting}
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">เบอร์โทรศัพท์สำหรับติดต่อเพิ่มเติม</p>
                    </div>
                    
                    <div className="pt-4 sm:pt-5 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                        <button 
                            type="button" 
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors w-full sm:w-auto text-sm font-medium"
                        >
                            ยกเลิก
                        </button>
                        
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`px-4 py-2 ${isSubmitting ? 'bg-primary-dark' : 'bg-primary hover:bg-primary-dark'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors w-full sm:w-auto flex justify-center items-center text-sm font-medium`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    บันทึกข้อมูล
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
            
            <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-text mb-2">หมายเหตุ</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-text-alt pl-1">
                    <li>ข้อมูลส่วนตัวของท่านจะถูกเก็บเป็นความลับ</li>
                    <li>ข้อมูลอีเมลและเบอร์โทรศัพท์อาจจะถูกใช้ในกรณีที่ทางโรงเรียนต้องการติดต่อเพิ่มเติม</li>
                    <li>ท่านสามารถแก้ไขข้อมูลส่วนตัวได้ตลอดเวลา</li>
                </ul>
            </div>
        </div>
    );
}

export default UpdateProfileForm;