import { demandPool } from '../data/recipients';
import { splitPrice, type PriceSplit } from './sponsorship';

/* Deterministic, explainable stock analysis. A business pastes or uploads what is
   left over; SAVR reads each line, infers category, dietary tags and declared
   allergens, prices it against the sponsor fund and counts the anonymous nearby
   demand it would match. Allergen rules are fixed, never generated. */

interface FoodRule { keywords: string[]; category: string; allergens: string[]; crossContact?: string[]; tags: string[]; unitValue: number }

const rules: FoodRule[] = [
  { keywords: ['croissant', 'pastry', 'danish', 'muffin', 'scone'], category: 'Bakery', allergens: ['Wheat', 'Milk', 'Egg'], crossContact: ['Tree nuts'], tags: ['Vegetarian'], unitValue: 4.5 },
  { keywords: ['bread', 'sourdough', 'baguette', 'roll', 'bun'], category: 'Bakery', allergens: ['Wheat'], crossContact: ['Sesame'], tags: ['Vegetarian', 'Dairy-free'], unitValue: 5 },
  { keywords: ['salad', 'bowl', 'greens', 'slaw'], category: 'Meals', allergens: [], tags: ['Vegetarian', 'Gluten-free', 'Dairy-free'], unitValue: 9 },
  { keywords: ['curry', 'pad thai', 'noodle', 'stir fry', 'rice', 'biryani'], category: 'Meals', allergens: ['Soy'], crossContact: ['Peanut', 'Sesame'], tags: ['Halal', 'Dairy-free'], unitValue: 12 },
  { keywords: ['sandwich', 'wrap', 'roll up', 'baguette pack'], category: 'Meals', allergens: ['Wheat'], crossContact: ['Sesame'], tags: [], unitValue: 8 },
  { keywords: ['soup', 'stew', 'broth'], category: 'Meals', allergens: [], tags: ['Gluten-free', 'Dairy-free'], unitValue: 7.5 },
  { keywords: ['pizza', 'pasta', 'lasagne'], category: 'Meals', allergens: ['Wheat', 'Milk'], tags: ['Vegetarian'], unitValue: 11 },
  { keywords: ['tomato', 'banana', 'apple', 'orange', 'produce', 'fruit', 'veg', 'carrot', 'potato'], category: 'Groceries', allergens: [], tags: ['Vegan', 'Gluten-free', 'Dairy-free'], unitValue: 6 },
  { keywords: ['milk', 'yoghurt', 'cheese', 'dairy'], category: 'Groceries', allergens: ['Milk'], tags: ['Vegetarian', 'Gluten-free'], unitValue: 5.5 },
  { keywords: ['olive', 'dip', 'hummus', 'antipasto'], category: 'Groceries', allergens: ['Sesame'], tags: ['Vegan', 'Gluten-free'], unitValue: 6.5 },
  { keywords: ['snack', 'chip', 'bar', 'biscuit', 'cookie'], category: 'Snacks', allergens: ['Wheat'], crossContact: ['Peanut', 'Tree nuts'], tags: ['Vegetarian'], unitValue: 3.5 },
  { keywords: ['sushi', 'poke'], category: 'Meals', allergens: ['Soy', 'Fish'], crossContact: ['Sesame'], tags: ['Dairy-free'], unitValue: 10 },
];

const fallback: FoodRule = { keywords: [], category: 'Meals', allergens: [], crossContact: [], tags: [], unitValue: 7 };

export interface StockMatch {
  id: number; name: string; quantity: number; category: string;
  tags: string[]; allergens: string[]; crossContact: string[];
  originalValue: number; split: PriceSplit;
  matches: number; greatFit: number; confidence: 'High' | 'Medium' | 'Needs review';
  notes: string[];
}

export const sampleStock = `12 x butter croissants
8 sourdough loaves
6 chicken pad thai
10 garden salad bowls
4 kg tomatoes
9 fruit and nut snack packs`;

const parseLine = (line: string) => {
  const quantityMatch = line.match(/(\d+(?:\.\d+)?)/);
  const quantity = quantityMatch ? Math.max(1, Math.round(Number(quantityMatch[1]))) : 1;
  const name = line.replace(/^\s*\d+(?:\.\d+)?\s*(x|kg|g|pcs|pieces|packs?)?\s*/i, '').trim();
  return { quantity, name: name || line.trim() };
};

export function analyseStock(input: string, sponsorFundAvailable = true): StockMatch[] {
  return input.split('\n').map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const { quantity, name } = parseLine(line);
    const lower = name.toLowerCase();
    const rule = rules.find((item) => item.keywords.some((keyword) => lower.includes(keyword)));
    const resolved = rule ?? fallback;
    const notes: string[] = [];

    const originalValue = Number((resolved.unitValue).toFixed(2));
    const vendorPrice = Number(Math.max(2, Math.round(originalValue * 0.55 * 2) / 2).toFixed(2));
    const split = splitPrice(vendorPrice, sponsorFundAvailable);

    const allergens = resolved.allergens;
    const crossContact = resolved.crossContact ?? [];
    const nearby = demandPool.filter((profile) => profile.distance <= 5);
    const safe = nearby.filter((profile) => !profile.avoid.some((item) => allergens.includes(item)));
    const greatFit = safe.filter((profile) => profile.preferences.length && profile.preferences.every((item) => resolved.tags.includes(item)));

    if (!rule) notes.push('No confident category match. Confirm the details before publishing.');
    if (allergens.length) notes.push(`Declares ${allergens.join(', ')}. ${nearby.length - safe.length} nearby people filtered out.`);
    if (crossContact.length) notes.push(`Flag possible cross-contact: ${crossContact.join(', ')}.`);
    if (split.sponsored) notes.push(`Sponsor fund covers ${`$${split.sponsorCovers.toFixed(2)}`} per serve in this suburb.`);

    return {
      id: index + 1, name, quantity, category: resolved.category,
      tags: resolved.tags, allergens, crossContact,
      originalValue, split,
      matches: safe.length, greatFit: greatFit.length,
      confidence: rule ? (allergens.length || resolved.tags.length ? 'High' : 'Medium') : 'Needs review',
      notes,
    };
  });
}

export const totalServes = (items: StockMatch[]) => items.reduce((sum, item) => sum + item.quantity, 0);
export const totalVendorPayout = (items: StockMatch[]) => items.reduce((sum, item) => sum + item.quantity * item.split.vendorReceives, 0);
export const totalSponsorCover = (items: StockMatch[]) => items.reduce((sum, item) => sum + item.quantity * item.split.sponsorCovers, 0);
