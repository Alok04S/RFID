import React, { useState } from 'react';
import { X, Radio, Sparkles, UserCheck, ShieldAlert, Play } from 'lucide-react';

export function SimulatorDrawer({ 
  isOpen, 
  onClose, 
  students = [], 
  onSimulateScan 
}) {
  const [customTag, setCustomTag] = useState('');

  if (!isOpen) return null;

  const handleSimulateCustom = (e) => {
    e.preventDefault();
    if (!customTag.trim()) return;
    onSimulateScan(customTag.trim());
    setCustomTag('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 uppercase">RFID Gate Tap Simulator</h3>
                <p className="text-xs text-slate-500 font-medium">Test USB RFID scanner taps at the gate</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick 1-Click Tap Buttons for Registered Students */}
          <div className="space-y-2 mb-6">
            <div className="text-xs uppercase font-black tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Registered Students (Click to Tap Gate)</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {students.slice(0, 10).map((st) => {
                const isDeactivated = st.rfid_status === 'DEACTIVATED' || st.rfid_status === 'LOST';
                return (
                  <button
                    key={st.id}
                    onClick={() => onSimulateScan(st.rfid_tag)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all group ${
                      isDeactivated
                        ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                        : 'bg-slate-50 border-slate-200 hover:bg-blue-50/80 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={st.photo_url}
                        alt={st.full_name}
                        className="w-9 h-9 rounded-full object-cover object-center border border-slate-200 shrink-0"
                        style={{ objectPosition: 'center' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                          {st.full_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Room {st.room_number} • UID: {st.rfid_tag}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      isDeactivated
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800 group-hover:bg-blue-600 group-hover:text-white'
                    }`}>
                      {isDeactivated ? 'Blocked' : 'Tap Card'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom RFID UID Manual Tap */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              <span>Simulate Any RFID UID</span>
            </div>

            <form onSubmit={handleSimulateCustom} className="space-y-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Enter RFID UID (e.g. 04A3B17F2E8190)"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!customTag.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Gate Tap</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-400">
            Plug-and-Play USB Reader (125 kHz EM4100 / LF HID)
          </p>
        </div>

      </div>
    </div>
  );
}
