# 💪 GymTracker

A complete gym tracking app with user authentication, workout logging, calorie tracking, and analytics.

## Features

- ✅ User authentication (login/signup)
- ✅ Workout logging with exercises
- ✅ Calorie tracking
- ✅ Weight progress tracking
- ✅ Muscle group breakdown charts
- ✅ Exercise library
- ✅ Admin member management
- ✅ Persistent data with Supabase

## Tech Stack

- **Frontend**: Next.js, React, Recharts
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT + bcrypt
- **Deployment**: Vercel

## Quick Start

### Prerequisites
- Node.js 16+
- Supabase account
- Vercel account (for deployment)

### Local Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` with your Supabase keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   JWT_SECRET=your_secret
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000/login

### Demo Account
- Username: `chase`
- Password: `Smilingsquash479$`

## Deployment

### Deploy to Vercel

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/gym-tracker.git
   git push -u origin main
   ```

2. Go to https://vercel.com/import
3. Select your GitHub repository
4. Add environment variables (same as `.env.local`)
5. Click Deploy

## Project Structure

```
gym-tracker/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.js
│   │   │   └── signup.js
│   │   ├── admin/
│   │   │   └── members.js
│   │   ├── workouts/
│   │   │   ├── add.js
│   │   │   └── index.js
│   │   └── weight/
│   │       └── track.js
│   ├── login.js
│   └── app.js
├── lib/
│   ├── supabase.js
│   └── auth-middleware.js
├── public/
└── package.json
```

## Database Setup

Run this SQL in Supabase to create tables:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  calories_burned INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight_lbs INT,
  reps INT,
  sets INT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE exercise_muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_group TEXT NOT NULL
);

CREATE TABLE weight_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_lbs INT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_exercises_workout_id ON exercises(workout_id);
CREATE INDEX idx_weight_tracking_user_id ON weight_tracking(user_id);
```

## License

MIT
