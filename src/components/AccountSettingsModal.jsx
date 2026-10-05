import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ShieldAlert,
  Trash2,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccountSettingsModal({ isOpen, onClose }) {
  const { user, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'backoffice';
  const isConsumerOrProsumer = userRole === 'consumer' || userRole === 'prosumer';

  // Synchronize initial form state whenever modal opens or user updates
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowDeleteConfirm(false);
      setDeleteConfirmationText('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Full name cannot be blank.');
      return;
    }

    if (username.trim().length > 0 && username.trim().length < 3) {
      toast.error('Username must be at least 3 characters.');
      return;
    }

    if (newPassword || currentPassword) {
      if (!currentPassword) {
        toast.error('Please enter your current password to set a new password.');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match.');
        return;
      }
    }

    try {
      setIsSaving(true);
      await updateProfile({
        fullName: fullName.trim(),
        username: username.trim() || undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      toast.success('Account profile updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update account profile.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      toast.error('Please type DELETE to confirm account removal.');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteAccount();
      toast.success('Your account has been deleted.');
      onClose();
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete account.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#111410] border border-[#2a2f27] shadow-2xl p-6 text-[#f0f0e8]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#2a2f27]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e9f85b]/10 border border-[#e9f85b]/30 flex items-center justify-center text-[#e9f85b]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-[#f0f0e8]">Account Settings</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#92988d]">{user.email}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#1b2219] text-[#e9f85b] border border-[#2a2f27]">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#92988d] hover:text-[#f0f0e8] hover:bg-[#1b2219] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            {/* Section: Profile Info */}
            <div>
              <label className="block text-xs font-medium text-[#92988d] mb-1">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#92988d] mb-1">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#92988d] mb-1">
                  Registered Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                  <input
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0c0e0b] border border-[#1e231c] text-sm text-[#71786e] cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Section: Change Password */}
            <div className="pt-2 border-t border-[#2a2f27]">
              <span className="block text-xs font-semibold text-[#f0f0e8] uppercase tracking-wider mb-2">
                Change Password <span className="text-[#92988d] font-normal normal-case">(leave blank to keep current)</span>
              </span>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#92988d] mb-1">
                    Current password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Required only if changing password"
                      className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666c63] hover:text-[#f0f0e8]"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#92988d] mb-1">
                      New password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 chars"
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666c63] hover:text-[#f0f0e8]"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#92988d] mb-1">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666c63]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#151914] border border-[#2a2f27] text-sm text-[#f0f0e8] placeholder-[#666c63] focus:outline-none focus:border-[#e9f85b] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666c63] hover:text-[#f0f0e8]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-[#0b0d0b] bg-[#e9f85b] hover:bg-[#d6e44b] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving profile changes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save profile changes</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Section: Account Termination / Deletion */}
          <div className="mt-6 pt-5 border-t border-[#2a2f27]">
            {isAdmin ? (
              /* Admin Protection Notice */
              <div className="p-3.5 rounded-xl bg-[#161a15] border border-[#2a2f27] flex items-start gap-3 text-xs text-[#92988d]">
                <Shield className="w-5 h-5 text-[#e9f85b] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#f0f0e8] block font-medium">Administrator Protection Active</strong>
                  Admin accounts cannot be deleted to protect microgrid infrastructure operations and governance controls.
                </div>
              </div>
            ) : isConsumerOrProsumer ? (
              /* Consumer / Prosumer Delete Account */
              <div className="p-4 rounded-xl bg-[#201011] border border-[#441a1c] text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#f87171] flex items-center gap-1.5 text-sm">
                      <ShieldAlert className="w-4 h-4" />
                      Danger Zone · Delete Account
                    </h3>
                    <p className="text-[#b58385] mt-1 text-[11px] leading-relaxed">
                      Permanently terminate your {user.role} profile and remove all associated grid records. This action cannot be reversed.
                    </p>
                  </div>
                  {!showDeleteConfirm && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#f87171] bg-[#331416] hover:bg-[#47191b] border border-[#5c1c20] transition-colors shrink-0"
                    >
                      Delete account
                    </button>
                  )}
                </div>

                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-3 border-t border-[#441a1c] space-y-3"
                  >
                    <div className="flex items-center gap-2 text-[#fca5a5]">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Type <strong className="font-mono text-white">DELETE</strong> below to confirm permanent account removal:</span>
                    </div>

                    <input
                      type="text"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full px-3 py-2 rounded-lg bg-[#140b0c] border border-[#5c1c20] text-sm text-[#f87171] placeholder-[#7d484b] focus:outline-none focus:border-[#ef4444]"
                    />

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmationText('');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs text-[#b58385] hover:text-[#f0f0e8] hover:bg-[#2b1315] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                        onClick={handleDeleteAccount}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#dc2626] hover:bg-[#b91c1c] transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Confirm Permanent Deletion</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
