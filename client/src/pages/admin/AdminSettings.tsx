import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserPlus,
  X,
  Users,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Add Admin modal state
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  const loadData = async () => {
    try {
      const [settingsData, adminsData] = await Promise.all([
        api.admin.getSettings(),
        api.admin.getAdmins(),
      ]);
      setSettings(settingsData);
      setAdmins(adminsData);
    } catch (err) {
      console.error('Failed to load settings or admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSaving(true);
    try {
      const updated = await api.admin.updateSettings(settings);
      setSettings(updated);
      setSuccess('Platform configuration saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (adminPassword.length < 6) {
      setAdminError('Password must be at least 6 characters');
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await api.admin.createAdmin({
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        password: adminPassword,
      });

      setAdminSuccess(res.message || 'New administrator created successfully!');
      setAdminFirstName('');
      setAdminLastName('');
      setAdminEmail('');
      setAdminPassword('');
      setShowAddAdminModal(false);
      // Reload admins
      const refreshedAdmins = await api.admin.getAdmins();
      setAdmins(refreshedAdmins);
    } catch (err: any) {
      setAdminError(err.message || 'Failed to create administrator');
    } finally {
      setCreatingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500">Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Platform Configuration & Examiner Team
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure test timers, platform policies, and manage examiner administrator accounts
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setAdminError('');
            setAdminSuccess('');
            setShowAddAdminModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-1.5 text-blue-400" />
          Create New Admin
        </button>
      </div>

      {adminSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-800 text-xs rounded flex items-center space-x-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{adminSuccess}</span>
        </div>
      )}

      {/* SECTION 1: Examiner Administrators Management */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Examiner Administrators ({admins.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Authorized to manage test packages, examine results, and review candidates
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Examiner ID</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                    {adm.candidateNumber || 'CDI-ADM'}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {adm.firstName} {adm.lastName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono">
                    {adm.email}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      ADMINISTRATOR
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                    {new Date(adm.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: General Platform Settings Form */}
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-800 text-xs rounded flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            General Policies
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Platform Brand Name
              </label>
              <input
                type="text"
                value={settings.platformName || ''}
                onChange={(e) => handleChange('platformName', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Allow Candidate Self-Registration
              </label>
              <select
                value={settings.allowRegistration || 'true'}
                onChange={(e) => handleChange('allowRegistration', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
              >
                <option value="true">Enabled (Candidates can sign up via registration)</option>
                <option value="false">Disabled (Examiner manual invitation only)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Examination Duration Defaults */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Default Section Timers (Minutes)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Listening Duration
              </label>
              <input
                type="number"
                min={10}
                value={settings.listeningDurationMinutes || '32'}
                onChange={(e) => handleChange('listeningDurationMinutes', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Reading Duration
              </label>
              <input
                type="number"
                min={10}
                value={settings.readingDurationMinutes || '60'}
                onChange={(e) => handleChange('readingDurationMinutes', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Writing Duration
              </label>
              <input
                type="number"
                min={10}
                value={settings.writingDurationMinutes || '60'}
                onChange={(e) => handleChange('writingDurationMinutes', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="text-right">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* MODAL: Create New Administrator */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" />
                Create New Examiner Administrator
              </h3>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs rounded">
                {adminError}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminFirstName}
                    onChange={(e) => setAdminFirstName(e.target.value)}
                    placeholder="e.g. John"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminLastName}
                    onChange={(e) => setAdminLastName(e.target.value)}
                    placeholder="e.g. Miller"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Examiner Email Address
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="examiner@ielts.com"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded shadow-sm flex items-center"
                >
                  {creatingAdmin ? (
                    'Creating Administrator...'
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      Create Administrator
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
