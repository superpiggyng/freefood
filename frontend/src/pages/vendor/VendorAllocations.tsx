import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, ListChecks, Play, Users } from "lucide-react";
import { DashboardShell, MetricCard, StatusBadge, type DashboardNavItem, type StatusTone } from "../../components/dashboard/DashboardShell";
import { useAuth } from "../../lib/authContext";
import { fetchVendorAllocations, runVendorMatching, type VendorAllocationCollection, type VendorAllocationListing, type VendorAllocationRequest } from "../../lib/api";

const nav: DashboardNavItem[] = [
  { label: "Dashboard", icon: "▦", href: "/vendor" }, { label: "Create listing", icon: "⇪", href: "/vendor/upload" },
  { label: "Requests", icon: "♡", href: "/vendor/allocations", active: true }, { label: "Partner status", icon: "★", href: "/vendor/partner" },
  { label: "My listings", icon: "⌖", href: "/marketplace" },
];

const stageOrder: Record<VendorAllocationListing["stage"], number> = {
  ready: 0,
  collecting: 1,
  matching: 2,
  allocated: 3,
  expired: 4,
  completed: 5,
  cancelled: 6,
};

const stageTone = (stage: VendorAllocationListing["stage"]): StatusTone => {
  if (stage === "ready" || stage === "matching") return "warning";
  if (stage === "allocated" || stage === "completed") return "positive";
  if (stage === "cancelled") return "danger";
  return "neutral";
};

const priorityTone = (priority: VendorAllocationRequest["priority"]): StatusTone => {
  if (priority === "Very high") return "danger";
  if (priority === "High") return "warning";
  if (priority === "Medium") return "neutral";
  return "positive";
};

