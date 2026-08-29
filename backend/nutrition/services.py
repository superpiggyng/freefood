"""Non-diagnostic, explainable meal preference ranking."""
from dataclasses import dataclass
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.utils import timezone


DEFAULT_DAILY_TARGETS = {
    "calories": 2000,
    "proteinG": 50,
    "carbsG": 225,
    "fatG": 55,
    "fiberG": 28,
}
NUTRITION_KEYS = ("calories", "proteinG", "carbsG", "fatG", "fiberG")


@dataclass(frozen=True)
class MatchResult:
    score: int
    eligible: bool
    reasons: list[str]
    warnings: list[str]
    nutrition_targets: dict[str, int | float]


def calculate_daily_targets(user) -> dict[str, int | float]:
    weight = float(user.weight_kg) if getattr(user, "weight_kg", None) else None
    height = float(user.height_cm) if getattr(user, "height_cm", None) else None
    age = int(user.age) if getattr(user, "age", None) else None

    if not weight or not height or not age:
        return DEFAULT_DAILY_TARGETS.copy()

    # Neutral Mifflin-St Jeor style estimate without sex/activity inputs.
    resting_energy = (10 * weight) + (6.25 * height) - (5 * age) - 78
    calories = max(1200, min(3200, round(resting_energy * 1.2)))
    protein = max(30, round(weight * 0.8))
    carbs = round((calories * 0.45) / 4)
    fat = round((calories * 0.25) / 9)
    fiber = round((calories / 1000) * 14)

    return {
        "calories": calories,
        "proteinG": protein,
        "carbsG": carbs,
        "fatG": fat,
        "fiberG": fiber,
    }


def calculate_weekly_targets(user) -> dict[str, int | float]:
    return {key: value * 7 for key, value in calculate_daily_targets(user).items()}


def _empty_totals() -> dict[str, float]:
    return {key: 0 for key in NUTRITION_KEYS}


def _round_totals(totals) -> dict[str, int | float]:
    return {
        "calories": round(totals["calories"]),
        "proteinG": round(totals["proteinG"], 1),
        "carbsG": round(totals["carbsG"], 1),
        "fatG": round(totals["fatG"], 1),
        "fiberG": round(totals["fiberG"], 1),
    }


def _item_nutrition(item, quantity=1) -> dict[str, float]:
    multiplier = max(1, quantity or 1)
    return {
        "calories": float(item.calories or 0) * multiplier,
        "proteinG": float(item.protein_g or 0) * multiplier,
        "carbsG": float(item.carbs_g or 0) * multiplier,
        "fatG": float(item.fat_g or 0) * multiplier,
        "fiberG": float(item.fiber_g or 0) * multiplier,
    }


def _add_totals(target, values):
    for key in NUTRITION_KEYS:
        target[key] += values.get(key, 0) or 0


def _week_bounds(now=None):
    current = timezone.localtime(now or timezone.now())
    start_date = current.date() - timedelta(days=6)
    end_date = current.date()
    current_tz = timezone.get_current_timezone()
    start = timezone.make_aware(datetime.combine(start_date, time.min), current_tz)
    end = timezone.make_aware(datetime.combine(end_date + timedelta(days=1), time.min), current_tz)
    return start_date, end_date, start, end


def weekly_nutrition_summary(user, now=None) -> dict:
    from marketplace.models import Allocation

    start_date, end_date, start, end = _week_bounds(now)
    daily_targets = calculate_daily_targets(user)
    weekly_targets = calculate_weekly_targets(user)
    day_totals = {start_date + timedelta(days=offset): _empty_totals() for offset in range(7)}
    totals = _empty_totals()
    items = []
    servings = 0
    savings = 0

    allocations = (
        Allocation.objects.filter(
            user=user,
            status__in=[Allocation.STATUS_ALLOCATED, Allocation.STATUS_COLLECTED],
            created_at__gte=start,
            created_at__lt=end,
        )
        .select_related("listing__item", "listing__vendor")
        .order_by("-created_at", "-pk")
    )

    for allocation in allocations:
        listing = allocation.listing
        item = listing.item
        quantity = max(1, allocation.allocated_quantity or 1)
        nutrition = _item_nutrition(item, quantity)
        local_date = timezone.localtime(allocation.created_at).date()
        if local_date in day_totals:
            _add_totals(day_totals[local_date], nutrition)
        _add_totals(totals, nutrition)
        servings += quantity

        original_value = float(listing.original_value or 0)
        price = float(listing.price or 0)
        saved_amount = max(0, original_value - price) * quantity
        savings += saved_amount
        items.append({
            "id": allocation.id,
            "date": local_date.isoformat(),
            "name": item.name,
            "vendor": listing.vendor.vendor_name or listing.vendor.username,
            "quantity": quantity,
            "nutrition": _round_totals(nutrition),
            "savedAmount": round(saved_amount, 2),
            "pickupCode": allocation.pickup_code,
            "status": allocation.status,
        })

    rounded_totals = _round_totals(totals)
    return {
        "weekStart": start_date.isoformat(),
        "weekEnd": end_date.isoformat(),
        "dailyTargets": daily_targets,
        "weeklyTargets": weekly_targets,
        "totals": rounded_totals,
        "targetProgress": {
            key: round((rounded_totals[key] / weekly_targets[key]) * 100) if weekly_targets[key] else 0
            for key in NUTRITION_KEYS
        },
        "impact": {
            "allocatedAsEaten": len(items),
            "servings": servings,
            "savedAmount": round(savings, 2),
            "foodRescuedKg": round(servings * 0.9, 1),
        },
        "days": [
            {
                "date": day.isoformat(),
                "label": day.strftime("%a"),
                "totals": _round_totals(values),
            }
            for day, values in day_totals.items()
        ],
        "items": items,
        "assumption": "For this MVP, allocated food is treated as collected and eaten.",
        "disclaimer": "Nutrition is estimated from listing data and is not medical advice.",
    }


