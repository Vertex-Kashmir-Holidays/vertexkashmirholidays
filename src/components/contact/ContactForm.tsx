// src/components/contact/ContactForm.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/brand';
import type { ContactFormContent } from '@/types/contact';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(6, 'Enter a valid phone number'),
  message: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const formTrust = ['No spam. Ever.', 'We reply within 2 hours', '100% free advice'];

interface ContactFormProps {
  content: ContactFormContent;
}

export function ContactForm({ content }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'contact' }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'Request failed');
      }
      toast.success("Message sent! We'll reply within 2 hours.");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const inputClass =
    'mt-1.5 w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-[13px] text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <aside className="rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24">
      <motion.p
        className="text-[11px] font-bold tracking-[0.22em] text-primary"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {content.kicker}
      </motion.p>
      <motion.h2
        className="h-display mt-2 font-display text-[23px] font-bold leading-snug"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {content.title}
      </motion.h2>

      <form className="mt-5 space-y-3.5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="cName" className="text-[12px] font-semibold">
            Your Name <span className="text-rose-500">*</span>
          </label>
          <input id="cName" className={inputClass} placeholder="Enter your name" {...register('name')} />
          {errors.name && <p className="mt-1 text-[11px] text-rose-500">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="cEmail" className="text-[12px] font-semibold">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input id="cEmail" type="email" className={inputClass} placeholder="Enter your email" {...register('email')} />
          {errors.email && <p className="mt-1 text-[11px] text-rose-500">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="cPhone" className="text-[12px] font-semibold">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input id="cPhone" type="tel" className={inputClass} placeholder="+91 00000 00000" {...register('phone')} />
          {errors.phone && <p className="mt-1 text-[11px] text-rose-500">{errors.phone.message}</p>}
        </div>
        <div>
          <label htmlFor="cMsg" className="text-[12px] font-semibold">
            Message
          </label>
          <textarea
            id="cMsg"
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="Tell us about your dream trip..."
            {...register('message')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] font-semibold text-foreground/70">
          {formTrust.map((t, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
              {t}
            </span>
          ))}
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="!mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-[13.5px] font-bold text-primary-foreground shadow-card transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitting ? 'Sending…' : 'Send Message'}
          {!isSubmitting && <ArrowRight className="h-4 w-4" strokeWidth={2.2} />}
        </motion.button>
      </form>

      {content.note && (
        <p className="mt-3.5 flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
          <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
          {content.note}{' '}
          <Link href={content.whatsappHref} className="font-bold text-primary hover:underline">
            Chat instantly
          </Link>
        </p>
      )}
    </aside>
  );
}
