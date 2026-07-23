import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { SectionHeading } from "./SectionHeading";

// Not used anywhere in the app — 19 files hand-roll this exact kicker/title/
// description/action shape, but each wraps every piece in its own
// framer-motion scroll-reveal (fadeUp/fadeUpLg/fadeIn from src/lib/motion.ts),
// which this static component doesn't have. Real reuse potential, but not a
// drop-in replacement yet — kept under "Extras" until it grows a motion-aware
// variant.
const meta = {
  title: "Extras/SectionHeading",
  component: SectionHeading,
  tags: ["ai-generated"],
  args: {
    eyebrow: "Kashmir Packages",
    title: "Handpicked Tours",
  },
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: /handpicked tours/i })).toBeVisible();
  },
};

export const WithDescription: Story = {
  args: {
    description: "Curated honeymoon, family, adventure and luxury packages across the valley.",
  },
};

export const WithAction: Story = {
  args: {
    actionLabel: "View all",
    actionHref: "/tours",
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: /view all/i });
    await expect(link).toHaveAttribute("href", "/tours");
  },
};
