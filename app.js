// app.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var SUPABASE_URL = "https://skdqogcectobrvokjxkb.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZHFvZ2NlY3RvYnJ2b2tqeGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNzY4NTEsImV4cCI6MjA5NTc1Mjg1MX0.kixz5uR-X2XmlJTqw8QZ58k9IDBlT1Gjo0TcQZ9DWJ0";
var supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
var MAPBOX_TOKEN = window.__MAPBOX_TOKEN || "";
var ADMIN_EMAIL = "247ggtms@gmail.com";
async function hashUserId(userId) {
  const data = new TextEncoder().encode(userId);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var TRACKING_SESSION_ID = crypto.randomUUID();
async function trackLocation(userId) {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const anonId = await hashUserId(userId);
      await supabase.from("location_pings").insert({
        anon_id: anonId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        app_source: "bridgework",
        session_id: TRACKING_SESSION_ID
      });
    } catch {
    }
  }, () => {
  }, { enableHighAccuracy: false, timeout: 1e4 });
}
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
  } catch (e) {
  }
  return null;
}
function AuthForm({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("worker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { role, username: username || email.split("@")[0] } }
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
  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (err) throw err;
    } catch (err) {
      setError(err.message);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "auth-page", children: /* @__PURE__ */ jsxs("div", { className: "auth-box", children: [
    /* @__PURE__ */ jsxs("div", { className: "auth-logo", children: [
      /* @__PURE__ */ jsxs("h1", { children: [
        /* @__PURE__ */ jsx("span", { children: "Bridge" }),
        "Work"
      ] }),
      /* @__PURE__ */ jsx("p", { children: mode === "signup" ? "Create your account" : "Welcome back" })
    ] }),
    error && /* @__PURE__ */ jsx("div", { style: { padding: "0.6rem", background: "rgba(239,68,68,0.1)", color: "var(--red)", borderRadius: "0.5rem", fontSize: "0.85rem", marginBottom: "1rem" }, children: error }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
      mode === "signup" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "role-selector", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: `role-btn ${role === "worker" ? "active" : ""}`, onClick: () => setRole("worker"), children: "I'm a Worker" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: `role-btn ${role === "business" ? "active" : ""}`, onClick: () => setRole("business"), children: "I'm a Business" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
          /* @__PURE__ */ jsx("label", { children: "Username" }),
          /* @__PURE__ */ jsx("input", { value: username, onChange: (e) => setUsername(e.target.value), placeholder: "Pick a username" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Email" }),
        /* @__PURE__ */ jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "your@email.com", required: true })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Password" }),
        /* @__PURE__ */ jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, minLength: 6 })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "btn btn-green btn-block", disabled: loading, children: loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Log In" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "auth-divider", children: "or" }),
    /* @__PURE__ */ jsxs("button", { type: "button", className: "btn btn-google btn-block", onClick: handleGoogleSignIn, disabled: loading, children: [
      /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 18 18", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsx("path", { fill: "#4285F4", d: "M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z" }),
        /* @__PURE__ */ jsx("path", { fill: "#34A853", d: "M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z" }),
        /* @__PURE__ */ jsx("path", { fill: "#FBBC05", d: "M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33z" }),
        /* @__PURE__ */ jsx("path", { fill: "#EA4335", d: "M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" })
      ] }),
      "Continue with Google"
    ] }),
    /* @__PURE__ */ jsx("div", { className: "auth-toggle", children: mode === "login" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      "Don't have an account? ",
      /* @__PURE__ */ jsx("a", { onClick: () => setMode("signup"), children: "Sign up" })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      "Already have an account? ",
      /* @__PURE__ */ jsx("a", { onClick: () => setMode("login"), children: "Log in" })
    ] }) })
  ] }) });
}
function PostJobForm({ user, onClose, onPosted }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pay, setPay] = useState("");
  const [address, setAddress] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const handlePost = async () => {
    if (!title || !description || !pay || !address) {
      setError("Fill in the title, description, pay, and address.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const geo = await geocodeAddress(address);
      if (!geo) {
        setError("Could not find that address. Try being more specific.");
        setSaving(false);
        return;
      }
      const { error: insertErr } = await supabase.from("jobs").insert({
        title,
        description,
        pay: parseFloat(pay),
        address: geo.place_name || address,
        lat: geo.lat,
        lng: geo.lng,
        status: "open",
        posted_by: user.id,
        timeframe
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
  const handleSendToBridgeWork = async () => {
    if (!title || !description || !address) {
      setError("Fill in the title, description, and address.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const profileName = user?.user_metadata?.username || user?.email?.split("@")[0] || "Unknown";
      const { error: insertErr } = await supabase.from("private_help_requests").insert({
        requested_by: user.id,
        establishment_name: profileName,
        title,
        description,
        address,
        timeframe,
        category: "task_post_request",
        status: "pending"
      });
      if (insertErr) throw insertErr;
      setSuccess("Request sent! BridgeWork will review and post this task from our account.");
      setTimeout(() => onClose(), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "page-panel", children: [
    /* @__PURE__ */ jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ jsx("button", { className: "back-btn", onClick: onClose, children: "\u2190" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { children: "Post a Task" }),
        /* @__PURE__ */ jsx("p", { children: "Workers nearby will see it on the map" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "page-body", children: [
      error && /* @__PURE__ */ jsx("div", { style: { padding: "0.6rem", background: "rgba(239,68,68,0.1)", color: "var(--red)", borderRadius: "0.5rem", fontSize: "0.85rem", marginBottom: "1rem" }, children: error }),
      success && /* @__PURE__ */ jsx("div", { style: { padding: "0.75rem", background: "rgba(34,197,94,0.1)", color: "#22c55e", borderRadius: "0.5rem", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: 600, textAlign: "center" }, children: success }),
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Task Title" }),
        /* @__PURE__ */ jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. Help unload delivery truck" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Description" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: description,
            onChange: (e) => setDescription(e.target.value),
            placeholder: "What does the worker need to do? How long will it take?",
            style: { minHeight: "100px" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Pay (cash)" }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.25rem" }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontWeight: 800, fontSize: "1.1rem" }, children: "$" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: pay,
              onChange: (e) => setPay(e.target.value),
              placeholder: "50",
              style: { maxWidth: "140px" }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Address" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: address,
            onChange: (e) => setAddress(e.target.value),
            placeholder: "e.g. 123 Main St, Minneapolis, MN"
          }
        ),
        /* @__PURE__ */ jsx("small", { style: { color: "var(--text-dim)", fontSize: "0.75rem" }, children: "This gets placed on the map so workers can find it" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Timeframe (optional)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: timeframe,
            onChange: (e) => setTimeframe(e.target.value),
            placeholder: "e.g. This week, ASAP, Flexible"
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "btn btn-green btn-block",
          onClick: handlePost,
          disabled: saving,
          style: { marginBottom: "0.75rem" },
          children: saving ? "Posting..." : "Post Task"
        }
      ),
      /* @__PURE__ */ jsxs("div", { style: { position: "relative", textAlign: "center", margin: "0.5rem 0" }, children: [
        /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: "50%", left: 0, right: 0, borderTop: "1px solid var(--border)" } }),
        /* @__PURE__ */ jsx("span", { style: { position: "relative", background: "var(--bg)", padding: "0 0.75rem", fontSize: "0.8rem", color: "var(--text-dim)" }, children: "or" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem", marginTop: "0.5rem" }, children: [
        /* @__PURE__ */ jsxs("p", { style: { fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem", lineHeight: 1.5 }, children: [
          "Want us to post this from the official ",
          /* @__PURE__ */ jsx("strong", { children: "BridgeWork" }),
          " account? We'll set the pay amount and handle the posting for you."
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn btn-block",
            onClick: handleSendToBridgeWork,
            disabled: saving,
            style: { width: "100%", padding: "0.7rem", borderRadius: "0.75rem", border: "1px solid var(--green)", background: "transparent", color: "var(--green)", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" },
            children: saving ? "Sending..." : "Have BridgeWork Post This"
          }
        )
      ] })
    ] })
  ] });
}
function JobDetail({ job, user, onClose, onClaim }) {
  const [claiming, setClaiming] = useState(false);
  const role = user?.user_metadata?.role || "worker";
  const isOwner = job.posted_by === user?.id;
  const isClaimed = job.status === "claimed" || job.status === "done";
  const handleClaim = async () => {
    setClaiming(true);
    const { error } = await supabase.from("jobs").update({ status: "claimed", claimed_by: user.id, claimed_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", job.id).eq("status", "open");
    if (!error) {
      onClaim && onClaim();
    }
    setClaiming(false);
  };
  const handleComplete = async () => {
    await supabase.from("jobs").update({ status: "done", completed_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", job.id);
    onClaim && onClaim();
  };
  return /* @__PURE__ */ jsxs("div", { className: "bottom-sheet open", children: [
    /* @__PURE__ */ jsx("div", { className: "sheet-handle" }),
    /* @__PURE__ */ jsxs("div", { className: "job-card", children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "job-title", children: job.title }),
          /* @__PURE__ */ jsxs("div", { className: "job-pay", children: [
            "$",
            job.pay
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, style: { background: "none", border: "none", fontSize: "1.2rem", color: "var(--text-dim)", cursor: "pointer" }, children: "\u2715" })
      ] }),
      job.description && /* @__PURE__ */ jsx("div", { className: "job-desc", children: job.description }),
      /* @__PURE__ */ jsxs("div", { className: "job-meta", children: [
        /* @__PURE__ */ jsxs("a", { href: `https://maps.apple.com/?daddr=${encodeURIComponent(job.address)}`, target: "_blank", rel: "noopener noreferrer", style: { color: "var(--green)", textDecoration: "underline" }, children: [
          "\u{1F4CD} ",
          job.address
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          "\u{1F550} ",
          new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("span", { className: `job-status status-${job.status}`, children: job.status }),
      role === "worker" && job.status === "open" && !isOwner && /* @__PURE__ */ jsx(
        "button",
        {
          className: "btn btn-green btn-block",
          onClick: handleClaim,
          disabled: claiming,
          style: { marginTop: "1rem" },
          children: claiming ? "Claiming..." : "Claim This Task"
        }
      ),
      isOwner && job.status === "claimed" && /* @__PURE__ */ jsx("button", { className: "btn btn-green btn-block", onClick: handleComplete, style: { marginTop: "1rem" }, children: "Mark as Complete" }),
      job.status === "claimed" && job.claimed_by === user?.id && /* @__PURE__ */ jsx("div", { style: { marginTop: "1rem", padding: "0.75rem", background: "rgba(45,106,79,0.08)", borderRadius: "0.75rem", fontSize: "0.85rem", color: "var(--green)", fontWeight: 600, textAlign: "center" }, children: "You claimed this task! Head to the location." })
    ] })
  ] });
}
function ProfilePage({ user, onClose }) {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(true);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const role = user?.user_metadata?.role || "worker";
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "User";
  useEffect(() => {
    loadData();
    setEditName(user?.user_metadata?.username || user?.email?.split("@")[0] || "");
    setEditEmail(user?.email || "");
    setEditPhone(user?.user_metadata?.phone || "");
  }, []);
  const loadData = async () => {
    if (role === "worker") {
      const { data: done } = await supabase.from("jobs").select("id, pay").eq("claimed_by", user.id).eq("status", "done");
      const { data: missed } = await supabase.from("jobs").select("id").eq("claimed_by", user.id).eq("status", "reported");
      const earned = (done || []).reduce((sum, j) => sum + (j.pay || 0), 0);
      setProfile({ done: (done || []).length, missed: (missed || []).length, earned });
      const { data: history } = await supabase.from("jobs").select("*").eq("claimed_by", user.id).order("created_at", { ascending: false }).limit(20);
      setJobs(history || []);
    } else {
      const { data: posted } = await supabase.from("jobs").select("*").eq("posted_by", user.id).order("created_at", { ascending: false }).limit(20);
      setJobs(posted || []);
      const open = (posted || []).filter((j) => j.status === "open").length;
      const active = (posted || []).filter((j) => j.status === "claimed").length;
      const completed = (posted || []).filter((j) => j.status === "done").length;
      setProfile({ open, active, completed });
    }
    setLoading(false);
  };
  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      if (editName && editName !== username) {
        await supabase.from("profiles").update({ username: editName }).eq("id", user.id);
        await supabase.auth.updateUser({ data: { username: editName } });
      }
      if (editEmail && editEmail !== user.email) {
        const { error } = await supabase.auth.updateUser({ email: editEmail });
        if (error) {
          setSaveMsg("Email update failed: " + error.message);
          setSaving(false);
          return;
        }
      }
      if (editPhone !== (user?.user_metadata?.phone || "")) {
        await supabase.auth.updateUser({ data: { phone: editPhone } });
      }
      if (newPassword) {
        if (newPassword.length < 6) {
          setSaveMsg("Password must be at least 6 characters");
          setSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setSaveMsg("Passwords do not match");
          setSaving(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setSaveMsg("Password update failed: " + error.message);
          setSaving(false);
          return;
        }
        setNewPassword("");
        setConfirmPassword("");
      }
      setSaveMsg("Profile updated!");
      setEditing(false);
      setTimeout(() => setSaveMsg(""), 3e3);
    } catch (e) {
      setSaveMsg("Something went wrong");
    }
    setSaving(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "page-panel", children: [
    /* @__PURE__ */ jsxs("div", { className: "profile-header", style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ jsx("button", { className: "back-btn", onClick: onClose, children: "\u2190" }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: "0.85rem", fontWeight: 600, opacity: 0.75 }, children: "Map" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "profile-header", children: [
      /* @__PURE__ */ jsx("div", { className: "profile-avatar", children: (editing ? editName : username)[0]?.toUpperCase() }),
      /* @__PURE__ */ jsx("div", { className: "profile-name", children: editing ? editName : username }),
      /* @__PURE__ */ jsx("div", { className: "profile-badge", children: role }),
      /* @__PURE__ */ jsx("div", { className: "profile-email", children: user.email })
    ] }),
    !loading && profile && /* @__PURE__ */ jsx("div", { className: "stats-row", children: role === "worker" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "stat-item", children: [
        /* @__PURE__ */ jsx("div", { className: "stat-num", children: profile.done }),
        /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Done" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "stat-item", children: [
        /* @__PURE__ */ jsx("div", { className: "stat-num", children: profile.missed }),
        /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Missed" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "stat-item", children: [
        /* @__PURE__ */ jsxs("div", { className: "stat-num", style: { color: "var(--green)" }, children: [
          "$",
          profile.earned
        ] }),
        /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Earned" })
      ] })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "stat-item", children: [
        /* @__PURE__ */ jsx("div", { className: "stat-num", children: profile.open }),
        /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Open" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "stat-item", children: [
        /* @__PURE__ */ jsx("div", { className: "stat-num", children: profile.active }),
        /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Active" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "stat-item", children: [
        /* @__PURE__ */ jsx("div", { className: "stat-num", children: profile.completed }),
        /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Completed" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { style: { padding: "0 1.25rem 1rem" }, children: !editing ? /* @__PURE__ */ jsx(
      "button",
      {
        className: "btn btn-primary btn-block",
        onClick: () => setEditing(true),
        style: { background: "#22c55e", color: "#fff", border: "none", padding: "0.75rem", borderRadius: "0.75rem", fontWeight: 700, cursor: "pointer", width: "100%", fontSize: "0.9rem" },
        children: "Edit Profile"
      }
    ) : /* @__PURE__ */ jsxs("div", { className: "card", style: { padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }, children: [
      /* @__PURE__ */ jsx("h3", { style: { fontWeight: 700, marginBottom: "0.25rem", fontSize: "1rem" }, children: "Edit Profile" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: { fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem", display: "block", color: "var(--text-muted)" }, children: "Username" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: editName,
            onChange: (e) => setEditName(e.target.value),
            placeholder: "Your name",
            style: { width: "100%", padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.9rem", boxSizing: "border-box" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: { fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem", display: "block", color: "var(--text-muted)" }, children: "Email" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            value: editEmail,
            onChange: (e) => setEditEmail(e.target.value),
            placeholder: "your@email.com",
            style: { width: "100%", padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.9rem", boxSizing: "border-box" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: { fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem", display: "block", color: "var(--text-muted)" }, children: "Phone (optional)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "tel",
            value: editPhone,
            onChange: (e) => setEditPhone(e.target.value),
            placeholder: "(612) 555-1234",
            style: { width: "100%", padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.9rem", boxSizing: "border-box" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.25rem" }, children: [
        /* @__PURE__ */ jsx("label", { style: { fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem", display: "block", color: "var(--text-muted)" }, children: "New Password" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "password",
            value: newPassword,
            onChange: (e) => setNewPassword(e.target.value),
            placeholder: "Leave blank to keep current",
            style: { width: "100%", padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.9rem", boxSizing: "border-box" }
          }
        )
      ] }),
      newPassword && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: { fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem", display: "block", color: "var(--text-muted)" }, children: "Confirm Password" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "password",
            value: confirmPassword,
            onChange: (e) => setConfirmPassword(e.target.value),
            placeholder: "Confirm new password",
            style: { width: "100%", padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.9rem", boxSizing: "border-box" }
          }
        )
      ] }),
      saveMsg && /* @__PURE__ */ jsx("div", { style: {
        fontSize: "0.85rem",
        fontWeight: 600,
        textAlign: "center",
        padding: "0.5rem",
        borderRadius: "0.5rem",
        color: saveMsg.includes("updated") ? "var(--green)" : "#e74c3c",
        background: saveMsg.includes("updated") ? "rgba(76,175,80,0.1)" : "rgba(231,76,60,0.1)"
      }, children: saveMsg }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "0.5rem" }, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setEditing(false);
              setSaveMsg("");
            },
            disabled: saving,
            style: { flex: 1, padding: "0.7rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" },
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSaveProfile,
            disabled: saving,
            style: { flex: 1, padding: "0.7rem", borderRadius: "0.75rem", border: "none", background: "#22c55e", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", opacity: saving ? 0.6 : 1 },
            children: saving ? "Saving..." : "Save Changes"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { style: { padding: "0 1.25rem 1rem" }, children: [
      /* @__PURE__ */ jsx("h3", { style: { fontWeight: 700, marginBottom: "1rem" }, children: role === "worker" ? "Job History" : "Your Posted Tasks" }),
      jobs.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "card", style: { padding: "2rem", textAlign: "center", color: "var(--text-dim)" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "2rem", marginBottom: "0.5rem" }, children: "\u{1F3AF}" }),
        role === "worker" ? "No completed jobs yet" : "No posted tasks yet",
        /* @__PURE__ */ jsx("div", { style: { fontSize: "0.8rem", marginTop: "0.25rem" }, children: role === "worker" ? "Find a job on the map to get started" : "Post your first task to get workers" })
      ] }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.75rem" }, children: jobs.map((j) => /* @__PURE__ */ jsx("div", { className: "card", style: { padding: "1rem" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: "0.9rem" }, children: j.title }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: "0.8rem", color: "var(--text-muted)" }, children: j.address })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { fontWeight: 800, color: "var(--green)" }, children: [
            "$",
            j.pay
          ] }),
          /* @__PURE__ */ jsx("span", { className: `job-status status-${j.status}`, children: j.status })
        ] })
      ] }) }, j.id)) })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { padding: "0 1.25rem 2rem" }, children: /* @__PURE__ */ jsx("button", { className: "btn btn-outline btn-block", onClick: async () => {
      await supabase.auth.signOut();
      window.location.reload();
    }, children: "Log Out" }) })
  ] });
}
function ContactPage({ onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const handleSend = async () => {
    if (!name || !email || !message) return;
    await supabase.from("contact_messages").insert({ name, email, message });
    setSent(true);
  };
  return /* @__PURE__ */ jsxs("div", { className: "page-panel", children: [
    /* @__PURE__ */ jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ jsx("button", { className: "back-btn", onClick: onClose, children: "\u2190" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { children: "Get in touch" }),
        /* @__PURE__ */ jsx("p", { children: "Real humans read every message. Usually me." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "page-body", children: sent ? /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "3rem 1rem" }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: "3rem", marginBottom: "1rem" }, children: "\u2713" }),
      /* @__PURE__ */ jsx("h3", { children: "Message Sent!" }),
      /* @__PURE__ */ jsx("p", { style: { color: "var(--text-muted)" }, children: "We'll get back to you soon." })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Name" }),
        /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Your name" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Email" }),
        /* @__PURE__ */ jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "your@email.com" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Message" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: message,
            onChange: (e) => setMessage(e.target.value),
            placeholder: "Report a missing spot, suggest a feature, or just say hi",
            style: { minHeight: "140px" }
          }
        )
      ] }),
      /* @__PURE__ */ jsx("button", { className: "btn btn-blue btn-block", onClick: handleSend, children: "\u2708 Send Message" })
    ] }) })
  ] });
}
function AdminPanel({ user, onClose }) {
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifTarget, setNotifTarget] = useState("everyone");
  const [notifMsg, setNotifMsg] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [payAmounts, setPayAmounts] = useState({});
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    const { data: j } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    setJobs(j || []);
    const { data: reqs } = await supabase.from("private_help_requests").select("*").eq("status", "pending").order("created_at", { ascending: false });
    setPendingRequests(reqs || []);
  };
  const approveRequest = async (req) => {
    const payAmount = parseFloat(payAmounts[req.id]);
    if (!payAmount || payAmount <= 0) {
      alert("Set a pay amount first");
      return;
    }
    try {
      const geo = await geocodeAddress(req.address || "");
      const { error: jobErr } = await supabase.from("jobs").insert({
        title: req.title,
        description: req.description,
        pay: payAmount,
        address: req.address || "Address TBD",
        lat: geo?.lat || null,
        lng: geo?.lng || null,
        status: "open",
        posted_by: user.id,
        timeframe: req.timeframe
      });
      if (jobErr) throw jobErr;
      await supabase.from("private_help_requests").update({
        status: "approved",
        admin_notes: `Posted by BridgeWork at $${payAmount}`,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.id);
      loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };
  const rejectRequest = async (req) => {
    await supabase.from("private_help_requests").update({ status: "rejected", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.id);
    loadData();
  };
  const openCount = jobs.filter((j) => j.status === "open").length;
  const activeCount = jobs.filter((j) => j.status === "claimed").length;
  const reportedCount = jobs.filter((j) => j.status === "reported").length;
  const sendNotification = async () => {
    if (!notifMsg.trim()) return;
    await supabase.from("notifications").insert({
      type: "broadcast",
      target: notifTarget,
      title: "Announcement",
      message: notifMsg,
      sent_by: user.id
    });
    setNotifMsg("");
    alert("Notification sent!");
  };
  const filteredJobs = jobs.filter((j) => {
    if (search) {
      const s = search.toLowerCase();
      return j.title?.toLowerCase().includes(s) || j.address?.toLowerCase().includes(s);
    }
    return true;
  });
  return /* @__PURE__ */ jsxs("div", { className: "page-panel", children: [
    /* @__PURE__ */ jsxs("div", { style: { background: "var(--green-dark)", color: "#fff", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.75rem" }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: "1.2rem" }, children: "\u2699" }),
        /* @__PURE__ */ jsx("h2", { style: { fontSize: "1.1rem", fontWeight: 700 }, children: "Admin Panel" })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "0.5rem" }, children: /* @__PURE__ */ jsx("button", { className: "back-btn", onClick: onClose, children: "Map" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-stats", children: [
      /* @__PURE__ */ jsxs("div", { className: "admin-stat", children: [
        /* @__PURE__ */ jsx("div", { className: "admin-stat-num", children: openCount }),
        /* @__PURE__ */ jsx("div", { className: "admin-stat-label", children: "Open" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-stat", children: [
        /* @__PURE__ */ jsx("div", { className: "admin-stat-num", children: activeCount }),
        /* @__PURE__ */ jsx("div", { className: "admin-stat-label", children: "Active" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-stat", children: [
        /* @__PURE__ */ jsx("div", { className: "admin-stat-num", children: reportedCount }),
        /* @__PURE__ */ jsx("div", { className: "admin-stat-label", children: "Reported" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-stat", children: [
        /* @__PURE__ */ jsx("div", { className: "admin-stat-num", style: { color: pendingRequests.length > 0 ? "#ef4444" : void 0 }, children: pendingRequests.length }),
        /* @__PURE__ */ jsx("div", { className: "admin-stat-label", children: "Pending" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "card", style: { margin: "1rem", padding: "1rem" }, children: [
      /* @__PURE__ */ jsx("h4", { style: { fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }, children: "\u{1F514} Broadcast Notification" }),
      /* @__PURE__ */ jsx("div", { className: "notif-bar", children: ["everyone", "workers", "businesses"].map((t) => /* @__PURE__ */ jsx(
        "button",
        {
          className: `role-btn ${notifTarget === t ? "active" : ""}`,
          onClick: () => setNotifTarget(t),
          style: { textTransform: "capitalize" },
          children: t === "everyone" ? "Everyone" : t === "workers" ? "Workers only" : "Businesses only"
        },
        t
      )) }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          value: notifMsg,
          onChange: (e) => setNotifMsg(e.target.value),
          placeholder: "Type your message...",
          style: { minHeight: "80px", marginBottom: "0.75rem" }
        }
      ),
      /* @__PURE__ */ jsx("button", { className: "btn btn-blue btn-block", onClick: sendNotification, children: "Send Notification" })
    ] }),
    pendingRequests.length > 0 && /* @__PURE__ */ jsxs("div", { className: "card", style: { margin: "1rem", padding: "1rem" }, children: [
      /* @__PURE__ */ jsxs("h4", { style: { fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
        "\u{1F4CB} Pending Task Requests",
        /* @__PURE__ */ jsx("span", { style: { background: "#ef4444", color: "#fff", borderRadius: "1rem", padding: "0.1rem 0.5rem", fontSize: "0.75rem", fontWeight: 800 }, children: pendingRequests.length })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.75rem" }, children: pendingRequests.map((req) => /* @__PURE__ */ jsxs("div", { style: { border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: "0.95rem" }, children: req.title }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: "0.8rem", color: "var(--text-muted)" }, children: [
              "From: ",
              req.establishment_name
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: "0.7rem", color: "var(--text-dim)" }, children: new Date(req.created_at).toLocaleDateString() })
        ] }),
        req.description && /* @__PURE__ */ jsx("p", { style: { fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }, children: req.description }),
        req.address && /* @__PURE__ */ jsxs("div", { style: { fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }, children: [
          "\u{1F4CD} ",
          req.address
        ] }),
        req.timeframe && /* @__PURE__ */ jsxs("div", { style: { fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }, children: [
          "\u23F0 ",
          req.timeframe
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontWeight: 800, fontSize: "1rem" }, children: "$" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              placeholder: "Set pay",
              value: payAmounts[req.id] || "",
              onChange: (e) => setPayAmounts((prev) => ({ ...prev, [req.id]: e.target.value })),
              style: { width: "80px", padding: "0.4rem 0.5rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.9rem" }
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => approveRequest(req),
              style: { flex: 1, padding: "0.5rem", borderRadius: "0.5rem", border: "none", background: "#22c55e", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" },
              children: "Post as BridgeWork"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => rejectRequest(req),
              style: { padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem" },
              children: "\u2715"
            }
          )
        ] })
      ] }, req.id)) })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { padding: "0 1rem" }, children: /* @__PURE__ */ jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search jobs, users..." }) }),
    /* @__PURE__ */ jsxs("div", { className: "admin-tabs", style: { marginTop: "0.75rem" }, children: [
      /* @__PURE__ */ jsxs("button", { className: `admin-tab ${tab === "jobs" ? "active" : ""}`, onClick: () => setTab("jobs"), children: [
        "Jobs (",
        jobs.length,
        ")"
      ] }),
      /* @__PURE__ */ jsx("button", { className: `admin-tab ${tab === "map" ? "active" : ""}`, onClick: () => setTab("map"), children: "Map" })
    ] }),
    tab === "jobs" && /* @__PURE__ */ jsx("div", { style: { padding: "0.75rem 1rem" }, children: filteredJobs.length === 0 ? /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "2rem", color: "var(--text-dim)" }, children: "No jobs yet" }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: filteredJobs.map((j) => /* @__PURE__ */ jsx("div", { className: "card", style: { padding: "0.85rem" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: "0.9rem" }, children: j.title }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "0.75rem", color: "var(--text-muted)" }, children: j.address })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { fontWeight: 800, color: "var(--green)" }, children: [
          "$",
          j.pay
        ] }),
        /* @__PURE__ */ jsx("span", { className: `job-status status-${j.status}`, children: j.status })
      ] })
    ] }) }, j.id)) }) }),
    tab === "map" && /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: "2rem", color: "var(--text-dim)" }, children: "Close admin to view the map" })
  ] });
}
function MapView({ user, onAuth }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const role = user?.user_metadata?.role || "worker";
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "User";
  const loadJobs = useCallback(async () => {
    const { data } = await supabase.from("jobs").select("*").in("status", ["open", "claimed"]).order("created_at", { ascending: false });
    setJobs(data || []);
  }, []);
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-93.265, 44.977],
      // Minneapolis default
      zoom: 11
    });
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.current.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13 });
        },
        () => {
        },
        { enableHighAccuracy: true }
      );
    }
    loadJobs();
    const interval = setInterval(loadJobs, 3e4);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!map.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    jobs.forEach((job) => {
      if (!job.lat || !job.lng) return;
      const color = job.status === "open" ? "#22c55e" : "#f0ad4e";
      const el = document.createElement("div");
      el.style.cssText = `width:28px;height:28px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;`;
      const marker = new mapboxgl.Marker(el).setLngLat([job.lng, job.lat]).addTo(map.current);
      el.addEventListener("click", () => {
        map.current.flyTo({ center: [job.lng, job.lat], zoom: 14 });
        if (!user) {
          setShowSignupPrompt(true);
        } else {
          setSelectedJob(job);
        }
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
      () => alert("Could not get your location")
    );
  };
  const openCount = jobs.filter((j) => j.status === "open").length;
  return /* @__PURE__ */ jsxs("div", { style: { position: "relative", width: "100%", height: "100%" }, children: [
    /* @__PURE__ */ jsx("div", { ref: mapContainer, style: { width: "100%", height: "100%" } }),
    /* @__PURE__ */ jsxs("div", { className: "top-bar", children: [
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "0.5rem" }, children: user ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("button", { className: "top-btn", onClick: () => setPage("profile"), children: username[0]?.toUpperCase() }),
        /* @__PURE__ */ jsx("button", { className: "top-btn", onClick: () => setMenuOpen(true), children: "\u2630" })
      ] }) : /* @__PURE__ */ jsx(
        "button",
        {
          className: "top-btn",
          onClick: () => setPage("auth"),
          style: { fontSize: "0.75rem", padding: "0.4rem 0.75rem", background: "var(--green)", color: "#fff", borderRadius: "1rem", fontWeight: 700 },
          children: "Sign Up"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "top-banner", children: [
        /* @__PURE__ */ jsx("div", { className: `dot ${openCount > 0 ? "dot-green" : "dot-yellow"}` }),
        openCount,
        " Cash Opportunit",
        openCount !== 1 ? "ies" : "y",
        " Near You Right Now"
      ] }),
      /* @__PURE__ */ jsx("button", { className: "top-btn", onClick: loadJobs, children: "\u21BB" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "map-legend", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("div", { className: "dot dot-green" }),
        " Now"
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("div", { className: "dot dot-yellow" }),
        " Claimed"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "map-actions", children: [
      /* @__PURE__ */ jsx("button", { className: "top-btn", onClick: locateMe, children: "\u2295" }),
      user && (role === "business" || user?.email === ADMIN_EMAIL) && /* @__PURE__ */ jsx(
        "button",
        {
          className: "top-btn",
          style: { background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: "1.5rem" },
          onClick: () => setPage("post"),
          children: "+"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: `sidebar-overlay ${menuOpen ? "open" : ""}`, onClick: () => setMenuOpen(false), children: /* @__PURE__ */ jsxs("div", { className: "sidebar", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("div", { className: "sidebar-header", onClick: () => {
        setMenuOpen(false);
        setPage("profile");
      }, style: { cursor: "pointer" }, children: [
        /* @__PURE__ */ jsx("div", { className: "sidebar-avatar", children: username[0]?.toUpperCase() }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "sidebar-name", children: username }),
          /* @__PURE__ */ jsx("div", { className: "sidebar-role", children: role })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { marginLeft: "auto", fontSize: "0.75rem", opacity: 0.5 }, children: "Edit \u2192" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sidebar-links", children: [
        (role === "business" || user?.email === ADMIN_EMAIL) && /* @__PURE__ */ jsx("button", { className: "sidebar-link", onClick: () => {
          setMenuOpen(false);
          setPage("post");
        }, children: "\u2795 Post a Task" }),
        /* @__PURE__ */ jsx("div", { className: "sidebar-divider" }),
        /* @__PURE__ */ jsx("button", { className: "sidebar-link", onClick: () => {
          setMenuOpen(false);
          setPage("contact");
        }, children: "\u2709 Contact Us" }),
        user?.email === ADMIN_EMAIL && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "sidebar-divider" }),
          /* @__PURE__ */ jsx("button", { className: "sidebar-link", onClick: () => {
            setMenuOpen(false);
            setPage("admin");
          }, children: "\u2699 Admin Panel" })
        ] })
      ] })
    ] }) }),
    showSignupPrompt && !user && /* @__PURE__ */ jsx(
      "div",
      {
        style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
        onClick: () => setShowSignupPrompt(false),
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            style: { background: "var(--surface)", borderRadius: "1rem", padding: "2rem", maxWidth: "340px", width: "90%", textAlign: "center" },
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: "2rem", marginBottom: "0.5rem" }, children: "\u{1F4BC}" }),
              /* @__PURE__ */ jsx("h3", { style: { fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem" }, children: "Sign up to see task details" }),
              /* @__PURE__ */ jsx("p", { style: { color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.25rem", lineHeight: 1.5 }, children: "Create a free account to view task details, claim jobs, and start earning cash." }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    setShowSignupPrompt(false);
                    setPage("auth");
                  },
                  style: { width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "none", background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", marginBottom: "0.5rem" },
                  children: "Sign Up Free"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setShowSignupPrompt(false),
                  style: { width: "100%", padding: "0.5rem", borderRadius: "0.75rem", border: "none", background: "#333", color: "#fff", fontSize: "0.85rem", cursor: "pointer" },
                  children: "Maybe later"
                }
              )
            ]
          }
        )
      }
    ),
    selectedJob && user && /* @__PURE__ */ jsx(
      JobDetail,
      {
        job: selectedJob,
        user,
        onClose: () => setSelectedJob(null),
        onClaim: () => {
          setSelectedJob(null);
          loadJobs();
        }
      }
    ),
    page === "auth" && !user && /* @__PURE__ */ jsxs("div", { className: "page-panel", children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem" }, children: [
        /* @__PURE__ */ jsx("button", { className: "back-btn", onClick: () => setPage(null), children: "\u2190" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: "0.85rem", fontWeight: 600, opacity: 0.75 }, children: "Map" })
      ] }),
      /* @__PURE__ */ jsx(AuthForm, { onAuth: (u) => {
        onAuth(u);
        setPage(null);
      } })
    ] }),
    page === "profile" && user && /* @__PURE__ */ jsx(ProfilePage, { user, onClose: () => setPage(null) }),
    page === "post" && user && /* @__PURE__ */ jsx(PostJobForm, { user, onClose: () => setPage(null), onPosted: loadJobs }),
    page === "contact" && /* @__PURE__ */ jsx(ContactPage, { onClose: () => setPage(null) }),
    page === "admin" && user && /* @__PURE__ */ jsx(AdminPanel, { user, onClose: () => setPage(null) })
  ] });
}
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
      if (_event === "SIGNED_IN" && session?.user) trackLocation(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: "0.5rem" }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: "1.5rem", fontWeight: 900, color: "var(--green)" }, children: "BridgeWork" }),
      /* @__PURE__ */ jsx("div", { style: { color: "var(--text-muted)", fontSize: "0.85rem" }, children: "Loading..." })
    ] });
  }
  return /* @__PURE__ */ jsx(MapView, { user, onAuth: (u) => setUser(u) });
}
createRoot(document.getElementById("root")).render(/* @__PURE__ */ jsx(App, {}));
