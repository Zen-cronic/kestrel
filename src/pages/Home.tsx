import { useMutation, useQuery } from "convex/react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const projects = useQuery(api.projects.list, {});
  const seed = useMutation(api.demo.seed);
  const navigate = useNavigate();
  return (
    <div>
      <h1>Every "can we also…?" becomes a change order you both approve by replying.</h1>
      <p className="muted">A renovation gets its own inbox. Requests become priced change orders with a visible price trail; both parties approve in writing; the ledger is the record.</p>
      <div className="card">
        <h2>Try the demo project</h2>
        <p>Seeded with a written estimate and a contractor rate card. You play the homeowner; a labelled demo contractor replies automatically.</p>
        <button className="primary" onClick={async () => navigate(`/p/${await seed({})}`)}>Open the demo project</button>
      </div>
      <h2>Projects</h2>
      {projects === undefined ? <p className="muted">Loading…</p> : projects.length === 0 ? <p className="muted">No projects yet.</p> : (
        <ul>{projects.map((p) => <li key={p._id}><Link to={`/p/${p._id}`}>{p.name}</Link> <span className="muted">{p.address}{p.isDemo ? " · demo" : ""}</span></li>)}</ul>
      )}
    </div>
  );
}
