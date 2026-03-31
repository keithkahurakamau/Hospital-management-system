import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area 
} from 'recharts';
import { TrendingUp, Users, BedDouble, Activity, ShieldCheck, Smartphone, Send } from 'lucide-react';

const Reports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/dashboard')
            .then(res => setData(res.data))
            .catch(err => console.error("Failed to load analytics", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-[#A3AED0] p-8 font-medium text-center mt-20">Compiling Hospital Analytics...</div>;
    if (!data) return <div className="text-red-500 p-8 text-center mt-20">Failed to load reporting engine.</div>;

    return (
        <div className="max-w-[1400px] w-full mx-auto space-y-6 lg:space-y-8 pb-12 font-sans animate-in fade-in duration-500">
            <header className="bg-white p-5 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm shrink-0">
                <h2 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 lg:gap-3">
                    <TrendingUp className="text-emerald-500 lg:w-8 lg:h-8" size={24}/> Advanced Analytics
                </h2>
                <p className="text-slate-500 font-medium text-xs lg:text-sm mt-1 lg:mt-2">Hospital performance, revenue streams, and API telemetry</p>
            </header>

            {/* Top KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                <KPICard icon={<TrendingUp />} title="Monthly Revenue (KES)" value={`Sh ${data.kpis.monthly_revenue.toLocaleString()}`} color="text-emerald-600" bg="bg-emerald-100" />
                <KPICard icon={<Users />} title="Total Registered Patients" value={data.kpis.total_patients} color="text-blue-600" bg="bg-blue-100" />
                <KPICard icon={<BedDouble />} title="Ward Occupancy Rate" value={`${data.kpis.occupancy_rate}%`} color="text-indigo-600" bg="bg-indigo-100" />
                <KPICard icon={<Activity />} title="Pending Lab Analyses" value={data.kpis.pending_labs} color="text-orange-600" bg="bg-orange-100" />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
                
                {/* Revenue Breakdown (M-Pesa vs Insurance) */}
                <div className="xl:col-span-2 bg-white p-5 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm">
                    <h3 className="text-lg lg:text-xl font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">Revenue Streams (6 Months)</h3>
                    <div className="h-[300px] lg:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.charts.revenue_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 700, fontSize: '12px' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                                <Bar dataKey="M_Pesa" name="M-Pesa (STK/Paybill)" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="Insurance" name="NHIF / Private" stackId="a" fill="#3B82F6" />
                                <Bar dataKey="Cash" name="Cash" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Patient Registration Trend */}
                <div className="xl:col-span-1 bg-white p-5 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg lg:text-xl font-black text-slate-800 mb-1">Patient Acquisition</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Last 7 Days</p>
                    <div className="flex-1 min-h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.charts.patient_trend} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 700, fontSize: '12px' }} />
                                <Area type="monotone" dataKey="New Patients" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Local Services & Gateway Telemetry */}
            <h3 className="text-xl font-black text-slate-800 pt-6 px-2">API Gateway Telemetry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                <IntegrationCard 
                    icon={<ShieldCheck size={24} />} 
                    title="KRA eTIMS Fiscalization" 
                    status={data.integrations.kra_etims.status}
                    detail={`Unsynced Invoices: ${data.integrations.kra_etims.unsynced_invoices}`}
                    meta={`Last sync: ${data.integrations.kra_etims.last_sync}`}
                    activeColor="text-emerald-600" bg="bg-emerald-50" border="border-emerald-200"
                />
                <IntegrationCard 
                    icon={<Smartphone size={24} />} 
                    title="Safaricom Daraja API" 
                    status={data.integrations.mpesa_c2b.status}
                    detail="C2B & STK Push Webhooks Active"
                    meta={`Today's Col.: KES ${data.integrations.mpesa_c2b.today_collections.toLocaleString()}`}
                    activeColor="text-[#10A37F]" bg="bg-[#10A37F]/10" border="border-[#10A37F]/20"
                />
                <IntegrationCard 
                    icon={<Send size={24} />} 
                    title="SMS Notifications" 
                    status={data.integrations.sms_gateway.status}
                    detail={`Delivery Rate: ${data.integrations.sms_gateway.delivery_rate}`}
                    meta="Provider: Africa's Talking"
                    activeColor="text-blue-600" bg="bg-blue-50" border="border-blue-200"
                />
            </div>
        </div>
    );
};

// Reusable Sub-components
const KPICard = ({ icon, title, value, color, bg }) => (
    <div className="bg-white p-5 lg:p-6 rounded-[20px] lg:rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
        <div className={`w-12 h-12 lg:w-14 lg:h-14 ${bg} ${color} rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0`}>
            {React.cloneElement(icon, { className: "w-5 h-5 lg:w-6 lg:h-6" })}
        </div>
        <div className="min-w-0">
            <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{title}</p>
            <p className="text-xl lg:text-2xl font-black text-slate-800 mt-0.5 lg:mt-1 truncate">{value}</p>
        </div>
    </div>
);

const IntegrationCard = ({ icon, title, status, detail, meta, activeColor, bg, border }) => (
    <div className="bg-white p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-5 lg:mb-6">
            <div className={`w-12 h-12 lg:w-14 lg:h-14 ${bg} ${activeColor} border ${border} rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0`}>
                {React.cloneElement(icon, { className: "w-6 h-6 lg:w-7 lg:h-7" })}
            </div>
            <span className={`px-2.5 lg:px-3 py-1 text-[9px] lg:text-[10px] uppercase tracking-widest font-black rounded-md border ${status === 'Online' || status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                {status}
            </span>
        </div>
        <h4 className="font-black text-slate-800 text-lg lg:text-xl leading-tight">{title}</h4>
        <p className="text-xs lg:text-sm font-bold text-slate-500 mt-1 lg:mt-2">{detail}</p>
        <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{meta}</p>
        </div>
    </div>
);

export default Reports;