import { Link } from "react-router-dom";
import { ArrowRight, Play, Users, Sparkles } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 50, stiffness: 400 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const parallaxX = useTransform(smoothMouseX, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [-5, 5]);
  const parallaxY = useTransform(smoothMouseY, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [-5, 5]);
  const parallaxRotate = useTransform(smoothMouseX, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [-1, 1]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (prefersReducedMotion || !sectionRef.current) return;
      const { left, top, width, height } = sectionRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY, prefersReducedMotion]);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      {/* Decorative blobs */}
      <motion.div 
        style={{ x: useTransform(smoothMouseX, [-0.5, 0.5], [-15, 15]), y: useTransform(smoothMouseY, [-0.5, 0.5], [-15, 15]) }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#FFB94A]/20 blur-3xl pointer-events-none"
      ></motion.div>
      <motion.div 
        style={{ x: useTransform(smoothMouseX, [-0.5, 0.5], [15, -15]), y: useTransform(smoothMouseY, [-0.5, 0.5], [15, -15]) }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-[#04142C]/5 blur-3xl pointer-events-none"
      ></motion.div>
      
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-16 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-16 lg:pb-32">

        {/* Left Side */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 sm:space-y-8 flex flex-col items-center text-center lg:items-start lg:text-left"
        >
          {/* Badge */}
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] text-[#04142C]">
            <motion.div variants={itemVariants}>Collaborate. Teach</motion.div>
            <motion.div variants={itemVariants}>Create</motion.div>
            <motion.span variants={itemVariants} className="relative inline-block px-3 mt-1">
              <span className="relative z-10">Together.</span>
              <span className="absolute bottom-1 left-0 right-0 -z-0 h-4 bg-[#FFB94A] md:h-5"></span>
            </motion.span>
          </h1>

          <motion.p variants={itemVariants} className="max-w-xl text-lg leading-relaxed text-slate-600">
            Draw, chat, video call, and collaborate with AI—all in one shared workspace. Create a room, share one link, and start working together instantly.
          </motion.p>

          <motion.div variants={buttonVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 sm:pt-4 w-full">
            <Link to="/register">
              <motion.div
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden inline-flex items-center gap-2 rounded-full bg-[#04142C] px-8 py-4 font-semibold text-white transition-colors"
                variants={{
                  hover: { y: -4, boxShadow: "0 20px 25px -5px rgba(4, 20, 44, 0.2), 0 8px 10px -6px rgba(4, 20, 44, 0.1)" }
                }}
              >
                {/* Diagonal shine sweep */}
                <motion.div
                  className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-150%]"
                  variants={{
                    hover: { translateX: "150%" }
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                ></motion.div>

                <span className="relative z-10 flex items-center gap-2">
                  Create Your Room
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </motion.div>
            </Link>

            <motion.a 
              href="#how-it-works" 
              whileHover={{ y: -2, backgroundColor: "rgba(4, 20, 44, 0.05)" }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-2 rounded-full border-2 border-neutral-300 px-8 py-4 font-semibold transition-colors hover:border-[#04142C]"
            >
              <Play className="h-5 w-5 transition-transform group-hover:scale-110" />
              See How It Works
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Right Side - Enhanced Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className="flex justify-center w-full perspective-1000"
          style={{ x: parallaxX, y: parallaxY, rotate: parallaxRotate }}
        >
          <motion.div 
            animate={{ y: prefersReducedMotion ? 0 : [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-full max-w-xl transform rounded-[24px] sm:rounded-[30px] bg-[#04142C] p-4 sm:p-6 shadow-2xl transition-all duration-500 hover:shadow-3xl"
          >
            
            {/* Live Collaboration Header */}
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/10 backdrop-blur-sm p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFB94A]/20">
                  <Users className="h-5 w-5 text-[#FFB94A]" />
                </div>
                <div>
                  <p className="font-semibold text-white">
                    Live Collaboration
                  </p>
                  <p className="text-sm text-white/60">
                    12 students connected
                  </p>
                </div>
              </div>

              <div className="flex -space-x-2">
                <div className="h-10 w-10 rounded-full border-2 border-[#04142C] bg-gradient-to-br from-red-400 to-red-500 shadow-lg"></div>
                <div className="h-10 w-10 rounded-full border-2 border-[#04142C] bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg"></div>
                <div className="h-10 w-10 rounded-full border-2 border-[#04142C] bg-gradient-to-br from-green-400 to-green-500 shadow-lg"></div>
                <div className="h-10 w-10 rounded-full border-2 border-[#04142C] bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg"></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#04142C] bg-white/20 text-xs font-medium text-white backdrop-blur-sm">
                  +8
                </div>
              </div>
            </div>

            {/* Whiteboard Preview */}
            <div className="relative flex h-[260px] sm:h-[320px] items-center justify-center rounded-2xl bg-[#F5F2EC] overflow-hidden">
              {/* Decorative grid pattern */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, #04142C 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}></div>
              
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="rounded-full bg-[#04142C]/10 p-4">
                  <svg className="h-8 w-8 text-[#04142C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-[#04142C]">
                  Whiteboard Preview
                </span>
                <span className="text-sm text-slate-400">Ready for collaboration</span>
              </div>
              
              {/* Active indicator */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-[#04142C]/80 px-3 py-1.5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400"></span>
                </span>
                <span className="text-xs font-medium text-white">Live</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}

export default Hero;