import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Search, ShoppingBag, Plus, Minus, Trash2, Banknote, Smartphone, CheckCircle2, XCircle, Loader2, Printer, AlertTriangle, Pill } from 'lucide-react';

const PharmacyPOS = () => {
    const [catalog, setCatalog] = useState([]);
    const [patients, setPatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Transaction State
    const [cart, setCart] = useState([]);
    const [saleType, setSaleType] = useState('Walk-in'); 
    const [selectedPatientRecord, setSelectedPatientRecord] = useState('');
    
    // Payment & Gateway State
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [phoneNumber, setPhoneNumber] = useState('');
    
    // Gateway Machine: 'idle' | 'processing' | 'success' | 'failed'
    const [paymentState, setPaymentState] = useState('idle'); 
    const [receiptData, setReceiptData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [catalogRes, prescriptionRes] = await Promise.all([
                    api.get('/pharmacy/inventory'),
                    api.get('/pharmacy/pending-prescriptions')
                ]);
                setCatalog(catalogRes.data);
                setPatients(prescriptionRes.data);
            } catch (err) {
                console.error("Failed to load POS data", err);
            }
        };
        fetchInitialData();
    }, []);

    const addToCart = (drug) => {
        setCart(prev => {
            const existing = prev.find(i => i.drug_id === drug.drug_id);
            if (existing) {
                if (existing.quantity >= drug.stock_quantity) return prev; // Prevent over-ordering
                return prev.map(i => i.drug_id === drug.drug_id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...drug, quantity: 1 }];
        });
    };

    const updateQuantity = (drugId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.drug_id === drugId) {
                const newQty = item.quantity + delta;
                if (newQty > item.stock_quantity) return item; // Stock limit
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (drugId) => {
        setCart(prev => prev.filter(item => item.drug_id !== drugId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const handleDispense = async () => {
        if (cart.length === 0) return alert("Cart is empty.");
        if (saleType === 'Prescription' && !selectedPatientRecord) return alert("Select a pending prescription.");
        
        setPaymentState('processing');

        const rx = saleType === 'Prescription' 
            ? patients.find(p => p.record_id === parseInt(selectedPatientRecord)) 
            : null;

        const payload = {
            patient_id: rx ? rx.patient_id : null,
            record_id: rx ? rx.record_id : null,
            payment_method: paymentMethod,
            cart: cart.map(item => ({ drug_id: item.drug_id, quantity: item.quantity }))
        };

        try {
            if (paymentMethod === 'M-PESA') {
                await new Promise(resolve => setTimeout(resolve, 3000)); 
            }

            await api.post('/pharmacy/dispense', payload);
            
            setReceiptData({
                transactionId: `MC-${Math.floor(Math.random() * 1000000)}`,
                date: new Date().toLocaleString(),
                method: paymentMethod,
                items: [...cart],
                total: cartTotal,
                patientName: rx ? rx.patient_name : 'Walk-in Client'
            });
            setPaymentState('success');

        } catch (err) {
            const rawError = err.response?.data?.detail;
            let displayError = "Transaction failed.";
            
            if (Array.isArray(rawError)) {
                displayError = rawError[0]?.msg || "Invalid data format sent to server.";
            } else if (typeof rawError === 'string') {
                displayError = rawError;
            }

            setErrorMessage(displayError);
            setPaymentState('failed');
        }
    };

    const resetTransaction = () => {
        setCart([]);
        setSelectedPatientRecord('');
        setPhoneNumber('');
        setPaymentState('idle');
        setReceiptData(null);
    };

    const filteredCatalog = catalog.filter(item => 
        item.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.generic_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative max-w-[1400px] mx-auto h-[88vh] flex gap-6 font-sans">
            
            {/* ================= MODAL OVERLAY ================= */}
            {paymentState !== 'idle' && (
                <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center rounded-3xl animate-in fade-in duration-200">
                    <div className="bg-white w-[440px] rounded-[32px] shadow-2xl p-10 flex flex-col items-center text-center scale-in-center">
                        
                        {paymentState === 'processing' && (
                            <div className="flex flex-col items-center py-6">
                                <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                    <Banknote className="text-blue-600" size={28} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800">Processing Payment</h2>
                                <p className="text-slate-500 mt-2 text-sm max-w-[250px]">
                                    {paymentMethod === 'M-PESA' 
                                        ? `Waiting for Safaricom STK Push confirmation...` 
                                        : 'Finalizing transaction & deducting stock...'}
                                </p>
                            </div>
                        )}

                        {paymentState === 'failed' && (
                            <div className="flex flex-col items-center py-4">
                                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                                    <XCircle size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800">Payment Failed</h2>
                                <p className="text-slate-500 mt-3 text-sm">{errorMessage}</p>
                                <button onClick={() => setPaymentState('idle')} className="mt-8 w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors">
                                    Return to Cart
                                </button>
                            </div>
                        )}

                        {paymentState === 'success' && receiptData && (
                            <div className="w-full flex flex-col items-center">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-xl font-black text-slate-800 mb-6">Transaction Complete</h2>
                                
                                {/* Realistic Thermal Receipt */}
                                <div className="w-full bg-[#fdfbf7] p-6 rounded-sm shadow-inner text-left text-[11px] font-mono text-slate-800 mb-8 border-t-[8px] border-slate-200 relative overflow-hidden print:m-0 print:border-none print:shadow-none">
                                    <div className="absolute -top-2 left-0 right-0 h-3 flex justify-between space-x-1 overflow-hidden opacity-30">
                                        {[...Array(20)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-slate-400"></div>)}
                                    </div>
                                    
                                    <div className="text-center font-bold text-sm mb-1">MEDICARE ERP POS</div>
                                    <div className="text-center text-slate-500 mb-4 pb-3 border-b border-dashed border-slate-300">
                                        <div>TRX: {receiptData.transactionId}</div>
                                        <div>{receiptData.date}</div>
                                    </div>
                                    
                                    <div className="mb-4 space-y-1">
                                        <div className="flex justify-between"><span>Patient:</span> <span className="font-bold">{receiptData.patientName}</span></div>
                                        <div className="flex justify-between"><span>Payment:</span> <span className="font-bold">{receiptData.method}</span></div>
                                        <div className="flex justify-between"><span>Cashier:</span> <span className="font-bold">Staff</span></div>
                                    </div>
                                    
                                    <div className="border-b border-dashed border-slate-300 pb-3 mb-3">
                                        <div className="flex justify-between font-bold mb-2 text-[10px] text-slate-500">
                                            <span>ITEM</span>
                                            <span>AMT</span>
                                        </div>
                                        {receiptData.items.map(item => (
                                            <div key={item.drug_id} className="flex justify-between mb-1.5 leading-tight">
                                                <div className="w-[70%]">
                                                    <div>{item.brand_name.substring(0, 20)}</div>
                                                    <div className="text-[9px] text-slate-500">{item.quantity} x {item.unit_price.toFixed(2)}</div>
                                                </div>
                                                <div className="w-[30%] text-right pt-1">
                                                    {(item.quantity * item.unit_price).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between font-black text-sm items-center">
                                        <span>TOTAL</span>
                                        <span className="text-base">KES {receiptData.total.toFixed(2)}</span>
                                    </div>
                                    <div className="text-center text-slate-400 mt-6 text-[9px]">Thank you for choosing Medicare!</div>
                                </div>

                                <div className="flex gap-3 w-full print:hidden">
                                    <button onClick={() => window.print()} className="flex-1 py-3.5 bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                                        <Printer size={18}/> Print
                                    </button>
                                    <button onClick={resetTransaction} className="flex-1 py-3.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                                        New Sale
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* ================= END MODAL ================= */}

            {/* LEFT PANE: Drug Catalog */}
            <div className="flex-1 bg-white rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden">
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dispensary</h1>
                            <p className="text-slate-500 font-medium text-sm mt-1">Inventory & POS Module</p>
                        </div>
                        <div className="relative w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search inventory..." 
                                className="w-full pl-11 pr-4 py-3 bg-slate-50/80 rounded-2xl outline-none border border-slate-200 text-sm focus:border-blue-500 focus:bg-white transition-all shadow-inner shadow-slate-50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                    {filteredCatalog.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Pill size={48} className="mb-4 opacity-20" />
                            <p className="font-medium text-slate-500">No drugs found in inventory.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                            {filteredCatalog.map(item => {
                                const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= item.reorder_level;
                                const isOutOfStock = item.stock_quantity === 0;

                                return (
                                <div 
                                    key={item.drug_id} 
                                    onClick={() => !isOutOfStock && addToCart(item)}
                                    className={`relative p-5 bg-white border rounded-[24px] transition-all duration-300 flex flex-col justify-between h-[150px]
                                        ${isOutOfStock 
                                            ? 'border-slate-100 opacity-60 cursor-not-allowed' 
                                            : 'border-slate-200 cursor-pointer hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1'}`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-md uppercase tracking-widest border border-blue-100/50">
                                                {item.category}
                                            </span>
                                            {isLowStock && !isOutOfStock && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                                    <AlertTriangle size={10} /> Low
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-1">{item.brand_name}</h3>
                                        <p className="text-xs text-slate-500 font-medium mt-1 truncate">{item.generic_name}</p>
                                    </div>
                                    
                                    <div className="flex justify-between items-end mt-4">
                                        <div className={`text-[11px] font-bold ${isOutOfStock ? 'text-red-500' : 'text-slate-400'}`}>
                                            Stock: {item.stock_quantity}
                                        </div>
                                        <div className="font-black text-slate-800 text-[15px]">
                                            <span className="text-[10px] text-slate-400 font-bold mr-1">KES</span>
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
            <div className="w-[420px] bg-white rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden relative">
                
                {/* Header */}
                <div className="px-6 pt-6 pb-4 bg-white z-10">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="font-black text-slate-800 flex items-center gap-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><ShoppingBag size={18}/></div>
                            Current Order
                        </h2>
                        {cart.length > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                                {cart.length} Item{cart.length !== 1 && 's'}
                            </span>
                        )}
                    </div>
                    
                    {/* Segmented Control */}
                    <div className="flex bg-slate-100/80 rounded-[14px] p-1.5 border border-slate-200/50 relative">
                        <button 
                            className={`relative z-10 flex-1 text-xs font-bold py-2.5 rounded-[10px] transition-all duration-300 ${saleType === 'Walk-in' ? 'text-slate-800 shadow-sm bg-white border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`} 
                            onClick={() => setSaleType('Walk-in')}
                        >
                            Walk-In
                        </button>
                        <button 
                            className={`relative z-10 flex-1 text-xs font-bold py-2.5 rounded-[10px] transition-all duration-300 ${saleType === 'Prescription' ? 'text-slate-800 shadow-sm bg-white border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`} 
                            onClick={() => setSaleType('Prescription')}
                        >
                            Prescription
                        </button>
                    </div>

                    {/* Prescription Selector */}
                    {saleType === 'Prescription' && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <select 
                                className="w-full p-3.5 bg-slate-50 rounded-xl outline-none border border-slate-200 text-xs font-bold text-slate-700 focus:border-blue-400 focus:bg-white transition-colors cursor-pointer"
                                value={selectedPatientRecord}
                                onChange={(e) => setSelectedPatientRecord(e.target.value)}
                            >
                                <option value="">Select Doctor's Prescription...</option>
                                {patients.map(p => (
                                    <option key={p.record_id} value={p.record_id}>
                                        {p.patient_name} — OP: {p.outpatient_no}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3 custom-scrollbar bg-slate-50/30">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                            <ShoppingBag size={48} strokeWidth={1} className="mb-4" />
                            <p className="text-sm font-medium">Cart is empty</p>
                            <p className="text-[11px] mt-1">Select drugs from the dispensary.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.drug_id} className="flex justify-between items-center p-3 bg-white border border-slate-200/60 rounded-2xl group hover:border-blue-200 transition-colors">
                                <div className="flex-1 pr-3">
                                    <p className="font-bold text-xs text-slate-800 truncate w-[140px] leading-tight">{item.brand_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1">KES {item.unit_price}</p>
                                </div>
                                
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl p-1 shadow-sm">
                                    <button onClick={() => updateQuantity(item.drug_id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-500 hover:text-slate-800"><Minus size={12}/></button>
                                    <span className="text-[11px] font-black w-4 text-center text-slate-800">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.drug_id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-500 hover:text-slate-800"><Plus size={12}/></button>
                                </div>
                                
                                <div className="w-[60px] text-right">
                                    <p className="font-black text-slate-800 text-xs">{(item.unit_price * item.quantity).toFixed(0)}</p>
                                </div>

                                <button onClick={() => removeFromCart(item.drug_id)} className="ml-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Checkout Footer */}
                <div className="p-6 bg-white border-t border-slate-200/60 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-end mb-5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Bill</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-slate-400">KES</span>
                            <span className="text-4xl font-black text-slate-800 tracking-tight">{cartTotal.toFixed(0)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 mb-5">
                        <button 
                            onClick={() => setPaymentMethod('Cash')} 
                            className={`flex-1 py-3.5 rounded-xl font-bold text-[11px] border flex items-center justify-center gap-2 transition-all duration-200 ${paymentMethod === 'Cash' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Banknote size={16} /> CASH
                        </button>
                        <button 
                            onClick={() => setPaymentMethod('M-PESA')} 
                            className={`flex-1 py-3.5 rounded-xl font-bold text-[11px] border flex items-center justify-center gap-2 transition-all duration-200 ${paymentMethod === 'M-PESA' ? 'bg-[#10A37F] text-white border-[#10A37F] shadow-md shadow-[#10A37F]/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Smartphone size={16} /> M-PESA
                        </button>
                    </div>

                    <button 
                        onClick={handleDispense}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-blue-600 text-white font-black text-[13px] rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {paymentMethod === 'M-PESA' ? 'Execute M-PESA Push' : 'Process Payment'} 
                        <span className="opacity-50 font-normal">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PharmacyPOS;