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
  preferredCategory: string;
  maxDistanceKm: number;
  postcode: string;
  ruralArea: boolean;
  needScore: number;
  needyMetric: number;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfToken(): Promise<string> {
  const existing = readCookie('csrftoken');
  if (existing) return existing;
  await fetch('/api/accounts/csrf/', { credentials: 'include' });
  return readCookie('csrftoken') ?? '';
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

async function apiFetch(path: string, options: RequestInit = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('X-CSRFToken', await ensureCsrfToken());
    if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(path, { ...options, headers, credentials: 'include' });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.detail || (data?.errors ? 'Please fix the highlighted fields below.' : 'Something went wrong.');
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

export function updateProfile(patch: Partial<Pick<SavrUser, 'householdSize' | 'incomeLevel' | 'dependents' | 'employmentStatus' | 'currentFoodAccess' | 'previousAllocationsCount' | 'housingCost' | 'debt' | 'preferredCategory' | 'maxDistanceKm' | 'postcode' | 'ruralArea'>>): Promise<SavrUser> {
  return apiFetch('/api/accounts/profile/', { method: 'PATCH', body: JSON.stringify(patch) });
}
