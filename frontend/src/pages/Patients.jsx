import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, MoreVertical, Users, Upload, Settings, UserCog, 
    Activity, History, Ban, X, Stethoscope, TestTube, Pill, 
    Banknote, Clock, AlertCircle, Loader2, UserPlus, MapPin, Phone
} from 'lucide-react';
import api from '../api/axiosConfig';

const KENYAN_TOWNS = [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", 
    "Kitale", "Garissa", "Kakamega", "Machakos", "Meru", "Nyeri", "Ruiru", 
    "Athi River", "Karuri", "Kilifi", "Ongata Rongai", "Mumias", "Bomet", 
    "Molo", "Ngong", "Naivasha", "Vihiga", "Narok", "Kericho", "Embu", 
    "Nyahururu", "Nanyuki", "Isiolo", "Webuye", "Busia", "Mandera", "Wajir", 
    "Marsabit", "Lodwar", "Lamu", "Kapsabet", "Voi", "Bungoma", "Migori"
].sort();

const DEPARTMENTS = [
    { id: 'Triage', name: 'Triage & Vitals', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'Consultation', name: 'Doctor\'s Office', icon: Stethoscope, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { id: 'Laboratory', name: 'Laboratory', icon: TestTube, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'Pharmacy', name: 'Pharmacy', icon: Pill, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'Billing', name: 'Cashier / Billing', icon: Banknote, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' }
];

const Patients = () => {
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [globalDropdown, setGlobalDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state mirroring the registry database schema
    const [formData, setFormData] = useState({
        surname: '', other_names: '', sex: '', date_of_birth: '',
        id_type: 'National ID', id_number: '', telephone_1: '', telephone_2: '',
        email: '', postal_address: '', postal_code: '', occupation: '',
        residence: '', town: '', reference_number: '', nationality: 'Kenyan',
        nok_name: '', nok_relationship: '', nok_contact: '', notes: ''
    });

    // Queue Modal State
    const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
    const [queueingPatient, setQueueingPatient] = useState(null);
    const [queueData, setQueueData] = useState({ department: '', acuity_level: 3 });

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/patients/');
            setPatients(response.data || []);
        } catch (error) {
            console.error("Failed to fetch patients:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Real-time Search Logic
    const filteredPatients = useMemo(() => {
        return patients.filter(p => 
            p.surname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.other_names?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.outpatient_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.telephone_1?.includes(searchQuery)
        );
    }, [patients, searchQuery]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSavePatient = async () => {
        if (!formData.surname || !formData.other_names || !formData.telephone_1) {
            return alert("Please fill in all required fields marked with *");
        }

        setIsSubmitting(true);
        try {
            await api.post('/patients/', formData);
            setIsModalOpen(false);
            fetchPatients();
            setFormData({
                surname: '', other_names: '', sex: '', date_of_birth: '',
                id_type: 'National ID', id_number: '', telephone_1: '', telephone_2: '',
                email: '', postal_address: '', postal_code: '', occupation: '',
                residence: '', town: '', reference_number: '', nationality: 'Kenyan',
                nok_name: '', nok_relationship: '', nok_contact: '', notes: ''
            });
        } catch (error) {
            alert(`Error: ${error.response?.data?.detail || "Failed to register patient"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openQueueModal = (patient) => {
        setQueueingPatient(patient);
        setQueueData({ department: '', acuity_level: 3 }); 
        setIsQueueModalOpen(true);
        setActiveDropdown(null);
    };

    const submitToQueue = async () => {
        if (!queueData.department) return alert("Please select a target department.");
        
        try {
            await api.post('/queue', {
                patient_id: queueingPatient.patient_id || queueingPatient.id,
                department: queueData.department,
                acuity_level: queueData.acuity_level
            });
            setIsQueueModalOpen(false);
            alert(`${queueingPatient.surname} successfully routed.`);
        } catch (error) {
            alert(`Error: ${error.response?.data?.detail || "Failed to queue patient"}`);
        }
    };

    const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-inner shadow-slate-50";
    const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1";

    return (
        <div className="max-w-[1400px] mx-auto min-h-[85vh] flex flex-col font-sans animate-in fade-in duration-500">
            
            {/* Header & Global Actions */}
            <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Users className="text-blue-600" size={32}/>
                        Patient Registry
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Manage Master Patient Index (MPI) and Routing</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search OP No, Name, or Phone..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-80 pl-11 pr-4 py-3 bg-slate-50/80 rounded-2xl outline-none border border-slate-200 text-sm font-bold focus:border-blue-400 focus:bg-white transition-all"
                        />
                    </div>
                    
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="py-3 px-6 bg-blue-600 text-white font-black rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 text-xs uppercase tracking-widest"
                    >
                        <UserPlus size={18} strokeWidth={3}/> New Patient
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="p-6 pl-8">Outpatient No</th>
                                <th className="p-6">Patient Name</th>
                                <th className="p-6">Sex / DOB</th>
                                <th className="p-6">Primary Contact</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-center pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-600" size={40} />
                                        <p className="mt-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Patient Index...</p>
                                    </td>
                                </tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-16 text-center text-slate-400 font-medium">
                                        <div className="flex flex-col items-center justify-center">
                                            <Users size={48} strokeWidth={1} className="mb-4 opacity-30" />
                                            <p className="font-bold">No records matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map(patient => (
                                    <tr key={patient.patient_id || patient.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-6 pl-8 text-xs font-mono font-black text-blue-600">{patient.outpatient_no}</td>
                                        <td className="p-6">
                                            <div className="font-black text-slate-800">{patient.surname}, {patient.other_names}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{patient.occupation || 'No Occupation Recorded'}</div>
                                        </td>
                                        <td className="p-6 text-xs font-bold text-slate-500">
                                            <span className={`px-2 py-0.5 rounded ${patient.sex === 'Male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>{patient.sex}</span>
                                            <span className="text-slate-300 mx-2">|</span> 
                                            {patient.date_of_birth}
                                        </td>
                                        <td className="p-6 text-xs font-bold text-slate-600">
                                            <div className="flex items-center gap-2"><Phone size={14} className="text-slate-300"/> {patient.telephone_1}</div>
                                            <div className="flex items-center gap-2 mt-1"><MapPin size={14} className="text-slate-300"/> {patient.town}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 text-[10px] uppercase tracking-widest font-black rounded-md">Registered</span>
                                        </td>
                                        <td className="p-6 text-center pr-8 relative">
                                            <button onClick={() => setActiveDropdown(activeDropdown === (patient.patient_id || patient.id) ? null : (patient.patient_id || patient.id))} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                                <MoreVertical size={18} />
                                            </button>
                                            
                                            {activeDropdown === (patient.patient_id || patient.id) && (
                                                <div className="absolute right-12 top-10 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 py-2 text-left overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                    <button 
                                                        onClick={() => openQueueModal(patient)} 
                                                        className="w-full text-left px-5 py-3 text-sm font-black text-blue-600 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Activity size={16} /> Route to Queue
                                                    </button>
                                                    <div className="border-t border-slate-100 my-1"></div>
                                                    <button className="w-full text-left px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"><History size={14} className="text-slate-400"/> Visit History</button>
                                                    <button className="w-full text-left px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"><UserCog size={14} className="text-slate-400"/> Edit Bio-data</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* REGISTRATION MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-[1200px] rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
                        <div className="flex justify-between items-end p-8 bg-white border-b border-slate-100">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Patient Registration</h2>
                                <p className="text-sm font-medium text-slate-500 mt-2">Initialize new Master Patient Index (MPI) record</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/30">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="space-y-5 bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm h-fit">
                                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-5">Demographics</h3>
                                    <div>
                                        <label className={labelClass}>Surname <span className="text-red-500">*</span></label>
                                        <input type="text" name="surname" value={formData.surname} onChange={handleInputChange} placeholder="E.g. Kamau" className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Other Names <span className="text-red-500">*</span></label>
                                        <input type="text" name="other_names" value={formData.other_names} onChange={handleInputChange} placeholder="E.g. Keith" className={inputClass} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Sex</label>
                                            <select name="sex" value={formData.sex} onChange={handleInputChange} className={inputClass}>
                                                <option value="">Select...</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>DOB</label>
                                            <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5 bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm h-fit">
                                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-5">Contact Details</h3>
                                    <div>
                                        <label className={labelClass}>Primary Phone <span className="text-red-500">*</span></label>
                                        <input type="text" name="telephone_1" value={formData.telephone_1} onChange={handleInputChange} placeholder="07xx xxx xxx" className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Town / City <span className="text-red-500">*</span></label>
                                        <input type="text" name="town" list="kenya-towns" value={formData.town} onChange={handleInputChange} placeholder="Select Town..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Occupation</label>
                                        <input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="Occupation..." className={inputClass} />
                                    </div>
                                </div>

                                <div className="space-y-5 bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm h-fit">
                                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-5">Next of Kin</h3>
                                    <div>
                                        <label className={labelClass}>NOK Full Name</label>
                                        <input type="text" name="nok_name" value={formData.nok_name} onChange={handleInputChange} placeholder="Full Name..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Relationship</label>
                                        <input type="text" name="nok_relationship" value={formData.nok_relationship} onChange={handleInputChange} placeholder="Spouse, Parent..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>NOK Phone</label>
                                        <input type="text" name="nok_contact" value={formData.nok_contact} onChange={handleInputChange} placeholder="Phone..." className={inputClass} />
                                    </div>
                                </div>

                                <div className="space-y-5 flex flex-col h-full">
                                    <div className="bg-slate-800 p-6 rounded-[24px] shadow-sm text-white">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-3 mb-4">Registry Info</h3>
                                        <div className="space-y-3 text-xs font-bold">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400">Status:</span>
                                                <span className="text-emerald-400 uppercase tracking-widest text-[10px]">Ready</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400">File No:</span>
                                                <span className="bg-slate-700/50 px-2 py-1 rounded text-blue-300 font-mono">NEW_RECORD</span>
                                            </div>
                                        </div>
                                    </div>
                                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} className={`${inputClass} flex-1 min-h-[150px] resize-none`} placeholder="Administrative notes..."></textarea>
                                </div>

                                <datalist id="kenya-towns">
                                    {KENYAN_TOWNS.map(town => <option key={town} value={town} />)}
                                </datalist>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 font-bold text-xs transition-colors shadow-sm">Cancel</button>
                            <button onClick={handleSavePatient} disabled={isSubmitting} className="px-10 py-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 disabled:bg-slate-300 active:scale-95 font-black text-xs uppercase tracking-widest transition-all flex gap-2 items-center">
                                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Users size={16}/>}
                                {isSubmitting ? 'Registering...' : 'Create Patient Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QUEUE MODAL (Route to Queue) */}
            {isQueueModalOpen && queueingPatient && (
                <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
                        <div className="p-8 border-b border-slate-100">
                            <h2 className="text-2xl font-black text-slate-800">Queue Patient</h2>
                            <p className="text-xs font-mono font-bold text-blue-600 mt-1 uppercase">{queueingPatient.outpatient_no} — {queueingPatient.surname}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className={labelClass}>Select Destination</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {DEPARTMENTS.map(dept => {
                                        const Icon = dept.icon;
                                        const isSelected = queueData.department === dept.id;
                                        return (
                                            <button 
                                                key={dept.id}
                                                onClick={() => setQueueData(prev => ({ ...prev, department: dept.id }))}
                                                className={`p-4 rounded-[20px] border text-left flex flex-col gap-3 transition-all ${isSelected ? `border-blue-600 ring-2 ring-blue-600 bg-blue-50/50 shadow-md` : `border-slate-200 hover:border-slate-300 hover:bg-slate-50`}`}
                                            >
                                                <div className={`p-2 rounded-xl w-fit ${dept.bg} ${dept.color} border ${dept.border}`}><Icon size={18} /></div>
                                                <span className="text-xs font-black text-slate-700">{dept.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Acuity Level</label>
                                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[14px]">
                                    {[1, 2, 3].map(lvl => (
                                        <button 
                                            key={lvl}
                                            onClick={() => setQueueData(prev => ({ ...prev, acuity_level: lvl }))}
                                            className={`flex-1 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all ${queueData.acuity_level === lvl ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {lvl === 1 ? 'Critical' : lvl === 2 ? 'Urgent' : 'Routine'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setIsQueueModalOpen(false)} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs">Cancel</button>
                            <button onClick={submitToQueue} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl shadow-md font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">Route Patient →</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Patients;