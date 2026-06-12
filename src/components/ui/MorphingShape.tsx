// src/components/ui/MorphingShape.tsx
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MorphingShapeProps {
  className?: string;
  duration?: number;
}

export function MorphingShape({ className = '', duration = 8 }: MorphingShapeProps) {
  const [path, setPath] = useState('');

  const paths = [
    'M0 0L100 0L100 100L0 100Z',
    'M50 0L100 50L50 100L0 50Z',
    'M0 0C50 0 100 20 100 50C100 80 50 100 0 100Z',
    'M50 0C80 0 100 20 100 50C100 80 80 100 50 100C20 100 0 80 0 50C0 20 20 0 50 0Z',
  ];

  useEffect(() => {
    setPath(paths[0]);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % paths.length;
      setPath(paths[index]);
    }, duration * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <svg className={`w-full h-full ${className}`} viewBox="0 0 100 100">
      <motion.path
        d={path}
        fill="url(#grad)"
        animate={{ d: path }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
      />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(150 65% 46%)" />
          <stop offset="100%" stopColor="hsl(188 85% 52%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}