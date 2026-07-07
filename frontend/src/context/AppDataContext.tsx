import React, { createContext, useContext, useState, useEffect } from 'react';

import { apiService } from '@/services/apiService';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { staffService } from '@/services/staffService';
import { billingService } from '@/services/billingService';
import { medicalRecordService } from '@/services/medicalRecordService';
import { branchService } from '@/services/branchService';
import { doctorService } from '@/services/doctorService';
import { serviceService } from '@/services/serviceService';
import { packageService } from '@/services/packageService';
import { useAuth } from '@/context/AuthContext';

import type { Patient } from '@/types/patient';
import type { Appointment } from '@/types/appointment';
import type { StaffMember } from '@/types/staff';
import type { MedicalRecord } from '@/types/medicalRecord';
import toast from 'react-hot-toast';
import type { Invoice } from '@/types/billing';
import type { ClinicBranch } from '@/types/branches';
import type { Doctor } from '@/types/doctor';

interface AppSettings {
  clinicName: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  dateFormat: string;
  timezone: string;
}

const INITIAL_SETTINGS: AppSettings = {
  clinicName: 'Health 2 Fit Rehab Zone',
  email: 'contact@h2f-rehab.com',
  phone: '+91 98765 43210',
  address: 'No 15/4b kellys road, Kilpauk, Chennai 10',
  currency: 'INR',
  dateFormat: 'MM/DD/YYYY',
  timezone: 'Asia/Kolkata'
};

interface AppDataContextType {
  patients: Patient[];
  appointments: Appointment[];
  staff: StaffMember[];
  medicalRecords: MedicalRecord[];
  invoices: Invoice[];
  branches: ClinicBranch[];

  doctors: Doctor[];
  services: Array<{ category: string; subServices: string[] }>;
  packages: Array<{ name: string; sessions: string[]; defaultPrice: number }>;
  settings: AppSettings;

  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;

  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  deleteAppointment: (id: number | string) => void;

  addStaff: (member: StaffMember) => void;
  updateStaff: (member: StaffMember) => void;
  deleteStaff: (id: string) => void;

  addMedicalRecord: (record: MedicalRecord) => void;
  updateMedicalRecord: (record: MedicalRecord) => void;
  deleteMedicalRecord: (id: string) => void;

  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;

  addBranch: (branch: ClinicBranch) => void;
  updateBranch: (branch: ClinicBranch) => void;
  deleteBranch: (id: string) => void;



  addDoctor: (doctor: Doctor) => void;
  updateDoctor: (doctor: Doctor) => void;
  deleteDoctor: (id: string) => void;

