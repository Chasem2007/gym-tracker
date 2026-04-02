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
  MUSCLE MAP SVG — Anatomical front and back view
  Realistic muscle shapes with bezier curves.
  Each muscle path uses id="muscle-{group}-..." so
  the JS selector [id*="muscle-{group}"] can target
  and color muscles based on workout data.
  Groups: chest, back, shoulders, arms, legs, core
*/
const MUSCLE_MAP_SVG = `<svg viewBox="0 0 460 510" xmlns="http://www.w3.org/2000/svg">

  <!-- ===== FRONT VIEW ===== -->
  <g transform="translate(5,5)">

    <!-- Body background silhouette layers -->
    <ellipse cx="110" cy="27" rx="18" ry="22" fill="#252538" stroke="#32325a" stroke-width="0.8"/>
    <path fill="#1e1e32" d="M 101,47 L 119,47 L 122,66 L 98,66 Z"/>
    <!-- Torso left background -->
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 57,70 C 66,64 86,62 98,62 L 98,244 C 88,244 74,240 68,230 C 60,215 62,190 65,168 C 67,148 62,124 56,112 Z"/>
    <!-- Torso right background -->
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 163,70 C 154,64 134,62 122,62 L 122,244 C 132,244 146,240 152,230 C 160,215 158,190 155,168 C 153,148 158,124 164,112 Z"/>
    <!-- Left arm background -->
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 56,72 C 45,78 37,102 35,132 C 33,158 37,184 46,200 C 40,214 36,242 34,268 C 32,286 36,300 44,304 C 52,307 60,301 62,286 C 66,261 65,234 58,210 C 66,200 70,185 70,165 C 72,144 67,116 56,72 Z"/>
    <!-- Right arm background -->
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 164,72 C 175,78 183,102 185,132 C 187,158 183,184 174,200 C 180,214 184,242 186,268 C 188,286 184,300 176,304 C 168,307 160,301 158,286 C 154,261 155,234 162,210 C 154,200 150,185 150,165 C 148,144 153,116 164,72 Z"/>
    <!-- Left leg background -->
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 80,246 C 68,256 60,284 58,320 C 56,350 58,374 66,386 C 60,400 57,428 59,456 C 61,470 70,477 79,475 C 88,473 93,463 92,450 C 93,428 88,402 84,388 C 93,376 97,354 97,322 C 98,290 93,260 80,246 Z"/>
    <!-- Right leg background -->
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 140,246 C 152,256 160,284 162,320 C 164,350 162,374 154,386 C 160,400 163,428 161,456 C 159,470 150,477 141,475 C 132,473 127,463 128,450 C 127,428 132,402 136,388 C 127,376 123,354 123,322 C 122,290 127,260 140,246 Z"/>
    <!-- Feet -->
    <ellipse cx="75" cy="472" rx="15" ry="6" fill="#1c1c2e" stroke="#26263e" stroke-width="0.5"/>
    <ellipse cx="145" cy="472" rx="15" ry="6" fill="#1c1c2e" stroke="#26263e" stroke-width="0.5"/>

    <!-- ===== FRONT MUSCLES ===== -->

    <!-- UPPER TRAPEZIUS — neck-to-shoulder slope visible from front -->
    <path id="muscle-shoulders-trap-fl" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 101,50 C 94,55 80,62 65,70 C 58,74 57,72 62,78 C 70,76 90,68 106,60 Z"/>
    <path id="muscle-shoulders-trap-fr" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 119,50 C 126,55 140,62 155,70 C 162,74 163,72 158,78 C 150,76 130,68 114,60 Z"/>

    <!-- ANTERIOR DELTOID — front of shoulder, teardrop shape -->
    <path id="muscle-shoulders-fl" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 62,72 C 50,74 42,87 44,103 C 46,117 58,123 70,118 C 80,111 82,97 76,84 C 71,73 67,71 62,72 Z"/>
    <path id="muscle-shoulders-fr" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 158,72 C 170,74 178,87 176,103 C 174,117 162,123 150,118 C 140,111 138,97 144,84 C 149,73 153,71 158,72 Z"/>

    <!-- PECTORALIS MAJOR — large fan-shaped chest muscle -->
    <path id="muscle-chest-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 98,66 C 86,66 72,72 62,82 C 52,92 50,108 56,120 C 62,130 76,136 93,136 C 98,136 100,134 100,130 L 100,66 Z"/>
    <path id="muscle-chest-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 122,66 C 134,66 148,72 158,82 C 168,92 170,108 164,120 C 158,130 144,136 127,136 C 122,136 120,134 120,130 L 120,66 Z"/>
    <line x1="110" y1="66" x2="110" y2="136" stroke="#14142a" stroke-width="1.2" opacity="0.7"/>
    <path fill="none" stroke="#14142a" stroke-width="0.8" opacity="0.4"
      d="M 56,120 C 76,132 96,137 110,135 C 124,137 144,132 164,120"/>

    <!-- BICEPS BRACHII — elongated teardrop on front of upper arm -->
    <path id="muscle-arms-bicep-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 64,120 C 52,124 42,144 40,166 C 38,184 42,200 52,205 C 61,208 69,202 71,184 C 74,162 70,134 64,120 Z"/>
    <path id="muscle-arms-bicep-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 156,120 C 168,124 178,144 180,166 C 182,184 178,200 168,205 C 159,208 151,202 149,184 C 146,162 150,134 156,120 Z"/>

    <!-- FOREARM FLEXORS — tapered on front of forearm -->
    <path id="muscle-arms-fore-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 52,207 C 43,220 38,245 36,270 C 34,287 38,300 46,304 C 54,306 61,300 63,285 C 65,263 64,232 57,212 Z"/>
    <path id="muscle-arms-fore-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 168,207 C 177,220 182,245 184,270 C 186,287 182,300 174,304 C 166,306 159,300 157,285 C 155,263 156,232 163,212 Z"/>

    <!-- RECTUS ABDOMINIS — segmented 6-pack muscle, left and right columns -->
    <path id="muscle-core-abs-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 99,138 L 84,138 C 82,162 82,190 84,218 C 86,230 92,235 99,233 Z"/>
    <path id="muscle-core-abs-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 121,138 L 136,138 C 138,162 138,190 136,218 C 134,230 128,235 121,233 Z"/>
    <line x1="110" y1="138" x2="110" y2="233" stroke="#14142a" stroke-width="1.0" opacity="0.7"/>
    <line x1="83" y1="160" x2="137" y2="160" stroke="#14142a" stroke-width="0.7" opacity="0.5"/>
    <line x1="83" y1="184" x2="137" y2="184" stroke="#14142a" stroke-width="0.7" opacity="0.5"/>
    <line x1="84" y1="210" x2="136" y2="210" stroke="#14142a" stroke-width="0.7" opacity="0.5"/>

    <!-- EXTERNAL OBLIQUES — diagonal wedge flanking the abs -->
    <path id="muscle-core-obl-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 82,138 C 70,150 64,176 64,202 C 64,222 68,238 78,248 C 84,252 91,250 94,243 C 90,222 85,196 85,170 C 85,150 84,140 82,138 Z"/>
    <path id="muscle-core-obl-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 138,138 C 150,150 156,176 156,202 C 156,222 152,238 142,248 C 136,252 129,250 126,243 C 130,222 135,196 135,170 C 135,150 136,140 138,138 Z"/>

    <!-- QUADRICEPS — large muscle group on front of thigh -->
    <!-- Vastus lateralis + rectus femoris (outer/center, combined) -->
    <path id="muscle-legs-quad-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 80,250 C 68,262 60,292 58,326 C 56,354 58,374 67,386 C 73,392 83,392 89,383 C 95,367 97,337 96,304 C 95,274 89,255 80,250 Z"/>
    <path id="muscle-legs-quad-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 140,250 C 152,262 160,292 162,326 C 164,354 162,374 153,386 C 147,392 137,392 131,383 C 125,367 123,337 124,304 C 125,274 131,255 140,250 Z"/>
    <!-- Vastus medialis teardrop (inner lower quad) -->
    <path id="muscle-legs-vmed-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 90,358 C 88,362 86,372 88,382 C 90,389 96,390 101,385 C 106,378 105,366 100,358 C 96,352 92,354 90,358 Z"/>
    <path id="muscle-legs-vmed-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 130,358 C 132,362 134,372 132,382 C 130,389 124,390 119,385 C 114,378 115,366 120,358 C 124,352 128,354 130,358 Z"/>
    <!-- Quad crease definition -->
    <path fill="none" stroke="#14142a" stroke-width="0.6" opacity="0.4"
      d="M 67,268 C 74,263 82,265 87,274"/>
    <path fill="none" stroke="#14142a" stroke-width="0.6" opacity="0.4"
      d="M 153,268 C 146,263 118,265 113,274"/>

    <!-- SHINS (lower leg anterior, non-interactive) -->
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.4" opacity="0.6"
      d="M 65,390 C 58,404 56,432 58,456 C 60,468 67,472 76,470 L 78,388 Z"/>
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.4" opacity="0.6"
      d="M 155,390 C 162,404 164,432 162,456 C 160,468 153,472 144,470 L 142,388 Z"/>

    <text x="110" y="500" text-anchor="middle" fill="#44446a" font-size="10" font-family="Oswald,sans-serif" letter-spacing="2">FRONT</text>
  </g>

  <!-- ===== BACK VIEW ===== -->
  <g transform="translate(235,5)">

    <!-- Body background silhouette layers (same shape as front) -->
    <ellipse cx="110" cy="27" rx="18" ry="22" fill="#252538" stroke="#32325a" stroke-width="0.8"/>
    <path fill="#1e1e32" d="M 101,47 L 119,47 L 122,66 L 98,66 Z"/>
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 57,70 C 66,64 86,62 98,62 L 98,244 C 88,244 74,240 68,230 C 60,215 62,190 65,168 C 67,148 62,124 56,112 Z"/>
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 163,70 C 154,64 134,62 122,62 L 122,244 C 132,244 146,240 152,230 C 160,215 158,190 155,168 C 153,148 158,124 164,112 Z"/>
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 56,72 C 45,78 37,102 35,132 C 33,158 37,184 46,200 C 40,214 36,242 34,268 C 32,286 36,300 44,304 C 52,307 60,301 62,286 C 66,261 65,234 58,210 C 66,200 70,185 70,165 C 72,144 67,116 56,72 Z"/>
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 164,72 C 175,78 183,102 185,132 C 187,158 183,184 174,200 C 180,214 184,242 186,268 C 188,286 184,300 176,304 C 168,307 160,301 158,286 C 154,261 155,234 162,210 C 154,200 150,185 150,165 C 148,144 153,116 164,72 Z"/>
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 80,246 C 68,256 60,284 58,320 C 56,350 58,374 66,386 C 60,400 57,428 59,456 C 61,470 70,477 79,475 C 88,473 93,463 92,450 C 93,428 88,402 84,388 C 93,376 97,354 97,322 C 98,290 93,260 80,246 Z"/>
    <path fill="#1c1c2e" stroke="#26263e" stroke-width="0.6"
      d="M 140,246 C 152,256 160,284 162,320 C 164,350 162,374 154,386 C 160,400 163,428 161,456 C 159,470 150,477 141,475 C 132,473 127,463 128,450 C 127,428 132,402 136,388 C 127,376 123,354 123,322 C 122,290 127,260 140,246 Z"/>
    <ellipse cx="75" cy="472" rx="15" ry="6" fill="#1c1c2e" stroke="#26263e" stroke-width="0.5"/>
    <ellipse cx="145" cy="472" rx="15" ry="6" fill="#1c1c2e" stroke="#26263e" stroke-width="0.5"/>

    <!-- ===== BACK MUSCLES ===== -->

    <!-- TRAPEZIUS — large diamond covering upper back, upper/mid/lower portions -->
    <path id="muscle-back-trap-upper" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 110,50 C 132,55 158,65 166,78 C 172,88 168,100 155,106 C 142,112 128,116 110,118 C 92,116 78,112 65,106 C 52,100 48,88 54,78 C 62,65 88,55 110,50 Z"/>
    <line x1="110" y1="50" x2="110" y2="118" stroke="#14142a" stroke-width="0.8" opacity="0.5"/>
    <!-- Mid-trap horizontal crease -->
    <path fill="none" stroke="#14142a" stroke-width="0.6" opacity="0.4"
      d="M 65,88 C 88,96 110,98 132,96 C 148,94 158,90 155,86"/>

    <!-- INFRASPINATUS / TERES — shoulder blade region below trap -->
    <path id="muscle-back-infra-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 66,108 C 57,114 52,128 56,143 C 60,155 72,161 85,155 C 96,148 98,133 93,120 C 88,107 76,102 66,108 Z"/>
    <path id="muscle-back-infra-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 154,108 C 163,114 168,128 164,143 C 160,155 148,161 135,155 C 124,148 122,133 127,120 C 132,107 144,102 154,108 Z"/>

    <!-- LATISSIMUS DORSI — wide wing-shaped muscles creating V-taper -->
    <path id="muscle-back-lat-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 62,118 C 50,128 48,158 52,186 C 56,206 68,218 82,220 C 90,222 96,218 98,210 C 95,190 88,162 85,140 C 82,118 76,112 62,118 Z"/>
    <path id="muscle-back-lat-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 158,118 C 170,128 172,158 168,186 C 164,206 152,218 138,220 C 130,222 124,218 122,210 C 125,190 132,162 135,140 C 138,118 144,112 158,118 Z"/>
    <line x1="110" y1="118" x2="110" y2="240" stroke="#14142a" stroke-width="0.8" opacity="0.5"/>

    <!-- POSTERIOR DELTOID — round back-of-shoulder muscle -->
    <path id="muscle-shoulders-bl" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 56,72 C 44,74 37,87 39,103 C 41,117 53,124 65,118 C 76,112 78,97 72,84 C 67,73 62,71 56,72 Z"/>
    <path id="muscle-shoulders-br" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 164,72 C 176,74 183,87 181,103 C 179,117 167,124 155,118 C 144,112 142,97 148,84 C 153,73 158,71 164,72 Z"/>

    <!-- TRICEPS — horseshoe-shaped muscle on back of upper arm -->
    <path id="muscle-arms-tri-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 58,120 C 46,126 37,148 35,172 C 33,192 37,208 48,212 C 58,215 68,208 70,190 C 73,168 70,138 58,120 Z"/>
    <path id="muscle-arms-tri-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 162,120 C 174,126 183,148 185,172 C 187,192 183,208 172,212 C 162,215 152,208 150,190 C 147,168 150,138 162,120 Z"/>
    <!-- Triceps horseshoe division -->
    <path fill="none" stroke="#14142a" stroke-width="0.6" opacity="0.4"
      d="M 42,144 C 50,148 58,148 64,140"/>
    <path fill="none" stroke="#14142a" stroke-width="0.6" opacity="0.4"
      d="M 178,144 C 170,148 162,148 156,140"/>

    <!-- FOREARM EXTENSORS — back of forearm -->
    <path id="muscle-arms-ext-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 48,214 C 39,228 34,254 32,280 C 30,298 34,311 43,315 C 52,317 60,311 62,295 C 64,272 62,240 56,218 Z"/>
    <path id="muscle-arms-ext-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 172,214 C 181,228 186,254 188,280 C 190,298 186,311 177,315 C 168,317 160,311 158,295 C 156,272 158,240 164,218 Z"/>

    <!-- ERECTOR SPINAE — paired columns flanking the spine in lower back -->
    <path id="muscle-core-erect-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 103,140 C 99,156 96,178 96,202 C 96,220 99,232 103,242 C 106,246 109,246 110,244 L 110,138 Z"/>
    <path id="muscle-core-erect-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 117,140 C 121,156 124,178 124,202 C 124,220 121,232 117,242 C 114,246 111,246 110,244 L 110,138 Z"/>

    <!-- GLUTEUS MAXIMUS — large rounded buttock muscles -->
    <path id="muscle-legs-glute-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 79,248 C 66,258 58,282 60,308 C 62,328 72,342 87,340 C 100,338 108,326 106,308 C 104,288 96,260 79,248 Z"/>
    <path id="muscle-legs-glute-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 141,248 C 154,258 162,282 160,308 C 158,328 148,342 133,340 C 120,338 112,326 114,308 C 116,288 124,260 141,248 Z"/>
    <!-- Gluteal fold crease -->
    <path fill="none" stroke="#14142a" stroke-width="0.9" opacity="0.5"
      d="M 60,308 C 74,342 106,342 106,308"/>
    <path fill="none" stroke="#14142a" stroke-width="0.9" opacity="0.5"
      d="M 160,308 C 146,342 114,342 114,308"/>

    <!-- HAMSTRINGS — biceps femoris + semimembranosus on back of thigh -->
    <path id="muscle-legs-ham-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 78,342 C 65,356 57,384 57,414 C 57,432 63,446 73,450 C 83,452 92,444 94,428 C 97,406 96,372 90,348 Z"/>
    <path id="muscle-legs-ham-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 142,342 C 155,356 163,384 163,414 C 163,432 157,446 147,450 C 137,452 128,444 126,428 C 123,406 124,372 130,348 Z"/>
    <!-- Hamstring separation line -->
    <path fill="none" stroke="#14142a" stroke-width="0.6" opacity="0.4"
      d="M 74,360 C 78,378 80,400 78,420"/>
    <path fill="none" stroke="#14142a" stroke-width="0.6" opacity="0.4"
      d="M 146,360 C 142,378 140,400 142,420"/>

    <!-- GASTROCNEMIUS — diamond-shaped calf muscles -->
    <path id="muscle-legs-calf-l" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 71,452 C 61,464 57,480 59,490 C 61,498 68,500 76,498 C 84,496 90,488 90,476 C 90,462 84,450 71,452 Z"/>
    <path id="muscle-legs-calf-r" class="muscle-none" stroke="#1a1a2e" stroke-width="0.5"
      d="M 149,452 C 159,464 163,480 161,490 C 159,498 152,500 144,498 C 136,496 130,488 130,476 C 130,462 136,450 149,452 Z"/>
    <!-- Calf medial head division line -->
    <path fill="none" stroke="#14142a" stroke-width="0.6" opacity="0.4"
      d="M 72,454 C 76,468 76,484 74,494"/>
    <path fill="none" stroke="#14142a" stroke-width="0.6" opacity="0.4"
      d="M 148,454 C 144,468 144,484 146,494"/>

    <text x="110" y="500" text-anchor="middle" fill="#44446a" font-size="10" font-family="Oswald,sans-serif" letter-spacing="2">BACK</text>
  </g>
</svg>`;
