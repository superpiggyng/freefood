import type { Listing } from '../types';

export interface NeedScoreBreakdown {
  income: number;
  foodAccess: number;
  dependents: number;
  householdSize: number;
  employment: number;
  housingPressure: number;
  debtPressure: number;
  ruralAccess: number;
  previousAllocationsPenalty: number;
}

export interface SavrUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  vendorName: string;
  isStaff: boolean;
  isSuperuser: boolean;
  householdSize: number;
  incomeLevel: string;
  dependents: number;
  employmentStatus: string;
  previousAllocationsCount: number;
  currentFoodAccess: string;
  housingCost: string | null;
  debt: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: string | null;
  preferredCategory: string;
  maxDistanceKm: number;
  postcode: string;
  ruralArea: boolean;
  needScore: number;
  needScoreBreakdown: NeedScoreBreakdown;
  needyMetric: number;
}

export interface FieldError {
  message: string;
  code: string;
}

export type FieldErrors = Record<string, FieldError[]>;

export class ApiError extends Error {
  status: number;
  errors?: FieldErrors;

  constructor(message: string, status: number, errors?: FieldErrors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function friendlyHttpMessage(response: Response, bodyText?: string) {
  if (response.status === 403) {
    return 'Your secure login token expired or was not set. Refresh the page and try again.';
  }
  if (response.status >= 500) {
    return 'The backend server returned an error. Make sure Django is running on port 8000.';
  }
  if (bodyText && !bodyText.trim().startsWith('<')) {
    return bodyText.trim().slice(0, 180);
  }
  return `Request failed with status ${response.status}.`;
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return { data: await response.json().catch(() => null), text: '' };
  }
  const text = await response.text().catch(() => '');
  return { data: null, text };
}

async function ensureCsrfToken(): Promise<string> {
  const existing = readCookie('csrftoken');
  if (existing) return existing;
  let response: Response;
  try {
    response = await fetch('/api/accounts/csrf/', { credentials: 'include' });
  } catch {
    throw new ApiError('Cannot reach the backend server. Start Django on port 8000 and try again.', 0);
  }
  const { data, text } = await readResponseBody(response);
  if (!response.ok) {
    throw new ApiError(data?.detail || friendlyHttpMessage(response, text), response.status, data?.errors);
  }
  const token = readCookie('csrftoken') ?? data?.csrfToken ?? '';
  if (!token) {
    throw new ApiError('Could not create a secure login session. Refresh the page and try again.', 0);
  }
  return token;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('X-CSRFToken', await ensureCsrfToken());
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
  }
  let response: Response;
  try {
    response = await fetch(path, { ...options, headers, credentials: 'include' });
  } catch {
    throw new ApiError('Cannot reach the backend server. Start Django on port 8000 and try again.', 0);
  }
  const { data, text } = await readResponseBody(response);
  if (!response.ok) {
    const message = data?.detail || (data?.errors ? 'Please fix the highlighted fields below.' : friendlyHttpMessage(response, text));
    throw new ApiError(message, response.status, data?.errors);
  }
  return data;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password1: string;
  password2: string;
  householdSize: number;
  dependents: number;
  incomeLevel: string;
  preferredCategory: string;
  postcode: string;
  maxDistanceKm: number;
  ruralArea: boolean;
  employmentStatus: string;
  currentFoodAccess: string;
  previousAllocationsCount: number;
  housingCost: string;
  debt: string;
  age: string;
  heightCm: string;
  weightKg: string;
}

export function registerUser(payload: RegisterPayload): Promise<SavrUser> {
  return apiFetch('/api/accounts/register/user/', {
    method: 'POST',
    body: JSON.stringify({
      username: payload.username,
      email: payload.email,
      password1: payload.password1,
      password2: payload.password2,
      household_size: payload.householdSize,
      dependents: payload.dependents,
      income_level: payload.incomeLevel,
      preferred_category: payload.preferredCategory,
      zip_code: payload.postcode,
      max_distance_km: payload.maxDistanceKm,
      rural_area: payload.ruralArea,
      employment_status: payload.employmentStatus,
      current_food_access: payload.currentFoodAccess,
      previous_allocations_count: payload.previousAllocationsCount,
      housing_cost: payload.housingCost || null,
      debt: payload.debt || null,
      age: payload.age || null,
      height_cm: payload.heightCm || null,
      weight_kg: payload.weightKg || null,
    }),
  });
}

