// src/Components/Header/CustomerLogoutGate.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import LogoutHeader from "./LogoutHeader";

function isCustomerFromStorage() {
  try {
    const t = localStorage.getItem("pp:token");
    const u = JSON.parse(localStorage.getItem("pp:user") || "null");
    return !!t && !!u && String(u.role || "").toLowerCase() === "customer";
  } catch {
    return false;
  }
}

export default function CustomerLogoutGate() {
  const [show, setShow] = useState(isCustomerFromStorage());
  const loc = useLocation();

  useEffect(() => {
    const update = () => setShow(isCustomerFromStorage());
    // update on our custom events (same tab) and cross-tab updates
    window.addEventListener("pp:auth:changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("pp:auth:changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  // Hide header on auth pages if you want
  const hideOn = ["/login", "/createaccount"];
  if (hideOn.includes(loc.pathname)) return null;

  return show ? <LogoutHeader /> : null;
}
