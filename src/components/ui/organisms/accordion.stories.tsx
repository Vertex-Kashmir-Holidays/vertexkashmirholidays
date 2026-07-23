import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

// Not currently used anywhere in the app — the two existing accordion-shaped
// UIs deliberately avoid it (TourDetailsAccordionItem uses native
// <details>/<summary> for no-JS SEO crawlability; FaqAccordionPage is a
// bespoke client component with integrated search). Kept under "Extras" so
// it stays visible/reviewable without implying it's wired into a real page.
const meta = {
  title: "Extras/Accordion",
  component: Accordion,
  tags: ["autodocs"],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleCollapsible: Story = {
  args: { type: "single" },
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>What's included in the price?</AccordionTrigger>
        <AccordionContent>
          Accommodation, transfers, and daily breakfast are included for every package.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Can I customize the itinerary?</AccordionTrigger>
        <AccordionContent>
          Yes — every package can be tailored to your dates, group size, and preferences.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>What's the cancellation policy?</AccordionTrigger>
        <AccordionContent>Free cancellation up to 30 days before travel.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const MultipleOpen: Story = {
  args: { type: "multiple" },
  render: () => (
    <Accordion type="multiple" className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>Section one</AccordionTrigger>
        <AccordionContent>Multiple sections can stay open at once in this mode.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section two</AccordionTrigger>
        <AccordionContent>Open this one without closing the first.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
