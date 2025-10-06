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

  // UI state
  const [showPwd, setShowPwd]     = useState(false);
  const [status, setStatus]       = useState({ type: "", msg: "" });
  const [submitting, setSubmitting]= useState(false);
  const [submitted, setSubmitted]  = useState(false);

  // validation state
  const [touched, setTouched] = useState({
    firstName: false,
    lastName:  false,
    email:     false,
    password:  false,
    confirm:   false,
    tos:       false,
  });

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // --- Validators ---
  const validEmail = /^\S+@\S+\.\S+$/.test(email);
  const strongPwd = password.length >= 8 &&
                    /[A-Z]/.test(password) &&
                    /[a-z]/.test(password) &&
                    /[0-9]/.test(password) &&
                    /[!@#$%^&*]/.test(password);

  const errors = {
    firstName: firstName.trim().length >= 2 ? "" : "Please enter your first name.",
    lastName:  lastName.trim().length >= 2 ? "" : "Please enter your last name.",
    email:     validEmail ? "" : "Enter a valid email address.",
    password:  strongPwd ? "" : "Use 8+ chars, upper, lower, number, symbol.",
    confirm:   confirm === password ? "" : "Passwords do not match.",
    tos:       tos ? "" : "You must accept the Terms.",
  };

  const formValid = Object.values(errors).every((e) => e === "");
  const shouldShow = (field) => (touched[field] || submitted) && errors[field];

  // --- Submit Handler ---
  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formValid || submitting) {
      setStatus({ type: "bad", msg: "Please fix the highlighted fields." });
      return;
    }

    try {
      setSubmitting(true);
      setStatus({ type: "", msg: "" });

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to register.");
      }

      setStatus({ type: "good", msg: "Account created! Redirecting to login..." });
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setStatus({
        type: "bad",
        msg:
          err.message === "Failed to fetch"
            ? "Could not reach the server. Check backend and CORS."
            : err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const title = useMemo(() => "Create\nAccount", []);

  return (
    <div className="acc page-wrap account-page">
      <div className="auth-page">
        <div className="auth-card">
          <aside className="auth-left">
            <div className="brand-col">
              <div className="brand-center">
                <img
                  src={`${process.env.PUBLIC_URL}/new logo.png`}
                  alt="PackPal logo"
                  className="brand-logo"
                />
                <h1 className="brand-name">PackPal</h1>
                <p className="brand-copy">
                  Where fabric meets purpose, and style meets endurance.
                </p>
              </div>
            </div>
          </aside>

          <main className="auth-right">
            <div className="form-wrap">
              <h2 className="title">
                {title.split("\n").map((t, i) => (
                  <span key={i} className="line">{t}</span>
                ))}
              </h2>
              <p className="subtitle">Sign up to your PackPal account</p>

              <form onSubmit={submit} className="form" noValidate>
                <div className="grid-2">
                  <label className="field">
                    <span className="label">First Name</span>
                    <input
                      value={firstName}
                      onChange={(e)=>setFirstName(e.target.value)}
                      onBlur={()=>setTouched(t=>({...t, firstName:true}))}
                      placeholder="Enter first name"
                    />
                    {shouldShow("firstName") && <small className="error">{errors.firstName}</small>}
                  </label>

                  <label className="field">
                    <span className="label">Last Name</span>
                    <input
                      value={lastName}
                      onChange={(e)=>setLastName(e.target.value)}
                      onBlur={()=>setTouched(t=>({...t, lastName:true}))}
                      placeholder="Enter last name"
                    />
                    {shouldShow("lastName") && <small className="error">{errors.lastName}</small>}
                  </label>
                </div>

                <label className="field">
                  <span className="label">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                    onBlur={()=>setTouched(t=>({...t, email:true}))}
                    placeholder="Enter your email"
                  />
                  {shouldShow("email") && <small className="error">{errors.email}</small>}
                </label>

                <label className="field">
                  <span className="label">Password</span>
                  <div className="input-shell">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e)=>setPassword(e.target.value)}
                      onBlur={()=>setTouched(t=>({...t, password:true}))}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={()=>setShowPwd(s=>!s)}
                    >
                      {showPwd ? "🙈" : "👁"}
                    </button>
                  </div>
                  {shouldShow("password") && <small className="error">{errors.password}</small>}
                </label>

                <label className="field">
                  <span className="label">Confirm Password</span>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e)=>setConfirm(e.target.value)}
                    onBlur={()=>setTouched(t=>({...t, confirm:true}))}
                    placeholder="Re-enter your password"
                  />
                  {shouldShow("confirm") && <small className="error">{errors.confirm}</small>}
                </label>

                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={tos}
                    onChange={(e)=>setTos(e.target.checked)}
                    onBlur={()=>setTouched(t=>({...t, tos:true}))}
                  />
                  <span>I agree to the Terms & Privacy Policy</span>
                </label>
                {shouldShow("tos") && <small className="error">{errors.tos}</small>}

                <div className="btn-row">
                  <button type="submit" className="primary-btn" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </div>

                {status.msg && <div className={`status ${status.type}`}>{status.msg}</div>}
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