def _number(value):
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _meal_nutrition(meal):
    values = getattr(meal, "nutrition", None) or {}
    return {
        "calories": values.get("calories"),
        "proteinG": values.get("proteinG") or values.get("protein_g"),
        "carbsG": values.get("carbsG") or values.get("carbs_g"),
        "fatG": values.get("fatG") or values.get("fat_g"),
        "fiberG": values.get("fiberG") or values.get("fiber_g"),
    }


def _nutrition_fit(nutrition, targets):
    score = 0
    reasons = []

    protein = _number(nutrition.get("proteinG"))
    carbs = _number(nutrition.get("carbsG"))
    fiber = _number(nutrition.get("fiberG"))
    calories = _number(nutrition.get("calories"))

    if protein and targets["proteinG"]:
        coverage = min(1, protein / targets["proteinG"])
        score += round(16 * coverage)
        if coverage >= 0.2:
            reasons.append(f"Adds {round(protein)}g protein toward estimated daily target")

    if fiber and targets["fiberG"]:
        coverage = min(1, fiber / targets["fiberG"])
        score += round(8 * coverage)
        if coverage >= 0.15:
            reasons.append(f"Adds {round(fiber)}g fibre")

    if carbs and targets["carbsG"]:
        coverage = min(1, carbs / targets["carbsG"])
        score += round(6 * coverage)
        if coverage >= 0.15:
            reasons.append(f"Adds {round(carbs)}g carbohydrates for energy")

    if calories:
        if 250 <= calories <= 800:
            score += 6
            reasons.append("Useful meal-sized energy")
        elif calories < 250:
            score += 2
            reasons.append("Light option")

    return score, reasons


def score_meal(profile, meal, user=None) -> MatchResult:
    avoided = {value.lower() for value in profile.allergens_to_avoid}
    declared = {value.lower() for value in meal.allergens}
    cross_contact = {value.lower() for value in meal.possible_cross_contact}
    conflicts = avoided & declared
    targets = calculate_daily_targets(user or profile.user) if hasattr(profile, "user") or user else DEFAULT_DAILY_TARGETS.copy()
    if conflicts:
        return MatchResult(0, False, [], [f"Contains selected allergen: {name}" for name in sorted(conflicts)], targets)

    score, reasons, warnings = 70, [], []
    possible_conflicts = avoided & cross_contact
    if possible_conflicts:
        score -= 35
        warnings.extend(f"Possible cross-contact: {name}" for name in sorted(possible_conflicts))
    styles = {value.lower() for value in profile.dietary_styles}
    tags = {value.lower() for value in meal.dietary_tags}
    if styles and styles <= tags:
        score += 15
        reasons.append("Matches your food preferences")
    if profile.max_price is not None and meal.price <= profile.max_price:
        score += 8
        reasons.append("Within your budget")
    goal_tags = {"protein": "high-protein", "lighter": "lighter", "vegetables": "vegetable-rich", "value": "good-value"}
    desired_tag = goal_tags.get(profile.meal_goal)
    if desired_tag and desired_tag in tags:
        score += 7
        reasons.append("Fits what you feel like today")
    nutrition_score, nutrition_reasons = _nutrition_fit(_meal_nutrition(meal), targets)
    score += nutrition_score
    reasons.extend(nutrition_reasons)
    return MatchResult(max(0, min(100, score)), True, reasons, warnings, targets)
