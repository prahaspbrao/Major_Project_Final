import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepo } from '../context/RepoContext';
import { MetricCard } from '../components/MetricCard';
import {
  FolderGit2,
  Cpu,
  Layers,
  FileCode2,
  Plus,
  RefreshCw,
  Trash2,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Code
} from 'lucide-react';

export const Dashboard = () => {
  const {
    repositories,
    activeRepo,
    setActiveRepo,
    fetchRepositories,
    createRepository,
    indexRepository,
    deleteRepository,
    loading,
  } = useRepo();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [repoDesc, setRepoDesc] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [indexingRepoId, setIndexingRepoId] = useState(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!repoName.trim()) return;
    setError('');
    try {
      const res = await createRepository({
        name: repoName,
        description: repoDesc,
        localPath: repoPath,
      });
      if (res.success) {
        setShowCreateModal(false);
        setRepoName('');
        setRepoDesc('');
        setRepoPath('');
        // Automatically index newly created repo
        handleIndex(res.data.repo._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to create repository');
    }
  };

  const handleIndex = async (repoId) => {
    setIndexingRepoId(repoId);
    try {
      await indexRepository(repoId);
    } catch (err) {
      alert('Indexing failed: ' + err.message);
    } finally {
      setIndexingRepoId(null);
    }
  };

  const handleDelete = async (repoId, name) => {
    if (window.confirm(`Are you sure you want to delete repository "${name}"?`)) {
      await deleteRepository(repoId);
    }
  };

  // Compute aggregate stats
  const totalFiles = repositories.reduce((sum, r) => sum + (r.stats?.totalFiles || 0), 0);
  const totalChunks = repositories.reduce((sum, r) => sum + (r.stats?.totalChunks || 0), 0);
  const totalLines = repositories.reduce((sum, r) => sum + (r.stats?.totalLines || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/40 via-slate-800 to-indigo-900/40 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            AI Developer Assistant Workspace
          </h1>
          <p className="text-slate-300 mt-2 text-sm sm:text-base max-w-2xl">
            Semantic repository indexing, dense vector search, grounded RAG explanation, bug localization, and refactoring suggestions.
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-blue-500/25 transition shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Add Repository</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Repositories"
          value={repositories.length}
          subtitle="Indexed Codebases"
          icon={FolderGit2}
          color="blue"
        />
        <MetricCard
          title="Semantic Chunks"
          value={totalChunks}
          subtitle="Indexed Vector Vectors"
          icon={Layers}
          color="purple"
        />
        <MetricCard
          title="Total Files & Lines"
          value={`${totalFiles} / ${totalLines}`}
          subtitle="Parsed Source Files"
          icon={FileCode2}
          color="green"
        />
        <MetricCard
          title="RAG Engine"
          value="Vector RAG"
          subtitle="Redis Cache Active"
          icon={Cpu}
          color="amber"
        />
      </div>

      {/* Repository List Section */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 backdrop-blur">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Target Code Repositories</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage and re-index project repositories</p>
          </div>
          <button
            onClick={fetchRepositories}
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 border border-slate-700 transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {repositories.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-xl">
            <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No Repositories Indexed Yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4 max-w-md mx-auto">
              Add a code repository to perform semantic parsing, chunking, and grounded RAG querying.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Repository</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {repositories.map((repo) => {
              const isIndexing = indexingRepoId === repo._id || repo.status === 'indexing';
              const isSelected = activeRepo?._id === repo._id;

              return (
                <div
                  key={repo._id}
                  className={`rounded-2xl border p-5 transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-blue-500/80 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5 truncate">
                        <FolderGit2 className={`w-5 h-5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                        <h3 className="font-bold text-white text-base truncate">{repo.name}</h3>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1 shrink-0 ${
                          repo.status === 'indexed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : repo.status === 'indexing'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {repo.status === 'indexed' && <CheckCircle2 className="w-3 h-3" />}
                        {repo.status === 'indexing' && <Clock className="w-3 h-3" />}
                        {repo.status === 'failed' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                        <span className="capitalize">{repo.status}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {repo.description || 'No description provided.'}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs">
                      <div>
                        <span className="block text-slate-500 text-[10px] uppercase font-bold">Files</span>
                        <span className="font-semibold text-slate-200">{repo.stats?.totalFiles || 0}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[10px] uppercase font-bold">Chunks</span>
                        <span className="font-semibold text-slate-200">{repo.stats?.totalChunks || 0}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[10px] uppercase font-bold">Lines</span>
                        <span className="font-semibold text-slate-200">{repo.stats?.totalLines || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleIndex(repo._id)}
                      disabled={isIndexing}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isIndexing ? 'animate-spin' : ''}`} />
                      <span>{isIndexing ? 'Indexing...' : 'Re-index'}</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setActiveRepo(repo);
                          navigate('/chat');
                        }}
                        className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center space-x-1 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Query RAG</span>
                      </button>

                      <button
                        onClick={() => handleDelete(repo._id, repo.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                        title="Delete Repo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Creating Repository */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Add Code Repository</h2>
            <p className="text-xs text-slate-400 mb-6">
              Create a repository record. Leave path blank to index the default high-level project code sample.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Repository Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MERN-ECommerce-Engine"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Full-stack web application repository..."
                  value={repoDesc}
                  onChange={(e) => setRepoDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Local Folder Path (Optional)
                </label>
                <input
                  type="text"
                  placeholder="C:\Projects\my-app (or leave blank for sample code)"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md"
                >
                  Create & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
