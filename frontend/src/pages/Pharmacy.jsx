import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Pill, AlertTriangle, PackagePlus, Search } from 'lucide-react';

const Pharmacy = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInventory = async () => {
    try {
      const res = await api.get('/pharmacy/');
      setInventory(res.data);
    } catch (err) {
      console.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleDispense = async (id, currentStock) => {
    if (currentStock <= 0) return alert("Out of stock!");
    try {
      await api.patch(`/pharmacy/${id}/dispense?quantity=1`);
      fetchInventory(); // Refresh to show new stock level
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to dispense");
    }
  };

  const filteredInventory = inventory.filter(drug => 
    drug.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    drug.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = inventory.filter(d => d.status !== 'In Stock').length;
  const totalValue = inventory.reduce((sum, d) => sum + (d.stock * d.price), 0);

  if (loading) return <div className="text-[#A3AED0] font-medium">Loading Pharmacy Systems...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-[#1B2559]">Pharmacy & Inventory</h2>
          <p className="text-sm text-[#A3AED0] mt-1">Manage medical supplies and prescriptions</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
          <PackagePlus size={18} /> Receive Shipment
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<Pill />} bg="bg-blue-500" label="Total Unique Drugs" value={inventory.length} />
        <StatCard icon={<AlertTriangle />} bg="bg-orange-500" label="Low Stock Alerts" value={lowStockCount} alert={lowStockCount > 0} />
        <StatCard icon={<PackagePlus />} bg="bg-emerald-500" label="Inventory Value" value={`$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
      </div>

      {/* Inventory Control Table */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#1B2559]">Current Stock</h3>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search medications..." 
              className="bg-transparent outline-none text-sm w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-xs font-bold text-[#A3AED0] uppercase tracking-wider">SKU / Drug Name</th>
                <th className="pb-4 text-xs font-bold text-[#A3AED0] uppercase tracking-wider">Category</th>
                <th className="pb-4 text-xs font-bold text-[#A3AED0] uppercase tracking-wider">Stock Level</th>
                <th className="pb-4 text-xs font-bold text-[#A3AED0] uppercase tracking-wider">Unit Price</th>
                <th className="pb-4 text-xs font-bold text-[#A3AED0] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInventory.map((drug) => (
                <tr key={drug.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4">
                    <p className="text-[10px] font-bold text-slate-400">{drug.sku}</p>
                    <p className="font-bold text-[#1B2559]">{drug.name}</p>
                  </td>
                  <td className="py-4 font-medium text-slate-600">{drug.category}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#1B2559] w-8">{drug.stock}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                        drug.status === 'In Stock' ? 'bg-emerald-50 text-emerald-600' : 
                        drug.status === 'Low Stock' ? 'bg-orange-50 text-orange-600' : 
                        'bg-red-50 text-red-600'
                      }`}>
                        {drug.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 font-bold text-slate-600">${drug.price.toFixed(2)}</td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => handleDispense(drug.id, drug.stock)}
                      disabled={drug.stock <= 0}
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${
                        drug.stock > 0 
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                        : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Dispense 1 Unit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInventory.length === 0 && (
            <div className="text-center py-10 text-[#A3AED0] font-medium">No medications found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, bg, label, value, alert }) => (
  <div className={`bg-white p-6 rounded-3xl shadow-sm border ${alert ? 'border-orange-200 shadow-orange-100' : 'border-slate-50'} flex items-center gap-5`}>
    <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-opacity-20`}>
      {icon}
    </div>
    <div>
      <p className="text-[12px] font-bold text-[#A3AED0] uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black mt-1 ${alert ? 'text-orange-600' : 'text-[#1B2559]'}`}>{value}</p>
    </div>
  </div>
);

export default Pharmacy;