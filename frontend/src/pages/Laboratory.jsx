import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
    FileText, Clock, Activity, TestTube2, 
    CheckCircle2, Stethoscope, AlertCircle, ChevronRight 
} from 'lucide-react';

const Laboratory = () => {
    const [queue, setQueue] = useState([]);
    const [activePatient, setActivePatient] = useState(null);
    const [testResults, setTestResults] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 5000); // 5s High-frequency polling
        return () => clearInterval(interval);
    }, []);

    const fetchQueue = async () => {
        try {
            const res = await api.get('/queue/Laboratory');
            setQueue(res.data);
            
            // Keep the active patient data in sync with the queue
            if (activePatient) {
                const updated = res.data.find(q => q.queue_id === activePatient.queue_id);
                if (!updated) setActivePatient(null);
            }
        } catch (err) { 
            console.error("Lab Queue fetch error", err); 
        }
    };

    const callPatient = async (patient) => {
        try {
            await api.put(`/queue/${patient.queue_id}/status`, { status: 'Testing' });
            setActivePatient({ ...patient, status: 'Testing' });
            fetchQueue();
        } catch (err) { 
            alert("Failed to initialize sample testing."); 
        }
    };

    const submitResults = async () => {
        if (!activePatient || !testResults) return;
        
        setIsSubmitting(true);
        try {
            // 1. Hand back to Doctor with 'Urgent' status (Acuity 2)
            await api.post('/queue', {
                patient_id: activePatient.patient_id,
                department: 'Consultation',
                acuity_level: 2, 
                notes: `LAB FINDINGS: ${testResults}`
            });

            // 2. Mark this Lab session as Completed
            await api.put(`/queue/${activePatient.queue_id}/status`, { status: 'Completed' });
            
            alert(`Results submitted. ${activePatient.patient_name} routed back to Consultation.`);
            setActivePatient(null);
            setTestResults('');
            fetchQueue();
        } catch (err) {
            alert(`Submission error: ${err.response?.data?.detail || "System offline"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getAcuityStyle = (level) => {
        if (level === 1) return "bg-red-50 text-red-600 border-red-100";
        if (level === 2) return "bg-amber-50 text-amber-600 border-amber-100";
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
    };

    return (
        <div className="max-w-[1440px] mx-auto h-[85vh] flex gap-6 font-sans animate-in fade-in duration-500">
            
            {/* LEFT PANE: Lab Test Queue */}
            <div className="w-[380px] bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><TestTube2 size={18}/></div>
                        Sample Queue
                    </h2>
                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {queue.length} Pending
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
                    {queue.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-500">
                            <FileText size={48} strokeWidth={1} className="mb-2" />
                            <p className="text-[10px] font-black uppercase">No active requests</p>
                        </div>
                    ) : (
                        queue.map(p => (
                            <div 
                                key={p.queue_id} 
                                onClick={() => callPatient(p)}
                                className={`p-4 rounded-[20px] border cursor-pointer transition-all duration-300 group
                                    ${activePatient?.queue_id === p.queue_id 
                                        ? 'bg-slate-800 border-slate-800 shadow-xl text-white' 
                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${activePatient?.queue_id === p.queue_id ? 'bg-white/10 border-white/20 text-white' : getAcuityStyle(p.acuity_level)}`}>
                                        {p.acuity_level === 1 ? 'Emergency' : p.acuity_level === 2 ? 'Urgent' : 'Standard'}
                                    </span>
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${activePatient?.queue_id === p.queue_id ? 'text-slate-400' : 'text-slate-400'}`}>
                                        <Clock size={12}/> {new Date(p.joined_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <h3 className={`font-bold text-sm uppercase tracking-tight truncate ${activePatient?.queue_id === p.queue_id ? 'text-white' : 'text-slate-800'}`}>
                                    {p.patient_name}
                                </h3>
                                <div className="flex items-center justify-between mt-2">
                                    <p className={`text-[10px] font-black ${activePatient?.queue_id === p.queue_id ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {p.outpatient_no}
                                    </p>
                                    <ChevronRight size={14} className={activePatient?.queue_id === p.queue_id ? 'text-white' : 'text-slate-200 opacity-0 group-hover:opacity-100'} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Lab Workbench */}
            <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                {!activePatient ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50/20">
                        <Activity size={80} strokeWidth={1} className="mb-4 opacity-50" />
                        <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Workbench Idle</h2>
                        <p className="font-medium text-sm mt-2">Select a request from the sidebar to start processing findings.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100">
                                    <TestTube2 size={28}/>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-emerald-500 w-2 h-2 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Analysis</span>
                                    </div>
                                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{activePatient.patient_name}</h1>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{activePatient.outpatient_no} | {activePatient.sex}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-slate-50/30 custom-scrollbar">
                            {/* Doctor's Request Notes */}
                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-[24px] shadow-sm relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 text-blue-100 group-hover:scale-110 transition-transform duration-500">
                                    <Stethoscope size={100} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <AlertCircle size={14} /> Incoming Clinical Instructions
                                    </p>
                                    <p className="text-sm font-bold text-blue-900 leading-relaxed italic">
                                        "{activePatient.notes || "Standard investigative panel requested. No specific clinical notes provided."}"
                                    </p>
                                </div>
                            </div>

                            {/* Results Input */}
                            <div className="space-y-4">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Laboratory Findings & Results Summary</label>
                                <textarea 
                                    className="w-full p-6 bg-white border border-slate-200 rounded-[28px] text-sm font-medium leading-relaxed focus:outline-none focus:border-slate-400 transition-all shadow-sm min-h-[350px] resize-none placeholder:text-slate-300"
                                    placeholder="Enter test parameters (e.g., Hb, WBC), analytical findings, and interpretations..."
                                    value={testResults}
                                    onChange={(e) => setTestResults(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                            <button 
                                onClick={submitResults}
                                disabled={!testResults || isSubmitting}
                                className="w-full py-4 bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:bg-slate-900 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Activity className="animate-spin" size={16} /> : <CheckCircle2 size={16}/>}
                                {isSubmitting ? 'Processing...' : 'Verify Findings & Route to Doctor'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Laboratory;