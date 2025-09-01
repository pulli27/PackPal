import React, { useState, useCallback } from "react";
import "./Quality.css";
 import Sidebar from "../Sidebar/Sidebar";

export default function Quality() {
  // ----- Data (replace with your API) -----
  const [qcItems, setQcItems] = useState([
    { id: "1", bag: "Evening Clutch", person: "Sarah Kim",    date: "2025-08-20", status: "Passed",          note: "" },
    { id: "2", bag: "Backpack",       person: "Mike Johnson", date: "2025-08-19", status: "Failed",          note: "Uneven stitching on main compartment" },
    { id: "3", bag: "Wallet",         person: "Anna Park",    date: "2025-08-21", status: "Pending Review", note: "" },
  ]);

  // ----- Actions -----
  const markPass = useCallback((id) => {
    setQcItems(list =>
      list.map(it => it.id === id ? { ...it, status: "Passed", note: "" } : it)
    );
  }, []);

  const markFail = useCallback((id) => {
    const reason = window.prompt("Enter failure reason:", "");
    setQcItems(list =>
      list.map(it =>
        it.id === id ? { ...it, status: "Failed", note: (reason || "").trim() } : it
      )
    );
  }, []);

  // Generate PDF (dynamic import; falls back to CDN if present)
  const generatePdf = useCallback(async () => {
    let jsPDFCtor, autoTableFn;
    try {
      jsPDFCtor  = (await import("jspdf")).jsPDF;
      autoTableFn = (await import("jspdf-autotable")).default;
    } catch {
      if (window.jspdf) jsPDFCtor = window.jspdf.jsPDF; // CDN fallback
    }
    if (!jsPDFCtor) {
      alert("PDF libs not found. Run: npm i jspdf jspdf-autotable  (or add CDN scripts).");
      return;
    }

    const doc = new jsPDFCtor({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Quality Control Report", 40, 40);

    const rows = qcItems.map(r => [r.bag, r.person, r.date, r.status, r.status === "Failed" ? (r.note || "-") : "-"]);

    if (autoTableFn) {
      autoTableFn(doc, {
        startY: 60,
        head: [["Bag Type", "Sewing Person", "Completed Date", "Status", "Note"]],
        body: rows,
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [247, 249, 255], textColor: 30 },
        theme: "grid",
      });
    } else if (doc.autoTable) {
      doc.autoTable({
        startY: 60,
        head: [["Bag Type", "Sewing Person", "Completed Date", "Status", "Note"]],
        body: rows,
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [247, 249, 255], textColor: 30 },
        theme: "grid",
      });
    }

    doc.save("quality-control-report.pdf");
  }, [qcItems]);

  // ----- UI helpers -----
  const Pill = ({ status }) => {
    const cls = status === "Passed" ? "pass" : status === "Failed" ? "fail" : "pending";
    return <span className={`pill ${cls}`}>{status}</span>;
  };

  const FailNote = ({ text }) =>
    !text ? null : (
      <div className="note">
        <svg viewBox="0 0 24 24" className="warn">
          <path
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        <span>{text}</span>
      </div>
    );

  return (
    <div>
      <Sidebar/> 
      <header className="topbar">
        <div className="container">
          <h1 className="title">Quality Control</h1>
          <div className="actions-right">
            <button onClick={generatePdf} className="btn btn-primary" id="reportBtn">
              <svg viewBox="0 0 24 24" className="ico">
                <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM13 2v6h6"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Generate Report
            </button>
            <div className="avatar" title="Profile">
              <svg viewBox="0 0 24 24" className="ico">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main className="container pad">
        <div className="table-card">
          <table className="qc-table">
            <thead>
              <tr>
                <th>BAG TYPE</th>
                <th>SEWING PERSON</th>
                <th>COMPLETED DATE</th>
                <th>QUALITY STATUS</th>
                <th className="txt-r">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {qcItems.map(item => (
                <tr key={item.id}>
                  <td>{item.bag}</td>
                  <td>{item.person}</td>
                  <td>{item.date}</td>
                  <td>
                    <Pill status={item.status} />
                    {item.status === "Failed" && <FailNote text={item.note} />}
                  </td>
                  <td className="txt-r">
                    <div className="actions-group">
                      <button className="btn-mini btn-pass" onClick={() => markPass(item.id)}>Pass</button>
                      <button className="btn-mini btn-fail" onClick={() => markFail(item.id)}>Fail</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
