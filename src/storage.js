const STORAGE_KEYS = {
  workouts: 'gymWorkouts',
  customWorkouts: 'customWorkouts',
  currentWorkoutDraft: 'currentWorkoutDraft',
  currentWorkoutView: 'currentWorkoutView',
  lastWorkoutSession: 'lastWorkoutSession'
};

const defaultWorkouts = {
  push: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Tricep Pushdown', 'Lateral Raise'],
  pull: ['Pull-ups', 'Barbell Row', 'Lat Pulldown', 'Barbell Curl', 'Face Pull'],
  legs: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Calf Raise']
};

const normalizeCustomWorkouts = (raw) => {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = {};

  Object.keys(src).forEach((cat) => {
    const arr = Array.isArray(src[cat]) ? src[cat] : [];
    out[cat] = arr
      .map((item) => {
        if (typeof item === 'string') return { name: item, note: '' };
        if (item && typeof item === 'object') {
          return { name: item.name ?? '', note: item.note ?? '' };
        }
        return null;
      })
      .filter((x) => x && x.name.trim());
  });

  return out;
};

const DEFAULT_CUSTOM_WORKOUTS = normalizeCustomWorkouts(defaultWorkouts);

const safeParse = (value) => {
  if (!value) return { ok: false, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false, value: null };
  }
};

const toIsoString = (value, fallback) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return fallback;
};

const ensureUniqueIds = (items, prefix) => {
  const used = new Set();
  let counter = 1;

  return items.map((item) => {
    let id = item?.id;
    if (id === null || id === undefined || id === '') {
      id = `${prefix}-${counter}`;
      counter += 1;
    } else {
      id = String(id);
      if (used.has(id)) {
        id = `${prefix}-${counter}`;
        counter += 1;
      }
    }
    used.add(id);
    return { ...item, id };
  });
};

const normalizeSets = (sets) => {
  if (!Array.isArray(sets)) return [];
  return sets
    .map((set) => {
      if (!set || typeof set !== 'object') return null;
      const weight = typeof set.weight === 'number' ? String(set.weight) : set.weight ?? '';
      const reps = typeof set.reps === 'number' ? String(set.reps) : set.reps ?? '';
      return {
        weight: typeof weight === 'string' ? weight : '',
        reps: typeof reps === 'string' ? reps : ''
      };
    })
    .filter(Boolean);
};

const normalizeWorkouts = (rawWorkouts) => {
  const workoutsArray = Array.isArray(rawWorkouts) ? rawWorkouts : [];
  const workoutsWithIds = ensureUniqueIds(workoutsArray, 'workout');

  return workoutsWithIds.map((workout) => {
    const exercisesRaw = Array.isArray(workout?.exercises) ? workout.exercises : [];
    const exercisesWithIds = ensureUniqueIds(exercisesRaw, 'exercise');

    return {
      id: workout.id,
      date: toIsoString(workout?.date, new Date().toISOString()),
      bodyPart: typeof workout?.bodyPart === 'string' ? workout.bodyPart : 'unknown',
      note: typeof workout?.note === 'string' ? workout.note : '',
      exercises: exercisesWithIds.map((exercise) => ({
        id: exercise.id,
        name: typeof exercise?.name === 'string' ? exercise.name : '',
        note: typeof exercise?.note === 'string' ? exercise.note : '',
        sets: normalizeSets(exercise?.sets)
      }))
    };
  });
};

const loadFromStorage = () => {
  const workoutsResult = safeParse(localStorage.getItem(STORAGE_KEYS.workouts));
  const customResult = safeParse(localStorage.getItem(STORAGE_KEYS.customWorkouts));
  const lastWorkoutResult = safeParse(localStorage.getItem(STORAGE_KEYS.lastWorkoutSession));
  const draftResult = safeParse(localStorage.getItem(STORAGE_KEYS.currentWorkoutDraft));

  if (!workoutsResult.ok && localStorage.getItem(STORAGE_KEYS.workouts)) {
    localStorage.removeItem(STORAGE_KEYS.workouts);
  }
  if (!customResult.ok && localStorage.getItem(STORAGE_KEYS.customWorkouts)) {
    localStorage.removeItem(STORAGE_KEYS.customWorkouts);
  }
  if (!lastWorkoutResult.ok && localStorage.getItem(STORAGE_KEYS.lastWorkoutSession)) {
    localStorage.removeItem(STORAGE_KEYS.lastWorkoutSession);
  }
  if (!draftResult.ok && localStorage.getItem(STORAGE_KEYS.currentWorkoutDraft)) {
    localStorage.removeItem(STORAGE_KEYS.currentWorkoutDraft);
    localStorage.removeItem(STORAGE_KEYS.currentWorkoutView);
  }

  const workouts = normalizeWorkouts(workoutsResult.ok ? workoutsResult.value : []);
  const customWorkouts = Object.keys(customResult.value || {}).length
    ? normalizeCustomWorkouts(customResult.value)
    : DEFAULT_CUSTOM_WORKOUTS;
  const lastWorkoutSession = lastWorkoutResult.ok && lastWorkoutResult.value
    ? normalizeWorkouts([lastWorkoutResult.value])[0]
    : null;
  const currentWorkout = draftResult.ok && draftResult.value
    ? normalizeWorkouts([draftResult.value])[0]
    : null;

  return {
    workouts,
    customWorkouts,
    currentWorkout,
    lastWorkoutSession
  };
};

const saveToStorage = (state) => {
  localStorage.setItem(STORAGE_KEYS.workouts, JSON.stringify(state.workouts ?? []));
  localStorage.setItem(STORAGE_KEYS.customWorkouts, JSON.stringify(state.customWorkouts ?? {}));

  if (state.lastWorkoutSession) {
    localStorage.setItem(STORAGE_KEYS.lastWorkoutSession, JSON.stringify(state.lastWorkoutSession));
  } else {
    localStorage.removeItem(STORAGE_KEYS.lastWorkoutSession);
  }
};

export {
  STORAGE_KEYS,
  DEFAULT_CUSTOM_WORKOUTS,
  normalizeCustomWorkouts,
  normalizeWorkouts,
  loadFromStorage,
  saveToStorage,
  toIsoString
};
