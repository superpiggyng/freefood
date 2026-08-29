/* The three-sided funding model.
   Restaurant lists surplus at its own price. The recipient pays a small capped
   contribution, a corporate sponsor covers the rest, and the restaurant is paid in full. */

export interface PriceSplit { vendorReceives: number; userPays: number; sponsorCovers: number; sponsored: boolean }

export const USER_CAP = 2;

export function splitPrice(vendorPrice: number, sponsored = true): PriceSplit {
  if (!sponsored || vendorPrice === 0) return { vendorReceives: vendorPrice, userPays: vendorPrice, sponsorCovers: 0, sponsored: false };
  const userPays = Math.min(USER_CAP, Math.max(1, Math.round(vendorPrice * 0.2 * 2) / 2));
  return { vendorReceives: vendorPrice, userPays, sponsorCovers: Math.max(0, vendorPrice - userPays), sponsored: true };
}

export const money = (value: number) => value === 0 ? 'Free' : `$${value.toFixed(2)}`;

/* Community partner status. Earned by rescued meals, unlocks marketing perks. */
export type PartnerTier = 'Community Partner' | 'Silver Partner' | 'Gold Partner';
export interface TierStep { tier: PartnerTier; meals: number; perks: string[] }

export const tierLadder: TierStep[] = [
  { tier: 'Community Partner', meals: 25, perks: ['Community partner badge on every listing', 'Listed on the SAVR partner map'] },
  { tier: 'Silver Partner', meals: 150, perks: ['Featured placement in your suburb', 'Priority on sponsor-funded demand', 'Window sticker and social kit'] },
  { tier: 'Gold Partner', meals: 500, perks: ['Top of marketplace results', 'Named in sponsor impact reports', 'Co-marketing with funding partners'] },
];

export function tierFor(meals: number): { current: TierStep | null; next: TierStep | null; progress: number } {
  const earned = tierLadder.filter((step) => meals >= step.meals);
  const current = earned.length ? earned[earned.length - 1] : null;
  const next = tierLadder.find((step) => meals < step.meals) ?? null;
  const floor = current?.meals ?? 0;
  const progress = next ? Math.min(100, Math.round(((meals - floor) / (next.meals - floor)) * 100)) : 100;
  return { current, next, progress };
}

/* Sponsor pledges are stored in the browser for the demo. */
const PLEDGE_KEY = 'savr.sponsorPledges';
export interface Pledge { id: string; sponsor: string; meals: number; suburb: string; budget: number; createdAt: string }

export function loadPledges(): Pledge[] {
  try { return JSON.parse(localStorage.getItem(PLEDGE_KEY) ?? '[]') as Pledge[]; } catch { return []; }
}
export function savePledge(pledge: Pledge) { localStorage.setItem(PLEDGE_KEY, JSON.stringify([pledge, ...loadPledges()])); }
export function clearPledges() { localStorage.removeItem(PLEDGE_KEY); }
