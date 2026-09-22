import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Geometric, engineering-driven sans per the HealthTech Minimalist brief.
// Bound to --font-sans directly (matching globals.css's `@theme inline`
// mapping) — the previous Geist setup bound to --font-geist-sans instead,
// which that theme mapping never actually referenced, so it silently fell
// back to the browser default rather than applying the intended typeface.
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuraLink Care",
  description: "From signals to understanding — assistive monitoring and AI-assisted support for caregivers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
