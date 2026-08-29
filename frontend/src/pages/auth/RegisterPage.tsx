import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { ApiError } from '../../lib/api';

const incomeLevels = [
  { value: 'under-25000', label: 'Under $25,000 per year' },
  { value: '25000-49999', label: '$25,000-$49,999' },
  { value: '50000-74999', label: '$50,000-$74,999' },
  { value: '75000-plus', label: '$75,000 or more' },
];

const categories = [
  { value: 'bakery', label: 'Bakery' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'meals', label: 'Meals' },
  { value: 'snacks', label: 'Snacks' },
];

const employmentStatuses = [
  { value: 'employed-full-time', label: 'Employed full-time' },
  { value: 'employed-part-time', label: 'Employed part-time' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
  { value: 'unable-to-work', label: 'Unable to work' },
];

const foodAccessLevels = [
  { value: 'reliable', label: 'Reliable access' },
  { value: 'sometimes-limited', label: 'Sometimes limited' },
  { value: 'often-limited', label: 'Often limited' },
  { value: 'very-limited', label: 'Very limited' },
];

const steps = ['Account', 'Preferences', 'Household', 'Financial situation', 'Review & submit'];

const initialForm = {
  username: '',
  email: '',
  password1: '',
  password2: '',
  preferredCategory: 'groceries',
  maxDistanceKm: 5,
  householdSize: 1,
  dependents: 0,
  incomeLevel: 'under-25000',
  postcode: '',
  ruralArea: false,
  employmentStatus: 'employed-full-time',
  currentFoodAccess: 'reliable',
  previousAllocationsCount: 0,
  housingCost: '',
  debt: '',
};

type RegisterForm = typeof initialForm;

// Maps the backend form field name to the frontend form key and the wizard step it lives on.
const fieldMap: Record<string, { key: keyof RegisterForm; step: number }> = {
  username: { key: 'username', step: 0 },
  email: { key: 'email', step: 0 },
  password1: { key: 'password1', step: 0 },
  password2: { key: 'password2', step: 0 },
  preferred_category: { key: 'preferredCategory', step: 1 },
  max_distance_km: { key: 'maxDistanceKm', step: 1 },
  household_size: { key: 'householdSize', step: 2 },
  dependents: { key: 'dependents', step: 2 },
  income_level: { key: 'incomeLevel', step: 2 },
  employment_status: { key: 'employmentStatus', step: 2 },
  zip_code: { key: 'postcode', step: 2 },
  rural_area: { key: 'ruralArea', step: 2 },
  current_food_access: { key: 'currentFoodAccess', step: 3 },
  previous_allocations_count: { key: 'previousAllocationsCount', step: 3 },
  housing_cost: { key: 'housingCost', step: 3 },
  debt: { key: 'debt', step: 3 },
};

function RecipientRegister({ redirectTo }: { redirectTo: string }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const isStepValid = () => {
    if (step === 0) return form.username.trim().length > 0 && form.email.trim().length > 0 && form.password1.length >= 12 && form.password1 === form.password2;
    if (step === 2) return form.postcode.trim().length > 0;
    return true;
  };

  const goNext = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isStepValid()) {
      setError(step === 0 ? 'Enter a username, email and matching passwords (12+ characters).' : 'Enter your postcode.');
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(form);
      navigate(redirectTo);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const nextFieldErrors: Partial<Record<keyof RegisterForm, string>> = {};
        let earliestStep = steps.length - 1;
        for (const [backendField, messages] of Object.entries(err.errors)) {
          const mapped = fieldMap[backendField];
          const message = messages[0]?.message ?? 'This field is invalid.';
          if (mapped) {
            nextFieldErrors[mapped.key] = message;
            earliestStep = Math.min(earliestStep, mapped.step);
          }
        }
        setFieldErrors(nextFieldErrors);
        setStep(earliestStep);
        setError('Please fix the highlighted fields below.');
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="eligibility-page">
      <div className="eligibility-page__layout">
        <aside className="eligibility-progress" aria-label="Registration progress">
          <ol className="eligibility-progress__steps">
            {steps.map((label, index) => (
              <li
                className={`eligibility-progress__step${index === step ? ' eligibility-progress__step--active' : ''}${index < step ? ' eligibility-progress__step--complete' : ''}`}
                aria-current={index === step ? 'step' : undefined}
                key={label}
              >
                <span className="eligibility-progress__number" aria-hidden="true">{index < step ? '✓' : index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <p className="eligibility-progress__privacy"><strong>Your information is private and secure.</strong> We only use it to match food fairly by need.</p>
        </aside>

        <section className="eligibility-form-panel" aria-labelledby="register-title">
          <header className="page-heading">
            <h1 id="register-title">Create your account</h1>
            <p>
              {step === 0 && 'Choose a username and password to get started.'}
              {step === 1 && 'Tell us what food you look for and how far you can travel.'}
              {step === 2 && 'A few household questions so we can fairly match food by need.'}
              {step === 3 && 'A little about your financial situation. This stays private and secure.'}
              {step === 4 && 'Check your details before creating your account.'}
            </p>
          </header>
          <div className="eligibility-form-panel__content">
            <form className="eligibility-form" onSubmit={step < steps.length - 1 ? goNext : submit}>
              {step === 0 && (
                <div className="form-grid form-grid--two-columns">
                  <p className="account-switch form-field--wide">Signing up a cafe, restaurant or grocer? <Link to="/vendors/signup">Create a business account</Link></p>
                  <label className={`form-field${fieldErrors.username ? ' form-field--invalid' : ''}`}>Username<input required autoFocus value={form.username} onChange={(event) => update('username', event.target.value)} />{fieldErrors.username && <small className="field-error">{fieldErrors.username}</small>}</label>
                  <label className={`form-field${fieldErrors.email ? ' form-field--invalid' : ''}`}>Email<input type="email" required value={form.email} onChange={(event) => update('email', event.target.value)} />{fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}</label>
                  <label className={`form-field${fieldErrors.password1 ? ' form-field--invalid' : ''}`}>Password<input type="password" required minLength={12} value={form.password1} onChange={(event) => update('password1', event.target.value)} />{fieldErrors.password1 && <small className="field-error">{fieldErrors.password1}</small>}</label>
                  <label className={`form-field${fieldErrors.password2 ? ' form-field--invalid' : ''}`}>Confirm password<input type="password" required minLength={12} value={form.password2} onChange={(event) => update('password2', event.target.value)} />{fieldErrors.password2 && <small className="field-error">{fieldErrors.password2}</small>}</label>
                </div>
              )}

              {step === 1 && (
                <div className="form-grid form-grid--two-columns">
                  <label className={`form-field${fieldErrors.preferredCategory ? ' form-field--invalid' : ''}`}>Item category you look for most<select value={form.preferredCategory} onChange={(event) => update('preferredCategory', event.target.value)}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{fieldErrors.preferredCategory && <small className="field-error">{fieldErrors.preferredCategory}</small>}</label>
                  <label className={`form-field${fieldErrors.maxDistanceKm ? ' form-field--invalid' : ''}`}>Maximum travel distance<span className="range-field"><span>1 km</span><input type="range" min={1} max={20} value={form.maxDistanceKm} onChange={(event) => update('maxDistanceKm', Number(event.target.value))} /><output>{form.maxDistanceKm} km</output></span>{fieldErrors.maxDistanceKm && <small className="field-error">{fieldErrors.maxDistanceKm}</small>}</label>
                </div>
              )}

              {step === 2 && (
                <div className="form-grid form-grid--two-columns">
                  <label className={`form-field${fieldErrors.householdSize ? ' form-field--invalid' : ''}`}>Household size<input type="number" min={1} required value={form.householdSize} onChange={(event) => update('householdSize', Number(event.target.value))} />{fieldErrors.householdSize && <small className="field-error">{fieldErrors.householdSize}</small>}</label>
                  <label className={`form-field${fieldErrors.dependents ? ' form-field--invalid' : ''}`}>Number of dependents<input type="number" min={0} value={form.dependents} onChange={(event) => update('dependents', Number(event.target.value))} />{fieldErrors.dependents && <small className="field-error">{fieldErrors.dependents}</small>}</label>
                  <label className={`form-field${fieldErrors.incomeLevel ? ' form-field--invalid' : ''}`}>Household income (before tax)<select value={form.incomeLevel} onChange={(event) => update('incomeLevel', event.target.value)}>{incomeLevels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{fieldErrors.incomeLevel && <small className="field-error">{fieldErrors.incomeLevel}</small>}</label>
                  <label className={`form-field${fieldErrors.employmentStatus ? ' form-field--invalid' : ''}`}>Employment status<select value={form.employmentStatus} onChange={(event) => update('employmentStatus', event.target.value)}>{employmentStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{fieldErrors.employmentStatus && <small className="field-error">{fieldErrors.employmentStatus}</small>}</label>
                  <label className={`form-field${fieldErrors.postcode ? ' form-field--invalid' : ''}`}>Postcode<input required value={form.postcode} onChange={(event) => update('postcode', event.target.value)} />{fieldErrors.postcode && <small className="field-error">{fieldErrors.postcode}</small>}</label>
                  <label className="toggle-field"><input type="checkbox" checked={form.ruralArea} onChange={(event) => update('ruralArea', event.target.checked)} /><span>I live in a rural area</span></label>
                </div>
              )}

              {step === 3 && (
                <div className="form-grid form-grid--two-columns">
                  <label className={`form-field${fieldErrors.currentFoodAccess ? ' form-field--invalid' : ''}`}>Current food access<select value={form.currentFoodAccess} onChange={(event) => update('currentFoodAccess', event.target.value)}>{foodAccessLevels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{fieldErrors.currentFoodAccess && <small className="field-error">{fieldErrors.currentFoodAccess}</small>}</label>
                  <label className={`form-field${fieldErrors.previousAllocationsCount ? ' form-field--invalid' : ''}`}>Previous food allocations received<input type="number" min={0} value={form.previousAllocationsCount} onChange={(event) => update('previousAllocationsCount', Number(event.target.value))} />{fieldErrors.previousAllocationsCount && <small className="field-error">{fieldErrors.previousAllocationsCount}</small>}</label>
                  <label className={`form-field${fieldErrors.housingCost ? ' form-field--invalid' : ''}`}>Monthly housing cost ($, optional)<input type="number" min={0} placeholder="e.g. 1800" value={form.housingCost} onChange={(event) => update('housingCost', event.target.value)} />{fieldErrors.housingCost && <small className="field-error">{fieldErrors.housingCost}</small>}</label>
                  <label className={`form-field${fieldErrors.debt ? ' form-field--invalid' : ''}`}>Outstanding debt ($, optional)<input type="number" min={0} placeholder="e.g. 5000" value={form.debt} onChange={(event) => update('debt', event.target.value)} />{fieldErrors.debt && <small className="field-error">{fieldErrors.debt}</small>}</label>
                </div>
              )}

              {step === 4 && (
                <aside className="need-score-help review-summary">
                  <strong>Review your details</strong>
                  <ul>
                    <li><span>Username</span><strong>{form.username}</strong></li>
                    <li><span>Email</span><strong>{form.email}</strong></li>
                    <li><span>Item category</span><strong>{categories.find((item) => item.value === form.preferredCategory)?.label}</strong></li>
                    <li><span>Maximum travel distance</span><strong>{form.maxDistanceKm} km</strong></li>
                    <li><span>Household size</span><strong>{form.householdSize}</strong></li>
                    <li><span>Dependents</span><strong>{form.dependents}</strong></li>
                    <li><span>Household income</span><strong>{incomeLevels.find((item) => item.value === form.incomeLevel)?.label}</strong></li>
                    <li><span>Employment status</span><strong>{employmentStatuses.find((item) => item.value === form.employmentStatus)?.label}</strong></li>
                    <li><span>Postcode</span><strong>{form.postcode}</strong></li>
                    <li><span>Rural area</span><strong>{form.ruralArea ? 'Yes' : 'No'}</strong></li>
                    <li><span>Current food access</span><strong>{foodAccessLevels.find((item) => item.value === form.currentFoodAccess)?.label}</strong></li>
                    <li><span>Previous allocations</span><strong>{form.previousAllocationsCount}</strong></li>
                    <li><span>Monthly housing cost</span><strong>{form.housingCost ? `$${form.housingCost}` : 'Not provided'}</strong></li>
                    <li><span>Outstanding debt</span><strong>{form.debt ? `$${form.debt}` : 'Not provided'}</strong></li>
                  </ul>
                </aside>
              )}

              {error && <p className="form-error" role="alert">{error}</p>}

              <div className="form-actions">
                {step > 0 && <button className="button button--secondary" type="button" onClick={goBack}>Back</button>}
                {step < steps.length - 1
                  ? <button className="button button--primary" type="submit">Continue</button>
                  : <button className="button button--primary" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>}
              </div>
            </form>
            <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}

const businessTypes = ['Cafe', 'Restaurant', 'Bakery', 'Grocer', 'Supermarket', 'Caterer'];

function BusinessRegister() {
  const { registerBusiness } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password1: '', password2: '', vendorName: '', businessType: 'Cafe', businessAddress: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (form.password1 !== form.password2) { setError('Both passwords must match.'); return; }
    setSubmitting(true);
    try {
      await registerBusiness(form);
      navigate('/vendor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="eligibility-page">
      <div className="eligibility-page__layout eligibility-page__layout--single">
        <section className="eligibility-form-panel" aria-labelledby="business-title">
          <header className="page-heading">
            <h1 id="business-title">List surplus food</h1>
            <p>Create a business account. You are paid in full for every serve. Recipients pay a capped contribution and a corporate sponsor covers the rest.</p>
          </header>
          <form className="eligibility-form" onSubmit={submit}>
            <div className="form-grid form-grid--two-columns">
              <label className="form-field">Business name<input required autoFocus value={form.vendorName} onChange={(event) => update('vendorName', event.target.value)} /></label>
              <label className="form-field">Business type<select value={form.businessType} onChange={(event) => update('businessType', event.target.value)}>{businessTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="form-field form-field--wide">Business address<input required value={form.businessAddress} onChange={(event) => update('businessAddress', event.target.value)} placeholder="Street, suburb, postcode" /></label>
              <label className="form-field">Username<input required value={form.username} onChange={(event) => update('username', event.target.value)} /></label>
              <label className="form-field">Email<input type="email" required value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
              <label className="form-field">Password<input type="password" required minLength={12} value={form.password1} onChange={(event) => update('password1', event.target.value)} /></label>
              <label className="form-field">Confirm password<input type="password" required minLength={12} value={form.password2} onChange={(event) => update('password2', event.target.value)} /></label>
            </div>
            <aside className="need-score-help"><strong>What you get</strong><p>Community partner status and badge, featured placement in your suburb, and sponsor-funded demand for food you would otherwise throw away.</p></aside>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions"><button className="button button--primary" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create business account'}</button></div>
          </form>
          <p className="auth-switch">Looking for food instead? <Link to="/register">Create a personal account</Link>. Already registered? <Link to="/login">Log in</Link>.</p>
        </section>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  const location = useLocation();
  const state = location.state as { from?: string } | null;
  const isBusiness = location.pathname.startsWith('/vendors') || new URLSearchParams(location.search).get('type') === 'vendor';
  if (isBusiness) return <BusinessRegister />;
  return <RecipientRegister redirectTo={state?.from && state.from !== '/register' ? state.from : '/preferences'} />;
}
