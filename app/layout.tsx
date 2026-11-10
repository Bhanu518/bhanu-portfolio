import type { Metadata } from "next";
import { Anton, Caveat_Brush, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const caveat = Caveat_Brush({ subsets: ["latin"], weight: "400", variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "Bhanu Prasad Junnu — Portfolio",
  description: "Portfolio of Bhanu Prasad Junnu, Computer Science student and aspiring Software Development Engineer.",
};

const bootScript = `document.documentElement.classList.add('build-mode');`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head><script dangerouslySetInnerHTML={{ __html: bootScript }} /></head>
      <body className={`${anton.variable} ${geist.variable} ${geistMono.variable} ${caveat.variable}`}>{children}</body>
    </html>
  );
}
