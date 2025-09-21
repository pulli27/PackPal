import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(() => {
    // keep auth across refreshes
    const stored = localStorage.getItem("ppx_auth");
    return stored ? JSON.parse(stored).isAuthed : false;
  });
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("ppx_auth");
    return stored ? JSON.parse(stored).user : null;
  });

  useEffect(() => {
    localStorage.setItem("ppx_auth", JSON.stringify({ isAuthed, user }));
  }, [isAuthed, user]);

  const login = (userObj) => {
    setIsAuthed(true);
    setUser(userObj || null);
  };

  const logout = () => {
    setIsAuthed(false);
    setUser(null);
  };

  const value = useMemo(() => ({ isAuthed, user, login, logout }), [isAuthed, user]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
