import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import type { FoodListing } from './components/ListingCard';
import { listings as sourceListings } from './data/listings';
import AdminDashboard from './pages/admin/AdminDashboard';
import LandingPage from './pages/public/LandingPage';
import ListingDetailPage, { type ListingDetail } from './pages/public/ListingDetailPage';
import MarketplacePage from './pages/public/MarketplacePage';
import EligibilityPage from './pages/recipient/EligibilityPage';
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
import type { SavrUser } from './lib/api';

const listings: FoodListing[] = sourceListings.map((item) => ({
  id: item.slug, title: item.name, vendorName: item.vendor, category: item.category,
  imageUrl: item.image, price: item.price === 'FREE' ? 0 : Number(item.price.replace('$', '')),
  originalValue: item.originalPrice ? Number(item.originalPrice.replace('$', '')) : undefined,
  quantityRemaining: item.quantityLeft, pickupWindow: item.pickupTime, distance: item.distance,
  tags: item.tags.filter((tag) => tag !== item.category),
  vendorPrice: item.vendorPrice, sponsored: item.sponsored, partnerTier: item.partnerTier,
}));

function PublicLayout({ children, marketplace = false }: { children: ReactNode; marketplace?: boolean }) {
  return <><Header marketplace={marketplace}/>{children}</>;
}

function AuthMessage({ title, body }: { title: string; body: string }) {
  return <PublicLayout><main className="page-shell auth-message"><header className="page-heading"><h1>{title}</h1><p>{body}</p></header><a className="button button--primary" href="/register">Get started</a></main></PublicLayout>;
}

function ProtectedRoute({ children, allowedRoles, staffOnly = false }: { children: ReactNode; allowedRoles?: string[]; staffOnly?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthMessage title="Checking access" body="Please wait while we confirm your sign-in status." />;
  if (!user) return <Navigate to="/register" replace state={{ from: location.pathname, authRequired: true }} />;
  if (staffOnly && !user.isStaff && !user.isSuperuser) return <AuthMessage title="Access restricted" body="This area is only available to staff accounts." />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <AuthMessage title="Access restricted" body="Your account type does not have access to this area." />;

  return children;
}

function DetailRoute({ user }: { user: SavrUser | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const base = listings.find((item) => String(item.id) === id) ?? listings[0];
  const detail: ListingDetail = { ...base, description: 'A surprise box of delicious baked goods that couldn’t be sold today. Typically includes a mix of bread, rolls, pastries and muffins.', dietaryTags: ['Vegetarian', 'Nut-free'], allergenInformation: 'May contain gluten', servings: '4-6 servings', weight: '1.8 kg', co2Avoided: '3.2 kg', vendorVerified: true, isAvailable: true };
  return <PublicLayout><ListingDetailPage listing={detail} onRequest={(item) => {
    if (!user) {
      navigate('/register', { state: { from: `/marketplace/${id}`, authRequired: true } });
      return;
    }
    saveRequest({ id: String(item.id), title: item.title, vendor: item.vendorName, pickupWindow: item.pickupWindow });
    navigate('/requests');
  }}/></PublicLayout>;
}

export default function App() {
  const { user } = useAuth();

  return <Routes>
    <Route path="/" element={<PublicLayout><LandingPage heroImageUrl="/savr-icon.png"/></PublicLayout>}/>
    <Route path="/marketplace" element={<PublicLayout marketplace><MarketplacePage listings={listings} categories={[{slug:'bakery',name:'Bakery'},{slug:'groceries',name:'Groceries'},{slug:'meals',name:'Meals'},{slug:'snacks',name:'Snacks'}]} initialLocation="Marrickville, NSW"/></PublicLayout>}/>
    <Route path="/marketplace/:id" element={<DetailRoute user={user}/>}/>
    <Route path="/register" element={<RegisterPage/>}/>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/vendors/signup" element={<RegisterPage/>}/>
    <Route path="/sponsors" element={<PublicLayout><SponsorsPage/></PublicLayout>}/>
    <Route path="/sponsor" element={<SponsorDashboard/>}/>
    <Route path="/eligibility" element={<ProtectedRoute allowedRoles={['user']}><EligibilityPage/></ProtectedRoute>}/>
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
