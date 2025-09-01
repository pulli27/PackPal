import React from "react";

/**
 * Reusable transactions table
 *
 * props:
 * - rows: array of tx objects
 * - onCycleStatus?: (id) => void
 * - onDelete?: (id) => void
 * - showActions?: boolean (default true)
 * - limit?: number (optional)
 */
export default function TransactionsTable({
  rows = [],
  onCycleStatus,
  onDelete,
  showActions = true,
  limit,
}) {
  const list = Array.isArray(rows) ? rows : [];
  const cut = typeof limit === "number" ? list.slice(0, limit) : list;

  return (
    <div className="body table-wrap">
      <table>
        <thead>
          <tr>
            <th>TX ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>FMC</th>
            <th>Product</th>
            <th>Qty</th>
            <th className="right">Unit</th>
            <th className="right">Discount</th>
            <th className="right">Total</th>
            <th>Status</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {cut.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.date}</td>
              <td>{t.customer || ""}</td>
              <td>{t.fmc ? <span className="badge b-blue">FMC</span> : "—"}</td>
              <td>{t.productName || ""}</td>
              <td>{t.qty}</td>
              <td className="right">{formatMoney(t.unitPrice)}</td>
              <td className="right">
                {t.discountPerUnit > 0 ? formatMoney(t.discountPerUnit) : "—"}
              </td>
              <td className="right">{formatMoney(t.total)}</td>
              <td>
                <span
                  className={
                    "badge " +
                    (t.status === "Paid"
                      ? "b-green"
                      : t.status === "Pending"
                      ? "b-amber"
                      : "b-red")
                  }
                >
                  {t.status}
                </span>
              </td>
              {showActions && (
                <td className="actions">
                  {onCycleStatus && (
                    <button className="btn" onClick={() => onCycleStatus(t.id)}>
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button className="btn red" onClick={() => onDelete(t.id)}>
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {cut.length === 0 && (
            <tr>
              <td colSpan={showActions ? 11 : 10} className="muted">
                No transactions
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// local util (same format as your FinancePage)
function formatMoney(n) {
  return (
    "LKR" +
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
