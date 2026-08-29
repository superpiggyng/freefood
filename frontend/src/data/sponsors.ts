export interface SponsorCampaign {
  id: string; sponsor: string; name: string; suburb: string;
  mealsFunded: number; mealsDelivered: number; budget: number; spent: number;
  restaurants: number; status: 'Active' | 'Fully delivered' | 'Starting';
}

export const sponsorProfile = { name: 'Atlas Bank', program: 'Atlas Community Food Fund', contact: 'CSR & Community Impact' };

export const campaigns: SponsorCampaign[] = [
  { id: 'wsyd-1000', sponsor: 'Atlas Bank', name: '1,000 meals in Western Sydney', suburb: 'Western Sydney', mealsFunded: 1000, mealsDelivered: 684, budget: 5000, spent: 3420, restaurants: 18, status: 'Active' },
  { id: 'inner-west-500', sponsor: 'Atlas Bank', name: '500 student meals, Inner West', suburb: 'Inner West', mealsFunded: 500, mealsDelivered: 500, budget: 2500, spent: 2500, restaurants: 11, status: 'Fully delivered' },
  { id: 'parra-250', sponsor: 'Atlas Bank', name: '250 winter meals, Parramatta', suburb: 'Parramatta', mealsFunded: 250, mealsDelivered: 96, budget: 1250, spent: 480, restaurants: 6, status: 'Active' },
];

export interface SuburbImpact { suburb: string; meals: number; restaurants: number; value: number }
export const suburbImpact: SuburbImpact[] = [
  { suburb: 'Marrickville', meals: 312, restaurants: 7, value: 1560 },
  { suburb: 'Blacktown', meals: 268, restaurants: 5, value: 1340 },
  { suburb: 'Parramatta', meals: 241, restaurants: 6, value: 1205 },
  { suburb: 'Auburn', meals: 188, restaurants: 4, value: 940 },
  { suburb: 'Newtown', meals: 154, restaurants: 5, value: 770 },
  { suburb: 'Liverpool', meals: 117, restaurants: 3, value: 585 },
];

export const weeklyDelivery = [58, 74, 96, 112, 138, 161, 184, 197];

export interface PartnerVendor { name: string; suburb: string; mealsRescued: number; earnings: number; sponsoredShare: number; joined: string }
export const partnerVendors: PartnerVendor[] = [
  { name: 'Bakers Lane', suburb: 'Marrickville', mealsRescued: 312, earnings: 1872, sponsoredShare: 82, joined: 'Mar 2026' },
  { name: 'Thai on Eath', suburb: 'Newtown', mealsRescued: 268, earnings: 1608, sponsoredShare: 76, joined: 'Apr 2026' },
  { name: 'Wholeharvest Metro', suburb: 'Parramatta', mealsRescued: 205, earnings: 1230, sponsoredShare: 71, joined: 'Feb 2026' },
  { name: 'Dinner Ladies', suburb: 'Auburn', mealsRescued: 148, earnings: 888, sponsoredShare: 88, joined: 'May 2026' },
  { name: 'Green Bites Cafe', suburb: 'Blacktown', mealsRescued: 121, earnings: 726, sponsoredShare: 64, joined: 'Jun 2026' },
];

export interface SponsorLogo { name: string; logo: string }
export const sponsorLogos: SponsorLogo[] = [
  { name: 'Flow Traders', logo: '/sponsors/flow-traders.png' },
  { name: 'Jane Street', logo: '/sponsors/jane-street.png' },
  { name: 'Apple', logo: '/sponsors/apple.png' },
  { name: 'Google', logo: '/sponsors/google.svg' },
  { name: 'Microsoft', logo: '/sponsors/microsoft.svg' },
  { name: 'Crown', logo: '/sponsors/crown.svg' },
  { name: 'NSW Government', logo: '/sponsors/nsw-government.png' },
];

/* The signed-in business for the demo. */
export const currentVendor = partnerVendors[0];
