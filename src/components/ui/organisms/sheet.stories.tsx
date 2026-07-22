import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../atoms/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = {
  title: "UI/Organisms/Sheet",
  component: Sheet,
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function SheetExample({ side }: { side: "top" | "bottom" | "left" | "right" }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open from {side}</Button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Edit job posting</SheetTitle>
          <SheetDescription>Update the role details, then save.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export const Right: Story = { render: () => <SheetExample side="right" /> };
export const Left: Story = { render: () => <SheetExample side="left" /> };
export const Top: Story = { render: () => <SheetExample side="top" /> };
export const Bottom: Story = { render: () => <SheetExample side="bottom" /> };
