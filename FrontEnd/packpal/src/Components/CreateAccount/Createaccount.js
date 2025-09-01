import React, { useState } from "react";
import "./Createaccount.css";

export default function CreateAccount() {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [agree,     setAgree]     = useState(false);
  const [msg,       setMsg]       = useState({ text: "", type: "" });

  return (
    <div className="bg">
      <div className="wrap">
        <aside className="brand">
          <h1>Pay Pal</h1>
          <p>Create accounts and start selling premium bags securely.</p>
        </aside>

        <main className="card">
          <h2>Create Account</h2>
          {/* form goes here */}
        </main>
      </div>
    </div>
  );
}
