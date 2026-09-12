import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, getContentUrl } from '../../api/client';
import {
  Layers,
  PlusCircle,
  Eye,
  Upload,
  Archive,
  CheckCircle,
  AlertCircle,
  Trash2,
  Clock,
  Search,
  FileCode,
  X,
  ExternalLink,
} from 'lucide-react';

export const AdminTests: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSectionTab = searchParams.get('section') || 'ALL';

  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<any>(null);

  // New Test form state
  const [newSection, setNewSection] = useState<'LISTENING' | 'READING' | 'WRITING'>('LISTENING');
  const [newNumber, setNewNumber] = useState<number>(1);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDuration, setNewDuration] = useState<number>(32);
  const [newStatus, setNewStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Version Replace form state
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionUploading, setVersionUploading] = useState(false);
  const [versionError, setVersionError] = useState('');

  const loadTests = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (activeSectionTab !== 'ALL') filters.section = activeSectionTab;
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (searchQuery) filters.search = searchQuery;

      const data = await api.admin.getTests(filters);
      setTests(data);
    } catch (err: any) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [activeSectionTab, statusFilter, searchQuery]);

  const handleTabChange = (tab: string) => {
    if (tab === 'ALL') {
      searchParams.delete('section');
    } else {
      searchParams.set('section', tab);
    }
    setSearchParams(searchParams);
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    if (!newFile) {
      setUploadError('Please select an HTML or ZIP test file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('section', newSection);
      formData.append('testNumber', newNumber.toString());
      formData.append('title', newTitle);
      formData.append('description', newDesc);
      formData.append('timeLimitMinutes', newDuration.toString());
      formData.append('status', newStatus);
      formData.append('file', newFile);

      await api.admin.createTest(formData);
      setShowUploadModal(false);
      // Reset form
      setNewTitle('');
      setNewDesc('');
      setNewFile(null);
      await loadTests();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to create test');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setVersionError('');
    if (!versionFile || !showVersionModal) {
      setVersionError('Please select an HTML or ZIP file for the new version');
      return;
    }

    setVersionUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', versionFile);

      await api.admin.uploadVersion(showVersionModal.id, formData);
      setShowVersionModal(null);
      setVersionFile(null);
      await loadTests();
    } catch (err: any) {
      setVersionError(err.message || 'Failed to upload version');
    } finally {
      setVersionUploading(false);
    }
  };

  const handleStatusToggle = async (test: any, newStat: string) => {
    try {
      await api.admin.updateTest(test.id, { status: newStat });
      await loadTests();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeleteTest = async (test: any) => {
    const confirm = window.confirm(
      `Are you sure you want to delete "${test.title}"? If it has student attempts, it will be archived instead to preserve history.`
    );
    if (!confirm) return;

    try {
      const res = await api.admin.deleteTest(test.id);
      alert(res.message || 'Test updated');
      await loadTests();
    } catch (err: any) {
      alert(err.message || 'Failed to delete test');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            IELTS Test Packages Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload, version, publish, and preview computer-delivered HTML tests and ZIP bundles
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            // Auto suggest next number based on existing tests
            const count = tests.filter((t) => t.section === newSection).length;
            setNewNumber(count + 1);
            setShowUploadModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Upload New Test Package
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Section Tabs */}
        <div className="flex space-x-1">
          {['ALL', 'LISTENING', 'READING', 'WRITING'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeSectionTab === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Sections' : tab}
            </button>
          ))}
        </div>

        {/* Status & Search */}
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Draft Only</option>
            <option value="ARCHIVED">Archived Only</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests..."
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded text-slate-800 w-48 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Tests Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Loading test packages...</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
          <FileCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            No Tests Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            No test packages match your current filter criteria. Upload a new test package to begin.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Section / Number</th>
                <th className="py-3 px-4">Test Title</th>
                <th className="py-3 px-4">Active Version</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {test.section} #{test.testNumber}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{test.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                      <span>Limit: {test.timeLimitMinutes} min</span>
                      {test.activeVersion && (
                        <span>• File: {test.activeVersion.entryFile}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {test.activeVersion ? (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                        v{test.activeVersion.versionNumber} ({test.activeVersion.fileType})
                      </span>
                    ) : (
                      <span className="text-red-500">No version</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {test.attemptsCount}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        test.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : test.status === 'DRAFT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      {test.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Preview Button */}
                      {test.activeVersion && (
                        <button
                          type="button"
                          onClick={() => setShowPreviewModal(test)}
                          className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100"
                          title="Preview Test in Sandbox"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {/* Replace / New Version Button (Requirement 9 & 12) */}
                      <button
                        type="button"
                        onClick={() => setShowVersionModal(test)}
                        className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100"
                        title="Upload New Version (Preserves Historical Attempts)"
                      >
                        <Upload className="w-4 h-4" />
                      </button>

                      {/* Publish / Unpublish Toggle */}
                      {test.status === 'PUBLISHED' ? (
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(test, 'DRAFT')}
                          className="px-2 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(test, 'PUBLISHED')}
                          className="px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                        >
                          Publish
                        </button>
                      )}

                      {/* Delete / Archive */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTest(test)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                        title="Delete or Archive Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: Upload New Test Package */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Upload className="w-4 h-4 mr-2 text-blue-600" />
                Upload New Test Package (HTML or ZIP)
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs rounded">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Section
                  </label>
                  <select
                    value={newSection}
                    onChange={(e: any) => {
                      const sec = e.target.value;
                      setNewSection(sec);
                      setNewDuration(sec === 'LISTENING' ? 32 : 60);
                      const count = tests.filter((t) => t.section === sec).length;
                      setNewNumber(count + 1);
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
                  >
                    <option value="LISTENING">LISTENING</option>
                    <option value="READING">READING</option>
                    <option value="WRITING">WRITING</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Test Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newNumber}
                    onChange={(e) => setNewNumber(parseInt(e.target.value, 10))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Test Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. IELTS Academic Listening Test 3"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Description / Topic Notes
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. 4 parts, audio playback, campus registration..."
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Time Limit (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value, 10))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
                  >
                    <option value="PUBLISHED">PUBLISHED (Available immediately)</option>
                    <option value="DRAFT">DRAFT (Hidden from students)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Upload HTML or ZIP File
                </label>
                <input
                  type="file"
                  required
                  accept=".html,.htm,.zip"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Accepts single <code>.html</code> or <code>.zip</code> package containing index.html, css/, js/, images/, audio/.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded shadow-sm"
                >
                  {uploading ? 'Processing & Storing...' : 'Upload & Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Replace / New Version Upload (Requirement 9 & 12) */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Upload className="w-4 h-4 mr-2 text-indigo-600" />
                Upload New Version
              </h3>
              <button
                onClick={() => setShowVersionModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Uploading a replacement for <strong>{showVersionModal.title}</strong> will create a new version and set it active for future attempts. Past attempts will continue using their historical versions intact.
            </p>

            {versionError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs rounded">
                {versionError}
              </div>
            )}

            <form onSubmit={handleUploadVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  New Package (.html or .zip)
                </label>
                <input
                  type="file"
                  required
                  accept=".html,.htm,.zip"
                  onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={versionUploading}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded shadow-sm"
                >
                  {versionUploading ? 'Uploading Version...' : 'Deploy New Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Sandboxed Test Preview (Requirement 9 & 10) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded font-mono">
                  PREVIEW MODE
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {showPreviewModal.title} (v{showPreviewModal.activeVersion?.versionNumber})
                </span>
              </div>
              <button
                onClick={() => setShowPreviewModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 relative">
              <iframe
                src={getContentUrl(showPreviewModal.activeVersion?.id, showPreviewModal.activeVersion?.entryFile)}
                title="Admin Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-forms allow-modals"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
