import ListingCard, { type FoodListing } from "../../components/ListingCard";

export interface ImpactStats {
  peopleHelped: string;
  businesses: string;
  foodRescued: string;
  co2Avoided: string;
}

interface LandingPageProps {
  featuredListings?: FoodListing[];
  heroImageUrl?: string;
  impact?: Partial<ImpactStats>;
}

const defaultImpact: ImpactStats = {
  peopleHelped: "12,540",
  businesses: "1,285",
  foodRescued: "25,860 kg",
  co2Avoided: "62,340 kg",
};

export function LandingPage({ featuredListings = [], heroImageUrl, impact = {} }: LandingPageProps) {
  const stats = { ...defaultImpact, ...impact };

  return (
    <main className="page-home" id="main-content">
      <section className="hero page-shell" aria-labelledby="hero-title">
        <div className="hero__content">
          <p className="eyebrow">Local food. Local impact.</p>
          <h1 id="hero-title">Good food shouldn’t go to waste when someone nearby needs it.</h1>
          <p className="hero__lead">SAVR connects surplus food from local businesses with people who need it most. Fairly matched by need, not first come first served.</p>
          <div className="button-row">
            <a className="button button--primary" href="/marketplace">Find food <span aria-hidden="true">→</span></a>
            <a className="button button--secondary" href="/vendors/signup">List surplus food <span aria-hidden="true">↗</span></a>
          </div>
          <p className="trust-note"><span aria-hidden="true">✓</span> Fairly matched by household need</p>
        </div>
        <div className="hero__visual" aria-hidden="true">
          {heroImageUrl ? <img src={heroImageUrl} alt="" /> : (
            <><div className="hero__produce">🥬 🥕 🥖 🍅</div><div className="hero__bag"><span>♥</span></div></>
          )}
        </div>
      </section>

      <section className="impact-strip" aria-label="Community impact">
        <div className="page-shell impact-strip__grid">
          <div><span aria-hidden="true">♧</span><strong>{stats.peopleHelped}</strong><small>people helped this week</small></div>
          <div><span aria-hidden="true">▦</span><strong>{stats.businesses}</strong><small>local businesses</small></div>
          <div><span aria-hidden="true">☁</span><strong>{stats.foodRescued}</strong><small>food rescued this week</small></div>
          <div><span aria-hidden="true">♧</span><strong>{stats.co2Avoided}</strong><small>CO₂ avoided this week</small></div>
        </div>
      </section>

      {featuredListings.length > 0 && (
        <section className="section page-shell" aria-labelledby="nearby-title">
          <div className="section-heading">
            <div><p className="eyebrow">Available today</p><h2 id="nearby-title">Good food near you</h2></div>
            <a href="/marketplace">Browse all <span aria-hidden="true">→</span></a>
          </div>
          <div className="listing-grid">{featuredListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
        </section>
      )}

      <section className="section section--tint" aria-labelledby="how-title">
        <div className="page-shell">
          <div className="section-heading section-heading--center"><div><p className="eyebrow">Simple and fair</p><h2 id="how-title">How SAVR works</h2></div></div>
          <ol className="steps">
            <li><span>1</span><h3>Tell us what you need</h3><p>Share your household needs, dietary preferences and travel distance.</p></li>
            <li><span>2</span><h3>Find local food</h3><p>Explore fresh surplus from trusted businesses in your community.</p></li>
            <li><span>3</span><h3>Request and collect</h3><p>We match requests fairly. Collect at your confirmed pickup time.</p></li>
          </ol>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
