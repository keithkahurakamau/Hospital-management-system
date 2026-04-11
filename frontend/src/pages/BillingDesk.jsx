import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
    Receipt, CreditCard, Banknote, Search, 
    User, CheckCircle2, Loader2, FileText, ChevronRight 
} from 'lucide-react';

const BillingDesk = () => {
    const [queue, setQueue] = useState([]);
    const [activePatient, setActivePatient] = useState(null);
    const [unbilledItems, setUnbilledItems] = useState([]);
    const [totalDue, setTotalDue] = useState(0);
    
    const [paymentMethod, setPaymentMethod] = useState('M-Pesa');
    const [isProcessing, setIsProcessing] = useState(false);
    const [receiptId, setReceiptId] = useState(null);

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 10000); // Check for new bills every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchQueue = async () => {
        try {
            const res = await api.get('/billing/queue');
            setQueue(res.data || []);
            
            // Keep active patient synced, but if they disappear from queue (because they paid), handle it
            if (activePatient) {
                const stillInQueue = res.data.find(q => q.patient_id === activePatient.patient_id);
                if (!stillInQueue && !receiptId) setActivePatient(null);
            }
        } catch (err) { console.error("Billing queue fetch error", err); }
    };

    const selectPatient = async (patient) => {
        setActivePatient(patient);
        setReceiptId(null); // Reset receipt view
        try {
            const res = await api.get(`/billing/unbilled/${patient.patient_id}`);
            setUnbilledItems(res.data.items || []);
            setTotalDue(res.data.total_due || 0);
        } catch (err) {
            console.error("Failed to fetch unbilled items", err);
        }
    };

    const handlePayment = async () => {
        if (unbilledItems.length === 0) return;
        setIsProcessing(true);
        
        try {
            const res = await api.post('/billing/process-payment', {
                patient_id: activePatient.patient_id,
                items: unbilledItems,
                payment_method: paymentMethod
            });
            
            setReceiptId(res.data.invoice_id);
            fetchQueue(); // Refresh queue to remove the paid patient
        } catch (err) {
            alert(`Payment Failed: ${err.response?.data?.detail || "Connection error"}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] flex flex-col lg:flex-row gap-4 lg:gap-6 font-sans animate-in fade-in duration-500">
            
            {/* LEFT PANE: Unpaid Balances Queue */}
            <div className="w-full lg:w-[350px] bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0 h-[350px] lg:h-[85vh]">
                <div className="p-5 lg:p-6 bg-slate-900 text-white flex justify-between items-center">
                    <h2 className="font-black flex items-center gap-2 uppercase text-[10px] lg:text-xs tracking-widest">
                        <Receipt size={16} className="text-emerald-400"/> Pending Invoices
                    </h2>
                    <span className="bg-white/20 text-white text-[9px] lg:text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {queue.length} Patients
                    </span>
                </div>

                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" placeholder="Search by OP Number..." 
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30 custom-scrollbar">
                    {queue.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-500">
                            <CheckCircle2 size={40} strokeWidth={1} className="mb-2 text-emerald-500" />
                            <p className="text-[10px] font-black uppercase">All balances cleared</p>
                        </div>
                    ) : (
                        queue.map(p => (
                            <div 
                                key={p.patient_id} 
                                onClick={() => selectPatient(p)}
                                className={`p-4 rounded-[20px] border cursor-pointer transition-all duration-300 group
                                    ${activePatient?.patient_id === p.patient_id && !receiptId
                                        ? 'bg-emerald-50 border-emerald-200 shadow-md' 
                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
                            >
                                <h3 className={`font-bold text-sm uppercase tracking-tight truncate ${activePatient?.patient_id === p.patient_id && !receiptId ? 'text-emerald-900' : 'text-slate-800'}`}>
                                    {p.patient_name}
                                </h3>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {p.outpatient_no}
                                    </p>
                                    <ChevronRight size={14} className={activePatient?.patient_id === p.patient_id && !receiptId ? 'text-emerald-500' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Cashier Register */}
            <div className="flex-1 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative min-h-[500px] lg:h-[85vh]">
                {!activePatient ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50/20">
                        <Banknote size={64} strokeWidth={1} className="mb-4 opacity-50" />
                        <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Cashier Desk Available</h2>
                        <p className="font-medium text-sm mt-2 text-center">Select a patient to view and clear outstanding balances.</p>
                    </div>
                ) : receiptId ? (
                    // SUCCESS RECEIPT VIEW
                    <div className="h-full flex flex-col items-center justify-center bg-emerald-50/30 p-10 text-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Payment Successful</h2>
                        <p className="text-slate-500 font-medium mb-8">Invoice #{receiptId} has been generated and stored in records.</p>
                        
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm w-full max-w-sm mb-8">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount Paid</span>
                                <span className="text-xl font-mono font-black text-emerald-600">KSH {totalDue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                                <span>Patient</span>
                                <span>{activePatient.patient_name}</span>
                            </div>
                        </div>

                        <button onClick={() => setActivePatient(null)} className="px-8 py-3 bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-colors">
                            Return to Queue
                        </button>
                    </div>
                ) : (
                    // INVOICE BUILDER VIEW
                    <div className="flex flex-col h-full">
                        <header className="p-6 lg:p-8 border-b border-slate-100 bg-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                                    <User size={24}/>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Folio</span>
                                    </div>
                                    <h1 className="text-2xl lg:text-3xl font-black text-slate-800 uppercase tracking-tight">{activePatient.patient_name}</h1>
                                </div>
                            </div>
                        </header>

                        <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-50/30 custom-scrollbar">
                            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={16} className="text-slate-400"/> Itemized Charges
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400">Date: {new Date().toLocaleDateString()}</span>
                                </div>
                                
                                <div className="p-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                <th className="p-4 pl-6">Description</th>
                                                <th className="p-4 text-center">Category</th>
                                                <th className="p-4 text-right pr-6">Amount (KSH)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {unbilledItems.map((item, idx) => (
                                                <tr key={idx} className="border-b border-slate-50">
                                                    <td className="p-4 pl-6 font-bold text-slate-800">{item.description}</td>
                                                    <td className="p-4 text-center">
                                                        <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">
                                                            {item.item_type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right pr-6 font-mono font-black text-slate-700">
                                                        {item.amount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="bg-slate-50 p-6 flex flex-col items-end border-t border-slate-100">
                                    <div className="w-full max-w-xs space-y-3">
                                        <div className="flex justify-between text-sm font-bold text-slate-500">
                                            <span>Subtotal</span>
                                            <span className="font-mono">{totalDue.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-slate-500">
                                            <span>Tax (Exempt)</span>
                                            <span className="font-mono">0.00</span>
                                        </div>
                                        <div className="flex justify-between text-xl lg:text-2xl font-black text-slate-900 border-t border-slate-200 pt-3 mt-3">
                                            <span>Total Due</span>
                                            <span className="font-mono text-emerald-600">KSH {totalDue.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Options */}
                            <div className="mt-8">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Payment Method</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {['M-Pesa', 'Cash', 'Insurance'].map(method => (
                                        <button 
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={`p-4 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2
                                                ${paymentMethod === method 
                                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-2 ring-emerald-500/20' 
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300'}`}
                                        >
                                            {method === 'M-Pesa' ? <CreditCard size={20}/> : method === 'Cash' ? <Banknote size={20}/> : <ShieldCheck size={20}/>}
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                            <button 
                                onClick={handlePayment}
                                disabled={unbilledItems.length === 0 || isProcessing}
                                className="w-full py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                {isProcessing ? 'Processing Transaction...' : `Confirm Payment • KSH ${totalDue.toFixed(2)}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingDesk;