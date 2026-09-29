import React from 'react';
import { FileCode, ExternalLink, Code2, ShieldAlert } from 'lucide-react';

export const CitationCard = ({ citation, onViewCode }) => {
  const matchPct = (citation.score * 100).toFixed(1);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 hover:border-blue-500/50 transition group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-mono font-semibold text-slate-200 truncate">
            {citation.filePath}
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300 shrink-0">
            L{citation.startLine} - L{citation.endLine}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {matchPct}% Match
          </span>
          <button
            onClick={() => onViewCode(citation.filePath, citation.startLine, citation.endLine)}
            className="text-xs flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition"
          >
            <span>View Source</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {citation.symbolName && (
        <div className="mt-2 text-xs text-slate-400 flex items-center space-x-1 font-mono">
          <Code2 className="w-3 h-3 text-indigo-400" />
          <span>Symbol: <strong className="text-slate-300">{citation.symbolName}</strong></span>
        </div>
      )}

      {citation.snippet && (
        <pre className="mt-2 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 overflow-x-auto max-h-24">
          <code>{citation.snippet}</code>
        </pre>
      )}
    </div>
  );
};