const projectionCopy: Record<VendorAllocationRequest["projectedStatus"], { label: string; tone: StatusTone }> = {
  projected: { label: "Projected allocation", tone: "positive" },
  waitlisted: { label: "Waitlisted", tone: "warning" },
  allocated: { label: "Allocated", tone: "positive" },
  declined: { label: "Not selected", tone: "neutral" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
  "not-selected": { label: "Not selected", tone: "neutral" },
};

function sortListings(listings: VendorAllocationListing[]) {
  return [...listings].sort((first, second) => {
    const stageDifference = stageOrder[first.stage] - stageOrder[second.stage];
    if (stageDifference !== 0) return stageDifference;
    return new Date(first.interestDeadline).getTime() - new Date(second.interestDeadline).getTime();
  });
}

function requestOutcome(request: VendorAllocationRequest) {
  const copy = projectionCopy[request.projectedStatus];
  if (request.projectedStatus === "projected" && request.projectedQuantity > 0) {
    return `${copy.label} (${request.projectedQuantity})`;
  }
  return copy.label;
}

export default function VendorAllocations() {
  const { user } = useAuth();
  const [data, setData] = useState<VendorAllocationCollection | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);

  const loadAllocations = async () => {
    const payload = await fetchVendorAllocations();
    setData(payload);
    setSelectedId((current) => {
      if (current && payload.results.some((listing) => listing.id === current)) return current;
      return payload.results[0]?.id ?? null;
    });
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchVendorAllocations()
      .then((payload) => {
        if (!active) return;
        setData(payload);
        setSelectedId(payload.results[0]?.id ?? null);
      })
      .catch((fetchError) => {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : "Could not load allocation requests.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const listings = useMemo(() => sortListings(data?.results ?? []), [data]);
  const selected = listings.find((listing) => listing.id === selectedId) ?? listings[0] ?? null;
  const metrics = data?.metrics ?? { activeListings: 0, waitingRequests: 0, readyToMatch: 0, allocatedRecipients: 0 };
  const userName = user?.vendorName || user?.username || "Vendor";

  const runMatching = async () => {
    if (!selected) return;
    setRunningId(selected.id);
    setError(null);
    try {
      await runVendorMatching(selected.id);
      await loadAllocations();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not run matching for this listing.");
    } finally {
      setRunningId(null);
    }
  };

  return <DashboardShell productLabel="for Business" navItems={nav} userName={userName} userRole="View profile">
    <header className="dashboard-heading">
      <div>
        <a className="back-link" href="/vendor">Back to dashboard</a>
        <h1>Request allocation</h1>
        <p>Review demand for each listing before the deadline, then allocate by need score and request time.</p>
      </div>
      <a className="button button--secondary" href="/vendor/upload">Create listing</a>
    </header>

    <section className="metric-grid" aria-label="Allocation status">
      <MetricCard label="Active listings" value={String(metrics.activeListings)} detail="Collecting or ready"/>
      <MetricCard label="Waiting requests" value={String(metrics.waitingRequests)} detail="Submitted interests"/>
      <MetricCard label="Ready to match" value={String(metrics.readyToMatch)} detail="Deadline passed"/>
      <MetricCard label="Allocated" value={String(metrics.allocatedRecipients)} detail="Recipients selected"/>
    </section>

    {error && <p className="form-error allocation-error" role="alert">{error}</p>}

    {loading ? (
      <section className="dashboard-panel allocation-empty" aria-live="polite">
        <Clock3 size={26}/>
        <h2>Loading allocation queue</h2>
        <p>Checking your listings and current requests.</p>
      </section>
    ) : !listings.length ? (
      <section className="dashboard-panel allocation-empty">
        <ListChecks size={26}/>
        <h2>No listings to allocate</h2>
        <p>Create a listing first. Requests will appear here until the matching deadline.</p>
        <a className="button button--primary" href="/vendor/upload">Create listing</a>
      </section>
    ) : (
      <section className="allocation-workspace" aria-label="Vendor allocation workspace">
        <aside className="dashboard-panel allocation-queue" aria-label="Listings with requests">
          <div className="panel-heading"><h2>Listings</h2><span>{listings.length}</span></div>
          <div className="allocation-list">
            {listings.map((listing) => (
              <button className={listing.id === selected?.id ? "allocation-listing is-selected" : "allocation-listing"} key={listing.id} type="button" onClick={() => setSelectedId(listing.id)}>
                <img src={listing.image} alt="" />
                <span>
                  <strong>{listing.name}</strong>
                  <small>{listing.requestCount} request{listing.requestCount === 1 ? "" : "s"} · {listing.quantityAvailable} available</small>
                  <small>{listing.stage === "collecting" ? "Deadline" : "Match"}: {listing.deadlineRelative}</small>
                </span>
                <StatusBadge tone={stageTone(listing.stage)}>{listing.stageLabel}</StatusBadge>
              </button>
            ))}
          </div>
        </aside>

        <section className="dashboard-panel allocation-detail">
          {selected && <>
            <div className="allocation-detail__hero">
              <img src={selected.image} alt="" />
              <div>
                <p className="eyebrow">{selected.category}</p>
                <h2>{selected.name}</h2>
                <p>{selected.pickupWindow} · {selected.pickupLocation}</p>
              </div>
              <StatusBadge tone={stageTone(selected.stage)}>{selected.stageLabel}</StatusBadge>
            </div>

            <div className="allocation-status-grid">
              <div><Clock3 size={16}/><span><small>Matching deadline</small><strong>{selected.interestDeadlineLabel}</strong></span></div>
              <div><Users size={16}/><span><small>Requests</small><strong>{selected.submittedCount} waiting</strong></span></div>
              <div><CheckCircle2 size={16}/><span><small>Quantity available</small><strong>{selected.quantityAvailable}</strong></span></div>
            </div>

            <div className="allocation-action-bar">
              <p>{selected.canRunMatching ? "Deadline has passed. The algorithm can allocate this listing now." : selected.stage === "collecting" ? "Requests are still open. Ranking updates as more people submit interest." : "Matching for this listing has already been processed."}</p>
              <button className="button button--primary" type="button" disabled={!selected.canRunMatching || runningId === selected.id} onClick={runMatching}>
                <Play size={15}/>{runningId === selected.id ? "Running matching..." : "Run matching"}
              </button>
            </div>

            {selected.requests.length ? (
              <div className="table-scroll">
                <table className="dashboard-table allocation-table">
                  <caption>Requests ranked by need score, then request time</caption>
                  <thead>
                    <tr>
                      <th scope="col">Rank</th>
                      <th scope="col">Requester</th>
                      <th scope="col">Need score</th>
                      <th scope="col">Qty</th>
                      <th scope="col">Requested</th>
                      <th scope="col">Previous allocations</th>
                      <th scope="col">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.requests.map((request) => {
                      const outcome = projectionCopy[request.projectedStatus];
                      return <tr key={request.id}>
                        <td><span className="rank-chip">#{request.rank}</span></td>
                        <td><strong>{request.requesterName}</strong><small>{request.statusLabel}</small></td>
                        <td><strong>{request.needScore}</strong><StatusBadge tone={priorityTone(request.priority)}>{request.priority}</StatusBadge></td>
                        <td>{request.requestedQuantity}</td>
                        <td>{request.requestedAtLabel}</td>
                        <td>{request.previousAllocationsCount}</td>
                        <td><StatusBadge tone={outcome.tone}>{requestOutcome(request)}</StatusBadge>{request.pickupCode && <small>Code {request.pickupCode}</small>}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="allocation-empty allocation-empty--inline">
                <AlertTriangle size={22}/>
                <h2>No requests yet</h2>
                <p>This listing is live, but no recipients have submitted interest yet.</p>
              </div>
            )}

            <aside className="fairness-note">
              <strong>Allocation rule</strong>
              <p>Recipients are ordered by needy metric from highest to lowest. If two people have the same score, the earlier request is ranked first.</p>
            </aside>
          </>}
        </section>
      </section>
    )}
  </DashboardShell>;
}
