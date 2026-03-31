import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // NEW IMPORT
import { 
    Search, MoreVertical, Users, UserCog, Activity, 
    History, X, Stethoscope, TestTube, Pill, 
    Banknote, Clock, AlertCircle, Loader2, UserPlus, MapPin, Phone,
    UserCircle, HeartHandshake, FileText
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

const initialFormState = {
    surname: '', other_names: '', sex: '', date_of_birth: '',
    id_type: 'National ID', id_number: '', telephone_1: '', telephone_2: '',
    email: '', postal_address: '', postal_code: '', occupation: '',
    residence: '', town: '', reference_number: '', nationality: 'Kenyan',
    nok_name: '', nok_relationship: '', nok_contact: '', notes: ''
};

const Patients = () => {
    const navigate = useNavigate(); // INSTANTIATED ROUTER HOOK
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modal & Dropdown States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Editing State
    const [formData, setFormData] = useState(initialFormState);
    const [editingPatientId, setEditingPatientId] = useState(null);

    // Queue Modal State
    const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
    const [queueingPatient, setQueueingPatient] = useState(null);
    const [queueData, setQueueData] = useState({ department: '', acuity_level: 3 });

    useEffect(() => { fetchPatients(); }, []);

    const fetchPatients = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/patients/');
            setPatients(response.data || []);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

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

    // --- NEW PATIENT TRIGGER ---
    const handleNewPatientClick = () => {
        setFormData({ ...initialFormState });
        setEditingPatientId(null);
        setIsModalOpen(true);
    };

    // --- EDIT PATIENT TRIGGER ---
    const handleEditPatientClick = (patient) => {
        setFormData({
            surname: patient.surname || '',
            other_names: patient.other_names || '',
            sex: patient.sex || '',
            date_of_birth: patient.date_of_birth || '',
            id_type: patient.id_type || 'National ID',
            id_number: patient.id_number || '',
            telephone_1: patient.telephone_1 || '',
            telephone_2: patient.telephone_2 || '',
            email: patient.email || '',
            postal_address: patient.postal_address || '',
            postal_code: patient.postal_code || '',
            occupation: patient.occupation || '',
            residence: patient.residence || '',
            town: patient.town || '',
            reference_number: patient.reference_number || '',
            nationality: patient.nationality || 'Kenyan',
            nok_name: patient.nok_name || '',
            nok_relationship: patient.nok_relationship || '',
            nok_contact: patient.nok_contact || '',
            notes: patient.notes || ''
        });
        setEditingPatientId(patient.patient_id || patient.id);
        setActiveDropdown(null); 
        setIsModalOpen(true);    
    };

    // --- SAVE / UPDATE PATIENT ---
    const handleSavePatient = async () => {
        if (!formData.surname || !formData.other_names || !formData.telephone_1) {
            return alert("Please fill in all required fields marked with *");
        }
        
        setIsSubmitting(true);
        try {
            if (editingPatientId) {
                await api.put(`/patients/${editingPatientId}`, formData);
            } else {
                await api.post('/patients/', formData);
            }
            
            setIsModalOpen(false);
            fetchPatients();
            setFormData({ ...initialFormState });
            setEditingPatientId(null);
        } catch (error) { 
            alert(`Error: ${error.response?.data?.detail || "Failed to save record"}`); 
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
        } catch (error) { alert(`Error: ${error.response?.data?.detail || "Failed to queue"}`); }
    };

    const inputClass = "w-full p-2.5 lg:p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs lg:text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300";
    const labelClass = "block text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1";

    return (
        <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] flex flex-col font-sans animate-in fade-in duration-500 gap-4 lg:gap-6">
            
            {/* Header & Global Actions */}
            <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-5 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200/60 shadow-sm gap-4 lg:gap-0 shrink-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 lg:gap-3">
                        <Users className="text-blue-600 lg:w-8 lg:h-8" size={24}/> Patient Registry
                    </h1>
                    <p className="text-slate-500 font-medium text-xs lg:text-sm mt-1">Manage Master Patient Index (MPI) and Routing</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 w-full md:w-auto">
                    <div className="relative group w-full sm:w-auto">
                        <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors lg:w-[18px] lg:h-[18px]" size={16} />
                        <input 
                            type="text" placeholder="Search OP No, Name, Phone..." 
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 lg:w-80 pl-9 lg:pl-11 pr-4 py-2.5 lg:py-3 bg-slate-50/80 rounded-xl lg:rounded-2xl outline-none border border-slate-200 text-xs lg:text-sm font-bold focus:border-blue-400 focus:bg-white transition-all"
                        />
                    </div>
                    <button 
                        onClick={handleNewPatientClick}
                        className="py-2.5 lg:py-3 px-4 lg:px-6 bg-blue-600 text-white font-black rounded-xl lg:rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 text-[10px] lg:text-xs uppercase tracking-widest shrink-0"
                    >
                        <UserPlus size={16} strokeWidth={3} className="lg:w-[18px] lg:h-[18px]"/> New Patient
                    </button>
                </div>
            </div>

            {/* Data Table Wrapper */}
            <div className="flex-1 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="flex-1 overflow-x-auto w-full custom-scrollbar">
                    <table className="w-full min-w-[800px] text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[9px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="p-4 lg:p-6 pl-6 lg:pl-8">Outpatient No</th>
                                <th className="p-4 lg:p-6">Patient Name</th>
                                <th className="p-4 lg:p-6">Sex / DOB</th>
                                <th className="p-4 lg:p-6">Primary Contact</th>
                                <th className="p-4 lg:p-6">Status</th>
                                <th className="p-4 lg:p-6 text-center pr-6 lg:pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs lg:text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-16 lg:p-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-600 lg:w-10 lg:h-10" size={32} />
                                        <p className="mt-4 text-slate-400 font-bold uppercase text-[9px] lg:text-[10px] tracking-widest">Loading Patient Index...</p>
                                    </td>
                                </tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 lg:p-16 text-center text-slate-400 font-medium">
                                        <div className="flex flex-col items-center justify-center">
                                            <Users size={40} strokeWidth={1} className="mb-3 lg:mb-4 opacity-30 lg:w-12 lg:h-12" />
                                            <p className="font-bold text-xs lg:text-sm">No records matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map(patient => (
                                    <tr key={patient.patient_id || patient.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4 lg:p-6 pl-6 lg:pl-8 text-[10px] lg:text-xs font-mono font-black text-blue-600">{patient.outpatient_no}</td>
                                        <td className="p-4 lg:p-6">
                                            <div className="font-black text-slate-800 text-xs lg:text-sm">{patient.surname}, {patient.other_names}</div>
                                            <div className="text-[9px] lg:text-[10px] text-slate-400 uppercase font-bold mt-0.5">{patient.occupation || 'No Occupation Recorded'}</div>
                                        </td>
                                        <td className="p-4 lg:p-6 text-[10px] lg:text-xs font-bold text-slate-500">
                                            <span className={`px-2 py-0.5 rounded ${patient.sex === 'Male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>{patient.sex}</span>
                                            <span className="text-slate-300 mx-1.5 lg:mx-2">|</span> 
                                            {patient.date_of_birth}
                                        </td>
                                        <td className="p-4 lg:p-6 text-[10px] lg:text-xs font-bold text-slate-600">
                                            <div className="flex items-center gap-1.5 lg:gap-2"><Phone size={12} className="text-slate-300 lg:w-3.5 lg:h-3.5"/> {patient.telephone_1}</div>
                                            <div className="flex items-center gap-1.5 lg:gap-2 mt-1"><MapPin size={12} className="text-slate-300 lg:w-3.5 lg:h-3.5"/> {patient.town}</div>
                                        </td>
                                        <td className="p-4 lg:p-6">
                                            <span className="px-2 lg:px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 text-[9px] lg:text-[10px] uppercase tracking-widest font-black rounded-md">Registered</span>
                                        </td>
                                        <td className="p-4 lg:p-6 text-center pr-6 lg:pr-8 relative">
                                            <button onClick={() => setActiveDropdown(activeDropdown === (patient.patient_id || patient.id) ? null : (patient.patient_id || patient.id))} className="p-1.5 lg:p-2 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg lg:rounded-xl transition-all shadow-sm opacity-100 lg:opacity-0 group-hover:opacity-100">
                                                <MoreVertical size={16} className="lg:w-[18px] lg:h-[18px]" />
                                            </button>
                                            
                                            {/* DROPDOWN OVERLAY FIX */}
                                            {activeDropdown === (patient.patient_id || patient.id) && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                                                    
                                                    <div className="absolute right-10 lg:right-12 top-8 lg:top-10 w-48 lg:w-56 bg-white rounded-xl lg:rounded-2xl shadow-2xl border border-slate-200 z-50 py-1.5 lg:py-2 text-left overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                        <button onClick={() => openQueueModal(patient)} className="w-full text-left px-4 lg:px-5 py-2.5 lg:py-3 text-xs lg:text-sm font-black text-blue-600 hover:bg-blue-50 flex items-center gap-2 lg:gap-3 transition-colors">
                                                            <Activity size={14} className="lg:w-4 lg:h-4"/> Route to Queue
                                                        </button>
                                                        <div className="border-t border-slate-100 my-1"></div>
                                                        <button onClick={() => handleEditPatientClick(patient)} className="w-full text-left px-4 lg:px-5 py-2.5 lg:py-3 text-[10px] lg:text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 lg:gap-3 transition-colors">
                                                            <UserCog size={12} className="text-slate-400 lg:w-3.5 lg:h-3.5"/> Edit Bio-data
                                                        </button>
                                                        <button 
                                                            onClick={() => navigate(`/patients/${patient.patient_id || patient.id}`)}
                                                            className="w-full text-left px-4 lg:px-5 py-2.5 lg:py-3 text-[10px] lg:text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 lg:gap-3 transition-colors">
                                                            <History size={12} className="text-slate-400 lg:w-3.5 lg:h-3.5"/> Full Medical History
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* REGISTRATION/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-50 w-full max-w-[1000px] rounded-[24px] lg:rounded-[32px] shadow-2xl flex flex-col max-h-[95vh] lg:max-h-[90vh] overflow-hidden border border-slate-200">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 lg:p-8 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
                            <div>
                                <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                        {editingPatientId ? <UserCog size={20}/> : <UserPlus size={20}/>}
                                    </div>
                                    {editingPatientId ? "Edit Patient Record" : "Patient Registration"}
                                </h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                    {editingPatientId ? "Update existing Master Patient Index" : "Initialize new Master Patient Index"}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors mb-1">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 lg:p-8 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                                
                                {/* Card 1: Demographics */}
                                <div className="bg-white p-6 lg:p-8 rounded-[24px] border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                                        <UserCircle size={14}/> Demographics
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Surname <span className="text-red-500">*</span></label><input type="text" name="surname" value={formData.surname} onChange={handleInputChange} placeholder="E.g. Kamau" className={inputClass} /></div>
                                        <div><label className={labelClass}>Other Names <span className="text-red-500">*</span></label><input type="text" name="other_names" value={formData.other_names} onChange={handleInputChange} placeholder="E.g. Keith" className={inputClass} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Sex</label><select name="sex" value={formData.sex} onChange={handleInputChange} className={inputClass}><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                                        <div><label className={labelClass}>Date of Birth</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} className={inputClass} /></div>
                                    </div>
                                    <div><label className={labelClass}>National ID / Passport</label><input type="text" name="id_number" value={formData.id_number} onChange={handleInputChange} placeholder="ID Number..." className={inputClass} /></div>
                                </div>

                                {/* Card 2: Contact Details */}
                                <div className="bg-white p-6 lg:p-8 rounded-[24px] border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                                        <MapPin size={14}/> Contact Details
                                    </h3>
                                    <div><label className={labelClass}>Primary Phone <span className="text-red-500">*</span></label><input type="text" name="telephone_1" value={formData.telephone_1} onChange={handleInputChange} placeholder="07xx xxx xxx" className={inputClass} /></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Town / City <span className="text-red-500">*</span></label><input type="text" name="town" list="kenya-towns" value={formData.town} onChange={handleInputChange} placeholder="Select Town..." className={inputClass} /></div>
                                        <div><label className={labelClass}>Email Address</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email..." className={inputClass} /></div>
                                    </div>
                                    <div><label className={labelClass}>Occupation</label><input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="Occupation..." className={inputClass} /></div>
                                </div>

                                {/* Card 3: Next of Kin */}
                                <div className="bg-white p-6 lg:p-8 rounded-[24px] border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                                        <HeartHandshake size={14}/> Next of Kin
                                    </h3>
                                    <div><label className={labelClass}>NOK Full Name</label><input type="text" name="nok_name" value={formData.nok_name} onChange={handleInputChange} placeholder="Full Name..." className={inputClass} /></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Relationship</label><input type="text" name="nok_relationship" value={formData.nok_relationship} onChange={handleInputChange} placeholder="Spouse, Parent..." className={inputClass} /></div>
                                        <div><label className={labelClass}>NOK Phone</label><input type="text" name="nok_contact" value={formData.nok_contact} onChange={handleInputChange} placeholder="Phone..." className={inputClass} /></div>
                                    </div>
                                </div>

                                {/* Card 4: Administrative */}
                                <div className="bg-white p-6 lg:p-8 rounded-[24px] border border-slate-200 shadow-sm flex flex-col">
                                    <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                                        <FileText size={14}/> Administrative
                                    </h3>
                                    <div className="flex gap-2 mb-4">
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-200">Status: {editingPatientId ? 'ACTIVE_FILE' : 'READY'}</span>
                                        <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-200">Record: {editingPatientId ? 'UPDATING' : 'NEW_RECORD'}</span>
                                    </div>
                                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} className={`${inputClass} flex-1 min-h-[100px] resize-none`} placeholder="Any specific administrative or triage notes prior to consultation..."></textarea>
                                </div>

                                <datalist id="kenya-towns">{KENYAN_TOWNS.map(town => <option key={town} value={town} />)}</datalist>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 lg:p-6 bg-white border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                            <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold text-xs transition-colors">Cancel</button>
                            <button onClick={handleSavePatient} disabled={isSubmitting} className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-slate-300 active:scale-95 font-black text-xs uppercase tracking-widest transition-all flex gap-2 items-center justify-center">
                                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (editingPatientId ? <UserCog size={16} /> : <UserPlus size={16} />)}
                                {isSubmitting ? 'Saving...' : (editingPatientId ? 'Save Updates' : 'Create Patient Record')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QUEUE MODAL (Route to Queue) */}
            {isQueueModalOpen && queueingPatient && (
                <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[24px] lg:rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
                        <div className="p-6 lg:p-8 border-b border-slate-100">
                            <h2 className="text-xl lg:text-2xl font-black text-slate-800">Queue Patient</h2>
                            <p className="text-[10px] lg:text-xs font-mono font-bold text-blue-600 mt-1 uppercase">{queueingPatient.outpatient_no} — {queueingPatient.surname}</p>
                        </div>

                        <div className="p-6 lg:p-8 space-y-5 lg:space-y-6">
                            <div>
                                <label className={labelClass}>Select Destination</label>
                                <div className="grid grid-cols-2 gap-2 lg:gap-3">
                                    {DEPARTMENTS.map(dept => {
                                        const Icon = dept.icon;
                                        const isSelected = queueData.department === dept.id;
                                        return (
                                            <button key={dept.id} onClick={() => setQueueData(prev => ({ ...prev, department: dept.id }))} className={`p-3 lg:p-4 rounded-[16px] lg:rounded-[20px] border text-left flex flex-col gap-2 lg:gap-3 transition-all ${isSelected ? `border-blue-600 ring-2 ring-blue-600 bg-blue-50/50 shadow-md` : `border-slate-200 hover:border-slate-300 hover:bg-slate-50`}`}>
                                                <div className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl w-fit ${dept.bg} ${dept.color} border ${dept.border}`}><Icon size={16} className="lg:w-[18px] lg:h-[18px]" /></div>
                                                <span className="text-[10px] lg:text-xs font-black text-slate-700 leading-tight">{dept.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Acuity Level</label>
                                <div className="flex gap-1.5 lg:gap-2 bg-slate-100 p-1 lg:p-1.5 rounded-[12px] lg:rounded-[14px]">
                                    {[1, 2, 3].map(lvl => (
                                        <button key={lvl} onClick={() => setQueueData(prev => ({ ...prev, acuity_level: lvl }))} className={`flex-1 py-1.5 lg:py-2 rounded-[8px] lg:rounded-[10px] text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${queueData.acuity_level === lvl ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                            {lvl === 1 ? 'Critical' : lvl === 2 ? 'Urgent' : 'Routine'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 lg:p-6 bg-slate-50 border-t border-slate-100 flex gap-2 lg:gap-3">
                            <button onClick={() => setIsQueueModalOpen(false)} className="flex-1 py-3 lg:py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] lg:text-xs hover:bg-slate-50">Cancel</button>
                            <button onClick={submitToQueue} className="flex-1 py-3 lg:py-3.5 bg-blue-600 text-white rounded-xl shadow-md font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">Route Patient →</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Patients;