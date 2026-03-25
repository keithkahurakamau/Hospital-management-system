import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Users, Clock, Activity, Stethoscope, TestTube, Pill, CheckCircle2, ChevronRight } from 'lucide-react';

const Doctors = () => {
    const [queue, setQueue] = useState([]);
    const [activePatient, setActivePatient] = useState(null);
    const [notes, setNotes] = useState('');
    const [prescription, setPrescription] = useState('');

    // Poll the queue rapidly to simulate real-time handoff if WS isn't fully linked
    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 3000); 
        return () => clearInterval(interval);
    }, []);

    const fetchQueue = async () => {
        try {
            const res = await api.get('/queue/Consultation');
            setQueue(res.data);
            if (activePatient) {
                const updated = res.data.find(q => q.queue_id === activePatient.queue_id);
                if (!updated) setActivePatient(null);
            }
        } catch (err) { console.error("Queue fetch error", err); }
    };

    const callPatient = async (patient) => {
        try {
            await api.put(`/queue/${patient.queue_id}/status`, { status: 'In Progress' });
            setActivePatient({ ...patient, status: 'In Progress' });
            fetchQueue();
        } catch (err) { alert("Failed to call patient."); }
    };

    const routePatient = async (destination) => {
        if (!activePatient) return;
        try {
            // 1. Hand off to the next department
            if (destination !== 'Complete') {
                await api.post('/queue', {
                    patient_id: activePatient.patient_id,
                    department: destination,
                    acuity_level: activePatient.acuity_level,
                    notes: destination === 'Pharmacy' ? prescription : notes
                });
            }

            // 2. Clear from Doctor's desk
            await api.put(`/queue/${activePatient.queue_id}/status`, { status: 'Completed' });
            
            alert(`Patient ${destination === 'Complete' ? 'Discharged' : `sent to ${destination}`}.`);
            setActivePatient(null);
            setNotes('');
            setPrescription('');
            fetchQueue();
        } catch (err) {
            alert(`Routing failed: ${err.response?.data?.detail || err.message}`);
        }
    };

    const getAcuityStyle = (level) => {
        if (level === 1) return "bg-red-50 text-red-600 border-red-200";
        if (level === 2) return "bg-amber-50 text-amber-600 border-amber-200";
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
    };

    return (
        <div className="max-w-[1400px] mx-auto h-[88vh] flex gap-6 font-sans">
            
            {/* LEFT PANE: Waiting Room (Live Queue) */}
            <div className="w-[380px] bg-white rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-black text-slate-800 flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Stethoscope size={18}/></div>
                        Waiting Room
                    </h2>
                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {queue.length} Waiting
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
                    {queue.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                            <Users size={48} strokeWidth={1} className="mb-4" />
                            <p className="text-sm font-medium text-slate-500">Queue is empty</p>
                        </div>
                    ) : (
                        queue.map(p => (
                            <div 
                                key={p.queue_id} 
                                onClick={() => callPatient(p)}
                                className={`p-4 rounded-[20px] border cursor-pointer transition-all duration-200 group
                                    ${activePatient?.queue_id === p.queue_id 
                                        ? 'bg-slate-800 border-slate-800 shadow-md text-white' 
                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${activePatient?.queue_id === p.queue_id ? 'bg-white/20 border-white/20 text-white' : getAcuityStyle(p.acuity_level)}`}>
                                        {p.acuity_level === 1 ? 'Emergency' : p.acuity_level === 2 ? 'Urgent' : 'Standard'}
                                    </span>
                                    <span className={`text-xs font-bold flex items-center gap-1 ${activePatient?.queue_id === p.queue_id ? 'text-slate-300' : 'text-slate-400'}`}>
                                        <Clock size={12}/> {new Date(p.joined_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <h3 className={`font-bold text-sm ${activePatient?.queue_id === p.queue_id ? 'text-white' : 'text-slate-800'}`}>
                                    {p.patient_name}
                                </h3>
                                <p className={`text-xs font-medium mt-1 ${activePatient?.queue_id === p.queue_id ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {p.outpatient_no} • {p.sex}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Consultation Desk */}
            <div className="flex-1 bg-white rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden">
                {!activePatient ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                        <Stethoscope size={64} strokeWidth={1} className="mb-4" />
                        <h2 className="text-xl font-bold text-slate-400">Consultation Desk</h2>
                        <p className="text-sm mt-2">Select a patient from the queue to begin.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-end bg-white">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                                        <Activity size={12}/> In Progress
                                    </span>
                                </div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight">{activePatient.patient_name}</h1>
                                <p className="text-slate-500 font-medium text-sm mt-1">{activePatient.outpatient_no} | {activePatient.sex}</p>
                            </div>
                        </div>

                        <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/30">
                            {/* Alert if returned from Lab */}
                            {activePatient.notes && activePatient.notes.includes("Lab") && (
                                <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-purple-800 text-sm font-bold flex items-start gap-2">
                                    <TestTube size={18} className="mt-0.5" />
                                    <span>Lab Technician Note: {activePatient.notes}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Clinical Notes & Diagnosis</label>
                                <textarea 
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-slate-400 transition-all shadow-sm min-h-[160px] resize-none"
                                    placeholder="Enter chief complaints, history of present illness, and diagnosis..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Prescriptions & Medical Orders</label>
                                <textarea 
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-slate-400 transition-all shadow-sm min-h-[120px] resize-none"
                                    placeholder="E.g. Amoxicillin 500mg TDS x 5 Days"
                                    value={prescription}
                                    onChange={(e) => setPrescription(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        {/* Routing Actions */}
                        <div className="p-6 bg-white border-t border-slate-200/60 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Post-Consultation Routing</span>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => routePatient('Laboratory')}
                                    className="flex-1 py-3.5 bg-purple-50 text-purple-700 font-bold rounded-xl hover:bg-purple-100 transition-colors border border-purple-200/50 flex items-center justify-center gap-2 text-xs"
                                >
                                    <TestTube size={16}/> Send to Lab
                                </button>
                                <button 
                                    onClick={() => routePatient('Pharmacy')}
                                    className="flex-1 py-3.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200/50 flex items-center justify-center gap-2 text-xs"
                                >
                                    <Pill size={16}/> Send to Pharmacy
                                </button>
                                <button 
                                    onClick={() => routePatient('Complete')}
                                    className="flex-[1.5] py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 hover:-translate-y-0.5 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                >
                                    <CheckCircle2 size={16}/> Discharge Patient
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Doctors;