// BridgeWork Public API - Active Cash Tasks
// GET /api/tasks → returns open/active tasks with location data
// Used by TentCity.app Employment section

// Credentials from Vercel env vars (single source of truth)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://skdqogcectobrvokjxkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZHFvZ2NlY3RvYnJ2b2tqeGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNzY4NTEsImV4cCI6MjA5NTc1Mjg1MX0.kixz5uR-X2XmlJTqw8QZ58k9IDBlT1Gjo0TcQZ9DWJ0';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const params = new URLSearchParams({
      select: 'id,title,description,pay,address,lat,lng,status,created_at',
      or: '(status.eq.open,status.eq.active)',
      order: 'created_at.desc',
      limit: '50',
    });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/jobs?${params}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: 'Database query failed', details: error });
    }

    const tasks = await response.json();
    return res.status(200).json({ source: 'bridgework', count: tasks.length, tasks });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
