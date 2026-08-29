import { Link } from 'react-router-dom';
export function Logo({ light = false }: { light?: boolean }) { return <Link className={`logo ${light ? 'logo-light' : ''}`} to="/"><img src="/savr-icon.png" alt=""/><span>SAVR</span></Link>; }
