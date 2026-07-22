import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "UI/Organisms/Tabs",
  component: Tabs,
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// The general-purpose content-switcher usage. Vertex's own tour/destination/
// activity detail pages use Tabs differently — as a controlled scroll-spy nav
// with no TabsContent panels at all (Root's value/onValueChange drives page
// scroll instead of showing/hiding content). See TourDetailsTabs.tsx.
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-lg">
      <TabsList className="border-b border-border">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
        <TabsTrigger value="inclusions">Inclusions</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-4 text-sm text-muted-foreground">
        A 7-night journey through Ladakh's high passes and lakes.
      </TabsContent>
      <TabsContent value="itinerary" className="pt-4 text-sm text-muted-foreground">
        Day 1: Arrival. Day 2: Hanle. Day 3: Tso Moriri.
      </TabsContent>
      <TabsContent value="inclusions" className="pt-4 text-sm text-muted-foreground">
        Private transfers, hand-picked stays, and local experts throughout.
      </TabsContent>
    </Tabs>
  ),
};
