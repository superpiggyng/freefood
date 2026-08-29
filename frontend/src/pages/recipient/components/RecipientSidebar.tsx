export type RecipientNavItem =
  | "browse"
  | "suggested"
  | "requests"
  | "profile"
  | "preferences";

interface RecipientSidebarProps {
  activeItem: RecipientNavItem;
}

const navigation: Array<{ id: RecipientNavItem; label: string; href: string }> = [
  { id: "browse", label: "Browse food", href: "/marketplace" },
  { id: "suggested", label: "Suggested for you", href: "/suggested" },
  { id: "requests", label: "My requests", href: "/requests" },
  { id: "profile", label: "Your profile", href: "/eligibility" },
  { id: "preferences", label: "Food preferences", href: "/preferences" },
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
