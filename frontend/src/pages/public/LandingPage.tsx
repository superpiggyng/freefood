import { ArrowRight, Building2, HandHeart, Leaf, Store } from "lucide-react";
import ListingCard, { type FoodListing } from "../../components/ListingCard";
import SponsorMarquee from "../../components/SponsorMarquee";

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

const impactCards = [
  { key: "peopleHelped", icon: HandHeart, label: "people helped this week" },
  { key: "businesses", icon: Store, label: "local businesses listing" },
  { key: "foodRescued", icon: Leaf, label: "food rescued this week" },
  { key: "co2Avoided", icon: Building2, label: "CO₂ avoided this week" },
] as const;

export function LandingPage({ featuredListings = [], heroImageUrl, impact = {} }: LandingPageProps) {
  const stats = { ...defaultImpact, ...impact };

  return (
    <main className="page-home" id="main-content">
      <section className="hero page-shell" aria-labelledby="hero-title">
        <div className="hero__content">
          <p className="eyebrow">Local food. Local impact.</p>
          <h1 id="hero-title">Good food shouldn’t go to waste when someone nearby needs it.</h1>
          <p className="hero__lead">SAVR connects surplus food from local businesses with the people who need it most, matched fairly by household need rather than first come, first served.</p>
          <div className="button-row">
            <a className="button button--primary" href="/register">Get food support <ArrowRight size={17} /></a>
            <a className="button button--secondary" href="/vendors/signup">Business signup</a>
          </div>
          <p className="hero__choice-note">Recipients create a personal account. Businesses create a vendor account. Everyone logs in from the same portal.</p>
          <dl className="hero__proof">
            <div><dt>People helped</dt><dd>{stats.peopleHelped}</dd></div>
            <div><dt>Businesses</dt><dd>{stats.businesses}</dd></div>
            <div><dt>Food rescued</dt><dd>{stats.foodRescued}</dd></div>
          </dl>
        </div>
        <div className="hero__visual">
          <div className="hero__frame">
            {heroImageUrl && <img src={heroImageUrl} alt="" />}
          </div>
        </div>
      </section>

      <SponsorMarquee label="Sponsored by" />

      <section className="section page-shell" aria-labelledby="impact-title">
        <h2 className="sr-only" id="impact-title">Community impact</h2>
        <div className="impact-cards">
          {impactCards.map(({ key, icon: Icon, label }) => (
            <article className="impact-card" key={key}>
              <span aria-hidden="true"><Icon size={18} /></span>
              <strong>{stats[key]}</strong>
              <small>{label}</small>
            </article>
          ))}
        </div>
      </section>

      {featuredListings.length > 0 && (
        <section className="section section--flush page-shell" aria-labelledby="nearby-title">
          <div className="section-heading">
            <div><p className="eyebrow">Available today</p><h2 id="nearby-title">Good food near you</h2></div>
            <a href="/marketplace">Browse all <ArrowRight size={15} /></a>
          </div>
          <div className="listing-grid">{featuredListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
        </section>
      )}

      <section className="section section--tint" aria-labelledby="how-title">
        <div className="page-shell">
          <div className="section-heading section-heading--center"><div><p className="eyebrow">Simple and fair</p><h2 id="how-title">How SAVR works</h2></div></div>
          <ol className="steps">
            <li><span>1</span><h3>Tell us what you need</h3><p>Share your household needs, dietary preferences and how far you can travel.</p></li>
            <li><span>2</span><h3>Find local food</h3><p>Browse fresh surplus from trusted businesses in your community, priced from free.</p></li>
            <li><span>3</span><h3>Request and collect</h3><p>Requests are matched fairly by need. Collect at your confirmed pickup time.</p></li>
          </ol>
        </div>
      </section>

      <section className="section page-shell" aria-labelledby="signup-path-title">
        <div className="section-heading section-heading--center"><div><p className="eyebrow">Choose your path</p><h2 id="signup-path-title">Create the right SAVR account</h2></div></div>
        <div className="signup-paths">
          <article>
            <span aria-hidden="true"><HandHeart size={19}/></span>
            <h3>Recipient account</h3>
            <p>For individuals and families looking for affordable surplus food nearby.</p>
            <a className="button button--primary" href="/register">Get food support</a>
          </article>
          <article>
            <span aria-hidden="true"><Store size={19}/></span>
            <h3>Business account</h3>
            <p>For cafes, restaurants, grocers and bakeries listing food that would otherwise be wasted.</p>
            <a className="button button--secondary" href="/vendors/signup">List surplus food</a>
          </article>
        </div>
      </section>

      <section className="section page-shell" aria-labelledby="funding-title">
        <div className="section-heading section-heading--center"><div><p className="eyebrow">How it is paid for</p><h2 id="funding-title">Corporate impact budgets become guaranteed demand</h2></div></div>
        <div className="funding-split">
          <div className="funding-flow">
            <div className="funding-flow__row"><span>Restaurant lists a surplus meal</span><strong>$6.00</strong></div>
            <div className="funding-flow__pair"><div><small>You pay</small><strong>$1.00</strong></div><div><small>Sponsor covers</small><strong>$5.00</strong></div></div>
            <div className="funding-flow__row funding-flow__row--result"><span>Restaurant is paid in full</span><strong>$6.00</strong></div>
          </div>
          <ul className="funding-points">
            <li><strong>Restaurants earn</strong> on food that would have been binned, cut disposal costs, and get community partner status and featured placement.</li>
            <li><strong>Enterprises fund</strong> something countable, like 1,000 meals in Western Sydney, and get a live dashboard of meals, suburbs, partners and dollars delivered.</li>
            <li><strong>People pay</strong> a capped $1 to $2 for real food from normal shops, with allergen and dietary filtering built in.</li>
          </ul>
        </div>
      </section>

      <section className="sponsor-band" aria-labelledby="sponsor-band-title">
        <div className="page-shell sponsor-band__inner">
          <div><p className="eyebrow">For enterprises</p><h2 id="sponsor-band-title">Fund 1,000 meals in your community</h2><p>Turn your CSR budget into meals people actually collect, reported suburb by suburb.</p></div>
          <div className="button-row"><a className="button button--primary" href="/sponsors">Become a sponsor <ArrowRight size={17} /></a><a className="button button--secondary" href="/vendor/partner">Partner with us</a></div>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
