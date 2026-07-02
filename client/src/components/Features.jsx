import {
  PenTool,
  MessageSquare,
  Video,
  Monitor,
  Bot,
  Lock,
  ArrowRight,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

function Features() {
  const prefersReducedMotion = useReducedMotion();
  const features = [
    {
      icon: PenTool,
      title: "Infinite Whiteboard",
      description:
        "Draw, sketch, and collaborate together on an infinite shared canvas in real time.",
      color: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-500/30",
    },
    {
      icon: MessageSquare,
      title: "Real-Time Chat",
      description:
        "Keep every conversation organized with room-specific messaging and history.",
      color: "from-emerald-500 to-emerald-600",
      shadow: "shadow-emerald-500/30",
    },
    {
      icon: Video,
      title: "HD Video Meetings",
      description:
        "Connect face-to-face with built-in high-quality video calling.",
      color: "from-purple-500 to-purple-600",
      shadow: "shadow-purple-500/30",
    },
    {
      icon: Monitor,
      title: "Screen Sharing",
      description:
        "Share your screen to present ideas, code, or documents instantly.",
      color: "from-orange-500 to-orange-600",
      shadow: "shadow-orange-500/30",
    },
    {
      icon: Bot,
      title: "AI Assistant",
      description:
        "Get instant help, brainstorm ideas, and solve problems with AI.",
      color: "from-pink-500 to-pink-600",
      shadow: "shadow-pink-500/30",
    },
    {
      icon: Lock,
      title: "Secure Private Rooms",
      description:
        "Invite teammates securely with role-based access and private collaboration spaces.",
      color: "from-indigo-500 to-indigo-600",
      shadow: "shadow-indigo-500/30",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <section
      id="features"
      className="relative overflow-hidden px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-20 sm:py-24"
    >
      {/* Background Blur */}
      <div className="absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#FFB94A]/5 blur-3xl" />
      <div className="absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-[#04142C]/5 blur-3xl" />

      <div className="mx-auto max-w-7xl rounded-[32px] sm:rounded-[40px] border border-slate-200 bg-white px-6 sm:px-10 lg:px-14 py-12 sm:py-16 lg:py-20 shadow-xl backdrop-blur-sm">
        {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-[5px] text-[#FFB94A]">
              Features
            </p>

            <h2 className="mt-4 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-[#04142C]">
              One Room.
              <br />
              Every Collaboration Tool You Need.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Replace multiple apps with one collaborative workspace.
              Whiteboard, chat, video meetings, screen sharing, and AI—all in one
              room.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mt-12 sm:mt-16 lg:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                whileHover={prefersReducedMotion ? {} : "hover"}
                className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white p-6 sm:p-8 flex flex-col h-full"
                style={{
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" // Base shadow-sm
                }}
                variants={{
                  hover: {
                    y: -6,
                    boxShadow: "0 25px 50px -12px rgba(4, 20, 44, 0.15)",
                    transition: { duration: 0.3, ease: "easeOut" }
                  },
                  visible: itemVariants.visible,
                  hidden: itemVariants.hidden,
                }}
              >
                {/* Gradient Border */}
                <motion.div 
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#FFB94A] via-transparent to-[#04142C] p-[1px]"
                  initial={{ opacity: 0 }}
                  variants={{ hover: { opacity: 1, transition: { duration: 0.3 } } }}
                >
                  <div className="h-full w-full rounded-3xl bg-white"></div>
                </motion.div>

                <div className="relative z-10 flex flex-col flex-1">
                  {/* Icon */}
                  <motion.div
                    variants={{
                      hover: { scale: 1.08, transition: { type: "spring", stiffness: 400, damping: 25 } }
                    }}
                    className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg ${feature.shadow}`}
                  >
                    <feature.icon
                      className="h-7 w-7 text-white"
                      strokeWidth={1.8}
                    />
                  </motion.div>

                  {/* Title */}
                  <motion.h3 
                    variants={{
                      hover: { y: -2, transition: { duration: 0.3, ease: "easeOut" } }
                    }}
                    className="text-xl font-bold text-[#04142C]"
                  >
                    {feature.title}
                  </motion.h3>

                  {/* Description */}
                  <p className="mt-4 leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
      </div>
    </section>
  );
}

export default Features;