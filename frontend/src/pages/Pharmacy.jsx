import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
    Search, ShoppingBag, Plus, Minus, Trash2, Banknote, 
    Smartphone, CheckCircle2, XCircle, Loader2, Printer, 
    AlertTriangle, Pill, Users, ArrowRight
} from 'lucide-react';

const Pharmacy = () => {
    // --- STATE ---
    const [catalog, setCatalog] = useState([]);
    const [queue, setQueue] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [saleType, setSaleType] = useState('Walk-in'); 
    const [selectedPatientRecord, setSelectedPatientRecord] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentState, setPaymentState] = useState('idle'); 
    const [receiptData, setReceiptData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchInitialData();
        const interval = setInterval(fetchInitialData, 15000); 
        return () => clearInterval(interval);
    }, []);

    const fetchInitialData = async () => {
        try {
            const [catalogRes, queueRes] = await Promise.all([
                api.get('/pharmacy/inventory'),
                api.get('/pharmacy/pending-prescriptions')
            ]);
            setCatalog(catalogRes.data);
            setQueue(queueRes.data);
        } catch (err) {
            console.error("Failed to load pharmacy data", err);
        } finally {
            setIsLoading(false);
        }
    };

    // --- POS LOGIC ---
    const addToCart = (drug) => {
        setCart(prev => {
            const existing = prev.find(i => i.drug_id === drug.drug_id);
            if (existing) {
                if (existing.quantity >= drug.stock_quantity) return prev;
                return prev.map(i => i.drug_id === drug.drug_id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...drug, quantity: 1 }];
        });
    };

    const updateQuantity = (drugId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.drug_id === drugId) {
                const newQty = item.quantity + delta;
                if (newQty > item.stock_quantity) return item;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (drugId) => setCart(prev => prev.filter(item => item.drug_id !== drugId));

    const cartTotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const handleDispense = async () => {
        if (cart.length === 0) return alert("Cart is empty.");
        if (saleType === 'Prescription' && !selectedPatientRecord) return alert("Select a pending prescription.");
        
        setPaymentState('processing');
        const rx = saleType === 'Prescription' ? queue.find(p => p.record_id === parseInt(selectedPatientRecord)) : null;

        const payload = {
            patient_id: rx ? rx.patient_id : null,
            record_id: rx ? rx.record_id : null,
            payment_method: paymentMethod,
            cart: cart.map(item => ({ drug_id: item.drug_id, quantity: item.quantity }))
        };

        try {
            if (paymentMethod === 'M-PESA') await new Promise(resolve => setTimeout(resolve, 3000)); 
            await api.post('/pharmacy/dispense', payload);
            
            setReceiptData({
                transactionId: `PHM-${Math.floor(Math.random() * 1000000)}`,
                date: new Date().toLocaleString(),
                method: paymentMethod,
                items: [...cart],
                total: cartTotal,
                patientName: rx ? rx.patient_name : 'Walk-in Client'
            });
            setPaymentState('success');
            fetchInitialData(); 
        } catch (err) {
            setErrorMessage(err.response?.data?.detail || "Transaction failed.");
            setPaymentState('failed');
        }
    };

    const resetTransaction = () => {
        setCart([]);
        setSelectedPatientRecord('');
        setPaymentState('idle');
        setReceiptData(null);
    };

    const filteredCatalog = catalog.filter(item => 
        item.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.generic_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="flex h-[85vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>;

    return (
        <div className="relative w-full max-w-[1400px] mx-auto min-h-[85vh] flex flex-col gap-4 lg:gap-6 font-sans animate-in fade-in duration-500">
            
            {/* TOP BAR (Stacks on mobile) */}
            <div className="bg-slate-900 rounded-[24px] lg:rounded-[32px] border border-slate-800 shadow-xl overflow-hidden shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 lg:p-6 gap-4 sm:gap-0">
                <div className="flex items-center gap-3 lg:gap-4">
                    <div className="p-2 lg:p-3 bg-emerald-500/20 rounded-xl lg:rounded-2xl"><Pill size={20} className="lg:w-6 lg:h-6 text-emerald-400"/></div>
                    <div>
                        <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">Pharmacy Dispensary</h1>
                        <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 lg:mt-1">Point of Sale & Prescription Fulfillment</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-start gap-3 bg-white/10 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2">
                            <Users size={16} className={`lg:w-[18px] lg:h-[18px] ${queue.length > 0 ? "text-amber-400" : "text-slate-400"}`}/>
                            <span className="text-xs lg:text-sm font-black text-white">Pending Prescriptions:</span>
                        </div>
                        <span className={`text-xs lg:text-sm font-black px-2 lg:px-3 py-0.5 lg:py-1 rounded-lg lg:rounded-xl ${queue.length > 0 ? "bg-amber-500 text-slate-900 animate-pulse" : "bg-white/20 text-white"}`}>
                            {queue.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* MAIN WORKSPACE (Stacks vertically on screens smaller than large desktop) */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:overflow-hidden h-auto lg:h-[85vh]">
                
                {/* LEFT PANE: Drug Catalog */}
                <div className="flex-1 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden min-h-[400px]">
                    <div className="p-5 lg:p-8 pb-3 lg:pb-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 sm:gap-0 mb-4 lg:mb-6">
                            <div>
                                <h2 className="text-xl lg:text-3xl font-black text-slate-800 tracking-tight">Dispensary</h2>
                                <p className="text-slate-500 font-medium text-xs lg:text-sm mt-0.5 lg:mt-1">Inventory & POS Module</p>
                            </div>
                            <div className="relative w-full sm:w-64 lg:w-80">
                                <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-slate-400 lg:w-[18px] lg:h-[18px]" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search inventory..." 
                                    className="w-full pl-10 lg:pl-11 pr-4 py-2.5 lg:py-3 bg-white rounded-xl lg:rounded-2xl outline-none border border-slate-200 text-xs lg:text-sm font-bold focus:border-emerald-400 transition-all shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                        {filteredCatalog.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 lg:py-0">
                                <Pill size={40} className="mb-3 lg:mb-4 opacity-20 lg:w-[48px] lg:h-[48px]" />
                                <p className="font-medium text-xs lg:text-sm text-slate-500">No drugs found in inventory.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-5">
                                {filteredCatalog.map(item => {
                                    const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= item.reorder_level;
                                    const isOutOfStock = item.stock_quantity === 0;

                                    return (
                                    <div 
                                        key={item.drug_id} 
                                        onClick={() => !isOutOfStock && addToCart(item)}
                                        className={`relative p-3.5 lg:p-5 bg-white border rounded-[20px] lg:rounded-[24px] transition-all duration-300 flex flex-col justify-between h-[120px] lg:h-[150px]
                                            ${isOutOfStock 
                                                ? 'border-slate-100 opacity-60 cursor-not-allowed bg-slate-50' 
                                                : 'border-slate-200 cursor-pointer hover:border-emerald-300 hover:shadow-md hover:-translate-y-1'}`}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-1.5 lg:mb-2">
                                                <span className="text-[8px] lg:text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 lg:px-2.5 py-0.5 lg:py-1 rounded-md uppercase tracking-widest border border-slate-200 truncate max-w-[80px] lg:max-w-none">
                                                    {item.category}
                                                </span>
                                                {isLowStock && !isOutOfStock && (
                                                    <span className="flex items-center gap-1 text-[8px] lg:text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md border border-amber-100/50">
                                                        <AlertTriangle size={10} className="hidden sm:block" /> Low
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-xs lg:text-sm leading-tight line-clamp-1">{item.brand_name}</h3>
                                            <p className="text-[9px] lg:text-xs text-slate-500 font-medium mt-0.5 lg:mt-1 truncate">{item.generic_name}</p>
                                        </div>
                                        
                                        <div className="flex justify-between items-end mt-2 lg:mt-4">
                                            <div className={`text-[9px] lg:text-[11px] font-bold ${isOutOfStock ? 'text-red-500' : 'text-slate-400'}`}>
                                                Stock: {item.stock_quantity}
                                            </div>
                                            <div className="font-black text-slate-800 text-sm lg:text-[15px]">
                                                <span className="text-[8px] lg:text-[10px] text-slate-400 font-bold mr-0.5 lg:mr-1">KES</span>
                                                {item.unit_price}
                                            </div>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: Cart & Checkout */}
                <div className="w-full lg:w-[380px] xl:w-[420px] bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden shrink-0 min-h-[500px]">
                    
                    <div className="px-5 lg:px-6 pt-5 lg:pt-6 pb-3 lg:pb-4 bg-white z-10">
                        <div className="flex justify-between items-center mb-4 lg:mb-5">
                            <h2 className="font-black text-slate-800 flex items-center gap-2 text-base lg:text-lg">
                                <div className="p-1.5 lg:p-2 bg-emerald-50 text-emerald-600 rounded-lg lg:rounded-xl"><ShoppingBag size={16} className="lg:w-[18px] lg:h-[18px]"/></div>
                                Current Order
                            </h2>
                            {cart.length > 0 && (
                                <span className="bg-slate-800 text-white text-[9px] lg:text-[10px] font-bold px-2 lg:px-2.5 py-1 rounded-full">
                                    {cart.length} Item{cart.length !== 1 && 's'}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex bg-slate-100/80 rounded-[12px] lg:rounded-[14px] p-1 lg:p-1.5 border border-slate-200/50 relative">
                            <button 
                                className={`relative z-10 flex-1 text-[10px] lg:text-xs font-bold py-2 lg:py-2.5 rounded-[8px] lg:rounded-[10px] transition-all duration-300 ${saleType === 'Walk-in' ? 'text-slate-800 shadow-sm bg-white border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`} 
                                onClick={() => setSaleType('Walk-in')}
                            >
                                Walk-In
                            </button>
                            <button 
                                className={`relative z-10 flex-1 text-[10px] lg:text-xs font-bold py-2 lg:py-2.5 rounded-[8px] lg:rounded-[10px] transition-all duration-300 ${saleType === 'Prescription' ? 'text-slate-800 shadow-sm bg-white border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`} 
                                onClick={() => setSaleType('Prescription')}
                            >
                                Prescription
                            </button>
                        </div>

                        {saleType === 'Prescription' && (
                            <div className="mt-2.5 lg:mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <select 
                                    className="w-full p-2.5 lg:p-3.5 bg-slate-50 rounded-xl outline-none border border-slate-200 text-[10px] lg:text-xs font-bold text-slate-700 focus:border-slate-300 focus:bg-white transition-colors cursor-pointer"
                                    value={selectedPatientRecord}
                                    onChange={(e) => setSelectedPatientRecord(e.target.value)}
                                >
                                    <option value="">Select Pending Prescription...</option>
                                    {queue.map(p => (
                                        <option key={p.record_id} value={p.record_id}>
                                            {p.patient_name} — OP: {p.outpatient_no}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-2 space-y-2.5 lg:space-y-3 custom-scrollbar bg-slate-50/30">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10 lg:py-0">
                                <ShoppingBag size={40} strokeWidth={1} className="mb-3 lg:mb-4 lg:w-[48px] lg:h-[48px]" />
                                <p className="text-xs lg:text-sm font-medium">Cart is empty</p>
                                <p className="text-[9px] lg:text-[11px] mt-1 text-center px-4">Select drugs from the dispensary.</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.drug_id} className="flex justify-between items-center p-2.5 lg:p-3 bg-white border border-slate-200/60 rounded-xl lg:rounded-2xl group hover:border-slate-300 transition-colors shadow-sm">
                                    <div className="flex-1 pr-2 min-w-0">
                                        <p className="font-bold text-[10px] lg:text-xs text-slate-800 truncate">{item.brand_name}</p>
                                        <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 mt-0.5 lg:mt-1">KES {item.unit_price}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 lg:gap-1.5 bg-slate-50 border border-slate-100 rounded-lg lg:rounded-xl p-1 shadow-sm shrink-0">
                                        <button onClick={() => updateQuantity(item.drug_id, -1)} className="w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center hover:bg-white rounded-md lg:rounded-lg transition-all text-slate-500 hover:text-slate-800"><Minus size={12}/></button>
                                        <span className="text-[10px] lg:text-[11px] font-black w-4 text-center text-slate-800">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.drug_id, 1)} className="w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center hover:bg-white rounded-md lg:rounded-lg transition-all text-slate-500 hover:text-slate-800"><Plus size={12}/></button>
                                    </div>
                                    
                                    <div className="w-[50px] lg:w-[60px] text-right shrink-0">
                                        <p className="font-black text-slate-800 text-[10px] lg:text-xs">{(item.unit_price * item.quantity).toFixed(0)}</p>
                                    </div>

                                    <button onClick={() => removeFromCart(item.drug_id)} className="ml-1.5 lg:ml-2 text-slate-300 hover:text-red-500 transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100 shrink-0">
                                        <Trash2 size={14} className="lg:w-[16px] lg:h-[16px]"/>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-5 lg:p-6 bg-white border-t border-slate-100 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                        <div className="flex justify-between items-end mb-4 lg:mb-5">
                            <span className="text-[9px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 lg:mb-1">Total Bill</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs lg:text-sm font-black text-slate-400">KES</span>
                                <span className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">{cartTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 lg:gap-3 mb-4 lg:mb-5">
                            <button 
                                onClick={() => setPaymentMethod('Cash')} 
                                className={`flex-1 py-2.5 lg:py-3.5 rounded-xl font-bold text-[10px] lg:text-[11px] border flex items-center justify-center gap-1.5 lg:gap-2 transition-all duration-200 ${paymentMethod === 'Cash' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <Banknote size={14} className="lg:w-4 lg:h-4"/> CASH
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('M-PESA')} 
                                className={`flex-1 py-2.5 lg:py-3.5 rounded-xl font-bold text-[10px] lg:text-[11px] border flex items-center justify-center gap-1.5 lg:gap-2 transition-all duration-200 ${paymentMethod === 'M-PESA' ? 'bg-[#10A37F] text-white border-[#10A37F] shadow-md shadow-[#10A37F]/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <Smartphone size={14} className="lg:w-4 lg:h-4"/> M-PESA
                            </button>
                        </div>

                        <button 
                            onClick={handleDispense}
                            disabled={cart.length === 0}
                            className="w-full py-3.5 lg:py-4 bg-emerald-600 text-white font-black text-[10px] lg:text-xs uppercase tracking-widest rounded-xl lg:rounded-2xl shadow-lg hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {paymentMethod === 'M-PESA' ? 'Execute M-PESA Push' : 'Process Payment'} 
                            <span className="opacity-50 font-normal ml-1">→</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= MODAL OVERLAY ================= */}
            {paymentState !== 'idle' && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-[440px] rounded-[24px] lg:rounded-[32px] shadow-2xl p-6 lg:p-10 flex flex-col items-center text-center scale-in-center">
                        
                        {paymentState === 'processing' && (
                            <div className="flex flex-col items-center py-4 lg:py-6">
                                <div className="relative flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 mb-5 lg:mb-6">
                                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full border-t-transparent animate-spin"></div>
                                    <Banknote className="text-slate-800 lg:w-7 lg:h-7" size={24} />
                                </div>
                                <h2 className="text-xl lg:text-2xl font-black text-slate-800">Processing Payment</h2>
                                <p className="text-slate-500 mt-1.5 lg:mt-2 text-xs lg:text-sm max-w-[250px]">
                                    {paymentMethod === 'M-PESA' 
                                        ? `Waiting for Safaricom STK Push confirmation...` 
                                        : 'Finalizing transaction & deducting stock...'}
                                </p>
                            </div>
                        )}

                        {paymentState === 'failed' && (
                            <div className="flex flex-col items-center py-2 lg:py-4">
                                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 lg:mb-6">
                                    <XCircle size={32} className="lg:w-10 lg:h-10" />
                                </div>
                                <h2 className="text-xl lg:text-2xl font-black text-slate-800">Payment Failed</h2>
                                <p className="text-slate-500 mt-2 lg:mt-3 text-xs lg:text-sm">{errorMessage}</p>
                                <button onClick={() => setPaymentState('idle')} className="mt-6 lg:mt-8 w-full py-3 lg:py-4 bg-slate-100 text-slate-700 font-bold rounded-xl lg:rounded-2xl hover:bg-slate-200 transition-colors text-xs lg:text-sm">
                                    Return to Cart
                                </button>
                            </div>
                        )}

                        {paymentState === 'success' && receiptData && (
                            <div className="w-full flex flex-col items-center">
                                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 lg:mb-4">
                                    <CheckCircle2 size={28} className="lg:w-8 lg:h-8" />
                                </div>
                                <h2 className="text-lg lg:text-xl font-black text-slate-800 mb-4 lg:mb-6">Transaction Complete</h2>
                                
                                <div className="w-full bg-[#fdfbf7] p-5 lg:p-6 rounded-sm shadow-inner text-left text-[10px] lg:text-[11px] font-mono text-slate-800 mb-6 lg:mb-8 border-t-[6px] lg:border-t-[8px] border-slate-200 relative overflow-hidden print:m-0 print:border-none print:shadow-none">
                                    <div className="absolute -top-2 left-0 right-0 h-3 flex justify-between space-x-1 overflow-hidden opacity-30">
                                        {[...Array(20)].map((_, i) => <div key={i} className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-slate-400"></div>)}
                                    </div>
                                    
                                    <div className="text-center font-bold text-xs lg:text-sm mb-1">MEDICARE ERP POS</div>
                                    <div className="text-center text-slate-500 mb-3 lg:mb-4 pb-2 lg:pb-3 border-b border-dashed border-slate-300">
                                        <div>TRX: {receiptData.transactionId}</div>
                                        <div>{receiptData.date}</div>
                                    </div>
                                    
                                    <div className="mb-3 lg:mb-4 space-y-1">
                                        <div className="flex justify-between"><span>Patient:</span> <span className="font-bold truncate max-w-[120px] lg:max-w-[150px] text-right">{receiptData.patientName}</span></div>
                                        <div className="flex justify-between"><span>Payment:</span> <span className="font-bold">{receiptData.method}</span></div>
                                        <div className="flex justify-between"><span>Cashier:</span> <span className="font-bold">Staff</span></div>
                                    </div>
                                    
                                    <div className="border-b border-dashed border-slate-300 pb-2 lg:pb-3 mb-2 lg:mb-3">
                                        <div className="flex justify-between font-bold mb-1.5 lg:mb-2 text-[9px] lg:text-[10px] text-slate-500">
                                            <span>ITEM</span>
                                            <span>AMT</span>
                                        </div>
                                        {receiptData.items.map(item => (
                                            <div key={item.drug_id} className="flex justify-between mb-1.5 leading-tight gap-2 lg:gap-0">
                                                <div className="w-[70%]">
                                                    <div className="truncate">{item.brand_name}</div>
                                                    <div className="text-[8px] lg:text-[9px] text-slate-500">{item.quantity} x {item.unit_price.toFixed(2)}</div>
                                                </div>
                                                <div className="w-[30%] text-right pt-1">
                                                    {(item.quantity * item.unit_price).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between font-black text-xs lg:text-sm items-center">
                                        <span>TOTAL</span>
                                        <span className="text-sm lg:text-base">KES {receiptData.total.toFixed(2)}</span>
                                    </div>
                                    <div className="text-center text-slate-400 mt-5 lg:mt-6 text-[8px] lg:text-[9px]">Thank you for choosing Medicare!</div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 w-full print:hidden">
                                    <button onClick={() => window.print()} className="flex-1 py-3 lg:py-3.5 bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 lg:gap-2 hover:bg-slate-700 transition-colors text-[10px] lg:text-xs">
                                        <Printer size={16} className="lg:w-[18px] lg:h-[18px]"/> Print
                                    </button>
                                    <button onClick={resetTransaction} className="flex-1 py-3 lg:py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-[10px] lg:text-xs">
                                        New Sale
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pharmacy;