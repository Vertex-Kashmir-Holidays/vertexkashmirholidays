import { ListSkeleton } from "@/components/ui/molecules/list-skeleton";

// Shown while the packages list RSC streams. Mirrors PackagesClient's layout:
// heading + New Package, search + category filter, then the Tour/Category/
// Duration/Price/Rating/Status/Date/Actions table.
export default function AdminPackagesLoading() {
  return (
    <ListSkeleton
      label="Loading packages"
      filters={["flex-1", "w-40", "w-24"]}
      columns={["flex-1", "w-24", "w-20", "w-20", "w-16", "w-16", "w-20", "w-16"]}
    />
  );
}
