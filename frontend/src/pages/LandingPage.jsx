import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import {
  Users,
  Heart,
  CheckCircle,
  FileText,
  Cpu,
  Calendar,
  LayoutDashboard,
  BarChart3,
  Quote,
  Network,
  MapPin,
  LineChart,
  BrainCircuit
} from 'lucide-react'

// --- ANTIGRAVITY COMPONENT ---
const FloatingElement = ({ children, delay = 0, yRange = [-15, 15], duration = 5, className = "", style = {} }) => {
  return (
    <motion.div
      animate={{ y: yRange }}
      transition={{ duration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay }}
      className={className}
      style={{ willChange: "transform", ...style }}
    >
      {children}
    </motion.div>
  )
}

// --- DEEP BOKEH AMBIENT BACKGROUND ---
const AmbientBackground = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(0,255,200,0.08), transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(0,200,255,0.06), transparent 40%),
          linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)
        `
      }}
    >
      {/* Subtle animated gradient overlay for slow movement */}
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-transparent"
      />
    </div>
  )
}

const ScrollReveal = ({ children, delay = 0, className="" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Premium floating glass panel
const GlassPanel = ({ children, className = "" }) => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      className={`group relative rounded-2xl bg-[#ffffff03] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-brand-500/30 hover:shadow-[0_16px_48px_rgba(20,184,166,0.1)] ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(20, 184, 166, 0.08),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

const LandingPage = () => {
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const smoothY = useSpring(scrollY, { stiffness: 60, damping: 20, restDelta: 0.001 })
  const heroOpacity = useTransform(smoothY, [0, 400], [1, 0])
  const heroScale = useTransform(smoothY, [0, 500], [1, 0.9])



  const steps = [
    { icon: FileText, title: 'NGO uploads data.', delay: 0 },
    { icon: Cpu, title: 'AI prioritizes needs.', delay: 0.2 },
    { icon: Calendar, title: 'Volunteers get matched.', delay: 0.4 },
  ]

  const features = [
    { icon: LayoutDashboard, title: 'Real-time Dashboard', desc: 'Track impact globally.' },
    { icon: BarChart3, title: 'AI Insights', desc: 'Data-driven optimization.' },
    { icon: MapPin, title: 'Volunteer Tracking', desc: 'Location-based proximity.' },
    { icon: Network, title: 'Resource Allocation', desc: 'Smart routing.' },
  ]


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-200">
      <AmbientBackground />
      
      {/* 2. DYNAMIC HERO SECTION */}
      <section id="home" className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden pt-20">
        
        {/* Core Hero Content on Massive Translucent Panel */}
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-10">
          <FloatingElement yRange={[-5, 5]} duration={4}>
            <div className="relative rounded-[2.5rem] bg-white/[0.02] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-10 md:p-16 text-center overflow-hidden">
              {/* Internal Glass Highlight */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              
              <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl">
                Together We <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">Save Lives</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                Sahayogam connects volunteers with real-world needs using smart technology.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                {/* Primary Button */}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/signup')} className="px-10 py-5 bg-brand-500 text-white font-semibold rounded-2xl shadow-[0_0_30px_rgba(20,184,166,0.4)] hover:shadow-[0_0_45px_rgba(20,184,166,0.6)] transition-all text-lg">
                  Join as Volunteer
                </motion.button>
                {/* Secondary Button */}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/login')} className="px-10 py-5 bg-transparent border-2 border-brand-500/50 text-white font-semibold rounded-2xl hover:bg-brand-500/10 backdrop-blur-md transition-all text-lg">
                  Request Help
                </motion.button>
              </div>
            </div>
          </FloatingElement>

          {/* Antigravity Decorative Cards Floating around Hero */}
          <div className="hidden lg:block">
             <FloatingElement delay={1.5} yRange={[-15, 25]} className="absolute -left-10 top-20">
               <div className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-lg flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                 <span className="text-sm text-gray-200">Live AI Routing</span>
               </div>
             </FloatingElement>
             <FloatingElement delay={0.5} yRange={[20, -20]} duration={5} className="absolute -right-5 bottom-10">
               <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex gap-3 shadow-2xl">
                 <Users className="text-brand-400" />
                 <div><p className="text-white font-bold text-lg">1.2K</p><p className="text-xs text-gray-400">Active Now</p></div>
               </div>
             </FloatingElement>
          </div>
        </motion.div>
      </section>



      {/* 5. PROCESS & FEATURES LAYERED BELOW */}
      <section id="how-it-works" className="py-24 relative scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          {/* Glowing Fiber Optic SVG Pipeline */}
          <div className="hidden md:block absolute left-1/2 top-[10%] bottom-[10%] w-32 -translate-x-1/2 pointer-events-none opacity-50 z-0">
            <svg viewBox="0 0 100 800" preserveAspectRatio="none" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 10px rgba(20,184,166,0.8))' }}>
              <path d="M50 0 C 10 200, 90 400, 50 600 C 10 700, 50 800, 50 800" fill="none" stroke="url(#glowGradient)" strokeWidth="3" strokeDasharray="10 5" className="animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
              <defs>
                <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(20,184,166,0)" />
                  <stop offset="50%" stopColor="rgba(20,184,166,1)" />
                  <stop offset="100%" stopColor="rgba(20,184,166,0)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <ScrollReveal className="text-center mb-24 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">How It Works</h2>
            <p className="text-gray-400 text-lg">A suspended, seamless process.</p>
          </ScrollReveal>

          <div className="space-y-12 md:space-y-24 relative z-10">
            {steps.map((step, index) => (
              <ScrollReveal delay={0.2} key={index}>
                <FloatingElement delay={index} yRange={[-8, 8]} className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="w-full md:w-1/2 flex justify-center">
                    {/* Abstracted Glass Module */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-white/[0.03] border border-white/20 backdrop-blur-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
                      <div className="absolute inset-0 bg-brand-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                      <step.icon className="w-12 h-12 text-brand-400 relative z-10" />
                    </div>
                  </div>
                  <div className={`w-full md:w-1/2 text-center ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                    <h3 className="text-3xl font-bold text-white tracking-wide">{step.title}</h3>
                  </div>
                </FloatingElement>
              </ScrollReveal>
            ))}

            {/* Insights Dashboard Flow Target */}
            <ScrollReveal delay={0.6} className="mt-20 flex justify-center relative z-20">
              <FloatingElement delay={1} yRange={[-5, 5]} duration={4}>
                 <GlassPanel className="p-6 md:p-8 flex items-center gap-6 max-w-lg shadow-[0_20px_50px_rgba(20,184,166,0.15)] border-brand-500/20 group">
                    <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center border border-brand-400/30">
                       <LineChart className="w-8 h-8 text-brand-400 drop-shadow-[0_0_10px_rgba(20,184,166,0.8)] group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-white mb-1">Insights</h3>
                       <p className="text-gray-400 text-sm">Real-time resource and impact tracking.</p>
                    </div>
                 </GlassPanel>
              </FloatingElement>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Floating Features Tiles */}
      <section id="features" className="py-24 relative scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {features.map((item, i) => (
               <FloatingElement key={i} delay={i * 0.4} yRange={[-15, 15]} duration={4.5}>
                 <GlassPanel className="aspect-square rounded-[3rem] p-6 flex flex-col justify-center items-center text-center shadow-[inset_0_0_20px_rgba(20,184,166,0.1)]">
                    <item.icon className="w-12 h-12 text-brand-400 mb-4 opacity-90 filter drop-shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                    <h4 className="text-lg font-bold text-white mb-2 leading-tight">{item.title}</h4>
                    <p className="text-sm text-gray-400 px-2">{item.desc}</p>
                 </GlassPanel>
               </FloatingElement>
             ))}
           </div>
        </div>
      </section>

      <footer id="contact" className="bg-[#030304] border-t border-white/5 relative z-10 px-6 pt-16 pb-0 flex flex-col mt-24">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16 px-4">
          
          {/* Column 1: Branding */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 flex items-center justify-center rounded-full group-hover:scale-110 transition-all duration-500">
                <img src="/logo.png" alt="Sahayogam Logo" className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(45,212,191,0.6)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-widest font-sans uppercase">Sahayogam</span>
                <span className="text-[10px] font-medium -mt-1 text-[#2dd4bf] tracking-[0.2em]">सहयोगम्</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs font-medium">
              AI-powered trust intelligence for community support. Built for privacy-first volunteer matching.
            </p>
          </div>

          {/* Column 2: PRODUCT (Static Text) */}
          <div>
            <h4 className="text-[#2dd4bf] font-bold text-sm tracking-[0.15em] uppercase mb-6">Product</h4>
            <ul className="flex flex-col gap-4">
              {['Dashboard', 'Smart Match', 'Real-time Tracker', 'Get Started'].map((item) => (
                <li key={item}>
                  <span className="text-gray-400 hover:text-[#2dd4bf] transition-colors duration-300 text-sm font-medium cursor-default">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: RESOURCES (Static Text) */}
          <div id="resources" className="scroll-mt-24">
            <h4 className="text-[#2dd4bf] font-bold text-sm tracking-[0.15em] uppercase mb-6">Resources</h4>
            <ul className="flex flex-col gap-4">
              {['Partner NGOs', 'Impact Report', 'Community Guidelines', 'API Docs'].map((item) => (
                <li key={item}>
                  <span className="text-gray-400 hover:text-[#2dd4bf] transition-colors duration-300 text-sm font-medium cursor-default">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: LEGAL (Active Links) */}
          <div>
            <h4 className="text-[#2dd4bf] font-bold text-sm tracking-[0.15em] uppercase mb-6">Legal</h4>
            <ul className="flex flex-col gap-4">
              {['Terms & Conditions', 'Privacy Policy', 'Cookie Policy'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 text-sm font-medium border-b border-transparent hover:border-[#2dd4bf]/30 pb-1">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Copyright Section with Zero Bottom Spacing */}
        <div className="w-full border-t border-white/5 bg-[#010101]/50">
          <div className="max-w-7xl mx-auto text-center text-[10px] text-gray-500 tracking-[0.3em] uppercase py-6 font-semibold">
            <p>© 2026 Sahayogam. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
