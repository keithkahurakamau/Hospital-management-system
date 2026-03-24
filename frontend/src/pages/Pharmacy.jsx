import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Pill, Search, ShoppingCart, CreditCard, Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const Pharmacy = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [selectedRx, setSelectedRx] = useState(null);
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchPrescriptions();
        fetchInventory();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            const res = await api.get('/pharmacy/pending-prescriptions');
            setPrescriptions(res.data);
        } catch (err) { console.error("Failed to load prescriptions", err); }
    };

    const fetchInventory = async () => {
        try {
            const res = await api.get('/pharmacy/inventory');
            setInventory(res.data);
        } catch (err) { console.error("Failed to load inventory", err); }
    };

    const addToCart = (drug) => {
        const existing = cart.find(item => item.drug_id === drug.drug_id);
        if (existing) {
            if (existing.quantity >= drug.stock_quantity) return alert("Maximum stock reached.");
            setCart(cart.map(item => item.drug_id === drug.drug_id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...drug, quantity: 1 }]);
        }
    };

    const removeFromCart = (drugId) => {
        setCart(cart.filter(item => item.drug_id !== drugId));
    };

    const calculateTotal = () => cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const handleDispense = async () => {
        if (!selectedRx) return alert("Please select a prescription first.");
        if (cart.length === 0) return alert("Cart is empty.");

        setIsLoading(true);
        try {
            const payload = {
                patient_id: selectedRx.patient_id,
                record_id: selectedRx.record_id,
                cart: cart.map(item => ({ drug_id: item.drug_id, quantity: item.quantity }))
            };
            
            const res = await api.post('/pharmacy/dispense', payload);
            alert(`Success! Total Billed: KES ${res.data.total_billed.toFixed(2)}`);
            
            setCart([]);
            setSelectedRx(null);
            fetchInventory(); // Refresh stock
            fetchPrescriptions(); // Refresh queue
        } catch (err) {
            alert(err.response?.data?.detail || "Transaction failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredInventory = inventory.filter(drug => 
        drug.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        drug.generic_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto h-[82vh] flex gap-6">
            
            {/* LEFT: PENDING PRESCRIPTIONS */}
            <div className="w-1/3 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-[#1B2559] flex items-center gap-2"><FileText size={18} className="text-emerald-500"/> Digital Prescriptions</h3>
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-1 rounded-full font-black">{prescriptions.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {prescriptions.map((rx) => (
                        <div 
                            key={rx.record_id}
                            onClick={() => setSelectedRx(rx)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedRx?.record_id === rx.record_id ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-white border-slate-100 hover:border-emerald-200'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-sm text-[#1B2559]">{rx.patient_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400">OP: {rx.outpatient_no}</p>
                                </div>
                                <Clock size={14} className="text-slate-300"/>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs font-medium text-slate-600">
                                {rx.prescription_notes}
                            </div>
                        </div>
                    ))}
                    {prescriptions.length === 0 && <div className="text-center mt-10 text-slate-400 text-sm italic">No pending prescriptions</div>}
                </div>
            </div>

            {/* RIGHT: POS WORKSTATION */}
            <div className="w-2/3 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                {/* Search Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search drug inventory (Brand or Generic)..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Inventory List */}
                    <div className="w-1/2 border-r border-slate-100 overflow-y-auto p-4 space-y-2">
                        {filteredInventory.map(drug => (
                            <div key={drug.drug_id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                                <div>
                                    <p className="text-sm font-bold text-[#1B2559]">{drug.brand_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{drug.generic_name} • KES {drug.unit_price}</p>
                                </div>
                                <button 
                                    onClick={() => addToCart(drug)}
                                    className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                                >
                                    <Pill size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Cart / Checkout */}
                    <div className="w-1/2 flex flex-col bg-slate-50/50">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-2 font-bold text-[#1B2559]">
                            <ShoppingCart size={18} className="text-emerald-500"/> Dispensing Cart
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {cart.map(item => (
                                <div key={item.drug_id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                    <div>
                                        <p className="text-xs font-bold text-[#1B2559]">{item.brand_name}</p>
                                        <p className="text-[10px] text-slate-400">Qty: {item.quantity} x KES {item.unit_price}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold">KES {(item.quantity * item.unit_price).toFixed(2)}</span>
                                        <button onClick={() => removeFromCart(item.drug_id)} className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Checkout Footer */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Bill</span>
                                <span className="text-2xl font-black text-[#1B2559]">KES {calculateTotal().toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={handleDispense}
                                disabled={isLoading || cart.length === 0}
                                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-all flex justify-center items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                <CreditCard size={18}/> {isLoading ? 'Processing...' : 'Complete & Dispense'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pharmacy;