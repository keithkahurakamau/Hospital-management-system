import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Users, Upload, Settings, UserCog, Activity, History, Trash2, Ban, X, Stethoscope, TestTube, Pill, Banknote, Clock, AlertCircle } from 'lucide-react';
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
    { id: 'Triage', name: 'Triage & Vitals', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Consultation', name: 'Doctor\'s Office', icon: Stethoscope, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'Laboratory', name: 'Laboratory', icon: TestTube, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'Pharmacy', name: 'Pharmacy', icon: Pill, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'Billing', name: 'Cashier / Billing', icon: Banknote, color: 'text-amber-500', bg: 'bg-amber-50' }
];

const Patients = () => {
    const [patients, setPatients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [globalDropdown, setGlobalDropdown] = useState(false);

    // Form state mirroring the complex registry database schema
    const [formData, setFormData] = useState({
        surname: '', other_names: '', sex: '', date_of_birth: '',
        id_type: 'National ID', id_number: '', telephone_1: '', telephone_2: '',
        email: '', postal_address: '', postal_code: '', occupation: '',
        residence: '', town: '', reference_number: '', nationality: 'Kenyan',
        nok_name: '', nok_relationship: '', nok_contact: '', notes: ''
    });

    // --- NEW: QUEUE MODAL STATE ---
    const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
    const [queueingPatient, setQueueingPatient] = useState(null);
    const [queueData, setQueueData] = useState({ department: '', acuity_level: 3 });

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients/');
            setPatients(response.data);
        } catch (error) {
            console.error("Failed to fetch patients:", error);
        }
    };

    const toggleDropdown = (id) => {
        setActiveDropdown(activeDropdown === id ? null : id);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSavePatient = async () => {
        try {
            await api.post('/patients/', formData);
            alert("Patient registered successfully!");
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
        }
    };

    // --- QUEUE ACTIONS ---
    const openQueueModal = (patient) => {
        setQueueingPatient(patient);
        setQueueData({ department: '', acuity_level: 3 }); // Reset to Standard Priority
        setIsQueueModalOpen(true);
        setActiveDropdown(null); // Close the row dropdown
    };

    const submitToQueue = async () => {
        if (!queueData.department) return alert("Please select a target department.");
        
        try {
            await api.post('/queue', {
                patient_id: queueingPatient.patient_id,
                department: queueData.department,
                acuity_level: queueData.acuity_level
            });
            alert(`${queueingPatient.surname} successfully added to the ${queueData.department} queue.`);
            setIsQueueModalOpen(false);
        } catch (error) {
            alert(`Error: ${error.response?.data?.detail || "Failed to queue patient"}`);
        }
    };

    const inputClass = "w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm";
    const labelClass = "block text-xs font-bold text-[#1B2559] mb-2 ml-1";

    return (
        <div className="max-w-7xl mx-auto h-[85vh] flex flex-col">
            {/* Header & Global Actions */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#1B2559]">Patient Registry</h1>
                    <p className="text-[#A3AED0] text-sm mt-1">Manage patient bio-data and admission records</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by OP No, Name, Phone..." 
                            className="pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 shadow-sm w-72 transition-all"
                        />
                    </div>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setGlobalDropdown(!globalDropdown)}
                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
                        >
                            <MoreVertical size={20} />
                        </button>
                        {globalDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 overflow-hidden">
                                <button className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3"><Upload size={16} className="text-slate-400"/> Import Patients</button>
                                <button className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3"><Users size={16} className="text-slate-400"/> Proxied Patients</button>
                                <button className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3"><Settings size={16} className="text-slate-400"/> Update Pre/Suffixes</button>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
                    >
                        <Plus size={18} /> New Patient
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-50 shadow-sm overflow-hidden flex flex-col">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-[#A3AED0] text-xs uppercase tracking-wider border-b border-slate-100">
                            <th className="p-5 font-bold">OP Number</th>
                            <th className="p-5 font-bold">Patient Name</th>
                            <th className="p-5 font-bold">Sex / DOB</th>
                            <th className="p-5 font-bold">Telephone 1</th>
                            <th className="p-5 font-bold">Status</th>
                            <th className="p-5 font-bold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">No patients registered yet. Click "New Patient" to begin.</td>
                            </tr>
                        ) : (
                            patients.map(patient => (
                                <tr key={patient.patient_id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-5 text-sm font-bold text-[#1B2559]">{patient.outpatient_no}</td>
                                    <td className="p-5 text-sm font-medium text-slate-700">{patient.surname}, {patient.other_names}</td>
                                    <td className="p-5 text-sm font-medium text-slate-500">{patient.sex} <span className="text-slate-300 mx-1">/</span> {patient.date_of_birth}</td>
                                    <td className="p-5 text-sm font-medium text-slate-500">{patient.telephone_1}</td>
                                    <td className="p-5">
                                        {patient.is_active ? 
                                            <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-200 text-xs font-bold rounded-lg">Active</span> :
                                            <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg">Inactive</span>
                                        }
                                    </td>
                                    <td className="p-5 text-center relative">
                                        <button onClick={() => toggleDropdown(patient.patient_id)} className="p-2 text-slate-400 hover:text-[#1B2559] hover:bg-slate-100 rounded-lg transition-colors">
                                            <MoreVertical size={18} />
                                        </button>
                                        
                                        {activeDropdown === patient.patient_id && (
                                            <div className="absolute right-10 top-10 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 text-left overflow-hidden">
                                                {/* NEW QUEUE TRIGGER */}
                                                <button 
                                                    onClick={() => openQueueModal(patient)} 
                                                    className="w-full text-left px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-3"
                                                >
                                                    <Activity size={16} /> Route to Queue
                                                </button>
                                                <div className="border-t border-slate-100 my-1"></div>
                                                <button className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3"><History size={16} className="text-indigo-500"/> View Patient Visits</button>
                                                <button className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3"><History size={16} className="text-teal-500"/> View Bills History</button>
                                                <button className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3"><UserCog size={16} className="text-purple-500"/> Smart Profile</button>
                                                <div className="border-t border-slate-100 my-1"></div>
                                                <button className="w-full text-left px-4 py-3 text-sm font-medium text-orange-600 hover:bg-orange-50 flex items-center gap-3"><Ban size={16}/> Deactivate Patient</button>
                                                <button className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"><Trash2 size={16}/> Delete Patient</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- NEW: QUEUE ROUTING MODAL --- */}
            {isQueueModalOpen && queueingPatient && (
                <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                        <div className="flex justify-between items-center p-6 bg-slate-50 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-[#1B2559]">Queue Patient</h2>
                                <p className="text-sm font-medium text-blue-600 mt-1">{queueingPatient.outpatient_no} - {queueingPatient.surname}</p>
                            </div>
                            <button onClick={() => setIsQueueModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <label className="block text-xs font-bold text-[#A3AED0] uppercase tracking-wider mb-3">Select Destination</label>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {DEPARTMENTS.map(dept => {
                                    const Icon = dept.icon;
                                    const isSelected = queueData.department === dept.id;
                                    return (
                                        <button 
                                            key={dept.id}
                                            onClick={() => setQueueData(prev => ({ ...prev, department: dept.id }))}
                                            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${isSelected ? `border-blue-500 ring-2 ring-blue-500/20 bg-blue-50` : `border-slate-200 hover:border-blue-300 hover:bg-slate-50`}`}
                                        >
                                            <div className={`p-2 rounded-xl w-fit ${dept.bg} ${dept.color}`}>
                                                <Icon size={20} />
                                            </div>
                                            <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-[#1B2559]'}`}>{dept.name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <label className="block text-xs font-bold text-[#A3AED0] uppercase tracking-wider mb-3">Acuity Level (Priority)</label>
                            <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                <button 
                                    onClick={() => setQueueData(prev => ({ ...prev, acuity_level: 3 }))}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${queueData.acuity_level === 3 ? 'bg-white shadow-sm text-green-600 border border-green-200' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <Clock size={14}/> Standard
                                </button>
                                <button 
                                    onClick={() => setQueueData(prev => ({ ...prev, acuity_level: 2 }))}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${queueData.acuity_level === 2 ? 'bg-white shadow-sm text-amber-600 border border-amber-200' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <AlertCircle size={14}/> Urgent
                                </button>
                                <button 
                                    onClick={() => setQueueData(prev => ({ ...prev, acuity_level: 1 }))}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${queueData.acuity_level === 1 ? 'bg-white shadow-sm text-red-600 border border-red-200' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <Activity size={14}/> Emergency
                                </button>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                            <button onClick={() => setIsQueueModalOpen(false)} className="flex-1 py-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 font-bold text-sm transition-all">Cancel</button>
                            <button onClick={submitToQueue} className="flex-1 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 font-bold text-sm hover:shadow-lg transition-all">Route Patient</button>
                        </div>
                    </div>
                </div>
            )}

            {/* REGISTRATION MODAL REMAINS UNCHANGED BELOW */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-50 w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
                        
                        <div className="flex justify-between items-center p-6 bg-white border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-[#1B2559]">Patient Registration</h2>
                                <p className="text-sm text-[#A3AED0] mt-1">Fill in the primary demographics and contact details</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-8">
                                
                                {/* Column 1: Core Bio */}
                                <div className="space-y-5">
                                    <div>
                                        <label className={labelClass}>Surname <span className="text-red-500">*</span></label>
                                        <input type="text" name="surname" value={formData.surname} onChange={handleInputChange} placeholder="Surname..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Other Names <span className="text-red-500">*</span></label>
                                        <input type="text" name="other_names" value={formData.other_names} onChange={handleInputChange} placeholder="Other Names..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Sex <span className="text-red-500">*</span></label>
                                        <select name="sex" value={formData.sex} onChange={handleInputChange} className={inputClass}>
                                            <option value="">Select...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Date Of Birth <span className="text-red-500">*</span></label>
                                        <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>ID Type <span className="text-red-500">*</span></label>
                                        <select name="id_type" value={formData.id_type} onChange={handleInputChange} className={inputClass}>
                                            <option value="National ID">National ID</option>
                                            <option value="Passport">Passport</option>
                                            <option value="Birth Certificate">Birth Certificate</option>
                                            <option value="Alien ID">Alien ID</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>ID Number</label>
                                        <input type="text" name="id_number" value={formData.id_number} onChange={handleInputChange} placeholder="ID NO..." className={inputClass} />
                                    </div>
                                </div>

                                {/* Column 2: Contact & Address */}
                                <div className="space-y-5">
                                    <div>
                                        <label className={labelClass}>Telephone 1 <span className="text-red-500">*</span></label>
                                        <input type="text" name="telephone_1" value={formData.telephone_1} onChange={handleInputChange} placeholder="Telephone 1..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Telephone 2</label>
                                        <input type="text" name="telephone_2" value={formData.telephone_2} onChange={handleInputChange} placeholder="Telephone 2..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Postal Address</label>
                                        <input type="text" name="postal_address" value={formData.postal_address} onChange={handleInputChange} placeholder="Postal Address..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Postal Code</label>
                                        <input type="text" name="postal_code" value={formData.postal_code} onChange={handleInputChange} placeholder="Postal Code..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Occupation <span className="text-red-500">*</span></label>
                                        <input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="Occupation..." className={inputClass} />
                                    </div>
                                </div>

                                {/* Column 3: Location & Meta */}
                                <div className="space-y-5">
                                    <div>
                                        <label className={labelClass}>Residence <span className="text-red-500">*</span></label>
                                        <input type="text" name="residence" value={formData.residence} onChange={handleInputChange} placeholder="Estate/Village..." className={inputClass} />
                                    </div>
                                    
                                    <div>
                                        <label className={labelClass}>Town <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            name="town" 
                                            list="kenya-towns"
                                            value={formData.town} 
                                            onChange={handleInputChange} 
                                            placeholder="Type to search town..." 
                                            className={inputClass} 
                                        />
                                        <datalist id="kenya-towns">
                                            {KENYAN_TOWNS.map(town => (
                                                <option key={town} value={town} />
                                            ))}
                                        </datalist>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Reference Number</label>
                                        <input type="text" name="reference_number" value={formData.reference_number} onChange={handleInputChange} placeholder="Reference Number..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Nationality <span className="text-red-500">*</span></label>
                                        <select name="nationality" value={formData.nationality} onChange={handleInputChange} className={inputClass}>
                                            <option value="Kenyan">Kenyan</option>
                                            <option value="Ugandan">Ugandan</option>
                                            <option value="Tanzanian">Tanzanian</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Next Of Kin <span className="text-red-500">*</span></label>
                                        <input type="text" name="nok_name" value={formData.nok_name} onChange={handleInputChange} placeholder="NOK Name..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Relationship <span className="text-red-500">*</span></label>
                                        <input type="text" name="nok_relationship" value={formData.nok_relationship} onChange={handleInputChange} placeholder="Relationship..." className={inputClass} />
                                    </div>
                                </div>

                                {/* Column 4: Notes & Meta Status */}
                                <div className="space-y-5">
                                    <div>
                                        <label className={labelClass}>NOK Contact <span className="text-red-500">*</span></label>
                                        <input type="text" name="nok_contact" value={formData.nok_contact} onChange={handleInputChange} placeholder="NOK Phone..." className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Notes</label>
                                        <textarea name="notes" value={formData.notes} onChange={handleInputChange} className={`${inputClass} h-32 resize-none`} placeholder="Enter clinical or administrative notes..."></textarea>
                                    </div>
                                    
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-2">
                                        <div className="space-y-3 text-sm font-bold text-[#1B2559]">
                                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                                <span>Outpatient No:</span>
                                                <span className="text-blue-600 font-black">Auto-generated</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                                <span>Inpatient No:</span>
                                                <span className="text-[#A3AED0] font-medium">N/A</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Registered On:</span>
                                                <span className="text-[#A3AED0] font-medium">Today</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full mt-2 bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-emerald-600 transition-all flex justify-center items-center gap-2">
                                        <Plus size={18}/> Add Customer Schemes
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 font-bold text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSavePatient} 
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 font-bold text-sm hover:shadow-lg transition-all"
                            >
                                Save Patient Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Patients;