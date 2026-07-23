import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus } from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "../atoms/button";

const meta = {
  title: "UI/Molecules/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  args: {
    title: "Leads",
    description: "128 total leads",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  args: { description: undefined },
};

export const WithDescription: Story = {};

export const WithAction: Story = {
  args: {
    action: (
      <Button size="sm">
        <Plus className="h-4 w-4" /> New Lead
      </Button>
    ),
  },
};
