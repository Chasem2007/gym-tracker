/*
  =============================================
  recommendations.js — EXERCISE RECOMMENDATIONS (PRO)
  =============================================
  Analyzes the current workout's muscle coverage
  and suggests exercises to round out the session.
  =============================================
*/

const ALL_MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

const MUSCLE_LABELS = {
  chest: 'Chest', back: 'Back', legs: 'Legs',
  shoulders: 'Shoulders', arms: 'Arms', core: 'Core'
};

// Returns a map of { muscleGroup: count } from current exercises
function getMuscleGroupCoverage() {
  const coverage = {};
  ALL_MUSCLE_GROUPS.forEach(g => coverage[g] = 0);

  currentExercises.forEach(ex => {
    (ex.muscles || []).forEach(m => {
      if (coverage[m] !== undefined) coverage[m]++;
    });
  });

  return coverage;
}

// Picks the most underrepresented muscle groups (up to 3)
function getUndertrained(coverage) {
  const sorted = ALL_MUSCLE_GROUPS
    .map(g => ({ group: g, count: coverage[g] }))
    .sort((a, b) => a.count - b.count);

  const minCount = sorted[0].count;
  // All groups equally covered
  if (minCount > 0 && sorted.every(g => g.count === minCount)) return [];

  return sorted.filter(g => g.count === minCount).slice(0, 3).map(g => g.group);
}

// Main render function — called at end of renderExerciseList()
async function renderRecommendations() {
  const container = document.getElementById('recommendationsContainer');
  if (!container) return;

  if (!isPro() || currentExercises.length < 2) {
    container.innerHTML = '';
    return;
  }

  const coverage = getMuscleGroupCoverage();
  const undertrained = getUndertrained(coverage);

  if (!undertrained.length) {
    container.innerHTML = `
      <div class="rec-panel">
        <div class="rec-title">Complete Your Workout</div>
        <div style="color:var(--green);font-size:13px;">✅ Great balanced workout — all muscle groups covered!</div>
      </div>`;
    return;
  }

  // Fetch library and filter suggestions
  const library = await getExerciseLibrary();
  const currentNames = new Set(currentExercises.map(e => e.name.toLowerCase()));

  const suggestions = [];
  for (const group of undertrained) {
    const candidates = library.filter(ex =>
      (ex.muscles || []).includes(group) &&
      !currentNames.has(ex.name.toLowerCase())
    );
    if (candidates.length) {
      // Pick one — prefer a different equipment type than what's already in the workout
      suggestions.push({ exercise: candidates[0], forGroup: group });
      if (suggestions.length >= 3) break;
    }
  }

  if (!suggestions.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="rec-panel">
      <div class="rec-title">💡 Complete Your Workout</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
        Missing: ${undertrained.map(g => MUSCLE_LABELS[g]).join(', ')}
      </div>
      <div class="rec-cards">
        ${suggestions.map(({ exercise: ex, forGroup }) => `
          <div class="rec-card">
            <div class="rec-card-body">
              <div class="rec-card-name">${ex.name}</div>
              <div class="rec-card-meta">
                <span class="rec-muscle-badge">${MUSCLE_LABELS[forGroup]}</span>
                <span style="color:var(--text-muted);">${ex.equipment || ''}</span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm rec-add-btn"
              onclick="addExerciseToWorkout('${ex.name.replace(/'/g, "\\'")}', ${JSON.stringify(ex.muscles || [])})">
              + Add
            </button>
          </div>
        `).join('')}
      </div>
    </div>`;
}
