import { TerrainProvider } from "@/components/terrain/terrain-provider";

export default function TerrainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-white">
      <TerrainProvider>{children}</TerrainProvider>
    </div>
  );
}
