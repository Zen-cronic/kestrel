import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cents, when } from "../lib/format";

const SAMPLE = "Hi Dana — while you're in the kitchen, can we also move the counter outlet about 60 cm to the left of the sink? The old spot will need patching. Thanks!";

export default function Project() {
  const { projectId } = useParams();
  const data = useQuery(api.projects.get, projectId ? { projectId: projectId as Id<"projects"> } : "skip");
  const sendAsHomeowner = useMutation(api.demo.sendAsHomeowner);
  const [text, setText] = useState(SAMPLE);
  const [sending, setSending] = useState(false);
  if (data === undefined) return <p className="muted">Loading…</p>;
  if (data === null) return <p>Project not found.</p>;
  const { project, parties, changeOrders, meter } = data;
  const pct = meter.estimateTotalCents ? Math.min(100, (meter.approvedCents / meter.estimateTotalCents) * 100) : 0;
  const over = meter.overBps / 100;
  return (
    <div>
      <h1>{project.name}</h1>
      <p className="muted">{project.address} · inbox <code>{project.inboxId ?? "not provisioned"}</code></p>
      {project.isDemo && <div className="demo-banner">Demo project: prices marked "demo catalog" are fixtures; "Dana" is a labelled demo contractor who approves automatically ~10 s after a change order is sent.</div>}
      <div className="card">
        <h2>Approved changes vs the written estimate</h2>
        <div className="meter"><div className="fill" style={{ width: `${pct}%` }} /><div className="cap" style={{ left: "10%" }} title="Ontario CPA: final price may not exceed the written estimate by more than 10% unless the change is approved in writing" /></div>
        <p><strong>{cents(meter.approvedCents, project.currency)}</strong> approved ({over.toFixed(1)}% of the {cents(meter.estimateTotalCents, project.currency)} estimate) · {cents(meter.pendingCents, project.currency)} awaiting written approval · red line = 10%</p>
      </div>
      <div className="grid">
        <div className="card">
          <h2>Send a request as the homeowner</h2>
          <p className="muted">Goes through the same inbound path as a real email to the project inbox.</p>
          <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          <p><button className="primary" disabled={!project.isDemo || sending} onClick={async () => { setSending(true); try { await sendAsHomeowner({ projectId: project._id, text }); } finally { setSending(false); } }}>Send to {project.inboxId ?? "inbox"}</button>{!project.isDemo && <span className="muted"> (fixture available on the demo project only — email the inbox instead)</span>}</p>
        </div>
        <div className="card">
          <h2>Parties</h2>
          <ul>{parties.map((p) => <li key={p._id}><strong>{p.name}</strong> <span className="muted">{p.role} · {p.email}</span></li>)}</ul>
          <h2>Rate card</h2>
          <p className="muted">Labour {cents(project.rateCard.labourRateCentsPerHour)}/h · OH&P {project.rateCard.overheadProfitBps / 100}% · waste {project.rateCard.wasteFactorBps / 100}% · tax {project.rateCard.taxBps / 100}%</p>
        </div>
      </div>
      <h2>Change orders</h2>
      {changeOrders.length === 0 ? <p className="muted">None yet — send a request above (or email the inbox) and watch one appear here.</p> : (
        <table><thead><tr><th>#</th><th>Title</th><th>Status</th><th className="num">Total</th><th>Updated</th></tr></thead><tbody>
          {changeOrders.map((co) => <tr key={co._id}><td>{co.number}</td><td><Link to={`/p/${project._id}/co/${co._id}`}>{co.title}</Link></td><td><Status s={co.status} /> {co.unpricedCount > 0 && <span className="pill amber">{co.unpricedCount} unpriced</span>}</td><td className="num">{cents(co.totalCents, project.currency)}</td><td className="muted">{when(co.updatedAt)}</td></tr>)}
        </tbody></table>
      )}
    </div>
  );
}

export function Status({ s }: { s: string }) {
  const cls = s === "approved" ? "green" : s === "rejected" ? "red" : s === "awaiting_approval" ? "amber" : "grey";
  return <span className={`pill ${cls}`}>{s.replace("_", " ")}</span>;
}
