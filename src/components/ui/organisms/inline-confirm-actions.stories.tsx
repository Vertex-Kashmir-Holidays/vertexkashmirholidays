import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Pencil, Trash2 } from "lucide-react";
import { InlineConfirmActions } from "./inline-confirm-actions";

const meta = {
  title: "UI/Organisms/InlineConfirmActions",
  component: InlineConfirmActions,
  tags: ["autodocs"],
} satisfies Meta<typeof InlineConfirmActions>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled({ pending }: { pending?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <InlineConfirmActions
      confirming={confirming}
      onConfirm={() => setConfirming(false)}
      onCancel={() => setConfirming(false)}
      pending={pending}
    >
      <button
        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        aria-label="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setConfirming(true)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
        aria-label="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </InlineConfirmActions>
  );
}

const dummyArgs = {
  confirming: false,
  onConfirm: () => {},
  onCancel: () => {},
  children: null,
};

export const Default: Story = {
  args: dummyArgs,
  render: () => <Controlled />,
};

export const Confirming: Story = {
  args: { ...dummyArgs, confirming: true },
  render: () => (
    <InlineConfirmActions confirming onConfirm={() => {}} onCancel={() => {}}>
      <span />
    </InlineConfirmActions>
  ),
};

export const Pending: Story = {
  args: { ...dummyArgs, confirming: true, pending: true },
  render: () => (
    <InlineConfirmActions confirming pending onConfirm={() => {}} onCancel={() => {}}>
      <span />
    </InlineConfirmActions>
  ),
};
