import { BarChart3, CircleHelp, ClipboardList, LayoutDashboard, LogOut, Package, Settings, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

const icons = [LayoutDashboard, Package, ClipboardList, BarChart3, UserRound, Settings];
export interface NavItem { label: string; href: string; active?: boolean }
export function AppSidebar({ label = 'For Business', items, admin = false }: { label?: string; items: NavItem[]; admin?: boolean }) {
  return <aside className="app-sidebar"><Logo light/><small>{label}</small><nav>{items.map((item, i) => { const Icon = icons[i % icons.length]; return <Link key={item.label} className={item.active ? 'active' : ''} to={item.href}><Icon size={18}/>{item.label}</Link>; })}</nav><div className="sidebar-bottom"><a href="#help"><CircleHelp size={18}/>Help</a><div className="user-chip"><span className="avatar">{admin ? 'A' : 'BL'}</span><span><strong>{admin ? 'Admin' : 'Bakers Lane'}</strong><small>{admin ? 'Super user' : 'View profile'}</small></span><LogOut size={16}/></div></div></aside>;
}
