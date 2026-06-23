// Default content for the legal/policy pages. These ship with the app so the
// public pages always render professional, industry-standard copy even before
// an admin has customised them in the panel. The DB (LegalPage) overrides these.
//
// `content` is HTML rendered by the hand-rolled prose styles in BlogPostBody.

export interface LegalPageDef {
  slug: string;
  /** Page <h1> + admin/document title. */
  title: string;
  /** Short label used for footer/nav links. */
  navLabel: string;
  /** Meta description for SEO. */
  description: string;
  /** Shipped default banner image (desktop). DB heroImage overrides this. */
  heroImage: string;
  /** Shipped default banner image (≤640px). */
  heroImageMobile: string;
  /** HTML body. */
  content: string;
}

const COMPANY = "Vertex Kashmir Holidays";
const LEGAL_ENTITY = "Vertex Kashmir Tour & Travel";

export const LEGAL_PAGES: LegalPageDef[] = [
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    navLabel: "Terms & Conditions",
    description: `Read the terms and conditions governing bookings, payments, travel and use of ${COMPANY}' services and website.`,
    heroImage: "/hero/pahalgam-lg.webp",
    heroImageMobile: "/hero/pahalgam.webp",
    content: `
<p>These Terms &amp; Conditions ("Terms") govern your use of the ${COMPANY} website and the booking of any tour, package, or travel-related service offered by ${LEGAL_ENTITY} ("${COMPANY}", "we", "us", or "our"). By accessing our website or making a booking with us, you ("the client", "you") confirm that you have read, understood, and agree to be bound by these Terms.</p>

<h2>1. Bookings &amp; Confirmation</h2>
<p>A booking is treated as confirmed only after we receive the agreed advance payment and issue a written confirmation (by email or WhatsApp). All bookings are subject to availability at the time of confirmation. Quotations shared before confirmation are indicative and may change due to availability, season, or supplier rates.</p>
<ul>
  <li>You must provide accurate traveller details, including names as per a valid government photo ID.</li>
  <li>The lead traveller must be at least 18 years of age and is responsible for the entire booking.</li>
  <li>It is your responsibility to review the final itinerary, inclusions, and exclusions before making payment.</li>
</ul>

<h2>2. Pricing &amp; Payments</h2>
<p>All prices are quoted in Indian Rupees (INR) unless stated otherwise and are per the inclusions specified in your itinerary. Prices may be revised in case of changes in government taxes, fuel costs, fares, or supplier rates before the booking is confirmed.</p>
<ul>
  <li>An advance payment (typically a percentage of the total package cost) is required to confirm a booking.</li>
  <li>The balance must be cleared as per the schedule stated in your confirmation, usually before the start of the trip.</li>
  <li>Payments can be made through the secure payment options provided by us. We do not store your card or banking details.</li>
</ul>

<h2>3. Inclusions &amp; Exclusions</h2>
<p>The services included in your package are limited to those expressly listed as "Inclusions" in your itinerary. Anything not listed — including airfare (unless specified), personal expenses, tips, entry fees, adventure activities, and costs arising from circumstances beyond our control — is excluded and payable by you.</p>

<h2>4. Cancellations &amp; Refunds</h2>
<p>All cancellations and refunds are governed by our <a href="/refund-and-cancellation">Refund &amp; Cancellation Policy</a>, which forms part of these Terms. Please read it carefully before booking.</p>

<h2>5. Changes to Itineraries</h2>
<p>Kashmir travel can be affected by weather, road conditions, political situations, and other factors beyond our control. We reserve the right to amend or reorder the itinerary, change accommodation to a similar category, or adjust sightseeing for your safety and the smooth operation of the tour. We will always try to provide the closest possible alternative at no loss of service value.</p>

<h2>6. Accommodation &amp; Transport</h2>
<p>Hotels and houseboats are confirmed in the category booked or a similar alternative. Standard check-in and check-out times apply. Vehicles are provided as per the itinerary and are not at your personal disposal unless explicitly stated; air-conditioning is generally not used in hill areas.</p>

<h2>7. Responsibilities &amp; Conduct</h2>
<ul>
  <li>You are responsible for carrying valid identification and any required permits for restricted areas.</li>
  <li>You must follow the reasonable instructions of our representatives, drivers, and guides regarding safety.</li>
  <li>We reserve the right to decline or terminate service to any client whose conduct endangers others or disrupts the tour, without refund.</li>
</ul>

<h2>8. Liability</h2>
<p>${COMPANY} acts only as a coordinator between you and independent service providers (hotels, transporters, activity operators). While we choose partners carefully, we are not liable for any injury, loss, delay, or damage caused by third parties or by events beyond our reasonable control, including but not limited to weather, natural disasters, strikes, roadblocks, or government action ("force majeure"). We strongly recommend that all travellers obtain comprehensive travel insurance.</p>

<h2>9. Health &amp; Safety</h2>
<p>You confirm that all travellers are medically fit to undertake the planned activities. Please inform us in advance of any medical condition, allergy, or special requirement. Certain destinations are at high altitude; participation in adventure activities is at your own risk.</p>

<h2>10. Intellectual Property</h2>
<p>All content on this website — including text, images, logos, and itineraries — is the property of ${COMPANY} and may not be copied, reproduced, or used without our prior written consent.</p>

<h2>11. Governing Law &amp; Jurisdiction</h2>
<p>These Terms are governed by the laws of India. Any dispute shall be subject to the exclusive jurisdiction of the courts of Srinagar, Jammu &amp; Kashmir.</p>

<h2>12. Changes to These Terms</h2>
<p>We may update these Terms from time to time. The version published on this page at the time of your booking applies to that booking. Please review this page periodically.</p>

<h2>13. Contact Us</h2>
<p>For any questions about these Terms, please reach us through the contact details listed on our <a href="/contact">Contact</a> page.</p>
`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    navLabel: "Privacy Policy",
    description: `Learn how ${COMPANY} collects, uses, and protects your personal information when you use our website and book our travel services.`,
    heroImage: "/hero/shikara-lg.webp",
    heroImageMobile: "/hero/shikara.webp",
    content: `
<p>${LEGAL_ENTITY} ("${COMPANY}", "we", "us", or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains what information we collect, how we use it, and the choices you have. By using our website or services, you consent to the practices described here.</p>

<h2>1. Information We Collect</h2>
<p>We collect information that you provide directly and information gathered automatically when you use our website:</p>
<ul>
  <li><strong>Contact &amp; booking details:</strong> name, email address, phone number, travel dates, traveller count, and preferences.</li>
  <li><strong>Identification details:</strong> where required for hotel check-in, permits, or transport bookings.</li>
  <li><strong>Payment information:</strong> processed through secure third-party payment gateways. We do not store your full card or bank details.</li>
  <li><strong>Technical data:</strong> IP address, browser type, device information, and usage data collected via cookies and similar technologies.</li>
</ul>

<h2>2. How We Use Your Information</h2>
<ul>
  <li>To respond to enquiries and prepare customised itineraries and quotations.</li>
  <li>To process bookings, payments, and confirmations with our service partners.</li>
  <li>To communicate with you about your trip, including updates and important notices.</li>
  <li>To improve our website, services, and customer experience.</li>
  <li>To send offers and travel updates where you have opted in (you can unsubscribe at any time).</li>
  <li>To comply with legal and regulatory obligations.</li>
</ul>

<h2>3. Sharing of Information</h2>
<p>We share your information only as necessary to deliver your trip — for example, with hotels, houseboats, transport providers, and activity operators — and with payment processors and service providers who help us run our business. We require these partners to handle your data securely. We do <strong>not</strong> sell your personal information to third parties.</p>

<h2>4. Cookies</h2>
<p>Our website uses cookies to keep the site working, remember preferences, and understand how visitors use our pages. You can control or disable cookies through your browser settings, though some features may not function properly without them.</p>

<h2>5. Data Security</h2>
<p>We apply reasonable technical and organisational measures to protect your personal data against unauthorised access, loss, or misuse. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.</p>

<h2>6. Data Retention</h2>
<p>We retain your personal data only for as long as necessary to fulfil the purposes described in this policy, including to meet legal, accounting, or reporting requirements.</p>

<h2>7. Your Rights</h2>
<p>Subject to applicable law, you may request access to, correction of, or deletion of your personal data, and you may withdraw consent to marketing communications at any time. To exercise these rights, please contact us using the details on our <a href="/contact">Contact</a> page.</p>

<h2>8. Children's Privacy</h2>
<p>Our services are intended for adults. We do not knowingly collect personal information directly from children without the consent of a parent or guardian.</p>

<h2>9. Third-Party Links</h2>
<p>Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites and encourage you to read their privacy policies.</p>

<h2>10. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. The latest version will always be available on this page, with the "last updated" date shown above.</p>

<h2>11. Contact Us</h2>
<p>If you have any questions about this Privacy Policy or how we handle your data, please reach out via our <a href="/contact">Contact</a> page.</p>
`,
  },
  {
    slug: "refund-and-cancellation",
    title: "Refund & Cancellation Policy",
    navLabel: "Refund & Cancellation",
    description: `Understand the cancellation timelines, refund eligibility, and processing details for bookings made with ${COMPANY}.`,
    heroImage: "/hero/sonamarg-lg.webp",
    heroImageMobile: "/hero/sonamarg.webp",
    content: `
<p>This Refund &amp; Cancellation Policy explains what happens if a booking with ${LEGAL_ENTITY} ("${COMPANY}", "we", "us", or "our") is cancelled or modified. It forms part of our <a href="/terms-and-conditions">Terms &amp; Conditions</a>. Because Kashmir tours involve advance commitments to hotels, houseboats, and transport, cancellation charges apply on the scale below.</p>

<h2>1. How to Cancel</h2>
<p>All cancellation requests must be made in writing (by email or WhatsApp) by the lead traveller. The effective cancellation date is the date on which we receive your written request during working hours. Cancellation charges are calculated as a percentage of the total package cost.</p>

<h2>2. Cancellation Charges</h2>
<p>Unless your itinerary states otherwise, the following standard scale applies:</p>
<ul>
  <li><strong>30 days or more</strong> before the trip start date: deduction of the non-refundable advance / booking amount.</li>
  <li><strong>15–29 days</strong> before the trip start date: 50% of the total package cost.</li>
  <li><strong>7–14 days</strong> before the trip start date: 75% of the total package cost.</li>
  <li><strong>Less than 7 days</strong> before the trip start date, or <strong>no-show</strong>: 100% of the total package cost (no refund).</li>
</ul>
<p>Certain bookings — such as peak-season dates, special events (e.g., Tulip season, New Year), non-refundable hotel rates, and confirmed flight tickets — may carry stricter, supplier-defined cancellation terms that will be communicated to you before booking.</p>

<h2>3. Non-Refundable Components</h2>
<p>Some costs cannot be recovered once committed and are non-refundable regardless of the cancellation date, including but not limited to airfare, permit fees, special-event tickets, and advance payments to suppliers under non-refundable terms.</p>

<h2>4. Refund Processing</h2>
<ul>
  <li>Eligible refunds are processed to the original payment method within <strong>7–14 business days</strong> of confirming the cancellation, unless a different timeline is required by the payment provider.</li>
  <li>Applicable bank, gateway, or transaction charges may be deducted from the refund amount.</li>
  <li>Refunds are calculated on the package cost actually paid, net of any non-refundable components.</li>
</ul>

<h2>5. Modifications &amp; Date Changes</h2>
<p>Requests to change travel dates or itinerary details are subject to availability and any difference in price (including seasonal rate changes). Date changes are not guaranteed and may be treated as a cancellation and rebooking if suppliers cannot accommodate them.</p>

<h2>6. Cancellation by Us</h2>
<p>In the rare event that we must cancel a confirmed trip due to reasons within our control, you will be offered an alternative of equivalent value or a full refund of the amount paid to us. We are not liable for incidental costs such as airfare or visa fees booked independently.</p>

<h2>7. Force Majeure</h2>
<p>If a trip is disrupted or cancelled due to circumstances beyond our reasonable control — including weather, natural disasters, strikes, roadblocks, pandemics, or government action — refunds are subject to what we can recover from suppliers. In such cases we will make reasonable efforts to reschedule your trip or provide a credit where a cash refund is not possible. We strongly recommend comprehensive travel insurance.</p>

<h2>8. Unused Services</h2>
<p>No refund is payable for any unused services, missed sightseeing, early departure, or voluntary changes made during the trip.</p>

<h2>9. Contact Us</h2>
<p>To request a cancellation or for any questions about refunds, please contact us through the details on our <a href="/contact">Contact</a> page. Our team will guide you through the process.</p>
`,
  },
];

export const LEGAL_SLUGS = LEGAL_PAGES.map((p) => p.slug);

export function getLegalDefault(slug: string): LegalPageDef | null {
  return LEGAL_PAGES.find((p) => p.slug === slug) ?? null;
}
