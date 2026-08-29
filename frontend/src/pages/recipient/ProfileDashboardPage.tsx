import { Activity, BarChart3, Leaf, Save, UserRound } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { fetchWeeklyNutritionSummary, updateProfile, type WeeklyNutritionSummary } from "../../lib/api";
import { useAuth } from "../../lib/authContext";
import { money } from "../../lib/sponsorship";
import { RecipientSidebar } from "./components/RecipientSidebar";

const incomeOptions = [
  { value: "under-25000", label: "Under $25,000 per year" },
  { value: "25000-49999", label: "$25,000-$49,999" },
  { value: "50000-74999", label: "$50,000-$74,999" },
  { value: "75000-plus", label: "$75,000 or more" },
];

const employmentOptions = [
  { value: "employed-full-time", label: "Employed full-time" },
  { value: "employed-part-time", label: "Employed part-time" },
  { value: "unemployed", label: "Unemployed" },
  { value: "student", label: "Student" },
  { value: "retired", label: "Retired" },
  { value: "unable-to-work", label: "Unable to work" },
];

const foodAccessOptions = [
  { value: "very-limited", label: "Very limited" },
  { value: "often-limited", label: "Often limited" },
  { value: "sometimes-limited", label: "Sometimes limited" },
  { value: "reliable", label: "Reliable" },
];

const categoryOptions = [
  { value: "bakery", label: "Bakery" },
  { value: "groceries", label: "Groceries" },
  { value: "meals", label: "Meals" },
  { value: "snacks", label: "Snacks" },
];

const nutrients = [
  { key: "calories", label: "Energy", unit: "kcal" },
  { key: "proteinG", label: "Protein", unit: "g" },
  { key: "carbsG", label: "Carbs", unit: "g" },
  { key: "fatG", label: "Fat", unit: "g" },
  { key: "fiberG", label: "Fibre", unit: "g" },
] as const;

interface ProfileForm {
  incomeLevel: string;
  householdSize: string;
  dependents: string;
  employmentStatus: string;
  currentFoodAccess: string;
  housingCost: string;
  debt: string;
  age: string;
  heightCm: string;
  weightKg: string;
  preferredCategory: string;
  maxDistanceKm: string;
  postcode: string;
  ruralArea: boolean;
}

