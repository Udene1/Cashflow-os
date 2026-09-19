import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Cashflow OS", description: "A lightweight operating system for turning leads into cash." };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}