import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function CTA() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };
  return (
    <section className="px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-20 sm:py-24 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative mx-auto max-w-7xl rounded-[32px] sm:rounded-[40px] bg-[#04142C] px-6 sm:px-10 lg:px-14 py-12 sm:py-16 md:py-20 text-center text-white shadow-xl overflow-hidden"
      >
        {/* Soft animated glow */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-[#04142C]/0 to-[#04142C]/0"
        ></motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative z-10"
        >
          <motion.p variants={itemVariants} className="mb-4 text-sm font-semibold uppercase tracking-[5px] text-[#FFB94A]">
            Start Today
          </motion.p>

          <motion.h2 variants={itemVariants} className="mx-auto max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
            Everything your classroom needs in one room.
          </motion.h2>

          <motion.p variants={itemVariants} className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Create a room, invite students and start teaching with
            whiteboards, chat, video calls and AI assistance.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-10 flex justify-center">
            <Link to="/register" className="w-full sm:w-auto">
              <motion.div
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden inline-flex justify-center w-full rounded-full bg-white px-8 py-4 font-semibold text-[#04142C] transition-colors"
                variants={{
                  hover: { y: -4, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(255, 255, 255, 0.15), 0 8px 10px -6px rgba(255, 255, 255, 0.1)" }
                }}
              >
                {/* Diagonal shine sweep */}
                <motion.div
                  className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -skew-x-12 translate-x-[-150%]"
                  variants={{
                    hover: { translateX: "150%" }
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                ></motion.div>

                <span className="relative z-10">
                  Create Free Room →
                </span>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default CTA;