const emptyForm: ProfileForm = {
  incomeLevel: "under-25000",
  householdSize: "1",
  dependents: "0",
  employmentStatus: "employed-full-time",
  currentFoodAccess: "often-limited",
  housingCost: "",
  debt: "",
  age: "",
  heightCm: "",
  weightKg: "",
  preferredCategory: "groceries",
  maxDistanceKm: "5",
  postcode: "",
  ruralArea: false,
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const fieldNumber = (value: string, fallback = 0) => Number(value || fallback);
const optionalNumber = (value: string) => value === "" ? null : Number(value);
const optionalString = (value: string) => value.trim() === "" ? null : value.trim();
const needScoreLabels = [
  { key: "income", label: "Income level" },
  { key: "foodAccess", label: "Food access" },
  { key: "dependents", label: "Dependants" },
  { key: "householdSize", label: "Household size" },
  { key: "employment", label: "Employment" },
  { key: "housingPressure", label: "Housing pressure" },
  { key: "debtPressure", label: "Debt pressure" },
  { key: "ruralAccess", label: "Low-access area" },
  { key: "previousAllocationsPenalty", label: "Previous allocations" },
] as const;

export default function ProfileDashboardPage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [summary, setSummary] = useState<WeeklyNutritionSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      incomeLevel: user.incomeLevel || emptyForm.incomeLevel,
      householdSize: String(user.householdSize || 1),
      dependents: String(user.dependents ?? 0),
      employmentStatus: user.employmentStatus || emptyForm.employmentStatus,
      currentFoodAccess: user.currentFoodAccess || emptyForm.currentFoodAccess,
      housingCost: user.housingCost ?? "",
      debt: user.debt ?? "",
      age: user.age === null ? "" : String(user.age),
      heightCm: user.heightCm === null ? "" : String(user.heightCm),
      weightKg: user.weightKg ?? "",
      preferredCategory: user.preferredCategory || emptyForm.preferredCategory,
      maxDistanceKm: String(user.maxDistanceKm || 5),
      postcode: user.postcode || "",
      ruralArea: user.ruralArea,
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoadingSummary(true);
    fetchWeeklyNutritionSummary()
      .then((data) => { if (active) setSummary(data); })
      .catch(() => { if (active) setSummary(null); })
      .finally(() => { if (active) setLoadingSummary(false); });
    return () => { active = false; };
  }, [user]);

  const maxDailyCalories = useMemo(
    () => Math.max(1, ...(summary?.days.map((day) => day.totals.calories) ?? [0])),
    [summary],
  );

  if (!user) return null;

  const needScoreRows = needScoreLabels.map((item) => ({
    ...item,
    value: user.needScoreBreakdown?.[item.key] ?? 0,
  }));

  const update = (key: keyof ProfileForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateProfile({
        incomeLevel: form.incomeLevel,
        householdSize: fieldNumber(form.householdSize, 1),
        dependents: fieldNumber(form.dependents, 0),
        employmentStatus: form.employmentStatus,
        currentFoodAccess: form.currentFoodAccess,
        housingCost: optionalString(form.housingCost),
        debt: optionalString(form.debt),
        age: optionalNumber(form.age),
        heightCm: optionalNumber(form.heightCm),
        weightKg: optionalString(form.weightKg),
        preferredCategory: form.preferredCategory,
        maxDistanceKm: fieldNumber(form.maxDistanceKm, 5),
        postcode: form.postcode,
        ruralArea: form.ruralArea,
      });
      await refresh();
      setSummary(await fetchWeeklyNutritionSummary());
      setMessage("Profile saved. Your matching and nutrition estimates now use the updated details.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="recipient-dashboard profile-dashboard">
      <RecipientSidebar activeItem="profile" />
      <section className="recipient-dashboard__content recipient-dashboard__content--wide" aria-labelledby="profile-title">
        <header className="requests-header profile-dashboard__header">
          <div>
            <span className="profile-dashboard__eyebrow">Profile &amp; insights</span>
            <h1 id="profile-title">My profile</h1>
            <p>Manage the details that shape your food matches.</p>
          </div>
          <a className="button button--secondary" href="/suggested">View suggested food</a>
        </header>

        <section className="profile-stat-grid" aria-label="Profile statistics">
          <article className="metric-card"><span>Need score</span><strong>{user.needScore}</strong><small>Matching priority</small></article>
          <article className="metric-card"><span>Servings</span><strong>{summary?.impact.servings ?? 0}</strong><small>This week</small></article>
          <article className="metric-card"><span>Savings</span><strong>{money(summary?.impact.savedAmount ?? 0)}</strong><small>This week</small></article>
          <article className="metric-card"><span>Food rescued</span><strong>{summary?.impact.foodRescuedKg ?? 0} kg</strong><small>This week</small></article>
        </section>

        <div className="profile-dashboard__grid">
          <form className="dashboard-panel profile-form" onSubmit={submit}>
            <div className="panel-heading profile-form__heading"><div><h2><UserRound size={16}/> Personal details</h2><p>Keep this information current for more relevant matches.</p></div><span>{user.username}</span></div>
            <div className="profile-readonly">
              <span><small>Email</small><strong>{user.email || "Not provided"}</strong></span>
              <span><small>Account type</small><strong>{user.role === "user" ? "Recipient" : user.role}</strong></span>
            </div>

            <fieldset>
              <legend>Household</legend>
              <div className="form-grid form-grid--two-columns">
                <label className="form-field">Income level<select value={form.incomeLevel} onChange={(event) => update("incomeLevel", event.target.value)}>{incomeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="form-field">Employment status<select value={form.employmentStatus} onChange={(event) => update("employmentStatus", event.target.value)}>{employmentOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="form-field">Household size<input type="number" min="1" value={form.householdSize} onChange={(event) => update("householdSize", event.target.value)} /></label>
                <label className="form-field">Dependants<input type="number" min="0" value={form.dependents} onChange={(event) => update("dependents", event.target.value)} /></label>
                <label className="form-field">Food access<select value={form.currentFoodAccess} onChange={(event) => update("currentFoodAccess", event.target.value)}>{foodAccessOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="form-field">Housing cost per month<input type="number" min="0" step="0.01" value={form.housingCost} onChange={(event) => update("housingCost", event.target.value)} /></label>
                <label className="form-field">Debt<input type="number" min="0" step="0.01" value={form.debt} onChange={(event) => update("debt", event.target.value)} /></label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Health basics <span>Optional</span></legend>
              <div className="form-grid form-grid--two-columns">
                <label className="form-field">Age<input type="number" min="0" max="120" value={form.age} onChange={(event) => update("age", event.target.value)} /></label>
                <label className="form-field">Height cm<input type="number" min="30" max="260" value={form.heightCm} onChange={(event) => update("heightCm", event.target.value)} /></label>
                <label className="form-field">Weight kg<input type="number" min="0" max="500" step="0.1" value={form.weightKg} onChange={(event) => update("weightKg", event.target.value)} /></label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Location &amp; preferences</legend>
              <div className="form-grid form-grid--two-columns">
                <label className="form-field">Preferred category<select value={form.preferredCategory} onChange={(event) => update("preferredCategory", event.target.value)}>{categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="form-field">Maximum distance<input type="number" min="1" max="50" value={form.maxDistanceKm} onChange={(event) => update("maxDistanceKm", event.target.value)} /></label>
                <label className="form-field">Postcode<input value={form.postcode} onChange={(event) => update("postcode", event.target.value)} /></label>
                <label className="check-row"><input type="checkbox" checked={form.ruralArea} onChange={(event) => update("ruralArea", event.target.checked)} /><span>Rural or low-access area</span></label>
              </div>
            </fieldset>

            {message && <p className="form-success profile-save-status" role="status">{message}</p>}
            {error && <p className="form-error profile-save-status" role="alert">{error}</p>}
            <div className="form-actions"><button className="button button--primary" type="submit" disabled={saving}><Save size={15}/>{saving ? "Saving..." : "Save profile"}</button></div>
          </form>

          <aside className="profile-analytics">
            <section className="dashboard-panel">
              <div className="panel-heading"><h2><BarChart3 size={15}/> Need score breakdown</h2><span>{user.needScore}/100</span></div>
              <div className="need-breakdown-list">
                {needScoreRows.map((item) => (
                  <div className={`need-breakdown-row${item.value < 0 ? " need-breakdown-row--penalty" : ""}`} key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.value > 0 ? `+${item.value}` : item.value}</strong>
                  </div>
                ))}
              </div>
              <p className="panel-copy">Used only when requests exceed available food. Request time breaks ties.</p>
            </section>

            <section className="dashboard-panel">
              <div className="panel-heading"><h2><Activity size={15}/> Daily targets</h2><span>Estimated</span></div>
              <div className="nutrition-targets nutrition-targets--compact" aria-label="Estimated daily nutrition targets">
                {nutrients.map((item) => <span key={item.key}><small>{item.label}</small><strong>{summary?.dailyTargets[item.key] ?? 0}{item.unit === "kcal" ? " kcal" : "g"}</strong></span>)}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="panel-heading"><h2><BarChart3 size={15}/> Weekly nutrition</h2><span>{summary ? `${summary.weekStart} to ${summary.weekEnd}` : "Loading"}</span></div>
              {loadingSummary ? (
                <p className="panel-copy">Loading weekly nutrition estimate...</p>
              ) : summary ? (
                <>
                  <div className="nutrition-progress-list">
                    {nutrients.map((item) => {
                      const total = summary.totals[item.key];
                      const target = summary.weeklyTargets[item.key];
                      const progress = clampPercent(summary.targetProgress[item.key]);
                      return (
                        <div className="progress-row" key={item.key}>
                          <span><strong>{item.label}</strong><small>{total}{item.unit === "kcal" ? " kcal" : "g"} of {target}{item.unit === "kcal" ? " kcal" : "g"}</small></span>
                          <div className="progress-track" aria-label={`${item.label} ${progress}% of weekly estimate`}><i style={{ width: `${progress}%` }} /></div>
                          <em>{progress}%</em>
                        </div>
                      );
                    })}
                  </div>
                  <p className="panel-copy">{summary.assumption}</p>
                </>
              ) : (
                <p className="panel-copy">Weekly nutrition could not be loaded.</p>
              )}
            </section>

            <section className="dashboard-panel">
              <div className="panel-heading"><h2><Leaf size={15}/> Daily breakdown</h2><span>Energy</span></div>
              {summary?.days.length ? (
                <div className="nutrition-week-bars" aria-label="Estimated calories from allocated food by day">
                  {summary.days.map((day) => (
                    <span key={day.date}>
                      <i style={{ height: `${Math.max(4, (day.totals.calories / maxDailyCalories) * 100)}%` }} />
                      <small>{day.label}</small>
                      <em>{day.totals.calories}</em>
                    </span>
                  ))}
                </div>
              ) : <p className="panel-copy">No allocated food this week yet.</p>}
            </section>

            <section className="dashboard-panel">
              <div className="panel-heading"><h2>Food counted this week</h2><span>{summary?.items.length ?? 0} allocations</span></div>
              {summary?.items.length ? (
                <div className="nutrition-history">
                  {summary.items.map((item) => (
                    <article className="nutrition-history-row" key={item.id}>
                      <div><strong>{item.name}</strong><small>{item.vendor} · {item.date} · qty {item.quantity}</small></div>
                      <span>{item.nutrition.calories} kcal</span>
                    </article>
                  ))}
                </div>
              ) : <p className="panel-copy">Allocated food will appear here after the matching run.</p>}
              {summary?.disclaimer && <p className="panel-copy">{summary.disclaimer}</p>}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
