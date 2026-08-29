import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, HandHeart } from 'lucide-react';
import { useAuth } from '../../lib/authContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const account = await login(username, password);
      const home = account.role === 'vendor' ? '/vendor' : account.isStaff || account.isSuperuser ? '/platform' : '/marketplace';
      navigate(from && from !== '/login' ? from : home);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Log in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="health-page">
      <header className="health-header"><Link className="logo" to="/"><img src="/savr-icon.png" alt="" /><span>SAVR</span></Link><nav aria-label="Account options"><Link to="/register">Recipient signup</Link><Link to="/vendors/signup">Business signup</Link></nav></header>
      <div className="health-shell preference-shell">
        <div className="health-intro"><p className="eyebrow">Shared login</p><h1>Log in to SAVR</h1><p>Recipients and businesses use the same login portal. We will send you to the right dashboard after login.</p></div>
        <form className="preference-card" onSubmit={submit}>
          <label className="form-field">Username<input required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label className="form-field">Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="preference-footer"><span /><button className="button" type="submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Log in'}</button></div>
        </form>
        <div className="account-path-switch" aria-label="Create a SAVR account">
          <Link to="/register"><HandHeart size={16}/><span><strong>Recipient signup</strong><small>Get affordable food support</small></span></Link>
          <Link to="/vendors/signup"><Building2 size={16}/><span><strong>Business signup</strong><small>List surplus food</small></span></Link>
        </div>
      </div>
    </main>
  );
}
