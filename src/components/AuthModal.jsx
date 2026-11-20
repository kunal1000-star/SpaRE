import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Edit2, 
  Save, 
  RotateCcw,
  Loader2 
} from 'lucide-react';
import { auth } from '../storage/auth';
import { updateUserProfileInNeon } from '../storage/api';
import ConfirmationModal from './ConfirmationModal';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  user, 
  onAuthSuccess, 
  onSignOut,
  onUpdateUser 
}) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile Edit State (Kept closed by default)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Sync edit form with current user on modal open or user change
  useEffect(() => {
    if (isOpen) {
      setIsEditingProfile(false);
      setProfileError('');
      setProfileSuccess('');
      setError('');
      setSuccess('');
      if (user) {
        setEditName(user.name || '');
        setEditEmail(user.email || '');
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await auth.signUp.email({
          email,
          password,
          name: name.trim() || email.split('@')[0],
        });
        if (res.error) {
          setError(res.error.message || 'Failed to create account.');
        } else {
          if (!res.data?.user?.id) {
            setError('Account was created but no authenticated user session was returned. Please sign in again.');
            return;
          }
          setSuccess('Account created successfully!');
          onAuthSuccess(res.data.user);
          setTimeout(() => onClose(), 1000);
        }
      } else {
        const res = await auth.signIn.email({
          email,
          password,
        });
        if (res.error) {
          setError(res.error.message || 'Invalid email or password.');
        } else {
          if (!res.data?.user?.id) {
            setError('Sign in succeeded but no authenticated user session was returned. Please try again.');
            return;
          }
          setSuccess('Signed in successfully!');
          onAuthSuccess(res.data.user);
          setTimeout(() => onClose(), 1000);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider) => {
    setError('');
    try {
      await auth.signIn.social({ provider });
    } catch (err) {
      setError(err.message || `Failed to sign in with ${provider}.`);
    }
  };

  const handleLogout = () => {
    onClose();
    if (onSignOut) {
      onSignOut();
    }
  };

  // Trigger Confirmation before updating profile
  const handleRequestProfileSave = (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();

    if (!trimmedName) {
      setProfileError('Display Name cannot be empty.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setProfileError('Please provide a valid email address.');
      return;
    }

    if (trimmedName === (user.name || '').trim() && trimmedEmail === (user.email || '').trim().toLowerCase()) {
      setProfileError('No changes detected.');
      return;
    }

    // Open confirmation dialog
    setConfirmConfig({
      title: 'Update Profile Details?',
      message: `Kya aap apni profile details update karna chahte hain?`,
      subMessage: `Name: "${trimmedName}" | Email: "${trimmedEmail}". Changes Neon Cloud me live update honge.`,
      confirmText: 'Yes, Update Profile',
      cancelText: 'Cancel',
      type: 'info',
      onConfirm: () => performProfileUpdate(trimmedName, trimmedEmail),
    });
  };

  const performProfileUpdate = async (newName, newEmail) => {
    setConfirmConfig(null);
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await updateUserProfileInNeon({
        userId: user.id || user.email,
        name: newName,
        email: newEmail,
      });

      if (res && res.success) {
        const updatedUser = {
          ...user,
          name: newName,
          email: newEmail,
        };
        try {
          localStorage.setItem('spare_auth_user', JSON.stringify(updatedUser));
        } catch {}

        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }

        setProfileSuccess('Profile successfully updated in cloud database!');
        setIsEditingProfile(false);
      } else {
        setProfileError(res?.error || 'Failed to update profile details.');
      }
    } catch (err) {
      setProfileError(err.message || 'Error occurred while updating profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileError('');
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
        onClick={() => {
          if (!isEditingProfile) onClose();
        }}
      >
        <div 
          className="glass-modal w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden my-4 border border-cyan-500/30 animate-modal-pop" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-cyan-950/20">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-md shadow-cyan-500/20">
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cloud Account</h3>
                <p className="text-[10px] text-slate-400">Secure Cloud Identity & Realtime Sync</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 glass-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {user ? (
              /* Signed In User View */
              <div className="space-y-4">
                {!isEditingProfile ? (
                  /* Standard Clean View (NOT open by default) */
                  <div className="space-y-4 text-center animate-fade-in">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center mx-auto text-lg font-bold shadow-md shadow-cyan-500/10">
                      {user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">{user.name || 'SpaRE Student'}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user.email}</p>
                    </div>

                    <div className="p-2.5 rounded-xl glass-panel border border-emerald-500/20 flex items-center justify-center space-x-2 text-[11px] text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Syncing revisions to your personal account</span>
                    </div>

                    {profileSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center space-x-2 text-left">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{profileSuccess}</span>
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      {/* Edit Profile Button - Opens Edit Mode */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(true);
                          setProfileError('');
                          setProfileSuccess('');
                          setEditName(user.name || '');
                          setEditEmail(user.email || '');
                        }}
                        className="w-full py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] flex items-center justify-center space-x-1.5 glass-btn active:scale-95 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </button>

                      {/* Sign Out Button */}
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-[11px] flex items-center justify-center space-x-1.5 glass-btn active:scale-95 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Edit Profile Form (Only shown when user clicks Edit Profile) */
                  <form onSubmit={handleRequestProfileSave} className="space-y-3.5 animate-pop-in">
                    <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                      <h4 className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Update Profile Details</span>
                      </h4>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Display Name Input */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Display Name
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="e.g. Kunal Rajak"
                          className="w-full glass-input rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={e => setEditEmail(e.target.value)}
                          placeholder="kunalrajak1000@gmail.com"
                          className="w-full glass-input rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {profileError && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start space-x-2 text-[10px] text-rose-300">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{profileError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={profileSaving}
                        className="py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] font-semibold flex items-center justify-center space-x-1 glass-btn active:scale-95"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>

                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-[11px] shadow-md shadow-cyan-600/30 border border-cyan-400/30 flex items-center justify-center space-x-1.5 glass-btn active:scale-95 disabled:opacity-50"
                      >
                        {profileSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Update Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Sign In / Sign Up Form (When Not Logged In) */
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Tab Selector */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(''); }}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                      mode === 'signin' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(''); }}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                      mode === 'signup' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Social Login */}
                <button
                  type="button"
                  onClick={() => handleSocialSignIn('google')}
                  className="w-full py-2 px-3 rounded-xl glass-panel hover:border-white/20 text-slate-200 text-[11px] font-semibold flex items-center justify-center space-x-2 transition-all glass-btn"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center space-x-2 text-slate-500 text-[10px]">
                  <div className="flex-1 h-px bg-white/10" />
                  <span>or with email</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Name (for sign up) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Your Name</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kunal Rajak"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full glass-input rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="student@college.edu"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full glass-input rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full glass-input rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start space-x-2 text-[10px] text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start space-x-2 text-[10px] text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-[11px] shadow-md shadow-cyan-600/25 flex items-center justify-center space-x-1.5 active:scale-95 glass-btn light-sweep disabled:opacity-50"
                >
                  <span>{loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Profile Update */}
      {confirmConfig && (
        <ConfirmationModal
          isOpen={true}
          title={confirmConfig.title}
          message={confirmConfig.message}
          subMessage={confirmConfig.subMessage}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          type={confirmConfig.type}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </>
  );
}
