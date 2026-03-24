/*
  =============================================
  data.js — DEFAULT DATA
  =============================================
  Pre-loaded exercises so the library isn't empty,
  plus the SVG body outline for the muscle map.
  =============================================
*/

// Each exercise has:
// - name: what you'd call it at the gym
// - muscles: which body parts it works (used for the muscle map)
// - category: which tab it shows under in the library
// - equipment: what gear you need
const DEFAULT_EXERCISES = [
  { name:'Bench Press', muscles:['chest','shoulders','arms'], category:'chest', equipment:'Barbell' },
  { name:'Incline Dumbbell Press', muscles:['chest','shoulders'], category:'chest', equipment:'Dumbbells' },
  { name:'Cable Fly', muscles:['chest'], category:'chest', equipment:'Cable' },
  { name:'Push Ups', muscles:['chest','arms','core'], category:'chest', equipment:'Bodyweight' },
  { name:'Dips', muscles:['chest','arms'], category:'chest', equipment:'Bodyweight' },
  { name:'Deadlift', muscles:['back','legs','core'], category:'back', equipment:'Barbell' },
  { name:'Pull Ups', muscles:['back','arms'], category:'back', equipment:'Bodyweight' },
  { name:'Barbell Row', muscles:['back','arms'], category:'back', equipment:'Barbell' },
  { name:'Lat Pulldown', muscles:['back','arms'], category:'back', equipment:'Cable' },
  { name:'Seated Cable Row', muscles:['back'], category:'back', equipment:'Cable' },
  { name:'Face Pulls', muscles:['back','shoulders'], category:'back', equipment:'Cable' },
  { name:'Squat', muscles:['legs','core'], category:'legs', equipment:'Barbell' },
  { name:'Leg Press', muscles:['legs'], category:'legs', equipment:'Machine' },
  { name:'Romanian Deadlift', muscles:['legs','back'], category:'legs', equipment:'Barbell' },
  { name:'Leg Curl', muscles:['legs'], category:'legs', equipment:'Machine' },
  { name:'Leg Extension', muscles:['legs'], category:'legs', equipment:'Machine' },
  { name:'Calf Raises', muscles:['legs'], category:'legs', equipment:'Machine' },
  { name:'Bulgarian Split Squat', muscles:['legs'], category:'legs', equipment:'Dumbbells' },
  { name:'Overhead Press', muscles:['shoulders','arms'], category:'shoulders', equipment:'Barbell' },
  { name:'Lateral Raises', muscles:['shoulders'], category:'shoulders', equipment:'Dumbbells' },
  { name:'Front Raises', muscles:['shoulders'], category:'shoulders', equipment:'Dumbbells' },
  { name:'Rear Delt Fly', muscles:['shoulders','back'], category:'shoulders', equipment:'Dumbbells' },
  { name:'Barbell Curl', muscles:['arms'], category:'arms', equipment:'Barbell' },
  { name:'Hammer Curl', muscles:['arms'], category:'arms', equipment:'Dumbbells' },
  { name:'Tricep Pushdown', muscles:['arms'], category:'arms', equipment:'Cable' },
  { name:'Skull Crushers', muscles:['arms'], category:'arms', equipment:'Barbell' },
  { name:'Preacher Curl', muscles:['arms'], category:'arms', equipment:'Barbell' },
  { name:'Plank', muscles:['core'], category:'core', equipment:'Bodyweight' },
  { name:'Cable Crunch', muscles:['core'], category:'core', equipment:'Cable' },
  { name:'Hanging Leg Raise', muscles:['core'], category:'core', equipment:'Bodyweight' },
  { name:'Ab Wheel Rollout', muscles:['core'], category:'core', equipment:'Ab Wheel' },
  { name:'Russian Twist', muscles:['core'], category:'core', equipment:'Bodyweight' },
];

/*
  MUSCLE MAP SVG
  A simplified body outline. Each shape has an ID like
  "muscle-chest-l" so JavaScript can find it and change
  its color class based on which muscles you've trained.
*/
const MUSCLE_MAP_SVG = `<svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="100" cy="30" rx="18" ry="22" fill="#2a2a3e" opacity="0.3" stroke="#3a3a50" stroke-width="0.5"/>
  <rect x="92" y="50" width="16" height="14" rx="4" fill="#2a2a3e" opacity="0.3"/>
  <ellipse id="muscle-shoulders-l" cx="62" cy="72" rx="20" ry="10" class="muscle-none"/>
  <ellipse id="muscle-shoulders-r" cx="138" cy="72" rx="20" ry="10" class="muscle-none"/>
  <ellipse id="muscle-chest-l" cx="76" cy="95" rx="22" ry="16" class="muscle-none"/>
  <ellipse id="muscle-chest-r" cx="124" cy="95" rx="22" ry="16" class="muscle-none"/>
  <rect id="muscle-core" x="82" y="112" width="36" height="50" rx="8" class="muscle-none"/>
  <rect id="muscle-back" x="78" y="80" width="44" height="34" rx="6" class="muscle-none" opacity="0.2"/>
  <ellipse id="muscle-arms-l" cx="44" cy="110" rx="10" ry="26" class="muscle-none"/>
  <ellipse id="muscle-arms-r" cx="156" cy="110" rx="10" ry="26" class="muscle-none"/>
  <ellipse cx="38" cy="150" rx="7" ry="20" fill="#2a2a3e" opacity="0.25"/>
  <ellipse cx="162" cy="150" rx="7" ry="20" fill="#2a2a3e" opacity="0.25"/>
  <ellipse id="muscle-legs-l" cx="82" cy="210" rx="18" ry="48" class="muscle-none"/>
  <ellipse id="muscle-legs-r" cx="118" cy="210" rx="18" ry="48" class="muscle-none"/>
  <ellipse cx="80" cy="300" rx="12" ry="36" fill="#2a2a3e" opacity="0.25"/>
  <ellipse cx="120" cy="300" rx="12" ry="36" fill="#2a2a3e" opacity="0.25"/>
  <ellipse cx="78" cy="345" rx="14" ry="6" fill="#2a2a3e" opacity="0.2"/>
  <ellipse cx="122" cy="345" rx="14" ry="6" fill="#2a2a3e" opacity="0.2"/>
</svg>`;
