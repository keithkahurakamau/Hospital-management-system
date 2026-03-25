import React from 'react';
import AdminDashboard from './AdminDashboard'; // Your separate component
// import DoctorDashboard from './DoctorDashboard'; 
// import ReceptionistDashboard from './ReceptionistDashboard';

const Dashboard = () => {
    const userRole = sessionStorage.getItem('userRole');

    // Logic Engine: Render the component based on the authenticated role
    switch (userRole) {
        case 'ADMIN':
            return <AdminDashboard />;
        case 'DOCTOR':
            return <div className="p-10 text-slate-400 font-black">Doctor Workspace Loading...</div>;
        case 'RECEPTIONIST':
            return <div className="p-10 text-slate-400 font-black">Receptionist Desk Loading...</div>;
        default:
            return (
                <div className="h-[80vh] flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Initializing Session...</p>
                    </div>
                </div>
            );
    }
};

export default Dashboard;