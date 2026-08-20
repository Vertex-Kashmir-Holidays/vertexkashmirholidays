import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HeroSkeleton } from "./hero-skeleton";

const meta = {
  title: "UI/Molecules/HeroSkeleton",
  component: HeroSkeleton,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HeroSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default SecondaryHero band — /destinations, /blog/[slug]. */
export const Default: Story = {};

/** Pages whose hero carries a lead-capture card on the right — /tours. */
export const WithAside: Story = { args: { aside: true } };

/** SecondaryHero's half-height band. */
export const Compact: Story = { args: { compact: true } };
