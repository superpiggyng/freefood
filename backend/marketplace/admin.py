from django.contrib import admin

from .models import Allocation, Interest, Item, MarketplaceListing


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "calories", "protein_g", "created_at")
    search_fields = ("name", "description", "dietary_tags")
    list_filter = ("category",)


@admin.register(MarketplaceListing)
class MarketplaceListingAdmin(admin.ModelAdmin):
    list_display = (
        "item",
        "vendor",
        "quantity_available",
        "price",
        "interest_deadline",
        "status",
    )
    list_filter = ("status", "item__category")
    search_fields = ("item__name", "vendor__username", "pickup_location")


@admin.register(Interest)
class InterestAdmin(admin.ModelAdmin):
    list_display = ("listing", "user", "requested_quantity", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("listing__item__name", "user__username")


@admin.register(Allocation)
class AllocationAdmin(admin.ModelAdmin):
    list_display = (
        "listing",
        "user",
        "allocated_quantity",
        "pickup_code",
        "status",
    )
    list_filter = ("status",)
    search_fields = ("listing__item__name", "user__username", "pickup_code")
