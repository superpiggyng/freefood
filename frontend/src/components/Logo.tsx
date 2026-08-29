import { Link } from 'react-router-dom';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link className={`logo ${light ? 'logo-light' : ''}`} to="/">
      <span className="logo__mark" aria-hidden="true"><img src="/carrot-icon.png" alt="" /></span>
      <span className="logo__word">SAVR</span>
    </Link>
  );
}
