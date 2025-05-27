import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Water4WeightLoss - HydrateAI",
  description: "AI-powered hydration tracking for healthy weight loss. Track your water intake with personalized Australian support.",
  icons: {
    icon: '/logo-128.png',
    apple: '/logo-192.png',
    shortcut: '/logo-128.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}