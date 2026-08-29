import { useSyncExternalStore } from 'react';
import { listings as seedListings } from '../data/listings';
import type { Listing } from '../types';

/* Listings a business publishes from the stock upload page live in the browser
   for the demo, and are merged with the seeded marketplace so the vendor and
   recipient sides of the app are actually connected. */

const KEY = 'savr.publishedListings';
const EVENT = 'savr:listings';

function readPublished(): Listing[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Listing[]; } catch { return []; }
}

let cache: Listing[] | null = null;

function snapshot(): Listing[] {
  if (!cache) cache = [...readPublished(), ...seedListings];
  return cache;
}

function subscribe(onChange: () => void) {
  const handler = () => { cache = null; onChange(); };
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function publishListings(items: Listing[]) {
  localStorage.setItem(KEY, JSON.stringify([...items, ...readPublished()]));
  cache = null;
  window.dispatchEvent(new Event(EVENT));
}

export function clearPublished() {
  localStorage.removeItem(KEY);
  cache = null;
  window.dispatchEvent(new Event(EVENT));
}

export function useListings(): Listing[] {
  return useSyncExternalStore(subscribe, snapshot, () => seedListings);
}

export const findListing = (items: Listing[], slug?: string) => items.find((item) => item.slug === slug);
