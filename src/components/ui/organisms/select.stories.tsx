import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta = {
  title: "UI/Organisms/Select",
  component: Select,
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select defaultValue="FULL_TIME">
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="FULL_TIME">Full-time</SelectItem>
        <SelectItem value="PART_TIME">Part-time</SelectItem>
        <SelectItem value="CONTRACT">Contract</SelectItem>
        <SelectItem value="INTERNSHIP">Internship</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Placeholder: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a status..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="NEW">New</SelectItem>
        <SelectItem value="CONNECTED">Connected</SelectItem>
        <SelectItem value="CONVERTED">Converted</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select defaultValue="NEW" disabled>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="NEW">New</SelectItem>
      </SelectContent>
    </Select>
  ),
};
