import { Building2, Download, MapPin, Utensils } from 'lucide-react';
import { useMemo } from 'react';
import { DashboardShell, MetricCard, StatusBadge, type DashboardNavItem } from '../../components/dashboard/DashboardShell';
import { campaigns, partnerVendors, sponsorProfile, suburbImpact, weeklyDelivery } from '../../data/sponsors';
import { loadPledges } from '../../lib/sponsorship';

const nav: DashboardNavItem[] = [
  { label: 'Impact', icon: '▦', href: '/sponsor', active: true }, { label: 'Campaigns', icon: '▣', href: '/sponsor#campaigns' },
  { label: 'Restaurants', icon: '♧', href: '/sponsor#restaurants' }, { label: 'Suburbs', icon: '⌖', href: '/sponsor#suburbs' },
  { label: 'Reports', icon: '$', href: '/sponsor#reports' }, { label: 'Fund meals', icon: '＋', href: '/sponsors#fund' },
];

const currency = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value);

export default function SponsorDashboard() {
  const pledges = useMemo(() => loadPledges(), []);
  const allCampaigns = [...pledges.map((pledge) => ({ id: pledge.id, sponsor: pledge.sponsor, name: `${pledge.meals.toLocaleString()} meals in ${pledge.suburb}`, suburb: pledge.suburb, mealsFunded: pledge.meals, mealsDelivered: 0, budget: pledge.budget, spent: 0, restaurants: 0, status: 'Starting' as const })), ...campaigns];

  const funded = allCampaigns.reduce((sum, item) => sum + item.mealsFunded, 0);
  const delivered = allCampaigns.reduce((sum, item) => sum + item.mealsDelivered, 0);
  const spent = allCampaigns.reduce((sum, item) => sum + item.spent, 0);
  const valueDelivered = suburbImpact.reduce((sum, item) => sum + item.value, 0);

  const downloadReport = () => {
    const rows = [['Campaign', 'Suburb', 'Meals funded', 'Meals delivered', 'Budget AUD', 'Spent AUD', 'Restaurants'], ...allCampaigns.map((item) => [item.name, item.suburb, item.mealsFunded, item.mealsDelivered, item.budget, item.spent, item.restaurants])];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'savr-impact-report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return <DashboardShell productLabel="for Sponsors" navItems={nav} userName={sponsorProfile.name} userRole={sponsorProfile.contact}>
    <header className="dashboard-heading"><div><h1>{sponsorProfile.program}</h1><p>Every dollar becomes guaranteed demand for surplus food at a local business.</p></div><a className="button button--primary" href="/sponsors#fund">Fund more meals</a></header>

    <section className="metric-grid metric-grid--six" aria-label="Program impact">
      <MetricCard label="Meals funded" value={funded.toLocaleString()} detail="Committed"/>
      <MetricCard label="Meals delivered" value={delivered.toLocaleString()} detail={`${Math.round((delivered / funded) * 100)}% of commitment`}/>
      <MetricCard label="Restaurants paid" value={String(partnerVendors.length * 4)} detail="Local businesses"/>
      <MetricCard label="Suburbs reached" value={String(suburbImpact.length)} detail="Greater Sydney"/>
      <MetricCard label="Value delivered" value={currency(valueDelivered)} detail="Retail value of food"/>
      <MetricCard label="Cost per meal" value={delivered ? `$${(spent / delivered).toFixed(2)}` : '—'} detail="Sponsor contribution"/>
    </section>

    <div className="dashboard-columns">
      <section className="dashboard-panel" id="campaigns"><div className="panel-heading"><h2>Your campaigns</h2><a href="/sponsors#fund">Start another</a></div>
        <div className="campaign-list">{allCampaigns.map((campaign) => {
          const percent = Math.round((campaign.mealsDelivered / campaign.mealsFunded) * 100);
          return <article className="campaign-row" key={campaign.id}>
            <div className="campaign-row__head"><div><h3>{campaign.name}</h3><p><MapPin size={12}/> {campaign.suburb} · {campaign.restaurants} restaurants</p></div><StatusBadge tone={campaign.status === 'Active' ? 'positive' : campaign.status === 'Starting' ? 'neutral' : 'warning'}>{campaign.status}</StatusBadge></div>
            <div className="progress-bar"><span style={{ width: `${percent}%` }}/></div>
            <p className="campaign-row__meta"><strong>{campaign.mealsDelivered.toLocaleString()}</strong> of {campaign.mealsFunded.toLocaleString()} meals delivered · {currency(campaign.spent)} of {currency(campaign.budget)} used</p>
          </article>;
        })}</div>
      </section>

      <section className="dashboard-panel"><div className="panel-heading"><h2>Meals delivered per week</h2><span>Last 8 weeks</span></div>
        <div className="chart-bars" aria-hidden="true">{weeklyDelivery.map((value, index) => <span key={index} style={{ height: `${(value / Math.max(...weeklyDelivery)) * 100}%` }}/>)}</div>
        <p className="chart-caption">{weeklyDelivery[weeklyDelivery.length - 1]} meals last week, up from {weeklyDelivery[0]} eight weeks ago.</p>
      </section>
    </div>

    <div className="dashboard-columns">
      <section className="dashboard-panel" id="suburbs"><div className="panel-heading"><h2><MapPin size={14}/> Where the meals landed</h2></div>
        <div className="table-scroll"><table className="data-table"><thead><tr><th scope="col">Suburb</th><th scope="col">Meals</th><th scope="col">Restaurants</th><th scope="col">Retail value</th></tr></thead><tbody>{suburbImpact.map((row) => <tr key={row.suburb}><td>{row.suburb}</td><td>{row.meals}</td><td>{row.restaurants}</td><td>{currency(row.value)}</td></tr>)}</tbody></table></div>
      </section>
      <section className="dashboard-panel" id="restaurants"><div className="panel-heading"><h2><Utensils size={14}/> Community partners you funded</h2></div>
        <div className="table-scroll"><table className="data-table"><thead><tr><th scope="col">Business</th><th scope="col">Suburb</th><th scope="col">Meals rescued</th><th scope="col">Paid to business</th></tr></thead><tbody>{partnerVendors.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.suburb}</td><td>{row.mealsRescued}</td><td>{currency(row.earnings)}</td></tr>)}</tbody></table></div>
      </section>
    </div>

    <section className="dashboard-panel sponsor-report" id="reports">
      <div><h2><Building2 size={16}/> CSR and ESG reporting</h2><p>Export meals funded, meals delivered, participating businesses, suburbs reached and total retail value for your sustainability and community reporting.</p></div>
      <button className="button button--secondary" type="button" onClick={downloadReport}><Download size={15}/> Download impact report</button>
    </section>
  </DashboardShell>;
}
