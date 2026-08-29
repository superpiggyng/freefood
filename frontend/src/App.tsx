import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import type { FoodListing } from './components/ListingCard';
import { findListing, useListings } from './lib/listingStore';
import AdminDashboard from './pages/admin/AdminDashboard';
import AccessDeniedPage from './pages/public/AccessDeniedPage';
import LandingPage from './pages/public/LandingPage';
import ListingDetailPage, { type ListingDetail } from './pages/public/ListingDetailPage';
import MarketplacePage from './pages/public/MarketplacePage';
import EligibilityPage from './pages/recipient/EligibilityPage';
import ProfileDashboardPage from './pages/recipient/ProfileDashboardPage';
import RequestsPage from './pages/recipient/RequestsPage';
import VendorAllocations from './pages/vendor/VendorAllocations';
import VendorDashboard from './pages/vendor/VendorDashboard';
import { saveRequest } from './lib/mvpStore';
import HealthProfilePage from './pages/health/HealthProfilePage';
import NutritionMatchesPage from './pages/health/NutritionMatchesPage';
import SponsorsPage from './pages/public/SponsorsPage';
import SponsorDashboard from './pages/sponsor/SponsorDashboard';
import VendorPartnerStatus from './pages/vendor/VendorPartnerStatus';
import VendorStockUpload from './pages/vendor/VendorStockUpload';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/auth/LoginPage';
import { useAuth } from './lib/authContext';
import { submitListingInterest, type SavrUser } from './lib/api';
import type { Listing } from './types';
import { calculateDailyTargets } from './lib/foodPreferences';

const toCard = (item: Listing): FoodListing => ({
  id: item.slug, title: item.name, vendorName: item.vendor, category: item.category,
  imageUrl: item.image, price: item.price === 'FREE' ? 0 : Number(item.price.replace('$', '')),
  originalValue: item.originalPrice ? Number(item.originalPrice.replace('$', '')) : undefined,
  quantityRemaining: item.quantityLeft, pickupWindow: item.pickupTime, distance: item.distance,
  tags: item.tags.filter((tag) => tag !== item.category),
  vendorPrice: item.vendorPrice, sponsored: item.sponsored, partnerTier: item.partnerTier,
  nutrition: item.nutrition,
});

function PublicLayout({ children, marketplace = false }: { children: ReactNode; marketplace?: boolean }) {
  return <><Header marketplace={marketplace}/>{children}</>;
}

function ProtectedRoute({ children, allowedRoles, staffOnly = false }: { children: ReactNode; allowedRoles?: string[]; staffOnly?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PublicLayout><AccessDeniedPage reason="loading" /></PublicLayout>;
  }

  if (!user) {
    return <PublicLayout><AccessDeniedPage reason="login" from={location.pathname} /></PublicLayout>;
  }

  if (staffOnly && !user.isStaff && !user.isSuperuser) {
    return <PublicLayout><AccessDeniedPage reason="staff" /></PublicLayout>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <PublicLayout><AccessDeniedPage reason="role" /></PublicLayout>;
  }

  return children;
}

