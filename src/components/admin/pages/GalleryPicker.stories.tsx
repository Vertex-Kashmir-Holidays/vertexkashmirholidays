import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { GalleryPicker } from "./GalleryPicker";
import { mswHandlers } from "../../../../.storybook/msw-handlers";

const meta = {
  component: GalleryPicker,
  tags: ["ai-generated"],
  args: {
    open: true,
    onSelect: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof GalleryPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default MSW handler (mswHandlers.galleries, wired as preview.tsx's default)
// returns 3 sample assets — waits for the mocked fetch to actually resolve
// before asserting, proving MSW (not just the component) is wired correctly.
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const firstItem = await canvas.findByTitle("Dal Lake houseboat");
    await userEvent.click(firstItem);
    await expect(args.onSelect).toHaveBeenCalledWith("/brand/placeholders/svg/avatar-blue.svg");
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const Empty: Story = {
  parameters: { msw: { handlers: mswHandlers.galleriesEmpty } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/no media found/i)).toBeVisible();
  },
};

// Exercises the ErrorState added this session (src/components/ui/error-state.tsx)
// — a failed first load now shows a real retry affordance instead of only a toast.
export const ErrorLoading: Story = {
  parameters: { msw: { handlers: mswHandlers.galleriesError } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/couldn't load the gallery/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /try again/i })).toBeVisible();
  },
};
