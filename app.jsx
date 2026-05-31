import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase (SSO: all apps authenticate against TentCity's project) ───
const SUPABASE_URL = 'https://skdqogcectobrvokjxkb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZHFvZ2NlY3RvYnJ2b2tqeGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNzY4NTEsImV4cCI6MjA5NTc1Mjg1MX0.kixz5uR-X2XmlJTqw8QZ58k9IDBlT1Gjo0TcQZ9DWJ0';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MAPBOX_TOKEN = window.__MAPBOX_TOKEN || '';
const ADMIN_EMAIL = '247ggtms@gmail.com';

// ─── Location Tracking (pings TentCity's location_pings table) ───
async function hashUserId(userId) {
  const data = new TextEncoder().encode(userId);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const TRACKING_SESSION_ID = crypto.randomUUID();

async function trackLocation(userId) {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const anonId = await hashUserId(userId);
      await supabase.from('location_pings').insert({
        anon_id: anonId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        app_source: 'bridgework',
        session_id: TRACKING_SESSION_ID,
      });
    } catch { /* silent fail — tracking should never break the app */ }
  }, () => { /* geolocation denied — that's fine */ }, { enableHighAccuracy: false, timeout: 10000 });
}

// ─── Geocoding helper ───
async function geocodeAddress(address) {
  if (!MAPBOX_TOKEN || !address) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng, place_name: data.features[0].place_name };
    }
  } catch (e) { /* fail silently */ }
  return null;
}

