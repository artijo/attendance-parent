import liff from "@line/liff";
import { useEffect, useState } from "react";
import { HOSTNAME } from "../config";

export default function Profile() {
    const [pictureUrl, setPictureUrl] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    async function getProfile() {
        try {
            setLoading(true);
            const profile = await liff.getProfile();
            console.log("LIFF Profile:", profile);
            setPictureUrl(profile.pictureUrl);
            setDisplayName(profile.displayName);
            setUserId(profile.userId);
            setLoading(false);
        } catch (error) {
            console.error("Error getting LIFF profile:", error);
            setError("ไม่สามารถดึงข้อมูลโปรไฟล์ได้");
            setLoading(false);
        }
    }

    async function getUserProfile() {
        try {
            const user = await fetch(`${HOSTNAME}/p/profile/${userId}`)
            const data = await user.json()
            setDisplayName(data.name)
        } catch (error) {
            console.error("Error getting user profile:", error);
            setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        }
    }

    useEffect(() => {
        getProfile();
    }, []);

    useEffect(() => {
        if (userId) {
            getUserProfile();
        }
    }
    , [userId]);

    // ฟังก์ชันสำหรับไปยังหน้าอัปเดตข้อมูลผู้ปกครอง
    const goToUpdateProfile = () => {
        window.location.href = "/update-profile";
    };

    return (
        <div className="flex flex-col sm:flex-row items-center p-3 sm:p-4 bg-white rounded-lg shadow-sm">
            {loading ? (
                <div className="flex items-center justify-center w-full py-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    {pictureUrl ? (
                        <img 
                            src={pictureUrl} 
                            alt="Profile" 
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-primary object-cover mb-2 sm:mb-0 sm:mr-4" 
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2 sm:mb-0 sm:mr-4">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                            </svg>
                        </div>
                    )}
                    <div className="text-center sm:text-left flex-grow">
                        <h2 className="text-lg font-bold text-text truncate-text max-w-[200px]">{displayName || "ผู้ปกครอง"}</h2>
                        <p className="text-sm text-text-alt">ยินดีต้อนรับเข้าสู่ระบบแจ้งเตือนผู้ปกครอง</p>
                    </div>
                    <button 
                        onClick={goToUpdateProfile} 
                        className="mt-3 sm:mt-0 px-3 py-1.5 bg-secondary hover:bg-opacity-90 text-white text-sm rounded-md flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        แก้ไขข้อมูล
                    </button>
                </>
            )}
            {error && (
                <div className="mt-2 p-2 text-xs text-center bg-red-100 border border-red-200 text-red-700 rounded-md w-full sm:w-auto sm:ml-auto">
                    {error} <button onClick={getProfile} className="underline ml-1">ลองอีกครั้ง</button>
                </div>
            )}
        </div>
    );
}