import { useState } from 'react';
import { Award, Copy, Megaphone, Star, TrendingUp } from 'lucide-react';
import { DashboardShell, MetricCard, StatusBadge, type DashboardNavItem } from '../../components/dashboard/DashboardShell';
import { currentVendor } from '../../data/sponsors';
import { tierFor, tierLadder } from '../../lib/sponsorship';

const nav: DashboardNavItem[] = [
  { label: 'Dashboard', icon: '▦', href: '/vendor' }, { label: 'Upload stock', icon: '⇪', href: '/vendor/upload' },
  { label: 'Requests', icon: '♡', href: '/vendor/allocations' }, { label: 'Partner status', icon: '★', href: '/vendor/partner', active: true },
  { label: 'Marketplace', icon: '⌖', href: '/marketplace' },
];

const badgeSnippet = '<a href="https://savr.app/partners/bakers-lane"><img src="https://savr.app/badge/silver.svg" alt="SAVR Silver Community Partner"></a>';

export default function VendorPartnerStatus() {
  const [copied, setCopied] = useState(false);
  const { current, next, progress } = tierFor(currentVendor.mealsRescued);
  const disposalSaved = Math.round(currentVendor.mealsRescued * 0.42);

  const copyBadge = () => { navigator.clipboard?.writeText(badgeSnippet); setCopied(true); };

  return <DashboardShell productLabel="for Business" navItems={nav} userName={currentVendor.name} userRole={current?.tier ?? 'View profile'}>
    <header className="dashboard-heading"><div><h1>Community partner status</h1><p>Listing surplus food earns status, placement and marketing — on top of what the sponsor fund pays you.</p></div><a className="button button--primary" href="/vendor/upload">Upload today’s stock</a></header>

    <section className="partner-banner">
      <div className="partner-badge"><Award size={30}/><strong>{current?.tier ?? 'Not yet ranked'}</strong><small>{currentVendor.suburb} · since {currentVendor.joined}</small></div>
      <div className="partner-progress">
        <p><strong>{currentVendor.mealsRescued}</strong> meals rescued{next && <> · {next.meals - currentVendor.mealsRescued} more to reach <strong>{next.tier}</strong></>}</p>
        <div className="progress-bar"><span style={{ width: `${progress}%` }}/></div>
        <p className="partner-progress__note">{currentVendor.sponsoredShare}% of your listings were sponsor-funded this month, so recipients paid a capped contribution and you were still paid in full.</p>
      </div>
    </section>

    <section className="metric-grid" aria-label="Partner performance">
      <MetricCard label="Meals rescued" value={String(currentVendor.mealsRescued)} detail="All time"/>
      <MetricCard label="Revenue recovered" value={`$${currentVendor.earnings.toLocaleString()}`} detail="Food that would have been binned"/>
      <MetricCard label="Sponsor-funded" value={`${currentVendor.sponsoredShare}%`} detail="Of listings this month"/>
      <MetricCard label="Disposal saved" value={`$${disposalSaved}`} detail="Estimated waste collection"/>
      <MetricCard label="Placement" value={progress > 60 ? 'Featured' : 'Standard'} detail={`Top of ${currentVendor.suburb} results`}/>
    </section>

    <div className="dashboard-columns">
      <section className="dashboard-panel"><div className="panel-heading"><h2><Star size={14}/> Status ladder</h2></div>
        <ol className="tier-ladder">{tierLadder.map((step) => {
          const earned = currentVendor.mealsRescued >= step.meals;
          return <li className={earned ? 'is-earned' : undefined} key={step.tier}>
            <div><h3>{step.tier}</h3><StatusBadge tone={earned ? 'positive' : 'neutral'}>{earned ? 'Earned' : `${step.meals} meals`}</StatusBadge></div>
            <ul>{step.perks.map((perk) => <li key={perk}>{perk}</li>)}</ul>
          </li>;
        })}</ol>
      </section>

      <section className="dashboard-panel"><div className="panel-heading"><h2><Megaphone size={14}/> Marketing kit</h2></div>
        <p className="panel-copy">Show customers you feed your neighbourhood instead of the bin. Every asset links back to your live partner profile.</p>
        <div className="kit-badge"><Award size={22}/><div><strong>SAVR {current?.tier ?? 'Community Partner'}</strong><small>{currentVendor.name} · {currentVendor.mealsRescued} meals rescued</small></div></div>
        <label className="form-field">Embed on your site<textarea rows={3} readOnly value={badgeSnippet}/></label>
        <button className="button button--secondary" type="button" onClick={copyBadge}><Copy size={14}/> {copied ? 'Copied' : 'Copy embed code'}</button>
        <ul className="kit-list"><li>Window sticker, posted free at Silver</li><li>Social card with your monthly meal count</li><li>Named in sponsor impact reports at Gold</li></ul>
      </section>
    </div>

    <section className="dashboard-panel partner-cta"><div><h2><TrendingUp size={16}/> Sponsor demand in {currentVendor.suburb}</h2><p>Atlas Bank has funded 316 unclaimed meals in your area this month. Listings you publish today are subsidised automatically.</p></div><a className="button button--primary" href="/vendor/upload">List surplus now</a></section>
  </DashboardShell>;
}
