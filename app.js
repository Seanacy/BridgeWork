// app.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var SUPABASE_URL = "https://vhuxkmwvmfdesdwkauaj.supabase.co";
var SUPABASE_KEY = "sb_publishable_PfcDD3TbyWHlRD8Jn6PcRA_kCf9jfyF";
var supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
var MAPBOX_TOKEN = window.__MAPBOX_TOKEN || "";
var ADMIN_EMAIL = "247ggtms@gmail.com";
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const handlePost = async () => {
    if (!title || !pay || !address) {
      setError("Fill in the title, pay, and address.");
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
        posted_by: user.id
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
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Task Title" }),
        /* @__PURE__ */ jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. Help unload delivery truck" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Description (optional)" }),
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
      /* @__PURE__ */ jsx("button", { className: "btn btn-green btn-block", onClick: handlePost, disabled: saving, children: saving ? "Posting..." : "Post Task" })
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
        /* @__PURE__ */ jsxs("span", { children: [
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
  const role = user?.user_metadata?.role || "worker";
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "User";
  useEffect(() => {
    loadData();
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
  return /* @__PURE__ */ jsxs("div", { className: "page-panel", children: [
    /* @__PURE__ */ jsxs("div", { className: "profile-header", style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ jsx("button", { className: "back-btn", onClick: onClose, children: "\u2190" }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: "0.85rem", fontWeight: 600, opacity: 0.75 }, children: "Map" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "profile-header", children: [
      /* @__PURE__ */ jsx("div", { className: "profile-avatar", children: username[0]?.toUpperCase() }),
      /* @__PURE__ */ jsx("div", { className: "profile-name", children: username }),
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
    /* @__PURE__ */ jsxs("div", { style: { padding: "1.25rem" }, children: [
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
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    const { data: j } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    setJobs(j || []);
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
function MapView({ user, onLogout }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(null);
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
      () => alert("Could not get your location")
    );
  };
  const openCount = jobs.filter((j) => j.status === "open").length;
  return /* @__PURE__ */ jsxs("div", { style: { position: "relative", width: "100%", height: "100%" }, children: [
    /* @__PURE__ */ jsx("div", { ref: mapContainer, style: { width: "100%", height: "100%" } }),
    /* @__PURE__ */ jsxs("div", { className: "top-bar", children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("button", { className: "top-btn", onClick: () => setPage("profile"), children: username[0]?.toUpperCase() }),
        /* @__PURE__ */ jsx("button", { className: "top-btn", onClick: () => setMenuOpen(true), children: "\u2630" })
      ] }),
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
      role === "business" && /* @__PURE__ */ jsx(
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
      /* @__PURE__ */ jsxs("div", { className: "sidebar-header", children: [
        /* @__PURE__ */ jsx("div", { className: "sidebar-avatar", children: username[0]?.toUpperCase() }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "sidebar-name", children: username }),
          /* @__PURE__ */ jsx("div", { className: "sidebar-role", children: role })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sidebar-links", children: [
        /* @__PURE__ */ jsx("button", { className: "sidebar-link", onClick: () => {
          setMenuOpen(false);
          setPage("profile");
        }, children: "\u{1F464} My Profile" }),
        role === "business" && /* @__PURE__ */ jsx("button", { className: "sidebar-link", onClick: () => {
          setMenuOpen(false);
          setPage("post");
        }, children: "\u2795 Post a Task" }),
        /* @__PURE__ */ jsx("div", { className: "sidebar-divider" }),
        /* @__PURE__ */ jsx("button", { className: "sidebar-link", onClick: () => {
          setMenuOpen(false);
          setPage("contact");
        }, children: "\u2709 Contact Us" }),
        user.email === ADMIN_EMAIL && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "sidebar-divider" }),
          /* @__PURE__ */ jsx("button", { className: "sidebar-link", onClick: () => {
            setMenuOpen(false);
            setPage("admin");
          }, children: "\u2699 Admin Panel" })
        ] })
      ] })
    ] }) }),
    selectedJob && /* @__PURE__ */ jsx(
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
    page === "profile" && /* @__PURE__ */ jsx(ProfilePage, { user, onClose: () => setPage(null) }),
    page === "post" && /* @__PURE__ */ jsx(PostJobForm, { user, onClose: () => setPage(null), onPosted: loadJobs }),
    page === "contact" && /* @__PURE__ */ jsx(ContactPage, { onClose: () => setPage(null) }),
    page === "admin" && /* @__PURE__ */ jsx(AdminPanel, { user, onClose: () => setPage(null) })
  ] });
}
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: "0.5rem" }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: "1.5rem", fontWeight: 900, color: "var(--green)" }, children: "BridgeWork" }),
      /* @__PURE__ */ jsx("div", { style: { color: "var(--text-muted)", fontSize: "0.85rem" }, children: "Loading..." })
    ] });
  }
  if (!user) {
    return /* @__PURE__ */ jsx(AuthForm, { onAuth: (u) => setUser(u) });
  }
  return /* @__PURE__ */ jsx(MapView, { user });
}
createRoot(document.getElementById("root")).render(/* @__PURE__ */ jsx(App, {}));
