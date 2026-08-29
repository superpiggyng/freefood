import type { ReactNode } from "react";

export interface DashboardNavItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

interface DashboardShellProps {
  productLabel: string;
  navItems: DashboardNavItem[];
  userName: string;
  userRole: string;
  children: ReactNode;
}

export function DashboardShell({ productLabel, navItems, userName, userRole, children }: DashboardShellProps) {
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar" aria-label={`${productLabel} navigation`}>
        <a className="dashboard-logo" href="/" aria-label="SAVR home">SAVR <small>{productLabel}</small></a>
        <nav className="dashboard-nav">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className={item.active ? "is-active" : undefined} aria-current={item.active ? "page" : undefined}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div className="dashboard-user">
          <span className="dashboard-avatar" aria-hidden="true">{userName.charAt(0)}</span>
          <span><strong>{userName}</strong><small>{userRole}</small></span>
        </div>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}

interface MetricCardProps { label: string; value: string; detail: string }
export function MetricCard({ label, value, detail }: MetricCardProps) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

export type StatusTone = "positive" | "warning" | "danger" | "neutral";
export function StatusBadge({ children, tone = "positive" }: { children: ReactNode; tone?: StatusTone }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}
