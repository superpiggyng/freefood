import { RequestCard } from "./components/RequestCard";
import type { FoodRequest } from "./components/RequestCard";
import { RecipientSidebar } from "./components/RecipientSidebar";
import { getSavedRequest, hasEligibility } from "../../lib/mvpStore";
import { useListings } from "../../lib/listingStore";
import { money } from "../../lib/sponsorship";

const pendingRequests: FoodRequest[] = [
  { id: "thai-dinner", title: "Thai Dinner Pack", vendor: "Thai on Eath", pickupWindow: "Today, 5:00-6:00 PM", requestedOn: "Requested 10 May", status: "pending" },
];

const allocatedRequests: FoodRequest[] = [
  { id: "bakery-rescue-box", title: "Bakery Rescue Box", vendor: "Bakers Lane", pickupWindow: "Today, 5:30-6:30 PM", status: "allocated" },
];

const otherRequests: FoodRequest[] = [
  { id: "fruit-veg-box", title: "Fruit & Veg Box", vendor: "Wholeharvest Metro", pickupWindow: "Tuesday, 6:00-7:00 PM", requestedOn: "10 May", status: "not-selected" },
  { id: "pantry-essentials", title: "Pantry Essentials Bag", vendor: "Local Grocer", pickupWindow: "Today, 6:00-7:30 PM", requestedOn: "9 May", status: "not-selected" },
];

interface RequestSectionProps {
  title: string;
  requests: FoodRequest[];
}

function RequestSection({ title, requests }: RequestSectionProps) {
  return (
    <section className="requests-section">
      <h2>{title}</h2>
      <div className="requests-list">{requests.map((request) => <RequestCard request={request} key={request.id} />)}</div>
    </section>
  );
}

export default function RequestsPage() {
  const listings = useListings();
  const savedRequest = getSavedRequest();

  /* Show each request with what it costs the person and what the sponsor covers. */
  const withFunding = (request: FoodRequest): FoodRequest => {
    const listing = listings.find((item) => item.slug === request.id);
    if (!listing || !listing.sponsored) return request;
    const userPays = listing.price === "FREE" ? 0 : Number(listing.price.replace("$", ""));
    const covered = Math.max(0, listing.vendorPrice - userPays);
    if (covered <= 0) return request;
    return { ...request, funding: `You pay ${money(userPays)} · sponsor covers ${money(covered)} · ${listing.vendor} paid in full` };
  };

  const currentPending: FoodRequest[] = (savedRequest ? [{ ...savedRequest, status: "pending" as const, requestedOn: "Requested just now" }] : pendingRequests).map(withFunding);
  const allocated = allocatedRequests.map(withFunding);
  const others = otherRequests.map(withFunding);
  const sponsorTotal = [...currentPending, ...allocated].reduce((sum, request) => {
    const listing = listings.find((item) => item.slug === request.id);
    if (!listing?.sponsored) return sum;
    const userPays = listing.price === "FREE" ? 0 : Number(listing.price.replace("$", ""));
    return sum + Math.max(0, listing.vendorPrice - userPays);
  }, 0);
  return (
    <main className="recipient-dashboard">
      <RecipientSidebar activeItem="requests" />
      <section className="recipient-dashboard__content" aria-labelledby="requests-title">
        <header className="requests-header"><div><h1 id="requests-title">My requests</h1><p>Track requests and get ready for your pickups.</p></div><a className="button button--primary" href="/marketplace">Browse food</a></header>
        {!hasEligibility() && <p className="requests-tip"><strong>Complete your profile</strong> so requests can be matched fairly. <a href="/eligibility">Start now</a></p>}
        <RequestSection title="Pending / In review" requests={currentPending} />
        <section className="requests-section"><h2>Allocated</h2><div className="allocated-request"><div className="requests-list">{allocated.map((request) => <RequestCard request={request} key={request.id} />)}</div><aside className="pickup-code" aria-label="Pickup code"><div className="pickup-code__qr" aria-hidden="true" /><p>Show this QR code at pickup</p><strong>SAVR-1264</strong><button className="button button--secondary" type="button">Add to wallet</button></aside></div></section>
        <RequestSection title="Other requests" requests={others} />
        {sponsorTotal > 0 && <p className="requests-tip requests-tip--impact"><strong>{money(sponsorTotal)}</strong> of your food this week is covered by the Atlas Community Food Fund. The businesses were still paid in full.</p>}
        <p className="requests-tip"><strong>Tip:</strong> Update your preferences to get better matches. <a href="/preferences">Update now</a></p>
      </section>
    </main>
  );
}
