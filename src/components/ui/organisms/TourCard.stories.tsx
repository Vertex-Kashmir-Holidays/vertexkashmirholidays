import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { TourCard } from "./TourCard";

const sampleTour = {
  badge: "Best Seller",
  bc: "green" as const,
  image: "",
  detailHref: "/tours/kashmir-honeymoon-special",
  t: "Kashmir Honeymoon Special",
  d: "5N/6D",
  places: "Srinagar, Gulmarg, Pahalgam",
  r: "4.9",
  n: "120",
  old: "₹45,000",
  p: "₹38,999",
};

const meta = {
  title: "UI/Organisms/TourCard",
  component: TourCard,
  tags: ["ai-generated"],
  args: {
    tour: sampleTour,
    index: 0,
    variant: "tours",
  },
  decorators: [(Story) => <div className="max-w-sm"><Story /></div>],
} satisfies Meta<typeof TourCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// No toBeVisible() here on purpose: the card's outer motion.div starts at
// opacity: 0 and only animates in via whileInView once scrolled into view —
// real, intentional behavior, not something a smoke test should fight.
// getByRole already throws (failing the test) if the heading isn't rendered.
export const Default: Story = {
  play: async ({ canvas }) => {
    canvas.getByRole("heading", { name: /kashmir honeymoon special/i });
  },
};

export const HomeVariant: Story = {
  args: { variant: "home" },
};

// Proves the shared preview actually loaded the real Tailwind build, not just
// that the card mounted — badge.green (tailwind.config.ts) is a fixed HSL
// value, hsl(151 65% 26%), which the browser resolves to this exact rgb().
export const CssCheck: Story = {
  play: async ({ canvas }) => {
    const badge = canvas.getByText("Best Seller");
    await expect(getComputedStyle(badge).backgroundColor).toBe("rgb(23, 109, 68)");
  },
};
