import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";

const meta = {
  title: "UI/Atoms/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "e.g. Sales Executive",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithValue: Story = { args: { defaultValue: "Vertex Kashmir Holidays" } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "Read only" } };
export const Email: Story = { args: { type: "email", placeholder: "you@example.com" } };
export const Number: Story = { args: { type: "number", defaultValue: 0 } };
export const DateInput: Story = { args: { type: "date" } };
