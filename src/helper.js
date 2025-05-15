export const formatTitle = (title) => {
    switch (title) {
        case 'BOY':
            return 'เด็กชาย';
        case 'GIRL':
            return 'เด็กหญิง';
        case 'MR':
            return 'นาย';
        case 'MS':
            return 'นางสาว';
        default:
            return title;
    }
}

// ฟังก์ชันสำหรับดึงข้อมูล LINE User ID จาก sessionStorage
export const getLineUserId = () => {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem('lineUserId');
    }
    return null;
}

// ฟังก์ชันสำหรับดึงข้อมูล LINE Profile จาก sessionStorage
export const getLineProfile = () => {
    if (typeof window !== 'undefined') {
        const profileStr = sessionStorage.getItem('lineProfile');
        if (profileStr) {
            try {
                return JSON.parse(profileStr);
            } catch (e) {
                console.error('Error parsing LINE profile from sessionStorage:', e);
            }
        }
    }
    return null;
}

// ฟังก์ชันตรวจสอบว่า LINE Profile มีอยู่หรือไม่
export const hasLineProfile = () => {
    return getLineProfile() !== null && getLineUserId() !== null;
}

// ฟังก์ชันสำหรับลบข้อมูล LINE Profile จาก sessionStorage (ใช้เมื่อต้องการ logout)
export const clearLineProfile = () => {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('lineUserId');
        sessionStorage.removeItem('lineProfile');
        sessionStorage.removeItem('profileLastUpdated');
    }
}

// ฟังก์ชันสำหรับดึงข้อมูล LINE Profile แบบปลอดภัย โดยจะรอให้ LIFF พร้อมใช้งาน
export const getLiffProfile = async (liff) => {
    try {
        // รอให้ LIFF SDK พร้อมใช้งานก่อน
        await liff.ready;
        
        // ตรวจสอบว่ามีข้อมูลใน sessionStorage หรือไม่
        if (hasLineProfile()) {
            return getLineProfile();
        }
        
        // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือไม่
        if (!liff.isLoggedIn()) {
            liff.login();
            return null;
        }
        
        // ดึงข้อมูล LINE Profile
        const profile = await liff.getProfile();
        
        // บันทึกข้อมูลลงใน sessionStorage
        if (profile && profile.userId) {
            sessionStorage.setItem("lineUserId", profile.userId);
            sessionStorage.setItem("lineProfile", JSON.stringify(profile));
            sessionStorage.setItem("profileLastUpdated", new Date().toISOString());
        }
        
        return profile;
    } catch (error) {
        console.error("Error getting LIFF profile:", error);
        return null;
    }
}