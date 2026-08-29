import ListingCard, { type FoodListing } from '../../components/ListingCard';

interface LandingPageProps { featuredListings?: FoodListing[]; heroImageUrl?: string }

const foodCircles = [
  { icon: '🥬', label: 'Fresh produce', tone: 'leaf' },
  { icon: '🥖', label: 'Bakery', tone: 'butter' },
  { icon: '🍲', label: 'Ready meals', tone: 'tomato' },
  { icon: '🥫', label: 'Pantry', tone: 'blue' },
];

export default function LandingPage({ featuredListings = [], heroImageUrl = '/savr-vegetable-hero.png' }: LandingPageProps) {
  return <main className="indie-home" id="main-content">
    <div className="rescue-ticker" aria-label="SAVR values"><div><span>GOOD FOOD</span><b>✿</b><span>LOCAL PEOPLE</span><b>✦</b><span>LESS WASTE</span><b>✿</b><span>FAIR SHARING</span><b>✦</b><span>GOOD FOOD</span></div></div>

    <section className="indie-hero page-shell">
      <div className="indie-hero__copy"><p className="scribble-label">Food belongs on plates</p><h1>Good food,<br/><em>shared nearby.</em></h1><p>Find surplus groceries and meals from local businesses. Request what helps, then collect it close to home.</p><div className="button-row"><a className="doodle-button doodle-button--tomato" href="/marketplace">Find food <span>→</span></a><a className="doodle-button" href="/vendor">Share surplus</a></div><div className="hero-proof"><span>12,540 people helped</span><span>25,860 kg rescued</span></div></div>
      <div className="indie-hero__art"><img src={heroImageUrl} alt="Hand-drawn basket filled with vegetables and bread"/><span className="art-sticker art-sticker--top">Fresh today</span><span className="art-sticker art-sticker--bottom">Pick up nearby</span></div>
    </section>

    <section className="food-orbit page-shell" aria-labelledby="browse-kind"><header><p className="scribble-label">Browse by what you need</p><h2 id="browse-kind">A little bit of everything</h2></header><div className="food-orbit__grid">{foodCircles.map((item) => <a className={`food-circle food-circle--${item.tone}`} href={`/marketplace?category=${item.label}`} key={item.label}><span>{item.icon}</span><strong>{item.label}</strong><small>See what is nearby</small></a>)}</div></section>

    {featuredListings.length > 0 && <section className="indie-collection"><div className="page-shell"><div className="indie-heading"><div><p className="scribble-label">Available today</p><h2>Rescue something good</h2></div><a href="/marketplace">See everything →</a></div><div className="listing-grid indie-listing-grid">{featuredListings.slice(0, 3).map((listing) => <ListingCard key={listing.id} listing={listing}/>)}</div></div></section>}

    <section className="indie-steps page-shell"><div className="tomato-doodle" aria-hidden="true">🍅</div><div className="indie-heading"><div><p className="scribble-label">No complicated bits</p><h2>Three small steps</h2></div></div><ol><li><span>01</span><div><h3>Look around</h3><p>See food available from trusted businesses near you.</p></div></li><li><span>02</span><div><h3>Make a request</h3><p>Tell us what would help. Matching stays fair when demand is high.</p></div></li><li><span>03</span><div><h3>Pick it up</h3><p>Get a collection time and bring your pickup code.</p></div></li></ol></section>

    <section className="vendor-poster"><div className="page-shell"><div><p className="scribble-label">For local businesses</p><h2>Today’s extras can be someone’s dinner.</h2><p>List surplus in a minute, reduce waste and support your neighbourhood.</p><a className="doodle-button doodle-button--cream" href="/vendor">Start sharing food →</a></div><div className="poster-art" aria-hidden="true"><span>🥕</span><span>🍅</span><span>🥦</span><span>🥖</span></div></div></section>

    <footer className="indie-footer"><div className="page-shell"><div><img src="/savr-icon.png" alt=""/><h2>Stay in the loop</h2><p>New food, useful updates and local impact.</p></div><form onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="community-email">Email address</label><input id="community-email" type="email" placeholder="your@email.com"/><button>Join →</button></form><nav><a href="/marketplace">Find food</a><a href="/vendor">For businesses</a><a href="/requests">My requests</a><a href="/preferences">Preferences</a></nav></div></footer>
  </main>;
}
