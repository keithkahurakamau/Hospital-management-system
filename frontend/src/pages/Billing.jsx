import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
    Wallet, TrendingUp, Receipt, Activity, 
    Download, Calendar, CreditCard, User, Pill
} from 'lucide-react';

const Billing = () => {
    const [overview, setOverview] = useState({
        today_revenue: 0,
        monthly_revenue: 0,
        transactions_today: 0,
        average_order_value: 0
    });
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFinancialData = async () => {
            try {
                const [overviewRes, txRes] = await Promise.all([
                    api.get('/billing/overview'),
                    api.get('/billing/transactions')
                ]);
                setOverview(overviewRes.data);
                setTransactions(txRes.data);
            } catch (err) {
                console.error("Failed to fetch billing data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFinancialData();
    }, []);

    const MetricCard = ({ title, value, prefix, icon: Icon, trend }) => (
        <div className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-6 -top-6 text-slate-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
                <Icon size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100">
                    <Icon size={24} />
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-widest border border-emerald-100/50 flex items-center gap-1">
                    <TrendingUp size={12}/> {trend}
                </span>
            </div>
            <div className="relative z-10">
                <p className="text-sm font-bold text-slate-400 mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    {prefix && <span className="text-sm font-bold text-slate-400">{prefix}</span>}
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                        {typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value}
                    </h3>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto min-h-[85vh] font-sans flex flex-col gap-6">
            
            {/* Header */}
            <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financial Overview</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Revenue analytics and transaction ledger</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="py-3.5 px-6 bg-slate-800 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-lg shadow-slate-800/20 active:scale-95"
                >
                    <Download size={18} /> Export Report
                </button>
            </header>

            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Today's Revenue" value={overview.today_revenue} prefix="KES" icon={Wallet} trend="Live" />
                <MetricCard title="Monthly Revenue" value={overview.monthly_revenue} prefix="KES" icon={TrendingUp} trend="+12%" />
                <MetricCard title="Daily Transactions" value={overview.transactions_today} icon={Receipt} trend="Active" />
                <MetricCard title="Average Order Value" value={overview.average_order_value} prefix="KES" icon={Activity} trend="Stable" />
            </div>

            {/* Transaction Ledger Table */}
            <div className="flex-1 bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Calendar size={20} className="text-slate-500"/> Recent Transactions
                    </h2>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="p-5 pl-8">Transaction ID</th>
                                <th className="p-5">Date & Time</th>
                                <th className="p-5">Client Profile</th>
                                <th className="p-5">Dispensed Item</th>
                                <th className="p-5">Method</th>
                                <th className="p-5 text-right pr-8">Amount (KES)</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">
                                        <div className="flex justify-center items-center gap-2">
                                            <Activity className="animate-pulse text-slate-400" size={20} /> Loading ledger data...
                                        </div>
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">No transactions recorded yet.</td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.transaction_id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group cursor-default">
                                        <td className="p-4 pl-8 font-mono text-xs font-bold text-slate-500">{tx.transaction_id}</td>
                                        <td className="p-4 text-slate-600 text-xs">
                                            {new Date(tx.date).toLocaleDateString()} <span className="text-slate-400 ml-1">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${tx.patient === 'Walk-in Client' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                    <User size={14}/>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-xs">{tx.patient}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">By: {tx.cashier.split(' ')[0]}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-100 rounded-md text-slate-400">
                                                    <Pill size={12} />
                                                </div>
                                                <span className="font-bold text-slate-700 text-xs">{tx.quantity}x {tx.drug_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-md uppercase tracking-widest flex items-center gap-1.5 w-max ${tx.method.includes('M-PESA') ? 'bg-[#10A37F]/10 text-[#10A37F] border border-[#10A37F]/20' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                {tx.method.includes('M-PESA') ? <Smartphone size={10}/> : <CreditCard size={10}/>} {tx.method}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-8 text-right font-black text-slate-800">
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
    );
};

export default Billing;