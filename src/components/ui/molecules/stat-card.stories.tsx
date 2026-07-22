import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Users, CheckCircle2 } from "lucide-react";
import { StatCard } from "./stat-card";

const meta = {
  title: "UI/Molecules/StatCard",
  component: StatCard,
  tags: ["autodocs"],
  args: {
    label: "Total Leads",
    value: 128,
    icon: Users,
    accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    size: "sm",
    label: "Sent",
    value: 84,
    icon: CheckCircle2,
    accent: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
};
