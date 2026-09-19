import { TerrainProvider } from "@/components/terrain/terrain-provider";

export default function TerrainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#07111a]">
      <TerrainProvider>{children}</TerrainProvider>
    </div>
  );
}