function DetailRoute({ user }: { user: SavrUser | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const all = useListings();
  const source = findListing(all, id);
  if (!source) {
    return <PublicLayout><main className="page-shell detail-page"><header className="page-heading"><h1>Listing not found</h1><p>This food listing is no longer available.</p></header><a className="button button--primary" href="/marketplace">Back to marketplace</a></main></PublicLayout>;
  }
  const base = toCard(source);
  const allergens = source.allergens.length ? `Contains ${source.allergens.join(', ')}` : 'No major allergens declared';
  const crossContact = source.possibleCrossContact?.length ? ` · Possible cross-contact with ${source.possibleCrossContact.join(', ')}` : '';
  const detail: ListingDetail = {
    ...base,
    description: source.description ?? `Surplus ${source.category.toLowerCase()} from ${source.vendor}, ready to collect today.`,
    dietaryTags: source.tags.filter((tag) => tag !== source.category),
    allergenInformation: `${allergens}${crossContact}. Confirm with the business if you have an allergy.`,
    servings: source.servings, weight: source.weight,
    co2Avoided: `${(source.quantityLeft * 0.9).toFixed(1)} kg`,
    vendorVerified: true, isAvailable: source.quantityLeft > 0,
    nutritionTargets: user ? calculateDailyTargets(user) : undefined,
  };
  return <PublicLayout><ListingDetailPage listing={detail} onRequest={async (item) => {
    if (!user) {
      navigate('/register', { state: { from: `/marketplace/${id}` } });
      return;
    }
    try {
      await submitListingInterest(String(item.id));
    } catch {
      navigate('/access-denied');
      return;
    }
    saveRequest({ id: String(item.id), title: item.title, vendor: item.vendorName, pickupWindow: item.pickupWindow });
    navigate('/requests');
  }}/></PublicLayout>;
}

export default function App() {
  const { user } = useAuth();
  const listings = useListings().map(toCard);

  return <Routes>
    <Route path="/" element={<PublicLayout><LandingPage heroImageUrl="/savr-icon.png"/></PublicLayout>}/>
    <Route path="/marketplace" element={<PublicLayout marketplace><MarketplacePage listings={listings} categories={[{slug:'bakery',name:'Bakery'},{slug:'groceries',name:'Groceries'},{slug:'meals',name:'Meals'},{slug:'snacks',name:'Snacks'}]} initialLocation="Marrickville, NSW"/></PublicLayout>}/>
    <Route path="/marketplace/:id" element={<DetailRoute user={user}/>}/>
    <Route path="/access-denied" element={<PublicLayout><AccessDeniedPage reason="login" /></PublicLayout>}/>
    <Route path="/register" element={<RegisterPage/>}/>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/vendors/signup" element={<RegisterPage/>}/>
    <Route path="/sponsors" element={<PublicLayout><SponsorsPage/></PublicLayout>}/>
    <Route path="/sponsor" element={<SponsorDashboard/>}/>
    <Route path="/eligibility" element={<ProtectedRoute allowedRoles={['user']}><EligibilityPage/></ProtectedRoute>}/>
    <Route path="/profile" element={<ProtectedRoute allowedRoles={['user']}><ProfileDashboardPage/></ProtectedRoute>}/>
    <Route path="/requests" element={<ProtectedRoute allowedRoles={['user']}><RequestsPage/></ProtectedRoute>}/>
    <Route path="/health-profile" element={<ProtectedRoute allowedRoles={['user']}><HealthProfilePage/></ProtectedRoute>}/>
    <Route path="/preferences" element={<ProtectedRoute allowedRoles={['user']}><HealthProfilePage/></ProtectedRoute>}/>
    <Route path="/nutrition-matches" element={<ProtectedRoute allowedRoles={['user']}><NutritionMatchesPage/></ProtectedRoute>}/>
    <Route path="/suggested" element={<ProtectedRoute allowedRoles={['user']}><NutritionMatchesPage/></ProtectedRoute>}/>
    <Route path="/vendor" element={<ProtectedRoute allowedRoles={['vendor']}><VendorDashboard/></ProtectedRoute>}/>
    <Route path="/vendor/upload" element={<ProtectedRoute allowedRoles={['vendor']}><VendorStockUpload/></ProtectedRoute>}/>
    <Route path="/vendor/partner" element={<ProtectedRoute allowedRoles={['vendor']}><VendorPartnerStatus/></ProtectedRoute>}/>
    <Route path="/vendor/allocations" element={<ProtectedRoute allowedRoles={['vendor']}><VendorAllocations/></ProtectedRoute>}/>
    <Route path="/platform" element={<ProtectedRoute staffOnly><AdminDashboard/></ProtectedRoute>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
