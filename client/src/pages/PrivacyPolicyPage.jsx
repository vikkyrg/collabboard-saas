import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Mail, ArrowRight } from "lucide-react";
import { motion, useScroll, useReducedMotion } from "framer-motion";

function PrivacyPolicyPage() {
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
    document.title = "Privacy Policy | CollabBoard";
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
              Privacy Policy
            </motion.h1>
            <motion.p variants={itemVariants} className="mx-auto max-w-2xl text-xl text-slate-500">
              Your privacy is important to us.
            </motion.p>
          </motion.div>

          <div className="space-y-16">
            {/* Information We Collect */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
              <motion.h2 variants={itemVariants} className="mb-6 text-2xl font-bold text-[#04142C]">Information We Collect</motion.h2>
              <motion.p variants={itemVariants} className="mb-4 text-lg leading-relaxed text-slate-600">
                To provide you with the best collaborative experience, we collect the following types of information:
              </motion.p>
              <motion.ul variants={itemVariants} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {["Name", "Email", "Google Account details", "Room Data", "Chat Messages", "Whiteboard Data"].map((item, idx) => (
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

            {/* How We Use Your Information */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
              <motion.h2 variants={itemVariants} className="mb-6 text-2xl font-bold text-[#04142C]">How We Use Your Information</motion.h2>
              <motion.p variants={itemVariants} className="mb-4 text-lg leading-relaxed text-slate-600">
                The information we collect is strictly used to facilitate and improve your experience on CollabBoard:
              </motion.p>
              <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
                {[
                  { title: "Authentication", desc: "To securely log you into your account and verify your identity." },
                  { title: "Room Collaboration", desc: "To sync real-time actions across all users in a workspace." },
                  { title: "Video Calls", desc: "To route secure peer-to-peer audio and video streams." },
                  { title: "AI Assistance", desc: "To provide intelligent, contextual AI responses within your room." },
                  { title: "Platform Improvements", desc: "To analyze performance and build better tools." },
                ].map((usage, idx) => (
                  <motion.div 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={prefersReducedMotion ? {} : { y: -5, scale: 1.01, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", borderColor: "rgba(255, 185, 74, 0.4)", transition: { duration: 0.25 } }}
                    className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-colors duration-250"
                  >
                    <h3 className="mb-2 font-bold text-[#04142C]">{usage.title}</h3>
                    <p className="text-sm text-slate-500">{usage.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Third Party Services */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
              <motion.h2 variants={itemVariants} className="mb-6 text-2xl font-bold text-[#04142C]">Third Party Services</motion.h2>
              <motion.p variants={itemVariants} className="mb-4 text-lg leading-relaxed text-slate-600">
                We integrate with industry-leading third-party services to power CollabBoard. These services have their own strict privacy policies:
              </motion.p>
              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                {["Google OAuth", "MongoDB Atlas", "Agora RTC", "Groq AI"].map((service, idx) => (
                  <motion.span 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={prefersReducedMotion ? {} : { y: -2, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", transition: { duration: 0.2 } }}
                    className="rounded-full bg-[#04142C]/5 px-6 py-2.5 font-semibold text-[#04142C] cursor-default"
                  >
                    {service}
                  </motion.span>
                ))}
              </motion.div>
            </motion.section>

            {/* Data Security */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
              <motion.h2 variants={itemVariants} className="mb-6 text-2xl font-bold text-[#04142C]">Data Security</motion.h2>
              <motion.p variants={itemVariants} className="text-lg leading-relaxed text-slate-600">
                We take the security of your data seriously. CollabBoard uses secure authentication protocols to protect your identity. All real-time communication, including chat and video streams, is encrypted in transit. Persistent data, such as whiteboard layouts, is stored securely within isolated databases.
              </motion.p>
            </motion.section>

            {/* Contact */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="rounded-3xl bg-[#04142C] p-10 text-white relative overflow-hidden">
              <motion.div variants={itemVariants} className="relative z-10">
                <h2 className="mb-4 text-2xl font-bold">Contact</h2>
                <p className="mb-8 text-slate-400">If you have any questions or concerns regarding this Privacy Policy, please contact us.</p>
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

export default PrivacyPolicyPage;
