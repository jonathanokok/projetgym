import React, { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { buildExportPayload, validateAndNormalizeImport } from '../importExport';

const summarizeState = (state) => {
  const categories = Object.keys(state.customWorkouts || {}).length;
  const exercises = Object.values(state.customWorkouts || {}).reduce(
    (total, list) => total + (Array.isArray(list) ? list.length : 0),
    0
  );
  const workouts = state.workouts?.length ?? 0;

  return { categories, exercises, workouts };
};

export default function ImportExportPanel({ state, onApplyImport }) {
  const fileInputRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const handleExport = () => {
    const payload = buildExportPayload(state);
    const dateStamp = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gym-tracker-export-${dateStamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');

    try {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file. Please choose a valid export.');
      }

      const normalizedState = validateAndNormalizeImport(parsed);
      const summary = summarizeState(normalizedState);

      setPendingImport({ state: normalizedState, summary, fileName: file.name });
    } catch (error) {
      setPendingImport(null);
      setImportError(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    onApplyImport(pendingImport.state);
    setPendingImport(null);
    setImportSuccess('Import complete. Your data has been restored.');
  };

  const handleCancelImport = () => {
    setPendingImport(null);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Download className="w-5 h-5 mr-2 text-green-400" />
        Export & Import
      </h2>

      <button
        onClick={handleExport}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold mb-4 flex items-center justify-center"
      >
        <Download className="w-5 h-5 mr-2" />
        Export Full Backup (JSON)
      </button>

      <div className="bg-slate-700 rounded-lg p-3 text-xs text-gray-300 mb-4">
        <p className="font-semibold mb-2">Export includes:</p>
        <ul className="space-y-1">
          <li>• All categories, exercises, sets, and notes</li>
          <li>• Last workout session metadata</li>
          <li>• Schema version for future compatibility</li>
        </ul>
      </div>

      <label className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center cursor-pointer">
        <Upload className="w-5 h-5 mr-2" />
        Import Backup (JSON)
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {importError && (
        <div className="mt-3 p-3 bg-red-900 bg-opacity-40 border border-red-600 rounded-lg text-sm text-red-200">
          {importError}
        </div>
      )}

      {importSuccess && (
        <div className="mt-3 p-3 bg-green-900 bg-opacity-40 border border-green-600 rounded-lg text-sm text-green-200">
          {importSuccess}
        </div>
      )}

      {pendingImport && (
        <div className="mt-4 p-4 bg-slate-700 rounded-lg">
          <h3 className="font-semibold mb-2">Confirm import</h3>
          <p className="text-xs text-gray-300 mb-3">
            File: {pendingImport.fileName}
          </p>
          <ul className="text-sm text-gray-200 space-y-1 mb-4">
            <li>• Categories: {pendingImport.summary.categories}</li>
            <li>• Exercises: {pendingImport.summary.exercises}</li>
            <li>• Workouts: {pendingImport.summary.workouts}</li>
          </ul>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmImport}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
            >
              Overwrite & Import
            </button>
            <button
              onClick={handleCancelImport}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg text-sm text-yellow-200">
        <p className="font-semibold mb-1">⚠️ Warning</p>
        <p className="text-xs">Importing will replace all current data. Export a backup first.</p>
      </div>
    </div>
  );
}
