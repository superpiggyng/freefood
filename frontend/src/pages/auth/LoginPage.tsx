import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
      <header className="health-header"><Link className="logo" to="/"><img src="/savr-icon.png" alt="" /><span>SAVR</span></Link><Link to="/register">Create account</Link></header>
      <div className="health-shell preference-shell">
        <div className="health-intro"><p className="eyebrow">Welcome back</p><h1>Log in to SAVR</h1></div>
        <form className="preference-card" onSubmit={submit}>
          <label className="form-field">Username<input required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label className="form-field">Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="preference-footer"><span /><button className="button" type="submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Log in'}</button></div>
        </form>
        <p className="auth-switch">Don’t have an account? <Link to="/register">Create one</Link>, or <Link to="/vendors/signup">register a business</Link>.</p>
      </div>
    </main>
  );
}
