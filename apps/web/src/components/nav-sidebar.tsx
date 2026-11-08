"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { signOutAction } from "@/app/signout-action";

type NavItem = { label: string; href: string; icon: React.ReactNode };

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" />
    </svg>
  ),
  invoices: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><path d="M15 2v5h5" /><path d="M9 13h6" /><path d="M9 17h4" />
    </svg>
  ),
  expenses: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="6" width="20" height="12" rx="3" /><path d="M2 10h20" /><path d="M6 15h4" />
    </svg>
  ),
  parties: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" /><circle cx="17.5" cy="9.5" r="2.5" /><path d="M17 14.5c3 0 5 1.8 5 4.5" />
    </svg>
  ),
  cash: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 7h18v12H3z" rx="2" /><circle cx="12" cy="13" r="3" /><path d="M6 10h.01M18 16h.01" />
    </svg>
  ),
  forecast: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 20h18" /><path d="M5 20V10" /><path d="M10 20V6" /><path d="M15 20v-6" /><path d="M20 20V9" />
    </svg>
  ),
  simulations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6c4 0 4 5 8 5s4-5 8-5" /><path d="M4 18c4 0 4-5 8-5s4 5 8 5" />
    </svg>
  ),
  retainers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3v18" /><path d="M17 6H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6" />
    </svg>
  ),
  company: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M14 9h4a2 2 0 0 1 2 2v10" /><path d="M2 21h20" /><path d="M8 7h2" /><path d="M8 11h2" /><path d="M8 15h2" />
    </svg>
  ),
  members: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12" /><path d="M18 6L6 18" />
    </svg>
  ),
};

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: icons.dashboard },
      { label: "Cash", href: "/cash", icon: icons.cash },
      { label: "Forecast", href: "/forecast", icon: icons.forecast },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Invoices", href: "/invoices", icon: icons.invoices },
      { label: "Retainers", href: "/retainers", icon: icons.retainers },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Expenses", href: "/expenses", icon: icons.expenses },
      { label: "Parties", href: "/parties", icon: icons.parties },
      { label: "Simulations", href: "/simulations", icon: icons.simulations },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Company", href: "/settings/company", icon: icons.company },
      { label: "Members", href: "/settings/members", icon: icons.members },
    ],
  },
];

function NavLinks({ onNavigate, stagger = false }: { onNavigate?: () => void; stagger?: boolean }) {
  const pathname = usePathname();
  let index = 0;
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {sections.map((section) => (
        <div key={section.title}>
          <p className="nav-section-title">{section.title}</p>
          {section.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const delay = stagger ? index * 0.035 : 0;
            index += 1;
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`nav-link ${active ? "active" : ""}`}
                  style={{ position: "relative" }}
                >
                  {active && (
                    <motion.span
                      layoutId={onNavigate ? "nav-active-drawer" : "nav-active"}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      style={{ position: "absolute", inset: 0, borderRadius: 14, background: "var(--pine-600)" }}
                    />
                  )}
                  <span style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}>
                    {item.icon}
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarContent({ email, name, onNavigate, stagger }: { email: string | null; name: string | null; onNavigate?: () => void; stagger?: boolean }) {
  const initials = (name ?? email ?? "U")
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <>
      <Link href="/dashboard" onClick={onNavigate} style={{ textDecoration: "none", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="nav-avatar" style={{ width: 42, height: 42, borderRadius: 16 }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 15 }}>C</span>
          </div>
          <div>
            <div style={{ fontFamily: "Outfit, system-ui, sans-serif", fontWeight: 650, fontSize: 17, color: "var(--text-primary)" }}>CashPilot</div>
            <div className="mono" style={{ margin: 0 }}>Atlas Studio</div>
          </div>
        </div>
      </Link>

      <NavLinks onNavigate={onNavigate} stagger={stagger} />

      <div style={{ marginTop: "auto", paddingTop: 16 }}>
        <div className="glass" style={{ padding: 14, borderRadius: 18, display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div className="nav-avatar" style={{ flexShrink: 0 }}>{initials || "U"}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 650, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name ?? "Team member"}
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email ?? "signed in"}
            </div>
          </div>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="nav-signout" style={{ width: "100%" }}>
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}

export default function NavSidebar({ email, name }: { email: string | null; name: string | null }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const close = () => setDrawerOpen(false);

  return (
    <>
      <motion.aside
        className="sidebar"
        initial={{ x: -48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <SidebarContent email={email} name={name} stagger />
      </motion.aside>

      <div className="app-topbar">
        <button type="button" className="app-menu-button" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
          {icons.menu}
        </button>
        <div style={{ fontFamily: "Outfit, system-ui, sans-serif", fontWeight: 650, fontSize: 16 }}>CashPilot</div>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={close}
              style={{ position: "fixed", inset: 0, background: "rgba(11, 31, 23, 0.35)", zIndex: 55, backdropFilter: "blur(2px)" }}
            />
            <motion.aside
              className="sidebar-drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <button type="button" className="app-menu-button" aria-label="Close menu" onClick={close}>
                  {icons.close}
                </button>
              </div>
              <SidebarContent email={email} name={name} onNavigate={close} stagger />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
