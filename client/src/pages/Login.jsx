import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Mail, Lock, AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Soft ambient glow behind the card, same blue/indigo as the logo */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 sm:p-10 w-full max-w-md shadow-2xl backdrop-blur">
        {/* Thin highlight along the top edge of the card */}
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/30 ring-1 ring-white/10">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
          <p className="text-sm text-slate-400 mt-1.5">Sign in to your AI Developer Assistant</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email address
            </label>
            <div className="relative group">
              <Mail className="w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors absolute left-3.5 top-3" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@institution.edu"
                className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative group">
              <Lock className="w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors absolute left-3.5 top-3" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-slate-700 hover:border-slate-600 rounded-xl py-2.5 pl-11 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-2.5 p-0.5 rounded-md text-slate-500 hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700/60 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-blue-400 hover:text-blue-300 hover:underline font-semibold rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          >
            Register account
          </Link>
        </div>
      </div>
    </div>
  );
};