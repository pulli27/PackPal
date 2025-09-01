import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";  

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // subtle mount animation hook
    containerRef.current?.classList.add("mounted");
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");

    // TODO: replace with real auth call
    setTimeout(() => {
      setStatus("success");
      // navigate to dashboard after a beat
      setTimeout(() => navigate("/dashboard"), 1200);
    }, 1500);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert("Password reset would be implemented here");
  };

  const handleSignup = (e) => {
    e.preventDefault();
    alert("Registration page would be implemented here");
  };

  const btnText =
    status === "loading" ? "Signing In..." :
    status === "success" ? "Success ✓" : "Sign In";

  const btnClass =
    "login-btn" +
    (status === "loading" ? " loading" : "") +
    (status === "success" ? " success" : "");

  return (
    <div className="login-page">
      {/* floating background */}
      <div className="bg-animation">
        <div className="floating-bag" />
        <div className="floating-bag" />
        <div className="floating-bag" />
        <div className="floating-bag" />
        <div className="floating-bag" />
        <div className="floating-bag" />
      </div>

      {/* card */}
      <div className="login-container" ref={containerRef}>
        {/* left brand panel */}
        <div className="brand-side">
          <div className="brand-bg-scroll">
            <div className="scroll-column-brand">
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1596663133071-3b3d70ab7d8e?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1570704320094-e14e45f4b9c1?w=200&h=200&fit=crop')" }} />
            </div>
            <div className="scroll-column-brand">
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&h=200&fit=crop')" }} />
            </div>
            <div className="scroll-column-brand">
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1596663133071-3b3d70ab7d8e?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1570704320094-e14e45f4b9c1?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop')" }} />
              <div className="brand-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=200&h=200&fit=crop')" }} />
            </div>
          </div>

          <div className="brand-overlay" />

          <div className="brand-content">
            <div className="brand-icon">🛍</div>
            <div className="brand-title">PackPal</div>
            <div className="brand-description">
              Where fabric meets purpose, and style meets endurance — welcome to a new era of bags.
            </div>
          </div>
        </div>

        {/* right form panel */}
        <div className="login-side">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your PackPal account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-container">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  required
                />
                <div className="input-icon">✉</div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-container">
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  required
                />
                <div className="input-icon">🔒</div>
              </div>
            </div>

            <button type="submit" className={btnClass} disabled={status==="loading"}>
              {btnText}
            </button>
          </form>

          <div className="forgot-link">
            <a href="#" onClick={handleForgotPassword}>Forgot your password?</a>
          </div>

          <div className="divider"><span>OR</span></div>

          <div className="signup-section">
            Don&apos;t have an account?{" "}
            <a href="#" onClick={handleSignup}>Create one now</a>
          </div>
        </div>
      </div>
    </div>
  );
}