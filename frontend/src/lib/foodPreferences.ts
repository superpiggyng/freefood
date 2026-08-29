import type { Listing } from '../types';
import type { SavrUser } from './api';

const KEY = 'savr.foodPreferences';
export interface FoodPreferences { avoid: string[]; preferences: string[]; priority: string; maxDistance: number; maxPrice: number | null }
export interface DailyNutritionTargets { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number }
export interface SuggestedListing { listing: Listing; score: number; fit: string; reasons: string[]; warnings: string[] }
export const defaultPreferences: FoodPreferences = { avoid: [], preferences: [], priority: 'balanced', maxDistance: 5, maxPrice: null };
export const defaultDailyTargets: DailyNutritionTargets = { calories: 2000, proteinG: 50, carbsG: 225, fatG: 55, fiberG: 28 };

export function loadPreferences(): FoodPreferences {
  try { return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return defaultPreferences; }
}
export function savePreferences(value: FoodPreferences) { localStorage.setItem(KEY, JSON.stringify(value)); }
export function clearPreferences() { localStorage.removeItem(KEY); }

const priceNumber = (price: string) => price === 'FREE' ? 0 : Number(price.replace('$', ''));
const distanceNumber = (distance: string) => Number(distance.split(' ')[0]);

export function calculateDailyTargets(user?: SavrUser | null): DailyNutritionTargets {
  const weight = user?.weightKg ? Number(user.weightKg) : null;
  const height = user?.heightCm ?? null;
  const age = user?.age ?? null;
  if (!weight || !height || !age) return defaultDailyTargets;

  const restingEnergy = (10 * weight) + (6.25 * height) - (5 * age) - 78;
  const calories = Math.max(1200, Math.min(3200, Math.round(restingEnergy * 1.2)));
  return {
    calories,
    proteinG: Math.max(30, Math.round(weight * 0.8)),
    carbsG: Math.round((calories * 0.45) / 4),
    fatG: Math.round((calories * 0.25) / 9),
    fiberG: Math.round((calories / 1000) * 14),
  };
}

function nutritionFit(listing: Listing, targets: DailyNutritionTargets) {
  let score = 0;
  const reasons: string[] = [];
  const nutrition = listing.nutrition;
  if (!nutrition) return { score, reasons };

  const protein = nutrition.proteinG ?? 0;
  const fiber = nutrition.fiberG ?? 0;
  const calories = nutrition.calories ?? 0;

  if (protein > 0) {
    const coverage = Math.min(1, protein / targets.proteinG);
    score += Math.round(16 * coverage);
    if (coverage >= 0.2) reasons.push(`${Math.round(protein)}g protein toward your daily target`);
  }

  if (fiber > 0) {
    const coverage = Math.min(1, fiber / targets.fiberG);
    score += Math.round(8 * coverage);
    if (coverage >= 0.15) reasons.push(`${Math.round(fiber)}g fiber`);
  }

  if (calories >= 250 && calories <= 800) {
    score += 6;
    reasons.push('Useful meal-sized energy');
  } else if (calories > 0 && calories < 250) {
    score += 2;
    reasons.push('Light option');
  }

  return { score, reasons };
}

export function suggestListings(items: Listing[], preferences: FoodPreferences, user?: SavrUser | null): { matches: SuggestedListing[]; excluded: number; targets: DailyNutritionTargets } {
  let excluded = 0;
  const targets = calculateDailyTargets(user);
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
    const nutrition = nutritionFit(listing, targets);
    score += nutrition.score;
    reasons.push(...nutrition.reasons);
    const crossContact = (listing.possibleCrossContact ?? []).filter((item) => avoid.has(item.toLowerCase()));
    if (crossContact.length) { score -= 18; warnings.push(`Possible cross-contact: ${crossContact.join(', ')}`); }
    const finalScore = Math.max(0, Math.min(100, score));
    return [{ listing, score: finalScore, fit: finalScore >= 85 ? 'Great fit' : finalScore >= 72 ? 'Good fit' : 'Worth a look', reasons: reasons.length ? reasons : ['Available near you'], warnings }];
  });
  return { matches: matches.sort((a, b) => b.score - a.score), excluded, targets };
}
