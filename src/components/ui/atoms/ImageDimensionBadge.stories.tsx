import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ImageDimensionBadge } from "./ImageDimensionBadge";

const meta = {
  title: "UI/Atoms/ImageDimensionBadge",
  component: ImageDimensionBadge,
  tags: ["ai-generated"],
} satisfies Meta<typeof ImageDimensionBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Landscape (width >= height) picks the "Desktop" sky-blue variant.
export const Landscape: Story = {
  args: { width: 1600, height: 900 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("1600×900 · Desktop")).toBeVisible();
  },
};

// Portrait picks the "Mobile" fuchsia variant — the width/height comparison
// is the component's only real branch, so this is the one worth a play.
export const Portrait: Story = {
  args: { width: 900, height: 1600 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("900×1600 · Mobile")).toBeVisible();
  },
};
