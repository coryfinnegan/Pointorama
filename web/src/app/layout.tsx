import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Nav from "@/components/Nav";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pointorama",
  description: "Earn points, win prizes!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50`}>
        <Nav />
        <main className="container mx-auto px-4 py-8 max-w-5xl">{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
