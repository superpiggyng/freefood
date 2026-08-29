import type { Listing } from '../types';

const KEY = 'savr.foodPreferences';
export interface FoodPreferences { avoid: string[]; preferences: string[]; priority: string; maxDistance: number; maxPrice: number | null }
export interface SuggestedListing { listing: Listing; score: number; fit: string; reasons: string[]; warnings: string[] }
export const defaultPreferences: FoodPreferences = { avoid: [], preferences: [], priority: 'balanced', maxDistance: 5, maxPrice: null };

export function loadPreferences(): FoodPreferences {
  try { return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return defaultPreferences; }
}
export function savePreferences(value: FoodPreferences) { localStorage.setItem(KEY, JSON.stringify(value)); }
export function clearPreferences() { localStorage.removeItem(KEY); }

const priceNumber = (price: string) => price === 'FREE' ? 0 : Number(price.replace('$', ''));
const distanceNumber = (distance: string) => Number(distance.split(' ')[0]);

export function suggestListings(items: Listing[], preferences: FoodPreferences): { matches: SuggestedListing[]; excluded: number } {
  let excluded = 0;
  const avoid = new Set(preferences.avoid.map((item) => item.toLowerCase()));
  const preferred = preferences.preferences.map((item) => item.toLowerCase());
  const matches = items.flatMap((listing) => {
    if (listing.allergens.some((item) => avoid.has(item.toLowerCase()))) { excluded += 1; return []; }
    if (distanceNumber(listing.distance) > preferences.maxDistance) { excluded += 1; return []; }
    if (preferences.maxPrice !== null && priceNumber(listing.price) > preferences.maxPrice) { excluded += 1; return []; }
    let score = 65; const reasons: string[] = []; const warnings: string[] = [];
    const tags = listing.tags.map((item) => item.toLowerCase());
    const matchingPreferences = preferred.filter((item) => tags.includes(item));
    if (matchingPreferences.length) { score += 12; reasons.push(`Matches ${matchingPreferences.join(', ')}`); }
    if (listing.traits.includes(preferences.priority)) { score += 10; reasons.push('Fits what you want today'); }
    if (priceNumber(listing.price) === 0) { score += 8; reasons.push('Free to collect'); }
    if (distanceNumber(listing.distance) <= 1.5) { score += 5; reasons.push('Close to you'); }
    const crossContact = (listing.possibleCrossContact ?? []).filter((item) => avoid.has(item.toLowerCase()));
    if (crossContact.length) { score -= 18; warnings.push(`Possible cross-contact: ${crossContact.join(', ')}`); }
    const finalScore = Math.max(0, Math.min(100, score));
    return [{ listing, score: finalScore, fit: finalScore >= 85 ? 'Great fit' : finalScore >= 72 ? 'Good fit' : 'Worth a look', reasons: reasons.length ? reasons : ['Available near you'], warnings }];
  });
  return { matches: matches.sort((a, b) => b.score - a.score), excluded };
}
