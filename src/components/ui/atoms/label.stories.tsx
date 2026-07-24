import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "./label";
import { Input } from "./input";

const meta = {
  title: "UI/Atoms/Label",
  component: Label,
  tags: ["autodocs"],
  args: {
    children: "Full Name",
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInput: Story = {
  render: () => (
    <div>
      <Label htmlFor="story-name">Full Name *</Label>
      <Input id="story-name" placeholder="e.g. Sales Executive" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <Label>
      Employment Type <span className="font-normal text-muted-foreground">(optional)</span>
    </Label>
  ),
};
