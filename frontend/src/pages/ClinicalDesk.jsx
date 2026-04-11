import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosConfig';
import { 
    Activity, ClipboardList, Thermometer, Weight, 
    User, Clock, CheckCircle2, TestTube2, Pill, 
    AlertCircle, Loader2, Stethoscope, Syringe, Search, FlaskConical
} from 'lucide-react';

// --- ICD-10 DATASET (Representative Sample) ---
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

const VitalsInput = ({ label, name, icon: Icon, unit, placeholder, value, onChange }) => (
    <div className="bg-slate-50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-200 transition-all focus-within:border-blue-500 focus-within:bg-white">
        <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 lg:mb-2">
            <Icon size={12} className="text-slate-500" /> {label} {unit && <span className="lowercase font-bold text-blue-500">({unit})</span>}
        </label>
        <input 
            type="text" inputMode="decimal" placeholder={placeholder}
            className="w-full bg-transparent font-black text-slate-800 outline-none text-sm lg:text-base placeholder:text-slate-300"
            value={value} onChange={onChange}
        />
    </div>
);

const ClinicalDesk = () => {
    const [queue, setQueue] = useState([]);
    const [catalog, setCatalog] = useState([]); // Master list of lab tests
    const [activePatient, setActivePatient] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [icdSearch, setIcdSearch] = useState('');
    
    // NEW: Lab Test Selection
    const [selectedTestId, setSelectedTestId] = useState('');

    const [form, setForm] = useState({
        systolic_bp: '', diastolic_bp: '', temperature: '', weight_kg: '',
        chief_complaint: '', notes: '', diagnosis: '', prescription_notes: ''
    });

    const filteredICD = useMemo(() => {
        if (!icdSearch) return [];
        return ICD10_CODES.filter(i => 
            i.name.toLowerCase().includes(icdSearch.toLowerCase()) || 
            i.code.toLowerCase().includes(icdSearch.toLowerCase())
        ).slice(0, 8); 
    }, [icdSearch]);

    useEffect(() => {
        fetchQueue();
        fetchCatalog(); // Fetch Lab Catalog on mount
        const interval = setInterval(fetchQueue, 10000); // 10s polling
        return () => clearInterval(interval);
    }, []);

    const fetchCatalog = async () => {
        try {
            const res = await api.get('/admin/lab-catalog');
            setCatalog(res.data.filter(test => test.is_active) || []);
        } catch (err) { console.error("Catalog fetch error", err); }
    };

    const fetchQueue = async () => {
        try {
            const res = await api.get('/queue/Consultation');
            setQueue(res.data || []);
            
            // Keep active patient synced if queue updates
            if (activePatient) {
                const updated = res.data.find(q => q.queue_id === activePatient.queue_id);
                if (!updated) setActivePatient(null);
            }
        } catch (err) { console.error("Queue fetch failed", err); }
    };

    const callPatient = async (patient) => {
        try {
            // Lock the patient by marking them "In Progress"
            await api.put(`/queue/${patient.queue_id}/status`, { status: 'In Progress' });
            setActivePatient({ ...patient, status: 'In Progress' });
            
            setIcdSearch('');
            setSelectedTestId(''); // Reset lab selection
            setForm({ 
                systolic_bp: '', diastolic_bp: '', temperature: '', weight_kg: '',
                chief_complaint: '', notes: '', diagnosis: '', prescription_notes: '' 
            });
            fetchQueue();
        } catch (err) { alert("Failed to call patient."); }
    };

    const selectDiagnosis = (item) => {
        setForm({ ...form, diagnosis: `${item.code} - ${item.name}` });
        setIcdSearch('');
    };

    const handleFinalize = async (destination) => {
        if (!form.chief_complaint) return alert("Please enter a Chief Complaint.");
        
        // VALIDATION: Require test selection if sending to Lab
        if (destination === 'Laboratory' && !selectedTestId) {
            return alert("Please select a Lab Test from the catalog before sending the patient to the Laboratory.");
        }

        setIsLoading(true);
        
        try {
            // 1. Save the Medical Record
            await api.post('/medical-records', {
                patient_id: parseInt(activePatient.patient_id),
                chief_complaint: form.chief_complaint,
                diagnosis: form.diagnosis,
                treatment_plan: form.notes, 
                prescription_notes: form.prescription_notes,
                systolic_bp: parseInt(form.systolic_bp) || null,
                diastolic_bp: parseInt(form.diastolic_bp) || null,
                temperature: parseFloat(form.temperature) || null,
                weight_kg: parseFloat(form.weight_kg) || null
            });

            // 2. Order Lab Test (If applicable)
            if (destination === 'Laboratory' && selectedTestId) {
                await api.post('/lab/request', {
                    patient_id: activePatient.patient_id,
                    doctor_id: 1, // Default prototype ID
                    catalog_id: parseInt(selectedTestId)
                });
            }

            // 3. Route Patient (if not discharging)
            if (destination !== 'Complete') {
                let routingNotes = `Referral: ${form.diagnosis}`;
                if (destination === 'Pharmacy') routingNotes = form.prescription_notes;
                
                // Add context for the Lab Tech
                if (destination === 'Laboratory') {
                    const testName = catalog.find(t => t.catalog_id === parseInt(selectedTestId))?.test_name;
                    routingNotes = `Requested: ${testName}. Notes: ${form.notes}`;
                }

                await api.post('/queue', { 
                    patient_id: activePatient.patient_id, 
                    department: destination, 
                    acuity_level: activePatient.acuity_level, 
                    notes: routingNotes 
                });
            }

            // 4. Clear from Doctor's Desk
            await api.put(`/queue/${activePatient.queue_id}/status`, { status: 'Completed' });
            
            alert(`Patient ${destination === 'Complete' ? 'Discharged' : `sent to ${destination}`}.`);
            setActivePatient(null);
            fetchQueue();
        } catch (err) { 
            alert("Submission failed. Check connection."); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const getAcuityStyle = (level) => {
        if (level === 1) return "bg-red-50 text-red-600 border-red-200";
        if (level === 2) return "bg-amber-50 text-amber-600 border-amber-200";
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto min-h-[85vh] flex flex-col lg:flex-row gap-4 lg:gap-6 font-sans animate-in fade-in duration-500">
            
            {/* --- QUEUE SIDEBAR --- */}
            <div className="w-full lg:w-[360px] xl:w-[400px] bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0 h-[350px] lg:h-[85vh]">
                <div className="p-5 lg:p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 text-[11px] lg:text-xs uppercase tracking-widest flex items-center gap-2">
                        <div className="p-1.5 lg:p-2 bg-indigo-50 text-indigo-600 rounded-lg lg:rounded-xl"><Stethoscope size={16} className="lg:w-5 lg:h-5"/></div>
                        Waiting Room
                    </h3>
                    <span className="bg-slate-800 text-white text-[9px] lg:text-[10px] px-2.5 py-1 rounded-lg font-black shadow-sm">{queue.length} Waiting</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 custom-scrollbar bg-slate-50/30">
                    {queue.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                            <User size={48} strokeWidth={1} className="mb-3 lg:mb-4 lg:w-16 lg:h-16 opacity-30" />
                            <p className="text-xs lg:text-sm font-medium text-slate-500">Queue is empty</p>
                        </div>
                    ) : queue.map((entry) => (
                        <button 
                            key={entry.queue_id}
                            onClick={() => callPatient(entry)}
                            className={`w-full p-4 lg:p-5 rounded-xl lg:rounded-2xl border text-left transition-all group ${activePatient?.queue_id === entry.queue_id ? 'bg-slate-800 border-slate-800 text-white shadow-xl' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
                        >
                            <div className="flex justify-between items-start mb-2 lg:mb-3">
                                <span className={`text-[9px] lg:text-[10px] font-black px-2 py-0.5 lg:py-1 rounded-md uppercase tracking-widest border ${activePatient?.queue_id === entry.queue_id ? 'bg-white/20 border-white/20 text-white' : getAcuityStyle(entry.acuity_level)}`}>
                                    {entry.acuity_level === 1 ? 'Emergency' : entry.acuity_level === 2 ? 'Urgent' : 'Standard'}
                                </span>
                                <span className={`text-[10px] lg:text-xs font-bold flex items-center gap-1 ${activePatient?.queue_id === entry.queue_id ? 'text-slate-300' : 'text-slate-400'}`}>
                                    <Clock size={12} className="lg:w-3.5 lg:h-3.5"/> {new Date(entry.joined_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <p className="font-black text-sm lg:text-base uppercase truncate leading-tight">{entry.patient_name}</p>
                            <p className={`text-[10px] lg:text-xs font-bold mt-1 ${activePatient?.queue_id === entry.queue_id ? 'text-slate-300' : 'text-slate-500'}`}>
                                {entry.outpatient_no} • {entry.sex}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- WORKSPACE --- */}
            <div className="flex-1 bg-white rounded-[24px] lg:rounded-[40px] border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[600px] lg:h-[85vh]">
                {!activePatient ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-16 lg:py-0 bg-slate-50/20">
                        <Stethoscope size={64} strokeWidth={1} className="lg:w-20 lg:h-20 mb-3 lg:mb-4 opacity-50"/>
                        <h2 className="text-xl lg:text-2xl font-bold text-slate-400">Clinical Desk</h2>
                        <p className="font-medium mt-2 text-sm">Select a patient from the queue to begin.</p>
                    </div>
                ) : (
                    <>
                        <header className="p-5 lg:p-8 border-b border-slate-100 flex flex-col xl:flex-row xl:justify-between xl:items-start gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1.5 lg:mb-2">
                                    <span className="bg-emerald-100 text-emerald-700 text-[9px] lg:text-[10px] font-black px-2 lg:px-2.5 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                                        <Activity size={12}/> In Progress
                                    </span>
                                </div>
                                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight">{activePatient.patient_name}</h2>
                                <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">OP Number: {activePatient.outpatient_no}</p>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-5 lg:p-10 grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-10 bg-slate-50/30 custom-scrollbar">
                            
                            {/* LAB ALERT (If returning from lab) */}
                            {activePatient.notes && activePatient.notes.includes("LAB") && (
                                <div className="xl:col-span-4 bg-purple-50 border border-purple-200 p-4 lg:p-5 rounded-xl lg:rounded-2xl text-purple-800 text-xs lg:text-sm font-bold flex items-start gap-3 shadow-sm">
                                    <TestTube2 size={20} className="mt-0.5 shrink-0 text-purple-600" />
                                    <span className="leading-relaxed whitespace-pre-wrap">{activePatient.notes}</span>
                                </div>
                            )}
                            
                            {/* VITALS */}
                            <div className="xl:col-span-1 space-y-4 lg:space-y-6">
                                <h4 className="text-[10px] lg:text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-1.5 lg:gap-2 ml-1"><Activity size={12} className="lg:w-3.5 lg:h-3.5 text-blue-600"/> Baseline Vitals</h4>
                                <div className="space-y-3 lg:space-y-4 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-1 gap-3 xl:gap-0">
                                    <div className="col-span-2 sm:col-span-4 xl:col-span-1 bg-slate-50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
                                        <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 lg:mb-3 block">Blood Pressure (mmHg)</label>
                                        <div className="flex items-center gap-2 lg:gap-4">
                                            <input type="text" placeholder="Sys" className="w-1/2 bg-transparent font-black text-base lg:text-lg text-slate-800 outline-none" value={form.systolic_bp} onChange={e => setForm({...form, systolic_bp: e.target.value})} />
                                            <span className="text-slate-300 text-lg lg:text-xl font-light">/</span>
                                            <input type="text" placeholder="Dia" className="w-1/2 bg-transparent font-black text-base lg:text-lg text-slate-800 outline-none" value={form.diastolic_bp} onChange={e => setForm({...form, diastolic_bp: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2 xl:col-span-1"><VitalsInput label="Temp" name="temperature" icon={Thermometer} unit="°C" value={form.temperature} onChange={e => setForm({...form, temperature: e.target.value})} /></div>
                                    <div className="col-span-1 sm:col-span-2 xl:col-span-1"><VitalsInput label="Weight" name="weight_kg" icon={Weight} unit="kg" value={form.weight_kg} onChange={e => setForm({...form, weight_kg: e.target.value})} /></div>
                                </div>
                            </div>

                            {/* CLINICAL FORM */}
                            <div className="xl:col-span-3 space-y-6 lg:space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                    <div className="space-y-2 lg:space-y-3">
                                        <label className="text-[10px] lg:text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Chief Complaint <span className="text-red-500">*</span></label>
                                        <textarea placeholder="Primary reason for visit..." className="w-full p-4 lg:p-6 bg-white border border-slate-200 rounded-[20px] lg:rounded-[24px] text-xs lg:text-sm min-h-[100px] lg:min-h-[120px] outline-none focus:border-blue-500 font-medium shadow-sm resize-none" 
                                            value={form.chief_complaint} onChange={e => setForm({...form, chief_complaint: e.target.value})} />
                                    </div>

                                    {/* SEARCHABLE ICD-10 */}
                                    <div className="space-y-2 lg:space-y-3 relative">
                                        <label className="text-[10px] lg:text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1 flex justify-between">
                                            <span>ICD-10 Diagnosis</span><span className="text-blue-500 text-[8px] lg:text-[9px] lowercase">Search by code or name</span>
                                        </label>
                                        <div className="relative group">
                                            <Search size={14} className="absolute left-3.5 lg:left-4 top-3.5 lg:top-4 text-slate-400 lg:w-4 lg:h-4" />
                                            <input type="text" placeholder="Search Malaria, Hypertension..." className="w-full pl-10 lg:pl-12 pr-4 lg:pr-6 py-3 lg:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                                                value={form.diagnosis || icdSearch} onChange={(e) => { setIcdSearch(e.target.value); setForm({...form, diagnosis: e.target.value}); }} />
                                            
                                            {filteredICD.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl lg:rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                    {filteredICD.map(item => (
                                                        <button key={item.code} onClick={() => selectDiagnosis(item)} className="w-full text-left px-4 lg:px-5 py-3 lg:py-4 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 group">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-black text-blue-600 text-[10px] lg:text-xs tracking-tighter bg-blue-50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md">{item.code}</span>
                                                                <span className="text-[10px] lg:text-xs font-bold text-slate-700 group-hover:text-blue-800 text-right ml-2">{item.name}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 lg:space-y-3">
                                    <label className="text-[10px] lg:text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1 flex items-center gap-1.5 lg:gap-2"><ClipboardList size={12} className="text-slate-400 lg:w-3.5 lg:h-3.5"/> Examination Notes</label>
                                    <textarea placeholder="Physical exam results, systemic review..." className="w-full p-5 lg:p-8 bg-white border border-slate-200 rounded-[20px] lg:rounded-[32px] text-xs lg:text-sm min-h-[100px] lg:min-h-[140px] outline-none focus:border-blue-500 shadow-sm leading-relaxed" 
                                        value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                                </div>

                                {/* NEW: DIAGNOSTICS / LAB ORDERS */}
                                <div className="bg-purple-50/50 p-5 lg:p-6 rounded-[20px] lg:rounded-[24px] border border-purple-100">
                                    <h4 className="text-[10px] lg:text-[11px] font-black text-purple-900 uppercase tracking-widest flex items-center gap-1.5 lg:gap-2 mb-4">
                                        <FlaskConical size={16} className="text-purple-500"/> Order Diagnostics
                                    </h4>
                                    <div>
                                        <label className="block text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Select Lab Test from Catalog</label>
                                        <select
                                            value={selectedTestId}
                                            onChange={(e) => setSelectedTestId(e.target.value)}
                                            className="w-full p-3 lg:p-4 bg-white border border-slate-200 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                                        >
                                            <option value="">-- Choose a specific test to order --</option>
                                            {catalog.map(test => (
                                                <option key={test.catalog_id} value={test.catalog_id}>
                                                    {test.test_name} (KSH {(test.base_price || 0).toFixed(2)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-5 lg:p-8 rounded-[24px] lg:rounded-[40px] shadow-2xl border border-slate-800">
                                    <label className="text-[9px] lg:text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 lg:mb-6 flex items-center gap-1.5 lg:gap-2"><Syringe size={14} className="text-blue-400 lg:w-4 lg:h-4"/> Clinical Orders & Rx</label>
                                    <textarea placeholder="Medication, Dosage..." className="w-full p-4 lg:p-6 bg-slate-800/50 border border-slate-700 rounded-xl lg:rounded-2xl text-xs lg:text-sm min-h-[100px] lg:min-h-[120px] outline-none focus:border-blue-500 transition-all text-white font-mono leading-relaxed" 
                                        value={form.prescription_notes} onChange={e => setForm({...form, prescription_notes: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* ROUTING / FINALIZE ACTIONS */}
                        <div className="p-5 lg:p-6 bg-white border-t border-slate-200/60 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                            <span className="block text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 lg:mb-3">Post-Consultation Routing</span>
                            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                                <button 
                                    onClick={() => handleFinalize('Laboratory')}
                                    disabled={isLoading}
                                    className="flex-1 py-3 lg:py-4 bg-purple-50 text-purple-700 font-bold rounded-xl lg:rounded-2xl hover:bg-purple-100 transition-colors border border-purple-200/50 flex items-center justify-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs disabled:opacity-50"
                                >
                                    <TestTube2 size={14} className="lg:w-4 lg:h-4"/> Send to Lab
                                </button>
                                <button 
                                    onClick={() => handleFinalize('Pharmacy')}
                                    disabled={isLoading}
                                    className="flex-1 py-3 lg:py-4 bg-emerald-50 text-emerald-700 font-bold rounded-xl lg:rounded-2xl hover:bg-emerald-100 transition-colors border border-emerald-200/50 flex items-center justify-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs disabled:opacity-50"
                                >
                                    <Pill size={14} className="lg:w-4 lg:h-4"/> Send to Pharmacy
                                </button>
                                <button 
                                    onClick={() => handleFinalize('Complete')}
                                    disabled={isLoading}
                                    className="flex-1 lg:flex-[1.5] py-3 lg:py-4 bg-slate-800 text-white font-black rounded-xl lg:rounded-2xl hover:bg-slate-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs uppercase tracking-widest disabled:opacity-50 disabled:transform-none"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin lg:w-[18px] lg:h-[18px]" /> : <CheckCircle2 size={16} className="lg:w-[18px] lg:h-[18px]"/>} 
                                    {isLoading ? 'Processing...' : 'Discharge Patient'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ClinicalDesk;