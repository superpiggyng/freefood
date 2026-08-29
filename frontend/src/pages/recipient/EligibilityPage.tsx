import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { saveEligibility } from "../../lib/mvpStore";
import { updateProfile } from "../../lib/api";
import { useAuth } from "../../lib/authContext";
import { loadPreferences, savePreferences } from "../../lib/foodPreferences";

interface EligibilityFormState {
  householdIncome: string;
  householdSize: number;
  dependants: number;
  foodAccess: string;
  employmentStatus: string;
  dietaryRequirement: string;
  preferredCategory: string;
  travelDistance: number;
  postcode: string;
  pickupDays: string[];
  pickupTime: string;
}

/* Registration already captures the account and the need questions, so this page
   is a read-only summary of that profile with an edit mode, not a second
   registration form. */
const pickupDayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const categories = [
  { value: "bakery", label: "Bakery" }, { value: "groceries", label: "Groceries" },
  { value: "meals", label: "Meals" }, { value: "snacks", label: "Snacks" },
];
const foodAccessOptions = [
  { value: "very-limited", label: "We often run out of food" },
  { value: "often-limited", label: "We sometimes run out of food" },
  { value: "sometimes-limited", label: "We need occasional support" },
  { value: "reliable", label: "We have reliable access right now" },
];
const employmentOptions = [
  { value: "employed-full-time", label: "Employed full-time" }, { value: "employed-part-time", label: "Employed part-time" },
  { value: "unemployed", label: "Unemployed" }, { value: "student", label: "Student" },
  { value: "retired", label: "Retired" }, { value: "unable-to-work", label: "Unable to work" },
];
const incomeOptions = [
  { value: "under-25000", label: "Under $25,000 per year" }, { value: "25000-49999", label: "$25,000-$49,999" },
  { value: "50000-74999", label: "$50,000-$74,999" }, { value: "75000-plus", label: "$75,000 or more" },
];
const dietaryOptions = ["None", "Vegetarian", "Vegan", "Halal", "Gluten-free", "Dairy-free"];

const PICKUP_KEY = "savr.pickupPreferences";

const initialForm: EligibilityFormState = {
  householdIncome: "under-25000", householdSize: 1, dependants: 0,
  foodAccess: "often-limited", employmentStatus: "employed-full-time",
  dietaryRequirement: "None", preferredCategory: "groceries",
  travelDistance: 5, postcode: "", pickupDays: ["Mon", "Wed", "Fri"], pickupTime: "afternoon",
};

const pickupTimeLabels: Record<string, string> = {
  morning: "Morning (8am-12pm)", afternoon: "Afternoon (12pm-6pm)", evening: "Evening (6pm-9pm)",
};

