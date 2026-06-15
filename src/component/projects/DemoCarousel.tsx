import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  images: readonly string[];
  alt: string;
};

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const DemoCarousel = ({ images, alt }: Props) => {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const total = images.length;

  const go = useCallback(
    (next: number) => {
      setDir(next > index ? 1 : -1);
      setIndex(((next % total) + total) % total);
    },
    [index, total]
  );

  useEffect(() => {
    if (total <= 1) return;
    const id = window.setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % total);
    }, 6000);
    return () => window.clearInterval(id);
  }, [total]);

  const prev = () => go(index - 1);
  const next = () => go(index + 1);

  return (
    <div
      className="group relative aspect-[16/10] w-full overflow-hidden rounded-xl border hairline bg-zinc-50 dark:bg-zinc-900"
      onMouseEnter={(e) => e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-arrow]").forEach((b) => (b.style.opacity = "1"))}
      onMouseLeave={(e) => e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-arrow]").forEach((b) => (b.style.opacity = ""))}
    >
      <AnimatePresence custom={dir} mode="wait">
        <motion.img
          key={images[index]}
          src={images[index]}
          alt={`${alt} ${index + 1}`}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      </AnimatePresence>

      {total > 1 && (
        <>
          <button
            type="button"
            data-arrow
            aria-label="Previous image"
            onClick={prev}
            className="btn-magnetic absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border hairline bg-white/85 text-zinc-900 opacity-0 backdrop-blur transition-opacity hover:bg-zinc-900 hover:text-white sm:left-3 dark:bg-zinc-950/80 dark:text-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-900"
          >
            <span aria-hidden className="text-base leading-none">‹</span>
          </button>
          <button
            type="button"
            data-arrow
            aria-label="Next image"
            onClick={next}
            className="btn-magnetic absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border hairline bg-white/85 text-zinc-900 opacity-0 backdrop-blur transition-opacity hover:bg-zinc-900 hover:text-white sm:right-3 dark:bg-zinc-950/80 dark:text-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-900"
          >
            <span aria-hidden className="text-base leading-none">›</span>
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full border hairline bg-white/70 px-2 py-1 backdrop-blur dark:bg-zinc-950/70">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => go(i)}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (i === index
                    ? "w-5 bg-zinc-900 dark:bg-zinc-50"
                    : "w-1.5 bg-zinc-400 hover:bg-zinc-600 dark:bg-zinc-500 dark:hover:bg-zinc-300")
                }
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border hairline bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 backdrop-blur dark:bg-zinc-950/70 dark:text-zinc-300">
        <span aria-hidden>?</span>
        <span>{alt}</span>
      </div>
    </div>
  );
};

export default DemoCarousel;
