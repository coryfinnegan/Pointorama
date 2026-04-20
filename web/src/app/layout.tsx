import type { Metadata } from "next";
import { Press_Start_2P, Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import GameNav from "@/components/GameNav";
import Starfield from "@/components/Starfield";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pointorama ⭐",
  description: "Earn points, win prizes!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pressStart2P.variable} ${nunito.variable}`}>
      <body>
        <Starfield />
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
        <GameNav />
        <Toaster
          toastOptions={{
            style: {
              background: "var(--bg2)",
              border: "2px solid rgba(255,215,0,0.3)",
              color: "var(--text)",
              fontFamily: "var(--pixel)",
              fontSize: "10px",
            },
          }}
          position="top-center"
        />
      </body>
    </html>
  );
}
