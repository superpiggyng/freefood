import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertTriangle, Check, CloudUpload, Plus, Sparkles, Trash2, Users } from 'lucide-react';
import { DashboardShell, StatusBadge, type DashboardNavItem } from '../../components/dashboard/DashboardShell';
import { analyseStock, totalServes, totalSponsorCover, totalVendorPayout, type StockMatch } from '../../lib/stockMatching';
import { money } from '../../lib/sponsorship';
import { publishListings } from '../../lib/listingStore';
import type { Listing } from '../../types';
import { currentVendor } from '../../data/sponsors';
import { estimateNutritionFromImage } from '../../lib/api';

const nav: DashboardNavItem[] = [
  { label: 'Dashboard', icon: '▦', href: '/vendor' }, { label: 'Upload stock', icon: '⇪', href: '/vendor/upload', active: true },
  { label: 'Requests', icon: '♡', href: '/vendor/allocations' }, { label: 'Partner status', icon: '★', href: '/vendor/partner' },
  { label: 'My listings', icon: '⌖', href: '/marketplace' },
];

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'surplus-item';

const categoryImages: Record<string, string> = {
  Bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
  Groceries: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=85',
  Meals: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
  Snacks: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=85',
};

const toListing = (item: StockMatch, pickupWindow: string, index: number, listingImageUrl?: string): Listing => ({
  id: Date.now() + index,
  slug: `${slugify(item.name)}-${Date.now().toString(36)}${index}`,
  name: item.name.replace(/^./, (character) => character.toUpperCase()),
  vendor: currentVendor.name,
  category: item.category,
  price: item.split.userPays === 0 ? 'FREE' : `$${item.split.userPays.toFixed(2)}`,
  originalPrice: `$${item.originalValue.toFixed(2)}`,
  image: listingImageUrl || categoryImages[item.category] || categoryImages.Meals,
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
  nutrition: item.nutrition,
});

const fundedSuburbs = ['Marrickville', 'Blacktown', 'Parramatta', 'Auburn'];

interface StockInputRow {
  id: number;
  name: string;
  quantity: string;
}

const emptyStockRow = (id: number): StockInputRow => ({ id, name: '', quantity: '1' });

const normaliseQuantity = (value: string) => Math.max(1, Math.round(Number(value) || 1));

const rowToStockLine = (row: StockInputRow) => `${normaliseQuantity(row.quantity)} x ${row.name.trim()}`;

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

const compressImage = (file: File) => new Promise<File>((resolve) => {
  const image = new Image();
  const url = URL.createObjectURL(file);
  image.onload = () => {
    URL.revokeObjectURL(url);
    const maxSide = 640;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file);
    }, 'image/jpeg', 0.68);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    resolve(file);
  };
  image.src = url;
});

