import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Inbox, Plus } from "lucide-react";
import { EmptyState } from "./empty-state";
import { Button } from "../atoms/button";

const meta = {
  title: "UI/Molecules/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    title: "No jobs yet. Create your first one!",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {};

export const WithIcon: Story = {
  args: {
    icon: Inbox,
    title: "No applications yet.",
  },
};

export const WithDescriptionAndAction: Story = {
  args: {
    icon: Inbox,
    title: "No banners yet",
    description: "Announce offers with a top strip, or spotlight a deal with an inline promo card.",
    action: (
      <Button size="sm">
        <Plus className="h-4 w-4" /> New Banner
      </Button>
    ),
  },
};
