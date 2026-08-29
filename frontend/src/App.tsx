import { Navigate, Route, Routes, useParams } from 'react-router-dom';
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

const listings: FoodListing[] = sourceListings.map((item) => ({
  id: item.slug, title: item.name, vendorName: item.vendor, category: item.category,
  imageUrl: item.image, price: item.price === 'FREE' ? 0 : Number(item.price.replace('$', '')),
  originalValue: item.originalPrice ? Number(item.originalPrice.replace('$', '')) : undefined,
  quantityRemaining: item.quantityLeft, pickupWindow: item.pickupTime, distance: item.distance,
  tags: item.tags.filter((tag) => tag !== item.category),
}));

function PublicLayout({ children, marketplace = false }: { children: React.ReactNode; marketplace?: boolean }) {
  return <><Header marketplace={marketplace}/>{children}</>;
}

function DetailRoute() {
  const { id } = useParams();
  const base = listings.find((item) => String(item.id) === id) ?? listings[0];
  const detail: ListingDetail = { ...base, description: 'A surprise box of delicious baked goods that couldn’t be sold today. Typically includes a mix of bread, rolls, pastries and muffins.', dietaryTags: ['Vegetarian', 'Nut-free'], allergenInformation: 'May contain gluten', servings: '4–6 servings', weight: '1.8 kg', co2Avoided: '3.2 kg', vendorVerified: true, isAvailable: true };
  return <PublicLayout><ListingDetailPage listing={detail} onRequest={(item) => {
    saveRequest({ id: String(item.id), title: item.title, vendor: item.vendorName, pickupWindow: item.pickupWindow });
    window.location.assign('/requests');
  }}/></PublicLayout>;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<PublicLayout><LandingPage heroImageUrl="/savr-icon.png"/></PublicLayout>}/>
    <Route path="/marketplace" element={<PublicLayout marketplace><MarketplacePage listings={listings} categories={[{slug:'bakery',name:'Bakery'},{slug:'groceries',name:'Groceries'},{slug:'meals',name:'Meals'},{slug:'snacks',name:'Snacks'}]} initialLocation="Marrickville, NSW"/></PublicLayout>}/>
    <Route path="/marketplace/:id" element={<DetailRoute/>}/>
    <Route path="/eligibility" element={<EligibilityPage/>}/>
    <Route path="/requests" element={<RequestsPage/>}/>
    <Route path="/vendor" element={<VendorDashboard/>}/>
    <Route path="/vendor/allocations" element={<VendorAllocations/>}/>
    <Route path="/platform" element={<AdminDashboard/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
