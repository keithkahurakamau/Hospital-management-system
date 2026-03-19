import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Search, UserPlus, Phone, Mail, Stethoscope, Award } from 'lucide-react';

const Doctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        try {
            const res = await api.get('/doctors/');
            setDoctors(res.data);
        } catch (err) {
            console.error("Failed to load staff directory", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Filter doctors based on search input
    const filteredDoctors = doctors.filter(doc => 
        `${doc.first_name} ${doc.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-[#A3AED0] font-medium">Loading Staff Directory...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#1B2559]">Medical Staff Directory</h2>
                    <p className="text-sm text-[#A3AED0] mt-1">Manage hospital physicians and specializations</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
                    <UserPlus size={18} /> Onboard Staff
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 w-full md:w-96 focus-within:border-blue-500 transition-colors">
                    <Search size={16} className="text-[#A3AED0]" />
                    <input 
                        type="text" 
                        placeholder="Search by name or specialty..." 
                        className="bg-transparent outline-none text-sm font-medium w-full text-[#1B2559] placeholder-[#A3AED0]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="hidden md:block text-sm font-bold text-[#A3AED0]">
                    Total Active Staff: <span className="text-[#1B2559]">{doctors.length}</span>
                </div>
            </div>

            {/* Doctor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDoctors.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-[#A3AED0] font-medium">
                        No medical staff found matching your search.
                    </div>
                ) : (
                    filteredDoctors.map(doc => (
                        <div key={doc.doctor_id} className="bg-white rounded-3xl p-6 border border-slate-50 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                            
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{doc.status}</span>
                            </div>

                            {/* Avatar & Name */}
                            <div className="flex flex-col items-center mt-4 mb-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 rounded-full flex items-center justify-center font-black text-2xl shadow-inner mb-3 border border-blue-100/50">
                                    {doc.first_name[0]}{doc.last_name[0]}
                                </div>
                                <h3 className="text-lg font-bold text-[#1B2559]">Dr. {doc.first_name} {doc.last_name}</h3>
                                <p className="text-sm font-bold text-blue-600 flex items-center gap-1 mt-1">
                                    <Award size={14} /> {doc.specialization}
                                </p>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <Stethoscope size={16} className="text-[#A3AED0]" />
                                    <span className="truncate">{doc.department}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <Phone size={16} className="text-[#A3AED0]" />
                                    <span>{doc.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <Mail size={16} className="text-[#A3AED0]" />
                                    <span className="truncate">{doc.email || 'N/A'}</span>
                                </div>
                            </div>
                            
                            {/* Hover Action */}
                            <button className="w-full mt-6 py-2.5 bg-slate-50 text-slate-600 font-bold text-sm rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                View Profile
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Doctors;