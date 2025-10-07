import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Cart.css";

const STORAGE_KEY = "packPalCart";
const TX_URL = "http://localhost:5000/api/transactions";
// NEW: products endpoint used to bump reorder level after purchase
const PRODUCTS_URL = "http://localhost:5000/api/products";

const money = (n) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(
    Number(n || 0)
  );

const nowISO = () => new Date().toISOString().slice(0, 10);

/* ===================== VALIDATION HELPERS ===================== */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
// allow letters (incl. accents), spaces and ',.-  (min 2)
const nameRe  = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,}$/;
const cityRe  = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,}$/;
// Sri Lanka postal codes are 5 digits
const zipRe   = /^\d{5}$/;

const onlyDigits = (s = "") => (s || "").replace(/\D/g, "");
const trimMultiSpace = (s = "") => s.replace(/\s{2,}/g, " ").trim();
const cleanName = (s = "") =>
  trimMultiSpace(s.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' .-]/g, ""));
const cleanCity = (s = "") =>
  trimMultiSpace(s.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' .-]/g, ""));

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

/* -------- Expiry must be >= this month and <= +7 years -------- */
const MAX_EXP_YEARS = 7;

const mmYY = (d) => {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const y = String(d.getFullYear()).slice(-2);
  return `${m}/${y}`;
};

const expiryInRange = (mmYYstr, maxYears = MAX_EXP_YEARS) => {
  const parsed = parseExpiry(mmYYstr);
  if (!parsed) return false;

  const { month, year } = parsed;
  const expEnd = new Date(year, month, 0, 23, 59, 59, 999); // end of expiry month

  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const max = new Date(now.getFullYear() + maxYears, now.getMonth() + 1, 0, 23, 59, 59, 999);

  return expEnd >= startThisMonth && expEnd <= max;
};

const allowedExpiryWindowLabel = () => {
  const now = new Date();
  const minLabel = mmYY(now);
  const max = new Date(now.getFullYear() + MAX_EXP_YEARS, now.getMonth(), 1);
  const maxLabel = mmYY(max);
  return { minLabel, maxLabel };
};

/* -------- Sri Lanka phone format/validation -------- */
const normalizeSLPhonePretty = (raw) => {
  let digits = onlyDigits(raw);
  if (digits.startsWith("0")) digits = "94" + digits.slice(1);
  if (!digits.startsWith("94")) digits = "94" + digits;
  digits = digits.slice(0, 11); // 94 + 9 digits
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

/* -------- combined validators -------- */
const validateCustomer = (f) => {
  const e = {};
  const email = (f.email || "").trim().toLowerCase();
  if (!email || !emailRe.test(email)) e.email = "Enter a valid email.";

  if (!f.phone || !phoneIsValidSL(f.phone))
    e.phone = "Enter a valid Sri Lankan number (e.g., +94 71 234 5678).";

  const fn = cleanName(f.firstName || "");
  const ln = cleanName(f.lastName || "");
  if (!fn || !nameRe.test(fn)) e.firstName = "First name can only have letters, spaces, ', . or - (min 2).";
  if (!ln || !nameRe.test(ln)) e.lastName  = "Last name can only have letters, spaces, ', . or - (min 2).";

  if (!f.address || trimMultiSpace(f.address).length < 5)
    e.address = "Address must be at least 5 characters.";

  const city = cleanCity(f.city || "");
  if (!city || !cityRe.test(city))
    e.city = "City can only have letters, spaces, ', . or - (min 2).";

  const zip = (f.zip || "").trim();
  if (!zip || !zipRe.test(zip)) e.zip = "Postal code must be 5 digits.";

  return e;
};

const validateCard = (f) => {
  const e = {};
  const rawPan = onlyDigits(f.cardNumber);
  if (rawPan.length < 13 || rawPan.length > 19 || !luhnCheck(f.cardNumber))
    e.cardNumber = "Enter a valid card number.";

  if (!f.expiryDate || !parseExpiry(f.expiryDate)) {
    e.expiryDate = "Use MM/YY format.";
  } else if (!expiryInRange(f.expiryDate)) {
    const { minLabel, maxLabel } = allowedExpiryWindowLabel();
    e.expiryDate = `Expiry must be between ${minLabel} and ${maxLabel}.`;
  }

  const cv = onlyDigits(f.cvv);
  if (!(cv.length === 3 || cv.length === 4)) e.cvv = "CVV must be 3–4 digits.";

  const nm = cleanName(f.cardName || "");
  if (!nm || nm.length < 3) e.cardName = "Enter the name on the card.";

  return e;
};

/* ===================== INPUT BLOCKING HELPERS ===================== */
// Block invalid characters at typing time; clean pasted text.
const allowNameChar = /[A-Za-zÀ-ÖØ-öø-ÿ' .-]/;
const allowCityChar = allowNameChar;
const allowZipChar  = /\d/;          // digits only for postal code
const allowDigits   = /\d/;

const blockIfNot = (re) => (e) => {
  if (e.inputType === "insertText" && e.data && !re.test(e.data)) {
    e.preventDefault();
  }
};

const onPasteSanitize = (sanitizer) => (e) => {
  e.preventDefault();
  const t = e.target;
  const pasted = (e.clipboardData?.getData("text") || "");
  const clean = sanitizer(pasted);
  const { selectionStart: s, selectionEnd: epos, value } = t;
  const before = value.slice(0, s);
  const after  = value.slice(epos);
  const next   = before + clean + after;
  t.value = next;
  const pos = before.length + clean.length;
  t.setSelectionRange?.(pos, pos);
  const ev = new Event("input", { bubbles: true });
  t.dispatchEvent(ev);
};
/* ================================================================ */

export default function Cart() {
  const [step, setStep] = useState("cart"); // cart -> payment -> success
  const [cart, setCart] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    zip: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const change = (k, v) => {
    let value = v;
    if (k === "firstName" || k === "lastName") value = cleanName(v);
    if (k === "city") value = cleanCity(v);
    if (k === "email") value = v.replace(/\s+/g, "").toLowerCase();
    if (k === "zip") value = onlyDigits(v).slice(0, 5); // digits only, max 5
    setForm((f) => ({ ...f, [k]: value }));
  };
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

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
  const onCVV = (e) => change("cvv", onlyDigits(e.target.value).slice(0, 4));
  const onPhone = (e) => change("phone", normalizeSLPhonePretty(e.target.value));

  // live-validate (after field touched)
  useEffect(() => {
    const cust = validateCustomer(form);
    const card = validateCard(form);
    setErrors((prev) => ({ ...prev, ...cust, ...(showPanel ? card : {}) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, showPanel]);

  // load cart
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setCart(
        stored.map((it) => ({
          ...it,
          quantity: Math.max(1, parseInt(it.quantity || 1, 10) || 1),
        }))
      );
    } catch {}
    document.body.classList.add("sidebar-off");
    return () => document.body.classList.remove("sidebar-off");
  }, []);

  // merge a just-added product from router state (if any)
  useEffect(() => {
    const justAdded = location.state && location.state.justAdded;
    if (!justAdded) return;
    setCart((prev) => {
      const exists = prev.some((x) => String(x.id) === String(justAdded.id));
      const next = exists
        ? prev
        : [...prev, { ...justAdded, quantity: Math.max(1, justAdded.quantity || 1) }];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    navigate(".", { replace: true, state: null });
  }, [location.state, navigate]);

  // persist cart
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {} }, [cart]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
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
  const removeItem = (id) => setCart((list) => list.filter((it) => String(it.id) !== String(id)));
  const clearCart = () => setCart([]);

  /* -------------------- flow handlers -------------------- */
  const onClickCheckout = () => {
    const custErrors = validateCustomer(form);
    setTouched({
      email: true, phone: true, firstName: true, lastName: true,
      address: true, city: true, zip: true,
    });
    setErrors((e) => ({ ...e, ...custErrors }));
    if (Object.keys(custErrors).length) return;

    setShowPanel(true);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const processPayment = async () => {
    const cardErrors = validateCard(form);
    setTouched((t) => ({ ...t, cardNumber: true, expiryDate: true, cvv: true, cardName: true }));
    setErrors((e) => ({ ...e, ...cardErrors }));
    if (Object.keys(cardErrors).length) return;
    if (!cart.length) { alert("Your cart is empty."); return; }

    setProcessing(true);
    try {
      const date = nowISO();
      const customerName = `${form.firstName} ${form.lastName}`.trim() || form.email;

      // 1) Create transaction rows
      const payloads = cart.map((it) => ({
        date,
        customer: customerName,
        customerId: "",
        fmc: false,
        productId: String(it.id),
        productName: it.name,
        qty: Number(it.quantity || 1),
        unitPrice: Number(it.price || 0),
        discountPerUnit: 0,
        total: (Number(it.price) || 0) * (Number(it.quantity) || 1),
        method: "Card",
        status: "Paid",
        notes: `Checkout: ${form.email} / ${form.phone}`,
      }));
      await Promise.all(payloads.map((p) =>
        axios.post(TX_URL, p, { headers: { "Content-Type": "application/json" } })
      ));

      // 2) Bump reorder level for each line item (NEW)
      //    POST /api/products/:id/sold { qty }
      await Promise.all(
        cart.map((it) =>
          axios.post(
            `${PRODUCTS_URL}/${encodeURIComponent(String(it.id))}/sold`,
            { qty: Number(it.quantity || 1) },
            { headers: { "Content-Type": "application/json" } }
          ).catch((err) => {
            // Don’t break checkout if one bump fails; log & continue
            console.warn("Reorder bump failed:", it.id, err?.response?.data || err.message);
          })
        )
      );

      window.dispatchEvent(new Event("tx:changed"));
      setCart([]); try { localStorage.setItem(STORAGE_KEY, "[]"); } catch {}
      setStep("success");
    } catch (e) {
      alert("Payment failed: " + (e?.response?.data?.message || e.message || "Payment failed"));
    } finally {
      setProcessing(false);
    }
  };

  const invalid = (k) => touched[k] && errors[k];
  const { minLabel, maxLabel } = allowedExpiryWindowLabel();

  return (
    <div className="cart-root">
      <div className="cart-wrap">
        <div className="container">
          <div className="header">
            <h1>📦 PackPal</h1>
            <p>Smart Bag System - Intelligent Packing Solutions</p>
          </div>

          {/* CART */}
          {step === "cart" && (
            <section className="page active">
              <h2 className="page-title">🛒 Your PackPal Cart</h2>

              {!cart.length ? (
                <div className="empty">
                  <p>Your cart is empty.</p>
                  <div style={{ marginTop: 12 }}>
                    <button className="btn" onClick={() => navigate("/customer")}>🛍️ Browse Products</button>
                  </div>
                </div>
              ) : (
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
                      <button className="btn btn-success" onClick={() => setStep("payment")}>🚀 Proceed</button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* PAYMENT STEP */}
          {step === "payment" && (
            <section className="page active">
              <h2 className="page-title">👤 Customer Details</h2>

              <div className="payment-form">
                {/* Contact */}
                <div className="form-section">
                  <h3>📧 Contact Information</h3>

                  <div className={`form-group ${invalid("email") ? "has-error" : ""}`}>
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={(e) => change("email", e.target.value)}
                      onBlur={() => markTouched("email")}
                      onBeforeInput={blockIfNot(/[\w.@+-]/)}
                      onPaste={onPasteSanitize((s)=>s.replace(/\s+/g,"").slice(0,254))}
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                      required
                      aria-invalid={!!invalid("email")}
                    />
                    {invalid("email") && <div className="field-error">{errors.email}</div>}
                  </div>

                  <div className={`form-group ${invalid("phone") ? "has-error" : ""}`}>
                    <label htmlFor="phone">Phone Number (Sri Lanka)</label>
                    <input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={onPhone}
                      onBlur={() => markTouched("phone")}
                      onBeforeInput={blockIfNot(allowDigits)} // digits only; formatter adds +94 & spaces
                      onPaste={onPasteSanitize((s)=>s.replace(/\D/g,"").slice(0,11))}
                      placeholder="+94 71 234 5678"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      aria-invalid={!!invalid("phone")}
                    />
                    {invalid("phone") && <div className="field-error">{errors.phone}</div>}
                  </div>
                </div>

                {/* Address */}
                <div className="form-section">
                  <h3>🚚 Shipping Address</h3>
                  <div className="form-row">
                    <div className={`form-group ${invalid("firstName") ? "has-error" : ""}`}>
                      <label htmlFor="firstName">First Name</label>
                      <input
                        id="firstName"
                        name="firstName"
                        value={form.firstName}
                        onChange={(e) => change("firstName", e.target.value)}
                        onBlur={() => markTouched("firstName")}
                        onBeforeInput={blockIfNot(allowNameChar)}
                        onPaste={onPasteSanitize(cleanName)}
                        placeholder="John"
                        required
                        inputMode="text"
                        pattern="[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,}"
                        aria-invalid={!!invalid("firstName")}
                      />
                      {invalid("firstName") && <div className="field-error">{errors.firstName}</div>}
                    </div>
                    <div className={`form-group ${invalid("lastName") ? "has-error" : ""}`}>
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        id="lastName"
                        name="lastName"
                        value={form.lastName}
                        onChange={(e) => change("lastName", e.target.value)}
                        onBlur={() => markTouched("lastName")}
                        onBeforeInput={blockIfNot(allowNameChar)}
                        onPaste={onPasteSanitize(cleanName)}
                        placeholder="Doe"
                        required
                        inputMode="text"
                        pattern="[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,}"
                        aria-invalid={!!invalid("lastName")}
                      />
                      {invalid("lastName") && <div className="field-error">{errors.lastName}</div>}
                    </div>
                  </div>

                  <div className={`form-group ${invalid("address") ? "has-error" : ""}`}>
                    <label htmlFor="address">Street Address</label>
                    <input
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={(e) => change("address", e.target.value)}
                      onBlur={() => markTouched("address")}
                      /* ESLint fix: removed unnecessary \[ escape in character class */
                      onBeforeInput={blockIfNot(/[^<>{}[\]^`~]/)}
                      onPaste={onPasteSanitize((s)=>trimMultiSpace(s.replace(/[<>{}[\]^`~]/g,"")).slice(0,120))}
                      placeholder="123 Main Street"
                      required
                      minLength={5}
                      aria-invalid={!!invalid("address")}
                    />
                    {invalid("address") && <div className="field-error">{errors.address}</div>}
                  </div>

                  <div className="form-row">
                    <div className={`form-group ${invalid("city") ? "has-error" : ""}`}>
                      <label htmlFor="city">City / Town</label>
                      <input
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={(e) => change("city", e.target.value)}
                        onBlur={() => markTouched("city")}
                        onBeforeInput={blockIfNot(allowCityChar)}
                        onPaste={onPasteSanitize(cleanCity)}
                        placeholder="Colombo"
                        required
                        pattern="[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,}"
                        aria-invalid={!!invalid("city")}
                      />
                      {invalid("city") && <div className="field-error">{errors.city}</div>}
                    </div>
                    <div className={`form-group ${invalid("zip") ? "has-error" : ""}`}>
                      <label htmlFor="zip">Postal Code</label>
                      <input
                        id="zip"
                        name="zip"
                        value={form.zip}
                        onChange={(e) => change("zip", e.target.value)}
                        onBlur={() => markTouched("zip")}
                        onBeforeInput={blockIfNot(allowZipChar)}
                        onPaste={onPasteSanitize((s)=>onlyDigits(s).slice(0,5))}
                        placeholder="10400"
                        inputMode="numeric"
                        maxLength={5}
                        required
                        pattern="^\d{5}$"
                        aria-invalid={!!invalid("zip")}
                      />
                      {invalid("zip") && <div className="field-error">{errors.zip}</div>}
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setStep("cart")}>
                    ⬅️ Back to Cart
                  </button>
                  <button className="btn btn-success" onClick={onClickCheckout}>
                    ✅ Checkout
                  </button>
                </div>

                {/* ONE LIGHT-BLUE PANEL: Payment Info first, Summary below */}
                {showPanel && (
                  <div className="panel-blue" ref={panelRef}>
                    <h3 className="panel-title">💳 Payment Information & Summary</h3>

                    {/* Payment Info */}
                    <div>
                      <div className={`form-group ${invalid("cardNumber") ? "has-error" : ""}`}>
                        <label htmlFor="cardNumber">Card Number</label>
                        <input
                          id="cardNumber"
                          name="cardNumber"
                          value={form.cardNumber}
                          onChange={onCardNumber}
                          onBlur={() => markTouched("cardNumber")}
                          onBeforeInput={blockIfNot(allowDigits)}
                          onPaste={onPasteSanitize((s)=>s.replace(/\D/g,"").slice(0,19))}
                          placeholder="1234 5678 9012 3456"
                          maxLength={23}
                          required
                          inputMode="numeric"
                          aria-invalid={!!invalid("cardNumber")}
                        />
                        {invalid("cardNumber") && <div className="field-error">{errors.cardNumber}</div>}
                      </div>

                      <div className="form-row">
                        <div className={`form-group ${invalid("expiryDate") ? "has-error" : ""}`}>
                          <label htmlFor="expiryDate">Expiry Date</label>
                          <input
                            id="expiryDate"
                            name="expiryDate"
                            value={form.expiryDate}
                            onChange={onExp}
                            onBlur={() => markTouched("expiryDate")}
                            onBeforeInput={blockIfNot(allowDigits)} // digits only; slash auto-added
                            onPaste={onPasteSanitize((s)=>s.replace(/\D/g,"").slice(0,4))}
                            placeholder="MM/YY"
                            maxLength={5}
                            required
                            inputMode="numeric"
                            pattern="^(0[1-9]|1[0-2])\/\d{2}$"
                            title={`Enter MM/YY (from ${minLabel} to ${maxLabel})`}
                            aria-invalid={!!invalid("expiryDate")}
                          />
                          {invalid("expiryDate") && <div className="field-error">{errors.expiryDate}</div>}
                        </div>

                        <div className={`form-group ${invalid("cvv") ? "has-error" : ""}`}>
                          <label htmlFor="cvv">CVV</label>
                          <input
                            id="cvv"
                            name="cvv"
                            value={form.cvv}
                            onChange={onCVV}
                            onBlur={() => markTouched("cvv")}
                            onBeforeInput={blockIfNot(allowDigits)}
                            onPaste={onPasteSanitize((s)=>s.replace(/\D/g,"").slice(0,4))}
                            placeholder="123"
                            maxLength={4}
                            required
                            inputMode="numeric"
                            aria-invalid={!!invalid("cvv")}
                          />
                          {invalid("cvv") && <div className="field-error">{errors.cvv}</div>}
                        </div>

                        <div className={`form-group ${invalid("cardName") ? "has-error" : ""}`}>
                          <label htmlFor="cardName">Name on Card</label>
                          <input
                            id="cardName"
                            name="cardName"
                            value={form.cardName}
                            onChange={(e) => change("cardName", e.target.value)}
                            onBlur={() => markTouched("cardName")}
                            onBeforeInput={blockIfNot(allowNameChar)}
                            onPaste={onPasteSanitize(cleanName)}
                            placeholder="John Doe"
                            required
                            aria-invalid={!!invalid("cardName")}
                          />
                          {invalid("cardName") && <div className="field-error">{errors.cardName}</div>}
                        </div>
                      </div>
                    </div>

                    {/* Summary BELOW */}
                    <div className="summary-block">
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

                    <div style={{ textAlign:"center", marginTop: 16 }}>
                      <button className="btn btn-success" onClick={processPayment} disabled={processing || !cart.length}>
                        {processing ? "⏳ Processing..." : "🔒 Complete Payment"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* SUCCESS */}
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
    </div>
  );
}
