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
}

interface ListingCardProps {
  listing: FoodListing;
  href?: string;
  className?: string;
}

const formatPrice = (price: number) =>
  price === 0 ? "Free" : new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(price);

export function ListingCard({ listing, href = `/marketplace/${listing.id}`, className = "" }: ListingCardProps) {
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
        <p className="listing-card__vendor">{listing.vendorName}</p>
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
