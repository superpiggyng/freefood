export type RecipientNavItem =
  | "browse"
  | "suggested"
  | "requests"
  | "profile"
  | "preferences";

interface RecipientSidebarProps {
  activeItem: RecipientNavItem;
}

const navigation = [
  { id: "browse", label: "Browse food", href: "/marketplace", icon: LayoutGrid },
  { id: "suggested", label: "Suggested for you", href: "/suggested", icon: Sparkles },
  { id: "requests", label: "My requests", href: "/requests", icon: ShoppingBag },
  { id: "profile", label: "Profile & stats", href: "/profile", icon: UserRound },
  { id: "preferences", label: "Food preferences", href: "/preferences", icon: Settings2 },
] satisfies Array<{ id: RecipientNavItem; label: string; href: string; icon: typeof LayoutGrid }>;

export function RecipientSidebar({ activeItem }: RecipientSidebarProps) {
  return (
    <aside className="recipient-sidebar">
      <a className="recipient-sidebar__brand" href="/">
        <span><HeartHandshake size={19} /></span>
        <strong>savr</strong>
      </a>
      <p className="recipient-sidebar__label">Recipient portal</p>
      <nav className="recipient-sidebar__nav" aria-label="Recipient dashboard">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
          <a
            className={`recipient-sidebar__link${item.id === activeItem ? " recipient-sidebar__link--active" : ""}`}
            href={item.href}
            aria-current={item.id === activeItem ? "page" : undefined}
            key={item.id}
          >
            <Icon size={17} aria-hidden="true" />
            {item.label}
          </a>
          );
        })}
      </nav>
      <p className="recipient-sidebar__support">Making good food easier to access.</p>
    </aside>
  );
}
import { HeartHandshake, LayoutGrid, Settings2, ShoppingBag, Sparkles, UserRound } from "lucide-react";
