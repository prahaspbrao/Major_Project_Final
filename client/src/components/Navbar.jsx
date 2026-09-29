import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRepo } from '../context/RepoContext';
import { Bot, FolderGit2, MessageSquare, Activity, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { activeRepo, repositories, setActiveRepo } = useRepo();
  const location = useLocation();

  return (
    <nav className="bg-slate-800/90 backdrop-blur border-b border-slate-700/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight">RepoAI</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  CSE Major Project
                </span>
              </div>
            </Link>
          </div>

          {/* Active Repo Selector (if logged in) */}
          {user && (
            <div className="hidden md:flex items-center space-x-2 bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5">
              <FolderGit2 className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400 font-medium">Active Repository:</span>
              <select
                className="bg-transparent text-sm text-slate-200 font-semibold focus:outline-none cursor-pointer"
                value={activeRepo?._id || ''}
                onChange={(e) => {
                  const target = repositories.find((r) => r._id === e.target.value);
                  if (target) setActiveRepo(target);
                }}
              >
                {repositories.length === 0 && <option value="">No Repositories</option>}
                {repositories.map((repo) => (
                  <option key={repo._id} value={repo._id} className="bg-slate-800 text-slate-200">
                    {repo.name} ({repo.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nav Links */}
          {user ? (
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`flex items-center space-x-1.5 text-sm font-medium transition ${
                  location.pathname === '/' ? 'text-blue-400 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <FolderGit2 className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/chat"
                className={`flex items-center space-x-1.5 text-sm font-medium transition ${
                  location.pathname.startsWith('/chat') ? 'text-blue-400 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>RAG Chat</span>
              </Link>

              <Link
                to="/status"
                className={`flex items-center space-x-1.5 text-sm font-medium transition ${
                  location.pathname === '/status' ? 'text-blue-400 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">System Status</span>
              </Link>

              <div className="h-5 w-px bg-slate-700" />

              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs text-slate-400 font-medium">{user.role}</span>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg shadow-md shadow-blue-500/20 transition"
              >
                Register
              </Link>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
};
