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
  MUSCLE MAP SVG — Front and back anatomical view
  Based on the detailed muscle diagram. Each muscle
  group has a unique ID so JavaScript can color it
  based on workout data. Front view on left, back
  view on right.
*/
const MUSCLE_MAP_SVG = `<svg viewBox="0 0 420 440" xmlns="http://www.w3.org/2000/svg">
  <!-- ===== FRONT VIEW (left side) ===== -->
  <g transform="translate(10,10)">
    <!-- Head -->
    <ellipse cx="95" cy="18" rx="16" ry="20" fill="#2a2a3e" opacity="0.3" stroke="#3a3a50" stroke-width="0.8"/>
    <!-- Neck / Traps -->
    <path d="M82,36 L68,52 L122,52 L108,36 Z" fill="#2a2a3e" opacity="0.25" stroke="#3a3a50" stroke-width="0.5"/>
    
    <!-- Shoulders (front delts) -->
    <path id="muscle-shoulders-fl" d="M55,52 Q42,58 38,75 Q42,82 55,78 Q62,70 62,58 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    <path id="muscle-shoulders-fr" d="M135,52 Q148,58 152,75 Q148,82 135,78 Q128,70 128,58 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    
    <!-- Chest (pectorals) -->
    <path id="muscle-chest-l" d="M62,58 L62,78 Q65,95 78,100 Q90,102 95,95 L95,58 Q85,52 62,58 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    <path id="muscle-chest-r" d="M128,58 L128,78 Q125,95 112,100 Q100,102 95,95 L95,58 Q105,52 128,58 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    
    <!-- Biceps -->
    <path id="muscle-arms-fl" d="M38,78 Q32,95 30,115 Q28,132 32,145 Q38,148 44,140 Q48,125 48,105 Q48,88 42,78 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    <path id="muscle-arms-fr" d="M152,78 Q158,95 160,115 Q162,132 158,145 Q152,148 146,140 Q142,125 142,105 Q142,88 148,78 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    
    <!-- Forearms -->
    <path d="M30,145 Q26,170 28,195 Q32,200 36,195 Q40,175 44,145 Z" fill="#2a2a3e" opacity="0.2" stroke="#3a3a50" stroke-width="0.4"/>
    <path d="M160,145 Q164,170 162,195 Q158,200 154,195 Q150,175 146,145 Z" fill="#2a2a3e" opacity="0.2" stroke="#3a3a50" stroke-width="0.4"/>
    
    <!-- Abs / Core -->
    <path id="muscle-core-f" d="M80,100 Q78,120 78,145 Q78,165 82,175 L95,178 L108,175 Q112,165 112,145 Q112,120 110,100 Q100,105 80,100 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    <!-- Ab lines -->
    <line x1="95" y1="105" x2="95" y2="175" stroke="#3a3a50" stroke-width="0.4" opacity="0.5"/>
    <line x1="80" y1="115" x2="110" y2="115" stroke="#3a3a50" stroke-width="0.3" opacity="0.4"/>
    <line x1="80" y1="130" x2="110" y2="130" stroke="#3a3a50" stroke-width="0.3" opacity="0.4"/>
    <line x1="80" y1="145" x2="110" y2="145" stroke="#3a3a50" stroke-width="0.3" opacity="0.4"/>
    <line x1="82" y1="160" x2="108" y2="160" stroke="#3a3a50" stroke-width="0.3" opacity="0.4"/>
    
    <!-- Quads -->
    <path id="muscle-legs-fl" d="M78,178 Q72,210 68,250 Q66,275 70,300 Q78,310 86,305 Q92,285 95,260 Q95,220 88,178 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    <path id="muscle-legs-fr" d="M112,178 Q118,210 122,250 Q124,275 120,300 Q112,310 104,305 Q98,285 95,260 Q95,220 102,178 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    
    <!-- Calves (front) -->
    <path d="M70,310 Q68,340 70,370 Q74,385 80,380 Q84,360 86,340 Q86,320 82,310 Z" fill="#2a2a3e" opacity="0.2" stroke="#3a3a50" stroke-width="0.4"/>
    <path d="M120,310 Q122,340 120,370 Q116,385 110,380 Q106,360 104,340 Q104,320 108,310 Z" fill="#2a2a3e" opacity="0.2" stroke="#3a3a50" stroke-width="0.4"/>
    
    <!-- Feet -->
    <ellipse cx="76" cy="395" rx="12" ry="5" fill="#2a2a3e" opacity="0.15"/>
    <ellipse cx="114" cy="395" rx="12" ry="5" fill="#2a2a3e" opacity="0.15"/>
    
    <!-- Label -->
    <text x="95" y="420" text-anchor="middle" fill="#4a4a62" font-size="10" font-family="Oswald,sans-serif" letter-spacing="2">FRONT</text>
  </g>
  
  <!-- ===== BACK VIEW (right side) ===== -->
  <g transform="translate(220,10)">
    <!-- Head -->
    <ellipse cx="95" cy="18" rx="16" ry="20" fill="#2a2a3e" opacity="0.3" stroke="#3a3a50" stroke-width="0.8"/>
    <!-- Neck / Traps -->
    <path d="M82,36 L68,52 L122,52 L108,36 Z" fill="#2a2a3e" opacity="0.25" stroke="#3a3a50" stroke-width="0.5"/>
    
    <!-- Rear Delts / Shoulders -->
    <path id="muscle-shoulders-bl" d="M55,52 Q42,58 38,75 Q42,82 55,78 Q62,70 62,58 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    <path id="muscle-shoulders-br" d="M135,52 Q148,58 152,75 Q148,82 135,78 Q128,70 128,58 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    
    <!-- Upper Back / Lats -->
    <path id="muscle-back-l" d="M62,58 Q58,75 60,100 Q65,115 78,120 L95,115 L95,58 Q85,52 62,58 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    <path id="muscle-back-r" d="M128,58 Q132,75 130,100 Q125,115 112,120 L95,115 L95,58 Q105,52 128,58 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    <!-- Spine line -->
    <line x1="95" y1="55" x2="95" y2="175" stroke="#3a3a50" stroke-width="0.5" opacity="0.4"/>
    
    <!-- Triceps -->
    <path id="muscle-arms-bl" d="M38,78 Q32,95 30,115 Q28,132 32,145 Q38,148 44,140 Q48,125 48,105 Q48,88 42,78 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    <path id="muscle-arms-br" d="M152,78 Q158,95 160,115 Q162,132 158,145 Q152,148 146,140 Q142,125 142,105 Q142,88 148,78 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    
    <!-- Forearms -->
    <path d="M30,145 Q26,170 28,195 Q32,200 36,195 Q40,175 44,145 Z" fill="#2a2a3e" opacity="0.2" stroke="#3a3a50" stroke-width="0.4"/>
    <path d="M160,145 Q164,170 162,195 Q158,200 154,195 Q150,175 146,145 Z" fill="#2a2a3e" opacity="0.2" stroke="#3a3a50" stroke-width="0.4"/>
    
    <!-- Lower Back / Core back -->
    <path id="muscle-core-b" d="M78,120 Q76,140 78,165 Q80,175 95,178 Q110,175 112,165 Q114,140 112,120 Q100,125 78,120 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5" opacity="0.6"/>
    
    <!-- Glutes -->
    <path id="muscle-legs-gl" d="M78,178 Q72,185 70,200 Q72,215 82,218 L95,215 L95,178 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    <path id="muscle-legs-gr" d="M112,178 Q118,185 120,200 Q118,215 108,218 L95,215 L95,178 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    
    <!-- Hamstrings -->
    <path id="muscle-legs-bl" d="M70,218 Q68,250 68,280 Q70,305 78,310 Q86,308 88,295 Q90,270 88,240 Q86,218 82,218 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    <path id="muscle-legs-br" d="M120,218 Q122,250 122,280 Q120,305 112,310 Q104,308 102,295 Q100,270 102,240 Q104,218 108,218 Z" class="muscle-none" stroke="#3a3a50" stroke-width="0.5"/>
    
    <!-- Calves (back) -->
    <path d="M70,310 Q66,330 65,350 Q66,375 74,385 Q80,382 84,365 Q86,345 86,325 Q84,312 78,310 Z" fill="#2a2a3e" opacity="0.2" stroke="#3a3a50" stroke-width="0.4"/>
    <path d="M120,310 Q124,330 125,350 Q124,375 116,385 Q110,382 106,365 Q104,345 104,325 Q106,312 112,310 Z" fill="#2a2a3e" opacity="0.2" stroke="#3a3a50" stroke-width="0.4"/>
    
    <!-- Feet -->
    <ellipse cx="76" cy="395" rx="12" ry="5" fill="#2a2a3e" opacity="0.15"/>
    <ellipse cx="114" cy="395" rx="12" ry="5" fill="#2a2a3e" opacity="0.15"/>
    
    <!-- Label -->
    <text x="95" y="420" text-anchor="middle" fill="#4a4a62" font-size="10" font-family="Oswald,sans-serif" letter-spacing="2">BACK</text>
  </g>
</svg>`;
