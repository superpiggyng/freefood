import { Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const avoidOptions = ['Peanut', 'Tree nuts', 'Milk', 'Egg', 'Wheat', 'Soy', 'Sesame', 'Fish', 'Shellfish'];
const preferenceOptions = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'Dairy-free'];

export default function HealthProfilePage() {
  const navigate = useNavigate();
  const [avoid, setAvoid] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [priority, setPriority] = useState('balanced');
  const toggle = (value: string, values: string[], update: (items: string[]) => void) => update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem('savr.foodPreferences', JSON.stringify({ avoid, preferences, priority }));
    navigate('/eligibility');
  };

  return <main className="health-page">
    <header className="health-header"><Link className="logo" to="/"><img src="/savr-icon.png" alt=""/><span>SAVR</span></Link><Link to="/eligibility">Skip</Link></header>
    <div className="health-shell preference-shell">
      <div className="health-intro"><p className="eyebrow">Optional</p><h1>Make food easier to find</h1><p>Tell us what to avoid and what you like. You can skip this or change it anytime.</p></div>
      <form className="preference-card" onSubmit={submit}>
        <fieldset><legend>Avoid</legend><p>We will hide meals that declare these ingredients.</p><div className="choice-grid">{avoidOptions.map((item) => <label className="check-card" key={item}><input type="checkbox" checked={avoid.includes(item)} onChange={() => toggle(item, avoid, setAvoid)}/><span>{item}</span></label>)}</div></fieldset>
        <fieldset><legend>Prefer</legend><p>Choose any that apply.</p><div className="choice-grid">{preferenceOptions.map((item) => <label className="check-card" key={item}><input type="checkbox" checked={preferences.includes(item)} onChange={() => toggle(item, preferences, setPreferences)}/><span>{item}</span></label>)}</div></fieldset>
        <label className="form-field">Show me<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="balanced">Balanced options</option><option value="filling">Filling options</option><option value="lighter">Lighter options</option><option value="value">Best value nearby</option></select></label>
        <div className="preference-footer"><span><Sparkles size={16}/>Stored only in this browser for now</span><button className="button">Show suggestions</button></div>
      </form>
    </div>
  </main>;
}
