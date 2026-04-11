import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { 
    Users, Wallet, Activity, ShieldCheck, 
    Stethoscope, TestTube2, Pill, Banknote, 
    Settings, UserPlus, TrendingUp, ArrowRight, 
    Clock, BedDouble, Receipt
} from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_patients: 0,
        total_staff: 0,
        today_revenue: 0,
        total_waiting: 0,
        queue_breakdown: { "Triage": 0, "Consultation": 0, "Laboratory": 0, "Pharmacy": 0, "Billing": 0 }
    });
    const [recentTx, setRecentTx] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, txRes] = await Promise.all([
                    api.get('/analytics/admin-summary'),
                    api.get('/billing/transactions')
                ]);
                
                setStats(statsRes.data);
                setRecentTx(txRes.data.slice(0, 5));
            } catch (err) {
                console.error("Failed to load admin stats", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 10000);
        return () => clearInterval(interval);
    }, []);

    // Reusable KPI Card component (Responsive)
    const MetricCard = ({ title, value, prefix, icon: Icon, trend, colorClass, borderClass }) => (
        <div className="bg-white p-5 lg:p-6 rounded-[20px] lg:rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute -right-4 lg:-right-6 -top-4 lg:-top-6 opacity-10 group-hover:scale-110 transition-transform duration-500 ${colorClass}`}>
                <Icon size={100} className="lg:w-[120px] lg:h-[120px]" strokeWidth={1} />
            </div>
            <div className="relative z-10 flex justify-between items-start mb-3 lg:mb-4">
                <div className={`p-2.5 lg:p-3 rounded-xl lg:rounded-2xl border ${borderClass} ${colorClass} bg-opacity-10`}>
                    <Icon size={20} className="lg:w-6 lg:h-6" />
                </div>
                <span className="text-[9px] lg:text-[10px] font-black text-slate-500 bg-slate-100 px-2 lg:px-2.5 py-1 rounded-md uppercase tracking-widest border border-slate-200">
                    {trend}
                </span>
            </div>
            <div className="relative z-10">
                <p className="text-xs lg:text-sm font-bold text-slate-400 mb-0.5 lg:mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    {prefix && <span className="text-xs lg:text-sm font-bold text-slate-400">{prefix}</span>}
                    <h3 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
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
            <div className="mb-4 lg:mb-5 last:mb-0">
                <div className="flex justify-between items-center mb-1.5 lg:mb-2">
                    <div className="flex items-center gap-1.5 lg:gap-2">
                        <Icon size={14} className="lg:w-4 lg:h-4 text-slate-400" />
                        <span className="text-xs lg:text-sm font-bold text-slate-700">{name}</span>
                    </div>
                    <span className="text-[10px] lg:text-xs font-black text-slate-800 bg-slate-100 px-1.5 lg:px-2 py-0.5 rounded-md">
                        {count} Waiting
                    </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 lg:h-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${bgClass}`} style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-[1400px] w-full mx-auto min-h-[85vh] font-sans flex flex-col gap-4 lg:gap-6 animate-in fade-in duration-500">
            
            {/* Header Area (Stacks on mobile) */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0 bg-white p-5 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">Hospital Command Center</h1>
                    <p className="text-slate-500 font-medium text-xs lg:text-sm mt-1">Operational logistics and financial telemetry</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 lg:px-4 py-2 rounded-xl border border-emerald-200/50 shadow-sm shadow-emerald-100/50 w-fit">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Core Engine Live</span>
                </div>
            </header>

            {/* KPI Metrics Row (1 col mobile, 2 col tablet, 4 col desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                <MetricCard title="Master Patient Index" value={stats.total_patients} icon={Users} trend="All Time" colorClass="text-blue-600" borderClass="border-blue-100 bg-blue-50" />
                <MetricCard title="Gross Daily Revenue" value={stats.today_revenue} prefix="KES" icon={Wallet} trend="Today" colorClass="text-emerald-600" borderClass="border-emerald-100 bg-emerald-50" />
                <MetricCard title="Active Staff Online" value={stats.total_staff} icon={ShieldCheck} trend="Verified" colorClass="text-purple-600" borderClass="border-purple-100 bg-purple-50" />
                <MetricCard title="Total Queue Volume" value={stats.total_waiting} icon={Activity} trend="Live Load" colorClass="text-amber-600" borderClass="border-amber-100 bg-amber-50" />
            </div>

            {/* Main Content Grid (Stacks on mobile/tablet) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1">
                
                {/* Live Department Load Monitor */}
                <div className="lg:col-span-2 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm p-5 lg:p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-5 lg:mb-8 border-b border-slate-100 pb-4 lg:pb-5">
                        <div>
                            <h2 className="text-lg lg:text-xl font-black text-slate-800">Live Department Bottlenecks</h2>
                            <p className="text-[9px] lg:text-[10px] font-black text-slate-400 mt-0.5 lg:mt-1 uppercase tracking-widest">Identifies points of friction in clinical flow</p>
                        </div>
                        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg lg:rounded-xl">
                            <Clock size={18} className="lg:w-5 lg:h-5"/>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-1 lg:space-y-2">
                        <DepartmentBar name="Doctor's Consultation" count={stats.queue_breakdown.Consultation} total={stats.total_waiting} icon={Stethoscope} bgClass="bg-indigo-500" />
                        <DepartmentBar name="Laboratory & Imaging" count={stats.queue_breakdown.Laboratory} total={stats.total_waiting} icon={TestTube2} bgClass="bg-purple-500" />
                        <DepartmentBar name="Pharmacy & Dispensary" count={stats.queue_breakdown.Pharmacy} total={stats.total_waiting} icon={Pill} bgClass="bg-emerald-500" />
                        <DepartmentBar name="Billing & Discharge" count={stats.queue_breakdown.Billing} total={stats.total_waiting} icon={Banknote} bgClass="bg-amber-500" />
                        <DepartmentBar name="Triage & Vitals" count={stats.queue_breakdown.Triage} total={stats.total_waiting} icon={Activity} bgClass="bg-blue-500" />
                    </div>
                </div>

                {/* Right Panel: Quick Actions */}
                <div className="bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm p-5 lg:p-8 flex flex-col">
                    <h2 className="text-lg lg:text-xl font-black text-slate-800 mb-2 border-b border-slate-100 pb-4 lg:pb-5">Managerial Actions</h2>
                    
                    <div className="mt-4 lg:mt-5 space-y-2.5 lg:space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        <Link to="/patients" className="w-full flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg lg:rounded-xl"><UserPlus size={16} className="lg:w-[18px] lg:h-[18px]"/></div>
                                <span className="font-bold text-slate-700 text-xs lg:text-sm">Register New Patient</span>
                            </div>
                            <ArrowRight size={14} className="lg:w-4 lg:h-4 text-slate-300 group-hover:text-slate-600" />
                        </Link>

                        <Link to="/users" className="w-full flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg lg:rounded-xl"><ShieldCheck size={16} className="lg:w-[18px] lg:h-[18px]"/></div>
                                <span className="font-bold text-slate-700 text-xs lg:text-sm">Manage Staff Access</span>
                            </div>
                            <ArrowRight size={14} className="lg:w-4 lg:h-4 text-slate-300 group-hover:text-slate-600" />
                        </Link>

                        <Link to="/billing" className="w-full flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg lg:rounded-xl"><TrendingUp size={16} className="lg:w-[18px] lg:h-[18px]"/></div>
                                <span className="font-bold text-slate-700 text-xs lg:text-sm">Review Financial Audit</span>
                            </div>
                            <ArrowRight size={14} className="lg:w-4 lg:h-4 text-slate-300 group-hover:text-slate-600" />
                        </Link>

                        <Link to="/beds" className="w-full flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg lg:rounded-xl"><BedDouble size={16} className="lg:w-[18px] lg:h-[18px]"/></div>
                                <span className="font-bold text-slate-700 text-xs lg:text-sm">Manage Ward Beds</span>
                            </div>
                            <ArrowRight size={14} className="lg:w-4 lg:h-4 text-slate-300 group-hover:text-slate-600" />
                        </Link>
                    </div>

                    <div className="mt-5 lg:mt-6 pt-5 lg:pt-6 border-t border-slate-100">
                        <button className="w-full py-3 lg:py-4 bg-slate-800 text-white font-black text-[10px] lg:text-xs uppercase tracking-widest rounded-xl lg:rounded-2xl shadow-lg hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <Settings size={16} className="lg:w-[18px] lg:h-[18px]"/> Global System Settings
                        </button>
                    </div>
                </div>

                {/* BOTTOM WIDGET: LIVE FINANCIAL LEDGER */}
                <div className="lg:col-span-3 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm p-5 lg:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-5 lg:mb-6 border-b border-slate-100 pb-4 lg:pb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg lg:rounded-xl"><Receipt size={18} className="lg:w-5 lg:h-5"/></div>
                            <div>
                                <h2 className="text-lg lg:text-xl font-black text-slate-800">Live Financial Ledger</h2>
                                <p className="text-[9px] lg:text-[10px] font-black text-slate-400 mt-0.5 lg:mt-1 uppercase tracking-widest">Most Recent Settled Invoices</p>
                            </div>
                        </div>
                        <Link to="/billing" className="w-full sm:w-auto text-center text-[10px] lg:text-xs font-bold text-emerald-600 hover:text-emerald-700 px-4 py-2 bg-emerald-50 rounded-lg transition-colors">
                            View Full Audit →
                        </Link>
                    </div>

                    {/* Table Wrapper for Horizontal Scrolling on Mobile */}
                    <div className="overflow-x-auto w-full custom-scrollbar">
                        <table className="w-full min-w-[600px] text-left border-collapse">
                            <thead>
                                <tr className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="pb-3 lg:pb-4 pl-2 lg:pl-4">Invoice ID</th>
                                    <th className="pb-3 lg:pb-4">Time Settled</th>
                                    <th className="pb-3 lg:pb-4">Client Profile</th>
                                    <th className="pb-3 lg:pb-4">Payment Method</th>
                                    <th className="pb-3 lg:pb-4 text-right pr-2 lg:pr-4">Total (KES)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="py-6 text-center text-slate-400 text-xs font-bold">Loading...</td>
                                    </tr>
                                ) : recentTx.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-6 text-center text-slate-400 text-xs font-bold">No recent transactions.</td>
                                    </tr>
                                ) : (
                                    recentTx.map((tx, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3 lg:py-4 pl-2 lg:pl-4 text-[10px] lg:text-xs font-bold text-slate-500 font-mono">{tx.transaction_id}</td>
                                            <td className="py-3 lg:py-4 text-[10px] lg:text-xs font-bold text-slate-400">
                                                {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </td>
                                            <td className="py-3 lg:py-4 text-[10px] lg:text-xs font-black text-slate-800 uppercase">{tx.patient}</td>
                                            <td className="py-3 lg:py-4">
                                                <span className={`text-[8px] lg:text-[9px] font-black px-2 lg:px-2.5 py-1 rounded bg-slate-100 text-slate-600 uppercase tracking-widest ${(tx.method || 'CASH').includes('M-PESA') ? 'bg-[#10A37F]/10 text-[#10A37F]' : ''}`}>
                                                    {tx.method || 'CASH'}
                                                </span>
                                            </td>
                                            <td className="py-3 lg:py-4 pr-2 lg:pr-4 text-xs lg:text-sm font-black text-slate-800 text-right">
                                                {tx.total_cost.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;