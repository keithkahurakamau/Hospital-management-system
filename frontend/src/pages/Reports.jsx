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

    if (loading) return <div className="text-[#A3AED0] p-8 font-medium">Compiling Hospital Analytics...</div>;
    if (!data) return <div className="text-red-500 p-8">Failed to load reporting engine.</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            <header>
                <h2 className="text-2xl font-bold text-[#1B2559]">Advanced Analytics & Finance</h2>
                <p className="text-sm text-[#A3AED0] mt-1">Hospital performance, revenue streams, and API telemetry</p>
            </header>

            {/* Top KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard icon={<TrendingUp />} title="Monthly Revenue (KES)" value={`Sh ${data.kpis.monthly_revenue.toLocaleString()}`} color="text-emerald-600" bg="bg-emerald-100" />
                <KPICard icon={<Users />} title="Total Registered Patients" value={data.kpis.total_patients} color="text-blue-600" bg="bg-blue-100" />
                <KPICard icon={<BedDouble />} title="Ward Occupancy Rate" value={`${data.kpis.occupancy_rate}%`} color="text-indigo-600" bg="bg-indigo-100" />
                <KPICard icon={<Activity />} title="Pending Lab Analyses" value={data.kpis.pending_labs} color="text-orange-600" bg="bg-orange-100" />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue Breakdown (M-Pesa vs Insurance) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
                    <h3 className="text-lg font-bold text-[#1B2559] mb-6">Revenue Streams (6 Months)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.charts.revenue_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A3AED0' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A3AED0' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                <Bar dataKey="M_Pesa" name="M-Pesa (STK/Paybill)" stackId="a" fill="#00B14F" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="Insurance" name="NHIF / Private" stackId="a" fill="#3B82F6" />
                                <Bar dataKey="Cash" name="Cash" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Patient Registration Trend */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-50 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-[#1B2559] mb-2">Patient Acquisition</h3>
                    <p className="text-xs text-[#A3AED0] mb-6">Last 7 Days</p>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.charts.patient_trend} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A3AED0' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A3AED0' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="New Patients" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Local Services & Gateway Telemetry */}
            <h3 className="text-lg font-bold text-[#1B2559] pt-4">API Gateway Telemetry</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <IntegrationCard 
                    icon={<ShieldCheck size={24} />} 
                    title="KRA eTIMS Fiscalization" 
                    status={data.integrations.kra_etims.status}
                    detail={`Unsynced Invoices: ${data.integrations.kra_etims.unsynced_invoices}`}
                    meta={`Last sync: ${data.integrations.kra_etims.last_sync}`}
                    activeColor="text-emerald-600" bg="bg-emerald-50"
                />
                <IntegrationCard 
                    icon={<Smartphone size={24} />} 
                    title="Safaricom Daraja API" 
                    status={data.integrations.mpesa_c2b.status}
                    detail="C2B & STK Push Webhooks Active"
                    meta={`Today's Col.: KES ${data.integrations.mpesa_c2b.today_collections.toLocaleString()}`}
                    activeColor="text-[#00B14F]" bg="bg-[#00B14F]/10"
                />
                <IntegrationCard 
                    icon={<Send size={24} />} 
                    title="SMS Notifications" 
                    status={data.integrations.sms_gateway.status}
                    detail={`Delivery Rate: ${data.integrations.sms_gateway.delivery_rate}`}
                    meta="Provider: Africa's Talking"
                    activeColor="text-blue-600" bg="bg-blue-50"
                />
            </div>
        </div>
    );
};

// Reusable Sub-components
const KPICard = ({ icon, title, value, color, bg }) => (
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

const IntegrationCard = ({ icon, title, status, detail, meta, activeColor, bg }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 ${bg} ${activeColor} rounded-xl flex items-center justify-center`}>
                {icon}
            </div>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${status === 'Online' || status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                {status}
            </span>
        </div>
        <h4 className="font-bold text-[#1B2559] text-lg">{title}</h4>
        <p className="text-sm font-medium text-slate-600 mt-1">{detail}</p>
        <p className="text-xs font-bold text-[#A3AED0] mt-4">{meta}</p>
    </div>
);

export default Reports;