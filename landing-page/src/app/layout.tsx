import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pointorama — Stop nagging. Start rewarding.",
  description: "The reward system that makes kids want to behave — without reminders, charts on the fridge, or empty promises.",
  openGraph: {
    title: "Pointorama — Stop nagging. Start rewarding.",
    description: "Gamified rewards for kids. Real prizes. Zero nagging.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#080818", color: "#e8e8ff", fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
