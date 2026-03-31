import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { BedDouble, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const Beds = () => {
    const [beds, setBeds] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState('');

    const loadData = async () => {
        try {
            const [bedRes, patRes] = await Promise.all([
                api.get('/beds/'),
                api.get('/patients/')
            ]);
            setBeds(bedRes.data);
            setPatients(patRes.data);
        } catch (err) {
            console.error("Failed to load allocation data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleAdmit = async (bedId) => {
        if (!selectedPatient) return alert("Select a patient from the dropdown first.");
        try {
            await api.patch(`/beds/${bedId}/admit`, { patient_id: parseInt(selectedPatient) });
            setSelectedPatient('');
            loadData();
        } catch (err) {
            alert(err.response?.data?.detail || "Admission failed");
        }
    };

    const handleStateChange = async (bedId, action) => {
        try {
            await api.patch(`/beds/${bedId}/${action}`);
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    // Group beds by ward for a highly structured matrix view
    const wards = beds.reduce((acc, bed) => {
        if (!acc[bed.ward_name]) acc[bed.ward_name] = [];
        acc[bed.ward_name].push(bed);
        return acc;
    }, {});

    if (loading) return <div className="flex h-[85vh] items-center justify-center"><Loader2 className="animate-spin text-orange-600" size={40}/></div>;

    return (
        <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-4 lg:gap-6 font-sans animate-in fade-in duration-500">
            
            {/* Header: Stacks on mobile, row on tablet/desktop */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 md:gap-0 bg-white p-5 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm shrink-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 lg:gap-3">
                        <BedDouble className="text-orange-500 lg:w-8 lg:h-8" size={24}/> Bed Allocation
                    </h1>
                    <p className="text-slate-500 font-medium text-xs lg:text-sm mt-1 lg:mt-2">Real-time ward telemetry and capacity management</p>
                </div>
                
                {/* Global Patient Selector for Admissions */}
                <div className="flex items-center gap-2 lg:gap-3 bg-slate-50 p-2 rounded-xl lg:rounded-2xl border border-slate-200 shadow-inner w-full md:w-auto">
                    <User size={16} className="text-slate-400 ml-2 shrink-0 lg:w-[18px] lg:h-[18px]" />
                    <select 
                        className="bg-transparent outline-none text-xs lg:text-sm font-bold text-slate-700 w-full md:w-64 p-1.5 lg:p-2 focus:text-orange-600 transition-colors"
                        value={selectedPatient}
                        onChange={(e) => setSelectedPatient(e.target.value)}
                    >
                        <option value="">Select Patient for Admission...</option>
                        {patients.map(p => (
                            <option key={p.patient_id || p.id} value={p.patient_id || p.id}>
                                {p.surname} {p.other_names}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {Object.keys(wards).length === 0 ? (
                <div className="text-center py-12 lg:py-16 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm">
                    <AlertCircle className="mx-auto mb-4 text-slate-300" size={48} strokeWidth={1.5} />
                    <p className="text-slate-500 font-bold text-sm lg:text-base">No wards configured. Run the initial seeding script.</p>
                </div>
            ) : (
                Object.entries(wards).map(([wardName, wardBeds]) => (
                    <div key={wardName} className="bg-white rounded-[24px] lg:rounded-[32px] p-5 lg:p-8 shadow-sm border border-slate-200 overflow-hidden">
                        <h3 className="text-lg lg:text-xl font-black text-slate-800 mb-5 lg:mb-6 border-b border-slate-100 pb-3 lg:pb-4 uppercase tracking-tight">
                            {wardName}
                        </h3>
                        
                        {/* Grid adapts to all screen sizes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                            {wardBeds.map(bed => (
                                <div key={bed.bed_id} className={`p-4 lg:p-5 rounded-[20px] lg:rounded-[24px] border transition-all duration-300 hover:shadow-md ${
                                    bed.status === 'Available' ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300' :
                                    bed.status === 'Occupied' ? 'border-blue-200 bg-blue-50/50 hover:border-blue-300' :
                                    'border-orange-200 bg-orange-50/50 hover:border-orange-300'
                                }`}>
                                    <div className="flex justify-between items-start mb-3 lg:mb-4">
                                        <div className={`p-2 lg:p-2.5 rounded-xl lg:rounded-2xl ${
                                            bed.status === 'Available' ? 'bg-emerald-100 text-emerald-600' :
                                            bed.status === 'Occupied' ? 'bg-blue-100 text-blue-600' :
                                            'bg-orange-100 text-orange-600'
                                        }`}>
                                            <BedDouble size={18} className="lg:w-[22px] lg:h-[22px]" />
                                        </div>
                                        <span className="text-[10px] lg:text-xs font-black text-slate-400 bg-white px-2 lg:px-2.5 py-1 rounded-md shadow-sm border border-slate-100">
                                            #{bed.bed_number}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-4 lg:mb-5 h-10">
                                        <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Status</p>
                                        <p className={`text-sm lg:text-base font-black truncate ${
                                            bed.status === 'Available' ? 'text-emerald-700' :
                                            bed.status === 'Occupied' ? 'text-blue-700' :
                                            'text-orange-700'
                                        }`}>
                                            {bed.status === 'Occupied' ? bed.patient_name : bed.status}
                                        </p>
                                    </div>

                                    {/* Action Buttons based on State Machine */}
                                    <div className="mt-auto border-t border-slate-900/5 pt-3 lg:pt-4">
                                        {bed.status === 'Available' && (
                                            <button onClick={() => handleAdmit(bed.bed_id)} className="w-full py-2.5 lg:py-3 bg-emerald-600 text-white text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-xl lg:rounded-2xl shadow-sm hover:bg-emerald-700 active:scale-95 transition-all">
                                                Admit Patient
                                            </button>
                                        )}
                                        {bed.status === 'Occupied' && (
                                            <button onClick={() => handleStateChange(bed.bed_id, 'discharge')} className="w-full py-2.5 lg:py-3 bg-slate-800 text-white text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-xl lg:rounded-2xl shadow-sm hover:bg-slate-900 active:scale-95 transition-all">
                                                Discharge
                                            </button>
                                        )}
                                        {bed.status === 'Maintenance' && (
                                            <button onClick={() => handleStateChange(bed.bed_id, 'clean')} className="w-full py-2.5 lg:py-3 bg-orange-500 text-white text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-xl lg:rounded-2xl shadow-sm hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                                                <CheckCircle2 size={16} className="lg:w-[18px] lg:h-[18px]" /> Mark Clean
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default Beds;