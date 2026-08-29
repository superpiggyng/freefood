const REQUEST_KEY = 'savr.requestedListing';
const ELIGIBILITY_KEY = 'savr.eligibilityComplete';

export interface SavedRequest {
  id: string;
  title: string;
  vendor: string;
  pickupWindow: string;
}

export function saveRequest(request: SavedRequest) {
  localStorage.setItem(REQUEST_KEY, JSON.stringify(request));
}

export function getSavedRequest(): SavedRequest | null {
  const value = localStorage.getItem(REQUEST_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as SavedRequest; } catch { return null; }
}

export function saveEligibility() {
  localStorage.setItem(ELIGIBILITY_KEY, 'true');
}

export function hasEligibility() {
  return localStorage.getItem(ELIGIBILITY_KEY) === 'true';
}
