import { Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

const allergens = ['Peanut', 'Tree nuts', 'Milk', 'Egg', 'Wheat', 'Soy', 'Sesame', 'Fish', 'Shellfish'];
const styles = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'Dairy-free'];

export default function HealthProfilePage() {
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [goal, setGoal] = useState('balanced');
  const [saved, setSaved] = useState(false);
  const toggle = (value: string, values: string[], setter: (items: string[]) => void) => setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem('savr.foodPreferences', JSON.stringify({ allergens: selectedAllergens, styles: selectedStyles, goal }));
    setSaved(true);
  };

  return <main className="health-page">
    <header className="health-header"><Link className="logo" to="/"><img src="/savr-icon.png" alt=""/><span>SAVR</span></Link><span><Sparkles size={16}/> Meal preferences</span></header>
    <div className="health-shell compact-profile">
      <div className="health-intro"><p className="eyebrow">Optional meal assistant</p><h1>What sounds good to you?</h1><p>Answer a few simple questions and we’ll highlight suitable meals. Skip anything you don’t want to share.</p></div>
      <form className="health-form" onSubmit={submit}>
        <section className="health-card"><div className="health-card__heading"><span>1</span><div><h2>Anything we should avoid?</h2><p>Optional. We’ll hide meals with these declared allergens.</p></div></div><div className="choice-grid">{allergens.map((item) => <label className="check-card" key={item}><input type="checkbox" checked={selectedAllergens.includes(item)} onChange={() => toggle(item, selectedAllergens, setSelectedAllergens)}/><span>{item}</span></label>)}</div></section>
        <section className="health-card"><div className="health-card__heading"><span>2</span><div><h2>How do you like to eat?</h2><p>Choose as many as you like - or none.</p></div></div><div className="choice-grid">{styles.map((item) => <label className="check-card" key={item}><input type="checkbox" checked={selectedStyles.includes(item)} onChange={() => toggle(item, selectedStyles, setSelectedStyles)}/><span>{item}</span></label>)}</div></section>
        <section className="health-card"><div className="health-card__heading"><span>3</span><div><h2>What matters today?</h2><p>This simply changes how we order suggestions.</p></div></div><div className="form-grid form-grid--two-columns"><label className="form-field">Meal preference<select value={goal} onChange={(event) => setGoal(event.target.value)}><option value="balanced">A balanced option</option><option value="protein">Something filling</option><option value="lighter">Something lighter</option><option value="vegetables">More vegetables</option><option value="value">Best value nearby</option></select></label><label className="form-field">Maximum travel distance<select><option>2 km</option><option>5 km</option><option>10 km</option><option>Any distance</option></select></label></div></section>
        <aside className="suggestion-note"><Sparkles/><p><strong>Simple, private suggestions</strong>Your answers stay in this browser for the MVP. Restaurants only see the request - not your preference profile.</p></aside>
        <div className="health-actions">{saved && <p role="status">Preferences saved.</p>}<button className="button">Save preferences</button>{saved && <Link className="button button--secondary" to="/nutrition-matches">See suggestions</Link>}</div>
      </form>
    </div>
  </main>;
}