  updateSettings: (settings: AppSettings) => void;
  refreshData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [branches, setBranches] = useState<ClinicBranch[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Array<{ category: string; subServices: string[] }>>([]);
  const [packages, setPackages] = useState<Array<{ name: string; sessions: string[]; defaultPrice: number }>>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  const { isAuthenticated } = useAuth();

  // Fetch All Data from Backend
  useEffect(() => {
    const fetchAllData = async () => {
      if (!isAuthenticated) return;
      try {
        const [patientsData, appointmentsData, staffData, invoicesData, recordsData, branchesData, doctorsData, servicesData, packagesData] = await Promise.all([
          patientService.getAll().catch(e => { console.error('Failed to fetch patients:', e); return []; }),
          appointmentService.getAll().catch(e => { console.error('Failed to fetch appointments:', e); return []; }),
          staffService.getAll().catch(e => { console.error('Failed to fetch staff:', e); return []; }),
          billingService.getAll().catch(e => { console.error('Failed to fetch invoices:', e); return []; }),
          medicalRecordService.getAll().catch(e => { console.error('Failed to fetch medical records:', e); return []; }),
          branchService.getAll().catch(e => { console.error('Failed to fetch branches:', e); return []; }),
          doctorService.getAll().catch(e => { console.error('Failed to fetch doctors:', e); return []; }),
          serviceService.getAll().catch(e => { console.error('Failed to fetch services:', e); return []; }),
          packageService.getAll().catch(e => { console.error('Failed to fetch packages:', e); return []; })
        ]);

        const preparedPatients = (patientsData || []).map((p: any) => apiService.preparePatient({ ...p, id: p._id }));
        setPatients(preparedPatients);
        setAppointments((appointmentsData || []).map((a: any) => apiService.prepareAppointment({ ...a, id: a._id || a.id })));
        setStaff((staffData || []).map((s: any) => ({ ...s, id: s._id || s.id })));
        setInvoices((invoicesData || []).map((i: any) => {
          const patient = preparedPatients.find((p: any) => p.id === i.patientId);
          return { 
            ...i, 
            id: i._id || i.id,
            pid: i.patientId,
            patientPid: patient?.pid || 'N/A'
          };
        }));
        const medicalRecordsWithInitials = (recordsData || []).map((r: any) => ({
          ...r,
          id: r._id || r.id,
          initials: r.patientName ? r.patientName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'UN',
          initialsBg: 'bg-indigo-100 text-indigo-700'
        }));
        setMedicalRecords(medicalRecordsWithInitials);

        if (branchesData) {
          setBranches(branchesData.map((b: any) => apiService.prepareBranch(b)));
        }

        // Use dedicated doctors data
        setDoctors((doctorsData || []).map((d: any) => apiService.prepareDoctor(d)));
        setServices(servicesData || []);
        setPackages(packagesData || []);
      } catch (err) {
        console.error("Critical error fetching dashboard data", err);
      }
    };
    fetchAllData();
  }, [isAuthenticated]);

  const refreshData = async () => {
    if (!isAuthenticated) return;
    try {
      const [patientsData, appointmentsData, staffData, invoicesData, recordsData, branchesData, doctorsData, servicesData, packagesData] = await Promise.all([
        patientService.getAll().catch(e => { console.error('Failed to fetch patients:', e); return []; }),
        appointmentService.getAll().catch(e => { console.error('Failed to fetch appointments:', e); return []; }),
        staffService.getAll().catch(e => { console.error('Failed to fetch staff:', e); return []; }),
        billingService.getAll().catch(e => { console.error('Failed to fetch invoices:', e); return []; }),
        medicalRecordService.getAll().catch(e => { console.error('Failed to fetch medical records:', e); return []; }),
        branchService.getAll().catch(e => { console.error('Failed to fetch branches:', e); return []; }),
        doctorService.getAll().catch(e => { console.error('Failed to fetch doctors:', e); return []; }),
        serviceService.getAll().catch(e => { console.error('Failed to fetch services:', e); return []; }),
        packageService.getAll().catch(e => { console.error('Failed to fetch packages:', e); return []; })
      ]);

      const preparedPatients = (patientsData || []).map((p: any) => apiService.preparePatient({ ...p, id: p._id }));
      setPatients(preparedPatients);
      setAppointments((appointmentsData || []).map((a: any) => apiService.prepareAppointment({ ...a, id: a._id || a.id })));
      setStaff((staffData || []).map((s: any) => ({ ...s, id: s._id || s.id })));
      setInvoices((invoicesData || []).map((i: any) => {
        const patient = preparedPatients.find((p: any) => p.id === i.patientId);
        return { 
          ...i, 
          id: i._id || i.id,
          pid: i.patientId,
          patientPid: patient?.pid || 'N/A'
        };
      }));
      const medicalRecordsWithInitials = (recordsData || []).map((r: any) => ({
        ...r,
        id: r._id || r.id,
        initials: r.patientName ? r.patientName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'UN',
        initialsBg: 'bg-indigo-100 text-indigo-700'
      }));
      setMedicalRecords(medicalRecordsWithInitials);

      if (branchesData) {
        setBranches(branchesData.map((b: any) => apiService.prepareBranch(b)));
      }

      setDoctors((doctorsData || []).map((d: any) => apiService.prepareDoctor(d)));
      setServices(servicesData || []);
      setPackages(packagesData || []);
    } catch (err) {
      console.error("Critical error refreshing data", err);
    }
  };



  const addPatient = async (patient: Patient) => {
    try {
      const prepared = apiService.preparePatient(patient);
      const created = await patientService.create(prepared);
      const patientWithId = apiService.preparePatient({ ...created, id: created._id || created.id });
      setPatients(prev => [patientWithId, ...prev]);
    } catch (err) {
      console.error("Failed to add patient", err);
    }
  };

  const updatePatient = async (patient: Patient) => {
    try {
      const prepared = apiService.preparePatient(patient);
      const updated = await patientService.update(patient.id, prepared);
      const patientWithId = apiService.preparePatient({ ...updated, id: updated._id || updated.id });
      setPatients(prev => prev.map(p => p.id === patient.id ? patientWithId : p));
    } catch (err) {
      console.error("Failed to update patient", err);
    }
  };

  const deletePatient = async (id: string) => {
    try {
      await patientService.delete(id);
      setPatients(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to delete patient", err);
    }
  };

  // Appointments Actions
  const addAppointment = async (appointment: Appointment) => {
    try {
      const prepared = apiService.prepareAppointment(appointment);
      const created = await appointmentService.create(prepared);
      const appointmentWithId = apiService.prepareAppointment({ ...created, id: created._id || created.id });
      setAppointments(prev => [appointmentWithId, ...prev]);
    } catch (err: any) {
      console.error("Failed to add appointment", err);
      alert(`Failed to save appointment: ${err?.response?.data?.message || err.message || 'Unknown error'}`);
    }
  };
  const updateAppointment = async (appointment: Appointment) => {
    try {
      const prepared = apiService.prepareAppointment(appointment);
      const updated = await appointmentService.update(appointment.id, prepared);
      const updatedWithId = apiService.prepareAppointment({ ...updated, id: updated._id || updated.id });
      setAppointments(prev => prev.map(a => a.id === appointment.id ? updatedWithId : a));
    } catch (err: any) {
      console.error("Failed to update appointment", err);
      alert(`Failed to update appointment: ${err?.response?.data?.message || err.message || 'Unknown error'}`);
    }
  };
  const deleteAppointment = async (id: number | string) => {
    try {
      await appointmentService.delete(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to delete appointment", err);
    }
  };

  // Staff Actions
  const addStaff = async (member: any) => {
    try {
      const data = member instanceof FormData ? member : apiService.prepareStaff(member);
      const created = await staffService.create(data);
      const staffWithId = { ...created, id: created._id || created.id };
      setStaff(prev => [staffWithId, ...prev]);
    } catch (err) {
      console.error("Failed to add staff", err);
    }
  };
  const updateStaff = async (member: any) => {
    try {
      const id = member instanceof FormData ? member.get('id') as string : member.id;
      const data = member instanceof FormData ? member : apiService.prepareStaff(member);
      const updated = await staffService.update(id, data);
      const staffWithId = { ...updated, id: updated._id || updated.id };
      setStaff(prev => prev.map(s => s.id === id ? staffWithId : s));
    } catch (err) {
      console.error("Failed to update staff", err);
    }
  };
  const deleteStaff = async (id: string) => {
    try {
      await staffService.delete(id);
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete staff", err);
    }
  };

  const handleChunkedUpload = async (formData: FormData) => {
    const file = formData.get('file') as File;
    const chunkSize = 500 * 1024; // 500KB chunks to bypass Nginx 1MB limit
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadId = Date.now().toString() + '-' + Math.round(Math.random() * 1000);

    toast.loading(`Uploading large document (0%)...`, { id: 'chunk-upload' });

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end, file.type);

      const chunkData = new FormData();
      chunkData.append('chunk', chunk, file.name); // Need to give chunk a name for multer to parse it as file
      chunkData.append('uploadId', uploadId);
      chunkData.append('chunkIndex', i.toString());
      chunkData.append('totalChunks', totalChunks.toString());
      chunkData.append('fileName', file.name);
      
      // Append all other metadata
      formData.forEach((value, key) => {
        if (key !== 'file') {
          chunkData.append(key, value);
        }
      });

      const percent = Math.round(((i + 1) / totalChunks) * 100);
      toast.loading(`Uploading large document (${percent}%)...`, { id: 'chunk-upload' });

      const result = await medicalRecordService.uploadChunk(chunkData);
      
      if (result.finished) {
        toast.dismiss('chunk-upload');
        toast.success('Document uploaded successfully!');
        return result.data;
      }
    }
  };

  const addMedicalRecord = async (record: any) => {
    try {
      let created;
      if (record instanceof FormData && record.get('file')) {
        const file = record.get('file') as File;
        // If file is larger than 1MB, chunk it (especially PDFs which we don't compress)
        if (file.size > 1024 * 1024) {
          created = await handleChunkedUpload(record);
        } else {
          created = await medicalRecordService.create(record);
        }
      } else {
        created = await medicalRecordService.create(record);
      }
      
      if (created) {
        const recordWithId = { 
          ...created, 
          id: created._id || created.id,
          initials: created.patientName ? created.patientName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'UN',
          initialsBg: 'bg-indigo-100 text-indigo-700'
        };
        setMedicalRecords(prev => [recordWithId, ...prev]);
      }
    } catch (err) {
      toast.dismiss('chunk-upload');
      toast.error('Failed to upload document');
      console.error("Failed to add medical record", err);
    }
  };
  const updateMedicalRecord = async (record: MedicalRecord) => {
    // Note: Update not yet implemented in backend, falling back to local for now
    setMedicalRecords(prev => prev.map(r => r.id === record.id ? record : r));
  };
  const deleteMedicalRecord = async (id: string) => {
    try {
      await medicalRecordService.delete(id);
      setMedicalRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to delete medical record", err);
    }
  };

  // Invoices Actions
  const addInvoice = async (invoice: Invoice) => {
    try {
      const created = await billingService.create(invoice);
      const patient = patients.find(p => p.id === created.patientId || p.id === invoice.patientId);
      const invoiceWithId = { 
        ...created, 
        id: created._id || created.id,
        pid: created.patientId,
        patientPid: patient?.pid || 'N/A'
      };
      setInvoices(prev => [invoiceWithId, ...prev]);
    } catch (err) {
      console.error("Failed to add invoice", err);
    }
  };
  const updateInvoice = async (invoice: Invoice) => {
    try {
      const updated = await billingService.update(invoice.id, invoice);
      const patient = patients.find(p => p.id === updated.patientId || p.id === invoice.patientId);
      const invoiceWithId = { 
        ...updated, 
        id: updated._id || updated.id,
        pid: updated.patientId,
        patientPid: patient?.pid || 'N/A'
      };
      setInvoices(prev => prev.map(i => i.id === invoice.id ? invoiceWithId : i));
    } catch (err) {
      console.error("Failed to update invoice", err);
    }
  };
  const deleteInvoice = async (id: string) => {
    try {
      await billingService.delete(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error("Failed to delete invoice", err);
    }
  };

  // Branches Actions
  const addBranch = async (branch: ClinicBranch) => {
    try {
      const created = await branchService.create(branch);
      setBranches(prev => [apiService.prepareBranch(created), ...prev]);
    } catch (err) {
      console.error("Failed to add branch", err);
    }
  };
  const updateBranch = async (branch: ClinicBranch) => {
    try {
      const updated = await branchService.update(branch.id, branch);
      const prepared = apiService.prepareBranch(updated);
      setBranches(prev => prev.map(b => b.id === branch.id ? prepared : b));
    } catch (err) {
      console.error("Failed to update branch", err);
    }
  };
  const deleteBranch = async (id: string) => {
    try {
      await branchService.delete(id);
      setBranches(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error("Failed to delete branch", err);
    }
  };

  // Doctors Actions (NEW: Dedicated Doctors API)
  const addDoctor = async (doctor: Doctor) => {
    try {
      const prepared = apiService.prepareDoctor(doctor);
      const created = await doctorService.create(prepared);
      setDoctors(prev => [apiService.prepareDoctor(created), ...prev]);
    } catch (err) {
      console.error("Failed to add doctor", err);
    }
  };
  const updateDoctor = async (doctor: Doctor) => {
    try {
      const prepared = apiService.prepareDoctor(doctor);
      const updated = await doctorService.update(doctor.id, prepared);
      const updatedPrepared = apiService.prepareDoctor(updated);
      setDoctors(prev => prev.map(d => d.id === doctor.id ? updatedPrepared : d));
    } catch (err) {
      console.error("Failed to update doctor", err);
    }
  };
  const deleteDoctor = async (id: string) => {
    try {
      await doctorService.delete(id);
      setDoctors(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Failed to delete doctor", err);
    }
  };

  // Settings Actions
  const updateSettings = (newSettings: AppSettings) => setSettings(newSettings);

  return (
    <AppDataContext.Provider value={{
      patients, appointments, staff, medicalRecords, invoices, branches, doctors, services, packages, settings,
      addPatient, updatePatient, deletePatient,
      addAppointment, updateAppointment, deleteAppointment,
      addStaff, updateStaff, deleteStaff,
      addMedicalRecord, updateMedicalRecord, deleteMedicalRecord,
      addInvoice, updateInvoice, deleteInvoice,
      addBranch, updateBranch, deleteBranch,
      addDoctor, updateDoctor, deleteDoctor,
      updateSettings, refreshData
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
