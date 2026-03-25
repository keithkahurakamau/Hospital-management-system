import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosConfig';
import { 
    Users, Activity, ClipboardList, Thermometer, 
    Weight, HeartPulse, User, Clock, CheckCircle2, 
    TestTube2, Pill, AlertCircle, History, Loader2,
    Stethoscope, Syringe, Search
} from 'lucide-react';

// --- ICD-10 DATASET (Representative Sample - Expandable) ---
const ICD10_CODES = [
    { code: "A09", name: "Infectious Gastroenteritis and Colitis" },
    { code: "A15", name: "Respiratory Tuberculosis" },
    { code: "A90", name: "Dengue Fever" },
    { code: "B20", name: "HIV Disease" },
    { code: "B50", name: "Plasmodium Falciparum Malaria" },
    { code: "B54", name: "Unspecified Malaria" },
    { code: "E11", name: "Type 2 Diabetes Mellitus" },
    { code: "I10", name: "Essential (Primary) Hypertension" },
    { code: "I11", name: "Hypertensive Heart Disease" },
    { code: "J00", name: "Acute Nasopharyngitis (Common Cold)" },
    { code: "J06", name: "Acute Upper Respiratory Infections (URTI)" },
    { code: "J18", name: "Pneumonia, Unspecified Organism" },
    { code: "J45", name: "Asthma" },
    { code: "K29", name: "Gastritis and Duodenitis" },
    { code: "L03", name: "Cellulitis" },
    { code: "M54", name: "Dorsalgia (Back Pain)" },
    { code: "N39", name: "Urinary Tract Infection (UTI)" },
    { code: "O00", name: "Ectopic Pregnancy" },
    { code: "R50", name: "Fever of Unknown Origin" },
    { code: "R51", name: "Headache" },
    { code: "U07.1", name: "COVID-19" },
].sort((a, b) => a.name.localeCompare(b.name));

// --- SUB-COMPONENTS ---

const VitalsInput = ({ label, name, icon: Icon, unit, placeholder, value, onChange }) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 transition-all focus-within:border-blue-500 focus-within:bg-white">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <Icon size={12} className="text-slate-500" /> {label} {unit && <span className="lowercase font-bold text-blue-500">({unit})</span>}
        </label>
        <input 
            type="text" 
            inputMode="decimal"
            placeholder={placeholder}
            className="w-full bg-transparent font-black text-slate-800 outline-none text-base placeholder:text-slate-300"
            value={value}
            onChange={onChange}
        />
    </div>
);

