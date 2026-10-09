import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw, 
  AlertTriangle, 
  Search, 
  Filter,
  DollarSign
} from 'lucide-react';
import { WaivePenaltyModal } from './WaivePenaltyModal';

export function PenaltiesManagement({ penalties, metrics, onWaivePenalty, isWaiving }) {
  const [selectedPenalty, setSelectedPenalty] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPenalties = penalties.filter((p) => {
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesSearch = 
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reg_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tier?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'WARNING':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold text-xs">Incident 1: 1st Warning (₹0)</span>;
      case 'FINE_100':
        return <span className="bg-orange-100 text-orange-800 border border-orange-300 px-2 py-0.5 rounded font-mono font-bold text-xs">Incident 2: ₹100 Fine</span>;
      case 'FINE_500':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded font-mono font-bold text-xs">Incident 3: ₹500 Fine</span>;
      case 'FINE_1000':
        return <span className="bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded font-mono font-bold text-xs">Incident 4: ₹1000 Fine</span>;
      case 'EXPULSION_FLAG':
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded font-mono font-extrabold text-xs">Incident 5+: Expulsion Flag</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{tier}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 5-Tier Progressive Matrix Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs uppercase font-black tracking-wider text-blue-700 mb-3">
          <ShieldAlert className="w-4 h-4 text-blue-600" />
          <span>Automated 5-Tier Progressive Disciplinary Matrix</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Incident 1</div>
            <div className="text-xs font-bold text-amber-800 mt-0.5">1st Warning</div>
            <div className="text-[11px] font-mono text-slate-500">₹0 Fine</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Incident 2</div>
            <div className="text-xs font-bold text-orange-800 mt-0.5">2nd Absence</div>
            <div className="text-[11px] font-mono font-bold text-orange-700">₹100 Fine</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Incident 3</div>
            <div className="text-xs font-bold text-rose-800 mt-0.5">3rd Absence</div>
            <div className="text-[11px] font-mono font-bold text-rose-700">₹500 Fine</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Incident 4</div>
            <div className="text-xs font-bold text-red-800 mt-0.5">4th Absence</div>
            <div className="text-[11px] font-mono font-bold text-red-700">₹1,000 Fine</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3">
            <div className="text-[10px] text-purple-700 font-bold uppercase">Incident 5+</div>
            <div className="text-xs font-extrabold text-purple-900 mt-0.5">Admission Revocation</div>
            <div className="text-[11px] font-mono text-purple-700 font-bold">Expulsion Flag</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Active Penalties</div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">{metrics?.active_count || 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Active Fines</div>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1">₹{metrics?.total_active_fine || 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Waived Off / Forgiven</div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{metrics?.waived_count || 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Expulsion Flags</div>
          <div className="text-2xl font-black text-purple-700 font-mono mt-1">{metrics?.expulsion_flags_count || 0}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center space-x-2 w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, room, reg no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
          {['ALL', 'ACTIVE', 'WAIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Resident</th>
                <th className="px-5 py-3.5">Room</th>
                <th className="px-5 py-3.5">Penalty Tier</th>
                <th className="px-5 py-3.5">Violation Details</th>
                <th className="px-5 py-3.5">Status & Audit</th>
                <th className="px-5 py-3.5 text-right">Warden Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPenalties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No penalty records matching filters.
                  </td>
                </tr>
              ) : (
                filteredPenalties.map((penalty) => (
                  <tr key={penalty.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* Student */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-200 shrink-0 flex items-center justify-center p-0.5 overflow-hidden">
                          <img
                            src={penalty.photo_url}
                            alt={penalty.full_name}
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                            style={{ objectFit: 'contain', objectPosition: 'center' }}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{penalty.full_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{penalty.reg_number}</div>
                        </div>
                      </div>
                    </td>

                    {/* Room */}
                    <td className="px-5 py-3.5 font-mono font-black text-amber-700 text-sm">
                      {penalty.room_number}
                    </td>

                    {/* Tier */}
                    <td className="px-5 py-3.5">
                      {getTierBadge(penalty.tier)}
                    </td>

                    {/* Violation */}
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="text-slate-800 text-xs leading-snug">{penalty.reason}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(penalty.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Status & Waiver Audit */}
                    <td className="px-5 py-3.5">
                      {penalty.status === 'ACTIVE' ? (
                        <span className="bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-bold">
                          ACTIVE PENALTY
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>WAIVED OFF</span>
                          </span>
                          <div className="text-[10px] text-slate-500">
                            By {penalty.waived_by}: <span className="italic text-slate-700 font-medium">"{penalty.waive_reason}"</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Waive Button */}
                    <td className="px-5 py-3.5 text-right">
                      {penalty.status === 'ACTIVE' ? (
                        <button
                          onClick={() => setSelectedPenalty(penalty)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-1.5 rounded-xl font-bold text-xs transition shadow-sm inline-flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                          <span>Waive Off</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">Forgiven</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waive Penalty Modal */}
      {selectedPenalty && (
        <WaivePenaltyModal
          penalty={selectedPenalty}
          isOpen={!!selectedPenalty}
          onClose={() => setSelectedPenalty(null)}
          onConfirm={(id, reason, admin) => {
            onWaivePenalty(id, reason, admin);
            setSelectedPenalty(null);
          }}
          isSubmitting={isWaiving}
        />
      )}

    </div>
  );
}
