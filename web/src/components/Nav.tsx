"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/shop", label: "Prize Shop" },
  { href: "/admin", label: "Admin" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 max-w-5xl flex items-center justify-between h-16">
        <span className="text-2xl font-bold text-indigo-600">⭐ Pointorama</span>
        <nav className="flex gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                pathname === link.href
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
