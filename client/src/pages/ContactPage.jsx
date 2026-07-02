import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Mail, ExternalLink } from "lucide-react";

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

function ContactPage() {
  useEffect(() => {
    document.title = "Contact | CollabBoard";
  }, []);

  const contactMethods = [
    {
      title: "GitHub",
      description: "Check out my open-source projects and code repositories.",
      icon: GithubIcon,
      url: "https://github.com/vikkyrg",
      buttonText: "Open GitHub in new tab",
      target: "_blank"
    },
    {
      title: "LinkedIn",
      description: "Connect with me professionally to discuss opportunities.",
      icon: LinkedinIcon,
      url: "https://www.linkedin.com/in/vignesh-r-a634a2293/",
      buttonText: "Open LinkedIn in new tab",
      target: "_blank"
    },
    {
      title: "Email",
      description: "Send me a direct message and I'll get back to you.",
      icon: Mail,
      url: "mailto:rvikky05@gmail.com",
      buttonText: "Open email client",
      target: "_self"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F6F1]">
      <Navbar />
      
      <main className="flex-1 py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-white px-8 py-12 shadow-lg sm:px-12 md:py-20">
          
          <div className="mb-16 text-center">
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-[#04142C] md:text-5xl lg:text-6xl">
              Contact
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-slate-500">
              Get in touch or connect with me.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {contactMethods.map((method, index) => (
              <div 
                key={index} 
                className="group flex flex-col items-center rounded-[24px] border border-slate-100 bg-slate-50 p-10 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white hover:border-[#FFB94A]/30"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#04142C] text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                  <method.icon className="h-8 w-8" />
                </div>
                
                <h3 className="mb-3 text-2xl font-bold text-[#04142C]">
                  {method.title}
                </h3>
                
                <p className="mb-10 flex-1 text-base text-slate-500">
                  {method.description}
                </p>
                
                <a 
                  href={method.url} 
                  target={method.target} 
                  rel={method.target === "_blank" ? "noopener noreferrer" : ""}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#04142C] px-6 py-4 text-sm font-bold text-white shadow-md transition-all duration-300 group-hover:bg-[#FFB94A] group-hover:text-[#04142C] group-hover:scale-105"
                >
                  {method.buttonText}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ContactPage;
