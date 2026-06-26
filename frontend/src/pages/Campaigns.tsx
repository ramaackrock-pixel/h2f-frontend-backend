import { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, Send, MessageSquare, AlertTriangle, RefreshCw, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '@/services/apiService';
import toast from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import { useAppData } from '@/context/AppDataContext';

export function Campaigns() {
  const { patients, refreshData } = useAppData();
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [progress, setProgress] = useState<{current: number, total: number} | null>(null);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Calculate limits
  const sentTodayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return patients.filter(p => {
      if (!p.campaignSentOn) return false;
      return new Date(p.campaignSentOn).toISOString().split('T')[0] === today;
    }).length;
  }, [patients]);

  const DAILY_LIMIT = 50;
  const remainingQuota = Math.max(0, DAILY_LIMIT - sentTodayCount);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (p.name?.toLowerCase().includes(q) || 
              p.pid?.toLowerCase().includes(q) || 
              p.contact?.toLowerCase().includes(q));
    });
  }, [patients, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE) || 1;
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPatients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPatients, currentPage]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const checkStatus = async () => {
      try {
        const res = await apiService.getCampaignStatus();
        if (res.isActive) {
          setIsCampaignRunning(true);
          if (res.total > 0) {
            setProgress({ current: res.current, total: res.total });
          } else {
            setProgress(null);
          }
        } else {
          // Check if we just finished
          setIsCampaignRunning(prev => {
            if (prev) {
                // If it transitioned from running to not running, refetch patients to get updated badges
                refreshData();
            }
            return false;
          });
          setProgress(null);
        }
      } catch (error) {
        console.error("Error checking campaign status", error);
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 3000);

    return () => clearInterval(intervalId);
  }, [refreshData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatientIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        if (newSet.size >= remainingQuota) {
          toast.error(`Daily limit reached. You can only select ${remainingQuota} patients.`);
          return prev;
        }
        newSet.add(patientId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPatientIds.size > 0) {
      setSelectedPatientIds(new Set());
    } else {
      const newSet = new Set<string>();
      let added = 0;
      for (const p of filteredPatients) {
        if (added >= remainingQuota) break;
        const id = (p as any)._id || p.id;
        newSet.add(id);
        added++;
      }
      setSelectedPatientIds(newSet);
      if (filteredPatients.length > remainingQuota) {
        toast.error(`Only ${remainingQuota} patients selected due to daily limit.`);
      }
    }
  };

  const handleSend = async () => {
    if (selectedPatientIds.size === 0) {
      toast.error("Please select at least one patient.");
      return;
    }
    
    setIsSending(true);
    try {
      const formData = new FormData();
      if (text.trim()) {
        formData.append('text', text.trim());
      }
      if (image) {
        formData.append('image', image);
      }
      
      formData.append('patientIds', JSON.stringify(Array.from(selectedPatientIds)));

      const res = await apiService.sendCampaign(formData);

      toast.success(res?.message || "Campaign queued successfully!");
      setText('');
      setImage(null);
      setSelectedPatientIds(new Set());
      
      // Immediately check status to show loader
      const statusRes = await apiService.getCampaignStatus();
      if (statusRes.isActive) setIsCampaignRunning(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetBadges = async () => {
    if (!window.confirm("Are you sure you want to reset all campaign sent badges? This will allow you to send campaigns to previously contacted patients again today if within limits.")) return;
    
    setIsResetting(true);
    try {
      await apiService.resetCampaignBadges();
      toast.success("Campaign badges reset successfully.");
      await refreshData(); // Refresh patients
    } catch (error) {
      console.error(error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Campaigns</h1>
        <p className="text-sm font-medium text-slate-600 mt-1">
          Broadcast WhatsApp messages to patients safely.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start space-x-3 shadow-sm">
        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="text-sm font-bold text-amber-800">WhatsApp Daily Limit</h3>
          <p className="text-xs text-amber-700 mt-1">
            To prevent your WhatsApp account from being flagged for suspicious activity, you are limited to sending a maximum of <strong>50 campaign messages per day</strong>.
          </p>
          <div className="mt-2 inline-flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-amber-100">
            <span className="text-xs font-bold text-slate-600">Sent Today:</span>
            <span className={`text-sm font-black ${sentTodayCount >= DAILY_LIMIT ? 'text-red-600' : 'text-emerald-600'}`}>
              {sentTodayCount} / {DAILY_LIMIT}
            </span>
            <span className="text-xs font-bold text-slate-400">({remainingQuota} remaining)</span>
          </div>
        </div>
      </div>

      {isCampaignRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800">Campaign in Progress</h3>
              <p className="text-blue-600 font-medium">
                {progress && progress.total > 0 
                  ? `Sending ${progress.current} out of ${progress.total}` 
                  : 'Preparing to send...'}
              </p>
            </div>
          </div>
          {progress && progress.total > 0 && (
            <div className="w-48">
              <div className="flex justify-between text-xs font-bold text-blue-700 mb-1">
                <span>Progress</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(5, (progress.current / progress.total) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`grid grid-cols-1 xl:grid-cols-3 gap-8 transition-opacity ${isCampaignRunning ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Left Column: Compose Message */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Compose</h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-grow">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Message Content</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your message here. (Do not type 'Hi Patient Name', the greeting is handled automatically!)"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Campaign Image (Optional)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${image ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                    }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  {image ? (
                    <div className="text-center">
                      <img
                        src={URL.createObjectURL(image)}
                        alt="Preview"
                        className="max-h-32 mx-auto rounded-lg mb-2 shadow-sm"
                      />
                      <p className="text-xs font-bold text-blue-700 truncate w-48">{image.name}</p>
                      <p className="text-[10px] text-blue-500 mt-1 cursor-pointer underline">Click to change image</p>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-xs font-bold text-slate-700">Upload image</p>
                      <p className="text-[10px] mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button
                onClick={handleSend}
                disabled={isSending || isCampaignRunning || (!text.trim() && !image) || selectedPatientIds.size === 0}
                className="w-full py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isSending || isCampaignRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Queueing...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send to {selectedPatientIds.size} Patients</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Patient Selection Grid */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[700px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-bold text-slate-800">Select Recipients</h2>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                  {selectedPatientIds.size} Selected
                </span>
              </div>
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>

            <div className="flex-grow overflow-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 border-b border-slate-200">
                      <button 
                        onClick={handleSelectAll}
                        disabled={remainingQuota <= 0 && selectedPatientIds.size === 0}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        {selectedPatientIds.size > 0 ? 'Deselect All' : 'Select All'}
                      </button>
                    </th>
                    <th className="px-6 py-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">Patient Name</th>
                    <th className="px-6 py-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">Contact</th>
                    <th className="px-6 py-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">Campaign Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map(patient => {
                    const id = (patient as any)._id || patient.id;
                    const isSelected = selectedPatientIds.has(id);
                    const sentOn = patient.campaignSentOn ? new Date(patient.campaignSentOn) : null;
                    const isSentToday = sentOn && sentOn.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                    const disableSelect = !isSelected && remainingQuota <= 0;

                    return (
                      <tr key={id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            disabled={disableSelect}
                            onChange={() => togglePatientSelection(id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-800">{patient.name}</span>
                            <span className="text-xs text-slate-500">{patient.pid}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {patient.contact}
                        </td>
                        <td className="px-6 py-4">
                          {sentOn ? (
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                              <Check size={12} className="text-emerald-500" />
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                                Sent {isSentToday ? 'Today' : sentOn.toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Not Sent</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No patients found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-sm">
              <span className="font-medium text-slate-500">
                Showing <strong className="text-blue-600">
                  {filteredPatients.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredPatients.length)}
                </strong> of {filteredPatients.length} patients
              </span>
              
              <div className="flex items-center space-x-3 font-semibold">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <button
                onClick={handleResetBadges}
                disabled={isResetting || isCampaignRunning}
                className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-2 shadow-sm disabled:opacity-50 ml-4"
              >
                <RefreshCw size={14} className={isResetting ? 'animate-spin' : ''} />
                <span>Reset All Sent Badges</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
