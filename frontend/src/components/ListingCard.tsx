import type { Listing } from "../types";

export interface FoodListing {
  id: string | number;
  title: string;
  vendorName: string;
  category?: string;
  imageUrl?: string;
  imageAlt?: string;
  price: number;
  originalValue?: number;
  quantityRemaining: number;
  pickupWindow: string;
  distance?: string;
  tags?: string[];
  vendorPrice?: number;
  sponsored?: boolean;
  partnerTier?: string;
  nutrition?: Listing["nutrition"];
}

interface ListingCardProps {
  listing: FoodListing;
  href?: string;
  className?: string;
}

const formatPrice = (price: number) =>
  price === 0 ? "Free" : new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(price);

const sponsorShare = (listing: FoodListing) =>
  listing.sponsored && listing.vendorPrice != null ? Math.max(0, listing.vendorPrice - listing.price) : 0;

const nutritionLine = (listing: FoodListing) => {
  const values = listing.nutrition;
  if (!values) return null;
  const parts = [
    values.calories ? `${Math.round(values.calories)} kcal` : null,
    values.proteinG ? `${Math.round(values.proteinG)}g protein` : null,
    values.carbsG ? `${Math.round(values.carbsG)}g carbs` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
};

export function ListingCard({ listing, href = `/marketplace/${listing.id}`, className = "" }: ListingCardProps) {
  const estimatedNutrition = nutritionLine(listing);

  return (
    <article className={`listing-card ${className}`.trim()}>
      <a className="listing-card__media" href={href} aria-label={`View ${listing.title}`}>
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.imageAlt ?? listing.title} loading="lazy" />
        ) : (
          <span className="listing-card__placeholder" aria-hidden="true">🥕</span>
        )}
        <span className="listing-card__price">{formatPrice(listing.price)}</span>
        {listing.originalValue != null && (
          <span className="listing-card__value">was ${listing.originalValue.toFixed(2)}</span>
        )}
      </a>
      <div className="listing-card__body">
        <h3><a href={href}>{listing.title}</a></h3>
        <p className="listing-card__vendor">{listing.vendorName}{listing.partnerTier && <span className="partner-chip" title={`SAVR ${listing.partnerTier}`}>★ {listing.partnerTier.replace(" Partner", "")} partner</span>}</p>
        {sponsorShare(listing) > 0 && (
          <p className="listing-card__sponsor">Sponsor covers ${sponsorShare(listing).toFixed(2)} · {listing.vendorName} is paid ${listing.vendorPrice?.toFixed(2)}</p>
        )}
        {estimatedNutrition && (
          <p className="listing-card__nutrition"><span>Estimated</span>{estimatedNutrition}</p>
        )}
        {(listing.category || listing.tags?.length) && (
          <ul className="tag-list" aria-label="Listing categories">
            {listing.category && <li>{listing.category}</li>}
            {listing.tags?.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        )}
        <div className="listing-card__meta">
          <span aria-label={`${listing.quantityRemaining} remaining`}>◉ {listing.quantityRemaining} left</span>
          <span aria-label={`Pickup ${listing.pickupWindow}`}>◷ {listing.pickupWindow}</span>
          {listing.distance && <span aria-label={`${listing.distance} away`}>⌖ {listing.distance}</span>}
        </div>
      </div>
    </article>
  );
}

export default ListingCard;