export default function EligibilityPage() {
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EligibilityFormState>(initialForm);
  const [savedMessage, setSavedMessage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const estimate = useMemo(
    () => Math.min(98, 40 + form.dependants * 6 + Math.max(0, form.householdSize - 1) * 4 + (form.foodAccess === "very-limited" ? 24 : form.foodAccess === "often-limited" ? 16 : form.foodAccess === "sometimes-limited" ? 8 : 0)),
    [form.dependants, form.foodAccess, form.householdSize],
  );
  const score = user?.needScore ?? estimate;

  /* Prefill from the account as soon as the session resolves, without an effect. */
  const [hydratedFor, setHydratedFor] = useState<number | null>(null);
  if (user && hydratedFor !== user.id) {
    const stored = loadPreferences();
    let pickup: Partial<EligibilityFormState> = {};
    try { pickup = JSON.parse(localStorage.getItem(PICKUP_KEY) ?? "{}"); } catch { pickup = {}; }
    setHydratedFor(user.id);
    setForm((current) => ({
      ...current,
      householdIncome: user.incomeLevel || current.householdIncome,
      householdSize: user.householdSize || current.householdSize,
      dependants: user.dependents ?? current.dependants,
      foodAccess: user.currentFoodAccess || current.foodAccess,
      employmentStatus: user.employmentStatus || current.employmentStatus,
      preferredCategory: user.preferredCategory || current.preferredCategory,
      travelDistance: user.maxDistanceKm || current.travelDistance,
      postcode: user.postcode || current.postcode,
      dietaryRequirement: stored.preferences[0] ?? current.dietaryRequirement,
      pickupDays: pickup.pickupDays ?? current.pickupDays,
      pickupTime: pickup.pickupTime ?? current.pickupTime,
    }));
  }

  const toggleDay = (value: string) => setForm((current) => ({
    ...current,
    pickupDays: current.pickupDays.includes(value) ? current.pickupDays.filter((item) => item !== value) : [...current.pickupDays, value],
  }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      await updateProfile({
        incomeLevel: form.householdIncome,
        householdSize: form.householdSize,
        dependents: form.dependants,
        currentFoodAccess: form.foodAccess,
        employmentStatus: form.employmentStatus,
        preferredCategory: form.preferredCategory,
        maxDistanceKm: form.travelDistance,
        postcode: form.postcode,
      });
      const stored = loadPreferences();
      savePreferences({
        ...stored,
        preferences: form.dietaryRequirement === "None" ? [] : [form.dietaryRequirement],
        maxDistance: form.travelDistance,
      });
      localStorage.setItem(PICKUP_KEY, JSON.stringify({ pickupDays: form.pickupDays, pickupTime: form.pickupTime }));
      await refresh();
      saveEligibility();
      setSavedMessage(true);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (!editing) {
    return (
      <main className="eligibility-page">
        <div className="eligibility-page__layout eligibility-page__layout--single">
          <section className="eligibility-form-panel" aria-labelledby="profile-title">
            <header className="page-heading">
              <h1 id="profile-title">Your profile</h1>
              <p>Everything you shared when you signed up. Update it any time and your Need Score changes with it.</p>
            </header>
            <div className="eligibility-form-panel__content">
              <aside className="need-score-help review-summary">
                <strong>Household &amp; need details</strong>
                <ul>
                  <li><span>Household income</span><strong>{incomeOptions.find((item) => item.value === form.householdIncome)?.label}</strong></li>
                  <li><span>Employment status</span><strong>{employmentOptions.find((item) => item.value === form.employmentStatus)?.label}</strong></li>
                  <li><span>Household size</span><strong>{form.householdSize}</strong></li>
                  <li><span>Dependants</span><strong>{form.dependants}</strong></li>
                  <li><span>Current food access</span><strong>{foodAccessOptions.find((item) => item.value === form.foodAccess)?.label}</strong></li>
                  <li><span>Dietary requirement</span><strong>{form.dietaryRequirement}</strong></li>
                  <li><span>Food you look for most</span><strong>{categories.find((item) => item.value === form.preferredCategory)?.label}</strong></li>
                  <li><span>Postcode</span><strong>{form.postcode || "Not provided"}</strong></li>
                  <li><span>Maximum travel distance</span><strong>{form.travelDistance} km</strong></li>
                  <li><span>Preferred pickup days</span><strong>{form.pickupDays.length ? form.pickupDays.join(", ") : "Any day"}</strong></li>
                  <li><span>Preferred pickup time</span><strong>{pickupTimeLabels[form.pickupTime]}</strong></li>
                </ul>
              </aside>

              <aside className="need-score-card" aria-label={`Your Need Score is ${score}`}>
                <h2>Your Need Score</h2>
                <div className="need-score-card__ring"><strong>{score}</strong><span>{score >= 70 ? "High need" : score >= 45 ? "Moderate need" : "Lower need"}</span></div>
                <p className="need-score-card__qualified">You qualify for SAVR</p>
                <p>Calculated by SAVR from your saved profile.</p>
              </aside>
            </div>

            {savedMessage && <p className="form-success" role="status">Profile saved. Your Need Score is now {score}.</p>}
            <div className="form-actions">
              <button className="button button--primary" type="button" onClick={() => { setSavedMessage(false); setEditing(true); }}>Edit profile</button>
              <Link className="button button--secondary" to="/preferences">Food preferences</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="eligibility-page">
      <div className="eligibility-page__layout eligibility-page__layout--single">
        <section className="eligibility-form-panel" aria-labelledby="eligibility-title">
          <header className="page-heading">
            <h1 id="eligibility-title">Edit your profile</h1>
            <p>Update any of the details below. Your Need Score recalculates when you save.</p>
          </header>
          <div className="eligibility-form-panel__content">
            <form className="eligibility-form" onSubmit={handleSubmit}>
              <div className="form-grid form-grid--two-columns">
                <label className="form-field">Household income (before tax)<select value={form.householdIncome} onChange={(event) => setForm({ ...form, householdIncome: event.target.value })}>{incomeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="form-field">Employment status<select value={form.employmentStatus} onChange={(event) => setForm({ ...form, employmentStatus: event.target.value })}>{employmentOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="form-field">Household size<input type="number" min="1" required value={form.householdSize} onChange={(event) => setForm({ ...form, householdSize: Number(event.target.value) })} /></label>
                <label className="form-field">Number of dependants<input type="number" min="0" required value={form.dependants} onChange={(event) => setForm({ ...form, dependants: Number(event.target.value) })} /></label>
                <label className="form-field">Current food access<select value={form.foodAccess} onChange={(event) => setForm({ ...form, foodAccess: event.target.value })}>{foodAccessOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="form-field">Dietary requirement<select value={form.dietaryRequirement} onChange={(event) => setForm({ ...form, dietaryRequirement: event.target.value })}>{dietaryOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="form-field">Food you look for most<select value={form.preferredCategory} onChange={(event) => setForm({ ...form, preferredCategory: event.target.value })}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="form-field">Postcode<input required value={form.postcode} onChange={(event) => setForm({ ...form, postcode: event.target.value })} /></label>
                <label className="form-field form-field--wide">Maximum travel distance<span className="range-field"><span>1 km</span><input type="range" min="1" max="20" value={form.travelDistance} onChange={(event) => setForm({ ...form, travelDistance: Number(event.target.value) })} /><output>{form.travelDistance} km</output></span></label>
              </div>

              <div className="form-grid form-grid--two-columns">
                <fieldset className="choice-field"><legend>Preferred pickup days</legend><div className="choice-pills choice-pills--compact">{pickupDayOptions.map((day) => <label className="choice-pill" key={day}><input type="checkbox" checked={form.pickupDays.includes(day)} onChange={() => toggleDay(day)} /><span>{day}</span></label>)}</div></fieldset>
                <label className="form-field">Preferred pickup time<select value={form.pickupTime} onChange={(event) => setForm({ ...form, pickupTime: event.target.value })}><option value="morning">Morning (8am-12pm)</option><option value="afternoon">Afternoon (12pm-6pm)</option><option value="evening">Evening (6pm-9pm)</option></select></label>
              </div>

              <aside className="need-score-help"><strong>About your Need Score</strong><p>Income, household size, dependants, employment and food access are combined into a Need Score. It only decides the order of requests when demand is higher than supply.</p></aside>
              {saveError && <p className="form-error" role="alert">{saveError}</p>}
              <div className="form-actions">
                <button className="button button--secondary" type="button" onClick={() => { setSaveError(null); setEditing(false); }}>Cancel</button>
                <button className="button button--primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
              </div>
            </form>

            <aside className="need-score-card" aria-label={`Your estimated Need Score is ${estimate}`}>
              <h2>Your Need Score</h2>
              <div className="need-score-card__ring"><strong>{estimate}</strong><span>{estimate >= 70 ? "High need" : estimate >= 45 ? "Moderate need" : "Lower need"}</span></div>
              <p className="need-score-card__qualified">You qualify for SAVR</p>
              <p>Updates live as you edit. Nobody at the counter sees it.</p>
              <ul>
                <li><span>Income</span><strong>{form.householdIncome === "under-25000" ? "High need" : form.householdIncome === "25000-49999" ? "Moderate" : "Lower"}</strong></li>
                <li><span>Household</span><strong>{form.householdSize > 3 ? "High need" : "Moderate"}</strong></li>
                <li><span>Dependants</span><strong>{form.dependants > 1 ? "High need" : form.dependants === 1 ? "Moderate" : "Lower"}</strong></li>
                <li><span>Food access</span><strong>{form.foodAccess === "very-limited" ? "High need" : form.foodAccess === "reliable" ? "Lower" : "Moderate"}</strong></li>
              </ul>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

