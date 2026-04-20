"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/",     icon: "🏠", label: "HOME"  },
  { href: "/shop", icon: "🛍️", label: "SHOP"  },
  { href: "/log",  icon: "📜", label: "LOG"   },
];

export default function GameNav() {
  const pathname = usePathname();
  // Hide the nav on admin pages
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* Hidden admin access — barely visible in top-right */}
      <Link
        href="/admin"
        style={{
          position: "fixed", top: 14, right: 16, background: "none", border: "none",
          fontSize: 20, cursor: "pointer", zIndex: 300, opacity: 0.2, lineHeight: 1, padding: 6,
          color: "var(--text)", textDecoration: "none",
        }}
        title="Admin"
      >
        🔒
      </Link>

      <nav className="game-nav">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`game-navbtn${active ? " active" : ""}`}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
