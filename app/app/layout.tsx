import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const metadata: Metadata = {title:"Saath — Someone alongside you",description:"Talk to a listener, practise a hard conversation, or sit with a circle. Someone alongside you.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en" className={inter.variable} suppressHydrationWarning><body className={inter.className} suppressHydrationWarning>{children}</body></html>;}
