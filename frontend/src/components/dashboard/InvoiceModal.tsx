import React, { useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { X, Save, User, CreditCard, Building2 } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import type { InvoiceStatus } from '@/types/billing';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: any) => void;
  invoiceToEdit?: any;
}

export default function InvoiceModal({ isOpen, onClose, onSave, invoiceToEdit }: InvoiceModalProps) {
  const { patients, branches, services, packages, invoices, updateInvoice } = useAppData();
  const [formData, setFormData] = useState<any>({
    patientName: '',
    billingType: '', // 'SERVICE' or 'PACKAGE'
    service: [],
    subService: [],
    packageCategory: [],
    sessions: [],
    totalAmount: 0, // Default 0
    discount: 0,
    paidAmount: 0,
    status: 'PENDING' as InvoiceStatus,
    branch: branches[0]?.name || '',
    paymentMode: 'Cash', // keeping for legacy
    paymentBreakdown: [{ mode: 'Cash', amount: 0 }],
    brace: '',
    braceAmount: 0,
    nutraceutical: '',
    nutraceuticalAmount: 0,
    lab: '',
    labAmount: 0
  });

  useEffect(() => {
    if (isOpen) {
      if (invoiceToEdit) {
        setFormData({
          id: invoiceToEdit.id,
          patientId: invoiceToEdit.patientId || invoiceToEdit.pid,
          patientName: invoiceToEdit.patientName || '',
          billingType: invoiceToEdit.billingType || (invoiceToEdit.packageCategory ? 'PACKAGE' : 'SERVICE'),
          service: invoiceToEdit.service || [],
          subService: invoiceToEdit.subService || [],
          packageCategory: invoiceToEdit.packageCategory || [],
          sessions: invoiceToEdit.sessions || [],
          totalAmount: invoiceToEdit.totalAmount || 0,
          discount: invoiceToEdit.discount || 0,
          paidAmount: invoiceToEdit.paidAmount || 0,
          status: invoiceToEdit.status || 'PENDING',
          branch: invoiceToEdit.branch || branches[0]?.name || '',
          paymentMode: invoiceToEdit.paymentMode || 'Cash',
          paymentBreakdown: invoiceToEdit.paymentBreakdown || [{ mode: invoiceToEdit.paymentMode || 'Cash', amount: invoiceToEdit.paidAmount || 0 }],
          brace: invoiceToEdit.brace || '',
          braceAmount: invoiceToEdit.braceAmount || 0,
          nutraceutical: invoiceToEdit.nutraceutical || '',
          nutraceuticalAmount: invoiceToEdit.nutraceuticalAmount || 0,
          lab: invoiceToEdit.lab || '',
          labAmount: invoiceToEdit.labAmount || 0
        });
      } else {
        setFormData({
          patientName: '',
          billingType: '',
          service: [],
          subService: [],
          packageCategory: [],
          sessions: [],
          totalAmount: 0,
          discount: 0,
          paidAmount: 0,
          status: 'PENDING',
          branch: branches[0]?.name || '',
          paymentMode: 'Cash',
          paymentBreakdown: [{ mode: 'Cash', amount: 0 }],
          brace: '',
          braceAmount: 0,
          nutraceutical: '',
          nutraceuticalAmount: 0,
          lab: '',
          labAmount: 0
        });
      }
    }
  }, [isOpen, invoiceToEdit, branches]);

  useEffect(() => {
    const net = Math.max(0, (formData.totalAmount || 0) - (formData.discount || 0));
    setFormData((prev: any) => {
      let newBreakdown = [...(prev.paymentBreakdown || [{mode: 'Cash', amount: 0}])];
      if (newBreakdown.length === 1 && prev.paidAmount === newBreakdown[0].amount) {
        newBreakdown[0].amount = net;
      }
      
      const newPaid = newBreakdown.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      let newStatus = prev.status;
      if (newPaid >= net && net > 0) newStatus = 'PAID';
      else if (newPaid > 0 && newPaid < net) newStatus = 'PARTIALLY PAID';
      else if (newPaid === 0 && net > 0) newStatus = 'PENDING';

      return {
        ...prev,
        paidAmount: newPaid,
        paymentBreakdown: newBreakdown,
        status: newStatus
      };
    });
  }, [formData.totalAmount, formData.discount]);

  const handleBreakdownChange = (index: number, field: string, value: string | number) => {
    setFormData((prev: any) => {
      const newBreakdown = [...prev.paymentBreakdown];
      newBreakdown[index] = { ...newBreakdown[index], [field]: field === 'amount' ? Number(value) : value };
      
      const newPaid = newBreakdown.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      const net = Math.max(0, (prev.totalAmount || 0) - (prev.discount || 0));
      
      let newStatus = prev.status;
      if (newPaid >= net && net > 0) newStatus = 'PAID';
      else if (newPaid > 0 && newPaid < net) newStatus = 'PARTIALLY PAID';
      else if (newPaid === 0 && net > 0) newStatus = 'PENDING';

      return {
        ...prev,
        paymentBreakdown: newBreakdown,
        paidAmount: newPaid,
        status: newStatus
      };
    });
  };

  const addBreakdown = () => {
    setFormData((prev: any) => ({
      ...prev,
      paymentBreakdown: [...prev.paymentBreakdown, { mode: 'Cash', amount: 0 }]
    }));
  };

  const removeBreakdown = (index: number) => {
    setFormData((prev: any) => {
      const newBreakdown = prev.paymentBreakdown.filter((_: any, i: number) => i !== index);
      const newPaid = newBreakdown.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      const net = Math.max(0, (prev.totalAmount || 0) - (prev.discount || 0));
      
      let newStatus = prev.status;
      if (newPaid >= net && net > 0) newStatus = 'PAID';
      else if (newPaid > 0 && newPaid < net) newStatus = 'PARTIALLY PAID';
      else if (newPaid === 0 && net > 0) newStatus = 'PENDING';

      return {
        ...prev,
        paymentBreakdown: newBreakdown,
        paidAmount: newPaid,
        status: newStatus
      };
    });
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: (name === 'totalAmount' || name === 'paidAmount' || name === 'discount') ? parseFloat(value) : value
    }));
  };

  const handleServiceChange = (selectedOptions: any) => {
    const newServices = selectedOptions ? selectedOptions.map((o: any) => o.value) : [];
    const newServiceObjs = services ? services.filter((s: any) => newServices.includes(s.category)) : [];
    const validSubServices = Array.from(new Set(newServiceObjs.flatMap((s: any) => s.subServices)));

    setFormData((prev: any) => ({
      ...prev,
      service: newServices,
      subService: Array.isArray(prev.subService) ? prev.subService.filter((sub: string) => validSubServices.includes(sub)) : []
    }));
  };

  const handleSubServiceChange = (selectedOptions: any) => {
    setFormData((prev: any) => ({
      ...prev,
      subService: selectedOptions ? selectedOptions.map((o: any) => o.value) : []
    }));
  };

  const handleTypeChange = (type: 'SERVICE' | 'PACKAGE' | 'PENDING DUES') => {
    setFormData((prev: any) => ({
      ...prev,
      billingType: type,
      totalAmount: type === 'SERVICE' ? 500 : type === 'PACKAGE' ? 35000 : prev.totalAmount,
      paidAmount: type === 'SERVICE' ? 500 : type === 'PACKAGE' ? 35000 : prev.paidAmount,
      service: [],
      subService: [],
      packageCategory: [],
      sessions: []
    }));
  };

  const handlePackageChange = (selectedOptions: any) => {
    const newPackages = selectedOptions ? selectedOptions.map((o: any) => o.value) : [];
    const newPackageObjs = packages ? packages.filter((p: any) => newPackages.includes(p.name)) : [];
    const validSessions = Array.from(new Set(newPackageObjs.flatMap((p: any) => p.sessions)));

    setFormData((prev: any) => ({
      ...prev,
      packageCategory: newPackages,
      sessions: Array.isArray(prev.sessions) ? prev.sessions.filter((sess: string) => validSessions.includes(sess)) : []
    }));
  };

  const handleSessionsChange = (selectedOptions: any) => {
    setFormData((prev: any) => ({
      ...prev,
      sessions: selectedOptions ? selectedOptions.map((o: any) => o.value) : []
    }));
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patientId = e.target.value;
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setFormData((prev: any) => ({
        ...prev,
        patientId: patient.id,
        patientName: patient.name
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.billingType === 'PENDING DUES' && pendingInvoices.length > 0) {
      pendingInvoices.forEach((inv: any) => {
        const amountToPay = inv.dueAmount;
        const prevBreakdown = inv.paymentBreakdown || [];
        const newBreakdown = [...prevBreakdown];
        newBreakdown.push({
          mode: formData.paymentMode || 'Cash',
          amount: amountToPay,
          date: new Date().toISOString()
        });

        updateInvoice({
          ...inv,
          status: 'PAID',
          paidAmount: inv.totalAmount - (inv.discount || 0),
          dueAmount: 0,
          paymentBreakdown: newBreakdown
        });
      });
    }

    const net = Math.max(0, (formData.totalAmount || 0) - (formData.discount || 0));
    const calculatedDueAmount = Math.max(0, net - (formData.paidAmount || 0));
    onSave({ ...formData, dueAmount: calculatedDueAmount });
  };

  const selectedServiceObjs = services ? services.filter((s: any) => Array.isArray(formData.service) && formData.service.includes(s.category)) : [];
  const groupedSubServiceOptions = selectedServiceObjs.map((s: any) => ({
    label: s.category,
    options: Array.isArray(s.subServices) ? s.subServices.map((sub: string) => ({ value: sub, label: sub })) : []
  }));

  const selectedPackageObjs = packages ? packages.filter((p: any) => Array.isArray(formData.packageCategory) && formData.packageCategory.includes(p.name)) : [];
  const groupedSessionOptions = selectedPackageObjs.map((p: any) => ({
    label: p.name,
    options: Array.isArray(p.sessions) ? p.sessions.map((sess: string) => ({ value: sess, label: sess })) : []
  }));

  const formatGroupLabel = (data: any) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 mb-1">
      <span className="text-[11px] font-black text-[#5ab2b2] uppercase tracking-widest">{data.label}</span>
      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{data.options.length}</span>
    </div>
  );

  const pendingInvoices = formData.patientId && invoices 
    ? invoices.filter((inv: any) => 
        inv.patientId === formData.patientId && 
        (inv.status === 'PENDING' || inv.status === 'PARTIALLY PAID') &&
        inv.id !== formData.id
      )
    : [];
  const pastDueAmount = pendingInvoices.reduce((sum: number, inv: any) => sum + (inv.dueAmount || 0), 0);

  const handleSettleDues = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!pendingInvoices.length) return;
    
    setFormData((prev: any) => ({
      ...prev,
      billingType: 'PENDING DUES',
      totalAmount: pastDueAmount,
      paidAmount: pastDueAmount,
      paymentBreakdown: [{ mode: prev.paymentMode || 'Cash', amount: pastDueAmount, date: new Date().toISOString() }]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{invoiceToEdit ? "Edit Invoice" : "Create New Invoice"}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors bg-slate-50 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Patient</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <Select
                  options={patients.map(p => ({ value: p.id, label: `${p.name} (${p.pid || p.id})`, patient: p }))}
                  value={formData.patientId ? { value: formData.patientId, label: `${formData.patientName} (${patients.find((p: any) => p.id === formData.patientId)?.pid || formData.patientId})` } : null}
                  onChange={(selectedOption: any) => {
                    const patient = selectedOption ? selectedOption.patient : null;
                    if (patient) {
                      setFormData((prev: any) => ({
                        ...prev,
                        patientId: patient.id,
                        patientName: patient.name
                      }));
                    } else {
                      setFormData((prev: any) => ({ ...prev, patientId: '', patientName: '' }));
                    }
                  }}
                  placeholder="Search and select a patient..."
                  className="text-sm font-medium"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: '#f8fafc',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      paddingLeft: '28px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#cbd5e1'
                      }
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 100
                    })
                  }}
                  maxMenuHeight={200}
                  menuPosition="fixed"
                  isClearable
                  required
                />
              </div>
            </div>

            {pastDueAmount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-amber-800 font-bold text-sm">Past Dues Detected</h4>
                  <p className="text-amber-700 text-xs mt-0.5">This patient has previous pending bills totaling ₹{pastDueAmount.toLocaleString('en-IN')}.</p>
                </div>
                <button
                  onClick={handleSettleDues}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  Settle Dues
                </button>
              </div>
            )}

            {/* Billing Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billing Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="billingType"
                    checked={formData.billingType === 'SERVICE'}
                    onChange={() => handleTypeChange('SERVICE')}
                    className="text-[#5ab2b2] focus:ring-[#5ab2b2]"
                  />
                  <span className="text-sm text-slate-700 font-medium">Service</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="billingType"
                    checked={formData.billingType === 'PACKAGE'}
                    onChange={() => handleTypeChange('PACKAGE')}
                    className="text-[#5ab2b2] focus:ring-[#5ab2b2]"
                  />
                  <span className="text-sm text-slate-700 font-medium">Package</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="billingType"
                    checked={formData.billingType === 'PENDING DUES'}
                    onChange={() => handleTypeChange('PENDING DUES')}
                    className="text-[#5ab2b2] focus:ring-[#5ab2b2]"
                  />
                  <span className="text-sm text-slate-700 font-medium">Pending Dues</span>
                </label>
              </div>
            </div>

            {/* Conditional Dropdowns based on Billing Type */}
            {formData.billingType === 'SERVICE' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Service Category</label>
                  <Select
                    isMulti
                    name="service"
                    options={services.map((s: any) => ({ value: s.category, label: s.category }))}
                    value={Array.isArray(formData.service) ? formData.service.map((v: string) => ({ value: v, label: v })) : []}
                    onChange={handleServiceChange}
                    isClearable={false}
                    className="text-sm font-medium"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: '#f8fafc',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#cbd5e1' }
                      }),
                      menu: (base) => ({ ...base, zIndex: 100 })
                    }}
                    menuPosition="fixed"
                    placeholder="Select Categories..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sub-Service / Package</label>
                  <Select
                    isMulti
                    name="subService"
                    options={groupedSubServiceOptions}
                    value={Array.isArray(formData.subService) ? formData.subService.map((v: string) => ({ value: v, label: v })) : []}
                    onChange={handleSubServiceChange}
                    isDisabled={!formData.service || formData.service.length === 0}
                    isClearable={false}
                    formatGroupLabel={formatGroupLabel}
                    className="text-sm font-medium"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: '#f8fafc',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#cbd5e1' }
                      }),
                      menu: (base) => ({ ...base, zIndex: 100 })
                    }}
                    menuPosition="fixed"
                    placeholder="Select Options..."
                  />
                </div>
              </div>
            )}

            {formData.billingType === 'PACKAGE' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Package Category</label>
                  <Select
                    isMulti
                    name="packageCategory"
                    options={packages.map((pkg: any) => ({ value: pkg.name, label: pkg.name }))}
                    value={Array.isArray(formData.packageCategory) ? formData.packageCategory.map((v: string) => ({ value: v, label: v })) : []}
                    onChange={handlePackageChange}
                    isClearable={false}
                    className="text-sm font-medium"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: '#f8fafc',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#cbd5e1' }
                      }),
                      menu: (base) => ({ ...base, zIndex: 100 })
                    }}
                    menuPosition="fixed"
                    placeholder="Select Packages..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sessions</label>
                  <Select
                    isMulti
                    name="sessions"
                    options={groupedSessionOptions}
                    value={Array.isArray(formData.sessions) ? formData.sessions.map((v: string) => ({ value: v, label: v })) : []}
                    onChange={handleSessionsChange}
                    isDisabled={!formData.packageCategory || formData.packageCategory.length === 0}
                    isClearable={false}
                    formatGroupLabel={formatGroupLabel}
                    className="text-sm font-medium"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: '#f8fafc',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#cbd5e1' }
                      }),
                      menu: (base) => ({ ...base, zIndex: 100 })
                    }}
                    menuPosition="fixed"
                    placeholder="Select Sessions..."
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Amount (₹)</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10 font-medium transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Discount (₹)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10 font-medium transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Paid Amount (₹)</label>
                  <input
                  type="number"
                  name="paidAmount"
                  value={formData.paidAmount}
                  readOnly
                  className="w-full bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
              <div>Net Amount: <span className="text-[#5ab2b2]">₹{(formData.totalAmount || 0) - (formData.discount || 0)}</span></div>
              <div>Due Amount: <span className={(formData.totalAmount || 0) - (formData.discount || 0) - (formData.paidAmount || 0) > 0 ? "text-red-500" : "text-green-500"}>₹{(formData.totalAmount || 0) - (formData.discount || 0) - (formData.paidAmount || 0)}</span></div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Breakdown</label>
                <button 
                  type="button" 
                  onClick={addBreakdown}
                  className="text-xs font-bold text-[#5ab2b2] hover:text-[#439c9c] flex items-center gap-1"
                >
                  + Add Mode
                </button>
              </div>
              {formData.paymentBreakdown.map((item: any, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={item.mode}
                    onChange={(e) => handleBreakdownChange(index, 'mode', e.target.value)}
                    className="w-1/2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10"
                  >
                    <option value="Cash">Cash</option>
                    <option value="GPay">GPay</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleBreakdownChange(index, 'amount', e.target.value)}
                    className="w-1/2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10"
                    placeholder="Amount"
                  />
                  {formData.paymentBreakdown.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeBreakdown(index)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10 font-medium transition-all"
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PARTIALLY PAID">PARTIAL</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Branch</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10 font-medium transition-all"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {formData.billingType !== 'PENDING DUES' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Brace Details</label>
                  <input
                    type="text"
                    name="brace"
                    value={formData.brace}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10 font-medium transition-all"
                    placeholder="e.g. Knee brace"
                  />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      name="braceAmount"
                      value={formData.braceAmount || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData((prev: any) => ({ ...prev, braceAmount: val, totalAmount: (prev.totalAmount || 0) + (val - (prev.braceAmount || 0)) }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10 font-bold transition-all"
                      placeholder="Amount"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nutraceutical Details</label>
                  <input
                    type="text"
                    name="nutraceutical"
                    value={formData.nutraceutical}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10 font-medium transition-all"
                    placeholder="e.g. Vitamins"
                  />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      name="nutraceuticalAmount"
                      value={formData.nutraceuticalAmount || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData((prev: any) => ({ ...prev, nutraceuticalAmount: val, totalAmount: (prev.totalAmount || 0) + (val - (prev.nutraceuticalAmount || 0)) }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10 font-bold transition-all"
                      placeholder="Amount"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Lab Details</label>
                  <input
                    type="text"
                    name="lab"
                    value={formData.lab}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10 font-medium transition-all"
                    placeholder="e.g. Blood test"
                  />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      name="labAmount"
                      value={formData.labAmount || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData((prev: any) => ({ ...prev, labAmount: val, totalAmount: (prev.totalAmount || 0) + (val - (prev.labAmount || 0)) }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:border-[#5ab2b2] focus:ring-2 focus:ring-teal-500/10 font-bold transition-all"
                      placeholder="Amount"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 font-bold text-white bg-[#5ab2b2] hover:bg-[#439c9c] rounded-xl transition-colors text-sm shadow-lg shadow-teal-500/20"
            >
              <Save size={18} />
              <span>{invoiceToEdit ? "Update Invoice" : "Create Invoice"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
