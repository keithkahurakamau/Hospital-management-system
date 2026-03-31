import React from 'react';
import AdminDashboard from './AdminDashboard'; 
import { Stethoscope, UserRound, Loader2, LayoutDashboard, Pill, FlaskConical } from 'lucide-react';
// import DoctorDashboard from './DoctorDashboard'; 
// import ReceptionistDashboard from './ReceptionistDashboard';

const Dashboard = () => {
    const userRole = sessionStorage.getItem('userRole');

    // Reusable, responsive Empty State for roles without a dedicated dashboard yet
    const ComingSoon = ({ role, icon: Icon, colorClass, bgClass }) => (
        <div className="flex flex-col items-center justify-center min-h-[60vh] lg:min-h-[75vh] bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm p-6 lg:p-10 text-center animate-in fade-in duration-500 max-w-3xl mx-auto mt-4 lg:mt-8">
            <div className={`w-20 h-20 lg:w-24 lg:h-24 ${bgClass} ${colorClass} rounded-full flex items-center justify-center mb-5 lg:mb-6 shadow-sm border border-white/50`}>
                <Icon size={40} className="lg:w-12 lg:h-12" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight mb-2 lg:mb-3">
                {role} Workspace
            </h2>
            <p className="text-xs lg:text-sm font-medium text-slate-500 max-w-md leading-relaxed">
                The dedicated high-level dashboard for this role is currently under active development. Please use the sidebar navigation to access your clinical and operational modules.
            </p>
        </div>
    );

    // Logic Engine: Render the component based on the authenticated role
    switch (userRole) {
        case 'ADMIN':
            return <AdminDashboard />;
        case 'DOCTOR':
            return <ComingSoon role="Physician" icon={Stethoscope} colorClass="text-blue-600" bgClass="bg-blue-50" />;
        case 'RECEPTIONIST':
            return <ComingSoon role="Front Desk" icon={UserRound} colorClass="text-purple-600" bgClass="bg-purple-50" />;
        case 'PHARMACIST':
            return <ComingSoon role="Pharmacy" icon={Pill} colorClass="text-emerald-600" bgClass="bg-emerald-50" />;
        case 'LAB_TECH':
            return <ComingSoon role="Laboratory" icon={FlaskConical} colorClass="text-amber-600" bgClass="bg-amber-50" />;
        default:
            return (
                <div className="min-h-[70vh] flex items-center justify-center">
                    <div className="text-center space-y-4 lg:space-y-5 bg-white p-8 lg:p-12 rounded-[24px] lg:rounded-[32px] border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                        <Loader2 className="animate-spin text-blue-600 mx-auto lg:w-12 lg:h-12" size={40} />
                        <div>
                            <p className="text-slate-800 font-black text-sm lg:text-base tracking-tight mb-1">Authenticating Workspace</p>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px]">Initializing Session...</p>
                        </div>
                    </div>
                </div>
            );
    }
};

export default Dashboard;