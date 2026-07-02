import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Mail, ArrowRight } from "lucide-react";
import { motion, useScroll, useReducedMotion } from "framer-motion";

function TermsPage() {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  const sectionVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 35 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.65, ease: "easeOut", staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };
  useEffect(() => {
    document.title = "Terms & Conditions | CollabBoard";
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex min-h-screen flex-col bg-[#F8F6F1] relative overflow-hidden"
    >
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#FFB94A] origin-left z-[100]"
        style={{ scaleX: scrollYProgress }}
      />
      {/* Background Depth */}
      <div className="absolute -right-32 top-32 h-96 w-96 rounded-full bg-[#FFB94A]/5 blur-3xl pointer-events-none" />
      <div className="absolute -left-32 bottom-32 h-80 w-80 rounded-full bg-[#04142C]/5 blur-3xl pointer-events-none" />

      <Navbar />
      
      <main className="flex-1 py-20 px-4 sm:px-6 relative z-10">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-white px-8 py-12 shadow-lg sm:px-12 md:py-20">
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="mb-16 text-center"
          >
            <motion.h1 variants={itemVariants} className="mb-6 text-4xl font-extrabold tracking-tight text-[#04142C] md:text-5xl lg:text-6xl">
              Terms & Conditions
            </motion.h1>
            <motion.p variants={itemVariants} className="mx-auto max-w-2xl text-xl text-slate-500">
              Please read these terms carefully before using CollabBoard.
            </motion.p>
          </motion.div>

          <div className="space-y-16">
            {/* Acceptance of Terms */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
              <motion.h2 variants={itemVariants} className="mb-6 text-2xl font-bold text-[#04142C]">Acceptance of Terms</motion.h2>
              <motion.p variants={itemVariants} className="text-lg leading-relaxed text-slate-600">
                By accessing or using CollabBoard, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, then you may not access the service.
              </motion.p>
            </motion.section>

            {/* User Responsibilities */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
              <motion.h2 variants={itemVariants} className="mb-6 text-2xl font-bold text-[#04142C]">User Responsibilities</motion.h2>
              <motion.p variants={itemVariants} className="mb-4 text-lg leading-relaxed text-slate-600">
                As a user of our platform, you agree to the following responsibilities:
              </motion.p>
              <motion.ul variants={itemVariants} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {["Respect other users.", "Protect account credentials.", "Provide accurate information."].map((item, idx) => (
                  <motion.li 
                    key={idx} 
                    variants={itemVariants}
                    className="flex items-center rounded-xl bg-slate-50 p-4 font-semibold text-slate-700"
                  >
                    <span className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB94A] text-xs font-bold text-white">✓</span>
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.section>

            {/* Prohibited Activities */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
              <motion.h2 variants={itemVariants} className="mb-6 text-2xl font-bold text-[#04142C]">Prohibited Activities</motion.h2>
              <motion.p variants={itemVariants} className="mb-4 text-lg leading-relaxed text-slate-600">
                You may not use CollabBoard to engage in any of the following activities:
              </motion.p>
              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                {["Spam", "Illegal content", "Malicious code", "Unauthorized access"].map((activity, idx) => (
                  <motion.span 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={prefersReducedMotion ? {} : { y: -2, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", transition: { duration: 0.2 } }}
                    className="rounded-full bg-red-50 border border-red-100 px-6 py-2.5 font-semibold text-red-600 cursor-default"
                  >
                    {activity}
                  </motion.span>
                ))}
              </motion.div>
            </motion.section>

            {/* Intellectual Property */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
              <motion.h2 variants={itemVariants} className="mb-6 text-2xl font-bold text-[#04142C]">Intellectual Property</motion.h2>
              <motion.p variants={itemVariants} className="text-lg leading-relaxed text-slate-600">
                You retain all rights and ownership to the content you create and share within CollabBoard. However, CollabBoard owns all intellectual property rights related to the platform itself, including its design, architecture, and underlying code.
              </motion.p>
            </motion.section>

            {/* Service Availability */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
              <motion.h2 variants={itemVariants} className="mb-6 text-2xl font-bold text-[#04142C]">Service Availability</motion.h2>
              <motion.p variants={itemVariants} className="text-lg leading-relaxed text-slate-600">
                We strive to keep CollabBoard available 24/7. However, the platform may be updated periodically, and temporary downtime may occur due to maintenance or circumstances beyond our control.
              </motion.p>
            </motion.section>

            {/* Changes to Terms */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
              <motion.h2 variants={itemVariants} className="mb-6 text-2xl font-bold text-[#04142C]">Changes to Terms</motion.h2>
              <motion.p variants={itemVariants} className="text-lg leading-relaxed text-slate-600">
                We reserve the right to modify or replace these Terms at any time. We will notify users of any significant changes by posting the new terms on this page.
              </motion.p>
            </motion.section>

            {/* Contact */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="rounded-3xl bg-[#04142C] p-10 text-white relative overflow-hidden">
              <motion.div variants={itemVariants} className="relative z-10">
                <h2 className="mb-4 text-2xl font-bold">Contact</h2>
                <p className="mb-8 text-slate-400">If you have any questions about these Terms, please contact us.</p>
                <motion.a 
                  href="mailto:rvikky05@gmail.com" 
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  variants={{
                    hover: { y: -4, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(255, 255, 255, 0.15), 0 8px 10px -6px rgba(255, 255, 255, 0.1)", backgroundColor: "#ffffff" }
                  }}
                  className="group relative overflow-hidden inline-flex items-center gap-2 rounded-full bg-[#FFB94A] px-8 py-4 font-bold text-[#04142C] transition-colors"
                >
                  {/* Diagonal shine sweep */}
                  <motion.div
                    className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -skew-x-12 translate-x-[-150%]"
                    variants={{
                      hover: { translateX: "150%" }
                    }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  ></motion.div>

                  <span className="relative z-10 flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    rvikky05@gmail.com
                  </span>
                </motion.a>
              </motion.div>
            </motion.section>
          </div>

        </div>
      </main>

      <Footer />
    </motion.div>
  );
}

export default TermsPage;
