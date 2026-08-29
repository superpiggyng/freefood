import { DashboardShell, MetricCard, StatusBadge, type DashboardNavItem } from "../../components/dashboard/DashboardShell";
import { useState, type FormEvent } from "react";

interface Listing { id: number; title: string; emoji: string; pickupWindow: string; remaining: number; total: number }
const listings: Listing[] = [
  { id: 1, title: "Bakery Rescue Box", emoji: "🥐", pickupWindow: "Today, 5:30-6:30 PM", remaining: 2, total: 10 },
  { id: 2, title: "Bread & Pastry Pack", emoji: "🥖", pickupWindow: "Tomorrow, 4:00-5:00 PM", remaining: 4, total: 8 },
  { id: 3, title: "Muffin Box", emoji: "🧁", pickupWindow: "Tomorrow, 5:30-6:30 PM", remaining: 6, total: 8 },
];
const nav: DashboardNavItem[] = [
  { label: "Dashboard", icon: "▦", href: "/vendor", active: true }, { label: "Upload stock", icon: "⇪", href: "/vendor/upload" },
  { label: "Requests", icon: "♡", href: "/vendor/allocations" }, { label: "Partner status", icon: "★", href: "/vendor/partner" },
  { label: "Marketplace", icon: "⌖", href: "/marketplace" },
];

export default function VendorDashboard() {
  const [published, setPublished] = useState(false);
  const publishListing = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setPublished(true); };
  return <DashboardShell productLabel="for Business" navItems={nav} userName="Bakers Lane" userRole="View profile">
    <header className="dashboard-heading"><div><h1>Overview <small>(Today)</small></h1><p>Welcome back. Here is how your food rescue is going.</p></div><div className="button-row"><a className="button button--secondary" href="/vendor/partner">Partner status</a><a className="button button--primary" href="/vendor/upload">Upload stock</a></div></header>
    <section className="metric-grid" aria-label="Today's performance">
      <MetricCard label="Active listings" value="8" detail="Available now"/><MetricCard label="Requests received" value="42" detail="Today"/><MetricCard label="Allocated pickups" value="27" detail="Ready to collect"/><MetricCard label="Food rescued" value="86 kg" detail="+12% this week"/><MetricCard label="Earnings recovered" value="$412" detail="Estimated value"/><MetricCard label="Sponsor funded" value="82%" detail="Of listings this month"/>
    </section>
    <div className="dashboard-columns">
      <section className="dashboard-panel"><div className="panel-heading"><h2>Active listings</h2><a href="/marketplace">View in marketplace</a></div>
        <div className="listing-list">{listings.map((listing) => <article className="listing-row" key={listing.id}><span className="food-thumbnail" aria-hidden="true">{listing.emoji}</span><div><h3>{listing.title}</h3><p>{listing.pickupWindow}</p></div><span>{listing.remaining} left / {listing.total}</span><StatusBadge>Active</StatusBadge></article>)}</div>
      </section>
      <section className="dashboard-panel" id="create-listing"><div className="panel-heading"><h2>Create new listing</h2></div><form className="listing-form" onSubmit={publishListing}><div className="form-grid"><label>Food type<select name="foodType"><option>Bakery</option><option>Groceries</option><option>Meals</option></select></label><label>Original value<input name="originalValue" defaultValue="$34.00"/></label><label>Price<select name="price"><option>Free</option><option>$2.00</option></select></label><label>Quantity<input name="quantity" type="number" min="1" defaultValue="10"/></label><label className="form-field--wide">Pickup window<input name="pickupWindow" defaultValue="Today, 5:30 PM - 6:30 PM"/></label><fieldset className="form-field--wide"><legend>Dietary tags</legend><div className="tag-list"><span className="tag">Vegetarian</span><span className="tag">Nut-free</span></div></fieldset><label className="form-field--wide">Reservation deadline<input name="deadline" defaultValue="Today, 2:00 PM"/></label></div>{published && <p className="form-success" role="status">Listing published and visible to nearby recipients.</p>}<button className="button button--primary form-submit" type="submit">{published ? "Published" : "Publish listing"}</button></form></section>
    </div>
  </DashboardShell>;
}
