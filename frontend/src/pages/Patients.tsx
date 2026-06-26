import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ChevronDown, FilterX, UserPlus, ClipboardCheck, ShieldAlert, ChevronLeft, ChevronRight, Pencil, Trash2, MapPin } from 'lucide-react';
import { useSearch } from '@/context/SearchContext';
import { useAppData } from '@/context/AppDataContext';
import { apiService } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import EditPatient from '../components/dashboard/EditPatient';

const ITEMS_PER_PAGE = 10;

export function Patients() {
  const { searchQuery } = useSearch();
  const { patients, addPatient, updatePatient, deletePatient, branches } = useAppData();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const isAdminOrSuper = user?.role === 'admin' || user?.role === 'superadmin';

  const navigate = useNavigate();
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Reliable Metrics Calculations
  const newIntakesToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return patients.filter(p => {
      try {
        const dateStr = p.createdAt || p.lastVisit;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        return d.toISOString().split('T')[0] === today;
      } catch (e) {
        return false;
      }
    }).length;
  }, [patients]);

  const followUpsRequired = useMemo(() => {
    return patients.filter(p => p.status === 'PENDING').length;
  }, [patients]);

  const criticalAlerts = useMemo(() => {
    return patients.filter(p => p.status === 'CRITICAL').length;
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const nameMatch = p.name ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const idMatch = p.id ? p.id.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const pidMatch = p.pid ? p.pid.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const contactMatch = p.contact ? p.contact.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const matchesSearch = nameMatch || idMatch || pidMatch || contactMatch;
      const matchesBranch = branchFilter === 'All Branches' || p.branch === branchFilter;
      const matchesStatus = statusFilter === 'All Statuses' || p.status === statusFilter;
      const matchesTime = timeFilter === 'All Time' || (() => {
        try {
          const dateStr = p.createdAt || p.lastVisit;
          if (!dateStr) return false;
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return false;
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const targetDate = new Date(d);
          targetDate.setHours(0, 0, 0, 0);
          
          const diffTime = today.getTime() - targetDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (timeFilter === 'Added Today') return diffDays === 0;
          if (timeFilter === 'Added Yesterday') return diffDays === 1;
          if (timeFilter === 'Last 7 Days') return diffDays <= 7;
          if (timeFilter === 'Last 30 Days') return diffDays <= 30;
          
          return true;
        } catch (e) {
          return false;
        }
      })();
      return matchesSearch && matchesBranch && matchesStatus && matchesTime;
    });
  }, [patients, searchQuery, branchFilter, statusFilter, timeFilter]);

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE) || 1;
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPatients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPatients, currentPage]);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      deletePatient(id);
    }
  };

  const handleEdit = (patient: any) => {
    setEditingPatient(patient);
  };

  const handleSavePatient = (updatedPatient: any) => {
    const finalizedPatient = apiService.preparePatient(updatedPatient);

    if (editingPatient) {
      updatePatient(finalizedPatient);
      setEditingPatient(null);
    } else {
      addPatient(finalizedPatient);
      setIsAddModalOpen(false);
    }
  };

  const handleClearFilters = () => {
    setBranchFilter('All Branches');
    setStatusFilter('All Statuses');
    setTimeFilter('All Time');
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Patients</h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Manage all patient records across clinical departments.
          </p>
        </div>
        {!isStaff &&
          <button
            onClick={() => { setEditingPatient(null); setIsAddModalOpen(true); }}
            className="w-full sm:w-auto bg-[#5ab2b2] hover:bg-[#439c9c] text-white text-sm font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2"
          >
            <span className="text-lg leading-none">+</span>
            <span>New Patient</span>
          </button>
        }
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
        <div className="w-full">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Date Added</label>
          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#5ab2b2]"
            >
              <option>All Time</option>
              <option>Added Today</option>
              <option>Added Yesterday</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>

        <div className="w-full">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Branch Location</label>
          <div className="relative">
            <select
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#5ab2b2]"
            >
              <option>All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>

        <div className="w-full">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#5ab2b2]"
            >
              <option>All Statuses</option>
              <option>ACTIVE</option>
              <option>CRITICAL</option>
              <option>PENDING</option>
              <option>DISCHARGED</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>

        <button
          onClick={handleClearFilters}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-[#1e85b4] font-bold text-sm hover:bg-slate-50 rounded-lg transition-colors w-full sm:w-auto"
        >
          <FilterX size={16} />
          <span>Clear Filters</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#dcf4f4] text-[10px] uppercase tracking-wider text-slate-700">
                <th className="px-6 py-4 font-bold">Patient Name</th>
                <th className="px-6 py-4 font-bold">Patient ID</th>
                <th className="px-6 py-4 font-bold">Mobile Contact</th>
                {isAdminOrSuper && <th className="px-6 py-4 font-bold">Address</th>}
                <th className="px-6 py-4 font-bold">Consulted By</th>
                <th className="px-6 py-4 font-bold">Last Visit</th>
                <th className="px-6 py-4 font-bold">Status</th>
                {!isStaff && <th className="px-6 py-4 font-bold text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedPatients.length > 0 ? paginatedPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${patient.initialsBg}`}>
                        {patient.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{patient.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{patient.demographics}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#5ab2b2]">{patient.pid}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {isStaff ? '**********' : patient.contact}
                  </td>
                  {isAdminOrSuper && (
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="truncate max-w-[150px]">{patient.address || 'No address'}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-slate-600 font-medium">{patient.consultedBy}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${patient.statusColor}`}>
                      {patient.status}
                    </span>
                  </td>
                  {!isStaff &&
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(patient)}
                          className="text-blue-500 hover:text-blue-700 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  }
                </tr>
              )) : (
                <tr>
                  <td colSpan={isAdminOrSuper ? 8 : 7} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                    No patients found matching your current search/filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <span className="font-medium">
            Showing <strong className="text-[#5ab2b2]">
              {filteredPatients.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}-
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredPatients.length)}
            </strong> of {filteredPatients.length} patients
          </span>
          <div className="flex items-center space-x-3 font-semibold">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 text-[#5ab2b2] hover:bg-teal-50 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 text-[#5ab2b2] hover:bg-teal-50 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#f0f9f9] border border-teal-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <UserPlus size={24} className="text-[#138db5] mb-2" />
            <h3 className="font-bold text-[#1e85b4] text-[15px]">New Intakes Today</h3>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#138db5] mb-1">
              {newIntakesToday.toString().padStart(2, '0')}
            </div>
            <p className="text-[10px] font-bold text-[#5ab2b2] uppercase tracking-wider">BASED ON TODAY'S RECORDS</p>
          </div>
        </div>

        <div className="bg-[#f0f9f9] border border-teal-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <ClipboardCheck size={24} className="text-[#138db5] mb-2" />
            <h3 className="font-bold text-[#1e85b4] text-[15px]">Follow-ups Required</h3>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#138db5] mb-1">
              {followUpsRequired.toString().padStart(2, '0')}
            </div>
            <p className="text-[10px] font-bold text-[#5ab2b2] uppercase tracking-wider">PENDING CLINICAL REVIEW</p>
          </div>
        </div>

        <div className="bg-[#fff5f4] border border-red-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <ShieldAlert size={24} className="text-[#c73a3a] mb-2" />
            <h3 className="font-bold text-[#c73a3a] text-[15px]">Critical Alerts</h3>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#c73a3a] mb-1">
              {criticalAlerts.toString().padStart(2, '0')}
            </div>
            <p className="text-[10px] font-bold text-[#e06c6c] uppercase tracking-wider">IMMEDIATE ATTENTION NEEDED</p>
          </div>
        </div>
      </div>

      <EditPatient
        patient={editingPatient}
        allPatients={patients}
        isOpen={!!editingPatient || isAddModalOpen}
        onClose={() => { setEditingPatient(null); setIsAddModalOpen(false); }}
        onSave={handleSavePatient}
      />
    </Layout>
  );
}
