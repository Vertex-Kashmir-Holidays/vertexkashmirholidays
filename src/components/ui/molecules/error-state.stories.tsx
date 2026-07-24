import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErrorState } from "./error-state";

const meta = {
  title: "UI/Molecules/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRetry: Story = {
  args: {
    title: "Could not load applications.",
    onRetry: () => alert("retry clicked"),
  },
};

export const WithDescription: Story = {
  args: {
    title: "Couldn't load the gallery.",
    description: "Check your connection and try again.",
    onRetry: () => alert("retry clicked"),
  },
};
