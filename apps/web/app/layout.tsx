import type { Metadata, Viewport } from "next";
import { brand } from "@surion/config";
import { AppShell } from "@/components/app-shell";
import { DemoStoreProvider } from "@/features/demo-store";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${brand.serviceName} · ${brand.serviceDescription}`, template: `%s | ${brand.serviceName}` },
  description: brand.slogan,
  icons: { icon: brand.markPath, apple: brand.markPath },
};

export const viewport: Viewport = { themeColor: brand.primaryColor, width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <DemoStoreProvider><AppShell>{children}</AppShell></DemoStoreProvider>
      </body>
    </html>
  );
}
