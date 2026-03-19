import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { BedDouble, User, AlertCircle, CheckCircle2 } from 'lucide-react';

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

    if (loading) return <div className="text-[#A3AED0] font-medium p-8">Loading Bed Matrix...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-[#1B2559]">Bed Allocation & Admissions</h2>
                    <p className="text-sm text-[#A3AED0] mt-1">Real-time ward telemetry and capacity management</p>
                </div>
                
                {/* Global Patient Selector for Admissions */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                    <User size={18} className="text-[#A3AED0] ml-2" />
                    <select 
                        className="bg-transparent outline-none text-sm font-medium text-[#1B2559] w-64 p-1"
                        value={selectedPatient}
                        onChange={(e) => setSelectedPatient(e.target.value)}
                    >
                        <option value="">Select Patient for Admission...</option>
                        {patients.map(p => (
                            <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {Object.keys(wards).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-50">
                    <p className="text-[#A3AED0] font-medium">No wards configured. Run the initial seeding script.</p>
                </div>
            ) : (
                Object.entries(wards).map(([wardName, wardBeds]) => (
                    <div key={wardName} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-50">
                        <h3 className="text-lg font-bold text-[#1B2559] mb-6 border-b border-slate-50 pb-4">{wardName}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {wardBeds.map(bed => (
                                <div key={bed.bed_id} className={`p-5 rounded-2xl border transition-all ${
                                    bed.status === 'Available' ? 'border-emerald-100 bg-emerald-50/30' :
                                    bed.status === 'Occupied' ? 'border-blue-100 bg-blue-50/30' :
                                    'border-orange-100 bg-orange-50/30'
                                }`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2 rounded-lg ${
                                            bed.status === 'Available' ? 'bg-emerald-100 text-emerald-600' :
                                            bed.status === 'Occupied' ? 'bg-blue-100 text-blue-600' :
                                            'bg-orange-100 text-orange-600'
                                        }`}>
                                            <BedDouble size={20} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">#{bed.bed_number}</span>
                                    </div>
                                    
                                    <div className="mb-4 h-10">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                                        <p className={`font-bold ${
                                            bed.status === 'Available' ? 'text-emerald-700' :
                                            bed.status === 'Occupied' ? 'text-blue-700' :
                                            'text-orange-700'
                                        }`}>
                                            {bed.status === 'Occupied' ? bed.patient_name : bed.status}
                                        </p>
                                    </div>

                                    {/* Action Buttons based on State Machine */}
                                    {bed.status === 'Available' && (
                                        <button onClick={() => handleAdmit(bed.bed_id)} className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors">
                                            Admit Patient
                                        </button>
                                    )}
                                    {bed.status === 'Occupied' && (
                                        <button onClick={() => handleStateChange(bed.bed_id, 'discharge')} className="w-full py-2 bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-slate-900 transition-colors">
                                            Discharge
                                        </button>
                                    )}
                                    {bed.status === 'Maintenance' && (
                                        <button onClick={() => handleStateChange(bed.bed_id, 'clean')} className="w-full py-2 bg-orange-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                                            <CheckCircle2 size={14} /> Mark Clean
                                        </button>
                                    )}
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