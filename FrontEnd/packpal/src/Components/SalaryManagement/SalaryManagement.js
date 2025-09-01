import React, { useEffect } from "react";
import "./SalaryManagement.css";
import Sidebar from "../Sidebar/Sidebar";
import { NavLink } from "react-router-dom";

function SalaryManagement() {
  /* ---------------- storage + helpers ---------------- */
  const Store = {
    kE: "employees",
    kA: "attendance",
    kAd: "advances",
    kT: "transfers",
    get(k, d = []) {
      try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; }
    },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
    seed(force = false) {
      if (force || !localStorage.getItem(this.kE)) {
        this.set(this.kE, [
          { id: "EMP001", name: "John Silva",  designation: "Software Engineer", epf: "EPF001", salary: 50000, bankName: "BOC",           branch: "Colombo", accNo: "1234567890" },
          { id: "EMP002", name: "Maria Fernando", designation: "HR Manager",     epf: "EPF002", salary: 85000, bankName: "People's Bank", branch: "Kandy",   accNo: "9876543210" }
        ]);
      }
      if (force || !localStorage.getItem(this.kA)) {
        this.set(this.kA, [{ empId: "EMP001", period: "2025-08", workingDays: 22, overtimeHrs: 10, leaveAllowed: 2, noPayLeave: 0, leaveTaken: 1, other: "Good performance" }]);
      }
      if (force || !localStorage.getItem(this.kAd)) {
        this.set(this.kAd, [{ empId: "EMP001", period: "2025-08", costOfLiving: 5000, food: 0, conveyance: 0, medical: 0, bonus: 0, reimbursements: 0 }]);
      }
      if (force || !localStorage.getItem(this.kT)) { this.set(this.kT, []); }
    }
  };

  const LKR = (n) => `LKR ${Math.round(Number(n || 0)).toLocaleString()}`;

  function numberToWords(num) {
    num = Math.round(Number(num || 0));
    if (num === 0) return "Zero";
    const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    const chunk = (n) => n < 20 ? ones[n] :
      n < 100 ? tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "") :
      ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + chunk(n % 100) : "");
    let out = "", scales = [["Billion",1e9],["Million",1e6],["Thousand",1e3]];
    for (const [name, val] of scales) { if (num >= val) { out += `${chunk(Math.floor(num / val))} ${name} `; num %= val; } }
    if (num > 0) out += chunk(num);
    return out.trim();
  }

  function fillEmpOptions(selectFirst = false) {
    const sel = document.getElementById("salaryEmpId");
    if (!sel) return;
    const emps = Store.get(Store.kE);
    sel.innerHTML = '<option value="">Select Employee</option>';
    emps.forEach((e) => {
      const o = document.createElement("option");
      o.value = e.id; o.textContent = `${e.id} - ${e.name}`;
      sel.appendChild(o);
    });
    if (selectFirst && emps.length) sel.value = emps[0].id;
  }

  function ensureEmpId() {
    const sel = document.getElementById("salaryEmpId");
    if (!sel.value) {
      const emps = Store.get(Store.kE);
      if (emps.length) sel.value = emps[0].id;
    }
    return document.getElementById("salaryEmpId").value;
  }

  /* ---------------- calculations ---------------- */
  function calculateSalary() {
    const empId = ensureEmpId();
    if (!empId) { window.alert("No employees found. Click “Reset sample data”."); return; }

    const emp = Store.get(Store.kE).find((e) => e.id === empId);
    if (!emp) { window.alert("Employee not found"); return; }

    const att = Store.get(Store.kA).find((a) => a.empId === empId) || {};
    const adv = Store.get(Store.kAd).find((a) => a.empId === empId) || {};

    const basic = Number(emp.salary) || 0;
    const col = Number(adv.costOfLiving) || 0;
    const food = Number(adv.food) || 0;
    const conv = Number(adv.conveyance) || 0;
    const med  = Number(adv.medical) || 0;
    const bonus = Number(adv.bonus) || 0;
    const reimbursements = Number(adv.reimbursements) || 0;

    const otHrs = Number(att.overtimeHrs) || 0;
    const noPayLeave = Number(att.noPayLeave) || 0;

    const hourlyRate = basic / (22 * 8);
    const overtimePay = otHrs > 0 ? otHrs * hourlyRate * 1.5 : 0;
    const noPay = noPayLeave > 0 ? (basic / 22) * noPayLeave : 0;

    const totalAllowances = col + food + conv + med;
    const gross = basic + totalAllowances;

    const salaryBeforeDeduction = gross + overtimePay + bonus;
    const epfEmp    = salaryBeforeDeduction * 0.08;
    const epfEr     = salaryBeforeDeduction * 0.12;
    const etfAmount = salaryBeforeDeduction * 0.03;
    const apit   = 0;
    const salaryAdvance = 0;

    const totalDeductions = noPay + salaryAdvance + apit + epfEmp + etfAmount;
    const netPayable = salaryBeforeDeduction - totalDeductions;

    // mini dashboard update
    document.getElementById("basicSal").textContent  = LKR(basic);
    document.getElementById("grossSal").textContent  = LKR(gross);
    document.getElementById("empEpf").textContent    = LKR(epfEmp);
    document.getElementById("emplerEpf").textContent = LKR(epfEr);
    document.getElementById("etfAmt").textContent    = LKR(etfAmount);
    document.getElementById("netSal").textContent    = LKR(netPayable);
    document.getElementById("calcBox").style.display = "block";

    return { emp, att, adv, numbers: {
      basic, col, food, conv, med, bonus, reimbursements,
      overtimePay, noPay, totalAllowances, gross,
      salaryBeforeDeduction, epfEmp, epfEr, etf: etfAmount, apit, salaryAdvance,
      totalDeductions, netPayable
    }};
  }

  function openSlip(html) {
    let w = window.open("", "_blank");
    if (w && !w.closed) { w.document.write(html); w.document.close(); return; }
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.target = "_blank";
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
  }

  function generateSalarySlip() {
    const res = calculateSalary(); if (!res) return;
    const { emp, att, numbers } = res;

    const now = new Date();
    const periodShort = now.toLocaleString("en-US", { month: "short" }) + " " + String(now.getFullYear()).slice(-2);
    const periodLong  = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    const amountWords = numberToWords(numbers.netPayable);

    // NOTE: </script> escaped as <\/script>
    const slipHTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Salary Slip - ${emp.name}</title>
<style>
 *{box-sizing:border-box}
 body{font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#fff;color:#1a1a1a;margin:0;padding:24px}
 .wrap{max-width:900px;margin:0 auto;border:1px solid #cfd7ff;border-radius:8px;background:#fff}
 .header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:2px solid #cfd7ff}
 .brand{display:flex;align-items:center;gap:12px}
 .logo{width:40px;height:40px;border-radius:10px;background:linear-gradient(180deg,#ff82b3,#ff4d7a);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px}
 .brand h1{margin:0;font-size:20px}
 .brand small{display:block;font-size:11px;color:#667}
 .contact{font-size:11px;color:#334;text-align:right;line-height:1.4}
 .title{position:relative;text-align:center;font-weight:700;padding:10px 16px;border-bottom:1px solid #e7ebff}
 .title .period-right{position:absolute;right:16px;top:10px}
 .bar{background:#eef2ff;border-top:1px solid #cfd7ff;border-bottom:1px solid #cfd7ff;padding:8px 10px;font-weight:700}
 .tbl{width:100%;border-collapse:separate;border-spacing:0}
 .tbl th,.tbl td{border:1px solid #cfd7ff;padding:8px 10px;font-size:13px}
 .tbl th{background:#eef2ff;color:#223;font-weight:700}
 .tbl td.key{background:#f7f8ff;color:#223;width:220px;font-weight:600}
 .grid{display:grid;grid-template-columns:1fr 1fr}
 .hpad{padding:0 16px 16px}
 .right{text-align:right}
 .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
 .tot{font-weight:800}
 .net{background:#e9f7ec}
 @media print{.noprint{display:none}}
 .noprint .btn{display:inline-block;margin:14px 8px 0 0;background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;font-size:13px}
 .noprint .btn.green{background:#22c55e}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
</head>
<body>
<div class="noprint">
  <button class="btn" onclick="window.print()">🖨️ Print</button>
  <button class="btn green" onclick="downloadPDF()">📄 Download PDF</button>
</div>

<div id="slip" class="wrap">
  <div class="header">
    <div class="brand">
      <div class="logo">👜</div>
      <div>
        <h1>BagCorp (Pvt) Ltd</h1>
        <small>Premium Bags • Backpacks • Luggage</small>
      </div>
    </div>
    <div class="contact">123 Leather Lane, Colombo 01<br/>+94 11 222 3344 • info@bagcorp.lk</div>
  </div>

  <div class="title">Salary Slip For the month of <span class="period-right">${periodShort}</span></div>

  <div class="grid">
    <div>
      <div class="bar">Employee Information</div>
      <table class="tbl">
        <tr><td class="key">UID:</td><td>${emp.id}</td></tr>
        <tr><td class="key">Designation:</td><td>${emp.designation || '-'}</td></tr>
        <tr><td class="key">Name:</td><td>${emp.name}</td></tr>
        <tr><td class="key">EPF No:</td><td>${emp.epf || '-'}</td></tr>
      </table>

      <div class="bar">Employee Attendance</div>
      <table class="tbl">
        <tr><td class="key">Working Days</td><td>${Number(att.workingDays) || 0}</td></tr>
        <tr><td class="key">Overtime Hours</td><td>${Number(att.overtimeHrs) || 0}</td></tr>
        <tr><td class="key">Leave Allowed</td><td>${Number(att.leaveAllowed) || 0}</td></tr>
        <tr><td class="key">No Pay Leave</td><td>${Number(att.noPayLeave) || 0}</td></tr>
        <tr><td class="key">Leave Taken</td><td>${Number(att.leaveTaken) || 0}</td></tr>
      </table>
    </div>

    <div>
      <div class="bar">Salary Transferred To</div>
      <table class="tbl">
        <tr><td class="key">Bank Name</td><td>${emp.bankName || '—'}</td></tr>
        <tr><td class="key">Account No</td><td>${emp.accNo || '—'}</td></tr>
        <tr><td class="key">Branch Name</td><td>${emp.branch || '—'}</td></tr>
      </table>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="bar">Salary Calculations</div>
      <table class="tbl">
        <tr><td class="key">Basic Salary</td><td class="right mono">LKR ${Math.round(numbers.basic).toLocaleString()}</td></tr>
        <tr><td class="key">Cost of Living Allowance</td><td class="right mono">LKR ${Math.round(numbers.col).toLocaleString()}</td></tr>
        <tr><td class="key">Food Allowance</td><td class="right mono">LKR ${Math.round(numbers.food).toLocaleString()}</td></tr>
        <tr><td class="key">Conveyance Allowance</td><td class="right mono">LKR ${Math.round(numbers.conv).toLocaleString()}</td></tr>
        <tr><td class="key">Medical Allowance</td><td class="right mono">LKR ${Math.round(numbers.med).toLocaleString()}</td></tr>
        <tr><td class="key tot">Total Allowances</td><td class="right mono tot">LKR ${Math.round(numbers.totalAllowances).toLocaleString()}</td></tr>
        <tr><td class="key tot">Gross Salary</td><td class="right mono tot">LKR ${Math.round(numbers.gross).toLocaleString()}</td></tr>
      </table>
    </div>

    <div>
      <div class="bar">Deductions</div>
      <table class="tbl">
        <tr><td class="key">No Pay Days Deductions</td><td class="right mono">LKR ${Math.round(numbers.noPay).toLocaleString()}</td></tr>
        <tr><td class="key">Salary Advance</td><td class="right mono">LKR ${Math.round(numbers.salaryAdvance).toLocaleString()}</td></tr>
        <tr><td class="key">EPF Employee Contribution (8%)</td><td class="right mono">LKR ${Math.round(numbers.epfEmp).toLocaleString()}</td></tr>
        <tr><td class="key">APIT (0%)</td><td class="right mono">LKR ${Math.round(numbers.apit).toLocaleString()}</td></tr>
        <tr><td class="key tot">Total Deductions</td><td class="right mono tot">LKR ${Math.round(numbers.totalDeductions).toLocaleString()}</td></tr>
        <tr><td class="key">EPF Employer Contribution (12%)</td><td class="right mono">LKR ${Math.round(numbers.epfEr).toLocaleString()}</td></tr>
        <tr><td class="key">ETF Employer Contribution (3%)</td><td class="right mono">LKR ${Math.round(numbers.etf).toLocaleString()}</td></tr>
      </table>
    </div>
  </div>

  <div>
    <div class="bar">Additional Perks</div>
    <table class="tbl">
      <tr>
        <td class="key">Overtime</td><td class="right mono">LKR ${Math.round(numbers.overtimePay).toLocaleString()}</td>
        <td class="key">Reimbursements</td><td class="right mono">LKR ${Math.round(numbers.reimbursements).toLocaleString()}</td>
      </tr>
      <tr>
        <td class="key">Bonus</td><td class="right mono">LKR ${Math.round(numbers.bonus).toLocaleString()}</td>
        <td class="key"></td><td></td>
      </tr>
      <tr>
        <td class="key tot">Salary Before Deduction</td><td class="right mono tot">LKR ${Math.round(numbers.salaryBeforeDeduction).toLocaleString()}</td>
        <td class="key tot net">Net Payable Salary</td><td class="right mono tot net">LKR ${Math.round(numbers.netPayable).toLocaleString()}</td>
      </tr>
    </table>
  </div>

  <div>
    <div class="bar">Amount in Words:</div>
    <div class="hpad mono"><strong>LKR ${amountWords}</strong></div>
  </div>

  <div class="hpad" style="color:#667;font-size:12px;border-top:1px solid #e7ebff;padding-top:8px;">
    Salary Period: ${periodLong}
  </div>
</div>

<script>
  function downloadPDF(){
    const el=document.getElementById('slip');
    html2canvas(el,{scale:2,useCORS:true,allowTaint:true}).then(cv=>{
      const img=cv.toDataURL('image/png');
      const pdf=new jspdf.jsPDF('p','mm','a4');
      const pageW=210, pageH=297;
      const imgW=pageW, imgH=cv.height*imgW/cv.width;
      let left=imgH;
      pdf.addImage(img,'PNG',0,0,imgW,imgH);
      left-=pageH;
      while(left>0){ pdf.addPage(); pdf.addImage(img,'PNG',0,-(left),imgW,imgH); left-=pageH; }
      pdf.save('salary-slip-${emp.name.replace(/\s+/g,"-")}-${periodLong.replace(/\s+/g,"-")}.pdf');
    });
  }
<\/script>
</body></html>`;
    openSlip(slipHTML);
  }

  /* ---------------- transfers ---------------- */
  function transferSalary() {
    const res = calculateSalary(); if (!res) return;
    const { emp, numbers } = res;
    const list = Store.get(Store.kT);
    const month = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });
    if (list.find((t) => t.empId === emp.id && t.month === month)) {
      window.alert("Salary transfer already exists for this employee in this month"); return;
    }
    list.push({
      empId: emp.id,
      date: new Date().toISOString().split("T")[0],
      month,
      empName: emp.name,
      amount: Math.round(numbers.netPayable),
      status: "Pending",
    });
    Store.set(Store.kT, list);
    window.alert(`Salary transfer initiated for ${emp.name}!\nAmount: ${LKR(numbers.netPayable)}`);
  }

  /* ---------------- boot ---------------- */
  useEffect(() => {
    Store.seed();
    fillEmpOptions(true);
    // No addEventListener needed; we use React onClick handlers below.
  }, []);

  // (optional) expose to window for debugging
  window.calculateSalary = calculateSalary;
  window.generateSalarySlip = generateSalarySlip;
  window.transferSalary = transferSalary;

  return (
    <div className="salarymanage page-wrap">
      <Sidebar />

      <div className="container">
         <h1>Employee Salary Management</h1>
        <p>Real-time salary insights and employee payroll management</p>

        <div className="section">
          {/* Tabs FIRST (inside card) */}
          <div className="nav">
            <NavLink to="/finance/employees"  className={({isActive}) => `tab-btn ${isActive ? 'active' : ''}`}>👥 Employees</NavLink>
            <NavLink to="/finance/attendance" className={({isActive}) => `tab-btn ${isActive ? 'active' : ''}`}>📅 Attendance</NavLink>
            <NavLink to="/finance/advance"    className={({isActive}) => `tab-btn ${isActive ? 'active' : ''}`}>💰 Advance</NavLink>
            <NavLink to="/finance/salary"     className={({isActive}) => `tab-btn ${isActive ? 'active' : ''}`}>📊 Salary Management</NavLink>
            <NavLink to="/finance/transfers"  className={({isActive}) => `tab-btn ${isActive ? 'active' : ''}`}>💸 Salary Transfers</NavLink>
          </div>

          <h2>Salary Management</h2>

          <div className="form-group">
            <label>Select Employee</label>
            <select id="salaryEmpId">
              <option value="">Select Employee</option>
            </select>
          </div>

          <div className="actions">
            <button className="btn btn-success"  onClick={generateSalarySlip}  id="btnSlip">📄 Generate Salary Slip</button>
            <button className="btn btn-primary"  onClick={transferSalary}      id="btnTransfer">💰 Transfer Salary</button>
            <button className="btn btn-warning"  onClick={calculateSalary}     id="btnCalc">🧮 Calculate Salary</button>
          </div>

          <div id="calcBox" className="calc" style={{ display: "none" }}>
            <h3>💰 Salary Calculation</h3>
            <div className="grid">
              <div className="tile"><h4>Basic Salary</h4><div id="basicSal"  className="amt">LKR 0</div></div>
              <div className="tile"><h4>Gross Salary</h4><div id="grossSal"  className="amt">LKR 0</div></div>
              <div className="tile"><h4>Employee EPF (8%)</h4><div id="empEpf" className="amt">LKR 0</div></div>
              <div className="tile"><h4>Employer EPF (12%)</h4><div id="emplerEpf" className="amt">LKR 0</div></div>
              <div className="tile"><h4>ETF (3%)</h4><div id="etfAmt" className="amt">LKR 0</div></div>
              <div className="tile"><h4>Net Salary</h4><div id="netSal" className="amt">LKR 0</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalaryManagement;
