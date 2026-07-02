import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { HeroScene, FeatureIcon3D } from "../components/ThreeScenes";
import { Terminal, Users, Code, Award, Sparkles, MessageSquare, ArrowRight, Github, Heart } from "lucide-react";
import api from "../api";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import gsap from "gsap";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 48, totalPosts: 124, totalComments: 312 });
  const [emailInput, setEmailInput] = useState("");
  
  const problemRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch live statistics
    api.get("/stats")
      .then((res) => {
        if (res.data) setStats(res.data);
      })
      .catch((err) => console.log("Stats check error on landing:", err));

    // GSAP ScrollTrigger-like smooth section fades (Scroll-triggered cinematic feel)
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".problem-text",
        { opacity: 0.1, y: 50 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.3,
          scrollTrigger: {
            trigger: ".problem-section",
            start: "top 70%",
            end: "bottom 30%",
            scrub: true,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] text-[#f8fafc] overflow-x-hidden pt-16">
      
      {/* ==========================================
          1. HERO SECTION (Cinematic Video + R3F Particles)
         ========================================== */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden px-6 md:px-10 pt-28 pb-16 md:pt-36 md:pb-24">
        {/* Fullscreen Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-black">
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-35 select-none pointer-events-none"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source src="https://res.cloudinary.com/dez4d38r2/video/upload/f_mp4,vc_h264/v1777271188/buff_rhfzsl.mp4" type="video/mp4" />
            <source src="https://res.cloudinary.com/dez4d38r2/video/upload/v1777271188/buff_rhfzsl.mov" type="video/quicktime" />
          </video>
          {/* Subtle dark black gradient and overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/85 pointer-events-none" />
          <div className="absolute inset-0 bg-black/35 pointer-events-none" />
        </div>

        {/* Floating Red & White Three.js Particle Network on top of the background video */}
        <HeroScene />

        {/* Hero content aligned toward the bottom/center of the viewport with generous spacing and strong typography */}
        <div className="relative z-10 max-w-7xl w-full mx-auto text-left space-y-8 my-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono tracking-wider uppercase mb-2"
          >
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <span>v2.0: NOW CONNECTING 42K+ DEVS</span>
          </motion.div>

          <div className="space-y-4">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-xs md:text-sm font-semibold tracking-widest text-red-400 uppercase font-mono"
            >
              Built for focused builders
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-serif font-normal leading-[0.92] tracking-[-0.08em] text-white"
            >
              Where code <br />
              finds its <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-300 to-white">Community.</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="max-w-2xl text-sm sm:text-base md:text-lg text-white/70 leading-relaxed font-sans"
          >
            We help engineering builders showcase their stack, refine their systems, and escape codebase isolation with high-leverage community collaboration, real-time code feeds, and interactive thread modules.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
          >
            <Link
              to={isAuthenticated ? "/feed" : "/register"}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl shadow-xl shadow-red-600/20 hover:scale-[1.03] transition-all text-sm flex items-center justify-center space-x-2 clickable"
            >
              <span>{isAuthenticated ? "Enter Developer Feed" : "Build Your Stack Card"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/feed"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl backdrop-blur-md hover:bg-white/10 transition-all text-sm flex items-center justify-center clickable"
            >
              Explore Feed
            </Link>
          </motion.div>
        </div>

        {/* Transition Shadow */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
      </section>


      {/* ==========================================
          2. THE PROBLEM SECTION (Pinned Red vs White Storytelling)
         ========================================== */}
      <section className="problem-section relative min-h-screen flex items-center justify-center py-20 px-4 bg-grid">
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0a0a0f] to-[#0a0a0f]" />

        {/* Absolute Red vs White background scrolling effect */}
        <div className="absolute inset-0 opacity-10 flex flex-col justify-around pointer-events-none text-xs font-mono text-red-500 overflow-hidden leading-relaxed px-10 select-none">
          <div className="animate-[pulse_4s_infinite] whitespace-nowrap">{"[ISOLATION ALERT]: Nodes disconnected. Developers writing solo. Compiling isolated environments..."}</div>
          <div className="animate-[pulse_5s_infinite_1s] whitespace-nowrap">{"const codeSilo = new Developer({ isolation: true, community: null, status: 'isolated' });"}</div>
          <div className="animate-[pulse_6s_infinite_2s] whitespace-nowrap">{"export default function Standalone() { return <div>Connecting to mesh...</div>; }"}</div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
          <span className="text-sm font-bold text-red-400 font-mono tracking-widest uppercase">The Developer Paradox</span>
          <div className="space-y-16">
            <h3 className="problem-text text-3xl sm:text-5xl font-serif font-normal tracking-tight max-w-3xl mx-auto leading-snug text-white">
              "Developers construct the hyper-connected world... yet we design, build, and deploy in complete isolation."
            </h3>
            <p className="problem-text text-white/70 max-w-xl mx-auto text-sm sm:text-base leading-relaxed font-sans">
              Toggling between generic feeds, static portfolios, and scattered messaging channels produces constant context switching. Your professional network remains fragmented. Finding engineers sharing your exact stack shouldn't feel like compiling in the dark.
            </p>
          </div>
        </div>
      </section>


      {/* ==========================================
          3. THE SOLUTION SECTION (R3F Icon Feature reveals)
         ========================================== */}
      <section className="py-24 px-4 max-w-6xl mx-auto relative">
        <div className="text-center space-y-4 mb-20">
          <span className="text-red-400 text-xs font-mono uppercase tracking-widest">Architectural Blueprint</span>
          <h2 className="text-4xl sm:text-5xl font-serif font-normal text-white">Engineered for Devs</h2>
          <p className="text-white/70 max-w-md mx-auto text-sm font-sans">Four high-fidelity modules seamlessly integrated to enhance your dev-life cycle.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Feature Card 1 */}
          <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5 flex flex-col sm:flex-row gap-6 items-start text-left relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all" />
            <FeatureIcon3D shapeType="octahedron" />
            <div className="space-y-2 flex-1">
              <span className="text-xs font-mono text-red-400">MODULE 01</span>
              <h3 className="text-xl font-serif font-normal text-white">Interactive Tech Profiles</h3>
              <p className="text-xs text-white/60 leading-relaxed font-sans">
                Render your dev cards with visual tech-stack tags, Github linkages, and real-time follower/following network nodes.
              </p>
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5 flex flex-col sm:flex-row gap-6 items-start text-left relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all" />
            <FeatureIcon3D shapeType="torus" />
            <div className="space-y-2 flex-1">
              <span className="text-xs font-mono text-red-400">MODULE 02</span>
              <h3 className="text-xl font-serif font-normal text-white">High-Engaging Feeds</h3>
              <p className="text-xs text-white/60 leading-relaxed font-sans">
                Filter feed views dynamically by Tag chips, Trending weights, or your direct connection networks. Rich-text markdown supported out of the box.
              </p>
            </div>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5 flex flex-col sm:flex-row gap-6 items-start text-left relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all" />
            <FeatureIcon3D shapeType="cone" />
            <div className="space-y-2 flex-1">
              <span className="text-xs font-mono text-red-400">MODULE 03</span>
              <h3 className="text-xl font-serif font-normal text-white">Recursive Nested Threads</h3>
              <p className="text-xs text-white/60 leading-relaxed font-sans">
                Participate in recursive nested comment trees rendering infinitely, letting conversations fork cleanly into code solutions.
              </p>
            </div>
          </div>

          {/* Feature Card 4 */}
          <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5 flex flex-col sm:flex-row gap-6 items-start text-left relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all" />
            <FeatureIcon3D shapeType="box" />
            <div className="space-y-2 flex-1">
              <span className="text-xs font-mono text-red-400">MODULE 04</span>
              <h3 className="text-xl font-serif font-normal text-white">Matrix Discovery Matching</h3>
              <p className="text-xs text-white/60 leading-relaxed font-sans">
                Let our Discovery matrix automatically match suggestions based on stack affinities, common technology repositories, and follow weights.
              </p>
            </div>
          </div>

        </div>
      </section>


      {/* ==========================================
          4. LIVE STATS SECTION (Dynamic counters)
         ========================================== */}
      <section className="py-20 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center space-y-2">
              <Users className="w-8 h-8 text-red-400 mx-auto opacity-85" />
              <p className="text-4xl font-normal font-serif text-white">{stats.totalUsers}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Developers Joined</p>
            </div>
            <div className="text-center space-y-2">
              <Code className="w-8 h-8 text-red-400 mx-auto opacity-85" />
              <p className="text-4xl font-normal font-serif text-white">{stats.totalPosts}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Knowledge Posts Shared</p>
            </div>
            <div className="text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-red-400 mx-auto opacity-85" />
              <p className="text-4xl font-normal font-serif text-white">{stats.totalComments}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Thread Responses Saved</p>
            </div>
          </div>
        </div>
      </section>


      {/* ==========================================
          5. SHOWCASE / MARQUEE TESTIMONIALS
         ========================================== */}
      <section className="py-24 px-4 max-w-6xl mx-auto text-center overflow-hidden">
        <div className="space-y-4 mb-16">
          <span className="text-red-400 text-xs font-mono uppercase tracking-widest">Developer Voices</span>
          <h2 className="text-4xl sm:text-5xl font-serif font-normal text-white">Trusted by Builders</h2>
        </div>

        {/* Endless rolling layout container */}
        <div className="relative flex w-full overflow-x-hidden py-4">
          <div className="animate-[marquee_30s_linear_infinite] flex whitespace-nowrap gap-6 shrink-0">
            {[
              { name: "Alex Rivera", handle: "arivera_dev", role: "R&D Lead", text: "Finally, a network designed around core stack tagging instead of clickbait algorithms!" },
              { name: "Samantha Lin", handle: "samcoder", role: "Vite Core Contributor", text: "The recursive nested replies render cleanly. Perfect platform to discuss actual technical setups." },
              { name: "Devon Patel", handle: "devonp", role: "Three.js Guru", text: "Stunning aesthetic! This glassmorphic UI looks and performs like Linear or Stripe." },
              { name: "Elena Rostova", handle: "elena_r", role: "Cloud Architect", text: "The discovery matching matched me with 3 engineers in my city sharing React & Rust stacks!" }
            ].map((test, idx) => (
              <div key={idx} className="w-[300px] bg-white/[0.02] rounded-2xl p-6 border border-white/5 hover:border-red-500/20 transition-all duration-300 whitespace-normal text-left">
                <p className="text-xs text-white/70 italic mb-4">"{test.text}"</p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-red-500 to-rose-600 rounded-full flex items-center justify-center font-serif font-normal text-white text-xs">
                    {test.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{test.name}</h4>
                    <p className="text-[10px] text-white/40">@{test.handle} · {test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Duplicate for seamless infinite scrolling */}
          <div className="animate-[marquee_30s_linear_infinite] flex whitespace-nowrap gap-6 shrink-0" aria-hidden="true">
            {[
              { name: "Alex Rivera", handle: "arivera_dev", role: "R&D Lead", text: "Finally, a network designed around core stack tagging instead of clickbait algorithms!" },
              { name: "Samantha Lin", handle: "samcoder", role: "Vite Core Contributor", text: "The recursive nested replies render cleanly. Perfect platform to discuss actual technical setups." },
              { name: "Devon Patel", handle: "devonp", role: "Three.js Guru", text: "Stunning aesthetic! This glassmorphic UI looks and performs like Linear or Stripe." },
              { name: "Elena Rostova", handle: "elena_r", role: "Cloud Architect", text: "The discovery matching matched me with 3 engineers in my city sharing React & Rust stacks!" }
            ].map((test, idx) => (
              <div key={idx + 4} className="w-[300px] bg-white/[0.02] rounded-2xl p-6 border border-white/5 hover:border-red-500/20 transition-all duration-300 whitespace-normal text-left">
                <p className="text-xs text-white/70 italic mb-4">"{test.text}"</p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-red-500 to-rose-600 rounded-full flex items-center justify-center font-serif font-normal text-white text-xs">
                    {test.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{test.name}</h4>
                    <p className="text-[10px] text-white/40">@{test.handle} · {test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ==========================================
          6. FINAL CTA & FOOTER
         ========================================== */}
      <section className="relative py-28 px-4 overflow-hidden border-t border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[160px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl font-serif font-normal leading-tight text-white">
            Ready to Escape Code Silos?
          </h2>
          <p className="text-white/70 max-w-md mx-auto text-sm sm:text-base leading-relaxed font-sans">
            Configure your development tags, match tech stacks with thousands of engineers, and unlock collaborative innovation.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (emailInput.trim()) {
                window.location.href = `/register?email=${encodeURIComponent(emailInput.trim())}`;
              }
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Enter your email address"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:border-red-500 transition-all"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-semibold rounded-xl shrink-0 flex items-center justify-center space-x-1.5 transition-all clickable shadow-lg shadow-red-500/10"
            >
              <span>Initialize App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="max-w-6xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© 2026 DevConnect Inc. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>for engineers</span>
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
