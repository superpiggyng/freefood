import { useState, type FormEvent } from 'react';
import { ArrowRight, BadgeCheck, Building2, HandCoins, Store, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { savePledge } from '../../lib/sponsorship';
import { suburbImpact } from '../../data/sponsors';

const SUBSIDY_PER_MEAL = 5;

export default function SponsorsPage() {
  const navigate = useNavigate();
  const [sponsor, setSponsor] = useState('');
  const [meals, setMeals] = useState(1000);
  const [suburb, setSuburb] = useState('Western Sydney');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    savePledge({ id: `pledge-${Date.now()}`, sponsor: sponsor || 'Your organisation', meals, suburb, budget: meals * SUBSIDY_PER_MEAL, createdAt: new Date().toISOString() });
    navigate('/sponsor');
  };

  return <main className="page-home sponsors-page" id="main-content">
    <section className="hero page-shell" aria-labelledby="sponsors-title">
      <div className="hero__content">
        <p className="eyebrow">For enterprises</p>
        <h1 id="sponsors-title">We turn corporate social-impact budgets into guaranteed demand for restaurant surplus food.</h1>
        <p className="hero__lead">Instead of donating into a black box, fund something countable: 1,000 meals in Western Sydney. Restaurants get paid for food they would have binned, people get affordable food with dignity, and you get a dashboard you can put in your annual report.</p>
        <div className="button-row"><a className="button button--primary" href="#fund">Fund meals <ArrowRight size={16}/></a><a className="button button--secondary" href="/sponsor">See a live dashboard</a></div>
      </div>
      <div className="hero__visual hero__visual--model" aria-label="How the funding split works">
        <div className="model-flow">
          <div className="model-flow__row"><span>Restaurant lists surplus meal</span><strong>$6.00</strong></div>
          <div className="model-flow__split">
            <div><small>Recipient pays</small><strong>$1.00</strong></div>
            <div><small>Sponsor covers</small><strong>$5.00</strong></div>
          </div>
          <div className="model-flow__row model-flow__row--result"><span>Restaurant receives</span><strong>$6.00</strong></div>
          <p>No goodwill required. The business is made whole, so surplus food is worth listing every single day.</p>
        </div>
      </div>
    </section>

    <section className="section page-shell" aria-labelledby="incentives-title">
      <div className="section-heading section-heading--center"><div><p className="eyebrow">Three sides, three concrete incentives</p><h2 id="incentives-title">Everyone gets something real</h2></div></div>
      <div className="incentive-grid">
        <article className="incentive-card"><span><Store size={20}/></span><h3>Restaurants and grocers</h3><p>Revenue on food that was going in the bin, lower disposal costs, and no donation guilt. Plus featured placement and a community partner badge that customers can see.</p><ul><li>Paid in full for every serve</li><li>Lower waste collection costs</li><li>Community partner status and marketing kit</li></ul><a href="/vendor/partner">See partner status <ArrowRight size={14}/></a></article>
        <article className="incentive-card incentive-card--lead"><span><Building2 size={20}/></span><h3>Enterprises</h3><p>Measurable CSR and ESG impact instead of a vague donation. Fund a specific number of meals in a specific place and watch it get delivered.</p><ul><li>Meals funded and delivered, live</li><li>Participating restaurants and suburbs reached</li><li>Total dollar value delivered, exportable</li></ul><a href="/sponsor">Open the dashboard <ArrowRight size={14}/></a></article>
        <article className="incentive-card"><span><Users size={20}/></span><h3>People who need food</h3><p>Significantly cheaper or free food from normal restaurants and grocers, chosen from a marketplace like anyone else — not queued at a relief centre.</p><ul><li>Capped contribution, usually $1 to $2</li><li>Dietary and allergen filtering built in</li><li>Nobody at the counter sees your status</li></ul><a href="/marketplace">Browse food <ArrowRight size={14}/></a></article>
      </div>
    </section>

    <section className="section section--tint" aria-labelledby="reach-title">
      <div className="page-shell">
        <div className="section-heading"><div><p className="eyebrow">Live network</p><h2 id="reach-title">Where funded meals are landing</h2></div><a href="/sponsor">Full breakdown <ArrowRight size={14}/></a></div>
        <div className="reach-grid">{suburbImpact.map((row) => <article className="reach-card" key={row.suburb}><h3>{row.suburb}</h3><strong>{row.meals}</strong><small>meals delivered · {row.restaurants} partners</small></article>)}</div>
      </div>
    </section>

    <section className="section page-shell" id="fund" aria-labelledby="fund-title">
      <div className="fund-layout">
        <div>
          <p className="eyebrow">Start a campaign</p>
          <h2 id="fund-title">Fund meals in a suburb you care about</h2>
          <p>Pick a number and a place. We route the funding to community partners in that area, cap what each person pays, and report back on every meal delivered.</p>
          <ul className="fund-points">
            <li><BadgeCheck size={16}/> Your logo on the partner map and in restaurant impact reports</li>
            <li><BadgeCheck size={16}/> Suburb-level reporting for CSR and ESG disclosures</li>
            <li><BadgeCheck size={16}/> Unused funding is never lost — it rolls into the next window</li>
          </ul>
        </div>
        <form className="fund-card" onSubmit={submit}>
          <label className="form-field">Organisation<input value={sponsor} onChange={(event) => setSponsor(event.target.value)} placeholder="Atlas Bank"/></label>
          <label className="form-field">Meals to fund<input type="number" min={100} step={50} value={meals} onChange={(event) => setMeals(Number(event.target.value))}/></label>
          <label className="form-field">Where<select value={suburb} onChange={(event) => setSuburb(event.target.value)}>{['Western Sydney', ...suburbImpact.map((row) => row.suburb)].map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="fund-total"><HandCoins size={18}/><span><small>Your commitment</small><strong>${(meals * SUBSIDY_PER_MEAL).toLocaleString()}</strong></span><small>${SUBSIDY_PER_MEAL.toFixed(2)} subsidy per meal</small></div>
          <button className="button button--primary button--wide" type="submit">Create campaign</button>
          <p className="fine-print">Demo commitment. Nothing is charged.</p>
        </form>
      </div>
    </section>
  </main>;
}
