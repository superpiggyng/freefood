import { AlertTriangle, Check, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { useListings } from '../../lib/listingStore';
import { loadPreferences, suggestListings } from '../../lib/foodPreferences';
import { money } from '../../lib/sponsorship';

export default function NutritionMatchesPage() {
  const preferences = loadPreferences();
  const listings = useListings();
  const { user } = useAuth();
  const { matches, excluded, targets } = suggestListings(listings, preferences, user);
  const sponsorCovers = (price: string, vendorPrice: number, sponsored: boolean) =>
    sponsored ? Math.max(0, vendorPrice - (price === 'FREE' ? 0 : Number(price.replace('$', '')))) : 0;
  const nutritionLine = (listing: typeof listings[number]) => {
    const values = listing.nutrition;
    if (!values) return null;
    const parts = [
      values.calories ? `${values.calories} kcal` : null,
      values.proteinG ? `${Math.round(values.proteinG)}g protein` : null,
      values.carbsG ? `${Math.round(values.carbsG)}g carbs` : null,
      values.fiberG ? `${Math.round(values.fiberG)}g fiber` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : null;
  };

  return <main className="match-page"><header className="health-header"><Link className="logo" to="/"><img src="/savr-icon.png" alt=""/><span>SAVR</span></Link><nav><Link to="/preferences">Edit</Link><Link to="/requests">My requests</Link></nav></header><div className="match-shell"><header className="match-intro"><div><p className="eyebrow">Suggested</p><h1>Food you might like</h1><p>Based on your preferences, budget, distance and estimated daily nutrition needs.</p></div><div className="match-safety"><ShieldCheck/><span><strong>Avoid list on</strong>{excluded} unavailable or unsuitable {excluded === 1 ? 'option was' : 'options were'} hidden.</span></div></header><section className="nutrition-targets" aria-label="Estimated daily nutrition targets"><span><small>Energy</small><strong>{targets.calories} kcal</strong></span><span><small>Protein</small><strong>{targets.proteinG}g</strong></span><span><small>Carbs</small><strong>{targets.carbsG}g</strong></span><span><small>Fat</small><strong>{targets.fatG}g</strong></span><span><small>Fiber</small><strong>{targets.fiberG}g</strong></span></section><aside className="clinical-disclaimer"><AlertTriangle size={18}/><p>Suggestions are not medical advice. Nutrition targets are simple estimates from your age, height and weight. Always confirm ingredients and cross-contact with the business if you have an allergy.</p></aside>{matches.length ? <section className="meal-match-grid" aria-label="Suggested food">{matches.map(({ listing, fit, reasons, warnings }) => <article className="meal-match" key={listing.id}><div className="meal-match__image"><img src={listing.image} alt=""/><span>{fit}</span></div><div className="meal-match__body"><small>{listing.vendor}</small><h2>{listing.name}</h2>{nutritionLine(listing) && <p className="meal-match__nutrition">{nutritionLine(listing)}</p>}<ul>{reasons.map((reason) => <li key={reason}><Check size={14}/>{reason}</li>)}</ul>{warnings.map((warning) => <p className="meal-warning" key={warning}><AlertTriangle size={14}/>{warning}. Confirm before requesting.</p>)}<div className="meal-match__footer"><span><MapPin size={14}/>{listing.distance}</span><strong>{listing.price}</strong></div>{sponsorCovers(listing.price, listing.vendorPrice, listing.sponsored) > 0 && <p className="meal-match__sponsor">Sponsor covers {money(sponsorCovers(listing.price, listing.vendorPrice, listing.sponsored))} · {listing.vendor} is paid in full</p>}<Link className="button button--wide" to={`/marketplace/${listing.slug}`}>View food</Link></div></article>)}</section> : <section className="empty-state"><h2>No suitable food is available right now</h2><p>Try increasing your distance or price, or check back when new food is listed.</p><Link className="button" to="/preferences">Edit preferences</Link></section>}<p className="match-method">Declared allergens, distance and budget are checked first. Remaining food is ordered by preferences, then by how well it contributes to estimated daily nutrition targets. No medical records are required.</p></div></main>;
}
