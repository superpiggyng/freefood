import { useEffect, useState } from 'react';
import { createMarketplaceListing, fetchListings, type CreateListingPayload } from './api';
import type { Listing } from '../types';

const EVENT = 'savr:listings';

let cache: Listing[] = [];
let loaded = false;
let inflight: Promise<Listing[]> | null = null;

function notify() {
  window.dispatchEvent(new Event(EVENT));
}

async function loadListings() {
  if (inflight) return inflight;

  inflight = fetchListings()
    .then(({ results }) => {
      cache = results;
      loaded = true;
      notify();
      return cache;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

function listingToPayload(item: Listing): CreateListingPayload {
  const now = new Date();
  const pickupStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const pickupEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const interestDeadline = new Date(now.getTime() + 60 * 60 * 1000);

  return {
    name: item.name,
    category: item.category,
    description: item.description,
    tags: item.tags,
    quantityAvailable: item.quantityLeft,
    price: item.price === 'FREE' ? 0 : Number(item.price.replace('$', '')),
    originalValue: item.originalPrice ? Number(item.originalPrice.replace('$', '')) : null,
    pickupStart: pickupStart.toISOString(),
    pickupEnd: pickupEnd.toISOString(),
    interestDeadline: interestDeadline.toISOString(),
    nutrition: item.nutrition,
  };
}

export async function publishListings(items: Listing[]) {
  const created = await Promise.all(items.map((item) => createMarketplaceListing(listingToPayload(item))));
  cache = [...created, ...cache];
  loaded = true;
  notify();
  return created;
}

export function clearPublished() {
  cache = [];
  loaded = false;
  notify();
}

export function useListings(): Listing[] {
  const [listings, setListings] = useState<Listing[]>(cache);

  useEffect(() => {
    const sync = () => setListings([...cache]);
    window.addEventListener(EVENT, sync);

    if (!loaded) {
      loadListings().catch(() => {
        cache = [];
        loaded = true;
        sync();
      });
    }

    sync();
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  return listings;
}

export const findListing = (items: Listing[], slug?: string) => items.find((item) => item.slug === slug || String(item.id) === slug);
