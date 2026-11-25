"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { signOutAction } from "@/app/signout-action";
import { switchCompanyAction } from "@/app/onboarding/actions";

type NavItem = { label: string; href: string; icon: React.ReactNode; permission: string };
type CompanyOption = { companyId: string; name: string };

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
  alerts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  ),
  audit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" />
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
      { label: "Dashboard", href: "/dashboard", icon: icons.dashboard, permission: "dashboard.view" },
      { label: "Cash", href: "/cash", icon: icons.cash, permission: "cash.view" },
      { label: "Forecast", href: "/forecast", icon: icons.forecast, permission: "forecast.view" },
      { label: "Alerts", href: "/alerts", icon: icons.alerts, permission: "dashboard.view" },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Invoices", href: "/invoices", icon: icons.invoices, permission: "invoices.view" },
      { label: "Retainers", href: "/retainers", icon: icons.retainers, permission: "retainers.manage" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Expenses", href: "/expenses", icon: icons.expenses, permission: "expenses.submit" },
      { label: "Parties", href: "/parties", icon: icons.parties, permission: "parties.view" },
      { label: "Simulations", href: "/simulations", icon: icons.simulations, permission: "simulations.use" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Company", href: "/settings/company", icon: icons.company, permission: "company.manage" },
      { label: "Members", href: "/settings/members", icon: icons.members, permission: "expenses.submit" },
      { label: "Audit log", href: "/settings/audit", icon: icons.audit, permission: "audit.view" },
    ],
  },
];

/** Links the role cannot use are hidden; the server still checks every action. */
function NavLinks({ onNavigate, stagger = false, permissions }: { onNavigate?: () => void; stagger?: boolean; permissions: readonly string[] }) {
  const pathname = usePathname();
  let index = 0;
  const visible = sections
    .map((section) => ({ ...section, items: section.items.filter((item) => permissions.includes(item.permission)) }))
    .filter((section) => section.items.length > 0);
  return (
    <nav aria-label="Main" className="nav-list">
      {visible.map((section) => (
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
                >
                  {active && (
                    <motion.span
                      layoutId={onNavigate ? "nav-active-drawer" : "nav-active"}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="nav-pill"
                    />
                  )}
                  <span className="nav-label">
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

type SidebarProps = { email: string | null; name: string | null; role: string | null; companyName: string | null; companyId: string; companies: CompanyOption[]; permissions: readonly string[] };

function SidebarContent({ email, name, onNavigate, stagger, role, companyName, companyId, companies, permissions }: SidebarProps & { onNavigate?: () => void; stagger?: boolean }) {
  const initials = (name ?? email ?? "U")
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <>
      <Link href="/" onClick={onNavigate} className="nav-brand">
        <div className="nav-brand-row">
          <div className="nav-avatar nav-avatar-lg">
            <span>C</span>
          </div>
          <div>
            <div className="nav-brand-name">CashPilot</div>
            <div className="mono">{companyName ?? "Company"}</div>
          </div>
        </div>
      </Link>

      {companies.length > 1 && (
        <form action={switchCompanyAction} className="company-switch">
          <label className="mono company-label" htmlFor="company-switcher">Company</label>
          <select id="company-switcher" name="companyId" className="company-select" defaultValue={companyId} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
            {companies.map((company) => <option key={company.companyId} value={company.companyId}>{company.name}</option>)}
          </select>
        </form>
      )}

      <NavLinks onNavigate={onNavigate} stagger={stagger} permissions={permissions} />
      <Link href="/onboarding" onClick={onNavigate} className="nav-link nav-link-secondary">+ New company</Link>

      <div className="nav-footer">
        <div className="glass user-card">
          <div className="nav-avatar">{initials || "U"}</div>
          <div className="user-meta">
            <div className="user-name-row">
              <div className="user-name">
                {name ?? "Team member"}
              </div>
              <span className={`role-badge role-${role ?? "member"}`}>
                {role === "owner" ? "owner" : role === "finance_manager" ? "finance" : role ?? "member"}
              </span>
            </div>
            <div className="user-email">
              {email ?? "signed in"}
            </div>
          </div>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="nav-signout nav-signout-full">
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}

export default function NavSidebar(props: SidebarProps) {
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
        <SidebarContent {...props} stagger />
      </motion.aside>

      <div className="app-topbar">
        <button type="button" className="app-menu-button" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
          {icons.menu}
        </button>
        <div className="nav-brand-name">CashPilot</div>
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
              className="drawer-backdrop"
            />
            <motion.aside
              className="sidebar-drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="drawer-close">
                <button type="button" className="app-menu-button" aria-label="Close menu" onClick={close}>
                  {icons.close}
                </button>
              </div>
              <SidebarContent {...props} onNavigate={close} stagger />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
