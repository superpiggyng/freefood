import type { FoodListing } from "../../components/ListingCard";
import { money } from "../../lib/sponsorship";

export interface ListingDetail extends FoodListing {
  description: string;
  dietaryTags?: string[];
  allergenInformation?: string;
  servings?: string;
  weight?: string;
  co2Avoided?: string;
  vendorVerified?: boolean;
  isAvailable: boolean;
}

interface ListingDetailPageProps {
  listing: ListingDetail;
  onRequest?: (listing: ListingDetail) => void;
  onSave?: (listing: ListingDetail) => void;
}

export function ListingDetailPage({ listing, onRequest, onSave }: ListingDetailPageProps) {
  const sponsorCovers = listing.sponsored && listing.vendorPrice != null ? Math.max(0, listing.vendorPrice - listing.price) : 0;

  return (
    <main className="page-shell detail-page" id="main-content">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/marketplace">Food marketplace</a><span aria-hidden="true">/</span><span aria-current="page">{listing.title}</span></nav>
      <div className="detail-layout">
        <article className="listing-detail">
          <div className="listing-detail__media">
            {listing.imageUrl ? <img src={listing.imageUrl} alt={listing.imageAlt ?? listing.title} /> : <div className="listing-detail__placeholder" aria-hidden="true">🥖</div>}
            <span className="listing-card__price">{listing.price === 0 ? "Free" : `$${listing.price.toFixed(2)}`}</span>
          </div>
          <header className="listing-detail__header">
            <div><h1>{listing.title}</h1><p>{listing.vendorName} {listing.vendorVerified && <span className="verified">✓ Verified</span>}{listing.partnerTier && <span className="partner-chip">★ {listing.partnerTier.replace(" Partner", "")} partner</span>}</p></div>
            <button className="icon-button" type="button" onClick={() => onSave?.(listing)} aria-label={`Save ${listing.title}`}>♡</button>
          </header>
          <dl className="pickup-summary">
            <div><dt>Pickup today</dt><dd>{listing.pickupWindow}</dd></div>
            {listing.distance && <div><dt>Distance</dt><dd>{listing.distance} away</dd></div>}
            <div><dt>Availability</dt><dd>{listing.quantityRemaining} left</dd></div>
          </dl>
          <section className="detail-copy" aria-labelledby="about-food"><h2 id="about-food">About this food</h2><p>{listing.description}</p></section>
          <section className="detail-copy" aria-labelledby="dietary-info">
            <h2 id="dietary-info">Dietary information</h2>
            <ul className="tag-list">{listing.dietaryTags?.length ? listing.dietaryTags.map((tag) => <li key={tag}>{tag}</li>) : <li>Ask the vendor for dietary details</li>}</ul>
            {listing.allergenInformation && <p><strong>Allergens:</strong> {listing.allergenInformation}</p>}
          </section>
        </article>

        <aside className="request-panel" aria-labelledby="request-title">
          <section className="impact-card"><h2>Impact</h2><dl>{listing.servings && <div><dt>Meals</dt><dd>{listing.servings}</dd></div>}{listing.weight && <div><dt>Food rescued</dt><dd>{listing.weight}</dd></div>}{listing.co2Avoided && <div><dt>CO₂ avoided</dt><dd>{listing.co2Avoided}</dd></div>}</dl></section>
          <section className="info-card"><h2>How requests work</h2><p>When demand is high, requests are ranked by need score and match suitability - not first come, first served.</p></section>
          {sponsorCovers > 0 && (
            <section className="funding-card">
              <h2>How this is paid for</h2>
              <div className="price-split">
                <span><small>You pay</small><strong>{money(listing.price)}</strong></span>
                <span><small>Sponsor covers</small><strong>{money(sponsorCovers)}</strong></span>
                <span className="price-split__total"><small>{listing.vendorName} receives</small><strong>{money(listing.vendorPrice ?? listing.price)}</strong></span>
              </div>
              <p>A corporate sponsor funds the difference, so the business is paid in full for food it would otherwise throw away.</p>
            </section>
          )}
          <section className="request-card">
            <h2 id="request-title">Request this food</h2>
            {listing.isAvailable ? <><button className="button button--primary button--wide" type="button" onClick={() => onRequest?.(listing)}>Request this food</button><p className="fine-print">{listing.price === 0 ? "It’s free. No payment required." : `You pay ${money(listing.price)} at pickup. Nothing is charged now.`}</p></> : <><p>This listing is no longer available.</p><a className="button button--secondary button--wide" href="/marketplace">Find similar food</a></>}
          </section>
        </aside>
      </div>
    </main>
  );
}

export default ListingDetailPage;
