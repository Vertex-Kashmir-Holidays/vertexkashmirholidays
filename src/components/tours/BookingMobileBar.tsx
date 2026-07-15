"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Calendar, ArrowRight, MessageSquare } from "lucide-react";
import { LeadForm } from "@/components/leads/LeadForm";
import { trackTourInquiry, trackBookingStarted } from "@/lib/analytics";


interface BookingMobileBarProps {
 formMode?: "BOOKING_ONLY" | "INQUIRY_ONLY" | "BOTH";
 tourId: string;
 tourName: string;
 tourSlug: string;
 /** Per-person price, used to show pricing inside the Book Now modal. */
 price: number;
 oldPrice?: number;
 discountPct?: number;
}


// Online advance is 10% of the booking total (kept in sync with the server +
// the /booking checkout via @/lib/bookings/finance and TourDetailsSidebar).
const ADVANCE_PCT = 10;


// Mobile-only sticky CTA bar for the tour detail page. The inline sidebar form
// sits far down the page on phones, so here we surface Book / Inquiry CTAs at the
// bottom (per the tour's formMode) and open the relevant form in a bottom-sheet
// modal. Hidden on lg+ where the sidebar is visible. Sits above the global mobile
// nav bar, which is hidden on tour detail pages so this bar sits at bottom-0.
export function BookingMobileBar({ formMode = "BOTH", tourId, tourName, tourSlug, price, oldPrice, discountPct }: BookingMobileBarProps) {
 const router = useRouter();
 const showInquiry = formMode !== "BOOKING_ONLY";
 const showBook = formMode !== "INQUIRY_ONLY";


 const [open, setOpen] = useState<null | "inquiry" | "book">(null);
 const [bookDate, setBookDate] = useState("");
 const [bookPax, setBookPax] = useState("2");
 const minBookDate = (() => {
   const d = new Date();
   d.setDate(d.getDate() + 7);
   return d.toISOString().split("T")[0];
 })();
 const pax = parseInt(bookPax, 10) || 2;
 const totalAmount = price * pax;
 const advanceAmount = Math.round(totalAmount * (ADVANCE_PCT / 100));


 function goToBooking() {
   const params = new URLSearchParams({ tour: tourSlug });
   if (bookDate) params.set("date", bookDate);
   if (bookPax) params.set("travellers", bookPax);
   router.push(`/booking?${params.toString()}`);
 }


 return (
   <>
     {/* Sticky bar */}
     <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-card/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
       {showInquiry && (
         <button
           type="button"
           onClick={() => { setOpen("inquiry"); trackTourInquiry(tourName, tourId); }}
           className="flex flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] border-primary py-3 text-[16px] font-bold text-primary"
         >
           <MessageSquare className="h-4 w-4" /> Inquiry
         </button>
       )}
       {showBook && (
         <button
           type="button"
           onClick={() => { setOpen("book"); trackBookingStarted(tourName); }}
           className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[16px] font-bold text-primary-foreground shadow-card"
         >
           <Lock className="h-4 w-4" /> Book Now
         </button>
       )}
     </div>


     {/* Bottom-sheet modal */}
     <AnimatePresence>
       {open && (
         <>
           <motion.div
             className="fixed inset-0 z-50 bg-black/50 lg:hidden"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setOpen(null)}
           />
           <motion.div
             className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] lg:hidden"
             initial={{ y: "100%" }}
             animate={{ y: 0 }}
             exit={{ y: "100%" }}
             transition={{ type: "spring", stiffness: 320, damping: 32 }}
           >
             <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
             <div className="mb-4 flex items-center justify-between">
               <h3 className="text-[18px] font-bold text-foreground">
                 {open === "inquiry" ? "Send an Inquiry" : "Book This Tour"}
               </h3>
               <button
                 type="button"
                 onClick={() => setOpen(null)}
                 aria-label="Close"
                 className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
               >
                 <X className="h-5 w-5" strokeWidth={2} />
               </button>
             </div>


             {open === "inquiry" ? (
               <LeadForm source="tour-detail" context={{ tourId, tourName }} buttonLabel="Send Inquiry" />
             ) : (
               <div className="space-y-3.5">
                 {/* Price summary */}
                 <div className="flex items-end justify-between rounded-xl border border-border bg-muted px-4 py-3">
                   <div>
                     {discountPct ? (
                       <span className="mb-1 inline-block rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white">
                         {discountPct}% OFF
                       </span>
                     ) : null}
                     <p className="flex items-baseline gap-1.5">
                       <span className="text-[24px] font-extrabold leading-none">₹{price.toLocaleString("en-IN")}</span>
                       <span className="text-[12px] font-medium text-muted-foreground">/ person</span>
                     </p>
                     {oldPrice ? (
                       <p className="mt-0.5 text-[14px] font-semibold text-muted-foreground line-through">
                         ₹{oldPrice.toLocaleString("en-IN")}
                       </p>
                     ) : null}
                   </div>
                   <div className="text-right">
                     <p className="text-[12px] text-muted-foreground">Total ({pax} {pax === 1 ? "traveller" : "travellers"})</p>
                     <p className="text-[16px] font-extrabold leading-tight">₹{totalAmount.toLocaleString("en-IN")}</p>
                   </div>
                 </div>


                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label htmlFor="mbDate" className="text-[14px] font-semibold">Start Date</label>
                     <div className="mt-1.5 flex items-center overflow-hidden rounded-lg border border-border transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                       <input
                         id="mbDate"
                         type="date"
                         min={minBookDate}
                         value={bookDate}
                         onChange={(e) => setBookDate(e.target.value)}
                         className="w-full px-3 py-2.5 text-[14px] outline-none [color-scheme:light] dark:[color-scheme:dark]"
                       />
                       <Calendar className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                     </div>
                   </div>
                   <div>
                     <label htmlFor="mbPax" className="text-[14px] font-semibold">Travellers</label>
                     <select
                       id="mbPax"
                       value={bookPax}
                       onChange={(e) => setBookPax(e.target.value)}
                       className="mt-1.5 w-full appearance-none rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                     >
                       {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                         <option key={n} value={n}>{n}</option>
                       ))}
                     </select>
                   </div>
                 </div>
                 <button
                   type="button"
                   onClick={goToBooking}
                   className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[16px] font-bold text-primary-foreground shadow-card transition hover:brightness-110"
                 >
                   <Lock className="h-4 w-4" /> Proceed to Secure Checkout <ArrowRight className="h-4 w-4" />
                 </button>
                 <p className="text-center text-[12px] text-muted-foreground">
                   Pay {advanceAmount > 0 ? `₹${advanceAmount.toLocaleString("en-IN")}` : `${ADVANCE_PCT}%`} advance or full — choose on the next step. Bookings need ≥7 days&apos; notice.
                 </p>
               </div>
             )}
           </motion.div>
         </>
       )}
     </AnimatePresence>
   </>
 );
}
