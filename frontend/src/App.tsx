import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import type { FoodListing } from './components/ListingCard';
import { listings as sourceListings } from './data/listings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AccessDeniedPage from './pages/public/AccessDeniedPage';
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

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'vendor';
  isStaff?: boolean;
  isSuperuser?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

const listings: FoodListing[] = sourceListings.map((item) => ({
  id: item.slug, title: item.name, vendorName: item.vendor, category: item.category,
  imageUrl: item.image, price: item.price === 'FREE' ? 0 : Number(item.price.replace('$', '')),
  originalValue: item.originalPrice ? Number(item.originalPrice.replace('$', '')) : undefined,
  quantityRemaining: item.quantityLeft, pickupWindow: item.pickupTime, distance: item.distance,
  tags: item.tags.filter((tag) => tag !== item.category),
}));

function PublicLayout({ children, marketplace = false }: { children: ReactNode; marketplace?: boolean }) {
  return <><Header marketplace={marketplace}/>{children}</>;
}

function ProtectedRoute({ auth, children, allowedRoles, staffOnly = false }: { auth: AuthState; children: ReactNode; allowedRoles?: AuthUser['role'][]; staffOnly?: boolean }) {
  if (auth.loading) {
    return <PublicLayout><AccessDeniedPage reason="loading" /></PublicLayout>;
  }

  if (!auth.user) {
    return <PublicLayout><AccessDeniedPage reason="login" /></PublicLayout>;
  }

  if (staffOnly && !auth.user.isStaff && !auth.user.isSuperuser) {
    return <PublicLayout><AccessDeniedPage reason="staff" /></PublicLayout>;
  }

  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    return <PublicLayout><AccessDeniedPage reason="role" /></PublicLayout>;
  }

  return children;
}

function DetailRoute({ auth }: { auth: AuthState }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const base = listings.find((item) => String(item.id) === id) ?? listings[0];
  const detail: ListingDetail = { ...base, description: 'A surprise box of delicious baked goods that couldn’t be sold today. Typically includes a mix of bread, rolls, pastries and muffins.', dietaryTags: ['Vegetarian', 'Nut-free'], allergenInformation: 'May contain gluten', servings: '4-6 servings', weight: '1.8 kg', co2Avoided: '3.2 kg', vendorVerified: true, isAvailable: true };
  return <PublicLayout><ListingDetailPage listing={detail} onRequest={(item) => {
    if (!auth.user) {
      navigate('/access-denied');
      return;
    }
    saveRequest({ id: String(item.id), title: item.title, vendor: item.vendorName, pickupWindow: item.pickupWindow });
    navigate('/requests');
  }}/></PublicLayout>;
}

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let active = true;

    fetch('/api/accounts/profile/', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : null)
      .then((user) => {
        if (active) setAuth({ user, loading: false });
      })
      .catch(() => {
        if (active) setAuth({ user: null, loading: false });
      });

    return () => {
      active = false;
    };
  }, []);

  return <Routes>
    <Route path="/" element={<PublicLayout><LandingPage heroImageUrl="/savr-icon.png"/></PublicLayout>}/>
    <Route path="/marketplace" element={<PublicLayout marketplace><MarketplacePage listings={listings} categories={[{slug:'bakery',name:'Bakery'},{slug:'groceries',name:'Groceries'},{slug:'meals',name:'Meals'},{slug:'snacks',name:'Snacks'}]} initialLocation="Marrickville, NSW"/></PublicLayout>}/>
    <Route path="/marketplace/:id" element={<DetailRoute auth={auth}/>}/>
    <Route path="/access-denied" element={<PublicLayout><AccessDeniedPage reason="login" /></PublicLayout>}/>
    <Route path="/eligibility" element={<EligibilityPage/>}/>
    <Route path="/requests" element={<ProtectedRoute auth={auth} allowedRoles={['user']}><RequestsPage/></ProtectedRoute>}/>
    <Route path="/health-profile" element={<ProtectedRoute auth={auth} allowedRoles={['user']}><HealthProfilePage/></ProtectedRoute>}/>
    <Route path="/nutrition-matches" element={<ProtectedRoute auth={auth} allowedRoles={['user']}><NutritionMatchesPage/></ProtectedRoute>}/>
    <Route path="/vendor" element={<ProtectedRoute auth={auth} allowedRoles={['vendor']}><VendorDashboard/></ProtectedRoute>}/>
    <Route path="/vendor/allocations" element={<ProtectedRoute auth={auth} allowedRoles={['vendor']}><VendorAllocations/></ProtectedRoute>}/>
    <Route path="/platform" element={<ProtectedRoute auth={auth} staffOnly><AdminDashboard/></ProtectedRoute>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
