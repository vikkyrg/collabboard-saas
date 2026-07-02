import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

function PageTransition({ children }) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Reset scroll position on route mount smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const variants = {
    initial: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
      scale: prefersReducedMotion ? 1 : 0.995,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5, // Between 0.45 and 0.60
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -10,
      scale: prefersReducedMotion ? 1 : 0.995,
      transition: {
        duration: 0.3, // Between 0.25 and 0.35
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className="page-transition-wrapper w-full h-full"
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
