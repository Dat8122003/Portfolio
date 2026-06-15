import { motion, type HTMLMotionProps } from "framer-motion";
import { useReveal } from "../../hooks/useReveal";
import { fadeUp } from "../../hooks/motion";

type Props = HTMLMotionProps<"div"> & {
  as?: "div" | "section" | "header" | "article" | "ul" | "span";
};

const Reveal = ({ as = "div", children, ...rest }: Props) => {
  const [ref, seen] = useReveal<HTMLDivElement>();
  const animate = seen ? "show" : "hidden";
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      initial="hidden"
      animate={animate}
      variants={fadeUp}
      {...rest}
    >
      {children}
    </MotionTag>
  );
};

export default Reveal;
