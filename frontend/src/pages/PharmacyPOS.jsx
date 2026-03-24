import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Search, ShoppingBag, Plus, Minus, Trash2, Banknote, Smartphone, CheckCircle2, XCircle, Loader2, Printer } from 'lucide-react';

const PharmacyPOS = () => {
    const [catalog, setCatalog] = useState([]);
    const [patients, setPatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Transaction State
    const [cart, setCart] = useState([]);
    const [saleType, setSaleType] = useState('Walk-in'); 
    const [selectedPatient, setSelectedPatient] = useState('');
    
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
                const [catalogRes, patientRes] = await Promise.all([
                    api.get('/pharmacy/catalog'),
                    api.get('/pharmacy/patients')
                ]);
                setCatalog(catalogRes.data);
                setPatients(patientRes.data);
            } catch (err) {
                console.error("Failed to load POS data", err);
            }
        };
        fetchInitialData();
    }, []);

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.item_id === item.item_id);
            if (existing) return prev.map(i => i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.item_id === itemId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (itemId) => {
        setCart(prev => prev.filter(item => item.item_id !== itemId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const handleDispense = async () => {
        if (cart.length === 0) return alert("Cart is empty.");
        if (saleType === 'Prescription' && !selectedPatient) return alert("Select a patient for this prescription.");
        if (paymentMethod === 'M-PESA' && phoneNumber.length < 10) return alert("Valid phone number required for STK Push.");

        // 1. Lock screen into Processing State
        setPaymentState('processing');

        const payload = {
            pharmacist_id: 1,
            payment_method: paymentMethod,
            phone_number: paymentMethod === 'M-PESA' ? phoneNumber : null,
            items: cart.map(item => ({ item_id: item.item_id, quantity: item.quantity }))
        };

        try {
            // 2. Simulate the M-PESA PIN entry delay (e.g., waiting for Safaricom callback)
            if (paymentMethod === 'M-PESA') {
                await new Promise(resolve => setTimeout(resolve, 4500)); 
            }

            // 3. Execute actual backend deduction
            if (saleType === 'Walk-in') {
                await api.post('/pharmacy/dispense/walk-in', payload);
            } else {
                payload.patient_id = parseInt(selectedPatient);
                await api.post('/pharmacy/dispense/prescription', payload);
            }
            
            // 4. Capture Receipt Data & Transition to Success
            setReceiptData({
                transactionId: `TRX-${Math.floor(Math.random() * 1000000)}`,
                date: new Date().toLocaleString(),
                method: paymentMethod,
                items: [...cart],
                total: cartTotal,
                patientName: saleType === 'Prescription' ? patients.find(p => p.patient_id === parseInt(selectedPatient))?.first_name : 'Walk-in Client'
            });
            setPaymentState('success');

        } catch (err) {
            // 5. Transition to Failed State
            setErrorMessage(err.response?.data?.detail || "Transaction failed or cancelled by user.");
            setPaymentState('failed');
        }
    };

    const resetTransaction = () => {
        setCart([]);
        setSelectedPatient('');
        setPhoneNumber('');
        setPaymentState('idle');
        setReceiptData(null);
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredCatalog = catalog.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.item_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative max-w-7xl mx-auto h-[85vh] flex gap-6">
            
            {/* --- PAYMENT GATEWAY OVERLAY MODAL --- */}
            {paymentState !== 'idle' && (
                <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                    <div className="bg-white w-[400px] rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center">
                        
                        {paymentState === 'processing' && (
                            <>
                                <Loader2 className="animate-spin text-blue-600 mb-6" size={64} />
                                <h2 className="text-2xl font-bold text-[#1B2559]">Awaiting Payment</h2>
                                <p className="text-slate-500 mt-2">
                                    {paymentMethod === 'M-PESA' 
                                        ? `Please ask the client to check their phone (${phoneNumber}) and enter their M-PESA PIN.` 
                                        : 'Processing cash transaction & deducting stock...'}
                                </p>
                            </>
                        )}

                        {paymentState === 'failed' && (
                            <>
                                <XCircle className="text-red-500 mb-6" size={64} />
                                <h2 className="text-2xl font-bold text-[#1B2559]">Transaction Failed</h2>
                                <p className="text-slate-500 mt-2">{errorMessage}</p>
                                <button 
                                    onClick={() => setPaymentState('idle')}
                                    className="mt-8 w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                                >
                                    Return to Cart
                                </button>
                            </>
                        )}

                        {paymentState === 'success' && receiptData && (
                            <div className="w-full">
                                <CheckCircle2 className="text-green-500 mb-4 mx-auto" size={56} />
                                <h2 className="text-xl font-bold text-[#1B2559] mb-6">Payment Successful</h2>
                                
                                {/* THERMAL RECEIPT PREVIEW */}
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left text-sm font-mono text-slate-700 mb-6 print:bg-white print:border-none print:shadow-none">
                                    <div className="text-center font-bold text-base mb-2">HANMARK MEDICENTRE</div>
                                    <div className="text-center text-xs mb-4 border-b border-dashed border-slate-300 pb-2">
                                        TRX: {receiptData.transactionId} <br/>
                                        {receiptData.date}
                                    </div>
                                    
                                    <div className="mb-2">Client: {receiptData.patientName}</div>
                                    <div className="mb-4">Method: {receiptData.method}</div>

                                    <div className="border-b border-dashed border-slate-300 pb-2 mb-2">
                                        {receiptData.items.map(item => (
                                            <div key={item.item_id} className="flex justify-between mb-1">
                                                <span>{item.quantity}x {item.name.substring(0, 15)}</span>
                                                <span>{(item.quantity * item.unit_price).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="flex justify-between font-bold text-base mt-2">
                                        <span>TOTAL</span>
                                        <span>KES {receiptData.total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 print:hidden">
                                    <button 
                                        onClick={handlePrint}
                                        className="flex-1 py-3 bg-[#1B2559] text-white font-bold rounded-xl hover:bg-blue-900 flex items-center justify-center gap-2"
                                    >
                                        <Printer size={18}/> Print
                                    </button>
                                    <button 
                                        onClick={resetTransaction}
                                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                                    >
                                        New Sale
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* --- END MODAL --- */}

            {/* LEFT PANE: Drug Catalog */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-50 shadow-sm p-6 flex flex-col">
                <header className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1B2559]">Pharmacy POS</h1>
                        <p className="text-[#A3AED0] text-sm mt-1">Select items to dispense</p>
                    </div>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search drugs or codes..." 
                            className="w-full pl-10 p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 text-sm focus:border-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-4">
                    {filteredCatalog.map(item => (
                        <div 
                            key={item.item_id} 
                            onClick={() => addToCart(item)}
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:border-blue-400 hover:shadow-md transition-all active:scale-95 flex flex-col justify-between h-32"
                        >
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md uppercase tracking-wider">{item.category}</span>
                                <h3 className="font-bold text-[#1B2559] mt-2 text-sm leading-tight">{item.name}</h3>
                                <p className="text-xs text-[#A3AED0] mt-1">{item.item_code}</p>
                            </div>
                            <div className="text-right font-bold text-[#1B2559]">
                                KES {item.unit_price.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT PANE: Cart & Checkout */}
            <div className="w-96 bg-white rounded-3xl border border-slate-50 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                    <h2 className="font-bold text-[#1B2559] flex items-center gap-2">
                        <ShoppingBag size={18} className="text-blue-500"/> Current Transaction
                    </h2>
                    
                    <div className="mt-4 flex bg-white rounded-lg p-1 border border-slate-200">
                        <button 
                            className={`flex-1 text-xs font-bold py-2 rounded-md ${saleType === 'Walk-in' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            onClick={() => setSaleType('Walk-in')}
                        >Walk-in Sale</button>
                        <button 
                            className={`flex-1 text-xs font-bold py-2 rounded-md ${saleType === 'Prescription' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            onClick={() => setSaleType('Prescription')}
                        >Prescription</button>
                    </div>

                    {saleType === 'Prescription' && (
                        <select 
                            className="w-full mt-3 p-3 bg-white rounded-xl outline-none border border-slate-200 text-sm font-medium focus:border-blue-500"
                            value={selectedPatient}
                            onChange={(e) => setSelectedPatient(e.target.value)}
                        >
                            <option value="">Select Patient...</option>
                            {patients.map(p => (
                                <option key={p.patient_id} value={p.patient_id}>
                                    {p.first_name} {p.last_name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.map(item => (
                        <div key={item.item_id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div className="flex-1">
                                <p className="font-bold text-sm text-[#1B2559] truncate w-32">{item.name}</p>
                                <p className="text-xs text-[#A3AED0]">KES {item.unit_price.toFixed(2)}</p>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                                <button onClick={() => updateQuantity(item.item_id, -1)} className="p-1 hover:bg-white rounded text-slate-600"><Minus size={14}/></button>
                                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.item_id, 1)} className="p-1 hover:bg-white rounded text-slate-600"><Plus size={14}/></button>
                            </div>
                            
                            <div className="text-right w-16 ml-2">
                                <p className="font-bold text-sm text-[#1B2559]">{(item.unit_price * item.quantity).toFixed(0)}</p>
                            </div>
                            <button onClick={() => removeFromCart(item.item_id)} className="ml-2 text-red-400 hover:text-red-600 p-1">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-[#A3AED0] opacity-50 pt-10">
                            <ShoppingBag size={48} className="mb-4" />
                            <p className="text-sm font-medium">Cart is empty</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <div className="mb-4">
                        <span className="text-xs font-bold text-[#A3AED0] uppercase tracking-wider block mb-2">Payment Route</span>
                        <div className="flex gap-2">
                            <button 
                                className={`flex-1 py-2 rounded-lg font-bold text-sm border flex items-center justify-center gap-2 transition-all ${paymentMethod === 'Cash' ? 'bg-[#1B2559] text-white border-[#1B2559]' : 'bg-white text-slate-600 border-slate-200'}`}
                                onClick={() => setPaymentMethod('Cash')}
                            >
                                <Banknote size={16} /> Cash
                            </button>
                            <button 
                                className={`flex-1 py-2 rounded-lg font-bold text-sm border flex items-center justify-center gap-2 transition-all ${paymentMethod === 'M-PESA' ? 'bg-[#52B520] text-white border-[#52B520]' : 'bg-white text-slate-600 border-slate-200'}`}
                                onClick={() => setPaymentMethod('M-PESA')}
                            >
                                <Smartphone size={16} /> M-PESA
                            </button>
                        </div>
                        
                        {paymentMethod === 'M-PESA' && (
                            <input 
                                type="text" 
                                placeholder="Phone: e.g. 2547XXXXXXXX" 
                                className="w-full mt-3 p-3 bg-white rounded-xl outline-none border border-slate-200 text-sm focus:border-[#52B520] transition-colors"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        )}
                    </div>

                    <div className="flex justify-between items-center mb-4 pt-2 border-t border-slate-200">
                        <span className="text-sm font-bold text-[#A3AED0] uppercase tracking-wider">Total</span>
                        <span className="text-2xl font-black text-[#1B2559]">KES {cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={handleDispense}
                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                    >
                        {paymentMethod === 'M-PESA' ? 'Push STK & Checkout' : 'Complete Transaction'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PharmacyPOS;