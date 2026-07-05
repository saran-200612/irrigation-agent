import React, { useState } from 'react';
import { Droplet, Lock, Mail, User, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/client';

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        await apiClient.login(email, password);
        onLoginSuccess();
      } else {
        await apiClient.signup(email, password, fullName);
        setSuccessMsg('Account created successfully! You can now log in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-water/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-wheat/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] bg-surface border border-water/15 rounded-[12px] p-8 shadow-xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-[10px] bg-water/10 flex items-center justify-center border border-water/20 mb-3 animate-pulse">
            <Droplet className="w-6 h-6 text-water" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wider uppercase text-text">
            Irrigation Agent
          </h1>
          <p className="text-[11px] font-mono text-text-dim tracking-widest uppercase mt-1">
            Telemetry & Agronomic Decisions
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="bg-danger/10 text-danger border border-danger/25 p-3 rounded-[6px] text-xs flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-water/10 text-water border border-water/25 p-3 rounded-[6px] text-xs flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[11px] font-display font-semibold uppercase tracking-wider text-text-dim">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-text-dim/50" />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-bg/50 border border-water/15 rounded-[6px] pl-9 pr-3 py-2.5 text-[13px] text-text placeholder-text-dim/30 focus:border-water outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-display font-semibold uppercase tracking-wider text-text-dim">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-text-dim/50" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@smartfarm.io"
                className="w-full bg-bg/50 border border-water/15 rounded-[6px] pl-9 pr-3 py-2.5 text-[13px] text-text placeholder-text-dim/30 focus:border-water outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-display font-semibold uppercase tracking-wider text-text-dim">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-text-dim/50" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg/50 border border-water/15 rounded-[6px] pl-9 pr-3 py-2.5 text-[13px] text-text placeholder-text-dim/30 focus:border-water outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-water hover:bg-water/95 text-bg font-display font-bold text-[12px] uppercase tracking-widest py-3 rounded-[6px] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isLogin ? 'Establish Link' : 'Register Operator'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-water/10 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-[11.5px] text-water hover:underline font-mono"
          >
            {isLogin
              ? 'New Operator? Register Credentials'
              : 'Existing Operator? Authenticate Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
