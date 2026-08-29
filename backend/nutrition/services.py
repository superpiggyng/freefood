"""Non-diagnostic, explainable meal preference ranking."""
from dataclasses import dataclass
from decimal import Decimal


DEFAULT_DAILY_TARGETS = {
    "calories": 2000,
    "proteinG": 50,
    "carbsG": 225,
    "fatG": 55,
    "fiberG": 28,
}


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
    fiber = _number(nutrition.get("fiberG"))
    calories = _number(nutrition.get("calories"))

    if protein and targets["proteinG"]:
        coverage = min(1, protein / targets["proteinG"])
        score += round(16 * coverage)
        if coverage >= 0.2:
            reasons.append(f"Adds {round(protein)}g protein toward your daily target")

    if fiber and targets["fiberG"]:
        coverage = min(1, fiber / targets["fiberG"])
        score += round(8 * coverage)
        if coverage >= 0.15:
            reasons.append(f"Adds {round(fiber)}g fiber")

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
