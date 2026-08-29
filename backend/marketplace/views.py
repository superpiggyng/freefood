"""JSON endpoints for the React client.

The dictionaries are a temporary presentation repository. Once the domain model
work lands, swap these functions for queryset-backed selectors while preserving
the response shape consumed by the TypeScript client.
"""
from django.http import JsonResponse

from freefood.auth import staff_required_json


LISTINGS = [
    {"id": 1, "slug": "bakery-rescue-box", "name": "Bakery Rescue Box", "vendor": "Bakers Lane", "category": "Bakery", "price": "FREE", "originalPrice": None, "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85", "tags": ["Bakery", "Vegetarian"], "quantityLeft": 2, "pickupTime": "5:30 – 6:30 PM", "distance": "0.7 km"},
    {"id": 2, "slug": "fruit-veg-box", "name": "Fruit & Veg Box", "vendor": "Wholeharvest Metro", "category": "Groceries", "price": "FREE", "originalPrice": None, "image": "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=85", "tags": ["Groceries", "Vegan"], "quantityLeft": 3, "pickupTime": "6:00 – 7:00 PM", "distance": "1.2 km"},
    {"id": 3, "slug": "pantry-essentials", "name": "Pantry Essentials Bag", "vendor": "Local Grocer", "category": "Groceries", "price": "$3.50", "originalPrice": "$12.00", "image": "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=900&q=85", "tags": ["Groceries", "Pantry"], "quantityLeft": 5, "pickupTime": "6:00 – 7:30 PM", "distance": "1.6 km"},
    {"id": 4, "slug": "thai-dinner", "name": "Thai Dinner Pack", "vendor": "Thai on Eath", "category": "Meals", "price": "$2.00", "originalPrice": "$12.00", "image": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=900&q=85", "tags": ["Meals", "Dairy-free"], "quantityLeft": 4, "pickupTime": "5:00 – 6:00 PM", "distance": "1.0 km"},
    {"id": 5, "slug": "dinner-surprise", "name": "Dinner Surprise Pack", "vendor": "Dinner Ladies", "category": "Meals", "price": "FREE", "originalPrice": None, "image": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85", "tags": ["Meals", "Vegetarian"], "quantityLeft": 6, "pickupTime": "6:30 – 7:30 PM", "distance": "1.4 km"},
    {"id": 6, "slug": "snacks-fruit", "name": "Snacks & Fruit Pack", "vendor": "Green Bites Cafe", "category": "Snacks", "price": "$1.50", "originalPrice": "$6.00", "image": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=85", "tags": ["Snacks", "Gluten-free"], "quantityLeft": 3, "pickupTime": "5:00 – 6:00 PM", "distance": "1.8 km"},
]


def listing_collection(request):
    return JsonResponse({"results": LISTINGS, "count": len(LISTINGS)})


def listing_item(request, slug):
    listing = next((item for item in LISTINGS if item["slug"] == slug), None)
    if listing is None:
        return JsonResponse({"detail": "Listing not found."}, status=404)
    return JsonResponse(listing)


@staff_required_json
def platform_summary(request):
    return JsonResponse({"users": 12540, "vendors": 1285, "activeListings": 342, "mealsAllocated": 4612, "foodRescuedKg": 2860, "co2AvoidedKg": 7120})
