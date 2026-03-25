import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { 
    Users, Wallet, Activity, ShieldCheck, 
    Stethoscope, TestTube2, Pill, Banknote, 
    Settings, UserPlus, TrendingUp, ArrowRight, Clock
} from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_patients: 0,
        total_staff: 0,
        today_revenue: 0,
        total_waiting: 0,
        queue_breakdown: { "Triage": 0, "Consultation": 0, "Laboratory": 0, "Pharmacy": 0, "Billing": 0 }
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/analytics/admin-summary');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to load admin stats", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
        // Live polling every 10 seconds to monitor hospital load
        const interval = setInterval(fetchDashboardData, 10000);
        return () => clearInterval(interval);
    }, []);

    // Reusable KPI Card component
    const MetricCard = ({ title, value, prefix, icon: Icon, trend, colorClass, borderClass }) => (
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform duration-500 ${colorClass}`}>
                <Icon size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl border ${borderClass} ${colorClass} bg-opacity-10`}>
                    <Icon size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-widest border border-slate-200">
                    {trend}
                </span>
            </div>
            <div className="relative z-10">
                <p className="text-sm font-bold text-slate-400 mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    {prefix && <span className="text-sm font-bold text-slate-400">{prefix}</span>}
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                        {isLoading ? '...' : (typeof value === 'number' ? value.toLocaleString() : value)}
                    </h3>
                </div>
            </div>
        </div>
    );

    // Reusable Queue Progress Bar component
    const DepartmentBar = ({ name, count, total, icon: Icon, bgClass }) => {
        const percentage = total > 0 ? Math.min((count / total) * 100, 100) : 0;
        return (
            <div className="mb-5 last:mb-0">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <Icon size={16} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        {count} Waiting
                    </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-2 rounded-full transition-all duration-700 ${bgClass}`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-[1400px] mx-auto min-h-[85vh] font-sans flex flex-col gap-6 animate-in fade-in duration-500">
            
            {/* Header Area */}
            <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Hospital Command Center</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Operational logistics and financial telemetry</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200/50 shadow-sm shadow-emerald-100/50">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Core Engine Live</span>
                </div>
            </header>

            {/* KPI Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Master Patient Index" 
                    value={stats.total_patients} 
                    icon={Users} 
                    trend="All Time" 
                    colorClass="text-blue-600"
                    borderClass="border-blue-100 bg-blue-50"
                />
                <MetricCard 
                    title="Gross Daily Revenue" 
                    value={stats.today_revenue} 
                    prefix="KES" 
                    icon={Wallet} 
                    trend="Today" 
                    colorClass="text-emerald-600"
                    borderClass="border-emerald-100 bg-emerald-50"
                />
                <MetricCard 
                    title="Active Staff Online" 
                    value={stats.total_staff} 
                    icon={ShieldCheck} 
                    trend="Verified" 
                    colorClass="text-purple-600"
                    borderClass="border-purple-100 bg-purple-50"
                />
                <MetricCard 
                    title="Total Queue Volume" 
                    value={stats.total_waiting} 
                    icon={Activity} 
                    trend="Live Load" 
                    colorClass="text-amber-600"
                    borderClass="border-amber-100 bg-amber-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                
                {/* Live Department Load Monitor */}
                <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Live Department Bottlenecks</h2>
                            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Identifies points of friction in clinical flow</p>
                        </div>
                        <div className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                            <Clock size={20} />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-2">
                        <DepartmentBar name="Doctor's Consultation" count={stats.queue_breakdown.Consultation} total={stats.total_waiting} icon={Stethoscope} bgClass="bg-indigo-500" />
                        <DepartmentBar name="Laboratory & Imaging" count={stats.queue_breakdown.Laboratory} total={stats.total_waiting} icon={TestTube2} bgClass="bg-purple-500" />
                        <DepartmentBar name="Pharmacy & Dispensary" count={stats.queue_breakdown.Pharmacy} total={stats.total_waiting} icon={Pill} bgClass="bg-emerald-500" />
                        <DepartmentBar name="Billing & Discharge" count={stats.queue_breakdown.Billing} total={stats.total_waiting} icon={Banknote} bgClass="bg-amber-500" />
                        <DepartmentBar name="Triage & Vitals" count={stats.queue_breakdown.Triage} total={stats.total_waiting} icon={Activity} bgClass="bg-blue-500" />
                    </div>
                </div>

                {/* Right Panel: Quick Actions */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 flex flex-col">
                    <h2 className="text-xl font-black text-slate-800 mb-2 border-b border-slate-100 pb-5">Managerial Actions</h2>
                    
                    <div className="mt-5 space-y-3 flex-1">
                        <Link to="/patients" className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><UserPlus size={18}/></div>
                                <span className="font-bold text-slate-700 text-sm">Register New Patient</span>
                            </div>
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600" />
                        </Link>

                        <Link to="/users" className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><ShieldCheck size={18}/></div>
                                <span className="font-bold text-slate-700 text-sm">Manage Staff Access</span>
                            </div>
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600" />
                        </Link>

                        <Link to="/billing" className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18}/></div>
                                <span className="font-bold text-slate-700 text-sm">Review Financial Audit</span>
                            </div>
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600" />
                        </Link>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <button className="w-full py-4 bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <Settings size={18}/> Global System Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;