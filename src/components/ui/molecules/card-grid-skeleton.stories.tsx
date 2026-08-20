import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CardGridSkeleton } from "./card-grid-skeleton";

const meta = {
  title: "UI/Molecules/CardGridSkeleton",
  component: CardGridSkeleton,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { label: "Loading tours" },
} satisfies Meta<typeof CardGridSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** /tours, /destinations, /blog — a three-across grid of image cards. */
export const Default: Story = { args: { count: 6 } };

/** /account/bookings — a single-column list with no cover image. */
export const SingleColumnTextOnly: Story = {
  args: { label: "Loading bookings", count: 3, columns: 1, media: false },
};
