export const brand = {
  serviceName: "수리온",
  serviceDescription: "전자제품 수리 커뮤니티",
  slogan: "고장 경험을 나누고, 전문가에게 묻고, 안전하게 고치세요.",
  logoPath: "/brand/surion-logo.png",
  markPath: "/brand/surion-mark.png",
  primaryColor: "#2563EB",
  secondaryColor: "#00BFA6",
  inkColor: "#0F172A",
  surfaceColor: "#F6F8FC",
} as const;

export type BrandConfig = typeof brand;
