import { DashboardShell, MetricCard, StatusBadge, type DashboardNavItem } from "../../components/dashboard/DashboardShell";
import { useListings } from "../../lib/listingStore";

const currency = (value: number) => `$${value.toFixed(2)}`;

const nav: DashboardNavItem[] = [
  { label: "Dashboard", icon: "▦", href: "/vendor", active: true }, { label: "Create listing", icon: "⇪", href: "/vendor/upload" },
  { label: "Requests", icon: "♡", href: "/vendor/allocations" }, { label: "Partner status", icon: "★", href: "/vendor/partner" },
  { label: "My listings", icon: "⌖", href: "/marketplace" },
];

export default function VendorDashboard() {
  const listings = useListings("vendor");
  const activeListings = listings.filter((listing) => listing.quantityLeft > 0);
  const availableServes = activeListings.reduce((sum, listing) => sum + listing.quantityLeft, 0);
  const estimatedPayout = activeListings.reduce((sum, listing) => sum + listing.quantityLeft * listing.vendorPrice, 0);
  const sponsorFunded = activeListings.length ? Math.round((activeListings.filter((listing) => listing.sponsored).length / activeListings.length) * 100) : 0;
  const categoryCount = new Set(activeListings.map((listing) => listing.category)).size;

  return <DashboardShell productLabel="for Business" navItems={nav} userName="Bakers Lane" userRole="View profile">
    <header className="dashboard-heading"><div><h1>Overview <small>(Today)</small></h1><p>Welcome back. Here is how your food rescue is going.</p></div><div className="button-row"><a className="button button--secondary" href="/vendor/partner">Partner status</a><a className="button button--primary" href="/vendor/upload">Create listing</a></div></header>
    <section className="metric-grid" aria-label="Today's performance">
      <MetricCard label="Active listings" value={String(activeListings.length)} detail="Available now"/><MetricCard label="Serves available" value={String(availableServes)} detail="Across active listings"/><MetricCard label="Estimated payout" value={currency(estimatedPayout)} detail="If all remaining serves are collected"/><MetricCard label="Sponsor funded" value={`${sponsorFunded}%`} detail="Of active listings"/><MetricCard label="Categories" value={String(categoryCount)} detail="In current stock"/>
    </section>
    <section className="dashboard-panel vendor-listings-panel"><div className="panel-heading"><h2>Active listings</h2><a href="/marketplace">View all listings</a></div>
      {activeListings.length ? (
        <div className="listing-list">{activeListings.map((listing) => <article className="listing-row" key={listing.id}><span className="food-thumbnail" aria-hidden="true">{listing.image ? <img src={listing.image} alt=""/> : listing.category.slice(0, 1)}</span><div><h3>{listing.name}</h3><p>{listing.pickupTime}</p></div><span>{listing.quantityLeft} left</span><StatusBadge tone={listing.sponsored ? "positive" : "neutral"}>{listing.sponsored ? "Sponsored" : "Active"}</StatusBadge></article>)}</div>
      ) : (
        <div className="stock-empty stock-empty--compact"><h2>No active listings</h2><p>Create a listing from today’s surplus stock and it will appear here.</p><a className="button button--primary" href="/vendor/upload">Create listing</a></div>
      )}
    </section>
  </DashboardShell>;
}
