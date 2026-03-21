// pages/app.js
// Main app component - now uses real API calls instead of localStorage

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, LogOut, Users, Dumbbell, Calendar, TrendingUp, Home } from 'lucide-react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

export default function GymTracker() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [workouts, setWorkouts] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  // Form states
  const [newWorkout, setNewWorkout] = useState({
    exercises: [{ name: '', weight: '', reps: '', sets: '', muscles: [] }],
    calories: ''
  });
  const [newWeight, setNewWeight] = useState('');
  const [newMember, setNewMember] = useState({ username: '', password: '' });

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      setIsLoggedIn(true);
      fetchUserData();
    } else {
      setLoading(false);
      router.push('/login');
    }
  }, []);

  // Fetch user's workouts and weight data
  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch workouts
      const workoutRes = await fetch('/api/workouts/index');
      if (workoutRes.ok) {
        const data = await workoutRes.json();
        setWorkouts(data.workouts);
      }

      // Fetch weight history
      const weightRes = await fetch('/api/weight/track');
      if (weightRes.ok) {
        const data = await weightRes.json();
        setWeightHistory(data.weights);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle workout submission
  const handleAddWorkout = async (e) => {
    e.preventDefault();
    
    if (!newWorkout.exercises[0].name || !newWorkout.calories) {
      setError('Please fill in exercise details and calories');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const res = await fetch('/api/workouts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          exercises: newWorkout.exercises,
          caloriesBurned: parseInt(newWorkout.calories)
        })
      });

      if (res.ok) {
        setError('');
        setNewWorkout({
          exercises: [{ name: '', weight: '', reps: '', sets: '', muscles: [] }],
          calories: ''
        });
        alert('Workout logged successfully!');
        fetchUserData(); // Refresh the data
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to log workout');
    }
  };

  // Handle weight tracking
  const handleTrackWeight = async (e) => {
    e.preventDefault();
    
    if (!newWeight) {
      setError('Please enter your weight');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const res = await fetch('/api/weight/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          weight: parseInt(newWeight)
        })
      });

      if (res.ok) {
        setError('');
        setNewWeight('');
        alert('Weight recorded!');
        fetchUserData();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to record weight');
    }
  };

  // Handle adding a member (admin only)
  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!newMember.username || !newMember.password) {
      setError('Username and password required');
      return;
    }

    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });

      if (res.ok) {
        setError('');
        setNewMember({ username: '', password: '' });
        alert('Member added successfully!');
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to add member');
    }
  };

  // Handle logout
  const handleLogout = () => {
    Cookies.remove('token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    router.push('/login');
  };

  // Helper functions
  const getTotalCalories = () => workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
  const getAverageCalories = () => workouts.length > 0 ? Math.round(getTotalCalories() / workouts.length) : 0;
  const getWorkoutsThisWeek = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workouts.filter(w => new Date(w.date) >= weekAgo).length;
  };

  const getMuscleBreakdown = () => {
    const muscleCount = {};
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    workouts.forEach(w => {
      if (new Date(w.date) >= weekAgo) {
        w.exercises.forEach(ex => {
          ex.muscles.forEach(muscle => {
            muscleCount[muscle] = (muscleCount[muscle] || 0) + 1;
          });
        });
      }
    });
    
    return Object.entries(muscleCount).map(([name, value]) => ({ name, value }));
  };

  const muscleColors = {
    chest: '#FF6B6B', back: '#4ECDC4', legs: '#45B7D1', shoulders: '#FFA07A',
    biceps: '#98D8C8', triceps: '#F7DC6F', glutes: '#BB8FCE', forearms: '#85C1E2'
  };

  const updateExercise = (index, field, value) => {
    const updated = [...newWorkout.exercises];
    updated[index][field] = value;
    setNewWorkout({ ...newWorkout, exercises: updated });
  };

  const toggleMuscle = (exerciseIndex, muscle) => {
    const updated = [...newWorkout.exercises];
    const muscles = updated[exerciseIndex].muscles;
    if (muscles.includes(muscle)) {
      updated[exerciseIndex].muscles = muscles.filter(m => m !== muscle);
    } else {
      updated[exerciseIndex].muscles = [...muscles, muscle];
    }
    setNewWorkout({ ...newWorkout, exercises: updated });
  };

  const handleAddExercise = () => {
    setNewWorkout({
      ...newWorkout,
      exercises: [...newWorkout.exercises, { name: '', weight: '', reps: '', sets: '', muscles: [] }]
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💪</div>
          <p>Loading your gym tracker...</p>
        </div>
      </div>
    );
  }

  // Shared styles
  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' },
    navbar: { background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(71, 85, 105, 0.2)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    navbarTitle: { fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' },
    navbarUser: { display: 'flex', alignItems: 'center', gap: '24px' },
    userBadge: { background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', color: '#93c5fd' },
    logoutBtn: { background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' },
    navTabs: { display: 'flex', gap: '8px', padding: '16px 24px', background: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid rgba(71, 85, 105, 0.2)', overflowX: 'auto' },
    navTab: { padding: '10px 16px', background: 'transparent', border: '1px solid rgba(71, 85, 105, 0.3)', borderRadius: '6px', color: '#cbd5e1', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
    navTabActive: { background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.6)', color: '#93c5fd' },
    mainContainer: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' },
    sectionTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' },
    statCard: { background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.5) 0%, rgba(71, 85, 105, 0.3) 100%)', border: '1px solid rgba(71, 85, 105, 0.3)', borderRadius: '12px', padding: '24px' },
    statLabel: { color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    statValue: { fontSize: '36px', fontWeight: '700', color: '#fff' },
    formSection: { background: 'rgba(51, 65, 85, 0.5)', border: '1px solid rgba(71, 85, 105, 0.3)', borderRadius: '12px', padding: '24px', marginBottom: '32px' },
    formLabel: { display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' },
    formInput: { width: '100%', padding: '10px 12px', border: '1px solid rgba(71, 85, 105, 0.4)', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.8)', color: '#fff', fontSize: '13px', marginBottom: '16px' },
    btn: { padding: '10px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' },
    btnPrimary: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' },
    error: { background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <div style={styles.navbarTitle}>💪 GymTracker</div>
        <div style={styles.navbarUser}>
          <div style={styles.userBadge}>{currentUser?.username}</div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div style={styles.navTabs}>
        {['home', 'log', 'library', 'members'].map(page => (
          <button
            key={page}
            style={{ ...styles.navTab, ...(currentPage === page ? styles.navTabActive : {}) }}
            onClick={() => setCurrentPage(page)}
          >
            {page === 'home' && <><Home size={16} /> Dashboard</>}
            {page === 'log' && <><Plus size={16} /> Log Workout</>}
            {page === 'library' && <><Dumbbell size={16} /> Exercise Library</>}
            {page === 'members' && <><Users size={16} /> Members</>}
          </button>
        ))}
      </div>

      <div style={styles.mainContainer}>
        {error && <div style={styles.error}>⚠️ {error}</div>}

        {currentPage === 'home' && (
          <>
            <h2 style={styles.sectionTitle}>
              <TrendingUp size={28} /> Dashboard
            </h2>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Current Weight</div>
                <div style={styles.statValue}>
                  {weightHistory.length > 0 ? weightHistory[0].weight : '---'} <span style={{ fontSize: '16px', color: '#64748b' }}>lbs</span>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Calories</div>
                <div style={styles.statValue}>{getTotalCalories().toLocaleString()}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Avg per Workout</div>
                <div style={styles.statValue}>{getAverageCalories()}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>This Week</div>
                <div style={styles.statValue}>{getWorkoutsThisWeek()}</div>
              </div>
            </div>

            {weightHistory.length > 0 && (
              <div style={{ ...styles.formSection, marginBottom: '32px' }}>
                <h3 style={styles.sectionTitle}>Weight Progress</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weightHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 105, 0.2)" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ background: 'rgba(30, 41, 59, 0.9)', border: 'none', borderRadius: '6px' }} />
                    <Line type="monotone" dataKey="weight" stroke="#3b82f6" dot={{ fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {getMuscleBreakdown().length > 0 && (
              <div style={{ ...styles.formSection, marginBottom: '32px' }}>
                <h3 style={styles.sectionTitle}>Muscles This Week</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={getMuscleBreakdown()} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                      {getMuscleBreakdown().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={muscleColors[entry.name] || '#64748b'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <h3 style={styles.sectionTitle}>Record Weight</h3>
            <form onSubmit={handleTrackWeight} style={styles.formSection}>
              <input
                type="number"
                placeholder="Your weight (lbs)"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                style={styles.formInput}
              />
              <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>Record Weight</button>
            </form>
          </>
        )}

        {currentPage === 'log' && (
          <>
            <h2 style={styles.sectionTitle}>
              <Dumbbell size={28} /> Log Workout
            </h2>
            <form onSubmit={handleAddWorkout} style={styles.formSection}>
              {newWorkout.exercises.map((ex, idx) => (
                <div key={idx} style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(71, 85, 105, 0.2)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#fff' }}>Exercise #{idx + 1}</h4>
                  <input type="text" placeholder="Exercise name" value={ex.name} onChange={(e) => updateExercise(idx, 'name', e.target.value)} style={{ ...styles.formInput, width: '100%' }} />
                  <input type="number" placeholder="Weight (lbs)" value={ex.weight} onChange={(e) => updateExercise(idx, 'weight', e.target.value)} style={{ ...styles.formInput, width: '48%', marginRight: '2%', display: 'inline-block' }} />
                  <input type="number" placeholder="Reps" value={ex.reps} onChange={(e) => updateExercise(idx, 'reps', e.target.value)} style={{ ...styles.formInput, width: '48%', display: 'inline-block' }} />
                  <input type="number" placeholder="Sets" value={ex.sets} onChange={(e) => updateExercise(idx, 'sets', e.target.value)} style={{ ...styles.formInput, width: '48%', marginRight: '2%', display: 'inline-block' }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'glutes', 'forearms'].map(muscle => (
                      <button
                        key={muscle}
                        type="button"
                        onClick={() => toggleMuscle(idx, muscle)}
                        style={{
                          padding: '6px 12px',
                          border: ex.muscles.includes(muscle) ? '1px solid rgba(59, 130, 246, 0.8)' : '1px solid rgba(71, 85, 105, 0.4)',
                          background: ex.muscles.includes(muscle) ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          color: ex.muscles.includes(muscle) ? '#93c5fd' : '#cbd5e1',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {muscle}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddExercise} style={{ ...styles.btn, background: 'rgba(71, 85, 105, 0.3)', color: '#cbd5e1', border: '1px solid rgba(71, 85, 105, 0.4)', marginBottom: '24px' }}>+ Add Exercise</button>
              <input type="number" placeholder="Total calories burned" value={newWorkout.calories} onChange={(e) => setNewWorkout({ ...newWorkout, calories: e.target.value })} style={styles.formInput} />
              <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>Log Workout</button>
            </form>
          </>
        )}

        {currentPage === 'library' && (
          <>
            <h2 style={styles.sectionTitle}>Exercise Library</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { name: 'Bench Press', muscles: ['chest', 'triceps'], difficulty: 'Intermediate' },
                { name: 'Squat', muscles: ['legs', 'glutes'], difficulty: 'Beginner' },
                { name: 'Deadlift', muscles: ['back', 'legs', 'glutes'], difficulty: 'Advanced' },
                { name: 'Incline Dumbbell Press', muscles: ['chest', 'shoulders'], difficulty: 'Intermediate' },
                { name: 'Leg Press', muscles: ['legs', 'glutes'], difficulty: 'Beginner' },
                { name: 'Bent Over Rows', muscles: ['back', 'biceps'], difficulty: 'Intermediate' },
                { name: 'Shoulder Press', muscles: ['shoulders', 'triceps'], difficulty: 'Intermediate' },
                { name: 'Barbell Curl', muscles: ['biceps'], difficulty: 'Beginner' },
                { name: 'Tricep Dips', muscles: ['triceps', 'chest'], difficulty: 'Intermediate' },
                { name: 'Leg Curl', muscles: ['legs'], difficulty: 'Beginner' },
                { name: 'Pull-ups', muscles: ['back', 'biceps'], difficulty: 'Advanced' },
                { name: 'Lat Pulldown', muscles: ['back', 'biceps'], difficulty: 'Beginner' }
              ].map((ex, idx) => (
                <div key={idx} style={{ ...styles.statCard, padding: '16px' }}>
                  <div style={{ color: '#fff', fontWeight: '600', marginBottom: '8px' }}>{ex.name}</div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>Difficulty: <span style={{ color: '#93c5fd' }}>{ex.difficulty}</span></div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {ex.muscles.map(m => (
                      <span key={m} style={{ background: muscleColors[m] + '30', color: muscleColors[m], padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {currentPage === 'members' && currentUser?.role === 'admin' && (
          <>
            <h2 style={styles.sectionTitle}>Manage Members</h2>
            <form onSubmit={handleAddMember} style={styles.formSection}>
              <h3 style={{ marginBottom: '16px', color: '#fff' }}>Add New Member</h3>
              <input type="text" placeholder="Username" value={newMember.username} onChange={(e) => setNewMember({ ...newMember, username: e.target.value })} style={styles.formInput} />
              <input type="password" placeholder="Password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} style={styles.formInput} />
              <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>Add Member</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
