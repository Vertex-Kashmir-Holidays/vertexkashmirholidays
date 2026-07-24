import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ThemeToggle } from "./ThemeToggle";

const meta = {
  title: "UI/Atoms/ThemeToggle",
  component: ThemeToggle,
  tags: ["ai-generated"],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// Exercises the real next-themes ThemeProvider wired in .storybook/preview.tsx
// (not a reimplementation) — clicking really calls setTheme(), so the
// aria-label flipping is proof the shared provider tree actually works.
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const button = await canvas.findByRole("button", { name: /switch to dark mode/i });
    await userEvent.click(button);
    await expect(await canvas.findByRole("button", { name: /switch to light mode/i })).toBeVisible();
  },
};
