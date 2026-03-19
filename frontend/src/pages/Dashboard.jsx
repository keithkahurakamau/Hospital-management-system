import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { Users, BedDouble, Activity, DollarSign, ArrowRight, UserPlus, FileText } from 'lucide-react';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/dashboard')
            .then(res => setData(res.data))
            .catch(err => console.error("Dashboard telemetry failed:", err))
            .finally(() => setLoading(false));
    }, []);

    // 🛡️ THE FIX: The Loading Guard
    // This stops React from reading 'data.kpis' before the API finishes loading
    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center text-[#A3AED0] font-bold animate-pulse">
                Synchronizing Dashboard Telemetry...
            </div>
        );
    }

    if (!data || !data.kpis) {
        return <div className="p-8 text-red-500 font-bold">Failed to connect to the Analytics Engine.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-[#1B2559]">System Overview</h2>
                    <p className="text-sm text-[#A3AED0] mt-1">Real-time hospital operations and telemetry</p>
                </div>
                <p className="text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
                    System Status: Operational
                </p>
            </header>

            {/* Core Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={<Users />} title="Total Patients" 
                    value={data.kpis.total_patients} 
                    color="text-blue-600" bg="bg-blue-100" 
                />
                <StatCard 
                    icon={<BedDouble />} title="Ward Occupancy" 
                    value={`${data.kpis.occupancy_rate}%`} 
                    color="text-indigo-600" bg="bg-indigo-100" 
                />
                <StatCard 
                    icon={<Activity />} title="Pending Labs" 
                    value={data.kpis.pending_labs} 
                    color="text-orange-600" bg="bg-orange-100" 
                />
                <StatCard 
                    icon={<DollarSign />} title="Monthly Revenue" 
                    value={`KES ${data.kpis.monthly_revenue.toLocaleString()}`} 
                    color="text-emerald-600" bg="bg-emerald-100" 
                />
            </div>

            {/* Quick Actions & System Modules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                
                {/* Quick Actions */}
                <div className="bg-white p-8 rounded-3xl border border-slate-50 shadow-sm">
                    <h3 className="text-lg font-bold text-[#1B2559] mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <QuickActionButton to="/patients" icon={<UserPlus />} label="Register Patient" color="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white" />
                        <QuickActionButton to="/records" icon={<FileText />} label="Clinical Notes" color="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white" />
                        <QuickActionButton to="/beds" icon={<BedDouble />} label="Admit to Ward" color="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white" />
                        <QuickActionButton to="/lab" icon={<Activity />} label="Order Lab Test" color="bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white" />
                    </div>
                </div>

                {/* Gateway Status Summary */}
                <div className="bg-white p-8 rounded-3xl border border-slate-50 shadow-sm flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-[#1B2559] mb-6">Integration Status</h3>
                    <div className="space-y-4">
                        <StatusRow label="KRA eTIMS Controller" status={data.integrations.kra_etims.status} />
                        <StatusRow label="M-Pesa Daraja Gateway" status={data.integrations.mpesa_c2b.status} />
                        <StatusRow label="SMS Notification Engine" status={data.integrations.sms_gateway.status} />
                    </div>
                    <Link to="/reports" className="mt-6 text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors">
                        View Detailed Analytics <ArrowRight size={16} />
                    </Link>
                </div>

            </div>
        </div>
    );
};

// Reusable UI Components
const StatCard = ({ icon, title, value, color, bg }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm flex items-center gap-4">
        <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center`}>
            {icon}
        </div>
        <div>
            <p className="text-[12px] font-bold text-[#A3AED0] uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-black text-[#1B2559] mt-1">{value}</p>
        </div>
    </div>
);

const QuickActionButton = ({ to, icon, label, color }) => (
    <Link to={to} className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-200 ${color}`}>
        <div className="mb-3">{icon}</div>
        <span className="text-sm font-bold">{label}</span>
    </Link>
);

const StatusRow = ({ label, status }) => (
    <div className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50">
        <span className="font-bold text-[#1B2559] text-sm">{label}</span>
        <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${
            status === 'Online' || status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
        }`}>
            {status}
        </span>
    </div>
);

export default Dashboard;