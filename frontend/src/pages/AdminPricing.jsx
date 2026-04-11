import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Edit, Search, Loader2, Check, Trash2 } from 'lucide-react';
import api from '../api/axiosConfig';

const AdminPricing = () => {
    const [catalog, setCatalog] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ 
        test_name: '', description: '', base_price: 0, is_active: true, required_items: [] 
    });

    useEffect(() => { fetchCatalog(); }, []);

    const fetchCatalog = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/lab-catalog');
            setCatalog(response.data || []);
        } catch (error) {
            console.error("Failed to fetch catalog:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item.catalog_id);
            setFormData({ ...item, required_items: item.required_items || [] });
        } else {
            setEditingItem(null);
            setFormData({ test_name: '', description: '', base_price: 0, is_active: true, required_items: [] });
        }
        setIsModalOpen(true);
    };

    // Inventory Builder Functions
    const addRequiredItem = () => {
        setFormData({
            ...formData,
            required_items: [...formData.required_items, { inventory_item_id: '', item_name: '', quantity_required: 1 }]
        });
    };

    const updateRequiredItem = (index, field, value) => {
        const newItems = [...formData.required_items];
        newItems[index][field] = value;
        setFormData({ ...formData, required_items: newItems });
    };

    const removeRequiredItem = (index) => {
        const newItems = formData.required_items.filter((_, i) => i !== index);
        setFormData({ ...formData, required_items: newItems });
    };

    const handleSave = async () => {
        if (!formData.test_name || formData.base_price < 0) return alert("Please provide a valid test name and price.");
        
        // Data Cleanup before sending
        const payload = {
            ...formData,
            required_items: formData.required_items
                .filter(item => item.item_name && item.inventory_item_id) // Remove empty rows
                .map(item => ({
                    ...item,
                    inventory_item_id: parseInt(item.inventory_item_id),
                    quantity_required: parseFloat(item.quantity_required) || 1
                }))
        };

        setIsSubmitting(true);
        try {
            if (editingItem) {
                await api.put(`/admin/lab-catalog/${editingItem}`, payload);
            } else {
                await api.post('/admin/lab-catalog', payload);
            }
            fetchCatalog();
            setIsModalOpen(false);
        } catch (error) {
            alert(`Error: ${error.response?.data?.detail || "Failed to save configuration."}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCatalog = catalog.filter(c => c.test_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="w-full max-w-[1200px] mx-auto min-h-[85vh] flex flex-col gap-6 font-sans animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-900 p-6 lg:p-8 rounded-[24px] shadow-xl text-white">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-emerald-400" size={28}/> Master Service Catalog
                    </h1>
                    <p className="text-slate-400 text-xs lg:text-sm mt-1 font-medium">Configure pricing and inventory requirements for laboratory services.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="mt-4 sm:mt-0 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                    <Plus size={16}/> Add New Service
                </button>
            </div>

            {/* Data Table */}
            <div className="flex-1 bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input 
                            type="text" placeholder="Search by test name..." 
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="p-4 pl-6">Test / Service Name</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Inventory Links</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Base Price (KSH)</th>
                                <th className="p-4 text-center pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading ? (
                                <tr><td colSpan="6" className="p-10 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" size={24}/> Loading Catalog...</td></tr>
                            ) : filteredCatalog.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold">No laboratory services found.</td></tr>
                            ) : filteredCatalog.map(item => (
                                <tr key={item.catalog_id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 pl-6 font-black text-slate-800">{item.test_name}</td>
                                    <td className="p-4 text-slate-500 text-xs truncate max-w-[200px]">{item.description || 'No description'}</td>
                                    <td className="p-4 text-xs font-bold text-blue-600">{item.required_items?.length || 0} items linked</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${item.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                            {item.is_active ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono font-black text-slate-700">
                                        <div className="flex items-center justify-end gap-1.5 text-emerald-600">KSH {item.base_price.toFixed(2)}</div>
                                    </td>
                                    <td className="p-4 text-center pr-6">
                                        <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                            <Edit size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-black text-slate-800">{editingItem ? 'Edit Service Details' : 'Add New Service'}</h2>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* Core Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Service Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={formData.test_name} onChange={e => setFormData({...formData, test_name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" placeholder="E.g. Complete Blood Count (CBC)"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Base Price (KSH) <span className="text-red-500">*</span></label>
                                    <input type="number" value={formData.base_price} onChange={e => setFormData({...formData, base_price: parseFloat(e.target.value) || 0})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"/>
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 w-full border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors mt-5">
                                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"/>
                                        <span className="text-sm font-bold text-slate-700">Service is Active</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Description / Protocol</label>
                                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 outline-none transition-all min-h-[80px] resize-none" placeholder="Optional notes..."/>
                            </div>

                            {/* Inventory Links */}
                            <div className="border-t border-slate-200 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800">Required Inventory</h3>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Items to deduct when test is completed</p>
                                    </div>
                                    <button onClick={addRequiredItem} className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1">
                                        <Plus size={12}/> Add Item
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formData.required_items.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">No inventory items linked to this test.</p>
                                    ) : formData.required_items.map((item, index) => (
                                        <div key={index} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                                            <input type="number" placeholder="Item ID" value={item.inventory_item_id} onChange={e => updateRequiredItem(index, 'inventory_item_id', e.target.value)} className="w-20 p-2 text-xs border border-slate-200 rounded-lg outline-none"/>
                                            <input type="text" placeholder="Item Name (e.g. Syringe)" value={item.item_name} onChange={e => updateRequiredItem(index, 'item_name', e.target.value)} className="flex-1 p-2 text-xs font-bold border border-slate-200 rounded-lg outline-none"/>
                                            <input type="number" placeholder="Qty" step="0.1" value={item.quantity_required} onChange={e => updateRequiredItem(index, 'quantity_required', e.target.value)} className="w-20 p-2 text-xs border border-slate-200 rounded-lg outline-none"/>
                                            <button onClick={() => removeRequiredItem(index)} className="p-2 text-red-400 hover:bg-red-100 rounded-lg"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl shadow-md font-black text-xs uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Check size={16}/>} Save Config
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPricing;