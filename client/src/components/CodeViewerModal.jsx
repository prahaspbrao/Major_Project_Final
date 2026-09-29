import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { X, FileCode, Copy, Check, Loader2 } from 'lucide-react';

export const CodeViewerModal = ({ isOpen, onClose, repoId, filePath, startLine, endLine }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && repoId && filePath) {
      loadFileContent();
    }
  }, [isOpen, repoId, filePath]);

  const loadFileContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/repos/${repoId}/file`, {
        params: { filePath },
      });
      if (res.success) {
        setContent(res.data.content);
      }
    } catch (err) {
      setError(err.message || 'Failed to load file content.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const lines = content ? content.split('\n') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3 truncate">
            <FileCode className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="font-mono text-sm font-bold text-white truncate">{filePath}</span>
            {startLine && (
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Target Lines: {startLine} - {endLine}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:border-slate-600 transition"
              title="Copy Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:border-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <span>Fetching file source context...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          ) : (
            <div className="font-mono text-xs leading-relaxed space-y-0.5">
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const isTarget = startLine && endLine && lineNum >= startLine && lineNum <= endLine;
                return (
                  <div
                    key={idx}
                    className={`flex items-start px-3 py-0.5 rounded transition ${
                      isTarget
                        ? 'bg-blue-600/20 border-l-4 border-blue-500 text-slate-100 font-semibold'
                        : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span className="w-10 shrink-0 text-slate-600 select-none text-right pr-4 font-mono">
                      {lineNum}
                    </span>
                    <pre className="overflow-x-auto whitespace-pre font-mono">
                      <code>{line || ' '}</code>
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400 flex justify-between items-center">
          <span>Grounded Source Inspector</span>
          <span>{lines.length} Total Lines</span>
        </div>
      </div>
    </div>
  );
};
