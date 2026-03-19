import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { FlaskConical, Clock, CheckCircle2, TestTube2, User } from 'lucide-react';

const Laboratory = () => {
    const [tests, setTests] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form states
    const [newTest, setNewTest] = useState({ patient_id: '', test_name: '' });
    const [activeResultId, setActiveResultId] = useState(null);
    const [resultText, setResultText] = useState('');

    const loadData = async () => {
        try {
            const [labRes, patRes] = await Promise.all([
                api.get('/lab/'),
                api.get('/patients/')
            ]);
            setTests(labRes.data);
            setPatients(patRes.data);
        } catch (err) {
            console.error("Failed to load lab data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleRequestTest = async (e) => {
        e.preventDefault();
        try {
            await api.post('/lab/request', newTest);
            setNewTest({ patient_id: '', test_name: '' });
            loadData();
        } catch (err) {
            alert("Failed to request test");
        }
    };

    const handleCompleteTest = async (testId) => {
        if (!resultText) return alert("Please enter the result summary first.");
        try {
            await api.patch(`/lab/${testId}/complete`, { result_summary: resultText });
            setActiveResultId(null);
            setResultText('');
            loadData();
        } catch (err) {
            alert("Failed to save results");
        }
    };

    const pendingTests = tests.filter(t => t.status === 'Pending');
    const completedTests = tests.filter(t => t.status === 'Completed');

    if (loading) return <div className="text-[#A3AED0] p-8">Loading Laboratory Systems...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-[#1B2559]">Laboratory & Diagnostics</h2>
                    <p className="text-sm text-[#A3AED0] mt-1">Manage test requests and clinical results</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Request New Test Panel */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleRequestTest} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm space-y-5">
                        <h3 className="font-bold flex items-center gap-2 text-[#1B2559]">
                            <TestTube2 size={18} className="text-blue-500" /> Request Lab Test
                        </h3>
                        <select 
                            required
                            className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 text-sm font-medium"
                            value={newTest.patient_id}
                            onChange={e => setNewTest({...newTest, patient_id: e.target.value})}
                        >
                            <option value="">Select Patient...</option>
                            {patients.map(p => (
                                <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name}</option>
                            ))}
                        </select>
                        <select 
                            required
                            className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 text-sm font-medium"
                            value={newTest.test_name}
                            onChange={e => setNewTest({...newTest, test_name: e.target.value})}
                        >
                            <option value="">Select Test Type...</option>
                            <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                            <option value="Basic Metabolic Panel (BMP)">Basic Metabolic Panel (BMP)</option>
                            <option value="Lipid Panel">Lipid Panel</option>
                            <option value="Urinalysis">Urinalysis</option>
                            <option value="MRI Scan">MRI Scan</option>
                        </select>
                        <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">
                            Submit Order
                        </button>
                    </form>
                </div>

                {/* 2. Lab Queue */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Pending Queue */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-50 shadow-sm">
                        <h3 className="text-lg font-bold text-[#1B2559] mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-orange-500"/> Pending Analysis ({pendingTests.length})
                        </h3>
                        <div className="space-y-4">
                            {pendingTests.length === 0 ? <p className="text-sm text-[#A3AED0]">No pending tests in queue.</p> : null}
                            {pendingTests.map(test => (
                                <div key={test.test_id} className="p-4 border border-orange-100 bg-orange-50/30 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-[#1B2559]">{test.test_name}</p>
                                        <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                                            <User size={12}/> {test.patient_name} • Ordered by {test.doctor_name}
                                        </p>
                                    </div>
                                    
                                    {activeResultId === test.test_id ? (
                                        <div className="flex-1 flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Enter result findings..." 
                                                className="flex-1 p-2 text-sm border border-slate-200 rounded-lg outline-none"
                                                value={resultText}
                                                onChange={e => setResultText(e.target.value)}
                                                autoFocus
                                            />
                                            <button onClick={() => handleCompleteTest(test.test_id)} className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600">Save</button>
                                            <button onClick={() => setActiveResultId(null)} className="px-3 py-2 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg">Cancel</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setActiveResultId(test.test_id)} className="self-start md:self-center px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50">
                                            Input Results
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Completed Log */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-50 shadow-sm opacity-80">
                        <h3 className="text-lg font-bold text-[#1B2559] mb-4 flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-emerald-500"/> Recent Results
                        </h3>
                        <div className="space-y-3">
                            {completedTests.map(test => (
                                <div key={test.test_id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-[#1B2559] text-sm">{test.test_name} <span className="text-[#A3AED0] font-medium ml-2">- {test.patient_name}</span></p>
                                        <span className="text-[10px] font-bold text-slate-400">{test.date}</span>
                                    </div>
                                    <p className="text-sm font-medium text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                        {test.result_summary}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Laboratory;