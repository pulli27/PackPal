import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Createaccount.css";

export default function Createaccount() {
  // form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tos, setTos] = useState(false);

  // UI state
  const [showPwd, setShowPwd] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // validation states
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirm: false,
    tos: false,
  });

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // --- Validators ---
  const validEmail = /^\S+@\S+\.\S+$/.test(email);
  const pwdRules = {
    len: password.length >= 8,
    up: /[A-Z]/.test(password),
    low: /[a-z]/.test(password),
    num: /[0-9]/.test(password),
    sym: /[!@#$%^&*()[\]{};:'",.<>/?\\|`~\-_=+]/.test(password),
  };
  const strongPwd = Object.values(pwdRules).every(Boolean);

  const errors = {
    firstName: firstName.trim().length >= 2 ? "" : "Please enter your first name.",
    lastName: lastName.trim().length >= 2 ? "" : "Please enter your last name.",
    email: validEmail ? "" : "Enter a valid email address.",
    password: strongPwd ? "" : "Use 8+ chars, upper, lower, number, symbol.",
    confirm: confirm === password ? "" : "Passwords do not match.",
    tos: tos ? "" : "You must accept the Terms.",
  };

  const formValid = Object.values(errors).every((e) => e === "");
  const shouldShow = (f) => (touched[f] || submitted) && errors[f];

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

      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      // Try reading server response
      let text = "";
      let data = {};
      try {
        text = await res.clone().text();
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      const message =
        data?.message ||
        data?.error ||
        text ||
        `Failed: ${res.status} ${res.statusText}`;

      // Detect invalid credentials even if status is 200
      if (
        /invalid email|invalid password/i.test(message) ||
        res.status === 401 ||
        res.status === 403
      ) {
        throw new Error("Invalid email or invalid password.");
      }

      if (!res.ok) {
        throw new Error(message);
      }

      // success
      setStatus({ type: "good", msg: "Account created! Redirecting to login..." });

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setTos(false);
      setTouched({
        firstName: false,
        lastName: false,
        email: false,
        password: false,
        confirm: false,
        tos: false,
      });
      setSubmitted(false);

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

  return (
    <div className="acc page-wrap account-page">
      <div className="auth-page">
        <div className="auth-card">
          {/* Left brand panel */}
          <aside className="auth-left">
            <div className="brand-col">
              <div />
              <div className="brand-center">
                <img
                  src={`${process.env.PUBLIC_URL || ""}/new logo.png`}
                  alt="PackPal logo"
                  className="brand-logo"
                />
                <h1 className="brand-name">PackPal</h1>
                <p className="brand-copy">
                  Where fabric meets purpose, and style meets endurance — welcome
                  to a new era of bags.
                </p>
              </div>
              <div />
            </div>
          </aside>

          {/* Right form */}
          <main className="auth-right">
            <div className="form-wrap">
              <h2 className="title" aria-label="Create Account">
                {title.split("\n").map((t, i) => (
                  <span key={i} className="line">
                    {t}
                  </span>
                ))}
              </h2>
              <p className="subtitle">Sign up to your PackPal account</p>

              {/* Error banner (clearly visible) */}
              {status.msg && (
                <div
                  style={{
                    backgroundColor:
                      status.type === "bad" ? "#fdecea" : "#e9f8ee",
                    color: status.type === "bad" ? "#b71c1c" : "#0b7a2a",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    textAlign: "center",
                    marginBottom: "12px",
                    fontWeight: "600",
                  }}
                >
                  {status.msg}
                </div>
              )}

              <form onSubmit={submit} className="form" noValidate>
                <div className="grid-2">
                  <label className="field">
                    <span className="label">First Name</span>
                    <div className="input-shell">
                      <input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() =>
                          setTouched((t) => ({ ...t, firstName: true }))
                        }
                        placeholder="Enter first name"
                        autoComplete="given-name"
                      />
                    </div>
                    {shouldShow("firstName") && (
                      <small className="error">{errors.firstName}</small>
                    )}
                  </label>

                  <label className="field">
                    <span className="label">Last Name</span>
                    <div className="input-shell">
                      <input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() =>
                          setTouched((t) => ({ ...t, lastName: true }))
                        }
                        placeholder="Enter last name"
                        autoComplete="family-name"
                      />
                    </div>
                    {shouldShow("lastName") && (
                      <small className="error">{errors.lastName}</small>
                    )}
                  </label>
                </div>

                <label className="field">
                  <span className="label">Email</span>
                  <div className="input-shell">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() =>
                        setTouched((t) => ({ ...t, email: true }))
                      }
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                    <span className="right-icon" aria-hidden>
                      ✉️
                    </span>
                  </div>
                  {shouldShow("email") && (
                    <small className="error">{errors.email}</small>
                  )}
                </label>

                <label className="field">
                  <span className="label">Password</span>
                  <div className="input-shell">
                    <input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() =>
                        setTouched((t) => ({ ...t, password: true }))
                      }
                      placeholder="Enter your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                      onClick={() => setShowPwd((s) => !s)}
                    >
                      {showPwd ? "🙈" : "👁"}
                    </button>
                  </div>
                  <small className="hint">
                    Must include 8+ chars, upper, lower, number &amp; symbol.
                  </small>
                  {shouldShow("password") && (
                    <small className="error">{errors.password}</small>
                  )}
                </label>

                <label className="field">
                  <span className="label">Confirm Password</span>
                  <div className="input-shell">
                    <input
                      id="confirm"
                      type={showPwd ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onBlur={() =>
                        setTouched((t) => ({ ...t, confirm: true }))
                      }
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />
                  </div>
                  {shouldShow("confirm") && (
                    <small className="error">{errors.confirm}</small>
                  )}
                </label>

                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={tos}
                    onChange={(e) => setTos(e.target.checked)}
                    onBlur={() =>
                      setTouched((t) => ({ ...t, tos: true }))
                    }
                  />
                  <span>
                    I agree to the{" "}
                    <button
                      type="button"
                      className="link link-button"
                      onClick={() =>
                        alert("Terms of Service page coming soon")
                      }
                    >
                      Terms of Service
                    </button>{" "}
                    &&{" "}
                    <button
                      type="button"
                      className="link link-button"
                      onClick={() =>
                        alert("Privacy Policy page coming soon")
                      }
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
                {shouldShow("tos") && (
                  <small className="error">{errors.tos}</small>
                )}

                <div className="btn-row">
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={submitting}
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
    </div>
  );
}
