import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MorphingShape } from "./MorphingShape";

// Not used anywhere in the app — a purely decorative animated blob with no
// existing duplicate to consolidate against. Kept under "Extras" as a
// speculative "nice for a future hero accent" component rather than "Effects"
// to keep the same not-yet-in-use signal as its unused siblings.
const meta = {
  title: "Extras/MorphingShape",
  component: MorphingShape,
  decorators: [
    (Story) => (
      <div className="h-40 w-40">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MorphingShape>;

export default meta;
type Story = StoryObj<typeof meta>;

// Purely decorative, continuously animating shape — no interactive behavior
// to assert beyond the render itself succeeding, so no play function here.
export const Default: Story = {};

export const FastCycle: Story = {
  args: { duration: 2 },
};
