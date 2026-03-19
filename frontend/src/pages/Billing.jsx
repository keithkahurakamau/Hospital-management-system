import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Wallet, Receipt, ShieldCheck, Clock, ChevronRight, Plus } from 'lucide-react';

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/billing/');
      setInvoices(res.data);
    } catch (err) {
      console.error("Failed to load financials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleStatusUpdate = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Pending' ? 'Paid' : 'Pending';
    try {
      await api.patch(`/billing/${id}/status?new_status=${nextStatus}`);
      fetchInvoices(); // Refresh the list
    } catch (err) {
      alert("Status update failed.");
    }
  };

  // Calculate quick stats
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0);

  if (loading) return <div className="text-[#A3AED0] font-medium">Loading Financial Ledger...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-[#1B2559]">Billing & Claims</h2>
          <p className="text-sm text-[#A3AED0] mt-1">Manage patient invoices and insurance processing</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
          <Plus size={18} /> Generate Invoice
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<Wallet />} bg="bg-emerald-500" label="Total Collected (YTD)" value={`$${totalRevenue.toLocaleString()}`} />
        <StatCard icon={<Clock />} bg="bg-orange-500" label="Pending Payments" value={`$${pendingAmount.toLocaleString()}`} />
        <StatCard icon={<ShieldCheck />} bg="bg-blue-500" label="Insurance Claims" value="24 Active" />
      </div>

      {/* Invoice Ledger Table */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-50">
        <h3 className="text-lg font-bold text-[#1B2559] mb-6">Recent Transactions</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-xs font-bold text-[#A3AED0] uppercase tracking-wider">Invoice ID</th>
                <th className="pb-4 text-xs font-bold text-[#A3AED0] uppercase tracking-wider">Patient Name</th>
                <th className="pb-4 text-xs font-bold text-[#A3AED0] uppercase tracking-wider">Date Issued</th>
                <th className="pb-4 text-xs font-bold text-[#A3AED0] uppercase tracking-wider">Amount</th>
                <th className="pb-4 text-xs font-bold text-[#A3AED0] uppercase tracking-wider">Status</th>
                <th className="pb-4 text-xs font-bold text-[#A3AED0] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map((inv) => (
                <tr key={inv.invoice_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-bold text-[#1B2559]">INV-{String(inv.invoice_id).padStart(4, '0')}</td>
                  <td className="py-4 font-medium text-slate-700">{inv.patient_name}</td>
                  <td className="py-4 text-sm text-[#A3AED0]">{inv.date}</td>
                  <td className="py-4 font-bold text-[#1B2559]">${inv.amount.toFixed(2)}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                      inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 
                      inv.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => handleStatusUpdate(inv.invoice_id, inv.status)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {inv.status === 'Pending' ? 'Mark Paid' : 'Revert'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="text-center py-10 text-[#A3AED0] font-medium">No invoices found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, bg, label, value }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-5">
    <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-opacity-20`}>
      {icon}
    </div>
    <div>
      <p className="text-[12px] font-bold text-[#A3AED0] uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-[#1B2559] mt-1">{value}</p>
    </div>
  </div>
);

export default Billing;