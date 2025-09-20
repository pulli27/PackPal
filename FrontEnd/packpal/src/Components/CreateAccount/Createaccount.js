// src/Components/Auth/Createaccount.js
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Createaccount.css";

export default function Createaccount() {
  // form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [tos, setTos]             = useState(false);

  const [showPwd, setShowPwd]     = useState(false);
  const [status, setStatus]       = useState({ type: "", msg: "" });
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  // --- Validators ---
  const validEmail = /^\S+@\S+\.\S+$/.test(email);
  const pwdRules = {
    len: password.length >= 8,
    up:  /[A-Z]/.test(password),
    low: /[a-z]/.test(password),
    num: /[0-9]/.test(password),
    sym: /[!@#$%^&*()[\]{};:'",.<>/?\\|`~\-_=+]/.test(password),
  };
  const strongPwd = Object.values(pwdRules).every(Boolean);

  const errors = {
    firstName: firstName.trim().length >= 2 ? "" : "Please enter your first name.",
    lastName:  lastName.trim().length  >= 2 ? "" : "Please enter your last name.",
    email:     validEmail ? "" : "Enter a valid email address.",
    password:  strongPwd ? "" : "Use 8+ chars, upper, lower, number, symbol.",
    confirm:   confirm === password ? "" : "Passwords do not match.",
    tos:       tos ? "" : "You must accept the Terms.",
  };

  const formValid = Object.values(errors).every((e) => e === "");

  // API base (can be set in .env → REACT_APP_API_URL)
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // --- Submit Handler ---
  const submit = async (e) => {
    e.preventDefault();
    if (!formValid || submitting) {
      setStatus({ type: "bad", msg: "Please fix the highlighted fields." });
      return;
    }

    try {
      setSubmitting(true);
      setStatus({ type: "", msg: "" });

      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password, // server hashes it
        }),
      });

      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (!res.ok) {
        throw new Error(data?.message || `Failed: ${res.status} ${res.statusText}`);
      }

      setStatus({ type: "good", msg: "Account created! Redirecting to login..." });

      // optional reset
      setFirstName(""); setLastName(""); setEmail("");
      setPassword(""); setConfirm(""); setTos(false);

      navigate("/login");
    } catch (err) {
      const msg =
        err.message === "Failed to fetch"
          ? "Could not reach the server. Check backend and CORS settings."
          : err.message;
      setStatus({ type: "bad", msg });
    } finally {
      setSubmitting(false);
    }
  };

  const title = useMemo(() => "Create\nAccount", []);

  // --- UI ---
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Left brand panel */}
        <aside className="auth-left">
          <div className="brand-col">
            <div className="mini-grid">
              <div className="mini" /><div className="mini" />
              <div className="mini" /><div className="mini" />
            </div>

            <div className="brand-center">
              <div className="logo-dot">👜</div>
              <h1 className="brand-name">PackPal</h1>
              <p className="brand-copy">
                Where fabric meets purpose, and style meets endurance — welcome to a new era of bags.
              </p>
            </div>

            <div className="mini-grid bottom">
              <div className="mini" /><div className="mini" />
            </div>
          </div>
        </aside>

        {/* Right form */}
        <main className="auth-right">
          <div className="form-wrap">
            <h2 className="title" aria-label="Create Account">
              {title.split("\n").map((t, i) => (
                <span key={i} className="line">{t}</span>
              ))}
            </h2>
            <p className="subtitle">Sign up to your PackPal account</p>

            <form onSubmit={submit} className="form" noValidate>
              <div className="grid-2">
                <label className="field">
                  <span className="label">First Name</span>
                  <div className="input-shell">
                    <input
                      id="firstName"
                      value={firstName}
                      onChange={(e)=>setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      autoComplete="given-name"
                    />
                  </div>
                  <small className="error">{errors.firstName}</small>
                </label>

                <label className="field">
                  <span className="label">Last Name</span>
                  <div className="input-shell">
                    <input
                      id="lastName"
                      value={lastName}
                      onChange={(e)=>setLastName(e.target.value)}
                      placeholder="Enter last name"
                      autoComplete="family-name"
                    />
                  </div>
                  <small className="error">{errors.lastName}</small>
                </label>
              </div>

              <label className="field">
                <span className="label">Email</span>
                <div className="input-shell">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                  <span className="right-icon" aria-hidden>✉️</span>
                </div>
                <small className="error">{errors.email}</small>
              </label>

              <label className="field">
                <span className="label">Password</span>
                <div className="input-shell">
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    onClick={()=>setShowPwd((s)=>!s)}
                    title={showPwd ? "Hide" : "Show"}
                  >
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
                <small className="hint">
                  Must include 8+ chars, upper, lower, number & symbol.
                </small>
                <small className="error">{errors.password}</small>
              </label>

              <label className="field">
                <span className="label">Confirm Password</span>
                <div className="input-shell">
                  <input
                    id="confirm"
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e)=>setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                </div>
                <small className="error">{errors.confirm}</small>
              </label>

              <label className="checkline">
                <input
                  type="checkbox"
                  checked={tos}
                  onChange={(e)=>setTos(e.target.checked)}
                />
                <span>
                  I agree to the <a href="#" className="link">Terms of Service</a> &nbsp;&&nbsp;
                  <a href="#" className="link">Privacy Policy</a>
                </span>
              </label>
              <small className="error">{errors.tos}</small>

              {/* Buttons */}
              <div className="btn-row">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={!formValid || submitting}
                  aria-busy={submitting ? "true" : "false"}
                >
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>

              <div className={`status ${status.type}`}>{status.msg}</div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
