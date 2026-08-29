export interface Listing {
  id: number; slug: string; name: string; vendor: string; category: string;
  price: string; originalPrice?: string | null; image: string; tags: string[];
  quantityLeft: number; pickupTime: string; distance: string;
  allergens: string[]; possibleCrossContact?: string[]; traits: string[];
  vendorPrice: number; sponsored: boolean; partnerTier?: string;
  description?: string; servings?: string; weight?: string;
  nutrition?: {
    calories?: number | null;
    proteinG?: number | null;
    carbsG?: number | null;
    fatG?: number | null;
    fiberG?: number | null;
    sodiumMg?: number | null;
  };
}
