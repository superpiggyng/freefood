import { Menu, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../lib/authContext';
import { homePathForUser } from '../lib/homePath';

export function Header({ marketplace = false, authOnly = false }: { marketplace?: boolean; authOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const homePath = homePathForUser(user);
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setOpen(false);
      navigate('/', { replace: true });
    }
  };
  return <header className="site-header" data-page={marketplace ? 'marketplace' : 'default'}>
    <Logo to={homePath} />
    <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu /></button>
    <nav className={open ? 'main-nav open' : 'main-nav'}>
      {authOnly ? <>
        <Link to="/register">Recipient signup</Link><Link to="/vendors/signup">Business signup</Link>
      </> : user?.role === 'vendor' ? <>
        <Link to="/vendor">Dashboard</Link><Link to="/vendor/upload">Create listing</Link><Link to="/vendor/allocations">Requests</Link><Link to="/vendor/partner">Partner status</Link><Link to="/marketplace">My listings</Link>
      </> : user ? <>
        <Link to="/marketplace">Find food</Link><Link to="/suggested">Suggested</Link><Link to="/sponsor-map">Sponsor Map</Link><Link to="/requests">My requests</Link>
      </> : <>
        <Link to="/marketplace">Find food</Link><Link to="/suggested">Suggested</Link><Link to="/sponsor-map">Sponsor Map</Link><Link to="/sponsors">For sponsors</Link>
      </>}
    </nav>
    <div className="header-actions">
      {user ? (
        <><Link className="header-user header-user--link" to={user.role === 'vendor' ? '/vendor' : '/profile'} title={user.role === 'vendor' ? 'Open vendor dashboard' : 'Open my profile'}><UserRound size={15}/><span>{user.role === 'vendor' ? user.vendorName || user.username : user.username}</span></Link><button className="button button-sm" type="button" onClick={handleLogout}>Log out</button></>
      ) : authOnly ? (
        <Link className="icon-button" to="/login">Log in</Link>
      ) : (
        <><Link className="icon-button" to="/login">Log in</Link><Link className="button button--secondary button-sm" to="/vendors/signup">Business signup</Link><Link className="button button-sm" to="/register">Get food support</Link></>
      )}
    </div>
  </header>;
}
