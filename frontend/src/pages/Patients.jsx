import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Search, UserPlus, ChevronRight, FileText, X, ShieldCheck, CreditCard } from 'lucide-react';

const Patients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    
    // Production-ready Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        phone: '',
        id_number: '', // National ID / Passport
        gender: 'Other',
        insurance_type: 'CASH' // NHIF, Private, or Cash
    });

    const loadData = () => {
        setLoading(true);
        api.get('/patients/')
            .then(res => setPatients(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error("Data retrieval failure:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/patients/', formData);
            setShowModal(false);
            setFormData({ first_name: '', last_name: '', date_of_birth: '', phone: '', id_number: '', gender: 'Other', insurance_type: 'CASH' });
            loadData();
        } catch (err) {
            alert(err.response?.data?.detail || "Registration failed. Check National ID uniqueness.");
        }
    };

    const filteredPatients = patients.filter(p => 
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone && p.phone.includes(searchTerm)) ||
        (p.id_number && p.id_number.includes(searchTerm))
    );

    if (loading) return <div className="text-[#A3AED0] font-medium p-8">Initializing Registry...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 relative">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-[#1B2559]">Patient Registry</h2>
                    <p className="text-sm text-[#A3AED0] mt-1">Master index of all registered individuals</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                >
                    <UserPlus size={18} /> Register Patient
                </button>
            </div>

            {/* Registration Modal (Slide-over) */}
            {showModal && (
                <div className="fixed inset-0 bg-[#1B2559]/40 backdrop-blur-sm z-50 flex justify-end">
                    <div className="bg-white w-full max-w-md h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-[#1B2559]">New Patient Enrollment</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">First Name</label>
                                    <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500"
                                        value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Name</label>
                                    <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500"
                                        value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">National ID / Passport</label>
                                <div className="relative">
                                    <CreditCard size={16} className="absolute left-3 top-3.5 text-slate-300" />
                                    <input required type="text" className="w-full p-3 pl-10 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500"
                                        placeholder="Required for eTIMS" value={formData.id_number} onChange={e => setFormData({...formData, id_number: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date of Birth</label>
                                    <input required type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500"
                                        value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gender</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500"
                                        value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">M-Pesa Number</label>
                                <input required type="tel" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500"
                                    placeholder="e.g. 0712345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Insurance Coverage</label>
                                <div className="relative">
                                    <ShieldCheck size={16} className="absolute left-3 top-3.5 text-slate-300" />
                                    <select className="w-full p-3 pl-10 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500"
                                        value={formData.insurance_type} onChange={e => setFormData({...formData, insurance_type: e.target.value})}>
                                        <option value="CASH">Cash / Mobile Money</option>
                                        <option value="NHIF">NHIF / SHA Official</option>
                                        <option value="PRIVATE">Private Insurance (Jubilee/APA)</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl hover:bg-blue-700 transition-all mt-4">
                                Finalize Registration
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Table Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-[#1B2559]">Registry Data</h3>
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 w-72 focus-within:border-blue-500 transition-colors">
                        <Search size={16} className="text-[#A3AED0]" />
                        <input 
                            type="text" 
                            placeholder="Search name, phone, or ID..." 
                            className="bg-transparent outline-none text-sm font-medium w-full text-[#1B2559] placeholder-[#A3AED0]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 pt-2 text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">Patient Details</th>
                                <th className="pb-4 pt-2 text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">National ID</th>
                                <th className="pb-4 pt-2 text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">Coverage</th>
                                <th className="pb-4 pt-2 text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider">Contact</th>
                                <th className="pb-4 pt-2 text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredPatients.map((p) => (
                                <tr key={p.patient_id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-4 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm">
                                            {p.first_name[0]}{p.last_name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1B2559]">{p.first_name} {p.last_name}</p>
                                            <p className="text-[11px] font-bold text-[#A3AED0]">{p.gender} • DOB: {p.date_of_birth}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 font-medium text-slate-600 text-sm">{p.id_number || '---'}</td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                            p.insurance_type === 'CASH' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {p.insurance_type}
                                        </span>
                                    </td>
                                    <td className="py-4 font-medium text-slate-600 text-sm">{p.phone}</td>
                                    <td className="py-4 text-right">
                                        <button className="p-2 text-[#A3AED0] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                            <FileText size={18} />
                                        </button>
                                        <button className="p-2 text-[#A3AED0] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all ml-1">
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Patients;