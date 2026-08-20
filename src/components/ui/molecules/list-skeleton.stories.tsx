import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ListSkeleton } from "./list-skeleton";

const meta = {
  title: "UI/Molecules/ListSkeleton",
  component: ListSkeleton,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Loading packages",
    columns: ["flex-1", "w-24", "w-20", "w-20", "w-16", "w-16", "w-20", "w-16"],
    filters: ["flex-1", "w-40", "w-24"],
  },
} satisfies Meta<typeof ListSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** /admin/packages — search + category filter above an eight-column table. */
export const AdminList: Story = {};

/** /admin/reviews — a stat row sits between the heading and the list. */
export const WithStats: Story = {
  args: {
    label: "Loading reviews",
    stats: 3,
    columns: ["flex-1", "w-24", "w-20", "w-16"],
    filters: ["flex-1", "w-48"],
  },
};

/** /account/payments — the table is swapped for stacked cards below `md`. */
export const TableWithMobileCards: Story = {
  args: {
    label: "Loading payments",
    action: false,
    filters: [],
    rows: 5,
    mobileCards: 3,
    columns: ["flex-1", "w-24", "w-20", "w-24", "w-20"],
  },
};
