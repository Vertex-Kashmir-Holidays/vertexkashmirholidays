import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Pencil } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

// Tooltip needs a TooltipProvider ancestor — already supplied globally by
// .storybook/preview.tsx's decorator, the same way it's wired once in
// (public)/layout.tsx and admin/layout.tsx for the real app.
const meta = {
  title: "UI/Atoms/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Edit</TooltipContent>
    </Tooltip>
  ),
};
