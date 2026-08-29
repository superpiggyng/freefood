import { demandPool } from '../data/recipients';
import { splitPrice, type PriceSplit } from './sponsorship';

/* Deterministic, explainable stock analysis. A business pastes or uploads what is
   left over; SAVR reads each line, infers category, dietary tags and declared
   allergens, prices it against the sponsor fund and counts the anonymous nearby
   demand it would match. Allergen rules are fixed, never generated. */

interface NutritionEstimate { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; sodiumMg: number }
interface FoodRule { keywords: string[]; category: string; allergens: string[]; crossContact?: string[]; tags: string[]; unitValue: number; nutrition: NutritionEstimate }

const rules: FoodRule[] = [
  { keywords: ['croissant', 'pastry', 'danish', 'muffin', 'scone'], category: 'Bakery', allergens: ['Wheat', 'Milk', 'Egg'], crossContact: ['Tree nuts'], tags: ['Vegetarian'], unitValue: 4.5, nutrition: { calories: 330, proteinG: 7, carbsG: 38, fatG: 16, fiberG: 2, sodiumMg: 330 } },
  { keywords: ['bread', 'sourdough', 'baguette', 'roll', 'bun'], category: 'Bakery', allergens: ['Wheat'], crossContact: ['Sesame'], tags: ['Vegetarian', 'Dairy-free'], unitValue: 5, nutrition: { calories: 260, proteinG: 9, carbsG: 50, fatG: 2, fiberG: 3, sodiumMg: 420 } },
  { keywords: ['salad', 'bowl', 'greens', 'slaw'], category: 'Meals', allergens: [], tags: ['Vegetarian', 'Gluten-free', 'Dairy-free'], unitValue: 9, nutrition: { calories: 380, proteinG: 14, carbsG: 42, fatG: 16, fiberG: 8, sodiumMg: 480 } },
  { keywords: ['curry', 'pad thai', 'noodle', 'stir fry', 'rice', 'biryani'], category: 'Meals', allergens: ['Soy'], crossContact: ['Peanut', 'Sesame'], tags: ['Halal', 'Dairy-free'], unitValue: 12, nutrition: { calories: 620, proteinG: 28, carbsG: 76, fatG: 20, fiberG: 5, sodiumMg: 780 } },
  { keywords: ['sandwich', 'wrap', 'roll up', 'baguette pack'], category: 'Meals', allergens: ['Wheat'], crossContact: ['Sesame'], tags: [], unitValue: 8, nutrition: { calories: 520, proteinG: 24, carbsG: 58, fatG: 18, fiberG: 6, sodiumMg: 760 } },
  { keywords: ['soup', 'stew', 'broth'], category: 'Meals', allergens: [], tags: ['Gluten-free', 'Dairy-free'], unitValue: 7.5, nutrition: { calories: 300, proteinG: 18, carbsG: 28, fatG: 10, fiberG: 5, sodiumMg: 690 } },
  { keywords: ['pizza', 'pasta', 'lasagne'], category: 'Meals', allergens: ['Wheat', 'Milk'], tags: ['Vegetarian'], unitValue: 11, nutrition: { calories: 700, proteinG: 26, carbsG: 82, fatG: 26, fiberG: 5, sodiumMg: 880 } },
  { keywords: ['tomato', 'banana', 'apple', 'orange', 'produce', 'fruit', 'veg', 'carrot', 'potato'], category: 'Groceries', allergens: [], tags: ['Vegan', 'Gluten-free', 'Dairy-free'], unitValue: 6, nutrition: { calories: 220, proteinG: 5, carbsG: 48, fatG: 1, fiberG: 9, sodiumMg: 80 } },
  { keywords: ['milk', 'yoghurt', 'cheese', 'dairy'], category: 'Groceries', allergens: ['Milk'], tags: ['Vegetarian', 'Gluten-free'], unitValue: 5.5, nutrition: { calories: 260, proteinG: 17, carbsG: 18, fatG: 12, fiberG: 0, sodiumMg: 260 } },
  { keywords: ['olive', 'dip', 'hummus', 'antipasto'], category: 'Groceries', allergens: ['Sesame'], tags: ['Vegan', 'Gluten-free'], unitValue: 6.5, nutrition: { calories: 340, proteinG: 10, carbsG: 28, fatG: 20, fiberG: 7, sodiumMg: 620 } },
  { keywords: ['snack', 'chip', 'bar', 'biscuit', 'cookie'], category: 'Snacks', allergens: ['Wheat'], crossContact: ['Peanut', 'Tree nuts'], tags: ['Vegetarian'], unitValue: 3.5, nutrition: { calories: 230, proteinG: 5, carbsG: 30, fatG: 10, fiberG: 2, sodiumMg: 240 } },
  { keywords: ['sushi', 'poke'], category: 'Meals', allergens: ['Soy', 'Fish'], crossContact: ['Sesame'], tags: ['Dairy-free'], unitValue: 10, nutrition: { calories: 520, proteinG: 30, carbsG: 62, fatG: 14, fiberG: 5, sodiumMg: 820 } },
];

