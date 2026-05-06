import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pointorama — Make chores worth doing",
  description: "The reward app that turns good behavior into points kids can spend on real prizes. Parents stay in control. Kids stay motivated.",
  openGraph: {
    title: "Pointorama — Make chores worth doing",
    description: "Gamified rewards for kids. Real prizes. Zero nagging.",
    type: "website",
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", zIndex: 9999, background: "#080818" }}>
      {children}
    </div>
  );
}
