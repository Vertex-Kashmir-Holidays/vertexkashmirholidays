import { AboutSection } from "@/components/about/AboutSection";
import { BlogSection } from "@/components/blog/BlogSection";
import { DestinationsSection } from "@/components/destinations/DestinationsSection";
import { HeroSection } from "@/components/home/HeroSection";
import { OffersSection } from "@/components/home/OffersSection";
import { PackagesSection } from "@/components/home/PackagesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { UpdatesStrip } from "@/components/home/UpdatesStrip";
import { VideoReviewsSection } from "@/components/home/VideoReviewsSection";
import { WhyChooseSection } from "@/components/home/WhyChooseSection";

export default function HomePage() {
  return (
    <div className="bg-dark-bg text-white">
      <HeroSection />
      <UpdatesStrip />
      <VideoReviewsSection />
      <PackagesSection />
      <WhyChooseSection />
      <DestinationsSection />
      <AboutSection />
      <OffersSection />
      <TestimonialsSection />
      <BlogSection />
    </div>
  );
}