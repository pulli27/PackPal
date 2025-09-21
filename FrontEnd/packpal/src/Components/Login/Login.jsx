import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  // ------- login state -------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errMsg, setErrMsg] = useState("");

  // show/hide eyes
  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // ------- forgot password state -------
  // 0 = login screen, 1 = enter email, 2 = enter code, 3 = set new password
  const [forgotStep, setForgotStep] = useState(0);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMsg, setFpMsg] = useState("");

  const containerRef = useRef(null);
  const navigate = useNavigate();

  // 👉 routes
  const DEFAULT_ROUTE = "/usermanagement";
  const USER_ROUTES = {
    "pulmi.vihansa@packpal.com": { password: "Pulmi@1234", route: "/maindashboard" },
    "sanugi.silva@packpal.com":  { password: "Sanugi@1234", route: "/sanudashboard" },
    "hiruni.wijesinghe@packpal.com": { password: "Hiruni@1234", route: "/hirudashboard" },
    "sasangi.ranasingha@packpal.com": { password: "Sasangi@1234", route: "/dashboard" },
    "isumi.kumarasinghe@packpal.com": { password: "Isumi@1234", route: "/isudashboard" },
  };

  useEffect(() => {
    containerRef.current?.classList.add("mounted");
  }, []);

  // ✅ Always start with blank fields & reset UI state on mount
  useEffect(() => {
    setEmail("");
    setPassword("");
    setStatus("idle");
    setErrMsg("");
    setForgotStep(0);
    setShowPwd(false);
    setShowNewPwd(false);
  }, []);

  /* ---------------- Login submit ---------------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (status === "loading") return;
    setErrMsg("");
    setStatus("loading");

    setTimeout(() => {
      const inputEmail = email.trim().toLowerCase();

      // exact matches go to specific dashboards
      const userCfg = USER_ROUTES[inputEmail];
      if (userCfg && password === userCfg.password) {
        setStatus("success");
        setTimeout(() => navigate(userCfg.route), 600);
        return;
      }

      // otherwise: mock success to default route if both filled
      if (inputEmail && password) {
        setStatus("success");
        setTimeout(() => navigate(DEFAULT_ROUTE), 600);
      } else {
        setStatus("error");
        setErrMsg("Invalid email or password.");
        setTimeout(() => setStatus("idle"), 1200);
      }
    }, 600);
  };

  /* --------------- Forgot Password: Step 1 (send code) --------------- */
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setFpMsg("Please enter your email.");
      return;
    }
    setFpMsg("");
    setFpLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 900)); // mock
      setFpMsg(`We emailed a verification code to ${resetEmail}.`);
      setForgotStep(2);
    } catch (err) {
      setFpMsg(err.message || "Could not send code. Try again.");
    } finally {
      setFpLoading(false);
    }
  };

  /* --------------- Step 2 (verify code) --------------- */
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!resetCode) {
      setFpMsg("Enter the verification code you received.");
      return;
    }
    setFpMsg("");
    setFpLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 700)); // mock
      setFpMsg("Code verified. Please set a new password.");
      setForgotStep(3);
    } catch (err) {
      setFpMsg(err.message || "Invalid or expired code.");
    } finally {
      setFpLoading(false);
    }
  };

  /* --------------- Step 3 (set new password) --------------- */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setFpMsg("Password must be at least 6 characters.");
      return;
    }
    setFpMsg("");
    setFpLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 900)); // mock
      setFpMsg("Password updated. Redirecting to login…");
      setTimeout(() => {
        setForgotStep(0);
        setResetEmail("");
        setResetCode("");
        setNewPassword("");
        setFpMsg("");
        // ensure fields are cleared when returning
        setEmail("");
        setPassword("");
        setStatus("idle");
        setErrMsg("");
        setShowPwd(false);
        setShowNewPwd(false);
        navigate("/login");
      }, 900);
    } catch (err) {
      setFpMsg(err.message || "Could not update password. Try again.");
    } finally {
      setFpLoading(false);
    }
  };

  const btnText =
    status === "loading" ? "Signing In..." :
    status === "success" ? "Success ✓" : "Sign In";

  const btnClass =
    "login-btn" +
    (status === "loading" ? " loading" : "") +
    (status === "success" ? " success" : "") +
    (status === "error" ? " error" : "");

  return (
    <div className="login">
      <div className="login-page">
        {/* background anim */}
        <div className="bg-animation">
          <div className="floating-bag" />
          <div className="floating-bag" />
          <div className="floating-bag" />
          <div className="floating-bag" />
          <div className="floating-bag" />
          <div className="floating-bag" />
        </div>

        <div className="login-container" ref={containerRef}>
          {/* Left brand panel */}
          <div className="brand-side">
            <div className="brand-overlay" />
            <div className="brand-content">
              <img
                src="/new logo.png"
                alt="PackPal logo"
                className="brand-logo"
                width="88"
                height="88"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = document.createElement("div");
                  fallback.textContent = "🛍";
                  fallback.className = "brand-icon";
                  e.currentTarget.parentElement?.prepend(fallback);
                }}
              />
              <div className="brand-title">PackPal</div>
              <div className="brand-description">
                Where fabric meets purpose, and style meets endurance.<br/>
                welcome to a new era of bags.
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="login-side">
            {/* ---------- LOGIN SCREEN ---------- */}
            {forgotStep === 0 && (
              <>
                <div className="login-header">
                  <h2>Welcome Back</h2>
                  <p>Sign in to your PackPal account</p>
                </div>

                <form onSubmit={handleSubmit} noValidate autoComplete="off">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <div className="input-container">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="off"
                        inputMode="email"
                      />
                      <div className="input-icon" aria-hidden>✉</div>
                    </div>
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
                        required
                        autoComplete="new-password"
                      />
                      {/* 👁️ eye toggle */}
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
                  </div>

                  {status === "error" && errMsg && (
                    <div className="helper-text error">{errMsg}</div>
                  )}

                  <button type="submit" className={btnClass} disabled={status === "loading"}>
                    {btnText}
                  </button>
                </form>

                <div className="forgot-link">
                  <button
                    type="button"
                    className="link-as-btn"
                    onClick={() => {
                      setResetEmail(email || "");
                      setForgotStep(1);
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>

                <div className="divider"><span>OR</span></div>

                <div className="signup-section">
                  Don&apos;t have an account? <Link to="/createaccount">Create Account</Link>
                </div>
              </>
            )}

            {/* ---------- FORGOT: STEP 1 (EMAIL) ---------- */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendCode} className="forgot-form" noValidate autoComplete="off">
                <h2>Reset Password</h2>
                <p>Enter your registered email. We’ll send a verification code.</p>

                <div className="form-group">
                  <label htmlFor="resetEmail">Email</label>
                  <input
                    id="resetEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>

                {fpMsg && <div className="helper-text">{fpMsg}</div>}

                <div className="row-actions">
                  <button type="button" className="btn-secondary" onClick={() => setForgotStep(0)}>
                    Back
                  </button>
                  <button type="submit" className="btn-primary" disabled={fpLoading}>
                    {fpLoading ? "Sending…" : "Send Code"}
                  </button>
                </div>
              </form>
            )}

            {/* ---------- FORGOT: STEP 2 (CODE) ---------- */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyCode} className="forgot-form" noValidate autoComplete="off">
                <h2>Enter Verification Code</h2>
                <p>We sent a code to <strong>{resetEmail}</strong>.</p>

                <div className="form-group">
                  <label htmlFor="resetCode">Verification Code</label>
                  <input
                    id="resetCode"
                    type="text"
                    placeholder="6-digit code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>

                {fpMsg && <div className="helper-text">{fpMsg}</div>}

                <div className="row-actions">
                  <button type="button" className="btn-secondary" onClick={() => setForgotStep(1)}>
                    Back
                  </button>
                  <button type="submit" className="btn-primary" disabled={fpLoading}>
                    {fpLoading ? "Verifying…" : "Verify Code"}
                  </button>
                </div>
              </form>
            )}

            {/* ---------- FORGOT: STEP 3 (NEW PASSWORD) ---------- */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="forgot-form" noValidate autoComplete="off">
                <h2>Create New Password</h2>

                <div className="form-group">
                  <label htmlFor="newPass">New Password</label>
                  <div className="input-container">
                    <input
                      id="newPass"
                      type={showNewPwd ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    {/* 👁️ eye toggle for reset password */}
                    <button
                      type="button"
                      className="eye-btn"
                      aria-label={showNewPwd ? "Hide password" : "Show password"}
                      title={showNewPwd ? "Hide" : "Show"}
                      onClick={() => setShowNewPwd((v) => !v)}
                    >
                      {showNewPwd ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                {fpMsg && <div className="helper-text">{fpMsg}</div>}

                <div className="row-actions">
                  <button type="button" className="btn-secondary" onClick={() => setForgotStep(2)}>
                    Back
                  </button>
                  <button type="submit" className="btn-primary" disabled={fpLoading}>
                    {fpLoading ? "Updating…" : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
