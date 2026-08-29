import { ArrowLeft, LockKeyhole, Store, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AccessDeniedPageProps {
  title?: string;
  message?: string;
  reason?: 'login' | 'role' | 'staff' | 'loading';
}

const defaults = {
  login: {
    title: 'Sign in required',
    message: 'You need to be signed in before you can use this part of SAVR.',
  },
  role: {
    title: 'Access restricted',
    message: 'This page is only available to a different account type.',
  },
  staff: {
    title: 'Staff area',
    message: 'This dashboard is only available to approved staff accounts.',
  },
  loading: {
    title: 'Checking access',
    message: 'Please wait while we confirm your sign-in status.',
  },
};

export default function AccessDeniedPage({ title, message, reason = 'role' }: AccessDeniedPageProps) {
  const content = defaults[reason];

  return (
    <main className="access-page" id="main-content">
      <section className="access-panel" aria-labelledby="access-title">
        <div className="access-panel__icon" aria-hidden="true">
          <LockKeyhole size={32} />
        </div>
        <p className="eyebrow">Protected area</p>
        <h1 id="access-title">{title ?? content.title}</h1>
        <p>{message ?? content.message}</p>
        <div className="access-actions">
          <Link className="button button--primary" to="/">
            <ArrowLeft size={17} />
            Home
          </Link>
          <Link className="button button--secondary" to="/marketplace">
            Browse food
          </Link>
        </div>
      </section>

      <aside className="access-context" aria-label="Account access types">
        <div>
          <UserRound size={18} />
          <span>
            <strong>Recipients</strong>
            <small>Requests, preferences and food matches</small>
          </span>
        </div>
        <div>
          <Store size={18} />
          <span>
            <strong>Vendors</strong>
            <small>Listings, incoming requests and allocations</small>
          </span>
        </div>
      </aside>
    </main>
  );
}
