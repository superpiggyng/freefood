import { useEffect, useState } from 'react';
import { createMarketplaceListing, fetchListings, fetchVendorListings, type CreateListingPayload } from './api';
import type { Listing } from '../types';

type ListingScope = 'public' | 'vendor';

const EVENT = 'savr:listings';

const stores: Record<ListingScope, { cache: Listing[]; loaded: boolean; inflight: Promise<Listing[]> | null }> = {
  public: { cache: [], loaded: false, inflight: null },
  vendor: { cache: [], loaded: false, inflight: null },
};

function notify(scope: ListingScope) {
  window.dispatchEvent(new Event(`${EVENT}:${scope}`));
}

async function loadListings(scope: ListingScope) {
  const store = stores[scope];
  if (store.inflight) return store.inflight;

  const fetcher = scope === 'vendor' ? fetchVendorListings : fetchListings;
  store.inflight = fetcher()
    .then(({ results }) => {
      store.cache = results;
      store.loaded = true;
      notify(scope);
      return store.cache;
    })
    .finally(() => {
      store.inflight = null;
    });

  return store.inflight;
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
    imageUrl: item.image,
    nutrition: item.nutrition,
  };
}

export async function publishListings(items: Listing[]) {
  const created = await Promise.all(items.map((item) => createMarketplaceListing(listingToPayload(item))));
  stores.public.cache = [...created, ...stores.public.cache];
  stores.public.loaded = true;
  stores.vendor.cache = [...created, ...stores.vendor.cache];
  stores.vendor.loaded = true;
  notify('public');
  notify('vendor');
  return created;
}

export function clearPublished() {
  stores.public.cache = [];
  stores.public.loaded = false;
  stores.vendor.cache = [];
  stores.vendor.loaded = false;
  notify('public');
  notify('vendor');
}

export function useListings(scope: ListingScope = 'public', enabled = true): Listing[] {
  const [listings, setListings] = useState<Listing[]>(stores[scope].cache);

  useEffect(() => {
    if (!enabled) {
      setListings([]);
      return undefined;
    }

    const store = stores[scope];
    const eventName = `${EVENT}:${scope}`;
    const sync = () => setListings([...store.cache]);
    window.addEventListener(eventName, sync);

    if (!store.loaded) {
      loadListings(scope).catch(() => {
        store.cache = [];
        store.loaded = true;
        sync();
      });
    }

    sync();
    return () => window.removeEventListener(eventName, sync);
  }, [enabled, scope]);

  return listings;
}

export const findListing = (items: Listing[], slug?: string) => items.find((item) => item.slug === slug || String(item.id) === slug);