// ─── Auth Form ───
function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('worker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { role, username: username || email.split('@')[0] } }
        });
        if (err) throw err;
        if (data.user) onAuth(data.user);
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        if (data.user) onAuth(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <h1><span>Bridge</span>Work</h1>
          <p>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</p>
        </div>

        {error && (
          <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div className="role-selector">
                <button type="button" className={`role-btn ${role === 'worker' ? 'active' : ''}`} onClick={() => setRole('worker')}>
                  I'm a Worker
                </button>
                <button type="button" className={`role-btn ${role === 'business' ? 'active' : ''}`} onClick={() => setRole('business')}>
                  I'm a Business
                </button>
              </div>
              <div className="form-group">
                <label>Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Pick a username" />
              </div>
            </>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-green btn-block" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <>Don't have an account? <a onClick={() => setMode('signup')}>Sign up</a></>
          ) : (
            <>Already have an account? <a onClick={() => setMode('login')}>Log in</a></>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Post Job Form ───
function PostJobForm({ user, onClose, onPosted }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pay, setPay] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePost = async () => {
    if (!title || !pay || !address) {
      setError('Fill in the title, pay, and address.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Geocode the address
      const geo = await geocodeAddress(address);
      if (!geo) {
        setError('Could not find that address. Try being more specific.');
        setSaving(false);
        return;
      }

      const { error: insertErr } = await supabase.from('jobs').insert({
        title,
        description,
        pay: parseFloat(pay),
        address: geo.place_name || address,
        lat: geo.lat,
        lng: geo.lng,
        status: 'open',
        posted_by: user.id,
      });
      if (insertErr) throw insertErr;

      onPosted && onPosted();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-panel">
      <div className="page-header">
        <button className="back-btn" onClick={onClose}>←</button>
        <div>
          <h2>Post a Task</h2>
          <p>Workers nearby will see it on the map</p>
        </div>
      </div>
      <div className="page-body">
        {error && (
          <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <div className="form-group">
          <label>Task Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Help unload delivery truck" />
        </div>
        <div className="form-group">
          <label>Description (optional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="What does the worker need to do? How long will it take?"
            style={{ minHeight: '100px' }} />
        </div>
        <div className="form-group">
          <label>Pay (cash)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>$</span>
            <input type="number" value={pay} onChange={e => setPay(e.target.value)}
              placeholder="50" style={{ maxWidth: '140px' }} />
          </div>
        </div>
        <div className="form-group">
          <label>Address</label>
          <input value={address} onChange={e => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St, Minneapolis, MN" />
          <small style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            This gets placed on the map so workers can find it
          </small>
        </div>
        <button className="btn btn-green btn-block" onClick={handlePost} disabled={saving}>
          {saving ? 'Posting...' : 'Post Task'}
        </button>
      </div>
    </div>
  );
}

// ─── Job Detail Bottom Sheet ───
function JobDetail({ job, user, onClose, onClaim }) {
  const [claiming, setClaiming] = useState(false);
  const role = user?.user_metadata?.role || 'worker';
  const isOwner = job.posted_by === user?.id;
  const isClaimed = job.status === 'claimed' || job.status === 'done';

  const handleClaim = async () => {
    setClaiming(true);
    const { error } = await supabase.from('jobs')
      .update({ status: 'claimed', claimed_by: user.id, claimed_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('status', 'open');
    if (!error) {
      onClaim && onClaim();
    }
    setClaiming(false);
  };

  const handleComplete = async () => {
    await supabase.from('jobs')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', job.id);
    onClaim && onClaim();
  };

  return (
    <div className="bottom-sheet open">
      <div className="sheet-handle" />
      <div className="job-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="job-title">{job.title}</div>
            <div className="job-pay">${job.pay}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-dim)', cursor: 'pointer' }}>✕</button>
        </div>
        {job.description && <div className="job-desc">{job.description}</div>}
        <div className="job-meta">
          <span>📍 {job.address}</span>
          <span>🕐 {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
        </div>
        <span className={`job-status status-${job.status}`}>{job.status}</span>

        {role === 'worker' && job.status === 'open' && !isOwner && (
          <button className="btn btn-green btn-block" onClick={handleClaim} disabled={claiming}
            style={{ marginTop: '1rem' }}>
            {claiming ? 'Claiming...' : 'Claim This Task'}
          </button>
        )}
        {isOwner && job.status === 'claimed' && (
          <button className="btn btn-green btn-block" onClick={handleComplete} style={{ marginTop: '1rem' }}>
            Mark as Complete
          </button>
        )}
        {job.status === 'claimed' && job.claimed_by === user?.id && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(45,106,79,0.08)', borderRadius: '0.75rem', fontSize: '0.85rem', color: 'var(--green)', fontWeight: 600, textAlign: 'center' }}>
            You claimed this task! Head to the location.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile Page ───
function ProfilePage({ user, onClose }) {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const role = user?.user_metadata?.role || 'worker';
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    loadData();
    setEditName(user?.user_metadata?.username || user?.email?.split('@')[0] || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.user_metadata?.phone || '');
  }, []);

  const loadData = async () => {
    if (role === 'worker') {
      const { data: done } = await supabase.from('jobs').select('id, pay').eq('claimed_by', user.id).eq('status', 'done');
      const { data: missed } = await supabase.from('jobs').select('id').eq('claimed_by', user.id).eq('status', 'reported');
      const earned = (done || []).reduce((sum, j) => sum + (j.pay || 0), 0);
      setProfile({ done: (done || []).length, missed: (missed || []).length, earned });
      const { data: history } = await supabase.from('jobs').select('*').eq('claimed_by', user.id).order('created_at', { ascending: false }).limit(20);
      setJobs(history || []);
    } else {
      const { data: posted } = await supabase.from('jobs').select('*').eq('posted_by', user.id).order('created_at', { ascending: false }).limit(20);
      setJobs(posted || []);
      const open = (posted || []).filter(j => j.status === 'open').length;
      const active = (posted || []).filter(j => j.status === 'claimed').length;
      const completed = (posted || []).filter(j => j.status === 'done').length;
      setProfile({ open, active, completed });
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      // Update username in profiles table and auth metadata
      if (editName && editName !== username) {
        await supabase.from('profiles').update({ username: editName }).eq('id', user.id);
        await supabase.auth.updateUser({ data: { username: editName } });
      }

      // Update email
      if (editEmail && editEmail !== user.email) {
        const { error } = await supabase.auth.updateUser({ email: editEmail });
        if (error) { setSaveMsg('Email update failed: ' + error.message); setSaving(false); return; }
      }

      // Update phone in metadata
      if (editPhone !== (user?.user_metadata?.phone || '')) {
        await supabase.auth.updateUser({ data: { phone: editPhone } });
      }

      // Update password
      if (newPassword) {
        if (newPassword.length < 6) { setSaveMsg('Password must be at least 6 characters'); setSaving(false); return; }
        if (newPassword !== confirmPassword) { setSaveMsg('Passwords do not match'); setSaving(false); return; }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) { setSaveMsg('Password update failed: ' + error.message); setSaving(false); return; }
        setNewPassword('');
        setConfirmPassword('');
      }

      setSaveMsg('Profile updated!');
      setEditing(false);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      setSaveMsg('Something went wrong');
    }
    setSaving(false);
  };

  return (
    <div className="page-panel">
      <div className="profile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="back-btn" onClick={onClose}>←</button>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.75 }}>Map</span>
      </div>
      <div className="profile-header">
        <div className="profile-avatar">{(editing ? editName : username)[0]?.toUpperCase()}</div>
        <div className="profile-name">{editing ? editName : username}</div>
        <div className="profile-badge">{role}</div>
        <div className="profile-email">{user.email}</div>
      </div>

      {!loading && profile && (
        <div className="stats-row">
          {role === 'worker' ? (
            <>
              <div className="stat-item"><div className="stat-num">{profile.done}</div><div className="stat-label">Done</div></div>
              <div className="stat-item"><div className="stat-num">{profile.missed}</div><div className="stat-label">Missed</div></div>
              <div className="stat-item"><div className="stat-num" style={{ color: 'var(--green)' }}>${profile.earned}</div><div className="stat-label">Earned</div></div>
            </>
          ) : (
            <>
              <div className="stat-item"><div className="stat-num">{profile.open}</div><div className="stat-label">Open</div></div>
              <div className="stat-item"><div className="stat-num">{profile.active}</div><div className="stat-label">Active</div></div>
              <div className="stat-item"><div className="stat-num">{profile.completed}</div><div className="stat-label">Completed</div></div>
            </>
          )}
        </div>
      )}

      {/* Edit Profile Section */}
      <div style={{ padding: '0 1.25rem 1rem' }}>
        {!editing ? (
          <button className="btn btn-primary btn-block" onClick={() => setEditing(true)}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', width: '100%', fontSize: '0.9rem' }}>
            Edit Profile
          </button>
        ) : (
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '1rem' }}>Edit Profile</h3>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block', color: 'var(--text-muted)' }}>Username</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name"
                style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block', color: 'var(--text-muted)' }}>Email</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="your@email.com"
                style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block', color: 'var(--text-muted)' }}>Phone (optional)</label>
              <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(612) 555-1234"
                style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block', color: 'var(--text-muted)' }}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current"
                style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            {newPassword && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block', color: 'var(--text-muted)' }}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
            )}

            {saveMsg && (
              <div style={{ fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', padding: '0.5rem', borderRadius: '0.5rem',
                color: saveMsg.includes('updated') ? 'var(--green)' : '#e74c3c',
                background: saveMsg.includes('updated') ? 'rgba(76,175,80,0.1)' : 'rgba(231,76,60,0.1)' }}>
                {saveMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { setEditing(false); setSaveMsg(''); }} disabled={saving}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                Cancel
              </button>
              <button onClick={handleSaveProfile} disabled={saving}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 1.25rem 1rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>
          {role === 'worker' ? 'Job History' : 'Your Posted Tasks'}
        </h3>
        {jobs.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
            {role === 'worker' ? 'No completed jobs yet' : 'No posted tasks yet'}
            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {role === 'worker' ? 'Find a job on the map to get started' : 'Post your first task to get workers'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {jobs.map(j => (
              <div key={j.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{j.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{j.address}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--green)' }}>${j.pay}</div>
                    <span className={`job-status status-${j.status}`}>{j.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '0 1.25rem 2rem' }}>
        <button className="btn btn-outline btn-block" onClick={async () => {
          await supabase.auth.signOut();
          window.location.reload();
        }}>Log Out</button>
      </div>
    </div>
  );
}

// ─── Contact Page ───
function ContactPage({ onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!name || !email || !message) return;
    await supabase.from('contact_messages').insert({ name, email, message });
    setSent(true);
  };

  return (
    <div className="page-panel">
      <div className="page-header">
        <button className="back-btn" onClick={onClose}>←</button>
        <div>
          <h2>Get in touch</h2>
          <p>Real humans read every message. Usually me.</p>
        </div>
      </div>
      <div className="page-body">
        {sent ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <h3>Message Sent!</h3>
            <p style={{ color: 'var(--text-muted)' }}>We'll get back to you soon.</p>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Report a missing spot, suggest a feature, or just say hi"
                style={{ minHeight: '140px' }} />
            </div>
            <button className="btn btn-blue btn-block" onClick={handleSend}>
              ✈ Send Message
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Admin Panel ───
function AdminPanel({ user, onClose }) {
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifTarget, setNotifTarget] = useState('everyone');
  const [notifMsg, setNotifMsg] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: j } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    setJobs(j || []);
    // We can't list auth users from client, so we'll query jobs for unique posters/claimers
    // For now show jobs data
  };

  const openCount = jobs.filter(j => j.status === 'open').length;
  const activeCount = jobs.filter(j => j.status === 'claimed').length;
  const reportedCount = jobs.filter(j => j.status === 'reported').length;

  const sendNotification = async () => {
    if (!notifMsg.trim()) return;
    await supabase.from('notifications').insert({
      type: 'broadcast',
      target: notifTarget,
      title: 'Announcement',
      message: notifMsg,
      sent_by: user.id,
    });
    setNotifMsg('');
    alert('Notification sent!');
  };

  const filteredJobs = jobs.filter(j => {
    if (search) {
      const s = search.toLowerCase();
      return j.title?.toLowerCase().includes(s) || j.address?.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="page-panel">
      <div style={{ background: 'var(--green-dark)', color: '#fff', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>⚙</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Admin Panel</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="back-btn" onClick={onClose}>Map</button>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat"><div className="admin-stat-num">{openCount}</div><div className="admin-stat-label">Open</div></div>
        <div className="admin-stat"><div className="admin-stat-num">{activeCount}</div><div className="admin-stat-label">Active</div></div>
        <div className="admin-stat"><div className="admin-stat-num">{reportedCount}</div><div className="admin-stat-label">Reported</div></div>
      </div>

      {/* Broadcast */}
      <div className="card" style={{ margin: '1rem', padding: '1rem' }}>
        <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔔 Broadcast Notification
        </h4>
        <div className="notif-bar">
          {['everyone', 'workers', 'businesses'].map(t => (
            <button key={t} className={`role-btn ${notifTarget === t ? 'active' : ''}`}
              onClick={() => setNotifTarget(t)} style={{ textTransform: 'capitalize' }}>
              {t === 'everyone' ? 'Everyone' : t === 'workers' ? 'Workers only' : 'Businesses only'}
            </button>
          ))}
        </div>
        <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)}
          placeholder="Type your message..." style={{ minHeight: '80px', marginBottom: '0.75rem' }} />
        <button className="btn btn-blue btn-block" onClick={sendNotification}>Send Notification</button>
      </div>

      {/* Search */}
      <div style={{ padding: '0 1rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs, users..." />
      </div>

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginTop: '0.75rem' }}>
        <button className={`admin-tab ${tab === 'jobs' ? 'active' : ''}`} onClick={() => setTab('jobs')}>Jobs ({jobs.length})</button>
        <button className={`admin-tab ${tab === 'map' ? 'active' : ''}`} onClick={() => setTab('map')}>Map</button>
      </div>

      {tab === 'jobs' && (
        <div style={{ padding: '0.75rem 1rem' }}>
          {filteredJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No jobs yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredJobs.map(j => (
                <div key={j.id} className="card" style={{ padding: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{j.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{j.address}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--green)' }}>${j.pay}</div>
                      <span className={`job-status status-${j.status}`}>{j.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'map' && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
          Close admin to view the map
        </div>
      )}
    </div>
  );
}

// ─── Main Map View ───
function MapView({ user, onLogout }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(null); // 'profile', 'post', 'contact', 'admin'
  const role = user?.user_metadata?.role || 'worker';
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

  const loadJobs = useCallback(async () => {
    const { data } = await supabase.from('jobs').select('*').in('status', ['open', 'claimed']).order('created_at', { ascending: false });
    setJobs(data || []);
  }, []);

  // Init map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-93.265, 44.977], // Minneapolis default
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.current.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13 });
        },
        () => {}, { enableHighAccuracy: true }
      );
    }

    loadJobs();
    // Poll for new jobs every 30s
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update markers when jobs change
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    jobs.forEach(job => {
      if (!job.lat || !job.lng) return;

      const color = job.status === 'open' ? '#22c55e' : '#f0ad4e';

      const el = document.createElement('div');
      el.style.cssText = `width:28px;height:28px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([job.lng, job.lat])
        .addTo(map.current);

      el.addEventListener('click', () => {
        setSelectedJob(job);
        map.current.flyTo({ center: [job.lng, job.lat], zoom: 14 });
      });

      markersRef.current.push(marker);
    });
  }, [jobs]);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 14 });
      },
      () => alert('Could not get your location')
    );
  };

  const openCount = jobs.filter(j => j.status === 'open').length;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Top bar */}
      <div className="top-bar">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="top-btn" onClick={() => setPage('profile')}>
            {username[0]?.toUpperCase()}
          </button>
          <button className="top-btn" onClick={() => setMenuOpen(true)}>☰</button>
        </div>

        <div className="top-banner">
          <div className={`dot ${openCount > 0 ? 'dot-green' : 'dot-yellow'}`} />
          {openCount} Cash Opportunit{openCount !== 1 ? 'ies' : 'y'} Near You Right Now
        </div>

        <button className="top-btn" onClick={loadJobs}>↻</button>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <span><div className="dot dot-green" /> Now</span>
        <span><div className="dot dot-yellow" /> Claimed</span>
      </div>

      {/* GPS + Post/Chat */}
      <div className="map-actions">
        <button className="top-btn" onClick={locateMe}>⊕</button>
        {role === 'business' && (
          <button className="top-btn" style={{ background: 'var(--green)', color: '#fff', fontWeight: 800, fontSize: '1.5rem' }}
            onClick={() => setPage('post')}>+</button>
        )}
      </div>

      {/* Sidebar menu */}
      <div className={`sidebar-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className="sidebar" onClick={e => e.stopPropagation()}>
          <div className="sidebar-header" onClick={() => { setMenuOpen(false); setPage('profile'); }} style={{ cursor: 'pointer' }}>
            <div className="sidebar-avatar">{username[0]?.toUpperCase()}</div>
            <div>
              <div className="sidebar-name">{username}</div>
              <div className="sidebar-role">{role}</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.5 }}>Edit →</div>
          </div>
          <div className="sidebar-links">
            {role === 'business' && (
              <button className="sidebar-link" onClick={() => { setMenuOpen(false); setPage('post'); }}>
                ➕ Post a Task
              </button>
            )}
            <div className="sidebar-divider" />
            <button className="sidebar-link" onClick={() => { setMenuOpen(false); setPage('contact'); }}>
              ✉ Contact Us
            </button>
            {user.email === ADMIN_EMAIL && (
              <>
                <div className="sidebar-divider" />
                <button className="sidebar-link" onClick={() => { setMenuOpen(false); setPage('admin'); }}>
                  ⚙ Admin Panel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Job detail sheet */}
      {selectedJob && (
        <JobDetail
          job={selectedJob}
          user={user}
          onClose={() => setSelectedJob(null)}
          onClaim={() => { setSelectedJob(null); loadJobs(); }}
        />
      )}

      {/* Page panels */}
      {page === 'profile' && <ProfilePage user={user} onClose={() => setPage(null)} />}
      {page === 'post' && <PostJobForm user={user} onClose={() => setPage(null)} onPosted={loadJobs} />}
      {page === 'contact' && <ContactPage onClose={() => setPage(null)} />}
      {page === 'admin' && <AdminPanel user={user} onClose={() => setPage(null)} />}
    </div>
  );
}

// ─── App ───
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
      if (session?.user) trackLocation(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (_event === 'SIGNED_IN' && session?.user) trackLocation(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--green)' }}>BridgeWork</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuth={(u) => setUser(u)} />;
  }

  return <MapView user={user} />;
}

createRoot(document.getElementById('root')).render(<App />);
