// Static marketing copy for the /tours/category hub — server component, no
// interactivity, so it stays out of the client bundle.
export function TourCategoryHubIntro() {
  return (
    <section>
      <h2 className="h-display text-[22px] font-bold text-foreground sm:text-[26px]">
        Finding the Right Kashmir Trip for You
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/80">
        <p>
          Kashmir rarely disappoints, but the trip that makes it memorable looks different for every
          traveller. A couple on their honeymoon wants slow mornings on a houseboat and a private
          shikara ride at sunset — not a bus full of strangers on a fixed schedule. A family with
          young children and grandparents in tow needs shorter drive days, family-friendly hotels
          and an itinerary with breathing room built in. A group of friends or colleagues wants a
          plan that&apos;s easy to split the cost on, without losing the sights everyone came for.
          And travellers chasing the mountains want a guide who actually knows which trek is doable
          this week, not just what&apos;s on a brochure.
        </p>
        <p>
          That&apos;s why we&apos;ve organised our packages by travel style instead of a single
          one-size-fits-all itinerary. Honeymoon packages lean into privacy and romance —
          houseboats, candlelight dinners and quieter corners of Srinagar, Gulmarg and Pahalgam.
          Family packages prioritise comfort and pacing, with hotels that work for kids and seniors
          alike. Group tours keep costs predictable with fixed departures and shared vehicles.
          Adventure packages are built around trekking, skiing and outdoor activity, with gear and
          routes matched to the season. Luxury and premium packages upgrade the stays, transport and
          experiences for travellers who want the very best Kashmir has to offer, and budget
          packages cover the essentials without cutting the places worth seeing.
        </p>
        <p>
          Season matters as much as style. April to June brings mild weather and blooming gardens —
          ideal for honeymooners and families. July to September is best for high-altitude treks and
          adventure travel once the mountain passes clear. December to February turns Gulmarg into a
          snow and skiing destination, and is popular with couples chasing a white honeymoon. If
          you&apos;re unsure which window suits your plans, our team can walk you through it before
          you book.
        </p>
        <p>
          Booking with a local Kashmir operator, rather than a reseller working off the same
          brochure as everyone else, means the person planning your trip has actually stayed at the
          hotels, driven the roads and dealt with last-minute changes when weather or road closures
          get in the way. It also means your money reaches the local economy directly, and any issue
          on the ground gets solved by someone a phone call away — not a support ticket routed
          through another city. Browse the categories below, or get in touch and we&apos;ll help you
          pick the right one.
        </p>
      </div>
    </section>
  );
}