export interface RegisterVendorPayload {
  username: string;
  email: string;
  password1: string;
  password2: string;
  vendorName: string;
  businessType: string;
  businessAddress: string;
}

export function registerVendor(payload: RegisterVendorPayload): Promise<SavrUser> {
  return apiFetch('/api/accounts/register/vendor/', {
    method: 'POST',
    body: JSON.stringify({
      username: payload.username,
      email: payload.email,
      password1: payload.password1,
      password2: payload.password2,
      vendor_name: payload.vendorName,
      business_type: payload.businessType,
      business_address: payload.businessAddress,
      address: payload.businessAddress,
    }),
  });
}

export function loginUser(username: string, password: string): Promise<SavrUser> {
  return apiFetch('/api/accounts/login/', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export function logoutUser(): Promise<void> {
  return apiFetch('/api/accounts/logout/', { method: 'POST' });
}

export function fetchSession(): Promise<{ user: SavrUser | null }> {
  return apiFetch('/api/accounts/session/');
}

export function updateProfile(patch: Partial<Pick<SavrUser, 'householdSize' | 'incomeLevel' | 'dependents' | 'employmentStatus' | 'currentFoodAccess' | 'previousAllocationsCount' | 'housingCost' | 'debt' | 'age' | 'heightCm' | 'weightKg' | 'preferredCategory' | 'maxDistanceKm' | 'postcode' | 'ruralArea'>>): Promise<SavrUser> {
  return apiFetch('/api/accounts/profile/', { method: 'PATCH', body: JSON.stringify(patch) });
}

export interface ListingCollection {
  results: Listing[];
  count: number;
}

export interface CreateListingPayload {
  name: string;
  category: string;
  description?: string;
  dietaryTags?: string[];
  tags?: string[];
  quantityAvailable: number;
  price: number;
  originalValue?: number | null;
  pickupLocation?: string;
  pickupStart?: string;
  pickupEnd?: string;
  interestDeadline?: string;
  nutrition?: Listing['nutrition'];
}

export function fetchListings(): Promise<ListingCollection> {
  return apiFetch('/api/listings/');
}

export function fetchListing(slug: string): Promise<Listing> {
  return apiFetch(`/api/listings/${slug}/`);
}

export function createMarketplaceListing(payload: CreateListingPayload): Promise<Listing> {
  return apiFetch('/api/vendor/listings/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface NutritionEstimateItem {
  name: string;
  nutrition: NonNullable<Listing['nutrition']>;
  confidence: 'low' | 'medium' | 'high';
}

export function estimateNutritionFromImage(image: File, itemNames: string[]): Promise<{ items: NutritionEstimateItem[]; source?: 'gemini' | 'gemini_text' | 'fallback'; model?: string; warning?: string }> {
  const body = new FormData();
  body.append('image', image);
  body.append('items', JSON.stringify(itemNames));
  return apiFetch('/api/vendor/nutrition-estimate/', { method: 'POST', body });
}

export function submitListingInterest(slug: string, requestedQuantity = 1) {
  return apiFetch(`/api/listings/${slug}/interest/`, {
    method: 'POST',
    body: JSON.stringify({ requestedQuantity }),
  });
}

export interface NutritionTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface WeeklyNutritionSummary {
  weekStart: string;
  weekEnd: string;
  dailyTargets: NutritionTotals;
  weeklyTargets: NutritionTotals;
  totals: NutritionTotals;
  targetProgress: NutritionTotals;
  impact: {
    allocatedAsEaten: number;
    servings: number;
    savedAmount: number;
    foodRescuedKg: number;
  };
  days: Array<{
    date: string;
    label: string;
    totals: NutritionTotals;
  }>;
  items: Array<{
    id: number;
    date: string;
    name: string;
    vendor: string;
    quantity: number;
    nutrition: NutritionTotals;
    savedAmount: number;
    pickupCode: string;
    status: string;
  }>;
  assumption: string;
  disclaimer: string;
}

export function fetchWeeklyNutritionSummary(): Promise<WeeklyNutritionSummary> {
  return apiFetch('/api/nutrition/weekly-summary/');
}
