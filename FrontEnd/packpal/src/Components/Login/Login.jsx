import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errMsg, setErrMsg] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitted, setSubmitted] = useState(false);

  const navigate = useNavigate();
  const containerRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    containerRef.current?.classList.add("mounted");
  }, []);

  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const passwordValid = password.length >= 6;
  const errors = {
    email: !emailValid ? "Enter a valid email address." : "",
    password: !passwordValid ? "Password must be at least 6 characters." : "",
  };
  const formValid = Object.values(errors).every((e) => e === "");
  const shouldShow = (field) => (touched[field] || submitted) && errors[field];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formValid) {
      setStatus("error");
      setErrMsg("Please fix the highlighted fields.");
      return;
    }

    setStatus("loading");
    setErrMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid email or password.");
      }

      localStorage.setItem("pp:user", JSON.stringify(data.user));
      localStorage.setItem("pp:token", data.token);

      setStatus("success");
      setTimeout(() => navigate(data.route || "/maindashboard"), 600);
    } catch (err) {
      setStatus("error");
      setErrMsg(
        err.message === "Failed to fetch"
          ? "Cannot reach the server."
          : err.message
      );
    }
  };

  return (
    <div className="login">
      <div className="login-page">
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

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  className={shouldShow("email") ? "invalid" : ""}
                />
                {shouldShow("email") && (
                  <small className="error">{errors.email}</small>
                )}
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-container">
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    className={shouldShow("password") ? "invalid" : ""}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPwd((s) => !s)}
                  >
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
                {shouldShow("password") && (
                  <small className="error">{errors.password}</small>
                )}
              </div>

              {status === "error" && errMsg && (
                <div className="helper-text error">{errMsg}</div>
              )}

              <button
                type="submit"
                className={`login-btn ${status}`}
                disabled={status === "loading"}
              >
                {status === "loading"
                  ? "Signing In..."
                  : status === "success"
                  ? "Success ✓"
                  : "Sign In"}
              </button>
            </form>

            <div className="signup-section">
              Don’t have an account? <Link to="/createaccount">Create Account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
