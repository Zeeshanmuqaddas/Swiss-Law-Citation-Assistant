import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Replace,
  Copy,
  Check,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  BookOpen
} from "lucide-react";
import { validateAndNormalize } from "../lib/citationValidator";

export default function CitationValidator() {
  const [input, setInput] = useState(
    "BGE145III63\nart97or\n122 3 45\nA 2 ZGB\nTotally made up 45",
  );
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isBatchEditMode, setIsBatchEditMode] = useState(false);
  const [batchValues, setBatchValues] = useState<Record<number, string>>({});
  
  const [singleSearch, setSingleSearch] = useState("");
  const [singleResult, setSingleResult] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("citation-input");
    if (saved !== null) {
      setInput(saved);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem("citation-input", input);
    }, 5000);
    return () => clearInterval(interval);
  }, [input]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const lines = input.split("\n").filter((l) => l.trim() !== "");
  const results = lines.map(validateAndNormalize);

  const unverifiedLowConfidenceCount = results.filter(
    (res, i) => res.confidence < 0.7 && overrides[i] === undefined
  ).length;

  const handleVerifyAll = () => {
    const newOverrides = { ...overrides };
    results.forEach((res, i) => {
      if (res.confidence < 0.7 && newOverrides[i] === undefined) {
        newOverrides[i] = res.normalized;
      }
    });
    setOverrides(newOverrides);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h2 className="font-serif text-xl font-medium mb-4 flex items-center gap-2 text-white">
          <Search className="w-5 h-5 text-accent" />
          Single Case Law Search
        </h2>
        <p className="text-sm opacity-70 mb-4 leading-relaxed">
          Search for specific case law citations to retrieve normalized formats and confidence scores.
        </p>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (singleSearch.trim()) {
              setSingleResult(validateAndNormalize(singleSearch));
            }
          }}
          className="relative flex items-center"
        >
          <Search className="absolute left-4 w-4 h-4 opacity-40 text-accent" />
          <input
            type="text"
            className="w-full bg-black/40 border border-[var(--color-line)] rounded-lg py-3 pl-11 pr-24 font-mono text-sm focus:outline-none focus:border-accent/50 transition-colors"
            value={singleSearch}
            onChange={(e) => setSingleSearch(e.target.value)}
            placeholder="e.g. BGE 145 III 63"
          />
          <button 
            type="submit"
            disabled={!singleSearch.trim()}
            className="absolute right-2 px-4 py-1.5 bg-accent/20 hover:bg-accent/30 text-accent rounded transition-colors text-xs font-mono font-medium disabled:opacity-50"
          >
            Search
          </button>
        </form>

        {singleResult && (
          <div className={`mt-6 p-4 rounded-xl border ${singleResult.confidence >= 0.9 ? 'border-green-500/30 bg-green-500/5' : singleResult.confidence >= 0.7 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase opacity-50 tracking-wider">Normalized Result</span>
                <div className="flex items-center gap-2">
                  <a
                     href={`https://fedlex.admin.ch/search?q=${encodeURIComponent(singleResult.normalized)}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="font-serif text-xl tracking-tight text-white flex items-center gap-2 hover:underline hover:opacity-80 transition-opacity"
                  >
                     {singleResult.normalized}
                     <ExternalLink className="w-4 h-4 opacity-50 shrink-0" />
                  </a>
                  {singleResult.matchedType && singleResult.matchedType !== 'Unknown' && (
                    <span className="ml-2 font-mono text-xs opacity-60 bg-white/10 px-2 py-0.5 rounded text-white whitespace-nowrap">
                      {singleResult.matchedType}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-mono text-xs uppercase opacity-50 mb-1">Confidence</span>
                <span className={`font-mono text-lg ${singleResult.confidence >= 0.9 ? 'text-green-400' : singleResult.confidence >= 0.7 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {(singleResult.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2 mt-4 p-3 bg-black/20 rounded-lg border border-[var(--color-line)]">
              <span className="col-header flex items-center gap-2 text-xs">
                <BookOpen className="w-3 h-3" /> Explanation & Warnings
              </span>
              <p className="text-sm opacity-90">
                {singleResult.warning || "Citation format is highly confident and perfectly matches recognized Swiss indexing structures. No anomalies detected."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel p-6">
        <h2 className="font-serif text-xl font-medium mb-4 flex items-center gap-2 text-white">
          <Replace className="w-5 h-5 text-accent" />
          Batch Citation Normalizer
        </h2>
        <p className="text-sm opacity-70 mb-4 leading-relaxed">
          The normalization engine uses fuzzy matching heuristics specific to
          Swiss legal citations to identify, reconstruct, and validate malformed
          references. Warnings are generated for low-confidence corrections.
        </p>
        <textarea
          className="w-full h-36 bg-black/40 border border-[var(--color-line)] rounded-lg p-4 font-mono text-sm focus:outline-none focus:border-accent/50 transition-colors"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste citations here, one per line..."
        />
        {unverifiedLowConfidenceCount > 0 && !isBatchEditMode && (
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => {
                const initialBatchValues: Record<number, string> = {};
                results.forEach((res, i) => {
                  if (res.confidence < 0.7 && overrides[i] === undefined) {
                    initialBatchValues[i] = res.normalized;
                  }
                });
                setBatchValues(initialBatchValues);
                setIsBatchEditMode(true);
                setEditingIndex(null);
              }}
              className="px-4 py-2 font-mono text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Batch Edit Low Confidence ({unverifiedLowConfidenceCount})
            </button>
            <button
              onClick={handleVerifyAll}
              className="px-4 py-2 font-mono text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Verify All Low Confidence ({unverifiedLowConfidenceCount})
            </button>
          </div>
        )}
        {isBatchEditMode && (
          <div className="flex justify-end gap-3 mt-4 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 items-center">
            <div className="flex-1 flex items-center gap-2 text-sm text-blue-200">
              <Edit2 className="w-4 h-4 text-blue-400" />
              <span>Editing {Object.keys(batchValues).length} low-confidence citations.</span>
            </div>
            <button
              onClick={() => setIsBatchEditMode(false)}
              className="px-4 py-1.5 text-xs font-mono font-medium bg-white/5 hover:bg-white/10 text-white/70 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setOverrides((prev) => ({ ...prev, ...batchValues }));
                setIsBatchEditMode(false);
              }}
              className="px-4 py-1.5 text-xs font-mono font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save All Edits
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {results.map((res, i) => {
          const isOverridden = overrides[i] !== undefined;
          const isBatchEditingThis = isBatchEditMode && batchValues[i] !== undefined;
          const finalNormalized = isOverridden ? overrides[i] : (isBatchEditingThis ? batchValues[i] : res.normalized);
          const needsVerification =
            (res.confidence < 0.7 && !isOverridden) || editingIndex === i || isBatchEditingThis;

          return (
            <div
              key={i}
              className={`glass-panel p-4 flex flex-col gap-4 transition-colors ${needsVerification ? "border-red-500/30 bg-red-500/5" : "hover:border-accent/30"}`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="col-header truncate">Original Input</div>
                  <div className="font-mono text-sm opacity-60 bg-black/20 p-2 rounded truncate">
                    {res.original}
                  </div>
                </div>

                <div className="flex justify-center text-accent/50 hidden md:flex shrink-0">
                  <Replace className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="col-header text-accent truncate">
                    Normalized Output
                  </div>
                  <div className="flex items-center gap-2">
                    {res.confidence >= 0.9 || isOverridden ? (
                      <a
                        href={`https://fedlex.admin.ch/search?q=${encodeURIComponent(finalNormalized)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-serif text-lg tracking-tight truncate flex items-center gap-2 hover:underline hover:opacity-80 transition-opacity ${isOverridden ? "text-green-400" : "text-white"}`}
                      >
                        {finalNormalized}
                        <ExternalLink className="w-4 h-4 opacity-50 shrink-0" />
                      </a>
                    ) : (
                      <div
                        className={`font-serif text-lg tracking-tight truncate ${isOverridden ? "text-green-400" : "text-white"}`}
                      >
                        {finalNormalized}
                      </div>
                    )}
                    <button
                      onClick={() => handleCopy(finalNormalized, i)}
                      className="p-1 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white shrink-0"
                      title="Copy citation"
                    >
                      {copiedIndex === i ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-48 space-y-2 shrink-0">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="opacity-50">CONFIDENCE</span>
                    <span
                      className={
                        isOverridden || res.confidence >= 0.9
                          ? "text-green-400"
                          : res.confidence >= 0.7
                            ? "text-yellow-400"
                            : "text-red-400"
                      }
                    >
                      {isOverridden
                        ? "100% (Verified)"
                        : `${(res.confidence * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${isOverridden || res.confidence >= 0.9 ? "bg-green-500" : res.confidence >= 0.7 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{
                        width: isOverridden
                          ? "100%"
                          : `${res.confidence * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="w-full md:w-auto flex justify-end md:justify-center shrink-0 items-center gap-2 min-w-[3rem]">
                  {isOverridden || res.confidence >= 0.9 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  ) : res.confidence >= 0.7 ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                  )}
                  {isOverridden && editingIndex !== i && !isBatchEditingThis && (
                    <div className="flex gap-1 ml-2 border-l border-white/10 pl-2">
                      <button
                        onClick={() => setEditingIndex(i)}
                        className="p-1 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white"
                        title="Edit verified citation"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setOverrides((prev) => {
                            const newO = { ...prev };
                            delete newO[i];
                            return newO;
                          })
                        }
                        className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-500/60 hover:text-red-400"
                        title="Remove verification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {needsVerification && (
                <div
                  className={`mt-2 p-3 ${editingIndex === i || isBatchEditingThis ? "bg-blue-500/10 border-blue-500/20" : "bg-red-500/10 border-red-500/20"} border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div
                    className={`flex items-start md:items-center gap-2 text-sm ${editingIndex === i || isBatchEditingThis ? "text-blue-200" : "text-red-200"}`}
                  >
                    {editingIndex === i || isBatchEditingThis ? (
                      <Edit2 className="w-4 h-4 text-blue-400 mt-0.5 md:mt-0 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 md:mt-0 shrink-0" />
                    )}
                    <span>
                      {editingIndex === i || isBatchEditingThis
                        ? isBatchEditingThis ? "Batch editing citation." : "Edit your verified citation."
                        : `Low confidence${res.matchedType && res.matchedType !== "Unknown" ? ` (${res.matchedType} matched)` : ""}. Please verify or correct this citation.`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {isBatchEditingThis ? (
                      <input
                        type="text"
                        value={batchValues[i]}
                        onChange={(e) => setBatchValues(prev => ({ ...prev, [i]: e.target.value }))}
                        className="flex-1 md:w-64 px-3 py-1.5 text-xs font-mono bg-black/40 border border-blue-500/30 focus:border-blue-400 rounded focus:outline-none text-white placeholder-white/30"
                        placeholder="Correct citation..."
                      />
                    ) : (
                      <>
                        <input
                          type="text"
                          defaultValue={
                            isOverridden ? overrides[i] : res.normalized
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setOverrides((prev) => ({
                                ...prev,
                                [i]: e.currentTarget.value,
                              }));
                              setEditingIndex(null);
                            }
                          }}
                          className={`flex-1 md:w-48 px-3 py-1.5 text-xs font-mono bg-black/40 border ${editingIndex === i ? "border-blue-500/30 focus:border-blue-400" : "border-red-500/30 focus:border-red-400"} rounded focus:outline-none text-white placeholder-white/30`}
                          placeholder="Correct citation..."
                        />
                        <button
                          onClick={(e) => {
                            const inputEl = e.currentTarget
                              .previousElementSibling as HTMLInputElement;
                            const value = inputEl ? inputEl.value : res.normalized;
                            setOverrides((prev) => ({ ...prev, [i]: value }));
                            setEditingIndex(null);
                          }}
                          className={`px-4 py-1.5 text-xs font-mono font-medium ${editingIndex === i ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-200" : "bg-red-500/20 hover:bg-red-500/30 text-red-200"} rounded transition-colors whitespace-nowrap`}
                        >
                          {editingIndex === i ? "Save" : "Verify"}
                        </button>
                        {editingIndex === i && (
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-4 py-1.5 text-xs font-mono font-medium bg-white/5 hover:bg-white/10 text-white/70 rounded transition-colors whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {results.length === 0 && (
          <div className="text-center font-mono text-sm opacity-40 p-8 border border-dashed border-[var(--color-line)] rounded-xl">
            Input citations above to see normalization results.
          </div>
        )}
      </div>

      {results.some((r) => r.warning) && (
        <div className="p-5 border border-yellow-500/30 bg-yellow-500/5 rounded-xl flex gap-4 text-sm text-yellow-200/90 shadow-[0_0_20px_rgba(234,179,8,0.05)]">
          <AlertTriangle className="w-6 h-6 shrink-0 text-yellow-500 mt-0.5" />
          <div className="space-y-2">
            <strong className="font-serif block text-base text-yellow-400">
              Normalization Assessement Warnings
            </strong>
            <ul className="list-disc pl-4 space-y-2 opacity-90">
              {results
                .filter((r) => r.warning)
                .map((r, i) => (
                  <li key={i}>
                    <span className="font-mono opacity-60 bg-black/30 px-1 rounded mr-2">
                      [{r.original}]
                    </span>
                    {r.warning}
                    {r.matchedType && r.matchedType !== "Unknown" && (
                      <span className="ml-2 font-mono text-xs opacity-60 bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-500/80 whitespace-nowrap">
                        Matched: {r.matchedType}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
