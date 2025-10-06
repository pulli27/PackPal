// src/Components/Login/Login.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ui/status
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errMsg, setErrMsg] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitted, setSubmitted] = useState(false);

  const navigate = useNavigate();
  const containerRef = useRef(null);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const LOGIN_URL = `${API_BASE}/api/auth/login`;

  useEffect(() => {
    containerRef.current?.classList.add("mounted");
  }, []);

  // --- validation ---
  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const passwordValid = password.length >= 6;

  const errors = {
    email: !emailValid ? "Enter a valid email address." : "",
    password: !passwordValid ? "Password must be at least 6 characters." : "",
  };
  const formValid = Object.values(errors).every((e) => e === "");
  const shouldShow = (field) => (touched[field] || submitted) && errors[field];

  // --- submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formValid || status === "loading") {
      setStatus("error");
      setErrMsg("Please fix the highlighted fields.");
      return;
    }

    setStatus("loading");
    setErrMsg("");

    try {
      // normalize email to avoid casing issues
      const payload = {
        email: email.trim().toLowerCase(),
        password,
      };

      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // keep if you ever set httpOnly cookies; otherwise harmless
        credentials: "include",
        body: JSON.stringify(payload),
      });

      // Try to parse JSON, but don't crash UI if server returns empty body
      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok || data?.success === false) {
        // Standardize the auth error message (don’t leak which field failed)
        const msg =
          data?.message ||
          (res.status === 401
            ? "Invalid email or password."
            : `Login failed (${res.status}).`);
        throw new Error(msg);
      }

      // Expecting: { success:true, token, user, route? }
      if (data?.token) localStorage.setItem("pp:token", data.token);
      if (data?.user) localStorage.setItem("pp:user", JSON.stringify(data.user));

      setStatus("success");
      setTimeout(() => navigate(data?.route || "/maindashboard"), 600);
    } catch (err) {
      setStatus("error");
      // Network/CORS shows up as TypeError/“Failed to fetch” in many browsers
      const msg =
        err?.message === "Failed to fetch"
          ? "Cannot reach the server. Check that the backend is running and CORS allows your frontend origin."
          : err?.message || "Invalid email or password.";
      setErrMsg(msg);
    }
  };

  return (
    <div className="login">
      <div className="login-page">
        {/* background anim (optional) */}
        <div className="bg-animation">
          <div className="floating-bag" />
        </div>

        <div className="login-container" ref={containerRef}>
          {/* Left panel */}
          <div className="brand-side">
            <div className="brand-content">
              <img
                src="/new logo.png"
                alt="PackPal logo"
                className="brand-logo"
                width="88"
                height="88"
                onError={(e) => {
                  // graceful logo fallback
                  e.currentTarget.style.display = "none";
                  const fallback = document.createElement("div");
                  fallback.textContent = "🛍";
                  fallback.className = "brand-icon";
                  e.currentTarget.parentElement?.prepend(fallback);
                }}
              />
              <div className="brand-title">PackPal</div>
              <div className="brand-description">
                Where fabric meets purpose, and style meets endurance.
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="login-side">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your PackPal account</p>
            </div>

            <form onSubmit={handleSubmit} noValidate autoComplete="off">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  className={shouldShow("email") ? "invalid" : ""}
                  autoComplete="email"
                  inputMode="email"
                />
                {shouldShow("email") && (
                  <small className="error">{errors.email}</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-container">
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() =>
                      setTouched((t) => ({ ...t, password: true }))
                    }
                    className={shouldShow("password") ? "invalid" : ""}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    title={showPwd ? "Hide" : "Show"}
                    onClick={() => setShowPwd((v) => !v)}
                  >
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
                {shouldShow("password") && (
                  <small className="error">{errors.password}</small>
                )}
              </div>

              {/* Auth / server messages */}
              {status === "error" && errMsg && (
                <div className="helper-text error" role="alert">
                  {errMsg}
                </div>
              )}

              <button
                type="submit"
                className={`login-btn ${status}`}
                disabled={status === "loading"}
                aria-busy={status === "loading" ? "true" : "false"}
              >
                {status === "loading"
                  ? "Signing In..."
                  : status === "success"
                  ? "Success ✓"
                  : "Sign In"}
              </button>
            </form>

            <div className="divider"><span>OR</span></div>

            <div className="signup-section">
              Don’t have an account?{" "}
              <Link to="/createaccount">Create Account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
