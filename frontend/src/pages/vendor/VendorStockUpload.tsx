import { useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertTriangle, Check, CloudUpload, Sparkles, Users } from 'lucide-react';
import { DashboardShell, StatusBadge, type DashboardNavItem } from '../../components/dashboard/DashboardShell';
import { analyseStock, sampleStock, totalServes, totalSponsorCover, totalVendorPayout, type StockMatch } from '../../lib/stockMatching';
import { money } from '../../lib/sponsorship';
import { publishListings } from '../../lib/listingStore';
import type { Listing } from '../../types';
import { currentVendor } from '../../data/sponsors';

const nav: DashboardNavItem[] = [
  { label: 'Dashboard', icon: '▦', href: '/vendor' }, { label: 'Upload stock', icon: '⇪', href: '/vendor/upload', active: true },
  { label: 'Requests', icon: '♡', href: '/vendor/allocations' }, { label: 'Partner status', icon: '★', href: '/vendor/partner' },
  { label: 'Marketplace', icon: '⌖', href: '/marketplace' },
];

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'surplus-item';

const categoryImages: Record<string, string> = {
  Bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
  Groceries: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=85',
  Meals: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
  Snacks: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=85',
};

const toListing = (item: StockMatch, pickupWindow: string, index: number): Listing => ({
  id: Date.now() + index,
  slug: `${slugify(item.name)}-${Date.now().toString(36)}${index}`,
  name: item.name.replace(/^./, (character) => character.toUpperCase()),
  vendor: currentVendor.name,
  category: item.category,
  price: item.split.userPays === 0 ? 'FREE' : `$${item.split.userPays.toFixed(2)}`,
  originalPrice: `$${item.originalValue.toFixed(2)}`,
  image: categoryImages[item.category] ?? categoryImages.Meals,
  tags: [item.category, ...item.tags],
  quantityLeft: item.quantity,
  pickupTime: pickupWindow,
  distance: '0.6 km',
  allergens: item.allergens,
  possibleCrossContact: item.crossContact,
  traits: ['value', item.category === 'Snacks' ? 'lighter' : 'filling'],
  vendorPrice: item.split.vendorReceives,
  sponsored: item.split.sponsored,
  partnerTier: 'Silver Partner',
  description: `Surplus from ${currentVendor.name}, uploaded today and matched to nearby demand.`,
  servings: `${item.quantity} serves`,
});

const fundedSuburbs = ['Marrickville', 'Blacktown', 'Parramatta', 'Auburn'];

