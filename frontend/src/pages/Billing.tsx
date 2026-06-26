import { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import {
  Search,
  ChevronDown,
  Calendar,
  MoreVertical,
  Banknote,
  ClipboardCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  UserPlus,
  Lock,
  Pencil
} from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import type { InvoiceStatus } from '../types/billing';
import InvoiceModal from '@/components/dashboard/InvoiceModal';
import { useSearch } from '@/context/SearchContext';
import { useAuth } from '@/context/AuthContext';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 10;

export function Billing() {
  const { searchQuery } = useSearch();
  const { invoices: invoicesData, addInvoice, updateInvoice, branches, patients, services, packages } = useAppData();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('All');
  const [breakdownFilter, setBreakdownFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [newPaidAmount, setNewPaidAmount] = useState<string>('');
  const [newPaymentMode, setNewPaymentMode] = useState<string>('Cash');

  if (isStaff) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 text-slate-400">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Billing and invoice management is only accessible to administrative roles.
            If you believe this is an error, please contact your clinic administrator.
          </p>
        </div>
      </Layout>
    );
  }
  //derived state from existing state .
  const totalRevenue = invoicesData.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalPending = invoicesData.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
  const activeInvoicesCount = invoicesData.filter(i => i.status !== 'PAID').length;

  const stats = [
    { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, iconName: 'Banknote', variant: 'primary', trend: '+12.5%' },
    { title: 'Pending Amount', value: `₹${totalPending.toLocaleString('en-IN')}`, iconName: 'AlertCircle', variant: 'danger', subtext: `${invoicesData.filter(i => i.status === 'OVERDUE').length} overdue invoices` },
    { title: 'Active Invoices', value: activeInvoicesCount.toString(), iconName: 'ClipboardCheck', variant: 'secondary', subtext: 'Invoices needing action' }
  ];

  const uniqueBraces = Array.from(new Set(invoicesData.map(i => i.brace?.trim()).filter(Boolean))).sort();
  const uniqueNutraceuticals = Array.from(new Set(invoicesData.map(i => i.nutraceutical?.trim()).filter(Boolean))).sort();
  const uniqueLabs = Array.from(new Set(invoicesData.map(i => i.lab?.trim()).filter(Boolean))).sort();

  const filteredInvoices = invoicesData.filter(invoice => {
    const activeSearch = searchTerm || searchQuery;
    const patientName = invoice.patientName || '';
    const patient = patients.find(p => p.id === invoice.patientId || p.id === invoice.pid || p.name === invoice.patientName);
    const matchesSearch =
      patientName.toLowerCase().includes(activeSearch.toLowerCase()) ||
      invoice.id.toLowerCase().includes(activeSearch.toLowerCase()) ||
      (patient?.contact && patient.contact.toLowerCase().includes(activeSearch.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;


    const invoiceBranch = invoice.branch || patient?.branch;
    const matchesBranch = branchFilter === 'All Branches' || invoiceBranch === branchFilter;

    const invoiceDate = new Date(invoice.date || invoice.createdAt || new Date());
    let matchesTime = true;

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      matchesTime = invoiceDate >= filterDate && invoiceDate < nextDay;
    }

    const matchesPaymentMode = paymentModeFilter === 'All' ||
      (invoice.paymentBreakdown && invoice.paymentBreakdown.some((pb: any) => pb.mode === paymentModeFilter)) ||
      (!invoice.paymentBreakdown && (invoice.paymentMode || 'Cash') === paymentModeFilter);

    let matchesBreakdown = true;
    if (breakdownFilter !== 'All') {
      if (breakdownFilter === 'Brace Amount') matchesBreakdown = (invoice.braceAmount || 0) > 0;
      else if (breakdownFilter === 'Nutraceutical Amount') matchesBreakdown = (invoice.nutraceuticalAmount || 0) > 0;
      else if (breakdownFilter === 'Lab Amount') matchesBreakdown = (invoice.labAmount || 0) > 0;
    }

    return matchesSearch && matchesStatus && matchesBranch && matchesTime && matchesPaymentMode && matchesBreakdown;
  });

  const filteredTotalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const filteredPaidAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const filteredDueAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
  const filteredDiscountAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);

  const todayCollections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totals = { Cash: 0, GPay: 0, Card: 0, Cheque: 0 };

    invoicesData.forEach(inv => {
      if (inv.billingType === 'PENDING DUES') return;

      const invoiceDate = new Date(inv.date || inv.createdAt || new Date());
      
      if (inv.paymentBreakdown && inv.paymentBreakdown.length > 0) {
        inv.paymentBreakdown.forEach((pb: any) => {
          const pbDate = new Date(pb.date || inv.date || inv.createdAt || new Date());
          if (pbDate >= today && pbDate < tomorrow) {
            const m = pb.mode;
            if (totals[m as keyof typeof totals] !== undefined) totals[m as keyof typeof totals] += Number(pb.amount) || 0;
          }
        });
      } else {
        // Fallback for older invoices without breakdown
        if (invoiceDate >= today && invoiceDate < tomorrow) {
          const mode = inv.paymentMode || 'Cash';
          if (totals[mode as keyof typeof totals] !== undefined) totals[mode as keyof typeof totals] += Number(inv.paidAmount) || 0;
        }
      }
    });
    return totals;
  }, [invoicesData]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusUpdate = (id: string, newStatus: InvoiceStatus) => {
    const invoice = invoicesData.find(inv => inv.id === id);
    if (!invoice) return;

    let paidAmount = invoice.paidAmount;
    const netAmount = invoice.totalAmount - (invoice.discount || 0);
    let dueAmount = netAmount - paidAmount;

    if (newStatus === 'PAID') {
      const amountBeingPaidNow = netAmount - paidAmount;
      paidAmount = netAmount;
      dueAmount = 0;
      
      let newBreakdown = invoice.paymentBreakdown ? [...invoice.paymentBreakdown] : [];
      if (amountBeingPaidNow > 0) {
        newBreakdown.push({
          mode: invoice.paymentMode || 'Cash',
          amount: amountBeingPaidNow,
          date: new Date().toISOString()
        });
      }
      updateInvoice({ ...invoice, status: newStatus, paidAmount, dueAmount, paymentBreakdown: newBreakdown });
      setActiveMenuId(null);
      return;
    } else if (newStatus === 'PENDING' || newStatus === 'OVERDUE') {
      paidAmount = 0;
      dueAmount = netAmount;
      updateInvoice({ ...invoice, status: newStatus, paidAmount, dueAmount, paymentBreakdown: [] });
      setActiveMenuId(null);
      return;
    } else if (newStatus === 'PARTIALLY PAID') {
      setSelectedInvoiceForPayment(invoice);
      setNewPaidAmount(''); // Default to empty for "Amount Paying Now"
      setNewPaymentMode('Cash');
      setIsPaymentModalOpen(true);
      setActiveMenuId(null);
      return; // Stop here, modal will handle the save
    }

    updateInvoice({ ...invoice, status: newStatus, paidAmount, dueAmount });
    setActiveMenuId(null);
  };

  const handleSaveInvoice = (data: any) => {
    if (data.id) {
      updateInvoice(data);
    } else {
      addInvoice(data);
    }
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const handleDownloadExcel = () => {
    // Get start of today (local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get end of today (local time)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter today's invoices
    const todayInvoices = invoicesData.filter(invoice => {
      const invoiceDate = new Date(invoice.date || invoice.createdAt || new Date());
      return invoiceDate >= today && invoiceDate < tomorrow;
    });

    const getNoOfDays = (invoice: any) => {
      if (invoice.billingType === 'PACKAGE' || invoice.packageCategory) {
        const sessions = String(invoice.sessions || '').trim();
        if (sessions === '10' || sessions === '20' || sessions === '30') {
          return sessions;
        }
        const match = sessions.match(/\b(10|20|30)\b/);
        if (match) {
          return match[1];
        }
      }
      return 'NA';
    };

    // Initialize workbook
    const wb = XLSX.utils.book_new();

    // Get all branch names
    let allBranchNames = branches.map(b => b.name);
    if (allBranchNames.length === 0) {
      const invoiceBranches = Array.from(new Set(invoicesData.map(inv => {
        const patient = patients.find(p => p.id === inv.patientId || p.id === inv.pid || p.name === inv.patientName);
        return inv.branch || patient?.branch || 'Kilpauk (Main) Branch';
      })));
      allBranchNames = invoiceBranches.length > 0 ? invoiceBranches : ['Kilpauk (Main) Branch', 'Anna Nagar Branch', 'OMR Branch'];
    }

    allBranchNames.forEach(branchName => {
      const branchInvoices = todayInvoices.filter(inv => {
        const patient = patients.find(p => p.id === inv.patientId || p.id === inv.pid || p.name === inv.patientName);
        const invBranch = inv.branch || patient?.branch || 'Kilpauk (Main) Branch';
        return invBranch.toLowerCase().trim() === branchName.toLowerCase().trim();
      });

      // Map to rows
      const rows = branchInvoices.map(inv => {
        const patient = patients.find(p => p.id === inv.patientId || p.id === inv.pid || p.name === inv.patientName);
        const patientId = patient?.pid || patient?.id || inv.patientId || inv.pid || '-';

        return {
          'PATIENT ID': patientId,
          'PATIENT NAME': inv.patientName || '',
          'NO. OF DAYS': getNoOfDays(inv),
          'MODE OF PAYMENT': inv.paymentBreakdown ? inv.paymentBreakdown.map((pb: any) => `${pb.mode}(₹${pb.amount})`).join(', ') : (inv.paymentMode || 'Cash'),
          'AMOUNT': inv.paidAmount || 0,
          'DUE AMOUNT': inv.dueAmount || 0,
          'PAYMENT STATUS': inv.status || 'PENDING',
          'BRACE': inv.brace || '-',
          'NUTRACEUTICAL': inv.nutraceutical || '-',
          'Lab': inv.lab || '-'
        };
      });

      // Create sheet
      const ws = XLSX.utils.json_to_sheet(rows, {
        header: ['PATIENT ID', 'PATIENT NAME', 'NO. OF DAYS', 'MODE OF PAYMENT', 'AMOUNT', 'DUE AMOUNT', 'PAYMENT STATUS', 'BRACE', 'NUTRACEUTICAL', 'Lab']
      });

      // Set column widths
      ws['!cols'] = [
        { wch: 18 }, // PATIENT ID
        { wch: 25 }, // PATIENT NAME
        { wch: 15 }, // NO. OF DAYS
        { wch: 20 }, // MODE OF PAYMENT
        { wch: 15 }, // AMOUNT
        { wch: 15 }, // DUE AMOUNT
        { wch: 18 }, // PAYMENT STATUS
        { wch: 20 }, // BRACE
        { wch: 20 }, // NUTRACEUTICAL
        { wch: 20 }  // Lab
      ];

      // Safe sheet name (under 31 characters, remove invalid chars)
      let safeSheetName = branchName.replace(/[\\\?\*:\/]/g, '').substring(0, 30);
      if (!safeSheetName) safeSheetName = 'Branch';

      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    });

    // Write file
    const dateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '_');
    XLSX.writeFile(wb, `Billing_Report_${dateStr}.xlsx`);
  };

  const getStatusStyles = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'OVERDUE':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'PENDING':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'PARTIALLY PAID':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Banknote': return <Banknote size={20} />;
      case 'ClipboardCheck': return <ClipboardCheck size={20} />;
      case 'AlertCircle': return <AlertCircle size={20} />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Billing</h1>
            <p className="text-slate-500 mt-1">Manage invoices and payments</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadExcel}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 group"
              title="Download branch-wise today's bills report as Excel"
            >
              <Download size={20} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
              <span>Download Excel (Today)</span>
            </button>
            <button
              onClick={() => { setEditingInvoice(null); setIsModalOpen(true); }}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#5ab2b2] hover:bg-[#4a9f9f] text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-95 group"
            >
              <UserPlus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        <InvoiceModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingInvoice(null); }}
          onSave={handleSaveInvoice}
          invoiceToEdit={editingInvoice}
        />

        {/* Stats Summary */}
        {user?.role === 'superadmin' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
              >
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</h3>
                  {stat.trend && (
                    <div className="flex items-center space-x-1 text-teal-500 text-xs font-bold">
                      <TrendingUp size={14} />
                      <span>{stat.trend}</span>
                    </div>
                  )}
                  {stat.subtext && (
                    <p className="text-xs font-medium text-slate-400">{stat.subtext}</p>
                  )}
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${stat.variant === 'primary' ? 'bg-teal-50 text-teal-500 group-hover:bg-teal-500 group-hover:text-white' :
                  stat.variant === 'secondary' ? 'bg-teal-50 text-teal-500 group-hover:bg-teal-500 group-hover:text-white' :
                    stat.variant === 'accent' ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' :
                      'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white'
                  }`}>
                  {getIcon(stat.iconName)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters and Table Container */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col xl:flex-row gap-4 items-center justify-between bg-slate-50/30">
            <div className="flex flex-col lg:flex-row items-center gap-4 w-full xl:w-auto">
              <div className="relative w-full md:w-80 group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#5ab2b2] transition-colors" />
                <input
                  type="text"
                  placeholder="Search by patient..."
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#5ab2b2] transition-all"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full lg:w-40 group">
                  <select
                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#5ab2b2] pr-10 cursor-pointer transition-all"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                  >
                    <option value="All">Status: All</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="PARTIALLY PAID">Partial</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-300 group-focus-within:rotate-180" />
                </div>

                <div className="relative w-full lg:w-44 group">
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#5ab2b2] cursor-pointer transition-all"
                    />
                  </div>
                </div>

                <div className="relative w-full lg:w-44 group">
                  <select
                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#5ab2b2] pr-10 cursor-pointer transition-all"
                    value={branchFilter}
                    onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="All Branches">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative w-full lg:w-44 group">
                  <select
                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#5ab2b2] pr-10 cursor-pointer transition-all"
                    value={paymentModeFilter}
                    onChange={(e) => { setPaymentModeFilter(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="All">Payment: All</option>
                    <option value="Cash">Cash</option>
                    <option value="GPay">GPay</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative w-full lg:w-44 group">
                  <select
                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#5ab2b2] pr-10 cursor-pointer transition-all"
                    value={breakdownFilter}
                    onChange={(e) => { setBreakdownFilter(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="All">Breakdown: All</option>
                    <option value="Brace Amount">Brace Amount</option>
                    <option value="Nutraceutical Amount">Nutraceutical Amount</option>
                    <option value="Lab Amount">Lab Amount</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setBranchFilter('All Branches');
                setDateFilter('');
                setPaymentModeFilter('All');
                setBreakdownFilter('All');
                setCurrentPage(1);
              }}
              className="text-teal-600 text-sm font-bold hover:text-teal-700 transition-colors whitespace-nowrap px-2"
            >
              Clear Filters
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#e0f4f4] text-[10px] uppercase tracking-wider text-slate-600 font-bold">
                  <th className="px-6 py-4 font-bold">Invoice ID</th>
                  <th className="px-6 py-4 font-bold">Patient Name</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Total Amount</th>
                  <th className="px-6 py-4 font-bold">Discount</th>
                  <th className="px-6 py-4 font-bold">Paid Amount</th>
                  <th className="px-6 py-4 font-bold">Due Amount</th>
                  <th className="px-6 py-4 font-bold">Payment Mode</th>
                  <th className="px-6 py-4 font-bold">Brace</th>
                  <th className="px-6 py-4 font-bold">Nutraceutical</th>
                  <th className="px-6 py-4 font-bold">Lab</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedInvoices.map((invoice) => (
                  <tr key={invoice.id} className={`transition-colors group border-b border-slate-50 last:border-0 relative ${invoice.billingType === 'PENDING DUES' ? 'bg-amber-100 hover:bg-amber-200' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => {
                          const patient = patients.find(p => p.id === invoice.patientId || p.id === invoice.pid || p.name === invoice.patientName);
                          generateInvoicePDF({
                            ...invoice,
                            patientAddress: patient?.address,
                            patientPhone: patient?.contact,
                            patientId: patient?.pid || patient?.id || invoice.patientId || invoice.pid,
                            registeredBranch: patient?.branch || invoice.branch
                          }, services, packages);
                        }}
                        className="text-sm font-bold text-teal-600 hover:text-teal-700 hover:underline underline-offset-4 transition-all text-left"
                      >
                        {invoice.id?.substring(0, 8).toUpperCase()}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[11px] ring-2 ring-white shadow-sm ${invoice.initialsBg}`}>
                          {invoice.initials}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{invoice.patientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium whitespace-nowrap">
                      {new Date(invoice.date || invoice.createdAt || new Date()).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-700">
                      ₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-500">
                      ₹{(invoice.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-500 flex items-center space-x-2">
                      <span>₹{invoice.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      {invoice.status === 'PARTIALLY PAID' && (
                        <button
                          onClick={() => {
                            setSelectedInvoiceForPayment(invoice);
                            setNewPaidAmount(invoice.paidAmount.toString());
                            setNewPaymentMode('Cash');
                            setIsPaymentModalOpen(true);
                          }}
                          className="text-[#5ab2b2] hover:text-[#439c9c] p-0.5 rounded-full hover:bg-teal-50 transition-colors"
                          title="Update Payment"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                    </td>
                    <td className={`px-6 py-5 text-sm font-bold ${invoice.dueAmount > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      ₹{invoice.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-bold whitespace-nowrap">
                      {invoice.paymentBreakdown && invoice.paymentBreakdown.length > 1 ? (
                        <span
                          className="cursor-help border-b border-dashed border-slate-400"
                          title={invoice.paymentBreakdown.map((pb: any) => `${pb.mode}: ₹${pb.amount}`).join('\n')}
                        >
                          Split ({invoice.paymentBreakdown.length})
                        </span>
                      ) : invoice.paymentBreakdown && invoice.paymentBreakdown.length === 1 ? (
                        invoice.paymentBreakdown[0].mode
                      ) : (
                        invoice.paymentMode || 'Cash'
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium max-w-[150px] truncate" title={invoice.brace || ''}>
                      {invoice.brace ? (
                        <div className="flex flex-col gap-0.5">
                          <span>{invoice.brace}</span>
                          {invoice.braceAmount ? <span className="text-[10px] text-teal-600 font-bold">₹{invoice.braceAmount.toLocaleString('en-IN')}</span> : null}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium max-w-[150px] truncate" title={invoice.nutraceutical || ''}>
                      {invoice.nutraceutical ? (
                        <div className="flex flex-col gap-0.5">
                          <span>{invoice.nutraceutical}</span>
                          {invoice.nutraceuticalAmount ? <span className="text-[10px] text-teal-600 font-bold">₹{invoice.nutraceuticalAmount.toLocaleString('en-IN')}</span> : null}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium max-w-[150px] truncate" title={invoice.lab || ''}>
                      {invoice.lab ? (
                        <div className="flex flex-col gap-0.5">
                          <span>{invoice.lab}</span>
                          {invoice.labAmount ? <span className="text-[10px] text-teal-600 font-bold">₹{invoice.labAmount.toLocaleString('en-IN')}</span> : null}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyles(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right relative">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === invoice.id ? null : invoice.id);
                          }}
                          className={`p-2 rounded-lg transition-all ${activeMenuId === invoice.id ? 'bg-[#5ab2b2] text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === invoice.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] p-2 animate-in fade-in zoom-in duration-200 origin-top-right">
                            <div className="px-4 py-2 border-b border-slate-50 mb-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</p>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const patient = patients.find(p => p.id === invoice.patientId || p.id === invoice.pid || p.name === invoice.patientName);
                                generateInvoicePDF({
                                  ...invoice,
                                  patientAddress: patient?.address,
                                  patientPhone: patient?.contact,
                                  patientId: patient?.pid || patient?.id || invoice.patientId || invoice.pid,
                                  registeredBranch: patient?.branch || invoice.branch
                                }, services, packages);
                                setActiveMenuId(null);
                              }}
                              className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-teal-600 rounded-xl transition-all"
                            >
                              <Download size={16} />
                              <span>Download PDF</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingInvoice(invoice);
                                setIsModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all"
                            >
                              <Pencil size={16} />
                              <span>Edit</span>
                            </button>

                            <div className="px-4 py-2 border-y border-slate-50 my-1 bg-slate-50/50">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Change Status</p>
                            </div>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(invoice.id, 'PAID'); }}
                              className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-bold text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                            >
                              <div className="flex items-center space-x-3">
                                <CheckCircle2 size={16} />
                                <span>Mark as Paid</span>
                              </div>
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(invoice.id, 'PENDING'); }}
                              className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                            >
                              <div className="flex items-center space-x-3">
                                <Clock size={16} />
                                <span>Mark as Pending</span>
                              </div>
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(invoice.id, 'PARTIALLY PAID'); }}
                              className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                              <div className="flex items-center space-x-3">
                                <Receipt size={16} />
                                <span>Mark as Partial</span>
                              </div>
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(invoice.id, 'OVERDUE'); }}
                              className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <div className="flex items-center space-x-3">
                                <AlertTriangle size={16} />
                                <span>Mark as Overdue</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Filtered Totals Summary Bar */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">Filtered Totals Summary</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center justify-between lg:justify-start space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Invoiced:</span>
                <span className="text-sm font-black text-slate-800">₹{filteredTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between lg:justify-start space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Discount:</span>
                <span className="text-sm font-bold text-slate-600">₹{filteredDiscountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between lg:justify-start space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Paid:</span>
                <span className="text-sm font-black text-teal-600">₹{filteredPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between lg:justify-start space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Due:</span>
                <span className={`text-sm font-black ${filteredDueAmount > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                  ₹{filteredDueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Today's Collection Summary Bar */}
          <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-xs font-black text-teal-600 uppercase tracking-widest text-center flex items-center space-x-2">
              <Receipt size={16} /> <span>Today's Collections</span>
            </div>
            <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center gap-4 w-full lg:w-auto">
              {['Cash', 'GPay', 'Card', 'Cheque'].map(mode => (
                <div key={mode} className="flex items-center justify-between lg:justify-start space-x-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{mode}:</span>
                  <span className="text-sm font-black text-teal-700">₹{todayCollections[mode as keyof typeof todayCollections].toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>


          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-slate-400 text-center sm:text-left">
              Showing {paginatedInvoices.length} of {filteredInvoices.length} entries
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-white hover:text-teal-600 transition-all shadow-sm disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-600 font-bold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white hover:text-teal-600 transition-all shadow-sm disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {isPaymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-in fade-in duration-200" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Update Payment</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">
                Enter the amount paying now.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Current Due Amount</label>
                  <div className="text-lg font-bold text-red-500">
                    ₹{selectedInvoiceForPayment.dueAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Mode</label>
                  <select
                    value={newPaymentMode}
                    onChange={(e) => setNewPaymentMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5ab2b2]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="GPay">GPay</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Amount Paying Now</label>
                  <input
                    type="number"
                    value={newPaidAmount}
                    onChange={(e) => setNewPaidAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5ab2b2]"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div className="mt-8 flex space-x-3">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const parsedAmount = parseFloat(newPaidAmount);
                    if (isNaN(parsedAmount) || parsedAmount < 0 || parsedAmount > selectedInvoiceForPayment.dueAmount) {
                      alert("Invalid amount!");
                      return;
                    }

                    const totalPaidAmount = selectedInvoiceForPayment.paidAmount + parsedAmount;
                    const netAmount = selectedInvoiceForPayment.totalAmount - (selectedInvoiceForPayment.discount || 0);

                    let newStatus: InvoiceStatus = 'PARTIALLY PAID';
                    if (totalPaidAmount === netAmount) {
                      newStatus = 'PAID';
                    }

                    const dueAmount = netAmount - totalPaidAmount;

                    const prevBreakdown = selectedInvoiceForPayment.paymentBreakdown || [];
                    let newBreakdown = [...prevBreakdown];

                    // Always push a new entry to preserve the exact date of payment
                    newBreakdown.push({
                      mode: newPaymentMode,
                      amount: parsedAmount,
                      date: new Date().toISOString()
                    });

                    updateInvoice({
                      ...selectedInvoiceForPayment,
                      status: newStatus,
                      paidAmount: totalPaidAmount,
                      dueAmount,
                      paymentBreakdown: newBreakdown
                    });

                    setIsPaymentModalOpen(false);
                    setSelectedInvoiceForPayment(null);
                  }}
                  className="flex-1 bg-[#5ab2b2] hover:bg-[#439c9c] text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
