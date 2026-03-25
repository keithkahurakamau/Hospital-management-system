import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { 
    Users, Wallet, Activity, ShieldCheck, 
    Stethoscope, TestTube2, Pill, Banknote, 
    Settings, UserPlus, TrendingUp, ArrowRight, Clock,
    RefreshCw, AlertTriangle
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
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/analytics/admin-summary');
            setStats(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to load admin stats", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000); // 30s for performance
        return () => clearInterval(interval);
    }, []);

    const MetricCard = ({ title, value, prefix, icon: Icon, trend, colorClass, borderClass, bgLight }) => (
        <div className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-xl hover:border-slate-300 transition-all duration-500 hover:-translate-y-1">
            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-700 ${colorClass}`}>
                <Icon size={140} strokeWidth={1} />
            </div>
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={`p-4 rounded-[20px] border ${borderClass} ${bgLight} ${colorClass} shadow-sm`}>
                    <Icon size={24} />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status</span>
                    <span className={`text-[10px] font-black ${colorClass} bg-white px-2.5 py-1 rounded-lg uppercase tracking-widest border ${borderClass} shadow-sm`}>
                        {trend}
                    </span>
                </div>
            </div>
            <div className="relative z-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <div className="flex items-baseline gap-1.5">
                    {prefix && <span className="text-lg font-black text-slate-300">{prefix}</span>}
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                        {isLoading ? <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-lg"></div> : (typeof value === 'number' ? value.toLocaleString() : value)}
                    </h3>
                </div>
            </div>
        </div>
    );

    const DepartmentBar = ({ name, count, total, icon: Icon, colorHex }) => {
        const percentage = total > 0 ? Math.min((count / total) * 100, 100) : 0;
        const isBottleneck = percentage > 40; // Visual warning for high load

        return (
            <div className="group">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-slate-900 transition-colors`}>
                            <Icon size={16} />
                        </div>
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isBottleneck && <AlertTriangle size={14} className="text-amber-500 animate-pulse" />}
                        <span className={`text-xs font-black px-3 py-1 rounded-full border ${isBottleneck ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                            {count} <span className="text-[10px] opacity-60">ACTIVE</span>
                        </span>
                    </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-6 shadow-inner">
                    <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                        style={{ width: `${percentage}%`, backgroundColor: colorHex }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto min-h-[85vh] font-sans flex flex-col gap-8 animate-in fade-in duration-700">
            
            {/* Header Area */}
            <header className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Command Center</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-blue-500"/> System Telemetry Live
                        </p>
                        <span className="text-slate-200">|</span>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12}/> Last Sync: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={fetchDashboardData}
                    className="relative z-10 p-4 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 active:scale-90"
                >
                    <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                </button>
            </header>

            {/* KPI Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Master Patient Index" 
                    value={stats.total_patients} 
                    icon={Users} 
                    trend="Historical" 
                    colorClass="text-blue-600"
                    borderClass="border-blue-100"
                    bgLight="bg-blue-50/50"
                />
                <MetricCard 
                    title="Daily Gross Revenue" 
                    value={stats.today_revenue} 
                    prefix="KES" 
                    icon={Wallet} 
                    trend="Daily" 
                    colorClass="text-emerald-600"
                    borderClass="border-emerald-100"
                    bgLight="bg-emerald-50/50"
                />
                <MetricCard 
                    title="Verified Staff" 
                    value={stats.total_staff} 
                    icon={ShieldCheck} 
                    trend="Active" 
                    colorClass="text-purple-600"
                    borderClass="border-purple-100"
                    bgLight="bg-purple-50/50"
                />
                <MetricCard 
                    title="Current Patient Load" 
                    value={stats.total_waiting} 
                    icon={Activity} 
                    trend="Live" 
                    colorClass="text-amber-600"
                    borderClass="border-amber-100"
                    bgLight="bg-amber-50/50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                
                {/* Live Department Monitor */}
                <div className="lg:col-span-2 bg-white rounded-[48px] border border-slate-200 shadow-sm p-10 flex flex-col">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Flow Distribution</h2>
                            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.25em]">Real-time Departmental Congestion Analysis</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                            Live Metrics
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
                        <DepartmentBar name="Doctor's Consultation" count={stats.queue_breakdown.Consultation} total={stats.total_waiting} icon={Stethoscope} colorHex="#6366f1" />
                        <DepartmentBar name="Laboratory & Diagnostics" count={stats.queue_breakdown.Laboratory} total={stats.total_waiting} icon={TestTube2} colorHex="#a855f7" />
                        <DepartmentBar name="Pharmacy & Dispensary" count={stats.queue_breakdown.Pharmacy} total={stats.total_waiting} icon={Pill} colorHex="#10b981" />
                        <DepartmentBar name="Billing & Discharge" count={stats.queue_breakdown.Billing} total={stats.total_waiting} icon={Banknote} colorHex="#f59e0b" />
                        <DepartmentBar name="Triage & Vitals" count={stats.queue_breakdown.Triage} total={stats.total_waiting} icon={Activity} colorHex="#3b82f6" />
                    </div>
                </div>

                {/* Right Panel: Admin Shortcuts */}
                <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm p-10 flex flex-col">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Management</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Executive Access Control</p>
                    
                    <div className="space-y-4 flex-1">
                        <Link to="/patients" className="group flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:border-blue-400 hover:bg-white transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><UserPlus size={20}/></div>
                                <span className="font-black text-slate-700 text-sm uppercase tracking-tight">Patient Registry</span>
                            </div>
                            <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </Link>

                        <Link to="/users" className="group flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:border-purple-400 hover:bg-white transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white text-purple-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><ShieldCheck size={20}/></div>
                                <span className="font-black text-slate-700 text-sm uppercase tracking-tight">User Access Control</span>
                            </div>
                            <ArrowRight size={18} className="text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                        </Link>

                        <Link to="/billing" className="group flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:border-emerald-400 hover:bg-white transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white text-emerald-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><TrendingUp size={20}/></div>
                                <span className="font-black text-slate-700 text-sm uppercase tracking-tight">Financial Audit</span>
                            </div>
                            <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </Link>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <button className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                            <Settings size={20}/> System Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;