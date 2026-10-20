// "Open the inquiry form" signal for a tour detail page. Elements far from the
// booking sidebar (e.g. the closing block) dispatch it; the sidebar (lg+) and the
// mobile bar (below lg) each listen and open their own inquiry form.
export const OPEN_TOUR_INQUIRY_EVENT = "vk:open-tour-inquiry";

export const openTourInquiry = () => window.dispatchEvent(new Event(OPEN_TOUR_INQUIRY_EVENT));

/** True from the lg breakpoint up, where the sidebar (not the mobile bar) shows the forms. */
export const isDesktopLayout = () => window.matchMedia("(min-width: 1024px)").matches;
