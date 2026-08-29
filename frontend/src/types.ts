export interface Listing {
  id: number; slug: string; name: string; vendor: string; category: string;
  price: string; originalPrice?: string | null; image: string; tags: string[];
  quantityLeft: number; pickupTime: string; distance: string;
}
