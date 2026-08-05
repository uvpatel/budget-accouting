import type { Metadata } from "next";
import "./globals.css";
import { ViewTransitions } from "next-view-transitions";
import { Providers } from "./AuthProvider";
import { InvoiceProvider } from "@/context/invoice-context";

export const metadata: Metadata = {
  title: "Budget Accounting System – Shiv Furniture",
  description: "Budget Accounting and Financial Operations System for Shiv Furniture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased suppressHydrationWarning">
        <ViewTransitions>
          <InvoiceProvider>
            <Providers>{children}</Providers>
          </InvoiceProvider>
        </ViewTransitions>
      </body>
    </html>
  );
}
