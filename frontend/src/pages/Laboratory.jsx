import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
    FileText, Clock, Activity, TestTube2, 
    CheckCircle2, Stethoscope, AlertCircle, ChevronRight, Droplet, Box
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const Laboratory = () => {
    const [queue, setQueue] = useState([]);
    const [catalog, setCatalog] = useState([]); // Master catalog to show required items
    const [activePatient, setActivePatient] = useState(null);
    
    // Form States
    const [testResults, setTestResults] = useState('');
    const [bloodGroup, setBloodGroup] = useState('Unknown');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCatalog(); // Get required items info
        fetchQueue();
        const interval = setInterval(fetchQueue, 5000); // 5s High-frequency polling
        return () => clearInterval(interval);
    }, []);

    const fetchCatalog = async () => {
        try {
            const res = await api.get('/admin/lab-catalog');
            setCatalog(res.data || []);
        } catch (err) { console.error("Catalog fetch error", err); }
    };

    const fetchQueue = async () => {
        try {
            const res = await api.get('/lab/');
            // Filter only pending tests for the workbench
            const pending = res.data.filter(t => t.status === 'Pending');
            setQueue(pending);
            
            // Keep active patient synced
            if (activePatient) {
                const updated = pending.find(q => q.test_id === activePatient.test_id);
                if (!updated) setActivePatient(null);
            }
        } catch (err) { console.error("Lab Queue fetch error", err); }
    };

    const selectPatient = (patient) => {
        setActivePatient(patient);
        setTestResults('');
        setBloodGroup(patient.blood_group || 'Unknown');
    };

    const handleUpdateBloodGroup = async (newGroup) => {
        setBloodGroup(newGroup);
        if (!activePatient) return;
        try {
            await api.patch(`/lab/patient/${activePatient.patient_id}/blood-group`, { blood_group: newGroup });
        } catch (err) {
            console.error("Failed to update blood group", err);
        }
    };

    const submitResults = async () => {
        if (!activePatient || !testResults) return;
        setIsSubmitting(true);
        try {
            // Submit results and automatically trigger inventory deduction
            await api.patch(`/lab/${activePatient.test_id}/complete`, { 
                result_summary: testResults,
                lab_tech_user_id: 1 // Defaulting for prototype
            });
            
            alert(`Results submitted for ${activePatient.patient_name}. Inventory deducted successfully.`);
            setActivePatient(null);
            setTestResults('');
            fetchQueue();
        } catch (err) {
            alert(`Submission error: ${err.response?.data?.detail || "System offline"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to find the required items for the currently active test
    const getRequiredItemsForActiveTest = () => {
        if (!activePatient) return [];
        const catalogItem = catalog.find(c => c.test_name === activePatient.test_name);
        return catalogItem?.required_items || [];
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] flex flex-col lg:flex-row gap-4 lg:gap-6 font-sans animate-in fade-in duration-500">
            
            {/* LEFT PANE: Lab Test Queue */}
            <div className="w-full lg:w-[380px] xl:w-[400px] bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0 h-[350px] lg:h-[85vh]">
                <div className="p-5 lg:p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-black text-slate-800 flex items-center gap-2 uppercase text-[10px] lg:text-xs tracking-widest">
                        <div className="p-1.5 lg:p-2 bg-purple-50 text-purple-600 rounded-lg lg:rounded-xl"><TestTube2 size={16} className="lg:w-[18px] lg:h-[18px]"/></div>
                        Pending Tests
                    </h2>
                    <span className="bg-slate-800 text-white text-[9px] lg:text-[10px] font-bold px-2 lg:px-2.5 py-1 rounded-full shadow-sm">
                        {queue.length} Tests
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 lg:space-y-3 custom-scrollbar bg-slate-50/30">
                    {queue.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-500">
                            <FileText size={40} strokeWidth={1} className="mb-2 lg:w-[48px] lg:h-[48px]" />
                            <p className="text-[9px] lg:text-[10px] font-black uppercase">No active requests</p>
                        </div>
                    ) : (
                        queue.map(p => (
                            <div 
                                key={p.test_id} 
                                onClick={() => selectPatient(p)}
                                className={`p-4 rounded-[16px] lg:rounded-[20px] border cursor-pointer transition-all duration-300 group
                                    ${activePatient?.test_id === p.test_id 
                                        ? 'bg-slate-800 border-slate-800 shadow-lg text-white' 
                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[8px] lg:text-[9px] font-black px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md uppercase tracking-widest border ${activePatient?.test_id === p.test_id ? 'bg-white/10 border-white/20 text-white' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                        Test #{p.test_id}
                                    </span>
                                    <span className={`text-[9px] lg:text-[10px] font-bold flex items-center gap-1 ${activePatient?.test_id === p.test_id ? 'text-slate-400' : 'text-slate-400'}`}>
                                        <Clock size={10} className="lg:w-3 lg:h-3"/> {p.date.split('-')[1]}
                                    </span>
                                </div>
                                <h3 className={`font-bold text-xs lg:text-sm uppercase tracking-tight truncate ${activePatient?.test_id === p.test_id ? 'text-white' : 'text-slate-800'}`}>
                                    {p.patient_name}
                                </h3>
                                <div className="flex items-center justify-between mt-1.5 lg:mt-2">
                                    <p className={`text-[9px] lg:text-[10px] font-black ${activePatient?.test_id === p.test_id ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        {p.test_name}
                                    </p>
                                    <ChevronRight size={14} className={activePatient?.test_id === p.test_id ? 'text-white' : 'text-slate-200 opacity-0 group-hover:opacity-100'} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Lab Workbench */}
            <div className="flex-1 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative min-h-[500px] lg:h-[85vh]">
                {!activePatient ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50/20 py-16 lg:py-0">
                        <Activity size={64} strokeWidth={1} className="mb-3 lg:mb-4 opacity-50 lg:w-[80px] lg:h-[80px]" />
                        <h2 className="text-xl lg:text-2xl font-black text-slate-400 uppercase tracking-tighter">Workbench Idle</h2>
                        <p className="font-medium text-xs lg:text-sm mt-1.5 lg:mt-2 px-6 text-center">Select a test request from the queue to start processing findings.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-5 lg:p-8 border-b border-slate-100 bg-white">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="flex items-center gap-3 lg:gap-5">
                                    <div className="w-10 h-10 lg:w-14 lg:h-14 bg-purple-50 rounded-xl lg:rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                                        <TestTube2 size={24} className="lg:w-[28px] lg:h-[28px]"/>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 lg:gap-2 mb-0.5 lg:mb-1">
                                            <span className="bg-emerald-500 w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full animate-pulse"></span>
                                            <span className="text-[9px] lg:text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Analysis</span>
                                        </div>
                                        <h1 className="text-xl lg:text-3xl font-black text-slate-800 uppercase tracking-tight truncate">{activePatient.patient_name}</h1>
                                        <p className="text-slate-500 font-bold text-[10px] lg:text-xs uppercase tracking-widest mt-0.5 lg:mt-1">Requested by {activePatient.doctor_name}</p>
                                    </div>
                                </div>
                                
                                {/* Blood Group Updater */}
                                <div className="bg-slate-50 p-2 lg:p-3 rounded-xl border border-slate-200">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1"><Droplet size={10}/> Blood Group</p>
                                    <select 
                                        value={bloodGroup} 
                                        onChange={(e) => handleUpdateBloodGroup(e.target.value)}
                                        className="bg-white border border-slate-200 text-sm font-bold text-red-500 px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-red-100"
                                    >
                                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-5 lg:p-8 overflow-y-auto space-y-5 lg:space-y-8 bg-slate-50/30 custom-scrollbar flex flex-col xl:flex-row gap-6">
                            
                            {/* Left Column: Form */}
                            <div className="flex-1 space-y-6">
                                <div className="bg-blue-50 border border-blue-100 p-4 lg:p-6 rounded-[20px] shadow-sm relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[9px] lg:text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Stethoscope size={12}/> Test Ordered
                                        </p>
                                        <p className="text-lg font-black text-blue-900">{activePatient.test_name}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Laboratory Findings & Results Summary</label>
                                    <textarea 
                                        className="w-full p-4 lg:p-6 bg-white border border-slate-200 rounded-[20px] text-xs lg:text-sm font-medium leading-relaxed focus:outline-none focus:border-slate-400 transition-all shadow-sm min-h-[250px] resize-none placeholder:text-slate-300"
                                        placeholder="Enter test parameters (e.g., Hb, WBC), analytical findings, and interpretations..."
                                        value={testResults}
                                        onChange={(e) => setTestResults(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            {/* Right Column: Inventory Deduction Notice */}
                            <div className="w-full xl:w-72 shrink-0">
                                <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-sm sticky top-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                        <Box size={14}/> Required Materials
                                    </p>
                                    <p className="text-xs text-slate-500 mb-4">Submitting this test will automatically deduct the following items from hospital inventory:</p>
                                    
                                    <div className="space-y-2">
                                        {getRequiredItemsForActiveTest().length === 0 ? (
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">No materials linked</p>
                                            </div>
                                        ) : (
                                            getRequiredItemsForActiveTest().map((item, idx) => (
                                                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-700">{item.item_name}</span>
                                                    <span className="text-[10px] font-black text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{item.quantity_required} unit(s)</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-5 lg:p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                            <button 
                                onClick={submitResults}
                                disabled={!testResults || isSubmitting}
                                className="w-full py-3.5 lg:py-4 bg-slate-800 text-white font-black text-[10px] lg:text-xs uppercase tracking-widest rounded-xl lg:rounded-2xl shadow-lg hover:bg-slate-900 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Activity className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                {isSubmitting ? 'Processing...' : 'Submit Findings & Deduct Inventory'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Laboratory;