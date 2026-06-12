'use client';

export function UpdatesStrip() {
  const stripItems = [
    '❄️ Gulmarg 18°C Today',
    '🛶 Shikara Sunrise Rides',
    '🏔️ Great Lakes Trek Open',
    '🌷 Tulip Season Bookings Live',
    '✅ J&K Licensed Agency',
    '🔒 Razorpay Secured',
    '📞 24/7 Local Support',
    '🚫 Zero Middlemen',
  ];

  return (
    <section className="relative z-[2] border-y border-white/10 bg-white/[.03] py-4 backdrop-blur">
      <div className="marquee">
        <div className="marquee-track text-[13px] font-semibold tracking-wide text-white/70">
          {[...stripItems, ...stripItems].map((item, i) => (
            <span key={i} className="flex items-center gap-2 whitespace-nowrap">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}