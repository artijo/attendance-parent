import liff from "@line/liff";
import { useEffect, useState } from "react";

export default function Profile() {
    const [pictureUrl, setPictureUrl] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    async function getProfile() {
        try {
            setLoading(true);
            const profile = await liff.getProfile();
            console.log("LIFF Profile:", profile);
            setPictureUrl(profile.pictureUrl);
            setDisplayName(profile.displayName);
            setLoading(false);
        } catch (error) {
            console.error("Error getting LIFF profile:", error);
            setError("ไม่สามารถดึงข้อมูลโปรไฟล์ได้");
            setLoading(false);
        }
    }

    useEffect(() => {
        getProfile();
    }, []);

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
                    <div className="text-center sm:text-left">
                        <h2 className="text-lg font-bold text-text truncate-text max-w-[200px]">{displayName || "ผู้ปกครอง"}</h2>
                        <p className="text-sm text-text-alt">ยินดีต้อนรับเข้าสู่ระบบแจ้งเตือนผู้ปกครอง</p>
                    </div>
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