import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Container } from "./Container";

const meta = {
  title: "UI/Layout/Container",
  component: Container,
  tags: ["ai-generated"],
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

// Purely a max-width + centering wrapper — no interactive behavior to assert
// beyond the render itself succeeding, so no play function here.
export const Default: Story = {
  args: {
    children: (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Page content constrained to max-w-[1300px]
      </div>
    ),
  },
};

export const WithExtraPadding: Story = {
  args: {
    className: "py-14",
    children: (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        className lets callers layer on their own vertical padding
      </div>
    ),
  },
};
