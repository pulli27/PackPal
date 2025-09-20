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

// -------------------- VALIDATION HELPERS --------------------
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const nameRe  = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,}$/;
const cityRe  = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,}$/;
const zipRe   = /^[A-Za-z0-9 -]{3,10}$/;

const onlyDigits = (s = "") => (s || "").replace(/\D/g, "");

const luhnCheck = (num) => {
  const s = onlyDigits(num);
  if (s.length < 12) return false;
  let sum = 0, alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = +s[i];
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
};

const parseExpiry = (mmYY) => {
  const m = mmYY.match(/^(\d{2})\/?(\d{2})$/);
  if (!m) return null;
  const month = +m[1];
  const year  = 2000 + +m[2];
  if (month < 1 || month > 12) return null;
  return { month, year };
};

const expiryInFuture = (mmYY) => {
  const parsed = parseExpiry(mmYY);
  if (!parsed) return false;
  const { month, year } = parsed;
  const now = new Date();
  const exp = new Date(year, month, 0, 23, 59, 59, 999); // end of month
  return exp >= now;
};

const normalizeSLPhonePretty = (raw) => {
  let digits = onlyDigits(raw);
  if (digits.startsWith("0")) digits = "94" + digits.slice(1);
  if (!digits.startsWith("94")) digits = "94" + digits;
  digits = digits.slice(0, 11); // 94 + 9 locals
  const local = digits.slice(2);
  let out = "+94";
  if (local.length > 0) out += " " + local.slice(0, 2);
  if (local.length > 2) out += " " + local.slice(2, 5);
  if (local.length > 5) out += " " + local.slice(5, 9);
  return out.trim();
};

const phoneIsValidSL = (pretty) => {
  const digits = onlyDigits(pretty);
  return digits.length === 11 && digits.startsWith("94");
};

const validateForm = (form) => {
  const errors = {};

  if (!form.email || !emailRe.test(form.email.trim()))
    errors.email = "Enter a valid email (e.g., you@example.com).";

  if (!form.phone || !phoneIsValidSL(form.phone))
    errors.phone = "Enter a valid Sri Lankan number like +94 71 234 5678.";

  if (!form.firstName || !nameRe.test(form.firstName.trim()))
    errors.firstName = "First name should be at least 2 letters.";

  if (!form.lastName || !nameRe.test(form.lastName.trim()))
    errors.lastName = "Last name should be at least 2 letters.";

  if (!form.address || form.address.trim().length < 5)
    errors.address = "Address should be at least 5 characters.";

  if (!form.city || !cityRe.test(form.city.trim()))
    errors.city = "Enter a valid city or town.";

  if (!form.zip || !zipRe.test(form.zip.trim()))
    errors.zip = "Postal code should be 3–10 characters.";

  const rawPan = onlyDigits(form.cardNumber);
  if (rawPan.length < 13 || rawPan.length > 19 || !luhnCheck(form.cardNumber))
    errors.cardNumber = "Enter a valid card number.";

  if (!form.expiryDate || !parseExpiry(form.expiryDate))
    errors.expiryDate = "Use MM/YY format.";
  else if (!expiryInFuture(form.expiryDate))
    errors.expiryDate = "Card is expired.";

  const cv = onlyDigits(form.cvv);
  if (!(cv.length === 3 || cv.length === 4))
    errors.cvv = "CVV should be 3–4 digits.";

  if (!form.cardName || form.cardName.trim().length < 3)
    errors.cardName = "Enter the name shown on the card.";

  return errors;
};
// ------------------------------------------------------------

