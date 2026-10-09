import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function LanguageSelector({ compact = false }) {
  const { lang, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 p-1 rounded-xl shadow-sm">
      <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 shrink-0" />
      
      <button
        onClick={() => changeLanguage('EN')}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
          lang === 'EN'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        English
      </button>

      <button
        onClick={() => changeLanguage('HI')}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
          lang === 'HI'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        हिंदी
      </button>

      <button
        onClick={() => changeLanguage('MR')}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
          lang === 'MR'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        मराठी
      </button>
    </div>
  );
}
