import Image from "next/image";
import Link from "next/link";
import { brand } from "@surion/config";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand-logo" aria-label={`${brand.serviceName} 홈`}>
      <Image className="brand-wordmark" src={brand.logoPath} alt={`${brand.serviceName} 로고`} width={compact ? 112 : 150} height={compact ? 48 : 64} priority />
    </Link>
  );
}
