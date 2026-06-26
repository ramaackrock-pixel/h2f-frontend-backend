import { useAppData } from '@/context/AppDataContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { isWithinTimeRange } from '@/utils/dateFilter';

export function 
RecentPatients({ branch, timeRange }: { branch: string, timeRange?: string }) {
  const { patients: allPatients } = useAppData();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const navigate = useNavigate();

  const patients = (branch === 'All Branches' 
    ? allPatients 
    : allPatients.filter(p => p.branch === branch)
  )
  .slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex-1">
      <div className="p-6 flex justify-between items-center border-b border-slate-50">
        <h3 className="font-bold text-slate-800">Recent Patients</h3>
        <button onClick={() => navigate('/patients')} className="text-[#3b82f6] text-xs font-bold hover:underline">View All</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#e0f4f4] text-[10px] uppercase tracking-wider text-slate-600">
              <th className="px-6 py-3 font-semibold w-[25%]">Name</th>
              <th className="px-6 py-3 font-semibold">Contact</th>
              {user?.role !== 'staff' && <th className="px-6 py-3 font-semibold w-[20%]">Address</th>}
              <th className="px-6 py-3 font-semibold">PID</th>
              <th className="px-6 py-3 font-semibold">Consulted By</th>
              <th className="px-6 py-3 font-semibold">Last Visit</th>
              <th className="px-6 py-3 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {patients.map((patient, i) => (
              <tr 
                key={i} 
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <td className="px-6 py-4 flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${patient.initialsBg}`}>
                    {patient.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-slate-800">{patient.name}</div>
                      {(() => {
                        try {
                          const visitDate = new Date(patient.lastVisit).toDateString();
                          const today = new Date().toDateString();
                          if (visitDate === today) {
                            return <span className="bg-[#e0f4f4] text-[#5ab2b2] text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-tighter">NEW</span>;
                          }
                        } catch (e) {
                          return null;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">
                  {isStaff ? '**********' : patient.contact}
                </td>
                {user?.role !== 'staff' && (
                  <td className="px-6 py-4 text-slate-500">
                    <div className="truncate max-w-[150px]" title={patient.address}>
                      {patient.address || 'N/A'}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4 text-slate-500">{patient.pid}</td>
                <td className="px-6 py-4 text-slate-700 font-medium">{patient.consultedBy}</td>
                <td className="px-6 py-4 text-slate-500">{patient.lastVisit}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${patient.statusColor}`}>
                    {patient.status}
                  </span>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan={user?.role !== 'staff' ? 7 : 6} className="px-6 py-12 text-center text-slate-500 font-medium">
                  No recent patients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
