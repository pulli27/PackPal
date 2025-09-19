// src/pages/Cart.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const STORAGE_KEY = "packPalCart";
const TX_URL = "http://localhost:5000/transactions";

const money = (n) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(
    Number(n || 0)
  );

const nowISO = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export default function Cart() {
  const [step, setStep] = useState("cart");
  const [cart, setCart] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // remove left sidebar spacing (if your layout adds it)
  useEffect(() => {
    document.body.classList.add("sidebar-off");
    return () => document.body.classList.remove("sidebar-off");
  }, []);

  // read cart helper
  const readCart = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  };

  // 1) load from localStorage
  useEffect(() => {
    setCart(readCart());
  }, []);

  // 2) if CustomerView navigated with { state: { justAdded } }, merge it
  useEffect(() => {
    const justAdded = location.state && location.state.justAdded;
    if (justAdded) {
      setCart((prev) => {
        const exists = prev.some((x) => String(x.id) === String(justAdded.id));
        const next = exists ? prev : [...prev, justAdded];
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
      // clear state so reloads don’t duplicate
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  // save back whenever cart changes (normalize)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce(
      (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );
    const tax = subtotal * 0.08;
    const shipping = subtotal > 500 ? 0 : 19.99;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  }, [cart]);

  const updateQty = (id, delta) =>
    setCart((list) =>
      list.map((it) =>
        String(it.id) === String(id)
          ? { ...it, quantity: Math.max(1, (Number(it.quantity) || 1) + delta) }
          : it
      )
    );
  const removeItem = (id) =>
    setCart((list) => list.filter((it) => String(it.id) !== String(id)));
  const clearCart = () => setCart([]);

  // payment form
  const [form, setForm] = useState({
    email: "", phone: "", firstName: "", lastName: "",
    address: "", city: "", zip: "", cardNumber: "", expiryDate: "", cvv: "", cardName: "",
  });
  const change = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onCardNumber = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, "$1 ");
    change("cardNumber", v);
  };
  const onExp = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
    change("expiryDate", v);
  };
  const onCVV = (e) =>
    change("cvv", e.target.value.replace(/\D/g, "").slice(0, 4));
  const onPhone = (e) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = "94" + digits.slice(1);
    if (!digits.startsWith("94")) digits = "94" + digits;
    digits = digits.slice(0, 11);
    const local = digits.slice(2);
    let out = "+94";
    if (local.length > 0) out += " " + local.slice(0, 2);
    if (local.length > 2) out += " " + local.slice(2, 5);
    if (local.length > 5) out += " " + local.slice(5, 9);
    change("phone", out.trim());
  };

  // === SEND TO BACKEND on Complete Payment ===
  const processPayment = async () => {
    const required = [
      "email","phone","firstName","lastName",
      "address","city","zip","cardNumber","expiryDate","cvv","cardName"
    ];
    const missing = required.filter((k) => !String(form[k] || "").trim());
    if (missing.length) { alert("Please fill in all required fields."); return; }
    if (!cart.length) { alert("Your cart is empty."); return; }

    setProcessing(true);
    setErr(""); setOk("");

    const customerName = `${form.firstName} ${form.lastName}`.trim();
    const method = "Card"; // or detect from form if you add a selector
    const date = nowISO();

    try {
      // Build payloads per line item
      const payloads = cart.map((it) => {
        const qty = Number(it.quantity || 1);
        const unit = Number(it.price || 0);
        return {
          date,
          customer: customerName || form.email,
          customerId: "",          // optional, leave blank
          fmc: false,              // not needed on Finance page
          productId: String(it.id),
          productName: it.name,
          qty,
          unitPrice: unit,
          discountPerUnit: 0,
          total: unit * qty,
          method,
          status: "Paid",          // harmless (Finance ignores status)
          notes: `Checkout: ${form.email} / ${form.phone}`,
        };
      });

      // POST all transactions
      await Promise.all(
        payloads.map((p) =>
          axios.post(TX_URL, p, { headers: { "Content-Type": "application/json" } })
        )
      );

      // let other pages refresh (Dashboard/Finance listen for this)
      window.dispatchEvent(new Event("tx:changed"));

      // clear cart + save
      setCart([]);
      try { localStorage.setItem(STORAGE_KEY, "[]"); } catch {}

      setOk("Payment successful and transactions saved.");
      setStep("success");
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Payment failed");
      alert("Payment failed: " + (e?.response?.data?.message || e.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="cart-page">
      <style>{css}</style>

      <div className="container">
        <div className="header">
          <h1>📦 PackPal</h1>
          <p>Smart Bag System - Intelligent Packing Solutions</p>
        </div>

        {step === "cart" && (
          <section className="page active">
            <h2 className="page-title">🛒 Your PackPal Cart</h2>

            {err && <div className="error" style={{ color: "#b91c1c", marginBottom: 8 }}>{err}</div>}
            {ok && <div className="ok" style={{ color: "#065f46", marginBottom: 8 }}>{ok}</div>}

            {!cart.length && (
              <div className="empty">
                <p>Your cart is empty.</p>
                <div style={{ marginTop: 12 }}>
                  <button className="btn" onClick={() => navigate("/customer")}>
                    🛍️ Browse Products
                  </button>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div id="cartItems">
                  {cart.map((item) => {
                    const media = item.img ? (
                      <img
                        src={item.img}
                        alt={item.name}
                        onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/800x600?text=Bag"; }}
                      />
                    ) : (item.icon || "🎒");
                    return (
                      <div className="cart-item" key={item.id}>
                        <div className="item-image">{media}</div>
                        <div className="item-details">
                          <div className="item-name">{item.name}</div>
                          <div className="item-description">{item.description || ""}</div>
                          <div className="item-price">{money(item.price)}</div>
                        </div>
                        <div className="quantity-controls">
                          <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                          <div className="qty-display">{item.quantity || 1}</div>
                          <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                        </div>
                        <button className="remove-btn" onClick={() => removeItem(item.id)}>Remove</button>
                      </div>
                    );
                  })}
                </div>

                <div className="cart-summary">
                  <h3>📊 PackPal Order Summary</h3>
                  <div className="summary-row"><span>Subtotal:</span><span>{money(totals.subtotal)}</span></div>
                  <div className="summary-row"><span>Tax (8%):</span><span>{money(totals.tax)}</span></div>
                  <div className="summary-row"><span>Shipping:</span><span>{totals.shipping === 0 ? "FREE" : money(totals.shipping)}</span></div>
                  <div className="summary-row total-row"><span>Total:</span><span>{money(totals.total)}</span></div>
                  <div style={{ textAlign: "center", marginTop: 20 }}>
                    <button className="btn btn-secondary" onClick={clearCart}>🧹 Clear Cart</button>
                    <button className="btn btn-success" onClick={() => cart.length && setStep("payment")}>🚀 Proceed to Payment</button>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {step === "payment" && (
          <section className="page active">
            <h2 className="page-title">💳 PackPal Payment</h2>

            {err && <div className="error" style={{ color: "#b91c1c", marginBottom: 8 }}>{err}</div>}
            {ok && <div className="ok" style={{ color: "#065f46", marginBottom: 8 }}>{ok}</div>}

            <div className="payment-form">
              {/* contact */}
              <div className="form-section">
                <h3>📧 Contact Information</h3>
                <div className="form-group">
                  <label>Email Address</label>
                  <input value={form.email} onChange={(e) => change("email", e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="form-group">
                  <label>Phone Number (Sri Lanka)</label>
                  <input value={form.phone} onChange={onPhone} placeholder="+94 71 234 5678" required />
                </div>
              </div>
              {/* address */}
              <div className="form-section">
                <h3>🚚 Shipping Address</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input value={form.firstName} onChange={(e) => change("firstName", e.target.value)} placeholder="John" required />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input value={form.lastName} onChange={(e) => change("lastName", e.target.value)} placeholder="Doe" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Street Address</label>
                  <input value={form.address} onChange={(e) => change("address", e.target.value)} placeholder="123 Main Street" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City / Town</label>
                    <input value={form.city} onChange={(e) => change("city", e.target.value)} placeholder="Colombo" required />
                  </div>
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input value={form.zip} onChange={(e) => change("zip", e.target.value)} placeholder="00100" required />
                  </div>
                </div>
              </div>
              {/* card */}
              <div className="form-section">
                <h3>💳 Payment Information</h3>
                <div className="form-group">
                  <label>Card Number</label>
                  <input value={form.cardNumber} onChange={onCardNumber} placeholder="1234 5678 9012 3456" maxLength={19} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input value={form.expiryDate} onChange={onExp} placeholder="MM/YY" maxLength={5} required />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input value={form.cvv} onChange={onCVV} placeholder="123" maxLength={4} required />
                  </div>
                  <div className="form-group">
                    <label>Name on Card</label>
                    <input value={form.cardName} onChange={(e) => change("cardName", e.target.value)} placeholder="John Doe" required />
                  </div>
                </div>
              </div>

              <div className="cart-summary">
                <h3>📊 Payment Summary</h3>
                {cart.map((it) => (
                  <div key={it.id} className="summary-row">
                    <span>{(it.img ? "🖼️" : it.icon || "🎒")}&nbsp;{it.name} (x{it.quantity || 1})</span>
                    <span>{money((Number(it.price) || 0) * (Number(it.quantity) || 1))}</span>
                  </div>
                ))}
                <div className="summary-row"><span>Subtotal:</span><span>{money(totals.subtotal)}</span></div>
                <div className="summary-row"><span>Tax (8%):</span><span>{money(totals.tax)}</span></div>
                <div className="summary-row"><span>Shipping:</span><span>{totals.shipping === 0 ? "FREE" : money(totals.shipping)}</span></div>
                <div className="summary-row total-row"><span>Total Amount:</span><span>{money(totals.total)}</span></div>
              </div>

              <div style={{ textAlign: "center", marginTop: 35 }}>
                <button className="btn btn-secondary" onClick={() => setStep("cart")} disabled={processing}>⬅️ Back to Cart</button>
                <button className="btn btn-success" onClick={processPayment} disabled={processing}>
                  {processing ? "⏳ Processing Payment..." : "🔒 Complete Payment"}
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "success" && (
          <section className="page active">
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h2>🎉 Payment Successful!</h2>
              <p style={{ fontSize: "1.3rem", color: "#4a5568", margin: "25px 0" }}>
                Thank you for choosing PackPal! Your smart bag order has been recorded.
              </p>
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button className="btn" onClick={() => navigate("/finance")}>📄 View Finance</button>
                <button className="btn" onClick={() => navigate("/customer")}>🛍️ Continue Shopping</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const css = `
* { margin:0; padding:0; box-sizing:border-box; }
body, .cart-page { font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); min-height:100vh; color:#333; }
.container{ max-width:1200px; margin:0 auto; padding:20px; }
.header{ background:rgba(255,255,255,0.95); backdrop-filter:blur(15px); padding:25px; border-radius:20px; margin-bottom:30px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.2); }
.header h1{ color:#2d3748; margin-bottom:10px; font-size:3rem; font-weight:700; background:linear-gradient(45deg,#667eea,#764ba2); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.header p{ color:#4a5568; font-size:1.2rem; font-weight:500; }
.page{ display:block; background:rgba(255,255,255,0.95); backdrop-filter:blur(15px); padding:35px; border-radius:20px; box-shadow:0 10px 40px rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.2); animation:slideIn .6s ease-out; margin-bottom:24px; }
@keyframes slideIn{ from{ opacity:0; transform:translateY(30px) scale(.98); } to{ opacity:1; transform:translateY(0) scale(1); } }
.page-title{ font-size:2.2rem; font-weight:700; color:#2d3748; margin-bottom:25px; text-align:center; background:linear-gradient(45deg,#667eea,#764ba2); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.empty{ text-align:center; padding:40px 20px; color:#4a5568; background:linear-gradient(45deg,#f8fafc,#ffffff); border:2px solid #e2e8f0; border-radius:15px; }
.cart-item{ display:flex; align-items:center; padding:25px; border:2px solid transparent; border-radius:15px; margin-bottom:20px; background:linear-gradient(45deg,#f8fafc,#ffffff); box-shadow:0 8px 25px rgba(0,0,0,0.08); transition:all .4s ease; position:relative; overflow:hidden; }
.cart-item::before{ content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent); transition:left .6s; }
.cart-item:hover{ transform:translateY(-5px); box-shadow:0 15px 35px rgba(0,0,0,0.12); border-color:#667eea; }
.cart-item:hover::before{ left:100%; }
.item-image{ width:100px; height:100px; background:linear-gradient(135deg,#667eea,#764ba2); border-radius:15px; margin-right:25px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:35px; box-shadow:0 8px 20px rgba(102,126,234,0.3); overflow:hidden; }
.item-image img{ width:100%; height:100%; object-fit:cover; display:block; border-radius:12px; }
.item-details{ flex:1; }
.item-name{ font-size:1.4rem; font-weight:700; color:#2d3748; margin-bottom:8px; }
.item-description{ color:#718096; margin-bottom:12px; font-size:1rem; line-height:1.5; }
.item-price{ font-size:1.3rem; font-weight:700; color:#38a169; background:linear-gradient(45deg,#38a169,#48bb78); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.quantity-controls{ display:flex; align-items:center; gap:15px; margin:0 25px; background:rgba(255,255,255,0.7); padding:10px; border-radius:10px; }
.qty-btn{ width:40px; height:40px; border:none; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border-radius:50%; cursor:pointer; font-size:20px; font-weight:bold; display:flex; align-items:center; justify-content:center; transition:all .3s ease; box-shadow:0 4px 15px rgba(102,126,234,0.3); }
.qty-btn:hover{ transform:scale(1.1); box-shadow:0 6px 20px rgba(102,126,234,0.4); }
.qty-display{ min-width:45px; text-align:center; font-weight:700; font-size:1.2rem; color:#2d3748; }
.remove-btn{ background:linear-gradient(135deg,#e53e3e,#c53030); color:#fff; border:none; padding:12px 20px; border-radius:10px; cursor:pointer; font-weight:600; transition:all .3s ease; box-shadow:0 4px 15px rgba(229,62,62,0.3); }
.remove-btn:hover{ transform:scale(1.05); box-shadow:0 6px 20px rgba(229,62,62,0.4); }
.cart-summary{ background:linear-gradient(135deg,#48bb78,#38a169); color:#fff; padding:30px; border-radius:15px; margin-top:25px; box-shadow:0 10px 30px rgba(72,187,120,0.3); }
.summary-row{ display:flex; justify-content:space-between; margin-bottom:12px; font-size:1.1rem; font-weight:500; }
.total-row{ font-size:1.4rem; font-weight:700; border-top:2px solid rgba(255,255,255,0.3); padding-top:20px; margin-top:20px; }
.payment-form{ max-width:700px; margin:0 auto; }
.form-section{ margin-bottom:30px; padding:25px; border:2px solid transparent; border-radius:15px; background:linear-gradient(45deg,#f8fafc,#ffffff); box-shadow:0 8px 25px rgba(0,0,0,0.08); transition:all .3s ease; }
.form-section:hover{ border-color:#667eea; box-shadow:0 12px 35px rgba(0,0,0,0.12); }
.form-section h3{ color:#2d3748; margin-bottom:20px; font-size:1.4rem; font-weight:700; display:flex; align-items:center; gap:10px; }
.form-row{ display:flex; gap:20px; margin-bottom:20px; }
.form-group{ flex:1; }
.form-group label{ display:block; margin-bottom:8px; color:#2d3748; font-weight:600; font-size:1rem; }
.form-group input{ width:100%; padding:15px; border:2px solid #e2e8f0; border-radius:10px; font-size:1rem; transition:all .3s ease; background:rgba(255,255,255,0.8); }
.form-group input:focus{ outline:none; border-color:#667eea; box-shadow:0 0 0 3px rgba(102,126,234,0.1); background:#fff; }
.btn{ background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; padding:18px 35px; border-radius:12px; font-size:1.1rem; font-weight:600; cursor:pointer; transition:all .3s ease; margin:10px; box-shadow:0 8px 25px rgba(102,126,234,0.3); }
.btn:hover{ transform:translateY(-3px); box-shadow:0 15px 35px rgba(102,126,234,0.4); }
.btn-success{ background:linear-gradient(135deg,#48bb78,#38a169); box-shadow:0 8px 25px rgba(72,187,120,0.3); }
.btn-success:hover{ box-shadow:0 15px 35px rgba(72,187,120,0.4); }
.btn-secondary{ background:linear-gradient(135deg,#718096,#4a5568); box-shadow:0 8px 25px rgba(113,128,150,0.3); }
.success-message{ text-align:center; max-width:700px; margin:0 auto; }
.success-icon{ width:150px; height:150px; background:linear-gradient(135deg,#48bb78,#38a169); border-radius:50%; margin:0 auto 35px; display:flex; align-items:center; justify-content:center; font-size:80px; color:#fff; animation:successPulse 2s infinite; box-shadow:0 15px 40px rgba(72,187,120,0.3); }
@keyframes successPulse{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
.order-details{ background:linear-gradient(45deg,#f8fafc,#ffffff); padding:25px; border-radius:15px; margin:25px 0; border:2px solid #e2e8f0; box-shadow:0 8px 25px rgba(0,0,0,0.08); }
@media (max-width:768px){ .cart-item{ flex-direction:column; text-align:center; padding:20px; } .item-image{ margin-right:0; margin-bottom:20px; } .quantity-controls{ margin:20px 0; } .form-row{ flex-direction:column; } .header h1{ font-size:2.2rem; } .page{ padding:20px; } }
`;
