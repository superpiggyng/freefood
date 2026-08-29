import { useMemo, useState, type FormEvent } from "react";
import ListingCard, { type FoodListing } from "../../components/ListingCard";

export interface MarketplaceCategory { slug: string; name: string }

interface MarketplacePageProps {
  listings?: FoodListing[];
  categories?: MarketplaceCategory[];
  initialLocation?: string;
}

export function MarketplacePage({ listings = [], categories = [], initialLocation = "" }: MarketplacePageProps) {
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
        <div><p className="eyebrow">Nearby food marketplace</p><h1>Food near you</h1><p>Fresh surplus food, ready to be rescued.</p></div>
        <form className="location-picker" onSubmit={submitSearch} role="search">
          <label htmlFor="location">Your location</label>
          <input id="location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Suburb or postcode" />
          <button className="button button--secondary" type="submit">Update</button>
        </form>
      </header>

      <form className="browse-tools" onSubmit={submitSearch} role="search">
        <div className="search-field">
          <label className="sr-only" htmlFor="food-search">Search food, stores, or categories</label>
          <span aria-hidden="true">⌕</span>
          <input id="food-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search food, stores, or categories…" />
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

      <div className="results-heading"><p><strong>{results.length}</strong> listings available{location && ` near ${location}`}</p></div>
      {results.length ? (
        <section className="listing-grid" aria-label="Available food">{results.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</section>
      ) : (
        <section className="empty-state" aria-live="polite"><span aria-hidden="true">🥕</span><h2>No food matches those filters yet</h2><p>Try widening your location or removing a filter. New food is added throughout the day.</p><button className="button button--primary" type="button" onClick={() => { setQuery(""); setCategory("all"); }}>Clear filters</button></section>
      )}
    </main>
  );
}

export default MarketplacePage;
