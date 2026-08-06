import { RoutePage } from "@/features/route-page";

export default async function CatchAllPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return <RoutePage path={path} />;
}
