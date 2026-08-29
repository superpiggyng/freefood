import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { saveEligibility } from "../../lib/mvpStore";

interface EligibilityFormState {
  householdIncome: string;
  householdSize: number;
  dependants: number;
  foodNeed: string;
  dietaryRequirement: string;
  travelDistance: number;
  preferences: string[];
  pickupDays: string[];
  pickupTime: string;
}

const steps = ["Household info", "Needs & preferences", "Location & time", "Review & submit"];
const foodPreferences = ["Fresh produce", "Bakery", "Pantry staples"];
const pickupDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const initialForm: EligibilityFormState = {
  householdIncome: "under-25000",
  householdSize: 3,
  dependants: 2,
  foodNeed: "often-run-out",
  dietaryRequirement: "vegetarian",
  travelDistance: 5,
  preferences: ["Fresh produce", "Bakery", "Pantry staples"],
  pickupDays: ["Mon", "Wed", "Fri"],
  pickupTime: "afternoon",
};

export default function EligibilityPage() {
  const [form, setForm] = useState<EligibilityFormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const score = useMemo(
    () => Math.min(98, 48 + form.dependants * 7 + (form.foodNeed === "often-run-out" ? 24 : 12)),
    [form.dependants, form.foodNeed],
  );

  const toggleListValue = (field: "preferences" | "pickupDays", value: string) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveEligibility();
    setSubmitted(true);
  };

  return (
    <main className="eligibility-page">
      <div className="eligibility-page__layout">
        <aside className="eligibility-progress" aria-label="Application progress">
          <ol className="eligibility-progress__steps">
            {steps.map((step, index) => (
              <li
                className={`eligibility-progress__step${index === 1 ? " eligibility-progress__step--active" : ""}${index < 1 ? " eligibility-progress__step--complete" : ""}`}
                aria-current={index === 1 ? "step" : undefined}
                key={step}
              >
                <span className="eligibility-progress__number" aria-hidden="true">{index < 1 ? "✓" : index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <p className="eligibility-progress__privacy"><strong>Your information is private and secure.</strong> We only use it to match food fairly by need.</p>
        </aside>

        <section className="eligibility-form-panel" aria-labelledby="eligibility-title">
          <header className="page-heading"><h1 id="eligibility-title">Tell us about your household</h1><p>This helps us make fair matches to nearby surplus food.</p></header>
          <div className="eligibility-form-panel__content">
            <form className="eligibility-form" onSubmit={handleSubmit}>
              <div className="form-grid form-grid--two-columns">
                <label className="form-field">Household income (before tax)<select value={form.householdIncome} onChange={(event) => setForm({ ...form, householdIncome: event.target.value })}><option value="under-25000">Under $25,000 per year</option><option value="25000-49999">$25,000–$49,999</option><option value="50000-74999">$50,000–$74,999</option><option value="75000-plus">$75,000 or more</option></select></label>
                <label className="form-field">Household size<input type="number" min="1" required value={form.householdSize} onChange={(event) => setForm({ ...form, householdSize: Number(event.target.value) })} /></label>
                <label className="form-field">Number of dependants<input type="number" min="0" required value={form.dependants} onChange={(event) => setForm({ ...form, dependants: Number(event.target.value) })} /></label>
                <label className="form-field">Current food needs<select value={form.foodNeed} onChange={(event) => setForm({ ...form, foodNeed: event.target.value })}><option value="often-run-out">We often run out of food</option><option value="sometimes-run-out">We sometimes run out of food</option><option value="occasional">We need occasional support</option></select></label>
                <label className="form-field">Dietary requirements<select value={form.dietaryRequirement} onChange={(event) => setForm({ ...form, dietaryRequirement: event.target.value })}><option value="none">No requirements</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="halal">Halal</option><option value="gluten-free">Gluten-free</option></select></label>
                <label className="form-field">Maximum travel distance<span className="range-field"><span>1 km</span><input type="range" min="1" max="20" value={form.travelDistance} onChange={(event) => setForm({ ...form, travelDistance: Number(event.target.value) })} /><output>{form.travelDistance} km</output></span></label>
              </div>

              <fieldset className="choice-field"><legend>Food preferences <span>(optional)</span></legend><div className="choice-pills">{foodPreferences.map((preference) => <label className="choice-pill" key={preference}><input type="checkbox" checked={form.preferences.includes(preference)} onChange={() => toggleListValue("preferences", preference)} /><span>{preference}</span></label>)}</div></fieldset>
              <div className="form-grid form-grid--two-columns"><fieldset className="choice-field"><legend>Preferred pickup days</legend><div className="choice-pills choice-pills--compact">{pickupDays.map((day) => <label className="choice-pill" key={day}><input type="checkbox" checked={form.pickupDays.includes(day)} onChange={() => toggleListValue("pickupDays", day)} /><span>{day}</span></label>)}</div></fieldset><label className="form-field">Preferred pickup time<select value={form.pickupTime} onChange={(event) => setForm({ ...form, pickupTime: event.target.value })}><option value="morning">Morning (8am–12pm)</option><option value="afternoon">Afternoon (12pm–6pm)</option><option value="evening">Evening (6pm–9pm)</option></select></label></div>
              <aside className="need-score-help"><strong>About your Need Score</strong><p>We use your information to calculate a Need Score, which helps prioritise requests when demand is higher than supply.</p></aside>
              {submitted && <p className="form-success" role="status">Profile saved. You can now request available food.</p>}
              <div className="form-actions">{submitted ? <a className="button button--primary" href="/marketplace">Browse food</a> : <button className="button button--primary" type="submit">Save and continue</button>}</div>
            </form>

            <aside className="need-score-card" aria-label={`Your estimated Need Score is ${score}`}><h2>Your Need Score</h2><div className="need-score-card__ring"><strong>{score}</strong><span>High need</span></div><p className="need-score-card__qualified">You qualify for SAVR</p><p>You'll be fairly matched when food is available.</p><ul><li><span>Income factor</span><strong>High need</strong></li><li><span>Household factor</span><strong>High need</strong></li><li><span>Dependants</span><strong>High need</strong></li><li><span>Food insecurity</span><strong>High need</strong></li></ul></aside>
          </div>
        </section>
      </div>
    </main>
  );
}
