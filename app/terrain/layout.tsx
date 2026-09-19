import { TerrainProvider } from "@/components/terrain/terrain-provider";

export default function TerrainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-white">
      <TerrainProvider>{children}</TerrainProvider>
    </div>
  );
}
