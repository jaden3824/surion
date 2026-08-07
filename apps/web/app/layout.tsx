import type { Metadata, Viewport } from "next";
import { brand } from "@surion/config";
import { AppShell } from "@/components/app-shell";
import { DemoStoreProvider } from "@/features/demo-store";
import { getAuthState } from "@/lib/auth/viewer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${brand.serviceName} · ${brand.serviceDescription}`, template: `%s | ${brand.serviceName}` },
  description: brand.slogan,
  icons: {
    icon: [{ url: "/brand/surion-favicon.png?v=2", type: "image/png", sizes: "64x64" }],
    shortcut: "/brand/surion-favicon.png?v=2",
    apple: [{ url: "/brand/surion-apple-touch-icon.png?v=2", type: "image/png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = { themeColor: brand.primaryColor, width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const auth = await getAuthState();

  return (
    <html lang="ko">
      <body>
        <DemoStoreProvider>
          <AppShell viewer={auth.viewer}>{children}</AppShell>
        </DemoStoreProvider>
      </body>
    </html>
  );
}
