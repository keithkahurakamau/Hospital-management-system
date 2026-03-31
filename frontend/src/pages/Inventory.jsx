import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
    Search, Plus, XCircle, Loader2, 
    AlertTriangle, PackageSearch, Edit3, ArrowUpRight, TrendingUp
} from 'lucide-react';

const Inventory = () => {
    const [catalog, setCatalog] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modals
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [stockToAdd, setStockToAdd] = useState('');

    useEffect(() => { fetchInventory(); }, []);

    const fetchInventory = async () => {
        try {
            const res = await api.get('/pharmacy/inventory');
            setCatalog(res.data);
        } catch (err) {
            console.error("Failed to load inventory", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStock = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/pharmacy/inventory/${selectedDrug.drug_id}/stock`, {
                added_quantity: parseInt(stockToAdd)
            });
            alert("Stock shipment received successfully!");
            setShowUpdateModal(false);
            setStockToAdd('');
            fetchInventory();
        } catch (err) {
            alert("Failed to update stock. Check backend connection.");
        }
    };

    const filteredCatalog = catalog.filter(item => 
        item.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.generic_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const lowStockItems = catalog.filter(item => item.stock_quantity > 0 && item.stock_quantity <= item.reorder_level).length;
    const outOfStockItems = catalog.filter(item => item.stock_quantity === 0).length;

    if (isLoading) return <div className="flex h-[85vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

    return (
        <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] flex flex-col gap-4 lg:gap-6 font-sans animate-in fade-in duration-500">
            
            {/* HEADER & METRICS */}
            <div className="bg-white p-5 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 md:gap-0 shrink-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 lg:gap-3">
                        <PackageSearch size={24} className="text-blue-600 lg:w-8 lg:h-8"/> Central Inventory
                    </h1>
                    <p className="text-slate-500 font-medium text-xs lg:text-sm mt-1">Manage hospital supplies, procurement, and stock levels.</p>
                </div>
                
                <div className="flex gap-3 lg:gap-4">
                    <div className="flex-1 md:flex-none px-4 lg:px-6 py-2.5 lg:py-3 bg-red-50 border border-red-100 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center">
                        <span className="text-red-600 text-lg lg:text-xl font-black">{outOfStockItems}</span>
                        <span className="text-[8px] lg:text-[9px] font-black text-red-400 uppercase tracking-widest text-center">Out of Stock</span>
                    </div>
                    <div className="flex-1 md:flex-none px-4 lg:px-6 py-2.5 lg:py-3 bg-amber-50 border border-amber-100 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center">
                        <span className="text-amber-600 text-lg lg:text-xl font-black">{lowStockItems}</span>
                        <span className="text-[8px] lg:text-[9px] font-black text-amber-500 uppercase tracking-widest text-center">Reorder Required</span>
                    </div>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center gap-3 lg:gap-0">
                    <div className="relative w-full md:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" placeholder="Search entire catalog..." 
                            className="w-full pl-10 lg:pl-11 pr-4 py-2.5 lg:py-3 bg-white rounded-xl outline-none border border-slate-200 text-xs lg:text-sm font-bold focus:border-blue-500 transition-all shadow-sm"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 lg:gap-3">
                        <button className="flex-1 md:flex-none justify-center bg-white text-slate-600 border border-slate-200 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
                            <TrendingUp size={14}/> Export
                        </button>
                        <button className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                            <Plus size={14}/> New Item
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto w-full custom-scrollbar">
                    <table className="w-full min-w-[700px] text-left">
                        <thead className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 lg:p-5 pl-6 lg:pl-8 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Item Name</th>
                                <th className="p-4 lg:p-5 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                <th className="p-4 lg:p-5 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Price (KES)</th>
                                <th className="p-4 lg:p-5 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Level</th>
                                <th className="p-4 lg:p-5 pr-6 lg:pr-8 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCatalog.map(item => (
                                <tr key={item.drug_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 lg:p-5 pl-6 lg:pl-8">
                                        <p className="font-black text-slate-800 text-xs lg:text-sm">{item.brand_name}</p>
                                        <p className="text-[10px] lg:text-xs font-bold text-slate-500 mt-0.5">{item.generic_name}</p>
                                    </td>
                                    <td className="p-4 lg:p-5">
                                        <span className="text-[8px] lg:text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">
                                            {item.category || 'DRUG'}
                                        </span>
                                    </td>
                                    <td className="p-4 lg:p-5 text-xs lg:text-sm font-black text-slate-800">{item.unit_price}</td>
                                    <td className="p-4 lg:p-5">
                                        <span className={`px-2.5 lg:px-3 py-1 text-[9px] lg:text-[10px] font-black rounded-md ${item.stock_quantity === 0 ? 'bg-red-100 text-red-700' : item.stock_quantity <= item.reorder_level ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {item.stock_quantity} Units
                                        </span>
                                    </td>
                                    <td className="p-4 lg:p-5 pr-6 lg:pr-8 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => { setSelectedDrug(item); setShowUpdateModal(true); }}
                                            className="px-3 lg:px-4 py-1.5 lg:py-2 bg-blue-50 text-blue-600 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-1.5 lg:gap-2"
                                        >
                                            <ArrowUpRight size={14}/> <span className="hidden sm:inline">Receive</span>
                                        </button>
                                        <button className="p-1.5 lg:px-3 lg:py-2 text-slate-400 border border-slate-200 rounded-lg hover:text-slate-800 hover:bg-slate-50 transition-all">
                                            <Edit3 size={14}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RECEIVE SHIPMENT MODAL */}
            {showUpdateModal && selectedDrug && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center rounded-[32px] animate-in fade-in p-4">
                    <form onSubmit={handleUpdateStock} className="bg-white w-full max-w-[400px] rounded-[24px] lg:rounded-[32px] shadow-2xl p-6 lg:p-8 scale-in-center">
                        <div className="flex justify-between items-center mb-5 lg:mb-6">
                            <h2 className="text-lg lg:text-xl font-black text-slate-800">Receive Shipment</h2>
                            <button type="button" onClick={() => setShowUpdateModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={20} className="lg:w-6 lg:h-6"/></button>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl lg:rounded-2xl mb-5 lg:mb-6 border border-slate-100">
                            <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Item</p>
                            <p className="font-black text-slate-800 text-xs lg:text-sm">{selectedDrug.brand_name}</p>
                            <p className="text-[10px] lg:text-xs font-bold text-slate-500 mt-1">Current Stock: {selectedDrug.stock_quantity}</p>
                        </div>
                        <div className="space-y-2 mb-6 lg:mb-8">
                            <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity Received</label>
                            <input 
                                required type="number" min="1" autoFocus
                                value={stockToAdd} onChange={e => setStockToAdd(e.target.value)}
                                className="w-full p-3 lg:p-4 bg-white border-2 border-slate-200 rounded-xl lg:rounded-2xl outline-none focus:border-blue-500 font-black text-base lg:text-lg text-slate-800"
                                placeholder="Enter units..."
                            />
                        </div>
                        <button type="submit" className="w-full py-3 lg:py-4 bg-blue-600 text-white font-black text-[10px] lg:text-xs uppercase tracking-widest rounded-xl lg:rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                            Confirm Received Stock
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Inventory;