const MedicalRecords = () => {
    const [queue, setQueue] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [icdSearch, setIcdSearch] = useState('');
    
    const [form, setForm] = useState({
        systolic_bp: '', diastolic_bp: '', temperature: '', weight_kg: '',
        chief_complaint: '', notes: '', diagnosis: '', prescription_notes: ''
    });

    // ICD-10 Filtering Logic
    const filteredICD = useMemo(() => {
        if (!icdSearch) return [];
        return ICD10_CODES.filter(i => 
            i.name.toLowerCase().includes(icdSearch.toLowerCase()) || 
            i.code.toLowerCase().includes(icdSearch.toLowerCase())
        ).slice(0, 8); // Limit to top 8 results for UI cleanliness
    }, [icdSearch]);

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchQueue = async () => {
        try {
            const res = await api.get('/queue/Consultation');
            setQueue(res.data || []);
        } catch (err) { console.error("Queue fetch failed", err); }
    };

    const handleSelectPatient = (entry) => {
        setSelectedPatient(entry);
        setIcdSearch('');
        setForm({ 
            systolic_bp: '', diastolic_bp: '', temperature: '', weight_kg: '',
            chief_complaint: '', notes: '', diagnosis: '', prescription_notes: '' 
        });
    };

    const selectDiagnosis = (item) => {
        setForm({ ...form, diagnosis: `${item.code} - ${item.name}` });
        setIcdSearch('');
    };

    const handleFinalize = async (destination = 'Complete') => {
        if (!form.chief_complaint) return alert("Please enter a Chief Complaint.");
        setIsLoading(true);
        
        try {
            await api.post('/medical-records', {
                patient_id: parseInt(selectedPatient.patient_id),
                chief_complaint: form.chief_complaint,
                diagnosis: form.diagnosis,
                treatment_plan: form.notes, 
                prescription_notes: form.prescription_notes,
                systolic_bp: parseInt(form.systolic_bp) || null,
                diastolic_bp: parseInt(form.diastolic_bp) || null,
                temperature: parseFloat(form.temperature) || null,
                weight_kg: parseFloat(form.weight_kg) || null
            });

            if (destination !== 'Complete') {
                await api.post('/queue', {
                    patient_id: selectedPatient.patient_id,
                    department: destination,
                    acuity_level: selectedPatient.acuity_level,
                    notes: destination === 'Pharmacy' ? form.prescription_notes : `Referral: ${form.diagnosis}`
                });
            }

            await api.patch(`/queue/${selectedPatient.queue_id}/status?status=Completed`);
            setSelectedPatient(null);
            fetchQueue();
        } catch (err) {
            alert("Submission failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto h-[88vh] flex gap-6 font-sans animate-in fade-in duration-500">
            
            {/* --- QUEUE SIDEBAR --- */}
            <div className="w-80 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} className="text-blue-500"/> Dr's Queue
                    </h3>
                    <span className="bg-blue-600 text-white text-[10px] px-2.5 py-1 rounded-lg font-black">{queue.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {queue.map((entry) => (
                        <button 
                            key={entry.queue_id}
                            onClick={() => handleSelectPatient(entry)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedPatient?.queue_id === entry.queue_id ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 hover:border-blue-200'}`}
                        >
                            <p className="font-black text-sm uppercase truncate leading-tight">{entry.patient_name}</p>
                            <p className="text-[10px] font-bold mt-1 text-slate-400">{entry.outpatient_no} • Priority {entry.acuity_level}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- WORKSPACE --- */}
            <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {!selectedPatient ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300"><Stethoscope size={64} /><p className="font-bold mt-4">Select Patient to Begin</p></div>
                ) : (
                    <>
                        <header className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedPatient.patient_name}</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Registry: {selectedPatient.outpatient_no}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => handleFinalize('Laboratory')} className="px-5 py-3.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100">
                                    <TestTube2 size={16}/> Laboratory
                                </button>
                                <button onClick={() => handleFinalize('Pharmacy')} className="px-5 py-3.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100">
                                    <Pill size={16}/> Pharmacy
                                </button>
                                <button onClick={() => handleFinalize('Complete')} className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200">
                                    <CheckCircle2 size={18}/> Finalize Visit
                                </button>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-4 gap-10 bg-slate-50/30 custom-scrollbar">
                            
                            {/* VITALS */}
                            <div className="lg:col-span-1 space-y-6">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 ml-1"><Activity size={14} className="text-blue-600"/> Baseline Vitals</h4>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Blood Pressure (mmHg)</label>
                                        <div className="flex items-center gap-4">
                                            <input type="text" placeholder="Sys" className="w-1/2 bg-transparent font-black text-lg text-slate-800 outline-none" value={form.systolic_bp} onChange={e => setForm({...form, systolic_bp: e.target.value})} />
                                            <span className="text-slate-300 text-xl font-light">/</span>
                                            <input type="text" placeholder="Dia" className="w-1/2 bg-transparent font-black text-lg text-slate-800 outline-none" value={form.diastolic_bp} onChange={e => setForm({...form, diastolic_bp: e.target.value})} />
                                        </div>
                                    </div>
                                    <VitalsInput label="Temperature" name="temperature" icon={Thermometer} unit="°C" value={form.temperature} onChange={e => setForm({...form, temperature: e.target.value})} />
                                    <VitalsInput label="Body Weight" name="weight_kg" icon={Weight} unit="kg" value={form.weight_kg} onChange={e => setForm({...form, weight_kg: e.target.value})} />
                                </div>
                            </div>

                            {/* CLINICAL */}
                            <div className="lg:col-span-3 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Chief Complaint <span className="text-red-500">*</span></label>
                                        <textarea placeholder="Primary reason for visit..." className="w-full p-6 bg-white border border-slate-200 rounded-[24px] text-sm min-h-[120px] outline-none focus:border-blue-500 font-medium shadow-sm resize-none" 
                                            value={form.chief_complaint} onChange={e => setForm({...form, chief_complaint: e.target.value})} />
                                    </div>

                                    {/* SEARCHABLE ICD-10 COMPONENT */}
                                    <div className="space-y-3 relative">
                                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1 flex justify-between">
                                            <span>ICD-10 Diagnosis</span>
                                            <span className="text-blue-500 text-[9px] lowercase">Search by code or name</span>
                                        </label>
                                        <div className="relative group">
                                            <Search size={16} className="absolute left-4 top-4 text-slate-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Search Malaria, Hypertension..." 
                                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                                                value={form.diagnosis || icdSearch}
                                                onChange={(e) => {
                                                    setIcdSearch(e.target.value);
                                                    setForm({...form, diagnosis: e.target.value});
                                                }}
                                            />
                                            {/* Results Dropdown */}
                                            {filteredICD.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                    {filteredICD.map(item => (
                                                        <button 
                                                            key={item.code}
                                                            onClick={() => selectDiagnosis(item)}
                                                            className="w-full text-left px-5 py-4 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 group"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-black text-blue-600 text-xs tracking-tighter bg-blue-50 px-2 py-1 rounded-md">{item.code}</span>
                                                                <span className="text-xs font-bold text-slate-700 group-hover:text-blue-800">{item.name}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1 flex items-center gap-2"><ClipboardList size={14} className="text-slate-400"/> Examination & Assessment Notes</label>
                                    <textarea placeholder="Physical exam results, systemic review..." className="w-full p-8 bg-white border border-slate-200 rounded-[32px] text-sm min-h-[180px] outline-none focus:border-blue-500 shadow-sm leading-relaxed" 
                                        value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                                </div>

                                <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-slate-800">
                                    <label className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Syringe size={16} className="text-blue-400"/> Clinical Orders & Rx</label>
                                    <textarea placeholder="Medication, Lab Panels, Dosage..." className="w-full p-6 bg-slate-800/50 border border-slate-700 rounded-2xl text-sm min-h-[120px] outline-none focus:border-blue-500 transition-all text-white font-mono leading-relaxed" 
                                        value={form.prescription_notes} onChange={e => setForm({...form, prescription_notes: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MedicalRecords;