import { DEFAULT_CUSTOM_WORKOUTS, normalizeCustomWorkouts, normalizeWorkouts, toIsoString } from './storage';

const SCHEMA_VERSION = 1;

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const normalizeState = (state, { fallbackToDefaults } = {}) => {
  const workouts = normalizeWorkouts(state?.workouts ?? []);
  const customWorkoutsRaw = state?.customWorkouts ?? {};
  const customWorkouts = Object.keys(customWorkoutsRaw || {}).length
    ? normalizeCustomWorkouts(customWorkoutsRaw)
    : fallbackToDefaults
      ? DEFAULT_CUSTOM_WORKOUTS
      : normalizeCustomWorkouts(customWorkoutsRaw);
  const lastWorkoutSession = state?.lastWorkoutSession
    ? normalizeWorkouts([state.lastWorkoutSession])[0]
    : null;

  return {
    workouts,
    customWorkouts,
    lastWorkoutSession
  };
};

const buildExportPayload = (state) => {
  const normalizedState = normalizeState(state);

  return {
    schemaVersion: SCHEMA_VERSION,
    exportDate: toIsoString(new Date(), new Date().toISOString()),
    data: {
      workouts: normalizedState.workouts,
      customWorkouts: normalizedState.customWorkouts,
      lastWorkoutSession: normalizedState.lastWorkoutSession
    }
  };
};

const validateAndNormalizeImport = (payload) => {
  if (!isObject(payload)) {
    throw new Error('Import failed: JSON must be an object.');
  }

  if (payload.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version: ${payload.schemaVersion ?? 'missing'}.`);
  }

  if (!isObject(payload.data)) {
    throw new Error('Import failed: missing "data" section.');
  }

  const normalizedState = normalizeState(payload.data, { fallbackToDefaults: true });

  return normalizedState;
};

export { SCHEMA_VERSION, buildExportPayload, validateAndNormalizeImport };
