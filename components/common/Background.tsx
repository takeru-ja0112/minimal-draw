'use client';

import { motion, useReducedMotion } from 'motion/react';

const ROW_COUNT = 16;
const COLUMN_COUNT = 13;
const DOT_SIZE_CLASSES = ['size-1', 'size-1.5', 'size-2'];

export default function Background() {
  const shouldReduceMotion = useReducedMotion();

  const dots = Array.from({ length: ROW_COUNT * COLUMN_COUNT }, (_, index) => {
    const row = Math.floor(index / COLUMN_COUNT);
    const column = index % COLUMN_COUNT;
    const diagonalProgress = (row + column) / (ROW_COUNT + COLUMN_COUNT - 2);
    const sizeIndex = Math.round(diagonalProgress * (DOT_SIZE_CLASSES.length - 1));

    return (
      <motion.span
        key={index}
        className={`${DOT_SIZE_CLASSES[sizeIndex]} place-self-center rounded-full bg-sky-300 will-change-transform ${
          shouldReduceMotion ? 'opacity-50' : ''
        }`}
        initial={shouldReduceMotion ? false : { scale: 0.52, opacity: 0.28 }}
        animate={shouldReduceMotion ? undefined : { scale: [0.52, 0.8, 0.52], opacity: [0.28, 1, 0.28] }}
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 2.8,
                delay: (row + column) * 0.09,
                ease: 'easeInOut',
                repeat: Infinity,
              }
        }
      />
    );
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className={`-ml-[25%] grid h-full w-[150%] grid-cols-13 grid-rows-[repeat(16 ,minmax(0,1fr))] p-[clamp(1rem,4vw,4rem)] sm:ml-0 sm:w-full`}
      >
        {dots}
      </div>
    </div>
  );
}
