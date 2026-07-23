import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AdminSearchInput } from "./admin-search-input";

const meta = {
  title: "UI/Molecules/AdminSearchInput",
  component: AdminSearchInput,
  tags: ["autodocs"],
} satisfies Meta<typeof AdminSearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled(props: { placeholder?: string; className?: string }) {
  const [value, setValue] = useState("");
  return <AdminSearchInput {...props} value={value} onChange={setValue} />;
}

export const Default: Story = {
  args: { value: "", onChange: () => {}, placeholder: "Search name, phone, email, ref..." },
  render: (args) => <Controlled placeholder={args.placeholder} />,
};

export const NarrowWidth: Story = {
  args: { value: "", onChange: () => {}, placeholder: "Search jobs...", className: "max-w-sm" },
  render: (args) => <Controlled placeholder={args.placeholder} className={args.className} />,
};
