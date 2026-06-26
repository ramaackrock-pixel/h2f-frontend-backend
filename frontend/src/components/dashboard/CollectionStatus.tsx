import { useState, useEffect } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { Edit2, Check } from 'lucide-react';

export function CollectionStatus() {
  const { invoices } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [totalTarget, setTotalTarget] = useState(() => {
    const saved = localStorage.getItem('globalGoalTarget');
    return saved ? parseInt(saved, 10) : 1000000;
  });
  const [inputValue, setInputValue] = useState(totalTarget.toString());

  const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const percentage = totalTarget > 0 ? Math.min(Math.round((totalCollected / totalTarget) * 100), 100) : 100;

  const handleSave = () => {
    const newTarget = parseInt(inputValue, 10);
    if (!isNaN(newTarget) && newTarget > 0) {
      setTotalTarget(newTarget);
      localStorage.setItem('globalGoalTarget', newTarget.toString());
    } else {
      setInputValue(totalTarget.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setInputValue(totalTarget.toString());
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-[#5ab2b2] p-6 rounded-xl text-white col-span-1 shadow-md shadow-teal-500/10 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-1 group">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="font-semibold text-teal-50">Collection Status</h3>
        
        {isEditing ? (
          <div className="flex items-center bg-teal-800/50 rounded-lg overflow-hidden border border-teal-400/30">
            <span className="text-teal-200 text-xs pl-2">₹</span>
            <input
              autoFocus
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent text-white text-xs font-bold w-20 px-1 py-1 focus:outline-none"
            />
            <button 
              onClick={handleSave}
              className="p-1 hover:bg-teal-600 transition-colors text-teal-100"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-xs text-teal-100 font-bold tracking-wide hover:text-white transition-colors group/btn bg-teal-800/20 px-2 py-1 rounded-lg"
          >
            <span>GOAL: ₹{(totalTarget / 1000).toFixed(0)}K</span>
            <Edit2 size={12} className="opacity-50 group-hover/btn:opacity-100" />
          </button>
        )}
      </div>
      
      <div className="relative z-10">
        <p className="text-teal-100 text-sm mb-1 uppercase tracking-wider font-bold text-[10px]">Total Collected</p>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-3xl font-black">₹{totalCollected.toLocaleString('en-IN')}</h2>
          <span className="bg-teal-600/50 text-white text-[10px] font-black px-2 py-1 rounded-lg backdrop-blur-sm border border-white/10">
            {percentage}% GOAL
          </span>
        </div>
        
        <div className="w-full h-2 bg-teal-700/40 rounded-full mt-2 overflow-hidden">
          <div 
            className="h-full bg-white rounded-full shadow-sm transition-all duration-1000" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
