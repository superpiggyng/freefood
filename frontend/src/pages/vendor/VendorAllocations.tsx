import { DashboardShell, StatusBadge, type DashboardNavItem } from "../../components/dashboard/DashboardShell";

interface FoodRequest { id: number; requester: string; need: number; dietaryMatch: string; distance: string; pickupFit: string; previous: string; priority: "Very high" | "High" | "Medium" }
const requests: FoodRequest[] = [
  { id: 1, requester: "Amara K.", need: 91, dietaryMatch: "Great match", distance: "0.8 km", pickupFit: "Perfect", previous: "0 this month", priority: "Very high" },
  { id: 2, requester: "Muhari T.", need: 78, dietaryMatch: "Good match", distance: "1.3 km", pickupFit: "1 hr window", previous: "1 this month", priority: "High" },
  { id: 3, requester: "Priya S.", need: 74, dietaryMatch: "Great match", distance: "0.8 km", pickupFit: "Perfect", previous: "0 this month", priority: "High" },
  { id: 4, requester: "Daniel R.", need: 61, dietaryMatch: "Good match", distance: "1.8 km", pickupFit: "2 hr window", previous: "2 this month", priority: "Medium" },
];
const nav: DashboardNavItem[] = [
  { label: "Dashboard", icon: "▦", href: "/vendor" }, { label: "My listings", icon: "▣", href: "/vendor/listings" }, { label: "Requests", icon: "♡", href: "/vendor/allocations", active: true }, { label: "Pickups", icon: "⌖", href: "/vendor/pickups" }, { label: "Impact", icon: "♧", href: "/vendor/impact" }, { label: "Settings", icon: "⚙", href: "/vendor/settings" },
];

export default function VendorAllocations() {
  return <DashboardShell productLabel="for Business" navItems={nav} userName="Bakers Lane" userRole="View profile">
    <header className="dashboard-heading"><div><a className="back-link" href="/vendor/listings">← Back to listings</a><h1>Request allocation</h1></div><button className="button button--primary" type="submit" form="allocation-form">Run fair allocation</button></header>
    <section className="dashboard-panel"><div className="listing-summary"><span className="food-thumbnail" aria-hidden="true">🥐</span><div><h2>Bakery Rescue Box</h2><p>Today, 5:30-6:30 PM</p></div><strong>2 left of 10</strong><StatusBadge tone="warning">8 requests</StatusBadge></div>
      <div className="tab-list" role="tablist" aria-label="Allocation request filters"><button role="tab" aria-selected="true">Incoming requests (8)</button><button role="tab" aria-selected="false">Shortlisted (3)</button><button role="tab" aria-selected="false">Allocated (2)</button></div>
      <form id="allocation-form"><div className="table-scroll"><table className="dashboard-table"><caption>People requesting this listing</caption><thead><tr><th scope="col">Requester</th><th scope="col">Need score</th><th scope="col">Dietary match</th><th scope="col">Distance</th><th scope="col">Pickup fit</th><th scope="col">Past allocations</th><th scope="col">Priority</th><th scope="col">Action</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td>{request.requester}</td><td>{request.need} High</td><td>{request.dietaryMatch}</td><td>{request.distance}</td><td>{request.pickupFit}</td><td>{request.previous}</td><td><StatusBadge tone={request.priority === "Medium" ? "warning" : "danger"}>{request.priority}</StatusBadge></td><td><button className="button button--small" name="requestId" value={request.id}>Shortlist</button></td></tr>)}</tbody></table></div></form>
      <aside className="fairness-note"><strong>Fair allocation preview</strong><p>Need score, dietary match, distance, pickup fit and previous allocations are considered. Final allocation remains under your control.</p></aside>
    </section>
  </DashboardShell>;
}
