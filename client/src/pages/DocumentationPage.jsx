import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useReducedMotion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { 
  Search, 
  MonitorPlay, 
  MessageSquare, 
  Video, 
  Share2, 
  Sparkles, 
  ShieldCheck,
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Type,
  Trash2,
  Layers,
  RefreshCw,
  Camera,
  Mic,
  MicOff,
  PhoneOff,
  LogOut,
  Mail,
  ChevronDown
} from "lucide-react";

const GithubIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const SECTIONS = [
  { id: "welcome", title: "Welcome" },
  { id: "getting-started", title: "Getting Started" },
  { id: "dashboard", title: "Dashboard" },
  { id: "room-features", title: "Room Features" },
  { id: "whiteboard-guide", title: "Whiteboard Guide" },
  { id: "video-calls", title: "Video Calls" },
  { id: "ai-assistant", title: "AI Assistant" },
  { id: "room-permissions", title: "Room Permissions" },
  { id: "shortcuts", title: "Shortcuts" },
  { id: "best-practices", title: "Best Practices" },
  { id: "faq", title: "FAQ" },
  { id: "troubleshooting", title: "Troubleshooting" },
  { id: "contact-support", title: "Contact Support" },
  { id: "version", title: "Version" },
];

function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("welcome");
  const [openFaq, setOpenFaq] = useState(null);
  const observerRef = useRef(null);
  
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
    document.title = "Documentation | CollabBoard";

    const handleIntersect = (entries) => {
      // Find the most visible section
      let maxRatio = 0;
      let mostVisibleId = null;
      
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          mostVisibleId = entry.target.id;
        }
      });

      if (mostVisibleId) {
        setActiveSection(mostVisibleId);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: "-20% 0px -60% 0px",
      threshold: [0, 0.2, 0.5, 0.8, 1],
    });

    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

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

      {/* Hero Section */}
      <div className="border-b border-slate-200 bg-white pt-24 pb-16 relative z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="mx-auto max-w-7xl px-6 lg:px-8 text-center"
        >
          <motion.h1 variants={itemVariants} className="mb-6 text-4xl font-extrabold tracking-tight text-[#04142C] md:text-5xl lg:text-6xl">
            Documentation
          </motion.h1>
          <motion.p variants={itemVariants} className="mx-auto mb-10 max-w-2xl text-xl text-slate-500">
            Everything you need to start collaborating with CollabBoard.
          </motion.p>
          
          {/* Fake Search UI */}
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.98 },
              visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
            }}
            whileHover={prefersReducedMotion ? {} : { boxShadow: "0 10px 15px -3px rgba(255, 185, 74, 0.15), 0 4px 6px -2px rgba(255, 185, 74, 0.05)" }}
            className="mx-auto max-w-xl relative flex items-center group rounded-2xl transition-shadow duration-300"
          >
            <Search className="absolute left-4 h-5 w-5 text-slate-400 group-hover:text-[#FFB94A] transition-colors" />
            <input 
              type="text" 
              placeholder="Search documentation..." 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-700 shadow-sm transition-all duration-300 focus:border-[#FFB94A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FFB94A]/10 hover:border-[#FFB94A]/50"
              readOnly
            />
            <div className="absolute right-4 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-400">
              Ctrl K
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:gap-12">
          
          {/* Sticky Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="hidden lg:block lg:w-[260px] lg:shrink-0 relative z-10"
          >
            <div className="sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto pr-6 custom-scrollbar">
              <nav className="flex flex-col space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollTo(section.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all duration-300 ${
                      activeSection === section.id
                        ? "bg-slate-100 text-[#04142C]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-[#04142C]"
                    }`}
                  >
                    {section.title}
                    {activeSection === section.id && (
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FFB94A]" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </motion.aside>

          {/* Main Content Areas */}
          <div className="flex-1 space-y-20 lg:max-w-4xl pb-32">

            {/* Section 1: Welcome */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="welcome" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-6 text-3xl font-bold text-[#04142C]">Welcome to CollabBoard</motion.h2>
              <motion.div variants={itemVariants} className="prose prose-slate max-w-none text-lg">
                <p>
                  CollabBoard is an all-in-one real-time collaboration platform where teachers, students and teams can work together inside private rooms.
                </p>
                <p className="mt-4 font-semibold text-slate-700">Users can:</p>
                <motion.ul variants={itemVariants} className="mt-4 grid gap-3 sm:grid-cols-2">
                  {["Draw", "Chat", "Video call", "Share screens", "Use AI Assistant"].map((item, idx) => (
                    <motion.li key={idx} variants={itemVariants} className="flex items-center rounded-xl bg-slate-50 p-3 text-slate-700">
                      <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#04142C] text-xs font-bold text-[#FFB94A]">✓</span>
                      {item}
                    </motion.li>
                  ))}
                </motion.ul>
                <motion.p variants={itemVariants} className="mt-8 rounded-xl bg-[#04142C]/5 p-6 text-center font-semibold text-[#04142C]">
                  Everything happens in one shared workspace.
                </motion.p>
              </motion.div>
            </motion.section>

            {/* Section 2: Getting Started */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="getting-started" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-8 text-3xl font-bold text-[#04142C]">Getting Started</motion.h2>
              <motion.div variants={itemVariants} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {[
                  "Create an account.",
                  "Login.",
                  "Create a collaboration room.",
                  "Copy the invite link.",
                  "Invite participants.",
                  "Open the collaborative workspace."
                ].map((step, idx) => (
                  <motion.div key={idx} variants={itemVariants} className="relative mb-8 last:mb-0 group">
                    <div className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-bold text-slate-500 transition-colors duration-300 group-hover:bg-[#FFB94A] group-hover:text-[#04142C]">
                      {idx + 1}
                    </div>
                    <div className="ml-4 rounded-xl border border-slate-100 bg-slate-50 p-4 font-semibold text-slate-700 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                      <p>Step {idx + 1}: <span className="font-normal text-slate-500">{step}</span></p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Section 3: Dashboard */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="dashboard" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-6 text-3xl font-bold text-[#04142C]">Dashboard</motion.h2>
              <motion.p variants={itemVariants} className="mb-8 text-lg text-slate-600">Dashboard allows users to:</motion.p>
              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                {["Create Room", "View My Rooms", "Join Room", "Manage Rooms", "Delete Rooms"].map((action, idx) => (
                  <motion.span 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={prefersReducedMotion ? {} : { y: -2, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)", borderColor: "#FFB94A" }}
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm transition-colors duration-250 cursor-default"
                  >
                    {action}
                  </motion.span>
                ))}
              </motion.div>
            </motion.section>

            {/* Section 4: Room Features */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="room-features" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-8 text-3xl font-bold text-[#04142C]">Room Features</motion.h2>
              <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2">
                {[
                  { icon: MonitorPlay, title: "Infinite Whiteboard", desc: "Real-time drawing." },
                  { icon: MessageSquare, title: "Realtime Chat", desc: "Messages synchronized instantly." },
                  { icon: Video, title: "HD Video Meeting", desc: "Crystal clear meetings." },
                  { icon: Share2, title: "Screen Sharing", desc: "Present slides, browser or code." },
                  { icon: Sparkles, title: "AI Assistant", desc: "Ask questions. Generate explanations." },
                  { icon: ShieldCheck, title: "Private Rooms", desc: "Invite-only collaboration." },
                ].map((feature, idx) => (
                  <motion.div 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={prefersReducedMotion ? {} : { y: -5, scale: 1.01, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}
                    className="group flex flex-col items-start rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-colors duration-300 hover:bg-white"
                  >
                    <motion.div 
                      variants={{ hover: { scale: 1.1, transition: { type: "spring", stiffness: 400, damping: 25 } } }}
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#04142C] text-white shadow-sm"
                    >
                      <feature.icon className="h-6 w-6 text-[#FFB94A]" />
                    </motion.div>
                    <h3 className="mb-2 text-lg font-bold text-[#04142C]">{feature.title}</h3>
                    <p className="text-slate-500">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Section 5: Whiteboard Guide */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="whiteboard-guide" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-8 text-3xl font-bold text-[#04142C]">Whiteboard Guide</motion.h2>
              <motion.div variants={itemVariants} className="grid gap-4">
                {[
                  { icon: MousePointer2, title: "Selection Tool", desc: "Move objects. Resize objects. Delete objects." },
                  { icon: Pencil, title: "Pencil", desc: "Freehand drawing." },
                  { icon: Square, title: "Rectangle", desc: "Insert rectangle." },
                  { icon: Circle, title: "Circle", desc: "Insert circle." },
                  { icon: Type, title: "Text", desc: "Insert editable text." },
                  { icon: Trash2, title: "Delete", desc: "Remove selected items." },
                  { icon: Layers, title: "Multi Select", desc: "Delete multiple elements together." },
                  { icon: RefreshCw, title: "Canvas Sync", desc: "Everything syncs instantly." },
                ].map((tool, idx) => (
                  <motion.div 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={prefersReducedMotion ? {} : { x: 5, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)", borderColor: "rgba(255, 185, 74, 0.4)" }}
                    className="group flex items-center gap-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-colors duration-300"
                  >
                    <motion.div 
                      variants={{ hover: { backgroundColor: "rgba(255, 185, 74, 0.1)", color: "#FFB94A" } }}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors"
                    >
                      <tool.icon className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-[#04142C]">{tool.title}</h3>
                      <p className="text-sm text-slate-500">{tool.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Section 6: Video Calls */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="video-calls" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-6 text-3xl font-bold text-[#04142C]">Video Calls</motion.h2>
              <motion.p variants={itemVariants} className="mb-8 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-600">
                Powered by <span className="text-[#04142C]">Agora</span>
              </motion.p>
              
              <motion.div variants={itemVariants} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Camera, name: "Camera" },
                  { icon: Mic, name: "Microphone" },
                  { icon: MicOff, name: "Mute/Unmute" },
                  { icon: Share2, name: "Screen Share" },
                  { icon: PhoneOff, name: "Leave Meeting" },
                  { icon: LogOut, name: "Participants join instantly." }
                ].map((feat, idx) => (
                  <motion.div 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={prefersReducedMotion ? {} : { y: -2, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)" }}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-white"
                  >
                    <feat.icon className="h-5 w-5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{feat.name}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Section 7: AI Assistant */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="ai-assistant" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-6 flex items-center gap-3 text-3xl font-bold text-[#04142C]">
                AI Assistant <Sparkles className="h-6 w-6 text-[#FFB94A]" />
              </motion.h2>
              <motion.p variants={itemVariants} className="mb-8 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-600">
                Powered by <span className="text-[#04142C]">Gemini AI</span>
              </motion.p>
              
              <motion.ul variants={itemVariants} className="space-y-3">
                {["Ask classroom questions.", "Summarize lessons.", "Generate explanations.", "Brainstorm ideas.", "Help solve problems."].map((item, idx) => (
                  <motion.li 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={prefersReducedMotion ? {} : { y: -2, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)", borderColor: "rgba(255, 185, 74, 0.4)" }}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors duration-300"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#04142C] text-white">
                      <Sparkles className="h-4 w-4 text-[#FFB94A]" />
                    </div>
                    <span className="font-semibold text-slate-700">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.section>

            {/* Section 8: Room Permissions */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="room-permissions" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-8 text-3xl font-bold text-[#04142C]">Room Permissions</motion.h2>
              <motion.div variants={itemVariants} className="grid gap-8 sm:grid-cols-2">
                
                <motion.div 
                  whileHover={prefersReducedMotion ? {} : { y: -5, scale: 1.01, boxShadow: "0 25px 50px -12px rgba(4,20,44,0.3)" }}
                  className="rounded-2xl border border-slate-200 bg-[#04142C] p-8 text-white shadow-xl transition-colors duration-300"
                >
                  <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold">
                    <ShieldCheck className="h-7 w-7 text-[#FFB94A]" /> Teacher
                  </h3>
                  <ul className="space-y-4">
                    {["Create room.", "Invite participants.", "Manage members."].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 font-semibold text-slate-300">
                        <div className="h-2 w-2 rounded-full bg-[#FFB94A]" /> {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div 
                  whileHover={prefersReducedMotion ? {} : { y: -5, scale: 1.01, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", borderColor: "rgba(255, 185, 74, 0.4)" }}
                  className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl transition-colors duration-300"
                >
                  <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold text-[#04142C]">
                    <MonitorPlay className="h-7 w-7 text-slate-400" /> Student
                  </h3>
                  <ul className="space-y-4">
                    {["Join room.", "Collaborate.", "Chat.", "Draw.", "Video call."].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 font-semibold text-slate-600">
                        <div className="h-2 w-2 rounded-full bg-slate-300" /> {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>

              </motion.div>
            </motion.section>

            {/* Section 9: Shortcuts */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="shortcuts" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-8 text-3xl font-bold text-[#04142C]">Shortcuts</motion.h2>
              <motion.div variants={itemVariants} className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-bold">Action</th>
                      <th scope="col" className="px-6 py-4 font-bold">Shortcut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { action: "Undo", key: "Ctrl + Z" },
                      { action: "Redo", key: "Ctrl + Y" },
                      { action: "Delete", key: "Delete" },
                      { action: "Copy", key: "Ctrl + C" },
                      { action: "Paste", key: "Ctrl + V" },
                    ].map((row, idx) => (
                      <motion.tr 
                        key={idx} 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-t border-slate-100 bg-white transition-colors hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-semibold text-[#04142C]">{row.action}</td>
                        <td className="px-6 py-4">
                          <kbd className="rounded border border-slate-200 bg-slate-100 px-2 py-1.5 font-mono text-xs font-semibold text-slate-800">
                            {row.key}
                          </kbd>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </motion.section>

            {/* Section 10: Best Practices */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="best-practices" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-6 text-3xl font-bold text-[#04142C]">Best Practices</motion.h2>
              <motion.div variants={itemVariants} className="space-y-4">
                {[
                  "Always use invite links.",
                  "Keep microphone muted when not speaking.",
                  "Use screen share for presentations.",
                  "Organize rooms by subject.",
                  "Use AI assistant responsibly."
                ].map((practice, idx) => (
                  <motion.div 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={prefersReducedMotion ? {} : { x: 5, borderColor: "rgba(255, 185, 74, 0.4)" }}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-5 transition-colors duration-300 hover:bg-white"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#04142C] font-bold text-[#FFB94A]">
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-slate-700">{practice}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Section 11: FAQ */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="faq" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-8 text-3xl font-bold text-[#04142C]">FAQ</motion.h2>
              <motion.div variants={itemVariants} className="space-y-4">
                {[
                  { q: "How do I create a room?", a: "Navigate to your Dashboard and click the 'Create Room' button." },
                  { q: "How do I invite students?", a: "Once in a room, simply copy the URL or the Room ID and send it to your students." },
                  { q: "Can anyone join?", a: "Only users with the exact Room ID or invite link can join your private room." },
                  { q: "Is video encrypted?", a: "Yes, all video streams powered by Agora are securely encrypted." },
                  { q: "Can I draw together?", a: "Yes, the infinite whiteboard syncs all drawings in real-time across all connected clients." },
                  { q: "Can I share my screen?", a: "Absolutely. Click the Screen Share button in the video controls." },
                  { q: "Can multiple users edit together?", a: "Yes, everything in CollabBoard is built for multi-user real-time collaboration." }
                ].map((faq, idx) => (
                  <motion.div 
                    key={idx} 
                    variants={itemVariants}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors duration-300 hover:border-slate-300"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="flex w-full items-center justify-between p-6 text-left"
                    >
                      <span className="font-bold text-[#04142C]">{faq.q}</span>
                      <motion.div
                        animate={{ rotate: openFaq === idx ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      </motion.div>
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq === idx && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden px-6"
                        >
                          <div className="pb-6">
                            <p className="text-slate-600">{faq.a}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Section 12: Troubleshooting */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="troubleshooting" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-6 text-3xl font-bold text-[#04142C]">Troubleshooting</motion.h2>
              <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
                {[
                  "Camera not working.",
                  "Microphone not detected.",
                  "Cannot join room.",
                  "Drawing not syncing.",
                  "Screen sharing unavailable.",
                  "AI assistant unavailable."
                ].map((issue, idx) => (
                  <motion.div 
                    key={idx} 
                    variants={itemVariants}
                    whileHover={prefersReducedMotion ? {} : { y: -2, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)" }}
                    className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 transition-colors"
                  >
                    <div className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <span className="font-semibold text-red-900">{issue}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Section 13: Contact Support */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} id="contact-support" className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12 relative z-10">
              <motion.h2 variants={itemVariants} className="mb-8 text-center text-3xl font-bold text-[#04142C]">Contact Support</motion.h2>
              <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-3">
                {[
                  { title: "GitHub", icon: GithubIcon, url: "https://github.com/vikkyrg", target: "_blank" },
                  { title: "LinkedIn", icon: LinkedinIcon, url: "https://www.linkedin.com/in/vignesh-r-a634a2293/", target: "_blank" },
                  { title: "Email", icon: Mail, url: "mailto:rvikky05@gmail.com", target: "_self" },
                ].map((contact, idx) => (
                  <motion.a 
                    key={idx}
                    href={contact.url}
                    target={contact.target}
                    rel={contact.target === "_blank" ? "noopener noreferrer" : ""}
                    whileHover={prefersReducedMotion ? {} : { y: -5, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", borderColor: "#FFB94A" }}
                    className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-colors duration-300 hover:bg-white"
                  >
                    <motion.div 
                      variants={{ hover: { scale: 1.1, transition: { type: "spring", stiffness: 400, damping: 25 } } }}
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#04142C] text-white shadow-md"
                    >
                      <contact.icon className="h-6 w-6 group-hover:text-[#FFB94A] transition-colors" />
                    </motion.div>
                    <span className="font-bold text-[#04142C]">{contact.title}</span>
                  </motion.a>
                ))}
              </motion.div>
            </motion.section>

            {/* Section 14: Version */}
            <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} id="version" className="scroll-mt-32 border-t border-slate-200 pt-8 text-center sm:flex sm:justify-between sm:text-left relative z-10">
              <motion.div variants={itemVariants}>
                <span className="font-bold text-slate-400">Current Version:</span>
                <span className="ml-2 rounded-md bg-slate-100 px-2 py-1 font-mono text-sm font-bold text-slate-600">v1.0</span>
              </motion.div>
              <motion.div variants={itemVariants} className="mt-4 sm:mt-0">
                <span className="font-bold text-slate-400">Last Updated:</span>
                <span className="ml-2 font-semibold text-slate-600">June 2026</span>
              </motion.div>
            </motion.section>

          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}

export default DocumentationPage;
