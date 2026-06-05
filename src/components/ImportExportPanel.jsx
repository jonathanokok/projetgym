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

  const workouts = state?.workouts ?? [];
  const customWorkouts = state?.customWorkouts ?? {};

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

  const exportToCSV = () => {
    let csv = 'Date,Time,Body Part,Exercise,Set Number,Weight (kg),Reps\n';
    
    workouts.forEach(workout => {
      const date = new Date(workout.date);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();
      
      workout.exercises.forEach(exercise => {
        if (exercise.sets.length > 0) {
          exercise.sets.forEach((set, index) => {
            csv += `"${dateStr}","${timeStr}","${workout.bodyPart}","${exercise.name}",${index + 1},${set.weight},${set.reps}\n`;
          });
        }
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-tracker-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTemplatesToCSV = () => {
    let csv = 'Body Part,Exercise,Note\n';
    
    Object.keys(customWorkouts).forEach(bodyPart => {
      (customWorkouts[bodyPart] || []).forEach((ex) => {
        csv += `"${bodyPart}","${ex.name}","${(ex.note || '').replaceAll('"', '""')}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-tracker-templates-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    let text = '=== GYM TRACKER DATA ===\n\n';
    
    workouts.slice().reverse().forEach(workout => {
      const date = new Date(workout.date);
      text += `📅 ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
      text += `🏋️ ${workout.bodyPart.toUpperCase()}\n\n`;
      
      workout.exercises.forEach(exercise => {
        if (exercise.sets.length > 0) {
          text += `  ${exercise.name}:\n`;
          exercise.sets.forEach((set, i) => {
            text += `    Set ${i + 1}: ${set.weight}kg × ${set.reps} reps\n`;
          });
          text += '\n';
        }
      });
      text += '---\n\n';
    });

    navigator.clipboard.writeText(text).then(() => {
      alert('Data copied to clipboard!');
    });
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

      <div className="space-y-3 mb-4">
        <button
          onClick={exportToCSV}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Workout Data (CSV/Excel)
        </button>

        <button
          onClick={exportTemplatesToCSV}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Workout Templates (CSV)
        </button>

        <button
          onClick={handleExport}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Full Backup (JSON)
        </button>

        <button
          onClick={copyToClipboard}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Copy to Clipboard (Text)
        </button>
      </div>

      <div className="bg-slate-700 rounded-lg p-3 text-xs text-gray-300 mb-4">
        <p className="font-semibold mb-2">Export Options:</p>
        <ul className="space-y-1 text-xs">
          <li>• <strong>CSV/Excel:</strong> Open in Google Sheets or Excel</li>
          <li>• <strong>Templates CSV:</strong> Your custom workout plans</li>
          <li>• <strong>JSON:</strong> Complete backup for re-importing</li>
          <li>• <strong>Clipboard:</strong> Quick text copy for notes</li>
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
