import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import heroImage from "../assets/icon.png";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();

  // Scroll animations for navbar
  const backgroundColor = useTransform(
    scrollY,
    [0, 50],
    ["rgba(248, 246, 241, 0)", "rgba(248, 246, 241, 0.9)"]
  );
  const backdropFilter = useTransform(
    scrollY,
    [0, 50],
    ["blur(0px)", "blur(12px)"]
  );
  const borderBottomColor = useTransform(
    scrollY,
    [0, 50],
    ["rgba(229, 229, 229, 0)", "rgba(229, 229, 229, 0.5)"]
  );
  const boxShadow = useTransform(
    scrollY,
    [0, 50],
    ["none", "0 1px 2px 0 rgba(0, 0, 0, 0.05)"]
  );

  // Initial load animations
  const navContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.nav 
      style={{ backgroundColor, backdropFilter, borderBottomColor, boxShadow }}
      className="sticky top-0 z-50 border-b transition-colors duration-300"
      initial="hidden"
      animate="visible"
      variants={navContainerVariants}
    >
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* Brand Logo */}
        <motion.a
          variants={itemVariants}
          href="#"
          className="flex items-center gap-1.5 text-2xl font-extrabold text-[#04142C] tracking-tight transition-transform active:scale-[0.99] shrink-0"
        >
          <img src={heroImage} alt="CollabBoard Logo" className="h-8 w-auto object-contain" />
          <span>Collab<span className="text-[#FFB94A]">Board</span></span>
        </motion.a>

        {/* Call to Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-7">
          <motion.div variants={itemVariants}>
            <Link
              to="/login"
              className="text-[#04142C] font-bold text-sm hover:opacity-80 transition-opacity"
            >
              Sign In
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/register">
              <motion.div
                whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(4, 20, 44, 0.2)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center rounded-full bg-[#04142C] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#04142C]/10 transition-colors duration-300 hover:bg-[#020b18]"
              >
                Get Started →
              </motion.div>
            </Link>
          </motion.div>
        </div>

        {/* Mobile Navigation Toggle */}
        <motion.div variants={itemVariants} className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg border border-neutral-300 text-[#04142C] bg-white/50 hover:bg-white active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#04142C]/20"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </motion.div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden absolute top-full left-0 right-0 border-b border-neutral-200/60 bg-[#F8F6F1]/95 backdrop-blur-xl shadow-xl p-6 flex flex-col z-40"
        >
          
          <div className="flex flex-col gap-4 pt-5">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="text-[#04142C] font-bold text-base text-center py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center rounded-full bg-[#04142C] px-5 py-3 text-base font-bold text-white shadow-md transition-all hover:bg-[#020b18] active:scale-[0.98]"
            >
              Get Started →
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

export default Navbar;