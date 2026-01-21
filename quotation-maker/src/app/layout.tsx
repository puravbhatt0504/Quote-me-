import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { QuotationProvider } from "@/store/QuotationContext";
import { Sidebar } from "@/components";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "City Fire Services - Quotation Maker",
  description: "Professional quotation generator for City Fire Services - Fire Fighting Equipment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-slate-900 text-white`}>
        <QuotationProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-[280px] px-10 pb-10">
              {children}
            </main>
          </div>
        </QuotationProvider>
      </body>
    </html>
  );
}
