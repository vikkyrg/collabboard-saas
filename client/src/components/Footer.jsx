import { Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

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
import heroImage from "../assets/white_icon.png";

function Footer() {
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
    <footer id="contact" className="bg-[#04142C] text-white py-16 sm:py-20">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12"
      >
        {/* Top section: 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-center sm:text-left">
          {/* Column 1 - Brand */}
          <motion.div variants={itemVariants} className="flex flex-col items-center sm:items-start">
            <h2 className="flex items-center gap-1.5 text-3xl font-bold justify-center sm:justify-start">
              <img
                src={heroImage}
                alt="CollabBoard Logo"
                className="h-8 w-auto object-contain"
              />
              <span>
                Collab<span className="text-[#FFB94A]">Board</span>
              </span>
            </h2>
            <p className="mt-4 max-w-[320px] leading-8 text-slate-400">
              Teach, collaborate, and create together with one secure workspace
              for classrooms, educators, students, and modern teams.
            </p>

            <div className="mt-8">
              <h3 className="mb-4 font-semibold text-white">Connect</h3>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <motion.a
                  whileHover={{ scale: 1.1, opacity: 1 }}
                  initial={{ opacity: 0.7 }}
                  href="https://github.com/vikkyrg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white"
                >
                  <GithubIcon className="h-5 w-5" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1, opacity: 1 }}
                  initial={{ opacity: 0.7 }}
                  href="https://www.linkedin.com/in/vignesh-r-a634a2293/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white"
                >
                  <LinkedinIcon className="h-5 w-5" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1, opacity: 1 }}
                  initial={{ opacity: 0.7 }}
                  href="mailto:rvikky05@gmail.com"
                  className="text-slate-400 hover:text-white"
                >
                  <Mail className="h-5 w-5" />
                </motion.a>
              </div>
            </div>
          </motion.div>

          {/* Column 2 - Product */}
          <motion.div variants={itemVariants} className="flex flex-col items-center sm:items-start">
            <h3 className="mb-6 font-semibold text-white">Product</h3>
            <ul className="space-y-4 text-slate-400">
              <li className="cursor-default">
                Whiteboard
              </li>
              <li className="cursor-default">
                Real-Time Chat
              </li>
              <li className="cursor-default">
                HD Video Meetings
              </li>
              <li className="cursor-default">
                Screen Sharing
              </li>
              <li className="cursor-default">
                AI Assistant
              </li>
              <li className="cursor-default">
                Secure Private Rooms
              </li>
            </ul>
          </motion.div>

          {/* Column 3 - Resources */}
          <motion.div variants={itemVariants} className="flex flex-col items-center sm:items-start">
            <h3 className="mb-6 font-semibold text-white">Resources</h3>
            <ul className="space-y-4 text-slate-400">
              <li>
                <Link
                  to="/documentation"
                  className="inline-block transition-all duration-300 hover:translate-x-1 hover:text-[#FFB94A]"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="inline-block transition-all duration-300 hover:translate-x-1 hover:text-[#FFB94A]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="inline-block transition-all duration-300 hover:translate-x-1 hover:text-[#FFB94A]"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Column 4 - Quick Links */}
          <motion.div variants={itemVariants} className="flex flex-col items-center sm:items-start">
            <h3 className="mb-6 font-semibold text-white">Quick Links</h3>
            <ul className="space-y-4 text-slate-400">
              <li>
                <Link
                  to="/"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="group flex items-center transition-colors duration-300 hover:text-[#FFB94A]"
                >
                  Home
                  <ArrowRight className="ml-1 h-4 w-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="group flex items-center transition-colors duration-300 hover:text-[#FFB94A]"
                >
                  Login
                  <ArrowRight className="ml-1 h-4 w-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="group flex items-center transition-colors duration-300 hover:text-[#FFB94A]"
                >
                  Register
                  <ArrowRight className="ml-1 h-4 w-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div variants={itemVariants} className="mt-20 flex flex-col items-center border-t border-white/10 pt-16 text-center">
          <h3 className="mb-6 text-xl sm:text-2xl font-bold">
            Ready to start collaborating?
          </h3>
          <Link
            to="/register"
            className="group inline-flex justify-center w-full sm:w-auto items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-[#04142C] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:text-[#FFB94A] hover:shadow-[0_0_40px_rgba(255,185,74,0.3)]"
          >
            Create your first room
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* COPYRIGHT */}
        <motion.div variants={itemVariants} className="mt-16 text-center text-slate-500">
          <p>
            © 2026 Collab<span className="text-[#FFB94A]">Board</span>.
          </p>
          <p className="mt-2 text-sm">
            Built with React, Node.js, Express, MongoDB, Socket.IO and Tailwind
            CSS.
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}

export default Footer;