import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { imgSrc } from "@/lib/placeholder";

const STATS = [
  { value: "25+", label: "Years" },
  { value: "12,000+", label: "Happy Guests" },
  { value: "4.9/5", label: "Rating" },
  { value: "24/7", label: "Support" },
];

interface AuthLeftPanelProps {
  headline: string;
  subheadline: string;
}

export function AuthLeftPanel({ headline, subheadline }: AuthLeftPanelProps) {
  return (
    <div className="relative hidden lg:flex flex-col h-full min-h-screen">
      {/* Background image */}
      <Image
        src={imgSrc()}
        alt="Kashmir landscape"
        fill
        priority
        sizes="45vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-navy/80 via-brand-navy/60 to-black/50" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between p-8">
        <Logo variant="light" />
        <Link
          href="/"
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>

      {/* Headline */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-10">
        <p className="text-brand-green text-xs font-bold uppercase tracking-widest mb-4">
          ● Vertex Kashmir Holidays
        </p>
        <h1 className="font-display font-extrabold text-white text-4xl xl:text-5xl leading-[1.08] max-w-sm mb-4">
          {headline}
        </h1>
        <p className="text-white/60 text-sm leading-relaxed max-w-xs">{subheadline}</p>
      </div>

      {/* Stats strip */}
      <div className="relative z-10 px-10 pb-6">
        <div className="grid grid-cols-4 gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-4 mb-5">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-display font-extrabold text-white text-lg leading-tight">
                {value}
              </p>
              <p className="text-white/55 text-[12px] font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="glass rounded-2xl p-4 border border-white/20">
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-white/80 text-xs leading-relaxed mb-3 italic">
            &ldquo;Vertex Kashmir Holidays made our honeymoon absolutely magical. Every detail was
            perfect — from the houseboat on Dal Lake to the Gulmarg gondola sunrise.&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center text-white text-[12px] font-bold shrink-0">
              PS
            </div>
            <div>
              <p className="text-white text-xs font-semibold leading-none">Priya &amp; Suresh</p>
              <p className="text-white/45 text-[12px]">Mumbai · Honeymoon Package</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
