import React, { useState, useEffect, useRef } from 'react';
import { useRepo } from '../context/RepoContext';
import { CitationCard } from '../components/CitationCard';
import { CodeViewerModal } from '../components/CodeViewerModal';
import API from '../services/api';
import {
  Send,
  Bot,
  User,
  Zap,
  Clock,
  Sparkles,
  Bug,
  Code,
  Wrench,
  HelpCircle,
  Loader2,
  FolderGit2,
  Plus
} from 'lucide-react';

export const ChatPage = () => {
  const { activeRepo, repositories, setActiveRepo } = useRepo();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('general');
  const [loading, setLoading] = useState(false);
  
  // Code Viewer Modal state
  const [viewerModal, setViewerModal] = useState({
    isOpen: false,
    filePath: '',
    startLine: null,
    endLine: null,
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (activeRepo) {
      loadSessions(activeRepo._id);
    }
  }, [activeRepo]);

  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession._id);
    }
  }, [activeSession]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadSessions = async (repoId) => {
    try {
      const res = await API.get(`/chat/sessions`, { params: { repoId } });
      if (res.success) {
        setSessions(res.data.sessions);
        if (res.data.sessions.length > 0) {
          setActiveSession(res.data.sessions[0]);
        } else {
          createNewSession(repoId);
        }
      }
    } catch (err) {
      console.error('Error fetching chat sessions:', err);
    }
  };

  const createNewSession = async (repoId = activeRepo?._id) => {
    if (!repoId) return;
    try {
      const res = await API.post('/chat/sessions', {
        repoId,
        mode,
        title: `${mode.toUpperCase()} Session`,
      });
      if (res.success) {
        setSessions((prev) => [res.data.session, ...prev]);
        setActiveSession(res.data.session);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error creating session:', err);
    }
  };

  const loadMessages = async (sessionId) => {
    try {
      const res = await API.get(`/chat/sessions/${sessionId}/messages`);
      if (res.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!query.trim() || !activeSession || loading) return;

    const userText = query.trim();
    setQuery('');
    setLoading(true);

    // Optimistic user message update
    const tempUserMsg = {
      _id: 'temp-' + Date.now(),
      sender: 'user',
      content: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await API.post(`/chat/sessions/${activeSession._id}/messages`, {
        query: userText,
        mode,
      });

      if (res.success) {
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== tempUserMsg._id),
          res.data.userMessage,
          res.data.assistantMessage,
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          _id: 'err-' + Date.now(),
          sender: 'assistant',
          content: '⚠️ Error processing query: ' + err.message,
          citations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openCodeViewer = (filePath, startLine, endLine) => {
    setViewerModal({
      isOpen: true,
      filePath,
      startLine,
      endLine,
    });
  };

  if (!activeRepo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <FolderGit2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">No Active Repository Selected</h2>
        <p className="text-sm text-slate-400 mt-2 mb-6">
          Select or index a code repository from the dashboard to begin grounded RAG chat queries.
        </p>
      </div>
    );
  }

  const modeIcons = {
    general: HelpCircle,
    explanation: Code,
    bug_localization: Bug,
    refactoring: Wrench,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)] flex flex-col">
      
      {/* Top Controls Header */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur shrink-0">
        
        {/* Repo & Session Selector */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>{activeRepo.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {activeRepo.stats?.totalChunks || 0} Chunks Indexed
              </span>
            </h2>
            <p className="text-xs text-slate-400">Grounding responses with file & line references</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 overflow-x-auto">
          {[
            { id: 'general', label: 'General', icon: HelpCircle },
            { id: 'explanation', label: 'Explanation', icon: Code },
            { id: 'bug_localization', label: 'Bug Localization', icon: Bug },
            { id: 'refactoring', label: 'Refactoring', icon: Wrench },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* New Session Button */}
        <button
          onClick={() => createNewSession()}
          className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-600 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-6 backdrop-blur">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Ask Anything About {activeRepo.name}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              The AI Developer Assistant uses vector similarity RAG to search indexed code chunks and provide grounded answers with exact source citations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl text-left">
              {[
                { title: 'Code Explanation', query: 'Explain how authentication middleware works in this repo' },
                { title: 'Bug Localization', query: 'Find potential null pointer or missing input validation bugs' },
                { title: 'Refactoring Suggestion', query: 'Suggest clean code refactoring for database controllers' },
                { title: 'Architecture Query', query: 'What are the main entry points and data flow models?' },
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(sample.query)}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-blue-500/50 hover:bg-slate-900 text-left transition group"
                >
                  <span className="text-xs font-semibold text-blue-400 block group-hover:text-blue-300">
                    {sample.title}
                  </span>
                  <span className="text-xs text-slate-300 mt-1 block truncate font-mono">
                    "{sample.query}"
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg._id}
                className={`flex space-x-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div className={`max-w-3xl space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10'
                        : 'bg-slate-900/90 text-slate-200 border border-slate-700/80 rounded-tl-none shadow-md'
                    }`}
                  >
                    {!isUser && msg.cached && (
                      <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 mb-3 w-max">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Redis Cache HIT ({msg.responseTimeMs || '<5'}ms)</span>
                      </div>
                    )}

                    <div className="prose prose-invert prose-sm max-w-none font-sans whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    {!isUser && msg.responseTimeMs && !msg.cached && (
                      <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center space-x-1 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>RAG Engine Response Time: {msg.responseTimeMs}ms</span>
                      </div>
                    )}
                  </div>

                  {/* Grounded Citations (if assistant message) */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block px-1">
                        Grounded Source Citations ({msg.citations.length})
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.citations.map((citation, idx) => (
                          <CitationCard
                            key={idx}
                            citation={citation}
                            onViewCode={openCodeViewer}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-slate-200 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex space-x-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center space-x-3">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Scanning vector index & generating grounded response...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form Footer */}
      <form onSubmit={handleSendMessage} className="mt-4 shrink-0">
        <div className="relative flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 focus-within:border-blue-500 shadow-xl backdrop-blur">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask a question in ${mode.toUpperCase().replace('_', ' ')} mode...`}
            className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-md transition shrink-0 ml-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Code Viewer Modal */}
      <CodeViewerModal
        isOpen={viewerModal.isOpen}
        onClose={() => setViewerModal((prev) => ({ ...prev, isOpen: false }))}
        repoId={activeRepo._id}
        filePath={viewerModal.filePath}
        startLine={viewerModal.startLine}
        endLine={viewerModal.endLine}
      />
    </div>
  );
};
