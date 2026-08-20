import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormSkeleton } from "./form-skeleton";

const meta = {
  title: "UI/Molecules/FormSkeleton",
  component: FormSkeleton,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { label: "Loading package editor" },
} satisfies Meta<typeof FormSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** /admin/packages/new — two stacked field cards, no sidebar. */
export const CreateForm: Story = {};

/** /admin/bookings/[id]/services — breadcrumb plus the 3/1 detail split. */
export const DetailWithSidebar: Story = {
  args: {
    label: "Loading booking services",
    breadcrumb: true,
    sections: [4, 6],
    sidebar: 2,
  },
};
