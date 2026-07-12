// src/components/sections/TourDetailsHero.tsx
'use client';


import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Star } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';


interface TourDetailsHeroProps {
 tourName: string;
 duration: string;
 nights: number;
 days: number;
 category: string;
 transport: string;
 startCity: string;
 difficulty: string;
 tagline: string;
 badge: string;
 badgeColor?: 'orange' | 'blue' | 'green';
 rating: number;
 reviews: number;
 happyLabel: string;
 images: string[];
 /** Mobile-cropped variant of images[0] (the cover image). Falls back to images[0] when absent. */
 coverImageMobile?: string;
}

const badgeCls = {
 orange: 'bg-badge-orange',
 blue: 'bg-badge-blue',
 green: 'bg-badge-green',
};


export function TourDetailsHero({
 tourName,
 duration,
 nights,
 days,
 category,
 transport,
 startCity,
 difficulty,
 tagline,
 badge,
 badgeColor = 'green',
 rating,
 reviews,
 happyLabel,
 images = [],
 coverImageMobile,
}: TourDetailsHeroProps) {
 const [currentImage, setCurrentImage] = useState(0);
 const [mounted, setMounted] = useState(false);
 const [isHovering, setIsHovering] = useState(false);
 const [copied, setCopied] = useState(false);
 const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

 async function handleShare() {
   const url = window.location.href;
   if (navigator.share) {
     await navigator.share({ title: tourName, url }).catch(() => {});
     return;
   }
   // Clipboard API (HTTPS only; not available in all WebViews)
   if (navigator.clipboard?.writeText) {
     await navigator.clipboard.writeText(url).catch(() => {});
   } else {
     // execCommand fallback for older Android WebViews
     const ta = document.createElement('textarea');
     ta.value = url;
     ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
     document.body.appendChild(ta);
     ta.focus();
     ta.select();
     document.execCommand('copy');
     document.body.removeChild(ta);
   }
   setCopied(true);
   setTimeout(() => setCopied(false), 2000);
 }


 useEffect(() => { setMounted(true); }, []);


 // Auto-play carousel
 useEffect(() => {
   if (!isHovering && images.length > 1) {
     timerRef.current = setInterval(() => {
       setCurrentImage((prev) => (prev + 1) % images.length);
     }, 4000);
   }
   return () => clearInterval(timerRef.current);
 }, [isHovering, images.length]);


 const nextImage = () => {
   setCurrentImage((prev) => (prev + 1) % images.length);
 };


 const prevImage = () => {
   setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
 };


 const quickFacts = [
   { t: `${nights} Nights`, s: `${days} Days`, icon: 'M3 4h18v18H3z' },
   { t: category, s: 'Category', icon: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z' },
   { t: transport, s: 'Transportation', icon: 'M5 17h14l1-5-2-5H6L4 12Z' },
   { t: startCity, s: 'Start City', icon: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' },
   { t: difficulty, s: 'Difficulty', icon: 'm13 2-2 9h4l-4 11 1-8H8l5-12Z' },
 ];


 return (
   <section className="relative overflow-hidden bg-brand-dark">
     {/* Carousel Images */}
     <div className="absolute inset-0">
       <AnimatePresence mode="wait">
         <motion.div
           key={currentImage}
           className="absolute inset-0"
           initial={{ opacity: mounted ? 0 : 1, scale: 1.05 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.7 }}
         >
           {currentImage === 0 && coverImageMobile ? (
             <>
               <Image
                 src={imgSrc(coverImageMobile)}
                 alt={tourName}
                 fill
                 priority
                 sizes="100vw"
                 className="object-cover sm:hidden"
               />
               <Image
                 src={imgSrc(images[currentImage])}
                 alt={tourName}
                 fill
                 sizes="100vw"
                 className="hidden object-cover sm:block"
               />
             </>
           ) : (
             <Image
               src={imgSrc(images[currentImage])}
               alt={tourName}
               fill
               priority
               sizes="100vw"
               className="object-cover"
             />
           )}
         </motion.div>
       </AnimatePresence>
     </div>
     <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/75 via-brand-dark/30 to-brand-dark/20"></div>
     <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-dark/80 to-transparent"></div>


     {/* Carousel Controls — hidden on mobile; dots handle navigation there */}
     {images.length > 1 && (
       <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 hidden sm:flex justify-between px-4">
         <motion.button
           onClick={prevImage}
           className="grid h-11 w-11 place-items-center rounded-full bg-white/85 text-brand-ink shadow-card transition hover:bg-white"
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           onMouseEnter={() => setIsHovering(true)}
           onMouseLeave={() => setIsHovering(false)}
         >
           ‹
         </motion.button>
         <motion.button
           onClick={nextImage}
           className="grid h-11 w-11 place-items-center rounded-full bg-white/85 text-brand-ink shadow-card transition hover:bg-white"
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           onMouseEnter={() => setIsHovering(true)}
           onMouseLeave={() => setIsHovering(false)}
         >
           ›
         </motion.button>
       </div>
     )}


     {/* Image Indicators */}
     {images.length > 1 && (
       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1">
         {images.map((_, i) => (
           <button
             key={i}
             onClick={() => setCurrentImage(i)}
             className="grid h-6 min-w-6 place-items-center"
             aria-label={`Go to image ${i + 1}`}
           >
             <span className={`block h-1.5 rounded-full transition-all duration-300 ${
               i === currentImage ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
             }`} />
           </button>
         ))}
       </div>
     )}


     <div className="relative mx-auto max-w-[1300px] px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-28">
       {/* Breadcrumb + Actions */}
       <div className="flex items-center justify-between gap-3">
         <nav className="flex min-w-0 items-center gap-2 text-[14px] text-white/80" aria-label="Breadcrumb">
           <a href="/" className="shrink-0 transition hover:text-white">Home</a>
           <span className="shrink-0">›</span>
           <a href="/tours" className="shrink-0 transition hover:text-white">Tours</a>
           <span className="shrink-0">›</span>
           <span className="truncate text-white">{tourName}</span>
         </nav>
         <div className="flex shrink-0 items-center gap-2.5">
           <motion.button
             aria-label="Save to wishlist"
             className="grid h-10 w-10 place-items-center rounded-full border border-white/40 text-white backdrop-blur transition hover:bg-white hover:text-rose-500"
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
           >
             <Heart className="h-[18px] w-[18px]" strokeWidth={2} />
           </motion.button>
           <motion.button
             onClick={handleShare}
             className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-brand-ink shadow-card transition hover:brightness-95"
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
           >
             {copied ? 'Copied!' : 'Share'}
             <Share2 className="h-4 w-4" strokeWidth={2} />
           </motion.button>
         </div>
       </div>


       {/* Title Block */}
       <div className="mt-8 max-w-2xl sm:mt-12">
         <motion.span
           className={`rounded-md ${badgeCls[badgeColor]} px-3 py-1.5 text-[12px] font-extrabold tracking-wide text-white shadow`}
           initial={{ x: -20, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ duration: 0.5 }}
         >
           {badge}
         </motion.span>
         <h1
           className="hero-reveal h-display mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[44px]"
           style={{ '--hr-y': '20px', '--hr-delay': '0.1s' } as React.CSSProperties}
         >
           {tourName}
           <br />
           {duration}
         </h1>
         {tagline && (
           <p
             className="hero-reveal mt-4 text-[16px] font-medium text-white/90"
             style={{ '--hr-delay': '0.2s' } as React.CSSProperties}
           >
             {tagline}
           </p>
         )}
         <motion.p
           className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] font-semibold text-white"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.6, delay: 0.3 }}
         >
           <span className="flex items-center gap-1.5">
             <Star className="h-4 w-4 text-amber-400" fill="currentColor" strokeWidth={0} />
             {rating} ({reviews.toLocaleString('en-IN')} reviews)
           </span>
           {happyLabel && (
             <>
               <span className="text-white/40">|</span>
               <span>{happyLabel}</span>
             </>
           )}
         </motion.p>
       </div>


       {/* Quick Facts */}
       <motion.div
         className="mt-8 flex flex-wrap gap-x-9 gap-y-4"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.6, delay: 0.4 }}
       >
         {quickFacts.map((fact, i) => (
           <div key={i} className="flex items-center gap-2.5 text-white">
             <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/85" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
               <path d={fact.icon} />
             </svg>
             <div>
               <p className="text-[14px] font-bold leading-tight">{fact.t}</p>
               <p className="text-[12px] text-white/65">{fact.s}</p>
             </div>
           </div>
         ))}
       </motion.div>


       {/* Thumbnails */}
       <div className="scrollbar-none mt-7 flex gap-3 overflow-x-auto pb-1">
         {images.slice(0, 8).map((img, i) => (
           <motion.button
             key={i}
             className={`relative h-[68px] w-[104px] shrink-0 overflow-hidden rounded-xl border-[2.5px] transition hover:border-white ${
               i === currentImage ? 'border-white' : 'border-white/30'
             }`}
             onClick={() => setCurrentImage(i)}
             whileHover={{ scale: 1.05 }}
             aria-label={`View image ${i + 1}`}
           >
             <Image src={imgSrc(img)} alt="" fill sizes="104px" className="object-cover" />
             {i === currentImage && (
               <span className="absolute inset-0 grid place-items-center bg-black/30">
                 <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[12px] text-brand-ink">▶</span>
               </span>
             )}
           </motion.button>
         ))}
       </div>
     </div>
   </section>
 );
}
