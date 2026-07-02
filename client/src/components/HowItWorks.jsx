import { Plus, Users, UsersRound, ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create a Room",
      description:
        "Create a private collaboration room in seconds and share it instantly.",
      icon: Plus,
      gradient: "from-blue-400 to-blue-600",
      shadow: "shadow-blue-500/30",
    },
    {
      number: "02",
      title: "Invite Participants",
      description:
        "Share a secure room link so anyone can join instantly from any browser.",
      icon: Users,
      gradient: "from-emerald-400 to-emerald-600",
      shadow: "shadow-emerald-500/30",
    },
    {
      number: "03",
      title: "Collaborate Together",
      description:
        "Draw, chat, video call and use AI assistance in one collaborative space.",
      icon: UsersRound,
      gradient: "from-purple-400 to-purple-600",
      shadow: "shadow-purple-500/30",
    },
  ];

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const leftVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const textItemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative overflow-hidden px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-20 sm:py-24"
    >
      {/* Decorative elements */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#FFB94A]/5 blur-3xl"></div>
      <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }}></div>

      <div className="mx-auto max-w-7xl rounded-[32px] sm:rounded-[40px] border border-slate-200 bg-white px-6 sm:px-10 lg:px-14 py-12 sm:py-16 lg:py-20 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20">
          {/* Left Side */}
          <motion.div 
            variants={leftVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-4 sm:space-y-6 flex flex-col items-center text-center lg:items-start lg:text-left"
          >

            <motion.p variants={textItemVariants} className="mb-4 text-sm font-semibold uppercase tracking-[5px] text-[#FFB94A]">
              How It Works
            </motion.p>

            <motion.h2 variants={textItemVariants} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-[#04142C]">
              From idea to
              <br />
              collaboration
              <br />
              in seconds.
            </motion.h2>

            <motion.p variants={textItemVariants} className="max-w-lg text-lg leading-relaxed text-slate-600">
              No installations. No complicated setup.
              Everything happens inside one collaborative room.
            </motion.p>

            {/* Visual indicator */}
            <motion.div variants={textItemVariants} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#04142C] shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>

              <span className="text-base font-medium text-slate-600">
                Built for educators and teams
              </span>
            </motion.div>
          </motion.div>

          {/* Right Side - Steps */}
          <div>
            <div className="mb-4 text-sm font-semibold uppercase tracking-[5px] text-[#FFB94A]">
              Simple 3-Step Process
            </div>

            <div className="relative space-y-8">
              {/* Dynamic scroll line */}
              <div className="hidden sm:block absolute left-[51px] top-[72px] bottom-[72px] w-0.5 bg-white/10 z-0">
                <motion.div 
                  className="w-full bg-gradient-to-b from-[#FFB94A] to-[#FFB94A]/30 origin-top z-10"
                  style={{ height: lineHeight }}
                ></motion.div>
              </div>

              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.15 }}
                  className="group relative z-10 rounded-2xl border border-slate-800 bg-[#04142C] p-6 text-white transition-shadow duration-300 hover:border-[#FFB94A]/40 hover:shadow-2xl hover:shadow-[#04142C]/20"
                >
                  {/* Step number background */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1, delay: index * 0.15 + 0.3 }}
                    className="absolute -right-2 -top-2 text-7xl font-bold text-white/5 transition-colors duration-300 group-hover:text-white/10"
                  >
                    {step.number}
                  </motion.div>

                  <div className="relative flex items-start gap-4 sm:gap-5">
                    {/* Icon with white background */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <step.icon className="h-7 w-7 text-[#04142C]" strokeWidth={1.5} />
                    </div>

                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#FFB94A]">
                          Step {step.number}
                        </span>
                        {index < steps.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-white/20" />
                        )}
                      </div>

                      <h3 className="mt-2 text-xl sm:text-2xl font-bold text-white">
                        {step.title}
                      </h3>

                      <p className="mt-2 leading-relaxed text-slate-300">
                        {step.description}
                      </p>

                      {/* Progress indicator */}
                      <div className="mt-4 flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-white/10">
                          <div
                            className="h-1 rounded-full bg-gradient-to-r from-[#FFB94A] to-[#FFB94A]/50"
                            style={{ width: `${(index + 1) * 33.33}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-white/40">
                          {index + 1}/{steps.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;