export type RecipientNavItem =
  | "overview"
  | "browse"
  | "requests"
  | "saved"
  | "profile"
  | "settings"
  | "help";

interface RecipientSidebarProps {
  activeItem: RecipientNavItem;
}

const navigation: Array<{ id: RecipientNavItem; label: string; href: string }> = [
  { id: "overview", label: "Overview", href: "/recipient" },
  { id: "browse", label: "Browse food", href: "/marketplace" },
  { id: "requests", label: "My requests", href: "/recipient/requests" },
  { id: "saved", label: "Saved", href: "/recipient/saved" },
  { id: "profile", label: "Profile", href: "/recipient/profile" },
  { id: "settings", label: "Settings", href: "/recipient/settings" },
  { id: "help", label: "Help", href: "/help" },
];

export function RecipientSidebar({ activeItem }: RecipientSidebarProps) {
  return (
    <aside className="recipient-sidebar">
      <nav className="recipient-sidebar__nav" aria-label="Recipient dashboard">
        {navigation.map((item) => (
          <a
            className={`recipient-sidebar__link${item.id === activeItem ? " recipient-sidebar__link--active" : ""}`}
            href={item.href}
            aria-current={item.id === activeItem ? "page" : undefined}
            key={item.id}
          >
            <span className="recipient-sidebar__icon" aria-hidden="true" />
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