export default function Cart() {
  const [step, setStep] = useState("cart");
  const [cart, setCart] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // --------- form state + validation state ---------
  const [form, setForm] = useState({
    email: "", phone: "", firstName: "", lastName: "",
    address: "", city: "", zip: "", cardNumber: "", expiryDate: "", cvv: "", cardName: "",
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const change = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // formatters
  const onCardNumber = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 19);
    v = v.replace(/(\d{4})(?=\d)/g, "$1 ");
    change("cardNumber", v);
  };
  const onExp = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
    change("expiryDate", v);
  };
  const onCVV = (e) => change("cvv", e.target.value.replace(/\D/g, "").slice(0, 4));
  const onPhone = (e) => change("phone", normalizeSLPhonePretty(e.target.value));

  // live validation
  useEffect(() => { setErrors(validateForm(form)); }, [form]);

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
    setCart(readCart().map((it) => ({
      ...it,
      quantity: Math.max(1, parseInt(it.quantity || 1, 10) || 1),
    })));
  }, []);

  // 2) merge just-added item from route state
  useEffect(() => {
    const justAdded = location.state && location.state.justAdded;
    if (justAdded) {
      setCart((prev) => {
        const exists = prev.some((x) => String(x.id) === String(justAdded.id));
        const next = exists ? prev : [...prev, { ...justAdded, quantity: Math.max(1, justAdded.quantity || 1) }];
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  // save cart
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

  // === SEND TO BACKEND on Complete Payment ===
  const processPayment = async () => {
    // quick cart checks
    if (!cart.length) { alert("Your cart is empty."); return; }
    const bad = cart.find((it) => !Number.isFinite(+it.quantity) || +it.quantity < 1);
    if (bad) { alert("Each cart item must have a quantity of at least 1."); return; }

    // submit-time validation (mark all fields touched to show errors)
    const currentErrors = validateForm(form);
    setErrors(currentErrors);
    setTouched({
      email: true, phone: true, firstName: true, lastName: true,
      address: true, city: true, zip: true,
      cardNumber: true, expiryDate: true, cvv: true, cardName: true,
    });
    if (Object.keys(currentErrors).length) {
      const firstKey = Object.keys(currentErrors)[0];
      const el = document.querySelector(`[name="${firstKey}"]`);
      if (el && el.focus) el.focus();
      return;
    }

    setProcessing(true);
    setErr(""); setOk("");

    const customerName = `${form.firstName} ${form.lastName}`.trim();
    const method = "Card";
    const date = nowISO();

    try {
      const payloads = cart.map((it) => {
        const qty = Number(it.quantity || 1);
        const unit = Number(it.price || 0);
        return {
          date,
          customer: customerName || form.email,
          customerId: "",
          fmc: false,
          productId: String(it.id),
          productName: it.name,
          qty,
          unitPrice: unit,
          discountPerUnit: 0,
          total: unit * qty,
          method,
          status: "Paid",
          notes: `Checkout: ${form.email} / ${form.phone}`,
        };
      });

      await Promise.all(
        payloads.map((p) =>
          axios.post(TX_URL, p, { headers: { "Content-Type": "application/json" } })
        )
      );

      window.dispatchEvent(new Event("tx:changed"));
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

  const formValid = !Object.keys(errors).length;

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
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email" name="email"
                    value={form.email}
                    onChange={(e) => change("email", e.target.value)}
                    onBlur={() => markTouched("email")}
                    placeholder="you@example.com" required type="email" autoComplete="email"
                    aria-invalid={Boolean(touched.email && errors.email)}
                    aria-describedby={touched.email && errors.email ? "email-err" : undefined}
                  />
                  {touched.email && errors.email && <div className="field-error" id="email-err">{errors.email}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number (Sri Lanka)</label>
                  <input
                    id="phone" name="phone"
                    value={form.phone}
                    onChange={onPhone}
                    onBlur={() => markTouched("phone")}
                    placeholder="+94 71 234 5678" required inputMode="tel" autoComplete="tel"
                    aria-invalid={Boolean(touched.phone && errors.phone)}
                    aria-describedby={touched.phone && errors.phone ? "phone-err" : undefined}
                  />
                  {touched.phone && errors.phone && <div className="field-error" id="phone-err">{errors.phone}</div>}
                </div>
              </div>

              {/* address */}
              <div className="form-section">
                <h3>🚚 Shipping Address</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName" name="firstName"
                      value={form.firstName}
                      onChange={(e) => change("firstName", e.target.value)}
                      onBlur={() => markTouched("firstName")}
                      placeholder="John" required autoComplete="given-name"
                      aria-invalid={Boolean(touched.firstName && errors.firstName)}
                      aria-describedby={touched.firstName && errors.firstName ? "firstName-err" : undefined}
                    />
                    {touched.firstName && errors.firstName && <div className="field-error" id="firstName-err">{errors.firstName}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName" name="lastName"
                      value={form.lastName}
                      onChange={(e) => change("lastName", e.target.value)}
                      onBlur={() => markTouched("lastName")}
                      placeholder="Doe" required autoComplete="family-name"
                      aria-invalid={Boolean(touched.lastName && errors.lastName)}
                      aria-describedby={touched.lastName && errors.lastName ? "lastName-err" : undefined}
                    />
                    {touched.lastName && errors.lastName && <div className="field-error" id="lastName-err">{errors.lastName}</div>}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="address">Street Address</label>
                  <input
                    id="address" name="address"
                    value={form.address}
                    onChange={(e) => change("address", e.target.value)}
                    onBlur={() => markTouched("address")}
                    placeholder="123 Main Street" required autoComplete="address-line1"
                    aria-invalid={Boolean(touched.address && errors.address)}
                    aria-describedby={touched.address && errors.address ? "address-err" : undefined}
                  />
                  {touched.address && errors.address && <div className="field-error" id="address-err">{errors.address}</div>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City / Town</label>
                    <input
                      id="city" name="city"
                      value={form.city}
                      onChange={(e) => change("city", e.target.value)}
                      onBlur={() => markTouched("city")}
                      placeholder="Colombo" required autoComplete="address-level2"
                      aria-invalid={Boolean(touched.city && errors.city)}
                      aria-describedby={touched.city && errors.city ? "city-err" : undefined}
                    />
                    {touched.city && errors.city && <div className="field-error" id="city-err">{errors.city}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="zip">Postal Code</label>
                    <input
                      id="zip" name="zip"
                      value={form.zip}
                      onChange={(e) => change("zip", e.target.value)}
                      onBlur={() => markTouched("zip")}
                      placeholder="00100" required inputMode="numeric" autoComplete="postal-code"
                      aria-invalid={Boolean(touched.zip && errors.zip)}
                      aria-describedby={touched.zip && errors.zip ? "zip-err" : undefined}
                    />
                    {touched.zip && errors.zip && <div className="field-error" id="zip-err">{errors.zip}</div>}
                  </div>
                </div>
              </div>

              {/* card */}
              <div className="form-section">
                <h3>💳 Payment Information</h3>
                <div className="form-group">
                  <label htmlFor="cardNumber">Card Number</label>
                  <input
                    id="cardNumber" name="cardNumber"
                    value={form.cardNumber}
                    onChange={onCardNumber}
                    onBlur={() => markTouched("cardNumber")}
                    placeholder="1234 5678 9012 3456" maxLength={23} required inputMode="numeric"
                    aria-invalid={Boolean(touched.cardNumber && errors.cardNumber)}
                    aria-describedby={touched.cardNumber && errors.cardNumber ? "cardNumber-err" : undefined}
                  />
                  {touched.cardNumber && errors.cardNumber && <div className="field-error" id="cardNumber-err">{errors.cardNumber}</div>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expiryDate">Expiry Date</label>
                    <input
                      id="expiryDate" name="expiryDate"
                      value={form.expiryDate}
                      onChange={onExp}
                      onBlur={() => markTouched("expiryDate")}
                      placeholder="MM/YY" maxLength={5} required inputMode="numeric"
                      aria-invalid={Boolean(touched.expiryDate && errors.expiryDate)}
                      aria-describedby={touched.expiryDate && errors.expiryDate ? "expiryDate-err" : undefined}
                    />
                    {touched.expiryDate && errors.expiryDate && <div className="field-error" id="expiryDate-err">{errors.expiryDate}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="cvv">CVV</label>
                    <input
                      id="cvv" name="cvv"
                      value={form.cvv}
                      onChange={onCVV}
                      onBlur={() => markTouched("cvv")}
                      placeholder="123" maxLength={4} required inputMode="numeric"
                      aria-invalid={Boolean(touched.cvv && errors.cvv)}
                      aria-describedby={touched.cvv && errors.cvv ? "cvv-err" : undefined}
                    />
                    {touched.cvv && errors.cvv && <div className="field-error" id="cvv-err">{errors.cvv}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="cardName">Name on Card</label>
                    <input
                      id="cardName" name="cardName"
                      value={form.cardName}
                      onChange={(e) => change("cardName", e.target.value)}
                      onBlur={() => markTouched("cardName")}
                      placeholder="John Doe" required
                      aria-invalid={Boolean(touched.cardName && errors.cardName)}
                      aria-describedby={touched.cardName && errors.cardName ? "cardName-err" : undefined}
                    />
                    {touched.cardName && errors.cardName && <div className="field-error" id="cardName-err">{errors.cardName}</div>}
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
                <button
                  className="btn btn-success"
                  onClick={processPayment}
                  disabled={processing || !formValid || !cart.length}
                  title={
                    !cart.length ? "Your cart is empty" :
                    !formValid ? "Please fix validation errors above" :
                    "Ready to pay"
                  }
                >
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
.field-error{ color:#b91c1c; font-size:.9rem; margin-top:6px; }
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