const fallback: FoodRule = { keywords: [], category: 'Meals', allergens: [], crossContact: [], tags: [], unitValue: 7, nutrition: { calories: 450, proteinG: 18, carbsG: 52, fatG: 15, fiberG: 4, sodiumMg: 560 } };

const allergenWords: Array<{ allergen: string; words: string[] }> = [
  { allergen: 'Peanut', words: ['peanut', 'satay'] },
  { allergen: 'Tree nuts', words: ['nut', 'almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'macadamia'] },
  { allergen: 'Milk', words: ['milk', 'cheese', 'butter', 'cream', 'yoghurt', 'yogurt', 'custard'] },
  { allergen: 'Egg', words: ['egg', 'mayo', 'meringue', 'frittata'] },
  { allergen: 'Wheat', words: ['wheat', 'flour', 'bread', 'pasta', 'pastry', 'croissant', 'bun', 'cake', 'biscuit'] },
  { allergen: 'Soy', words: ['soy', 'tofu', 'edamame', 'miso'] },
  { allergen: 'Sesame', words: ['sesame', 'tahini', 'hummus'] },
  { allergen: 'Fish', words: ['fish', 'salmon', 'tuna', 'anchovy'] },
  { allergen: 'Shellfish', words: ['prawn', 'shrimp', 'crab', 'lobster', 'shellfish', 'oyster'] },
];

const detectAllergens = (name: string) =>
  allergenWords.filter((entry) => entry.words.some((word) => name.includes(word))).map((entry) => entry.allergen);

export interface StockMatch {
  id: number; name: string; quantity: number; category: string;
  tags: string[]; allergens: string[]; crossContact: string[];
  originalValue: number; split: PriceSplit;
  nutrition: NutritionEstimate;
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
  const byWeight = /\d\s*(kg|g)\b/i.test(line);
  const name = line.replace(/^\s*\d+(?:\.\d+)?\s*(?:(?:x|kg|g|pcs|pieces?|packs?)\b\s*)?/i, '').trim();
  return { quantity, name: name || line.trim(), byWeight };
};

export function analyseStock(input: string, sponsorFundAvailable = true): StockMatch[] {
  return input.split('\n').map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const { quantity, name, byWeight } = parseLine(line);
    const lower = name.toLowerCase();
    const rule = rules.find((item) => item.keywords.some((keyword) => lower.includes(keyword)));
    const resolved = rule ?? fallback;
    const notes: string[] = [];

    const originalValue = Number((resolved.unitValue).toFixed(2));
    const vendorPrice = Number(Math.max(2, Math.round(originalValue * 0.55 * 2) / 2).toFixed(2));
    const split = splitPrice(vendorPrice, sponsorFundAvailable);

    const detected = detectAllergens(lower);
    const extra = detected.filter((item) => !resolved.allergens.includes(item));
    const allergens = [...resolved.allergens, ...extra];
    const crossContact = (resolved.crossContact ?? []).filter((item) => !allergens.includes(item));
    const nearby = demandPool.filter((profile) => profile.distance <= 5);
    const safe = nearby.filter((profile) => !profile.avoid.some((item) => allergens.includes(item)));
    const greatFit = safe.filter((profile) => profile.preferences.length && profile.preferences.every((item) => resolved.tags.includes(item)));

    if (byWeight) notes.push(`Read as ${quantity} serves from a weight. Set the real number of serves before publishing.`);
    if (!rule) notes.push('No confident category match. Confirm the details before publishing.');
    if (extra.length) notes.push(`Found ${extra.join(', ')} in the item name and added it to the declared allergens.`);
    if (allergens.length) notes.push(`Declares ${allergens.join(', ')}. ${nearby.length - safe.length} nearby people filtered out.`);
    if (crossContact.length) notes.push(`Flag possible cross-contact: ${crossContact.join(', ')}.`);
    if (split.sponsored) notes.push(`Sponsor fund covers ${`$${split.sponsorCovers.toFixed(2)}`} per serve in this suburb.`);

    return {
      id: index + 1, name, quantity, category: resolved.category,
      tags: resolved.tags, allergens, crossContact,
      originalValue, split, nutrition: resolved.nutrition,
      matches: safe.length, greatFit: greatFit.length,
      confidence: rule ? (allergens.length || resolved.tags.length ? 'High' : 'Medium') : 'Needs review',
      notes,
    };
  });
}

export const totalServes = (items: StockMatch[]) => items.reduce((sum, item) => sum + item.quantity, 0);
export const totalVendorPayout = (items: StockMatch[]) => items.reduce((sum, item) => sum + item.quantity * item.split.vendorReceives, 0);
export const totalSponsorCover = (items: StockMatch[]) => items.reduce((sum, item) => sum + item.quantity * item.split.sponsorCovers, 0);
