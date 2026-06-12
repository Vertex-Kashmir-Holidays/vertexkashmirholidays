import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Package, MapPin, FileText } from "lucide-react";

export const metadata: Metadata = { title: "SEO & Pages — Admin" };

const SEO_SECTIONS = [
  {
    title: "Tour Packages",
    description: "Edit meta title, description, and OG image for each tour package.",
    href: "/admin/packages",
    Icon: Package,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Destinations",
    description: "Manage SEO fields for destination pages.",
    href: "/admin/destinations",
    Icon: MapPin,
    color: "bg-green-50 text-green-600",
  },
  {
    title: "Blog Posts",
    description: "Edit meta and OG data for blog articles.",
    href: "/admin/blogs",
    Icon: FileText,
    color: "bg-purple-50 text-purple-600",
  },
  {
    title: "Site Settings",
    description: "Set default site-wide meta title, description, and OG image.",
    href: "/admin/settings",
    Icon: Globe,
    color: "bg-orange-50 text-orange-600",
  },
];

export default function AdminSeoPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-extrabold text-brand-navy text-xl">SEO & Pages</h2>
        <p className="text-gray-400 text-xs mt-0.5">
          Meta titles, descriptions, and OG images are managed per entity in their respective sections.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {SEO_SECTIONS.map(({ title, description, href, Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-brand-green/30 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-brand-navy text-sm group-hover:text-brand-green transition-colors">{title}</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-brand-navy/5 rounded-2xl p-5 border border-brand-navy/10">
        <h3 className="font-bold text-brand-navy text-sm mb-2">How SEO works in this app</h3>
        <ul className="space-y-1.5 text-xs text-gray-600">
          <li className="flex items-start gap-2"><span className="text-brand-green mt-0.5">✓</span> Each tour, destination, and blog post has its own <code className="bg-white px-1 py-0.5 rounded text-brand-navy">metaTitle</code>, <code className="bg-white px-1 py-0.5 rounded text-brand-navy">metaDesc</code>, and <code className="bg-white px-1 py-0.5 rounded text-brand-navy">ogImage</code> field.</li>
          <li className="flex items-start gap-2"><span className="text-brand-green mt-0.5">✓</span> If those are empty, the page falls back to generated metadata from the entity&apos;s title and excerpt.</li>
          <li className="flex items-start gap-2"><span className="text-brand-green mt-0.5">✓</span> Structured data (JSON-LD) is auto-generated for tours, destinations, and blog posts.</li>
          <li className="flex items-start gap-2"><span className="text-brand-green mt-0.5">✓</span> Sitemap is auto-generated at <code className="bg-white px-1 py-0.5 rounded text-brand-navy">/sitemap.xml</code> from published content.</li>
        </ul>
      </div>
    </div>
  );
}
