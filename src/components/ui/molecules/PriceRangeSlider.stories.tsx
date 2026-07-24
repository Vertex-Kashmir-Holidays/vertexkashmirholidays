import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { PriceRangeSlider } from "./PriceRangeSlider";

const meta = {
  title: "UI/Molecules/PriceRangeSlider",
  component: PriceRangeSlider,
  tags: ["ai-generated"],
} satisfies Meta<typeof PriceRangeSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

// Fully controlled (value/onChange) — wrap in local state so the story is
// actually interactive, same pattern as ToursFiltersSidebar/ActivitiesPageClient.
function ControlledSlider() {
  const [value, setValue] = useState<[number, number]>([2000, 8000]);
  return <PriceRangeSlider min={0} max={10000} step={500} value={value} onChange={setValue} />;
}

export const Default: Story = {
  args: { min: 0, max: 10000, step: 500, value: [2000, 8000], onChange: () => {} },
  render: () => <ControlledSlider />,
};

// Real interaction: move the min-price thumb with the keyboard and confirm
// the displayed price actually updates — proves onChange -> re-render works,
// not just that the component mounts.
export const DragMinThumb: Story = {
  args: { min: 0, max: 10000, step: 500, value: [2000, 8000], onChange: () => {} },
  render: () => <ControlledSlider />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("₹2,000")).toBeVisible();
    // The two range inputs overlap (see the component's own comment — only
    // each thumb's pseudo-element has pointer-events, the track doesn't), so
    // neither userEvent.click nor a focus+arrow-key press reaches this
    // input's native stepping in this environment. Simulate the drag the way
    // React Testing Library documents for controlled inputs: set the value
    // through the native setter (bypassing React's own override) and fire a
    // real "input" event so the component's onChange actually runs.
    const minInput = canvas.getByLabelText("Minimum price") as HTMLInputElement;
    const nativeValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    nativeValueSetter.call(minInput, "2500");
    minInput.dispatchEvent(new Event("input", { bubbles: true }));
    await expect(canvas.getByText("₹2,500")).toBeVisible();
  },
};
