import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
    Wallet, TrendingUp, Receipt, Activity, Download, Calendar, 
    CreditCard, User, Banknote, Smartphone, CheckCircle2, 
    XCircle, Loader2, ArrowRight, FileText, Printer, Calculator
} from 'lucide-react';

const Billing = () => {
    // --- GLOBAL STATE ---
    const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'ledger'
    const [isLoading, setIsLoading] = useState(true);

    // --- LEDGER STATE ---
    const [overview, setOverview] = useState({
        today_revenue: 0, monthly_revenue: 0, transactions_today: 0, average_order_value: 0
    });
    const [transactions, setTransactions] = useState([]);

    // --- CASHIER POS STATE ---
    const [pendingInvoices, setPendingInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentState, setPaymentState] = useState('idle'); 
    const [receiptData, setReceiptData] = useState(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Auto-refresh queue
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [overviewRes, txRes, pendingRes] = await Promise.all([
                api.get('/billing/overview'),
                api.get('/billing/transactions'),
                api.get('/billing/pending')
            ]);
            setOverview(overviewRes.data);
            setTransactions(txRes.data);
            setPendingInvoices(pendingRes.data);
        } catch (err) {
            console.error("Failed to fetch billing data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessPayment = async () => {
        if (!selectedInvoice) return alert("Select an invoice first.");
        setPaymentState('processing');

        try {
            if (paymentMethod === 'M-PESA') await new Promise(resolve => setTimeout(resolve, 3000));
            
            await api.post(`/billing/${selectedInvoice.invoice_id}/pay`, { payment_method: paymentMethod });
            
            setReceiptData({
                transactionId: `INV-${selectedInvoice.invoice_id.toString().padStart(6, '0')}`,
                date: new Date().toLocaleString(),
                method: paymentMethod,
                items: selectedInvoice.items,
                total: selectedInvoice.total_amount,
                patientName: selectedInvoice.patient_name
            });
            
            setPaymentState('success');
            fetchData(); // Refresh queue and ledger
        } catch (err) {
            setPaymentState('failed');
        }
    };

    const resetTransaction = () => {
        setSelectedInvoice(null);
        setPaymentState('idle');
        setReceiptData(null);
    };

    // Reusable Responsive Metric Card
    const MetricCard = ({ title, value, prefix, icon: Icon, trend }) => (
        <div className="bg-white p-5 lg:p-6 rounded-[20px] lg:rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-6 -top-6 text-slate-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
                <Icon size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10 flex justify-between items-start mb-3 lg:mb-4">
                <div className="p-2.5 lg:p-3 bg-slate-50 text-slate-600 rounded-xl lg:rounded-2xl border border-slate-100"><Icon size={20} className="lg:w-6 lg:h-6" /></div>
                <span className="text-[9px] lg:text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 lg:px-2.5 py-1 rounded-md uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                    <TrendingUp size={12}/> {trend}
                </span>
            </div>
            <div className="relative z-10">
                <p className="text-xs lg:text-sm font-bold text-slate-400 mb-0.5 lg:mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    {prefix && <span className="text-xs lg:text-sm font-bold text-slate-400">{prefix}</span>}
                    <h3 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
                        {typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value}
                    </h3>
                </div>
            </div>
        </div>
    );

    if (isLoading) return <div className="flex h-[85vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>;

    return (
        <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] font-sans flex flex-col gap-4 lg:gap-6 animate-in fade-in duration-500">
            
            {/* TOP HEADER & TABS (Stacks on mobile) */}
            <div className="bg-slate-900 rounded-[24px] lg:rounded-[32px] border border-slate-800 shadow-xl overflow-hidden shrink-0 flex flex-col md:flex-row md:items-center justify-between p-5 lg:p-6 gap-4 md:gap-0">
                <div className="flex items-center gap-3 lg:gap-4">
                    <div className="p-2 lg:p-3 bg-emerald-500/20 rounded-xl lg:rounded-2xl"><Calculator size={20} className="lg:w-6 lg:h-6 text-emerald-400"/></div>
                    <div>
                        <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">Billing & Cashier</h1>
                        <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 lg:mt-1">Financial Processing & Ledger</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-6">
                    <div className="flex bg-white/10 rounded-xl lg:rounded-2xl p-1 border border-white/5">
                        <button onClick={() => setActiveTab('pos')} className={`flex-1 sm:flex-none px-4 lg:px-6 py-2 text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-lg lg:rounded-xl transition-all ${activeTab === 'pos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}>Cashier Desk</button>
                        <button onClick={() => setActiveTab('ledger')} className={`flex-1 sm:flex-none px-4 lg:px-6 py-2 text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-lg lg:rounded-xl transition-all ${activeTab === 'ledger' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}>Financial Ledger</button>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-start gap-2 lg:gap-3 bg-white/10 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2">
                            <Receipt size={16} className={`lg:w-[18px] lg:h-[18px] ${pendingInvoices.length > 0 ? "text-amber-400" : "text-slate-400"}`}/>
                            <span className="text-xs lg:text-sm font-black text-white">Pending Invoices:</span>
                        </div>
                        <span className={`text-xs lg:text-sm font-black px-2 lg:px-3 py-0.5 lg:py-1 rounded-lg lg:rounded-xl ${pendingInvoices.length > 0 ? "bg-amber-500 text-slate-900 animate-pulse" : "bg-white/20 text-white"}`}>
                            {pendingInvoices.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* TAB 1: CASHIER DESK (POS) */}
            {activeTab === 'pos' && (
                <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:overflow-hidden h-auto lg:h-0">
                    
                    {/* LEFT PANE: Pending Invoices */}
                    <div className="w-full lg:w-1/3 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0 min-h-[300px]">
                        <div className="p-5 lg:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 flex items-center gap-2"><FileText size={16} className="lg:w-[18px] lg:h-[18px] text-amber-500"/> Unpaid Invoices</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 custom-scrollbar">
                            {pendingInvoices.length === 0 ? (
                                <div className="text-center mt-10 text-slate-400 text-sm font-bold">No pending invoices.</div>
                            ) : (
                                pendingInvoices.map((inv) => (
                                    <div key={inv.invoice_id} onClick={() => setSelectedInvoice(inv)}
                                        className={`p-4 lg:p-5 rounded-[20px] lg:rounded-2xl border transition-all cursor-pointer ${selectedInvoice?.invoice_id === inv.invoice_id ? 'bg-emerald-50 border-emerald-400 shadow-md' : 'bg-white border-slate-200 hover:border-emerald-200'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2 lg:mb-3">
                                            <div>
                                                <p className="font-black text-xs lg:text-sm text-slate-800 uppercase tracking-tight">{inv.patient_name}</p>
                                                <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 mt-0.5">OP: {inv.outpatient_no}</p>
                                            </div>
                                            <span className="text-[9px] lg:text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded border border-amber-100 uppercase tracking-widest">INV-{inv.invoice_id}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-t border-slate-100/50 pt-2 lg:pt-3">
                                            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400">{inv.items.length} Line Items</p>
                                            <p className="font-black text-emerald-700 text-sm lg:text-base"><span className="text-[9px] lg:text-[10px] text-emerald-600/50 mr-1">KES</span>{inv.total_amount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANE: Invoice Details & Checkout */}
                    <div className="flex-1 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative min-h-[500px]">
                        {!selectedInvoice ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-16 lg:py-0">
                                <Receipt size={40} strokeWidth={1} className="mb-3 lg:mb-4 lg:w-12 lg:h-12" />
                                <p className="text-xs lg:text-sm font-bold">No Invoice Selected</p>
                                <p className="text-[10px] lg:text-[11px] mt-1 text-slate-400">Select a pending invoice from the queue to process payment.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-5 lg:p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl lg:text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedInvoice.patient_name}</h2>
                                        <p className="text-[10px] lg:text-xs font-bold text-slate-400 mt-0.5 lg:mt-1">Invoice ID: INV-{selectedInvoice.invoice_id.toString().padStart(6, '0')}</p>
                                    </div>
                                </div>
                                
                                {/* Line Items */}
                                <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50/50 custom-scrollbar">
                                    <div className="bg-white rounded-[20px] lg:rounded-[24px] border border-slate-200 p-1.5 lg:p-2 shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <tr>
                                                    <th className="p-3 lg:p-4 rounded-tl-xl">Item Description</th>
                                                    <th className="p-3 lg:p-4 text-right rounded-tr-xl">Amount (KES)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedInvoice.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-3 lg:p-4 text-xs lg:text-sm font-bold text-slate-700">{item.description}</td>
                                                        <td className="p-3 lg:p-4 text-xs lg:text-sm font-black text-slate-800 text-right">{item.amount.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Checkout Panel */}
                                <div className="p-5 lg:p-8 bg-white border-t border-slate-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                                    <div className="flex justify-between items-end mb-5 lg:mb-6">
                                        <span className="text-[9px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount Due</span>
                                        <div className="flex items-baseline gap-1"><span className="text-xs lg:text-sm font-black text-emerald-600/50">KES</span><span className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">{selectedInvoice.total_amount.toFixed(2)}</span></div>
                                    </div>
                                    
                                    <div className="flex gap-3 lg:gap-4 mb-5 lg:mb-6">
                                        <button onClick={() => setPaymentMethod('Cash')} className={`flex-1 py-3 lg:py-4 rounded-xl font-black text-[10px] lg:text-xs border flex items-center justify-center gap-1.5 lg:gap-2 transition-all ${paymentMethod === 'Cash' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><Banknote size={16} className="lg:w-[18px] lg:h-[18px]" /> CASH</button>
                                        <button onClick={() => setPaymentMethod('M-PESA')} className={`flex-1 py-3 lg:py-4 rounded-xl font-black text-[10px] lg:text-xs border flex items-center justify-center gap-1.5 lg:gap-2 transition-all ${paymentMethod === 'M-PESA' ? 'bg-[#10A37F] text-white border-[#10A37F] shadow-md shadow-[#10A37F]/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><Smartphone size={16} className="lg:w-[18px] lg:h-[18px]" /> M-PESA</button>
                                    </div>
                                    
                                    <button onClick={handleProcessPayment} className="w-full py-4 lg:py-5 bg-emerald-600 text-white font-black text-[10px] lg:text-sm uppercase tracking-widest rounded-xl lg:rounded-2xl shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                        {paymentMethod === 'M-PESA' ? 'Send M-PESA Prompt' : 'Receive Cash & Close Invoice'} <ArrowRight size={16} className="lg:w-[18px] lg:h-[18px]"/>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: FINANCIAL LEDGER (Original View) */}
            {activeTab === 'ledger' && (
                <div className="flex flex-col gap-4 lg:gap-6 animate-in fade-in duration-300">
                    <div className="flex justify-end">
                        <button onClick={() => window.print()} className="w-full sm:w-auto py-3 lg:py-3.5 px-6 bg-slate-800 text-white font-bold text-xs lg:text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-lg active:scale-95">
                            <Download size={16} className="lg:w-[18px] lg:h-[18px]"/> Export Audit Report
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                        <MetricCard title="Today's Revenue" value={overview.today_revenue} prefix="KES" icon={Wallet} trend="Live" />
                        <MetricCard title="Monthly Revenue" value={overview.monthly_revenue} prefix="KES" icon={TrendingUp} trend="+12%" />
                        <MetricCard title="Daily Invoices Paid" value={overview.transactions_today} icon={Receipt} trend="Active" />
                        <MetricCard title="Average Invoice" value={overview.average_order_value} prefix="KES" icon={Activity} trend="Stable" />
                    </div>

                    <div className="flex-1 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 lg:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-base lg:text-lg font-black text-slate-800 flex items-center gap-2"><Calendar size={18} className="lg:w-5 lg:h-5 text-slate-500"/> Settled Invoices</h2>
                        </div>
                        
                        {/* Table wrapper handles horizontal overflow on small screens */}
                        <div className="flex-1 overflow-x-auto w-full custom-scrollbar h-[400px] overflow-y-auto">
                            <table className="w-full min-w-[700px] text-left border-collapse">
                                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                    <tr className="text-[9px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="p-4 lg:p-5 pl-6 lg:pl-8">Invoice ID</th>
                                        <th className="p-4 lg:p-5">Date Settled</th>
                                        <th className="p-4 lg:p-5">Client Profile</th>
                                        <th className="p-4 lg:p-5">Summary</th>
                                        <th className="p-4 lg:p-5">Payment Method</th>
                                        <th className="p-4 lg:p-5 text-right pr-6 lg:pr-8">Total (KES)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs lg:text-sm">
                                    {transactions.length === 0 ? (
                                        <tr><td colSpan="6" className="p-8 lg:p-10 text-center text-slate-400 font-medium">No settled invoices found.</td></tr>
                                    ) : (
                                        transactions.map((tx, idx) => (
                                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                                                <td className="p-3 lg:p-4 pl-6 lg:pl-8 font-mono text-[10px] lg:text-xs font-bold text-slate-500">{tx.transaction_id}</td>
                                                <td className="p-3 lg:p-4 text-slate-600 text-[10px] lg:text-xs">
                                                    {new Date(tx.date).toLocaleDateString()} <span className="text-slate-400 ml-1">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </td>
                                                <td className="p-3 lg:p-4">
                                                    <div className="flex items-center gap-2 lg:gap-3">
                                                        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[9px] lg:text-[10px] font-black shrink-0 ${tx.patient === 'Walk-in Client' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}><User size={12} className="lg:w-3.5 lg:h-3.5"/></div>
                                                        <p className="font-bold text-slate-800 text-[10px] lg:text-xs uppercase">{tx.patient}</p>
                                                    </div>
                                                </td>
                                                <td className="p-3 lg:p-4 text-[10px] lg:text-xs font-bold text-slate-500">{tx.item_count} Items Billed</td>
                                                <td className="p-3 lg:p-4">
                                                    <span className="text-[8px] lg:text-[9px] font-black px-2 lg:px-2.5 py-1 lg:py-1.5 rounded-md uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1 lg:gap-1.5 w-max">
                                                        <CheckCircle2 size={10}/> PAID
                                                    </span>
                                                </td>
                                                <td className="p-3 lg:p-4 pr-6 lg:pr-8 text-right font-black text-slate-800">{tx.total_cost.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT MODAL */}
            {paymentState !== 'idle' && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center rounded-[24px] lg:rounded-[32px] animate-in fade-in p-4">
                    <div className="bg-white w-full max-w-[400px] rounded-[24px] lg:rounded-[32px] shadow-2xl p-6 lg:p-8 flex flex-col items-center text-center">
                        {paymentState === 'processing' && (
                            <div className="py-6 lg:py-8"><Loader2 className="animate-spin text-emerald-500 mx-auto mb-4" size={40}/><h2 className="text-lg lg:text-xl font-black">Processing Payment...</h2></div>
                        )}
                        {paymentState === 'failed' && (
                            <div className="py-4 lg:py-6"><XCircle className="text-red-500 mx-auto mb-3 lg:mb-4" size={40}/><h2 className="text-lg lg:text-xl font-black">Transaction Failed</h2><button onClick={() => setPaymentState('idle')} className="mt-5 lg:mt-6 w-full py-3 bg-slate-100 rounded-xl font-bold text-xs lg:text-sm hover:bg-slate-200">Return to Cashier</button></div>
                        )}
                        {paymentState === 'success' && receiptData && (
                            <div className="w-full">
                                <CheckCircle2 className="text-emerald-500 mx-auto mb-3 lg:mb-4" size={40} className="lg:w-12 lg:h-12"/>
                                <h2 className="text-lg lg:text-xl font-black mb-5 lg:mb-6">Payment Complete</h2>
                                <div className="bg-slate-50 p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-slate-100 text-left mb-5 lg:mb-6 font-mono text-[10px] lg:text-xs">
                                    <p className="font-bold border-b border-slate-200 pb-2 mb-2 text-center">MEDICARE OFFICIAL RECEIPT</p>
                                    <p>TRX: {receiptData.transactionId}</p>
                                    <p>Patient: {receiptData.patientName}</p>
                                    <div className="my-3 py-3 border-y border-dashed border-slate-300">
                                        {receiptData.items.map((i, idx) => <div key={idx} className="flex justify-between mb-1 truncate gap-2 lg:gap-4"><span className="truncate">{i.description}</span><span>{i.amount.toFixed(2)}</span></div>)}
                                    </div>
                                    <p className="flex justify-between font-bold text-xs lg:text-sm"><span>TOTAL</span><span>KES {receiptData.total.toFixed(2)}</span></p>
                                </div>
                                <div className="flex gap-2 lg:gap-3">
                                    <button onClick={() => window.print()} className="flex-1 py-2.5 lg:py-3 bg-slate-800 text-white rounded-xl font-bold text-[10px] lg:text-xs flex items-center justify-center gap-1.5 lg:gap-2 hover:bg-slate-700"><Printer size={14} className="lg:w-4 lg:h-4"/> Print</button>
                                    <button onClick={resetTransaction} className="flex-1 py-2.5 lg:py-3 bg-emerald-600 text-white rounded-xl font-bold text-[10px] lg:text-xs hover:bg-emerald-700">Next Client</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;