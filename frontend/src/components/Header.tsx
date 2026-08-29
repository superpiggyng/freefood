import { Globe2, Menu, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function Header({ marketplace = false }: { marketplace?: boolean }) {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <Logo />
    {marketplace ? <><button className="location">⌖ Marrickville, NSW⌄</button><label className="header-search"><Search size={17}/><input aria-label="Search food" placeholder="Search food, stores, or categories..." /></label></> : null}
    <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu /></button>
    <nav className={open ? 'main-nav open' : 'main-nav'}>
      <Link to="/marketplace">Find food</Link><Link to="/suggested">Suggested</Link><Link to="/requests">My requests</Link><Link to="/vendor">For businesses</Link>
    </nav>
    <div className="header-actions"><button className="icon-button"><Globe2 size={16}/> EN</button><Link className="button button-sm" to="/eligibility">Get started</Link></div>
  </header>;
}
