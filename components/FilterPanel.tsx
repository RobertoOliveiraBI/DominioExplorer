import React from 'react';
import { DomainFilterState } from '../types';
import { Settings2, Hash, Type, ArrowRightToLine, Globe } from 'lucide-react';

interface FilterPanelProps {
  filters: DomainFilterState;
  setFilters: React.Dispatch<React.SetStateAction<DomainFilterState>>;
  totalAvailable: number;
  totalFiltered: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters, totalAvailable, totalFiltered }) => {
  
  const handleInputChange = (key: keyof DomainFilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789".split("");

  return (
    <aside className="w-full md:w-80 flex-shrink-0 bg-white border-r border-gray-200 p-6 overflow-y-auto h-full shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2 mb-6 text-[#9ec421]">
        <Settings2 className="w-6 h-6" />
        <h2 className="text-xl font-bold text-gray-800">Filtros</h2>
      </div>

      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="flex justify-between text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">
          <span>Exibindo</span>
          <span className="text-[#9ec421] font-bold font-mono text-sm">{totalFiltered.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-[#9ec421] h-full transition-all duration-500" 
            style={{ width: `${totalAvailable > 0 ? (totalFiltered / totalAvailable) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="text-right text-[10px] text-gray-400 mt-1">
          de {totalAvailable.toLocaleString()} domínios
        </div>
      </div>

      <div className="space-y-8">
        {/* Length Filter */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <ArrowRightToLine className="w-4 h-4 text-[#9ec421]" /> Tamanho do Domínio
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="2"
              max="26"
              value={filters.minLength}
              onChange={(e) => handleInputChange('minLength', parseInt(e.target.value) || 2)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:ring-1 focus:ring-[#9ec421] focus:border-[#9ec421] outline-none transition-colors"
              placeholder="Min"
            />
            <span className="text-gray-400 font-bold">-</span>
            <input
              type="number"
              min="2"
              max="26"
              value={filters.maxLength}
              onChange={(e) => handleInputChange('maxLength', parseInt(e.target.value) || 26)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:ring-1 focus:ring-[#9ec421] focus:border-[#9ec421] outline-none transition-colors"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Extension Filter */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <Globe className="w-4 h-4 text-[#9ec421]" /> Extensão
          </label>
          <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
            {(['all', 'com.br', 'others'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => handleInputChange('extension', opt)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                  filters.extension === opt 
                    ? 'bg-white text-[#9ec421] shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                {opt === 'all' ? 'Todas' : opt === 'com.br' ? '.com.br' : 'Outras'}
              </button>
            ))}
          </div>
        </div>

        {/* Numbers Filter */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <Hash className="w-4 h-4 text-[#9ec421]" /> Números
          </label>
          <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
            {(['all', 'yes', 'no'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => handleInputChange('hasNumbers', opt)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                  filters.hasNumbers === opt 
                    ? 'bg-white text-[#9ec421] shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                {opt === 'all' ? 'Todos' : opt === 'yes' ? 'Com' : 'Sem'}
              </button>
            ))}
          </div>
        </div>

        {/* Prefix Filter */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <Type className="w-4 h-4 text-[#9ec421]" /> Começa com...
          </label>
          <input
            type="text"
            value={filters.startsWith}
            onChange={(e) => handleInputChange('startsWith', e.target.value.toLowerCase())}
            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-[#9ec421] focus:border-[#9ec421] outline-none transition-colors"
            placeholder="ex: web, loja..."
          />
        </div>

        {/* First Letter Grid */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
             Primeira Letra
          </label>
          <div className="grid grid-cols-6 gap-1">
            <button
               onClick={() => handleInputChange('firstLetter', '')}
               className={`col-span-6 py-1 text-xs rounded border font-medium transition-colors ${
                 filters.firstLetter === '' 
                   ? 'bg-[#9ec421] border-[#9ec421] text-white' 
                   : 'bg-white border-gray-200 text-gray-500 hover:border-[#9ec421] hover:text-[#9ec421]'
               }`}
            >
              Qualquer
            </button>
            {alphabet.map(char => (
              <button
                key={char}
                onClick={() => handleInputChange('firstLetter', char)}
                className={`py-1.5 text-xs font-mono rounded border uppercase transition-all ${
                  filters.firstLetter === char 
                    ? 'bg-[#9ec421] border-[#9ec421] text-white font-bold shadow-md' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#9ec421] hover:border-[#9ec421]'
                }`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};