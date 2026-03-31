import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    User, Phone, MapPin, Activity, Clock, FileText, 
    Pill, TestTube2, ArrowLeft, Calendar, ShieldAlert, 
    HeartPulse, Thermometer, Weight, Printer, AlertCircle, Stethoscope, History
} from 'lucide-react';
import api from '../api/axiosConfig';

// Helper function to calculate age from DOB
const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const PatientProfile = () => {
    const { id } = useParams(); // Grabs the ID from the URL (e.g., /patients/1042)
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('timeline');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Live Backend Data States
    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchPatientData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // Fetch both the patient profile and their medical records simultaneously
                const [profileRes, recordsRes] = await Promise.all([
                    api.get(`/patients/${id}`),
                    api.get(`/medical-records/${id}`) // FIXED: Pointing to the correct backend route
                ]);

                setPatient(profileRes.data);
                // FIXED: Extracting the specific 'encounters' array from your backend's response payload
                setHistory(recordsRes.data.encounters || []);
            } catch (err) {
                console.error("Failed to load patient profile:", err);
                setError(err.response?.data?.detail || "Could not retrieve patient data. Please check your connection.");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchPatientData();
        }
    }, [id]);

    if (isLoading) return (
        <div className="flex h-[85vh] items-center justify-center flex-col text-slate-400">
            <Activity className="animate-spin mb-4" size={40}/>
            <p className="font-bold text-xs uppercase tracking-widest">Retrieving Electronic Health Record...</p>
        </div>
    );

    if (error) return (
        <div className="flex h-[85vh] items-center justify-center flex-col text-slate-500">
            <AlertCircle className="mb-4 text-red-400" size={48} strokeWidth={1.5}/>
            <h2 className="text-xl font-black text-slate-700 mb-2">Record Unavailable</h2>
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => navigate('/patients')} className="mt-6 px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors text-xs uppercase tracking-widest">
                Return to Registry
            </button>
        </div>
    );

    if (!patient) return null;

    // Safety fallbacks in case the backend returns null for these arrays
    const allergies = patient.allergies || [];
    const chronicConditions = patient.chronic_conditions || [];

    return (
        <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] flex flex-col gap-4 lg:gap-6 font-sans animate-in fade-in duration-500">
            
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-5 lg:p-6 rounded-[24px] lg:rounded-[32px] border border-slate-200/60 shadow-sm shrink-0 gap-4">
                <button onClick={() => navigate('/patients')} className="flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-xs lg:text-sm bg-slate-50 px-4 py-3 sm:py-2.5 rounded-xl w-full sm:w-fit">
                    <ArrowLeft size={16}/> <span className="sm:hidden">Back</span><span className="hidden sm:inline">Back to Registry</span>
                </button>
                <div className="flex gap-2 sm:gap-3">
                    <button onClick={() => window.print()} className="flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex">
                        <Printer size={14} className="lg:w-4 lg:h-4"/> <span className="hidden sm:inline">Print Record</span><span className="sm:hidden">Print</span>
                    </button>
                    <button className="flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex">
                        Edit Bio-Data
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:overflow-hidden h-auto lg:h-[calc(85vh-100px)]">
                
                {/* LEFT PANE: Sticky Patient Profile Card */}
                <div className="w-full lg:w-[380px] xl:w-[420px] bg-slate-900 rounded-[24px] lg:rounded-[32px] border border-slate-800 shadow-xl flex flex-col overflow-hidden shrink-0 h-fit lg:h-full lg:overflow-y-auto custom-scrollbar text-white relative">
                    {/* Decorative Background */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
                    
                    <div className="p-6 lg:p-8 relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-800 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-blue-400 shadow-lg">
                                <User size={32} className="lg:w-10 lg:h-10"/>
                            </div>
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Active File</span>
                        </div>
                        
                        <h1 className="text-2xl lg:text-3xl font-black tracking-tight">{patient.surname}, {patient.other_names}</h1>
                        <p className="text-slate-400 font-mono text-xs lg:text-sm mt-1 mb-6">{patient.outpatient_no}</p>

                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="bg-slate-800/50 p-3 lg:p-4 rounded-xl border border-slate-700/50">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Sex / Age</p>
                                <p className="font-bold text-sm lg:text-base">{patient.sex || 'N/A'}, {calculateAge(patient.date_of_birth)}y</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 lg:p-4 rounded-xl border border-slate-700/50">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Blood Group</p>
                                <p className="font-bold text-sm lg:text-base text-red-400">{patient.blood_type || 'Unknown'}</p>
                            </div>
                        </div>

                        {/* Medical Alerts */}
                        <div className="mb-8 space-y-5">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2.5"><ShieldAlert size={12}/> Known Allergies</p>
                                {allergies.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {allergies.map((a, idx) => <span key={idx} className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold">{a}</span>)}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600 font-bold italic">No known allergies</p>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2.5"><Activity size={12}/> Chronic Conditions</p>
                                {chronicConditions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {chronicConditions.map((c, idx) => <span key={idx} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold">{c}</span>)}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600 font-bold italic">No chronic conditions</p>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-slate-800 pt-6 space-y-4">
                            <div className="flex items-center gap-3 text-xs lg:text-sm">
                                <Phone size={16} className="text-slate-500 lg:w-[18px] lg:h-[18px]"/>
                                <span className="font-medium text-slate-300">{patient.telephone_1 || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs lg:text-sm">
                                <MapPin size={16} className="text-slate-500 lg:w-[18px] lg:h-[18px]"/>
                                <span className="font-medium text-slate-300">{patient.town || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs lg:text-sm">
                                <Calendar size={16} className="text-slate-500 lg:w-[18px] lg:h-[18px]"/>
                                <span className="font-medium text-slate-300">Registered: {new Date(patient.registered_date || new Date()).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="mt-8 bg-slate-800/30 p-4 lg:p-5 rounded-2xl border border-slate-700/50">
                            <p className="text-[9px] lg:text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Emergency Contact (NOK)</p>
                            <p className="font-bold text-sm text-slate-200">{patient.nok_name || 'Not Provided'}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{patient.nok_contact}</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE: Clinical History Timeline */}
                <div className="flex-1 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 lg:p-6 border-b border-slate-100 flex gap-2 lg:gap-4 overflow-x-auto custom-scrollbar bg-slate-50/50 shrink-0">
                        <button onClick={() => setActiveTab('timeline')} className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl font-black text-[10px] lg:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'timeline' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                            Visit Timeline
                        </button>
                        <button onClick={() => setActiveTab('labs')} className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl font-black text-[10px] lg:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'labs' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                            Lab Reports
                        </button>
                        <button onClick={() => setActiveTab('prescriptions')} className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl font-black text-[10px] lg:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'prescriptions' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                            Prescriptions
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 lg:p-10 custom-scrollbar">
                        {activeTab === 'timeline' && (
                            <div className="max-w-4xl">
                                <h3 className="text-lg lg:text-xl font-black text-slate-800 mb-6 lg:mb-8">Clinical History</h3>
                                
                                {history.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                        <History size={48} className="mb-4 text-slate-400" />
                                        <p className="font-bold text-slate-500 text-sm">No previous visits recorded.</p>
                                    </div>
                                ) : (
                                    <div className="relative border-l-2 border-slate-100 ml-3 lg:ml-4 space-y-8 lg:space-y-12">
                                        {history.map((visit, index) => (
                                            <div key={visit.record_id || index} className="relative pl-6 lg:pl-10">
                                                {/* Timeline Node */}
                                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
                                                
                                                {/* Date Badge */}
                                                <div className="mb-3">
                                                    <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest">
                                                        {new Date(visit.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>

                                                {/* Visit Card */}
                                                <div className="bg-white border border-slate-200 rounded-[20px] lg:rounded-[24px] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                                    <div className="p-4 lg:p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                                        <div>
                                                            <h4 className="font-black text-slate-800 text-sm lg:text-base">{visit.diagnosis || 'General Consultation'}</h4>
                                                            <p className="text-[10px] lg:text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5"><Stethoscope size={14} className="lg:w-4 lg:h-4"/> {visit.doctor || 'Attending Physician'}</p>
                                                        </div>
                                                        <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2 py-1 rounded-md w-fit shrink-0">ID: {visit.record_id || 'N/A'}</span>
                                                    </div>

                                                    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                                                        {visit.complaint && (
                                                            <div>
                                                                <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Chief Complaint</p>
                                                                <p className="text-xs lg:text-sm font-medium text-slate-700 leading-relaxed">{visit.complaint}</p>
                                                            </div>
                                                        )}

                                                        {/* Inline Vitals (Only show if at least one vital exists) */}
                                                        {visit.vitals && (visit.vitals.bp || visit.vitals.temp || visit.vitals.weight) && (
                                                            <div className="flex flex-wrap gap-2 lg:gap-4">
                                                                {visit.vitals.bp && visit.vitals.bp !== "N/A" && (
                                                                    <div className="flex items-center gap-1.5 lg:gap-2 bg-slate-50 border border-slate-100 px-2.5 lg:px-3 py-1.5 rounded-lg">
                                                                        <HeartPulse size={14} className="text-red-400 lg:w-4 lg:h-4"/> <span className="text-[10px] lg:text-xs font-bold text-slate-600">{visit.vitals.bp}</span>
                                                                    </div>
                                                                )}
                                                                {visit.vitals.temp && visit.vitals.temp !== "N/A" && (
                                                                    <div className="flex items-center gap-1.5 lg:gap-2 bg-slate-50 border border-slate-100 px-2.5 lg:px-3 py-1.5 rounded-lg">
                                                                        <Thermometer size={14} className="text-orange-400 lg:w-4 lg:h-4"/> <span className="text-[10px] lg:text-xs font-bold text-slate-600">{visit.vitals.temp}</span>
                                                                    </div>
                                                                )}
                                                                {visit.vitals.weight && visit.vitals.weight !== "N/A" && (
                                                                    <div className="flex items-center gap-1.5 lg:gap-2 bg-slate-50 border border-slate-100 px-2.5 lg:px-3 py-1.5 rounded-lg">
                                                                        <Weight size={14} className="text-blue-400 lg:w-4 lg:h-4"/> <span className="text-[10px] lg:text-xs font-bold text-slate-600">{visit.vitals.weight}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {visit.prescription && (
                                                            <div className="bg-emerald-50/50 p-3 lg:p-4 rounded-xl border border-emerald-100">
                                                                <p className="text-[9px] lg:text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 lg:mb-2"><Pill size={12} className="lg:w-3.5 lg:h-3.5"/> Rx Issued</p>
                                                                <p className="text-[10px] lg:text-xs font-mono font-bold text-slate-700 whitespace-pre-line leading-relaxed">{visit.prescription}</p>
                                                            </div>
                                                        )}

                                                        {visit.treatment && (
                                                            <div className="bg-blue-50/50 p-3 lg:p-4 rounded-xl border border-blue-100">
                                                                <p className="text-[9px] lg:text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 lg:mb-2"><Activity size={12} className="lg:w-3.5 lg:h-3.5"/> Treatment Plan</p>
                                                                <p className="text-[10px] lg:text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line">{visit.treatment}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab !== 'timeline' && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 py-20 lg:py-0">
                                <FileText size={64} strokeWidth={1} className="mb-4 lg:w-20 lg:h-20" />
                                <p className="font-bold text-xs lg:text-sm text-center px-4">Dedicated {activeTab} view coming soon.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;