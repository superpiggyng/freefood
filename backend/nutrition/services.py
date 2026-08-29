"""Non-diagnostic, explainable meal preference ranking."""
from dataclasses import dataclass


@dataclass(frozen=True)
class MatchResult:
    score: int
    eligible: bool
    reasons: list[str]
    warnings: list[str]


def score_meal(profile, meal) -> MatchResult:
    avoided = {value.lower() for value in profile.allergens_to_avoid}
    declared = {value.lower() for value in meal.allergens}
    cross_contact = {value.lower() for value in meal.possible_cross_contact}
    conflicts = avoided & declared
    if conflicts:
        return MatchResult(0, False, [], [f"Contains selected allergen: {name}" for name in sorted(conflicts)])

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
    return MatchResult(max(0, min(100, score)), True, reasons, warnings)
