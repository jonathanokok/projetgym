import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  TrendingUp,
  Calendar,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Trash2,
  Edit,
  Download,
  Upload,
  Settings
} from 'lucide-react';

const defaultWorkouts = {
  push: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Tricep Pushdown', 'Lateral Raise'],
  pull: ['Pull-ups', 'Barbell Row', 'Lat Pulldown', 'Barbell Curl', 'Face Pull'],
  legs: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Calf Raise']
};

export default function GymTracker() {
  const [workouts, setWorkouts] = useState([]);
  const [customWorkouts, setCustomWorkouts] = useState(defaultWorkouts);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [view, setView] = useState('home');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ---------- Load / Save ----------
  useEffect(() => {
    const saved = localStorage.getItem('gymWorkouts');
    const savedCustom = localStorage.getItem('customWorkouts');
    if (saved) setWorkouts(JSON.parse(saved));
    if (savedCustom) setCustomWorkouts(JSON.parse(savedCustom));
  }, []);

  useEffect(() => {
    localStorage.setItem('gymWorkouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('customWorkouts', JSON.stringify(customWorkouts));
  }, [customWorkouts]);

  // ---------- Helpers ----------
  const bodyPartIcons = useMemo(
    () => ({
      push: '💪',
      pull: '🦾',
      legs: '🦵',
      chest: '💪',
      back: '🦾',
      shoulders: '🏋️',
      arms: '💪',
      abs: '🔥',
      upper: '💪',
      lower: '🦵',
      fullbody: '🏋️',
      cardio: '🏃'
    }),
    []
  );

  const getIcon = (category) => bodyPartIcons[(category || '').toLowerCase()] || '🏋️';

  const startWorkout = (bodyPart) => {
    const list = customWorkouts[bodyPart] || [];
    const exercises = list.map((name) => ({
      id: Date.now() + Math.random(),
      name,
      sets: []
    }));

    setCurrentWorkout({
      id: Date.now(),
      date: new Date().toISOString(),
      bodyPart,
      exercises
    });
    setView('workout');
  };

  const addSet = (exerciseId) => {
    setCurrentWorkout((cw) => {
      if (!cw) return cw;
      return {
        ...cw,
        exercises: cw.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, sets: [...ex.sets, { weight: '', reps: '' }] } : ex
        )
      };
    });
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    setCurrentWorkout((cw) => {
      if (!cw) return cw;
      return {
        ...cw,
        exercises: cw.exercises.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s))
              }
            : ex
        )
      };
    });
  };

  const removeSet = (exerciseId, setIndex) => {
    setCurrentWorkout((cw) => {
      if (!cw) return cw;
      return {
        ...cw,
        exercises: cw.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) } : ex
        )
      };
    });
  };

  const saveWorkout = () => {
    if (currentWorkout && currentWorkout.exercises.some((ex) => ex.sets.length > 0)) {
      setWorkouts((prev) => [...prev, currentWorkout]);
    }
    setCurrentWorkout(null);
    setView('home');
  };

  const deleteWorkout = (workoutId) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
  };

  const getExerciseHistory = (exerciseName) => {
    return workouts
      .filter((w) => w.exercises.some((e) => e.name === exerciseName))
      .map((w) => ({
        date: new Date(w.date).toLocaleDateString(),
        sets: (w.exercises.find((e) => e.name === exerciseName) || { sets: [] }).sets
      }))
      .reverse();
  };

  const getPersonalBest = (exerciseName) => {
    let maxWeight = 0;
    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        if (ex.name === exerciseName) {
          ex.sets.forEach((set) => {
            const weight = parseFloat(set.weight);
            if (!Number.isNaN(weight) && weight > maxWeight) maxWeight = weight;
          });
        }
      });
    });
    return maxWeight;
  };

  const getAllExercises = () => {
    const exercises = new Set();
    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        if (ex.sets.length > 0) exercises.add(ex.name);
      });
    });
    return Array.from(exercises);
  };

  // ---------- Backup / Export ----------
  const exportToJSON = () => {
    const data = {
      workouts,
      customWorkouts,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    let csv = 'Date,Time,Body Part,Exercise,Set Number,Weight (kg),Reps\n';

    workouts.forEach((workout) => {
      const date = new Date(workout.date);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();

      workout.exercises.forEach((exercise) => {
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
    let csv = 'Body Part,Exercise\n';

    Object.keys(customWorkouts).forEach((bodyPart) => {
      (customWorkouts[bodyPart] || []).forEach((exercise) => {
        csv += `"${bodyPart}","${exercise}"\n`;
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

    workouts
      .slice()
      .reverse()
      .forEach((workout) => {
        const date = new Date(workout.date);
        text += `📅 ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
        text += `🏋️ ${String(workout.bodyPart).toUpperCase()}\n\n`;

        workout.exercises.forEach((exercise) => {
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

    navigator.clipboard
      .writeText(text)
      .then(() => alert('Data copied to clipboard!'))
      .catch(() => alert('Clipboard permission denied.'));
  };

  const importFromJSON = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result;
        if (typeof raw !== 'string') {
          alert('Error reading file');
          return;
        }
        const data = JSON.parse(raw);
        if (data.workouts && data.customWorkouts) {
          setWorkouts(data.workouts);
          setCustomWorkouts(data.customWorkouts);
          alert('Data imported successfully!');
        } else {
          alert('Invalid file format');
        }
      } catch {
        alert('Error reading file');
      }
    };
    reader.readAsText(file);

    // allow re-importing same file
    event.target.value = '';
  };

  // ---------- Edit templates ----------
  const updateCustomWorkout = (bodyPart, exercises) => {
    setCustomWorkouts((prev) => ({
      ...prev,
      [bodyPart]: exercises
    }));
  };

  const addCategory = () => {
    const key = newCategoryName.trim().toLowerCase();
    if (key && !customWorkouts[key]) {
      setCustomWorkouts((prev) => ({ ...prev, [key]: [] }));
      setNewCategoryName('');
    }
  };

  const deleteCategory = (categoryName) => {
    if (Object.keys(customWorkouts).length <= 1) {
      alert('You must have at least one category!');
      setDeleteConfirm(null);
      return;
    }
    setCustomWorkouts((prev) => {
      // eslint-disable-next-line no-unused-vars
      const { [categoryName]: removed, ...rest } = prev;
      return rest;
    });
    setDeleteConfirm(null);
  };

  const renameCategory = (oldName, newName) => {
    const next = newName.trim().toLowerCase();
    if (!next || next === oldName || customWorkouts[next]) return;

    setCustomWorkouts((prev) => {
      const { [oldName]: exercises, ...rest } = prev;
      return { ...rest, [next]: exercises };
    });

    setWorkouts((prev) => prev.map((w) => (w.bodyPart === oldName ? { ...w, bodyPart: next } : w)));
    setEditingCategoryName(null);
  };

  // ---------- Layout helpers ----------
  const Screen = ({ children, pb = 'pb-8' }) => (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 ${pb}`}>
      <div className="safe-area-top"></div>
      {children}
      <div className="safe-area-bottom"></div>
    </div>
  );

  // -------------------------
  // HOME
  // -------------------------
  if (view === 'home') {
    return (
      <Screen pb="pb-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center mb-8 pt-4">
            <Dumbbell className="w-8 h-8 mr-3 text-purple-400" />
            <h1 className="text-3xl font-bold">Gym Tracker</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
              Select Workout
              <button
                onClick={() => setView('edit-workouts')}
                className="text-sm bg-slate-800 px-3 py-1 rounded-lg hover:bg-slate-700 flex items-center"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {Object.keys(customWorkouts).map((bodyPart) => (
                <button
                  key={bodyPart}
                  onClick={() => startWorkout(bodyPart)}
                  className="bg-gradient-to-br from-slate-800 to-slate-700 p-4 rounded-xl hover:from-purple-800 hover:to-slate-700 transition-all shadow-lg"
                >
                  <div className="text-3xl mb-2">{getIcon(bodyPart)}</div>
                  <div className="font-semibold capitalize">{bodyPart}</div>
                  <div className="text-xs text-gray-400 mt-1">{(customWorkouts[bodyPart] || []).length} exercises</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setView('history')}
              className="bg-slate-800 p-4 rounded-xl flex flex-col items-center justify-center hover:bg-slate-700 transition-all"
            >
              <Calendar className="w-8 h-8 mb-2 text-purple-400" />
              <span className="font-semibold">History</span>
              <span className="text-sm text-gray-400">{workouts.length} workouts</span>
            </button>

            <button
              onClick={() => setView('progress')}
              className="bg-slate-800 p-4 rounded-xl flex flex-col items-center justify-center hover:bg-slate-700 transition-all"
            >
              <TrendingUp className="w-8 h-8 mb-2 text-green-400" />
              <span className="font-semibold">Progress</span>
              <span className="text-sm text-gray-400">{getAllExercises().length} exercises</span>
            </button>
          </div>

          <button
            onClick={() => setView('settings')}
            className="w-full bg-slate-800 p-4 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-all mb-6"
          >
            <Settings className="w-6 h-6 mr-2 text-gray-400" />
            <span className="font-semibold">Backup & Settings</span>
          </button>

          {workouts.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Recent Workouts
              </h2>

              {workouts.slice(-3).reverse().map((workout) => (
                <div key={workout.id} className="bg-slate-700 rounded-lg p-3 mb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold flex items-center">
                        <span className="mr-2">{getIcon(workout.bodyPart)}</span>
                        {workout.bodyPart?.charAt(0)?.toUpperCase()}
                        {workout.bodyPart?.slice(1)}
                      </p>
                      <p className="text-sm text-gray-400">{new Date(workout.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Screen>
    );
  }

  // -------------------------
  // EDIT WORKOUT TEMPLATES
  // -------------------------
  if (view === 'edit-workouts') {
    return (
      <Screen pb="pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Categories</h1>
            <button
              onClick={() => {
                setEditingWorkout(null);
                setEditingCategoryName(null);
                setDeleteConfirm(null);
                setView('home');
              }}
              className="bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700"
            >
              Done
            </button>
          </div>

          {deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">Delete Category?</h2>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete &quot;{deleteConfirm}&quot;? This will remove the category and all its exercises.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-600">
                    Cancel
                  </button>
                  <button onClick={() => deleteCategory(deleteConfirm)} className="flex-1 bg-red-600 py-3 rounded-lg font-semibold hover:bg-red-700">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-xl p-4 mb-4">
            <h2 className="font-semibold mb-3">Add New Category</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category name (e.g., Upper Body)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                className="flex-1 bg-slate-700 rounded-lg px-4 py-2 text-white"
              />
              <button onClick={addCategory} className="bg-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-700">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {Object.keys(customWorkouts).map((bodyPart) => (
            <div key={bodyPart} className="bg-slate-800 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <button
                  onClick={() => setEditingWorkout(editingWorkout === bodyPart ? null : bodyPart)}
                  className="flex items-center flex-1"
                >
                  <span className="text-2xl mr-3">{getIcon(bodyPart)}</span>

                  {editingCategoryName === bodyPart ? (
                    <input
                      type="text"
                      defaultValue={bodyPart}
                      onBlur={(e) => renameCategory(bodyPart, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && renameCategory(bodyPart, e.target.value)}
                      autoFocus
                      className="bg-slate-700 rounded px-2 py-1 text-white font-bold text-lg capitalize"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="font-bold text-lg capitalize">{bodyPart}</span>
                  )}

                  <span className="ml-auto">{editingWorkout === bodyPart ? <ChevronUp /> : <ChevronDown />}</span>
                </button>

                <div className="flex gap-2 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategoryName(bodyPart);
                    }}
                    className="text-blue-400 hover:text-blue-300"
                    title="Rename"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(bodyPart);
                    }}
                    className="text-red-400 hover:text-red-300"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {editingWorkout === bodyPart && (
                <div>
                  {(customWorkouts[bodyPart] || []).map((exercise, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center bg-slate-700 rounded-lg p-2">
                      <input
                        type="text"
                        value={exercise}
                        onChange={(e) => {
                          const next = [...(customWorkouts[bodyPart] || [])];
                          next[i] = e.target.value;
                          updateCustomWorkout(bodyPart, next);
                        }}
                        className="flex-1 bg-slate-600 rounded px-3 py-2 text-white"
                      />
                      <button
                        onClick={() => {
                          const next = (customWorkouts[bodyPart] || []).filter((_, idx) => idx !== i);
                          updateCustomWorkout(bodyPart, next);
                        }}
                        className="text-red-400 hover:text-red-300"
                        title="Remove"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => updateCustomWorkout(bodyPart, [...(customWorkouts[bodyPart] || []), 'New Exercise'])}
                    className="w-full bg-slate-700 py-2 rounded-lg text-sm font-semibold mt-2 hover:bg-slate-600"
                  >
                    + Add Exercise
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Screen>
    );
  }

  // -------------------------
  // ACTIVE WORKOUT
  // -------------------------
  if (view === 'workout') {
    if (!currentWorkout) {
      setView('home');
      return null;
    }

    return (
      <Screen pb="pb-8">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <span className="mr-2">{getIcon(currentWorkout.bodyPart)}</span>
                {currentWorkout.bodyPart.charAt(0).toUpperCase() + currentWorkout.bodyPart.slice(1)}
              </h1>
              <p className="text-gray-400 text-sm">Active Workout</p>
            </div>

            <button onClick={saveWorkout} className="bg-green-600 px-4 py-2 rounded-lg flex items-center font-semibold hover:bg-green-700">
              <Save className="w-5 h-5 mr-2" />
              Finish
            </button>
          </div>

          {currentWorkout.exercises.map((exercise) => (
            <div key={exercise.id} className="bg-slate-800 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-lg mb-3">{exercise.name}</h3>

              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="flex gap-2 mb-2 items-center">
                  <span className="text-gray-400 w-8">{setIndex + 1}</span>

                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Weight"
                    value={set.weight}
                    onChange={(e) => updateSet(exercise.id, setIndex, 'weight', e.target.value)}
                    className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-white"
                  />

                  <span className="text-gray-400">×</span>

                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Reps"
                    value={set.reps}
                    onChange={(e) => updateSet(exercise.id, setIndex, 'reps', e.target.value)}
                    className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-white"
                  />

                  <button onClick={() => removeSet(exercise.id, setIndex)} className="text-red-400 hover:text-red-300" title="Remove set">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <button onClick={() => addSet(exercise.id)} className="w-full bg-slate-700 py-2 rounded-lg text-sm font-semibold mt-2 hover:bg-slate-600">
                + Add Set
              </button>

              <button
                onClick={() => setView('home')}
                className="w-full bg-slate-800 border border-slate-700 py-2 rounded-lg text-sm font-semibold mt-3 hover:bg-slate-700"
              >
                Back to Home
              </button>
            </div>
          ))}
        </div>
      </Screen>
    );
  }

  // -------------------------
  // HISTORY
  // -------------------------
  if (view === 'history') {
    return (
      <Screen pb="pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Workout History</h1>
            <button onClick={() => setView('home')} className="bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700">
              Back
            </button>
          </div>

          {workouts.length === 0 ? (
            <div className="text-center text-gray-400 mt-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No workouts yet. Start your first workout!</p>
            </div>
          ) : (
            workouts
              .slice()
              .reverse()
              .map((workout) => (
                <div key={workout.id} className="bg-slate-800 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-lg flex items-center">
                        <span className="mr-2">{getIcon(workout.bodyPart)}</span>
                        {workout.bodyPart.charAt(0).toUpperCase() + workout.bodyPart.slice(1)}
                      </p>
                      <p className="text-sm text-gray-400">{new Date(workout.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-400">{new Date(workout.date).toLocaleTimeString()}</p>
                    </div>

                    <button onClick={() => deleteWorkout(workout.id)} className="text-red-400 hover:text-red-300" title="Delete workout">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {workout.exercises
                    .filter((ex) => ex.sets.length > 0)
                    .map((exercise) => (
                      <div key={exercise.id} className="bg-slate-700 rounded-lg p-3 mb-2">
                        <p className="font-semibold mb-2">{exercise.name}</p>
                        {exercise.sets.map((set, i) => (
                          <p key={i} className="text-sm text-gray-300">
                            Set {i + 1}: {set.weight}kg × {set.reps} reps
                          </p>
                        ))}
                      </div>
                    ))}
                </div>
              ))
          )}
        </div>
      </Screen>
    );
  }

  // -------------------------
  // PROGRESS
  // -------------------------
  if (view === 'progress') {
    const allExercises = getAllExercises();

    return (
      <Screen pb="pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Your Progress</h1>
            <button onClick={() => setView('home')} className="bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700">
              Back
            </button>
          </div>

          {allExercises.length === 0 ? (
            <div className="text-center text-gray-400 mt-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Complete workouts to see your progress!</p>
            </div>
          ) : (
            allExercises.map((exerciseName, i) => (
              <div key={i} className="bg-slate-800 rounded-xl p-4 mb-4">
                <button
                  onClick={() => setSelectedExercise(selectedExercise === exerciseName ? null : exerciseName)}
                  className="w-full flex justify-between items-center"
                >
                  <div className="text-left">
                    <p className="font-bold text-lg">{exerciseName}</p>
                    <p className="text-sm text-purple-400">Personal Best: {getPersonalBest(exerciseName)}kg</p>
                  </div>
                  {selectedExercise === exerciseName ? <ChevronUp /> : <ChevronDown />}
                </button>

                {selectedExercise === exerciseName && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    {getExerciseHistory(exerciseName).map((session, j) => (
                      <div key={j} className="bg-slate-700 rounded-lg p-3 mb-2">
                        <p className="font-semibold mb-2">{session.date}</p>
                        {session.sets.map((set, k) => (
                          <p key={k} className="text-sm text-gray-300">
                            Set {k + 1}: {set.weight}kg × {set.reps} reps
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Screen>
    );
  }

  // -------------------------
  // SETTINGS / BACKUP
  // -------------------------
  if (view === 'settings') {
    return (
      <Screen pb="pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Backup & Settings</h1>
            <button onClick={() => setView('home')} className="bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700">
              Back
            </button>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 mb-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2 text-green-400" />
              Export Data
            </h2>

            <button
              onClick={exportToCSV}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold mb-3 flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Export Workout Data (CSV/Excel)
            </button>

            <button
              onClick={exportTemplatesToCSV}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold mb-3 flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Export Workout Templates (CSV)
            </button>

            <button
              onClick={exportToJSON}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold mb-3 flex items-center justify-center"
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

            <div className="mt-4 p-3 bg-slate-700 rounded-lg text-sm text-gray-300">
              <p className="font-semibold mb-2">Export Options:</p>
              <ul className="space-y-1 text-xs">
                <li>
                  • <strong>CSV/Excel:</strong> Open in Google Sheets or Excel
                </li>
                <li>
                  • <strong>Templates CSV:</strong> Your custom workout plans
                </li>
                <li>
                  • <strong>JSON:</strong> Complete backup for re-importing
                </li>
                <li>
                  • <strong>Clipboard:</strong> Quick text copy for notes
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-blue-400" />
              Import Data
            </h2>

            <label className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center cursor-pointer">
              <Upload className="w-5 h-5 mr-2" />
              Import Backup (JSON)
              <input type="file" accept=".json" onChange={importFromJSON} className="hidden" />
            </label>

            <div className="mt-4 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg text-sm text-yellow-200">
              <p className="font-semibold mb-1">⚠️ Warning</p>
              <p className="text-xs">Importing will replace all current data. Export a backup first!</p>
            </div>
          </div>
        </div>
      </Screen>
    );
  }

  return null;
}