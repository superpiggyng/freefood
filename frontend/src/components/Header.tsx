import { Globe2, Menu, Search, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../lib/authContext';

export function Header({ marketplace = false }: { marketplace?: boolean }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setOpen(false);
      navigate('/', { replace: true });
    }
  };
  return <header className="site-header">
    <Logo />
    {marketplace ? <><button className="location">⌖ Marrickville, NSW⌄</button><label className="header-search"><Search size={17}/><input aria-label="Search food" placeholder="Search food, stores, or categories..." /></label></> : null}
    <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu /></button>
    <nav className={open ? 'main-nav open' : 'main-nav'}>
      {user?.role === 'vendor' ? <>
        <Link to="/vendor">Dashboard</Link><Link to="/vendor/upload">Upload stock</Link><Link to="/vendor/partner">Partner status</Link><Link to="/sponsors">For sponsors</Link>
      </> : <>
        <Link to="/marketplace">Find food</Link><Link to="/suggested">Suggested</Link>{user && <Link to="/requests">My requests</Link>}<Link to="/vendors/signup">Business signup</Link><Link to="/sponsors">For sponsors</Link>
      </>}
    </nav>
    <div className="header-actions">
      <button className="icon-button"><Globe2 size={16}/> EN</button>
      {user ? (
        <><Link className="header-user header-user--link" to={user.role === 'vendor' ? '/vendor' : '/profile'} title={user.role === 'vendor' ? 'Open vendor dashboard' : 'Open my profile'}><UserRound size={15}/><span>{user.role === 'vendor' ? user.vendorName || user.username : user.username}</span></Link><button className="button button-sm" type="button" onClick={handleLogout}>Log out</button></>
      ) : (
        <><Link className="icon-button" to="/login">Log in</Link><Link className="button button--secondary button-sm" to="/vendors/signup">Business signup</Link><Link className="button button-sm" to="/register">Get food support</Link></>
      )}
    </div>
  </header>;
}
