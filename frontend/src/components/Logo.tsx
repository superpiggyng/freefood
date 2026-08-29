import { Link } from 'react-router-dom';
export function Logo({ light = false, to = "/" }: { light?: boolean; to?: string }) { return <Link className={`logo ${light ? 'logo-light' : ''}`} to={to}><img src="/carrot-icon.png" alt=""/><span>SAVR</span></Link>; }
