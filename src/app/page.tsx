import { DiscoveryPreview } from "@/components/discovery/discovery-preview";
import { AppNavigation } from "@/components/navigation/app-navigation";

export default function HomePage() {
  return (
    <div className="app-frame">
      <AppNavigation />
      <main>
        <DiscoveryPreview />
      </main>
    </div>
  );
}
