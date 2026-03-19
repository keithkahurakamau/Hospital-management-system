import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Plus } from 'lucide-react';

const MedicalRecords = () => {
    const [records, setRecords] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [patients, setPatients] = useState([]);
    
    // UPDATED: State now perfectly matches the new Pydantic Schema
    const [newRecord, setNewRecord] = useState({
        diagnosis_code: '', 
        clinical_notes: '',
        treatment_plan: '', 
        bp_string: '', // We will parse this into sys/dia before sending
        temperature: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [recRes, patRes] = await Promise.all([
                    api.get('/records'), // FIX: Removed trailing slash
                    api.get('/patients/')
                ]);
                setRecords(recRes.data);
                setPatients(patRes.data);
            } catch (err) {
                console.error("Failed to load clinical data", err);
            }
        };
        loadData();
    }, []);

    const handleSubmitRecord = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return alert("Select a patient first");
        
        // Parse the "120/80" string into integers for the database
        const [sys, dia] = newRecord.bp_string.split('/');
        
        const payload = {
            patient_id: parseInt(selectedPatient),
            systolic_bp: sys ? parseInt(sys.trim()) : null,
            diastolic_bp: dia ? parseInt(dia.trim()) : null,
            temperature: newRecord.temperature ? parseFloat(newRecord.temperature) : null,
            diagnosis_code: newRecord.diagnosis_code,
            clinical_notes: newRecord.clinical_notes,
            treatment_plan: newRecord.treatment_plan
        };

        try {
            await api.post('/records', payload); // FIX: Removed trailing slash
            alert("Clinical Record Saved Successfully.");
            window.location.reload(); 
        } catch (err) {
            console.error(err);
            alert("Failed to save record. Check console for details.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-[#1B2559]">Clinical Workstation</h1>
                <p className="text-[#A3AED0] text-sm mt-1">Centralized Digital Health Records</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Patient Selector & Vitals */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
                        <h3 className="font-bold flex items-center gap-2 mb-4 text-[#1B2559]">
                            <Plus size={18} className="text-blue-500" /> New Consultation
                        </h3>
                        <select 
                            required
                            className="w-full p-3 bg-slate-50 rounded-xl mb-4 outline-none border border-slate-100 text-sm font-medium text-slate-600 focus:border-blue-500"
                            onChange={(e) => setSelectedPatient(e.target.value)}
                            value={selectedPatient}
                        >
                            <option value="">Select Patient...</option>
                            {patients.map(p => (
                                <option key={p.patient_id} value={p.patient_id}>
                                    {p.first_name} {p.last_name} (ID: {p.id_number || 'N/A'})
                                </option>
                            ))}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="BP (e.g. 120/80)" className="p-3 text-xs font-medium bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500" 
                                onChange={e => setNewRecord({...newRecord, bp_string: e.target.value})} />
                            <input type="number" step="0.1" placeholder="Temp (°C)" className="p-3 text-xs font-medium bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500" 
                                onChange={e => setNewRecord({...newRecord, temperature: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* 2. Diagnosis & Treatment Entry */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmitRecord} className="bg-white p-8 rounded-3xl border border-slate-50 shadow-sm space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-widest">ICD-10 Code</label>
                                <input type="text" placeholder="e.g. J01.9" className="w-full mt-2 p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-sm font-medium" 
                                    onChange={e => setNewRecord({...newRecord, diagnosis_code: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-widest">Clinical Notes</label>
                                <input type="text" placeholder="General observations..." className="w-full mt-2 p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-sm font-medium" 
                                    onChange={e => setNewRecord({...newRecord, clinical_notes: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-widest">Treatment Plan & Prescriptions</label>
                            <textarea required placeholder="Medications, dosages, follow-up instructions..." className="w-full mt-2 p-4 bg-slate-50 border border-slate-100 rounded-xl h-24 outline-none focus:ring-2 ring-blue-500/20 text-sm font-medium" 
                                onChange={e => setNewRecord({...newRecord, treatment_plan: e.target.value})} />
                        </div>
                        
                        <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
                            Save to Patient History
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MedicalRecords;