import { useMutation, useQuery } from "convex/react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cents, when } from "../lib/format";
import { Status } from "./Project";

export default function ChangeOrder() {
  const { changeOrderId } = useParams();
  const data = useQuery(api.changeOrders.get, changeOrderId ? { changeOrderId: changeOrderId as Id<"changeOrders"> } : "skip");
  const sendForApproval = useMutation(api.changeOrders.sendForApproval);
  const replyAs = useMutation(api.demo.replyAs);
  if (data === undefined) return <p className="muted">Loading…</p>;
  if (data === null || !data.project) return <p>Change order not found.</p>;
  const { changeOrder: co, current, approvals, parties, ledger, project } = data;
  const contractor = parties.find((p) => p.role === "contractor");
  const homeowner = parties.find((p) => p.role === "homeowner");
  const approvedBy = (pid: string) => approvals.find((a) => a.revisionId === current?._id && a.partyId === pid);
  return (
    <div>
      <p><Link to={`/p/${project._id}`}>← {project.name}</Link></p>
      <h1>CO #{co.number} — {co.title} <Status s={co.status} /></h1>
      {current ? (
        <>
          <p>{current.summary}</p>
          <p className="muted">Revision v{current.version} · created {when(current.createdAt)} · schedule impact {current.scheduleImpactDays} day(s)</p>
          <table>
            <thead><tr><th>Line</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Line total</th><th>Price source</th></tr></thead>
            <tbody>
              {current.lineItems.map((l, i) => (
                <tr key={i} className={l.flagged ? "flagged" : ""}>
                  <td>{l.description}{l.note && <div className="source">{l.note}</div>}</td>
                  <td className="num">{l.qty} {l.unit}</td>
                  <td className="num">{l.unitPriceCents === null ? <span className="pill amber">unpriced</span> : cents(l.unitPriceCents, project.currency)}</td>
                  <td className="num">{l.unitPriceCents === null ? "—" : cents(Math.round(l.qty * l.unitPriceCents), project.currency)}</td>
                  <td className="source">{sourceLabel(l.source)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={3}>Subtotal (materials + {current.wasteFactorBps / 100}% waste + labour)</td><td className="num">{cents(current.totals.subtotalCents, project.currency)}</td><td /></tr>
              <tr><td colSpan={3}>Overhead &amp; profit ({current.overheadProfitBps / 100}%)</td><td className="num">{cents(current.totals.overheadProfitCents, project.currency)}</td><td /></tr>
              <tr><td colSpan={3}>Tax ({current.taxBps / 100}%)</td><td className="num">{cents(current.totals.taxCents, project.currency)}</td><td /></tr>
              <tr><td colSpan={3}><strong>Total</strong>{current.totals.unpricedCount > 0 && <span className="pill amber" style={{ marginLeft: 8 }}>{current.totals.unpricedCount} line(s) unpriced — total is incomplete</span>}</td><td className="num"><strong>{cents(current.totals.totalCents, project.currency)}</strong></td><td /></tr>
            </tfoot>
          </table>
        </>
      ) : <p className="muted">No revision yet.</p>}

      <div className="grid">
        <div className="card">
          <h2>Written approvals — revision v{current?.version ?? "?"}</h2>
          <ul>
            {[contractor, homeowner].filter(Boolean).map((p) => { const a = p ? approvedBy(p._id) : undefined; return <li key={p!._id}><strong>{p!.name}</strong> — {a ? <span className={`pill ${a.decision === "approve" ? "green" : "red"}`}>{a.decision === "approve" ? "approved" : "rejected"} {when(a.at)} via {a.via}</span> : <span className="pill grey">awaiting reply</span>}</li>; })}
          </ul>
          {co.status === "draft" && contractor && <p><button className="primary" onClick={() => sendForApproval({ changeOrderId: co._id, partyId: contractor._id })}>Send to both parties for written approval</button></p>}
          {co.status === "awaiting_approval" && project.isDemo && homeowner && (
            <p><button className="primary" onClick={() => replyAs({ projectId: project._id, role: "homeowner", decision: "approve" })}>Reply "approve" as the homeowner</button> <button onClick={() => replyAs({ projectId: project._id, role: "homeowner", decision: "reject" })}>Reply "reject"</button><br /><span className="muted">Fixture: injects a top-posted reply with the homeowner's token through the same inbound path as a real email.</span></p>
          )}
          {co.status === "approved" && <p className="pill green">Approved in writing by both parties — part of the project record.</p>}
        </div>
        <div className="card ledger">
          <h2>Ledger</h2>
          <ul>{ledger.map((l) => <li key={l._id}><time>{when(l.at)}</time>{l.summary}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

function sourceLabel(s: { type: string; url?: string; title?: string; fetchedAt?: number; expiresAt?: number }) {
  switch (s.type) {
    case "rate_card": return "contractor's rate card";
    case "supplier_quote": return "supplier's emailed quote";
    case "reference": return <>reference — <a href={s.url} target="_blank" rel="noreferrer">{s.title ?? s.url}</a>{s.fetchedAt ? `, fetched ${when(s.fetchedAt)}` : ""}{s.expiresAt ? `, expires ${when(s.expiresAt)}` : ""} (not a quote)</>;
    case "demo_catalog": return <>demo catalog — {s.title}{s.fetchedAt ? `, fetched ${when(s.fetchedAt)}` : ""} (fixture)</>;
    default: return "unpriced — flagged, not guessed";
  }
}