export default function VendorStockUpload() {
  const [stockRows, setStockRows] = useState<StockInputRow[]>([emptyStockRow(1)]);
  const [nextRowId, setNextRowId] = useState(2);
  const [suburb, setSuburb] = useState('Marrickville');
  const [fileName, setFileName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [listingImageUrl, setListingImageUrl] = useState<string | null>(null);
  const [pickupWindow, setPickupWindow] = useState('Today, 5:30 - 6:30 PM');
  const [results, setResults] = useState<StockMatch[] | null>(null);
  const [skipped, setSkipped] = useState<number[]>([]);
  const [published, setPublished] = useState(0);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const funded = fundedSuburbs.includes(suburb);

  useEffect(() => {
    if (!imagePreviewUrl) return undefined;
    return () => URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

  const readFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setEstimateError(null);
    setImageFile(null);
    setListingImageUrl(null);
    if (!file.type.startsWith('image/')) {
      setImagePreviewUrl(null);
      setImageProcessing(false);
      setEstimateError('Upload a food photo file.');
      return;
    }
    setImagePreviewUrl(URL.createObjectURL(file));
    setImageProcessing(true);
    compressImage(file).then((compressed) => {
      setImageFile(compressed);
      return fileToDataUrl(compressed);
    }).then(setListingImageUrl).catch(() => {
      setListingImageUrl(null);
    }).finally(() => {
      setImageProcessing(false);
    });
  };

  const updateStockRow = (id: number, values: Partial<Omit<StockInputRow, 'id'>>) => {
    setPublished(0);
    setEstimateError(null);
    setStockRows((current) => current.map((row) => row.id === id ? { ...row, ...values } : row));
  };

  const addStockRow = () => {
    setPublished(0);
    setEstimateError(null);
    setStockRows((current) => [...current, emptyStockRow(nextRowId)]);
    setNextRowId((current) => current + 1);
  };

  const removeStockRow = (id: number) => {
    setPublished(0);
    setEstimateError(null);
    setStockRows((current) => current.length === 1 ? current : current.filter((row) => row.id !== id));
  };

  const analyse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPublished(0); setSkipped([]); setEstimateError(null);
    const validRows = stockRows.filter((row) => row.name.trim());
    if (!validRows.length) {
      setResults(null);
      setEstimateError('Add at least one item name and quantity.');
      return;
    }
    const parsed = analyseStock(validRows.map(rowToStockLine).join('\n'), funded);
    if (!imageFile) {
      setResults(parsed);
      return;
    }
    setEstimating(true);
    try {
      const estimate = await estimateNutritionFromImage(imageFile, parsed.map((item) => item.name));
      if (estimate.source === 'fallback') {
        setEstimateError(`${estimate.warning ?? 'Gemini did not return nutrition.'} Keeping local item-based nutrition estimates.`);
      } else if (estimate.source === 'gemini_text' && estimate.warning) {
        setEstimateError(estimate.warning);
      }
      setResults(parsed.map((item, index) => {
        const aiItem = estimate.items[index];
        if (!aiItem) return item;
        const nutrition = aiItem.nutrition;
        const source = estimate.source === 'gemini'
          ? 'Gemini image nutrition estimate'
          : estimate.source === 'gemini_text'
            ? 'Gemini item-name nutrition estimate'
            : 'Local nutrition estimate';
        const model = estimate.model ? ` via ${estimate.model}` : '';
        return {
          ...item,
          nutrition: {
            calories: nutrition.calories ?? item.nutrition.calories,
            proteinG: nutrition.proteinG ?? item.nutrition.proteinG,
            carbsG: nutrition.carbsG ?? item.nutrition.carbsG,
            fatG: nutrition.fatG ?? item.nutrition.fatG,
            fiberG: nutrition.fiberG ?? item.nutrition.fiberG,
            sodiumMg: nutrition.sodiumMg ?? item.nutrition.sodiumMg,
          },
          notes: [`${source}${model}: ${aiItem.confidence} confidence.`, ...item.notes],
        };
      }));
    } catch (error) {
      setEstimateError(error instanceof Error ? error.message : 'AI nutrition estimate failed. Using local nutrition estimate.');
      setResults(parsed);
    } finally {
      setEstimating(false);
    }
  };

  const included = (results ?? []).filter((item) => !skipped.includes(item.id));
  const toggle = (id: number) => setSkipped((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const publish = async () => {
    setPublishError(null);
    setPublishing(true);
    try {
      await publishListings(included.map((item, index) => toListing(item, pickupWindow, index, listingImageUrl || undefined)));
      setPublished(included.length);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Could not publish listings.');
    } finally {
      setPublishing(false);
    }
  };

  return <DashboardShell productLabel="for Business" navItems={nav} userName="Bakers Lane" userRole="Silver Partner">
    <header className="dashboard-heading"><div><h1>Upload today’s surplus</h1><p>Upload a food photo, add item names and quantities, then match available stock to nearby demand.</p></div><a className="button button--secondary" href="/vendor">Back to overview</a></header>

    <form className="stock-upload" onSubmit={analyse}>
      <section className="dashboard-panel stock-upload__input">
        <div className="panel-heading"><h2>1. What is left over?</h2></div>
        <label className={imagePreviewUrl ? 'upload-zone upload-zone--preview' : 'upload-zone'}>
          {imagePreviewUrl ? <img src={imagePreviewUrl} alt="Selected food preview"/> : <CloudUpload size={22}/>}
          <strong>{fileName || 'Upload food photo'}</strong><span>Used for AI nutrition estimate</span>
          <input type="file" accept="image/*" onChange={readFile}/>
        </label>
        {imageFile && <p className="stock-item__note">Food photo attached. SAVR will estimate nutrition when you match stock.</p>}
        <div className="stock-entry-list">
          <div className="stock-entry-list__head">
            <h3>Items in this upload</h3>
            <button className="button button--quiet button--small" type="button" onClick={addStockRow}><Plus size={14}/> Add item</button>
          </div>
          <div className="stock-entry-rows">
            {stockRows.map((row, index) => (
              <div className="stock-entry-row" key={row.id}>
                <label className="form-field">Item name
                  <input value={row.name} onChange={(event) => updateStockRow(row.id, { name: event.target.value })} placeholder="Butter croissants"/>
                </label>
                <label className="form-field stock-entry-row__quantity">Qty
                  <input type="number" min="1" step="1" inputMode="numeric" value={row.quantity} onChange={(event) => updateStockRow(row.id, { quantity: event.target.value })}/>
                </label>
                <button className="button button--quiet stock-entry-row__remove" type="button" onClick={() => removeStockRow(row.id)} disabled={stockRows.length === 1} aria-label={`Remove ${row.name || `item ${index + 1}`}`}>
                  <Trash2 size={16}/>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="stock-upload__controls">
          <label className="form-field">Pickup window<input value={pickupWindow} onChange={(event) => setPickupWindow(event.target.value)}/></label>
          <label className="form-field">Pickup suburb<select value={suburb} onChange={(event) => setSuburb(event.target.value)}>{['Marrickville', 'Blacktown', 'Parramatta', 'Auburn', 'Newtown', 'Liverpool'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="button button--primary" type="submit" disabled={estimating || imageProcessing}><Sparkles size={16}/> {imageProcessing ? 'Preparing image…' : estimating ? 'Estimating…' : 'Match stock'}</button>
        </div>
        {estimateError && <p className="form-error" role="alert">{estimateError}</p>}
        <p className={funded ? 'fund-status fund-status--on' : 'fund-status'}>{funded ? <><Check size={14}/> Atlas Bank sponsor fund is active in {suburb}. Recipients pay a capped contribution and you are still paid in full.</> : <><AlertTriangle size={14}/> No sponsor fund in {suburb} yet. Listings will be priced as a straight discount.</>}</p>
      </section>

      <section className="dashboard-panel stock-upload__result" aria-live="polite">
        {!results && <div className="stock-empty"><Sparkles size={26}/><h2>Nothing matched yet</h2><p>Add leftover items and quantities. SAVR will infer the category, dietary tags and declared allergens, then show how many nearby people it suits.</p></div>}
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
                <p className="stock-item__nutrition">{item.nutrition.calories} kcal · {Math.round(item.nutrition.proteinG)}g protein · {Math.round(item.nutrition.carbsG)}g carbs · {Math.round(item.nutrition.fiberG)}g fibre</p>
                <p className="stock-item__demand"><Users size={14}/> <strong>{item.matches}</strong> nearby people can safely eat this · <strong>{item.greatFit}</strong> a great dietary fit</p>
                {item.notes.map((note) => <p className="stock-item__note" key={note}>{note}</p>)}
                <button className="button button--quiet button--small" type="button" onClick={() => toggle(item.id)}>{off ? 'Include' : 'Skip this item'}</button>
              </li>;
            })}
          </ul>
          <button className="button button--primary button--wide" type="button" onClick={publish} disabled={!included.length || publishing}>{publishing ? 'Publishing…' : `Publish ${included.length} listing${included.length === 1 ? '' : 's'}`}</button>
          {publishError && <p className="form-error" role="alert">{publishError}</p>}
          {published > 0 && <p className="form-success" role="status"><Check size={14}/> {published} listing{published === 1 ? '' : 's'} published and live in the marketplace. Matched recipients in {suburb} are being notified now. <a href="/marketplace">View them</a></p>}
        </>}
      </section>
    </form>
    <p className="stock-method">Each item row becomes its own marketplace listing. Categories, dietary tags and pricing are suggestions you can edit.</p>
  </DashboardShell>;
}
