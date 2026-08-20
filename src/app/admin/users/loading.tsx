import { ListSkeleton } from "@/components/ui/molecules/list-skeleton";

// Shown while the users list RSC streams. Mirrors UsersClient's layout: heading
// with the customer count (no create action), search + "show deleted" toggle,
// then the User/Phone/Bookings/Reviews/Joined/Actions table.
export default function AdminUsersLoading() {
  return (
    <ListSkeleton
      label="Loading users"
      action={false}
      filters={["flex-1", "w-32", "w-20"]}
      columns={["flex-1", "w-28", "w-20", "w-20", "w-24", "w-16"]}
    />
  );
}
