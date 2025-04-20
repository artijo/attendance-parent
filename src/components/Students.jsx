import { useEffect, useState } from "react";

export default function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        fetchStudents();
    }, []);
    
    const fetchStudents = async () => {
        try {
            // Simulate API call with mock data for now
            setTimeout(() => {
                setStudents([
                    { id: 1, name: "นักเรียน คนที่หนึ่ง", grade: "ม.1/1", status: "กำลังศึกษา" },
                    { id: 2, name: "นักเรียน คนที่สอง", grade: "ม.2/3", status: "กำลังศึกษา" }
                ]);
                setLoading(false);
            }, 1000);
            
            // Uncomment when API is ready
            // const response = await fetch("https://api.example.com/students");
            // const data = await response.json();
            // setStudents(data);
            // setLoading(false);
        } catch (error) {
            console.error("Error fetching students:", error);
            setError("ไม่สามารถดึงข้อมูลนักเรียนได้ กรุณาลองใหม่อีกครั้ง");
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-full">
            {/* Students list */}
            <div className="bg-white rounded-lg p-3 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6 flex items-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    รายชื่อนักเรียนในความดูแล
                </h2>

                {error && (
                    <div className="p-3 sm:p-4 mb-4 text-center bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}
                
                {loading ? (
                    <div className="flex justify-center items-center h-32 sm:h-40">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary"></div>
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
                                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-text-alt uppercase tracking-wider">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-line-alt">
                                    {students.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-text">{index + 1}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-medium text-text">{student.name}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-primary">
                                                    {student.grade}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-text-alt">{student.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* การ์ดสำหรับหน้าจอมือถือ (ซ่อนบนหน้าจอขนาดกลางขึ้นไป) */}
                        <div className="sm:hidden space-y-3">
                            {students.map((student, index) => (
                                <div key={student.id} className="bg-white rounded-md border border-line-alt p-3 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-sm font-bold text-text">
                                            {student.name}
                                        </div>
                                        <span className="text-xs bg-blue-100 text-primary px-2 py-1 rounded-full font-medium">
                                            {student.grade}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-alt">ลำดับที่: {index + 1}</span>
                                        <span className="text-text-alt">{student.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="py-10 text-center">
                        <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-text">ไม่พบข้อมูลนักเรียน</h3>
                        <p className="mt-1 text-sm text-text-alt">กรุณาติดต่อฝ่ายทะเบียน</p>
                    </div>
                )}
                
                <div className="mt-6 sm:mt-8 flex justify-center">
                    <button
                        className="px-4 sm:px-6 py-2 bg-secondary hover:bg-opacity-90 text-white rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary flex items-center text-sm sm:text-base"
                        onClick={() => {
                            setLoading(true);
                            fetchStudents();
                        }}
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
                    <li>มาถึงโรงเรียน</li>
                    <li>ออกจากโรงเรียน</li>
                    <li>ขาดเรียนหรือมาสาย</li>
                    <li>มีกิจกรรมพิเศษ</li>
                </ul>
            </div>
        </div>
    );
}