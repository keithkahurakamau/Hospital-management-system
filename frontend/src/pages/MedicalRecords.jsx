import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Users, Activity, Save, ClipboardList, Thermometer, Weight, HeartPulse, User, Clock, CheckCircle } from 'lucide-react';

const MedicalRecords = () => {
    const [queue, setQueue] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [form, setForm] = useState({
        systolic: '', diastolic: '', temp: '', weight: '',
        complaint: '', diagnosis: '', plan: '', prescription: ''
    });

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 15000); // Auto-refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const fetchQueue = async () => {
        try {
            const res = await api.get('/clinical/queue');
            setQueue(res.data);
        } catch (err) { console.error("Queue load failed", err); }
    };

    const handleSelectPatient = (entry) => {
        setSelectedPatient(entry);
        setForm({ systolic: '', diastolic: '', temp: '', weight: '', complaint: '', diagnosis: '', plan: '', prescription: '' });
    };

    const handleFinish = async () => {
        if (!form.complaint || !form.diagnosis) return alert("Please enter at least a complaint and diagnosis.");
        
        setIsLoading(true);
        try {
            await api.post('/clinical/submit', {
                patient_id: selectedPatient.Patient.patient_id,
                queue_id: selectedPatient.PatientQueue.queue_id,
                ...form
            });
            alert("Consultation finalized.");
            setSelectedPatient(null);
            fetchQueue();
        } catch (err) {
            alert("Failed to save record.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto h-[82vh] flex gap-6">
            
            {/* WAITING LIST SIDEBAR */}
            <div className="w-80 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-[#1B2559] flex items-center gap-2"><Clock size={18} className="text-blue-500"/> Patient Queue</h3>
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full font-black">{queue.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {queue.map((entry) => (
                        <div 
                            key={entry.PatientQueue.queue_id}
                            onClick={() => handleSelectPatient(entry)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedPatient?.PatientQueue.queue_id === entry.PatientQueue.queue_id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-50 hover:border-blue-200'}`}
                        >
                            <p className="text-[10px] font-bold opacity-60 mb-1">{entry.Patient.outpatient_no}</p>
                            <p className="font-bold text-sm truncate">{entry.Patient.surname}, {entry.Patient.other_names}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`w-2 h-2 rounded-full ${entry.PatientQueue.acuity_level === 1 ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}></span>
                                <span className="text-[10px] font-medium opacity-80 uppercase tracking-tighter">Priority: {entry.PatientQueue.acuity_level}</span>
                            </div>
                        </div>
                    ))}
                    {queue.length === 0 && <div className="text-center mt-10 text-[#A3AED0] text-sm italic">No patients in queue</div>}
                </div>
            </div>

            {/* MAIN CONSULTATION WORKSPACE */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                {selectedPatient ? (
                    <>
                        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><User size={24}/></div>
                                <div>
                                    <h2 className="text-xl font-black text-[#1B2559] uppercase tracking-tight">{selectedPatient.Patient.surname}, {selectedPatient.Patient.other_names}</h2>
                                    <p className="text-sm text-[#A3AED0] font-medium">OP No: {selectedPatient.Patient.outpatient_no} • {selectedPatient.Patient.sex}</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleFinish}
                                disabled={isLoading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:bg-slate-300"
                            >
                                <CheckCircle size={18}/> {isLoading ? 'Saving...' : 'Finish Consultation'}
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* VITALS SECTION */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Clinical Vitals</h4>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Blood Pressure (mmHg)</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input type="number" placeholder="Sys" className="w-full bg-transparent font-bold text-[#1B2559] outline-none" value={form.systolic} onChange={e => setForm({...form, systolic: e.target.value})} />
                                            <span className="text-slate-300">/</span>
                                            <input type="number" placeholder="Dia" className="w-full bg-transparent font-bold text-[#1B2559] outline-none" value={form.diastolic} onChange={e => setForm({...form, diastolic: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Thermometer size={10}/> Temp (°C)</label>
                                            <input type="number" step="0.1" placeholder="36.5" className="w-full bg-transparent font-bold text-[#1B2559] outline-none mt-1" value={form.temp} onChange={e => setForm({...form, temp: e.target.value})} />
                                        </div>
                                        <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Weight size={10}/> Weight (kg)</label>
                                            <input type="number" placeholder="70" className="w-full bg-transparent font-bold text-[#1B2559] outline-none mt-1" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CLINICAL NOTES SECTION */}
                            <div className="lg:col-span-2 space-y-6">
                                <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-widest flex items-center gap-2"><ClipboardList size={14}/> Examination & Notes</h4>
                                <div className="space-y-4">
                                    <textarea placeholder="Chief Complaint..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm min-h-[80px] focus:ring-4 focus:ring-blue-500/5 outline-none" value={form.complaint} onChange={e => setForm({...form, complaint: e.target.value})} />
                                    <textarea placeholder="Clinical Diagnosis..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm min-h-[80px] focus:ring-4 focus:ring-blue-500/5 outline-none" value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} />
                                    <textarea placeholder="Treatment Plan..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm min-h-[80px] focus:ring-4 focus:ring-blue-500/5 outline-none" value={form.plan} onChange={e => setForm({...form, plan: e.target.value})} />
                                    
                                    <div className="pt-4 border-t border-slate-100">
                                        <label className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 block">Digital Prescription</label>
                                        <textarea placeholder="E.g. Amoxicillin 500mg TDS x 5 Days..." className="w-full p-5 bg-blue-50/30 border border-blue-100 rounded-2xl text-sm min-h-[120px] focus:ring-4 focus:ring-blue-500/5 outline-none" value={form.prescription} onChange={e => setForm({...form, prescription: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-slate-400">
                        <HeartPulse size={64} className="mb-4" />
                        <h2 className="text-xl font-bold">No Active Patient</h2>
                        <p className="text-sm font-medium">Select a patient from the waiting room to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicalRecords;