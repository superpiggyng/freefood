import { Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearPreferences, loadPreferences, savePreferences } from '../../lib/foodPreferences';

const avoidOptions = ['Peanut', 'Tree nuts', 'Milk', 'Egg', 'Wheat', 'Soy', 'Sesame', 'Fish', 'Shellfish'];
const preferenceOptions = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'Dairy-free'];

export default function HealthProfilePage() {
  const navigate = useNavigate();
  const [saved] = useState(loadPreferences);
  const [avoid, setAvoid] = useState<string[]>(saved.avoid);
  const [preferences, setPreferences] = useState<string[]>(saved.preferences);
  const [priority, setPriority] = useState(saved.priority);
  const [maxDistance, setMaxDistance] = useState(saved.maxDistance);
  const [maxPrice, setMaxPrice] = useState(saved.maxPrice === null ? '' : String(saved.maxPrice));
  const toggle = (value: string, values: string[], update: (items: string[]) => void) => update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    savePreferences({ avoid, preferences, priority, maxDistance, maxPrice: maxPrice === '' ? null : Number(maxPrice) });
    navigate('/suggested');
  };
  const reset = () => {
    clearPreferences();
    setAvoid([]); setPreferences([]); setPriority('balanced'); setMaxDistance(5); setMaxPrice('');
  };

  return <main className="health-page">
    <header className="health-header"><Link className="logo" to="/"><img src="/savr-icon.png" alt=""/><span>SAVR</span></Link><Link to="/eligibility">Skip</Link></header>
    <div className="health-shell preference-shell">
      <div className="health-intro"><p className="eyebrow">Optional</p><h1>Make food easier to find</h1><p>Tell us what to avoid and what you like. You can skip this or change it anytime.</p></div>
      <form className="preference-card" onSubmit={submit}>
        <fieldset><legend>Avoid</legend><p>We will hide meals that declare these ingredients.</p><div className="choice-grid">{avoidOptions.map((item) => <label className="check-card" key={item}><input type="checkbox" checked={avoid.includes(item)} onChange={() => toggle(item, avoid, setAvoid)}/><span>{item}</span></label>)}</div></fieldset>
        <fieldset><legend>Prefer</legend><p>Choose any that apply.</p><div className="choice-grid">{preferenceOptions.map((item) => <label className="check-card" key={item}><input type="checkbox" checked={preferences.includes(item)} onChange={() => toggle(item, preferences, setPreferences)}/><span>{item}</span></label>)}</div></fieldset>
        <label className="form-field">Show me<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="balanced">Balanced options</option><option value="filling">Filling options</option><option value="lighter">Lighter options</option><option value="value">Best value nearby</option></select></label>
        <div className="preference-limits">
          <label className="form-field">Maximum distance<select value={maxDistance} onChange={(event) => setMaxDistance(Number(event.target.value))}><option value={2}>2 km</option><option value={5}>5 km</option><option value={10}>10 km</option><option value={20}>20 km</option></select></label>
          <label className="form-field">Maximum price<select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}><option value="">Any price</option><option value="0">Free only</option><option value="2">Up to $2</option><option value="5">Up to $5</option></select></label>
        </div>
        <div className="preference-footer"><span><Sparkles size={16}/>Stored only in this browser for now</span><div><button className="button button--quiet" type="button" onClick={reset}>Clear</button><button className="button" type="submit">Show suggestions</button></div></div>
      </form>
    </div>
  </main>;
}
