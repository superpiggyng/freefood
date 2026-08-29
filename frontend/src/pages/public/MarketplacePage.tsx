import { useMemo, useState, type FormEvent } from "react";
import ListingCard, { type FoodListing } from "../../components/ListingCard";

export interface MarketplaceCategory { slug: string; name: string }

interface MarketplacePageProps {
  listings?: FoodListing[];
  categories?: MarketplaceCategory[];
  initialLocation?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  showLocationSearch?: boolean;
  resultLabel?: string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
}

export function MarketplacePage({
  listings = [],
  categories = [],
  initialLocation = "",
  eyebrow = "Nearby food marketplace",
  title = "Food near you",
  description = "Fresh surplus food, ready to be rescued.",
  showLocationSearch = true,
  resultLabel = "listings available",
  searchPlaceholder = "Search food, stores, or categories…",
  emptyTitle = "No food matches those filters yet",
  emptyMessage = "Try widening your location or removing a filter. New food is added throughout the day.",
  emptyActionLabel = "Clear filters",
  emptyActionHref,
}: MarketplacePageProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState(initialLocation);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("nearest");

  const results = useMemo(() => listings.filter((listing) => {
    const matchesQuery = `${listing.title} ${listing.vendorName} ${listing.category ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === "all" || listing.category?.toLowerCase() === category.toLowerCase());
  }), [category, listings, query]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

  return (
    <main className="page-shell marketplace" id="main-content">
      <header className="marketplace__header">
        <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
        {showLocationSearch && (
          <form className="location-picker" onSubmit={submitSearch} role="search">
            <label htmlFor="location">Your location</label>
            <input id="location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Suburb or postcode" />
            <button className="button button--secondary" type="submit">Update</button>
          </form>
        )}
      </header>

      <form className="browse-tools" onSubmit={submitSearch} role="search">
        <div className="search-field">
          <label className="sr-only" htmlFor="food-search">Search food, stores, or categories</label>
          <span aria-hidden="true">⌕</span>
          <input id="food-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} />
        </div>
        <label className="sort-field" htmlFor="sort">Sort
          <select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="nearest">Nearest</option><option value="pickup">Pickup soonest</option><option value="quantity">Most available</option>
          </select>
        </label>
        <button className="button button--primary" type="submit">Search</button>
      </form>

      <nav className="filter-chips" aria-label="Filter listings">
        <button className={`chip ${category === "all" ? "chip--active" : ""}`} type="button" onClick={() => setCategory("all")} aria-pressed={category === "all"}>All</button>
        {categories.map((item) => (
          <button key={item.slug} className={`chip ${category === item.slug ? "chip--active" : ""}`} type="button" onClick={() => setCategory(item.slug)} aria-pressed={category === item.slug}>{item.name}</button>
        ))}
      </nav>

      <div className="results-heading"><p><strong>{results.length}</strong> {resultLabel}{showLocationSearch && location ? ` near ${location}` : ""}</p></div>
      {results.length ? (
        <section className="listing-grid" aria-label="Available food">{results.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</section>
      ) : (
        <section className="empty-state" aria-live="polite"><span aria-hidden="true">🥕</span><h2>{emptyTitle}</h2><p>{emptyMessage}</p>{emptyActionHref ? <a className="button button--primary" href={emptyActionHref}>{emptyActionLabel}</a> : <button className="button button--primary" type="button" onClick={() => { setQuery(""); setCategory("all"); }}>{emptyActionLabel}</button>}</section>
      )}
    </main>
  );
}

export default MarketplacePage;