export default function VendorStockUpload() {
  const [text, setText] = useState('');
  const [suburb, setSuburb] = useState('Marrickville');
  const [fileName, setFileName] = useState('');
  const [pickupWindow, setPickupWindow] = useState('Today, 5:30 - 6:30 PM');
  const [results, setResults] = useState<StockMatch[] | null>(null);
  const [skipped, setSkipped] = useState<number[]>([]);
  const [published, setPublished] = useState(0);
  const funded = fundedSuburbs.includes(suburb);

  const readFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    file.text().then((contents) => setText(contents.trim()));
  };

  const analyse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPublished(0); setSkipped([]);
    setResults(analyseStock(text.trim() || sampleStock, funded));
  };

  const included = (results ?? []).filter((item) => !skipped.includes(item.id));
  const toggle = (id: number) => setSkipped((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return <DashboardShell productLabel="for Business" navItems={nav} userName="Bakers Lane" userRole="Silver Partner">
    <header className="dashboard-heading"><div><h1>Upload today’s surplus</h1><p>Paste or upload what is left over. SAVR prices it against the sponsor fund and matches it to nearby demand.</p></div><a className="button button--secondary" href="/vendor">Back to overview</a></header>

    <form className="stock-upload" onSubmit={analyse}>
      <section className="dashboard-panel stock-upload__input">
        <div className="panel-heading"><h2>1. What is left over?</h2><button className="button button--quiet button--small" type="button" onClick={() => setText(sampleStock)}>Use today’s POS export</button></div>
        <label className="upload-zone">
          <CloudUpload size={22}/><strong>{fileName || 'Upload a stock list'}</strong><span>CSV or text export from your POS, or drop a photo of the sheet</span>
          <input type="file" accept=".csv,.txt,text/plain" onChange={readFile}/>
        </label>
        <label className="form-field stock-upload__textarea">One item per line
          <textarea rows={7} value={text} onChange={(event) => setText(event.target.value)} placeholder={sampleStock}/>
        </label>
        <div className="stock-upload__controls">
          <label className="form-field">Pickup window<input value={pickupWindow} onChange={(event) => setPickupWindow(event.target.value)}/></label>
          <label className="form-field">Pickup suburb<select value={suburb} onChange={(event) => setSuburb(event.target.value)}>{['Marrickville', 'Blacktown', 'Parramatta', 'Auburn', 'Newtown', 'Liverpool'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="button button--primary" type="submit"><Sparkles size={16}/> Match stock</button>
        </div>
        <p className={funded ? 'fund-status fund-status--on' : 'fund-status'}>{funded ? <><Check size={14}/> Atlas Bank sponsor fund is active in {suburb}. Recipients pay a capped contribution and you are still paid in full.</> : <><AlertTriangle size={14}/> No sponsor fund in {suburb} yet. Listings will be priced as a straight discount.</>}</p>
      </section>

      <section className="dashboard-panel stock-upload__result" aria-live="polite">
        {!results && <div className="stock-empty"><Sparkles size={26}/><h2>Nothing matched yet</h2><p>Add your leftover stock and SAVR will infer the category, dietary tags and declared allergens, then show how many nearby people it suits.</p></div>}
        {results && <>
          <div className="panel-heading"><h2>2. Matched and priced</h2><span>{included.length} of {results.length} selected</span></div>
          <div className="stock-summary">
            <div><small>Serves</small><strong>{totalServes(included)}</strong></div>
            <div><small>People matched</small><strong>{included.length ? Math.max(...included.map((item) => item.matches)) : 0}</strong></div>
            <div><small>You receive</small><strong>{money(totalVendorPayout(included))}</strong></div>
            <div><small>Sponsor covers</small><strong>{money(totalSponsorCover(included))}</strong></div>
          </div>
          <ul className="stock-list">
            {results.map((item) => {
              const off = skipped.includes(item.id);
              return <li className={off ? 'stock-item is-off' : 'stock-item'} key={item.id}>
                <div className="stock-item__head">
                  <div><h3>{item.name}</h3><p>{item.quantity} serves · {item.category}</p></div>
                  <StatusBadge tone={item.confidence === 'High' ? 'positive' : item.confidence === 'Medium' ? 'warning' : 'danger'}>{item.confidence}</StatusBadge>
                </div>
                <ul className="tag-list">{item.tags.map((tag) => <li key={tag}>{tag}</li>)}{item.allergens.map((tag) => <li className="tag--allergen" key={tag}>Contains {tag}</li>)}</ul>
                <div className="price-split" aria-label="Price split">
                  <span><small>Recipient pays</small><strong>{money(item.split.userPays)}</strong></span>
                  <span><small>Sponsor covers</small><strong>{money(item.split.sponsorCovers)}</strong></span>
                  <span className="price-split__total"><small>You receive</small><strong>{money(item.split.vendorReceives)}</strong></span>
                </div>
                <p className="stock-item__demand"><Users size={14}/> <strong>{item.matches}</strong> nearby people can safely eat this · <strong>{item.greatFit}</strong> a great dietary fit</p>
                {item.notes.map((note) => <p className="stock-item__note" key={note}>{note}</p>)}
                <button className="button button--quiet button--small" type="button" onClick={() => toggle(item.id)}>{off ? 'Include' : 'Skip this item'}</button>
              </li>;
            })}
          </ul>
          <button className="button button--primary button--wide" type="button" onClick={() => { publishListings(included.map((item, index) => toListing(item, pickupWindow, index))); setPublished(included.length); }} disabled={!included.length}>Publish {included.length} listing{included.length === 1 ? '' : 's'}</button>
          {published > 0 && <p className="form-success" role="status"><Check size={14}/> {published} listing{published === 1 ? '' : 's'} published and live in the marketplace. Matched recipients in {suburb} are being notified now. <a href="/marketplace">View them</a></p>}
        </>}
      </section>
    </form>
    <p className="stock-method">Categories, dietary tags and pricing are suggestions you can edit. Declared allergens are always shown to recipients and are never inferred away.</p>
  </DashboardShell>;
}
