import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, Search, Sparkles, AlertCircle, Loader2, CheckCircle2, ExternalLink, ListPlus, FileText, Trash2 } from 'lucide-react';
import { DomainFilterState, PaginationState, DomainStats, SOURCE_URL, PROXY_URL } from './types';
import { generateSemanticKeywords } from './services/geminiService';
import { FilterPanel } from './components/FilterPanel';
import { StatsCharts } from './components/StatsCharts';

function App() {
  const [rawDomains, setRawDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  
  // Semantic Search State
  const [semanticQuery, setSemanticQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const [filters, setFilters] = useState<DomainFilterState>({
    minLength: 2,
    maxLength: 26,
    startsWith: '',
    hasNumbers: 'all',
    extension: 'all',
    firstLetter: '',
    searchTerm: '',
    semanticKeywords: []
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 100
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(SOURCE_URL)}`);
        
        if (!response.ok) throw new Error("Falha ao baixar lista de domínios");
        
        const text = await response.text();
        const list = text.split('\n')
          .map(d => d.trim().toLowerCase())
          .filter(d => d.length > 0);

        setRawDomains(list);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar a lista automaticamente. O Registro.br pode estar bloqueando o acesso ou o proxy está indisponível.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle Semantic Search
  const handleSemanticSearch = async () => {
    if (!semanticQuery.trim()) {
      setFilters(prev => ({ ...prev, semanticKeywords: [] }));
      return;
    }
    
    setIsThinking(true);
    try {
      const keywords = await generateSemanticKeywords(semanticQuery);
      setFilters(prev => ({ ...prev, semanticKeywords: keywords }));
    } catch (err) {
      console.error("Failed to get semantic keywords", err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearSemantic = () => {
    setSemanticQuery('');
    setFilters(prev => ({ ...prev, semanticKeywords: [] }));
  };

  // Toggle Selection
  const toggleSelection = (domain: string) => {
    setSelectedDomains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domain)) {
        newSet.delete(domain);
      } else {
        newSet.add(domain);
      }
      return newSet;
    });
  };

  // Download Selected
  const downloadSelectedList = () => {
    if (selectedDomains.size === 0) return;
    const content = Array.from(selectedDomains).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meus-dominios-selecionados.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear Selection
  const clearSelection = () => {
      if(confirm("Tem certeza que deseja limpar sua lista de selecionados?")) {
          setSelectedDomains(new Set());
      }
  };

  // Filtering Logic
  const filteredDomains = useMemo(() => {
    let result = rawDomains;

    // 1. Length
    result = result.filter(d => d.length >= filters.minLength && d.length <= filters.maxLength);

    // 2. Extension
    if (filters.extension === 'com.br') {
      result = result.filter(d => d.endsWith('.com.br'));
    } else if (filters.extension === 'others') {
      result = result.filter(d => !d.endsWith('.com.br'));
    }

    // 3. Numbers
    if (filters.hasNumbers === 'yes') {
      result = result.filter(d => /\d/.test(d));
    } else if (filters.hasNumbers === 'no') {
      result = result.filter(d => !/\d/.test(d));
    }

    // 4. Starts With (Prefix)
    if (filters.startsWith) {
      result = result.filter(d => d.startsWith(filters.startsWith));
    }

    // 5. First Letter
    if (filters.firstLetter) {
      result = result.filter(d => d.startsWith(filters.firstLetter));
    }

    // 6. Semantic/Keyword Search
    if (filters.semanticKeywords.length > 0) {
      result = result.filter(d => 
        filters.semanticKeywords.some(keyword => d.includes(keyword))
      );
    } else if (filters.searchTerm) {
        result = result.filter(d => d.includes(filters.searchTerm));
    }

    return result;
  }, [rawDomains, filters]);

  // Statistics Logic
  const stats = useMemo<DomainStats>(() => {
    const byLengthMap = new Map<number, number>();
    const byLetterMap = new Map<string, number>();

    filteredDomains.forEach(d => {
      const len = d.length;
      byLengthMap.set(len, (byLengthMap.get(len) || 0) + 1);

      const first = d.charAt(0).toUpperCase();
      if (first) byLetterMap.set(first, (byLetterMap.get(first) || 0) + 1);
    });

    return {
      total: filteredDomains.length,
      byLength: Array.from(byLengthMap.entries())
        .map(([name, value]) => ({ name: name.toString(), value }))
        .sort((a, b) => parseInt(a.name) - parseInt(b.name)),
      byLetter: Array.from(byLetterMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name))
    };
  }, [filteredDomains]);

  // Pagination Logic
  const paginatedDomains = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredDomains.slice(start, start + pagination.itemsPerPage);
  }, [filteredDomains, pagination]);

  const totalPages = Math.ceil(filteredDomains.length / pagination.itemsPerPage);

  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filters]);


  // File Upload Handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const list = text.split('\n')
          .map(d => d.trim().toLowerCase())
          .filter(d => d.length > 0);
      setRawDomains(list);
      setError(null);
    };
    reader.readAsText(file);
  };

  const listContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] text-gray-700 font-sans">
      
      {/* Left Sidebar - Filters */}
      <FilterPanel 
        filters={filters} 
        setFilters={setFilters} 
        totalAvailable={rawDomains.length} 
        totalFiltered={filteredDomains.length}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        
        {/* Top Navbar (Black) */}
        <div className="bg-[#1d1d1d] text-white px-6 py-3 flex justify-between items-center shrink-0 shadow-md z-20">
           <div className="flex gap-6 text-sm font-medium">
             <a href="#" className="hover:text-[#9ec421] transition-colors hidden md:block">Sobre Domínios</a>
             <a href="#" className="hover:text-[#9ec421] transition-colors hidden md:block">Tecnologia</a>
             <a href="#" className="hover:text-[#9ec421] transition-colors hidden md:block">Ajuda</a>
           </div>
           <div className="flex items-center gap-4 text-sm">
              <span className="text-[#9ec421] font-bold cursor-pointer">REGISTRE</span>
           </div>
        </div>

        {/* Header & Search Section (White Hero) */}
        <header className="bg-white border-b border-gray-200 p-6 z-10 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            {/* Logo Area */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold tracking-tighter flex items-end gap-1">
                <span className="text-[#dedede] font-light">nic</span>
                <span className="text-[#dedede] font-light mx-1">|</span>
                <span className="text-[#9ec421]">registro</span>
                <span className="text-[#fcb900] text-2xl mb-1">.br</span>
                <span className="ml-2 text-gray-400 text-base font-normal tracking-normal">Explorer</span>
              </h1>
            </div>

            {/* Semantic Search Bar */}
            <div className="flex-1 max-w-3xl w-full">
               <div className="relative flex w-full">
                  <div className="relative flex items-center w-full bg-white rounded-l-md border border-gray-300 focus-within:border-[#9ec421] focus-within:ring-1 focus-within:ring-[#9ec421] transition-all">
                    <div className="pl-4 text-gray-400">
                      {isThinking ? <Loader2 className="w-5 h-5 animate-spin text-[#9ec421]" /> : <Sparkles className="w-5 h-5 text-[#9ec421]" />}
                    </div>
                    <input 
                      type="text"
                      value={semanticQuery}
                      onChange={(e) => setSemanticQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                      placeholder="Busca Inteligente: descreva sua ideia (ex: 'loja de calçados', 'startup agro')..."
                      className="w-full bg-transparent border-none py-3 px-4 text-gray-700 placeholder-gray-400 focus:ring-0 h-12"
                    />
                  </div>
                  <button 
                        onClick={handleSemanticSearch}
                        disabled={isThinking || !semanticQuery}
                        className="bg-[#9ec421] hover:bg-[#8db11d] text-white px-6 py-2 rounded-r-md font-bold text-lg transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                     <Search className="w-5 h-5" />
                  </button>
               </div>
               
               {/* Active Keywords */}
               {filters.semanticKeywords.length > 0 && (
                 <div className="flex flex-wrap gap-2 mt-3 items-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Conceitos extraídos:</span>
                   {filters.semanticKeywords.map((k, i) => (
                     <span key={i} className="px-2 py-0.5 rounded-full bg-[#f1f8e9] border border-[#dcedc8] text-[#558b2f] text-xs font-medium">
                       {k}
                     </span>
                   ))}
                   <button onClick={handleClearSemantic} className="text-xs text-gray-400 hover:text-red-500 underline ml-2">Limpar</button>
                 </div>
               )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div ref={listContainerRef} className="flex-1 overflow-y-auto p-6 scroll-smooth bg-[#f8f9fa]">
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 flex flex-col items-start gap-4 shadow-sm">
              <div className="flex items-center gap-3 text-red-700 font-bold">
                <AlertCircle className="w-6 h-6" />
                <h3>Erro ao carregar lista</h3>
              </div>
              <p className="text-red-600">{error}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                 <label className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-md cursor-pointer transition-colors text-sm text-gray-700 font-medium shadow-sm">
                    <FileText className="w-4 h-4" />
                    Carregar arquivo .txt manualmente
                    <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                 </label>
                 <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="text-[#9ec421] text-sm hover:underline flex items-center gap-1 font-bold">
                   Baixar original do Registro.br <ExternalLink className="w-3 h-3" />
                 </a>
              </div>
            </div>
          )}

          {!loading && !error && filteredDomains.length > 0 && (
            <>
              {/* Charts */}
              <StatsCharts stats={stats} />

              {/* Results Header & Pagination */}
              <div className="mb-4 flex flex-col sm:flex-row justify-between items-end gap-4 border-b border-gray-200 pb-4">
                 <div>
                     <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                         Resultados Disponíveis
                         <span className="bg-[#9ec421] text-white text-xs px-2 py-1 rounded-full">{filteredDomains.length}</span>
                     </h2>
                     <p className="text-sm text-gray-500 mt-1">Clique nos cartões para selecionar domínios para sua lista.</p>
                 </div>
                 <div className="flex gap-2 text-sm">
                    <button 
                       disabled={pagination.currentPage === 1}
                       onClick={() => {
                         setPagination(p => ({...p, currentPage: p.currentPage - 1}));
                         listContainerRef.current?.scrollTo({top: 0, behavior: 'smooth'});
                       }}
                       className="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1.5 text-gray-600 font-mono bg-gray-100 rounded-md border border-gray-200">
                      {pagination.currentPage} / {totalPages}
                    </span>
                    <button 
                       disabled={pagination.currentPage === totalPages}
                       onClick={() => {
                         setPagination(p => ({...p, currentPage: p.currentPage + 1}));
                         listContainerRef.current?.scrollTo({top: 0, behavior: 'smooth'});
                       }}
                       className="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                    >
                      Próxima
                    </button>
                 </div>
              </div>

              {/* Domain Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
                {paginatedDomains.map((domain) => {
                  const isSelected = selectedDomains.has(domain);
                  return (
                    <div 
                      key={domain} 
                      onClick={() => toggleSelection(domain)}
                      className={`group relative rounded-lg p-4 transition-all duration-200 flex justify-between items-center cursor-pointer border ${
                          isSelected 
                            ? 'bg-[#f0fdf4] border-[#9ec421] shadow-[0_0_0_1px_#9ec421]' 
                            : 'bg-white border-gray-200 hover:border-[#9ec421] hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                             isSelected ? 'bg-[#9ec421] border-[#9ec421]' : 'border-gray-300 group-hover:border-[#9ec421]'
                        }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`font-mono truncate font-medium ${isSelected ? 'text-[#2e7d32]' : 'text-gray-700'}`}>
                          {domain}
                        </span>
                      </div>
                      
                      <a 
                        href={`https://registro.br/busca-dominio/?fqdn=${domain}`} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-[#9ec421] hover:bg-gray-100 rounded transition-all"
                        title="Verificar disponibilidade real no Registro.br"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  );
                })}
              </div>

               {/* Bottom Pagination */}
               <div className="flex justify-center gap-2 text-sm pb-24">
                    <button 
                       disabled={pagination.currentPage === 1}
                       onClick={() => {
                         setPagination(p => ({...p, currentPage: p.currentPage - 1}));
                         listContainerRef.current?.scrollTo({top: 0, behavior: 'smooth'});
                       }}
                       className="px-4 py-2 rounded bg-white border border-gray-300 hover:bg-gray-50 shadow-sm text-gray-700 font-medium disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button 
                       disabled={pagination.currentPage === totalPages}
                       onClick={() => {
                         setPagination(p => ({...p, currentPage: p.currentPage + 1}));
                         listContainerRef.current?.scrollTo({top: 0, behavior: 'smooth'});
                       }}
                       className="px-4 py-2 rounded bg-white border border-gray-300 hover:bg-gray-50 shadow-sm text-gray-700 font-medium disabled:opacity-50"
                    >
                      Próxima
                    </button>
                 </div>
            </>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-[#9ec421]" />
              <p className="text-lg font-medium">Conectando ao Registro.br...</p>
            </div>
          )}

          {!loading && filteredDomains.length === 0 && !error && (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl mt-10 bg-white">
              <Search className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-lg font-medium text-gray-500">Nenhum domínio encontrado.</p>
              <p className="text-sm">Tente ajustar seus filtros ou termo de busca.</p>
              <button 
                onClick={() => {
                    setFilters({
                        minLength: 2,
                        maxLength: 26,
                        startsWith: '',
                        hasNumbers: 'all',
                        extension: 'all',
                        firstLetter: '',
                        searchTerm: '',
                        semanticKeywords: []
                    });
                    setSemanticQuery('');
                }}
                className="mt-4 text-[#9ec421] hover:underline font-bold"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}

        </div>

        {/* Floating Selection Bar */}
        {selectedDomains.size > 0 && (
           <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#1d1d1d] text-white px-6 py-4 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-4 fade-in duration-300 border border-gray-700">
              <div className="flex items-center gap-3">
                 <div className="bg-[#9ec421] text-black font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    {selectedDomains.size}
                 </div>
                 <span className="font-medium">domínios selecionados</span>
              </div>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="flex items-center gap-3">
                  <button 
                    onClick={clearSelection}
                    className="text-gray-400 hover:text-red-400 transition-colors p-2"
                    title="Limpar lista"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={downloadSelectedList}
                    className="bg-[#9ec421] hover:bg-[#8db11d] text-[#1d1d1d] px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Lista (.txt)
                  </button>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}

export default App;