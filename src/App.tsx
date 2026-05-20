/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Search, ChevronRight, BookOpen, Scale, Clock, Globe2, Loader2, Sparkles, BookMarked, UserCircle2, GraduationCap, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import CitationValidator from './components/CitationValidator';
import MultiAgentChat from './components/MultiAgentChat';

// Types
interface CitationResult {
  citation: string;
  confidence_score: number;
  relevance_explanation: string;
  temporal_context: string;
  language_matches: {
    german: string[];
    french: string[];
  };
}

interface ResearchResponse {
  query: string;
  results: CitationResult[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'orchestrator' | 'retrieval' | 'validation'>('orchestrator');
  
  const [query, setQuery] = useState('employment termination rights damages');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ResearchResponse | null>(null);
  
  const [selectedCitation, setSelectedCitation] = useState<CitationResult | null>(null);
  const [tutorMode, setTutorMode] = useState<'beginner' | 'professional'>('beginner');
  const [isTutoring, setIsTutoring] = useState(false);
  const [tutorResponse, setTutorResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setSelectedCitation(null);
    setTutorResponse(null);
    
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!res.ok) {
        throw new Error("Failed to search. Please try again.");
      }
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCitationClick = async (citation: CitationResult) => {
    setSelectedCitation(citation);
    setIsTutoring(true);
    setTutorResponse(null);
    
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citation: citation.citation, mode: tutorMode })
      });
      if (!res.ok) throw new Error("Failed to load tutor explanation");
      const data = await res.json();
      setTutorResponse(data.result);
    } catch(err: any) {
      setTutorResponse("Error loading explanation: " + err.message);
    } finally {
      setIsTutoring(false);
    }
  };

  const handleModeChange = (mode: 'beginner' | 'professional') => {
    if (tutorMode === mode) return;
    setTutorMode(mode);
    if (selectedCitation) {
      handleCitationClick(selectedCitation);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--color-line)] pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Scale className="w-8 h-8 text-accent" />
            <h1 className="font-serif text-3xl font-medium tracking-tight">SwissLaw Intelligence</h1>
          </div>
          <p className="font-mono text-xs opacity-60 uppercase tracking-widest">
            Agentic Retrieval • Qdrant Vectors • Cross-Encoder Reranking
          </p>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-[var(--color-line)] overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('orchestrator')}
          className={`px-6 py-3 font-mono text-sm uppercase tracking-wide border-b-2 transition-all whitespace-nowrap -mb-[1px] ${
            activeTab === 'orchestrator' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-white/50 hover:text-white hover:border-white/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4" /> Multi-Agent Orchestrator
          </div>
        </button>
        <button
          onClick={() => setActiveTab('retrieval')}
          className={`px-6 py-3 font-mono text-sm uppercase tracking-wide border-b-2 transition-all whitespace-nowrap -mb-[1px] ${
            activeTab === 'retrieval' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-white/50 hover:text-white hover:border-white/30'
          }`}
        >
          Agentic Retrieval
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={`px-6 py-3 font-mono text-sm uppercase tracking-wide border-b-2 transition-all whitespace-nowrap -mb-[1px] ${
            activeTab === 'validation' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-white/50 hover:text-white hover:border-white/30'
          }`}
        >
          Citation Normalization
        </button>
      </div>

      {activeTab === 'orchestrator' ? (
        <main className="flex-1 w-full pt-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <MultiAgentChat />
          </motion.div>
        </main>
      ) : activeTab === 'retrieval' ? (
        <main className="flex-1 grid lg:grid-cols-[1fr_400px] gap-8 mt-4">
          {/* Main Research Column */}
          <section className="space-y-8">
            <form onSubmit={handleSearch} className="relative">
               <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 opacity-40" />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your legal issue (e.g. contract termination damages)"
                  className="w-full bg-black/20 border border-[var(--color-line)] rounded-full py-4 pl-12 pr-32 font-sans text-lg focus:outline-none focus:border-accent/50 transition-colors"
                  disabled={isSearching}
                />
                <button 
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className="absolute right-2 px-6 py-2 bg-[var(--color-ink)] text-[var(--color-bg)] rounded-full font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Retrieve'}
                </button>
              </div>
               {error && <p className="text-red-400 mt-4 font-mono text-sm">{error}</p>}
            </form>

            {/* Results Grid */}
            <AnimatePresence mode="wait">
              {results && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 mb-4 col-header">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>{results.results.length} normalized citations retrieved</span>
                  </div>

                  {results.results.map((result, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleCitationClick(result)}
                      className={`p-6 border rounded-xl cursor-pointer transition-all ${selectedCitation?.citation === result.citation ? 'border-accent bg-accent/5' : 'border-[var(--color-line)] bg-black/20 hover:border-accent/30'}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-serif text-2xl font-medium tracking-tight text-white flex items-center gap-3">
                          <BookMarked className="w-5 h-5 text-accent" />
                          {result.citation}
                        </h3>
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-xs uppercase opacity-50 mb-1">Confidence</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-[var(--color-line)] rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${result.confidence_score * 100}%` }}
                                className="h-full bg-accent"
                              />
                            </div>
                            <span className="font-mono text-sm text-accent">{(result.confidence_score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-2">
                          <span className="col-header flex items-center gap-2">
                            <BookOpen className="w-3 h-3" /> Explainability
                          </span>
                          <p className="text-sm/relaxed opacity-90">{result.relevance_explanation}</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <span className="col-header flex items-center gap-2">
                              <Clock className="w-3 h-3" /> Temporal Context
                            </span>
                            <p className="text-sm font-medium opacity-80">{result.temporal_context}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <span className="col-header flex items-center gap-2">
                              <Globe2 className="w-3 h-3" /> Multi-Lingual Expansion
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {result.language_matches.german.map((term, i) => (
                                <span key={`de-${i}`} className="px-2 py-1 text-xs font-mono bg-white/5 rounded border border-white/10 opacity-70">
                                  DE: {term}
                                </span>
                              ))}
                              {result.language_matches.french.map((term, i) => (
                                <span key={`fr-${i}`} className="px-2 py-1 text-xs font-mono bg-white/5 rounded border border-white/10 opacity-70">
                                  FR: {term}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {!results && !isSearching && (
              <div className="flex flex-col items-center justify-center p-12 lg:p-24 border border-dashed border-[var(--color-line)] rounded-xl opacity-40">
                <Scale className="w-12 h-12 mb-4" />
                <p className="font-serif text-lg italic text-center">Awaiting queries. System analyzes Swiss precedence.</p>
              </div>
            )}
          </section>

          {/* Tutor Sidebar */}
          <aside className="h-[calc(100vh-16rem)] sticky top-24">
            <div className="glass-panel h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[var(--color-line)] flex items-center justify-between bg-black/20">
                <h2 className="font-serif text-lg font-medium flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-accent" />
                  AI Tutor Interface
                </h2>
              </div>
              
              <div className="p-3 border-b border-[var(--color-line)] flex bg-black/40">
                <button 
                  onClick={() => handleModeChange('beginner')}
                  className={`flex-1 py-1.5 text-xs uppercase tracking-wider font-medium font-mono rounded transition-colors ${tutorMode === 'beginner' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'}`}
                >
                  Beginner
                </button>
                <button 
                  onClick={() => handleModeChange('professional')}
                  className={`flex-1 py-1.5 text-xs uppercase tracking-wider font-medium font-mono rounded transition-colors ${tutorMode === 'professional' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'}`}
                >
                  Professional
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <AnimatePresence mode="wait">
                  {!selectedCitation && (
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       className="h-full flex flex-col items-center justify-center text-center opacity-40"
                     >
                       <UserCircle2 className="w-12 h-12 mb-4" />
                       <p className="text-sm">Select a citation from the results to receive targeted educational guidance.</p>
                     </motion.div>
                  )}

                  {selectedCitation && isTutoring && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-center py-12"
                    >
                      <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    </motion.div>
                  )}

                  {selectedCitation && !isTutoring && tutorResponse && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="markdown-body"
                    >
                       <div className="mb-6 pb-4 border-b border-white/10">
                          <span className="col-header block mb-2">Analyzing</span>
                          <h4 className="font-serif text-xl tracking-tight text-white">{selectedCitation.citation}</h4>
                       </div>
                       <div className="text-sm opacity-90">
                         <Markdown>{tutorResponse}</Markdown>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </aside>
        </main>
      ) : (
        <main className="flex-1 w-full max-w-4xl pt-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <CitationValidator />
          </motion.div>
        </main>
      )}
    </div>
  );
}
