import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionTemplate, useMotionValue, useAnimate, stagger, AnimatePresence } from 'framer-motion';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [scope, animate] = useAnimate();
  const [particleScope] = useAnimate();
  const [glitchActive, setGlitchActive] = useState(false);

  const handleMouseMove = ({ clientX, clientY, currentTarget }) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };
  useEffect(() => {
    const enterAnimation = async () => {
      await animate(scope.current, { opacity: [0, 1] }, { duration: 0.5 });
      
      animate(
        ".card-element",
        { y: [30, 0], opacity: [0, 1] },
        { delay: stagger(0.1), duration: 0.8, ease: [0.16, 1, 0.3, 1] }
      );
      
      animate(
        ".floating-particle",
        {
          y: [0, (Math.random() - 0.5) * 100],
          x: [0, (Math.random() - 0.5) * 100],
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        },
        { 
          delay: stagger(0.05, { from: "last" }),
          duration: Math.random() * 10 + 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear"
        }
      );
      
      animate(
        ".gradient-bg",
        {
          background: [
            'radial-gradient(circle at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
            'radial-gradient(circle at center, rgba(37,99,235,0.15) 0%, transparent 70%)',
            'radial-gradient(circle at center, rgba(96,165,250,0.15) 0%, transparent 70%)',
            'radial-gradient(circle at center, rgba(147,197,253,0.15) 0%, transparent 70%)',
            'radial-gradient(circle at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
          ]
        },
        { duration: 20, repeat: Infinity, ease: "linear" }
      );

      // Holographic effect
      animate(
        ".holographic",
        {
          backgroundPosition: ["0% 0%", "100% 100%"],
        },
        { duration: 4, repeat: Infinity, ease: "linear" }
      );
    };

    enterAnimation();

    // Periodic glitch effect
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 8000);

    return () => clearInterval(glitchInterval);
  }, []);
  return (
    <>
      {/* Futuristic CSS Styles */}
      <style>{`
        @keyframes digitalRain {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes holographic {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }
        
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          10% { transform: translate(-2px, 2px); }
          20% { transform: translate(-1px, -1px); }
          30% { transform: translate(1px, 2px); }
          40% { transform: translate(-1px, -1px); }
          50% { transform: translate(-2px, 2px); }
          60% { transform: translate(-1px, 1px); }
          70% { transform: translate(1px, 1px); }
          80% { transform: translate(-1px, -1px); }
          90% { transform: translate(1px, 2px); }
        }
        
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes neonGlow {
          0%, 100% { 
            text-shadow: 
              0 0 5px rgba(59,130,246,0.5),
              0 0 10px rgba(59,130,246,0.5),
              0 0 15px rgba(59,130,246,0.5),
              0 0 20px rgba(59,130,246,0.3);
          }
          50% { 
            text-shadow: 
              0 0 10px rgba(59,130,246,0.8),
              0 0 20px rgba(59,130,246,0.8),
              0 0 30px rgba(59,130,246,0.8),
              0 0 40px rgba(59,130,246,0.5);
          }
        }
        
        .digital-rain {
          animation: digitalRain 3s linear infinite;
        }
        
        .holographic {
          background: linear-gradient(45deg, 
            rgba(59,130,246,0.1) 0%, 
            rgba(147,197,253,0.2) 25%, 
            rgba(59,130,246,0.1) 50%, 
            rgba(147,197,253,0.2) 75%, 
            rgba(59,130,246,0.1) 100%);
          background-size: 200% 200%;
          animation: holographic 4s ease-in-out infinite;
        }
        
        .glitch-effect {
          animation: glitch 0.2s ease-in-out;
        }
        
        .scan-line {
          animation: scanLine 2s linear infinite;
        }
        
        .neon-text {
          animation: neonGlow 2s ease-in-out infinite alternate;
        }
        
        .glass-morphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .cyber-border {
          border: 2px solid transparent;
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(45deg, rgba(59,130,246,0.5), rgba(147,197,253,0.5)) border-box;
        }
      `}</style>

      <div 
        ref={scope}
        className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"
        onMouseMove={handleMouseMove}
      >
        {/* Animated background layers */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Digital Matrix Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-40" />
          
          {/* Holographic Background */}
          <motion.div 
            className="gradient-bg holographic absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 2 }}
          />
          
          {/* Scan Lines */}
          <div className="absolute inset-0">
            <div className="scan-line absolute w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60" />
          </div>
          
          {/* Digital Rain Elements */}
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="digital-rain absolute w-1 h-20 bg-gradient-to-b from-blue-400 to-transparent opacity-70"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
          
          {/* Animated grid lines */}
          <motion.div 
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ delay: 0.5, duration: 1.5 }}
          >
            {[...Array(20)].map((_, i) => (
              <React.Fragment key={i}>
                <motion.div
                  className="absolute top-0 bottom-0 border-l border-blue-300/20"
                  style={{ left: `${i * 5}%` }}
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ delay: 0.2 + i * 0.02, duration: 1 }}
                />
                <motion.div
                  className="absolute left-0 right-0 border-t border-blue-300/20"
                  style={{ top: `${i * 5}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.2 + i * 0.02, duration: 1 }}
                />
              </React.Fragment>
            ))}
          </motion.div>
        </div>        {/* Main card with dynamic gradient */}
        <motion.div
          className={`relative z-10 w-full max-w-md rounded-2xl glass-morphism cyber-border p-1 shadow-2xl card-element ${glitchActive ? 'glitch-effect' : ''}`}
          style={{
            backgroundImage: useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, rgba(59,130,246,0.3), transparent 80%)`,
          }}
        >
          <div className="rounded-[15px] bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-xl border border-blue-200/30">
            {/* Futuristic Security Icon */}
            <motion.div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 card-element relative"
              initial={{ scale: 0.5, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
            >
              {/* Rotating Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-400/40"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-2 rounded-full border border-cyan-400/60"
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />
              
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-400 relative z-10"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <motion.path 
                  d="M9 12l2 2 4-4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                />
              </motion.svg>
            </motion.div>

            {/* Enhanced Title */}
            <motion.h1 
              className="mb-3 text-center text-3xl font-bold tracking-tight text-white card-element neon-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.span 
                className="text-blue-500"
                style={{ backgroundSize: "200% 200%" }}
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                ACCESS DENIED
              </motion.span>
            </motion.h1>

            {/* Futuristic Subtitle */}
            <motion.div
              className="mb-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-xs font-mono text-blue-300/80 tracking-wider mb-1">
                SECURITY PROTOCOL INITIATED
              </div>
              <div className="text-xs font-mono text-cyan-400/60">
                ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </div>
            </motion.div>

            {/* Enhanced Description */}
            <motion.p 
              className="mb-8 text-center text-blue-100/80 card-element text-sm leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <AnimatedText text="Your current credentials don't provide access to this resource. Please verify your permissions or contact your system administrator." />
            </motion.p>

            {/* Futuristic Action Buttons */}
            <div className="flex flex-col space-y-3">
              <motion.button
                className="group flex w-full items-center justify-center gap-3 rounded-lg border border-blue-400/30 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-4 py-3 text-sm font-medium text-blue-300 transition-all hover:border-blue-300/50 hover:from-blue-500/20 hover:to-cyan-500/20 card-element relative overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ 
                  y: -2,
                  scale: 1.02
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(-1)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-400/20 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative z-10"
                  animate={{ x: [-3, 0] }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </motion.svg>
                <span className="relative z-10">RETURN TO PREVIOUS</span>
              </motion.button>

              <motion.button
                className="group flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-medium text-white transition-all hover:from-blue-700 hover:to-cyan-700 card-element relative overflow-hidden shadow-lg shadow-blue-500/25"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ 
                  y: -2,
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(59,130,246,0.4)"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative z-10"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </motion.svg>
                <span className="relative z-10">ENTER DASHBOARD</span>
              </motion.button>
            </div>

            {/* Enhanced Support Link */}
            <motion.div 
              className="mt-6 text-center card-element"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <a
                href="mailto:support@company.com"
                className="relative text-xs text-blue-300/60 hover:text-cyan-300 transition-colors font-mono"
              >
                <span>[SUPPORT_PROTOCOL_ACTIVE]</span>
                <motion.span 
                  className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-blue-400 to-cyan-400"
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Floating Particles */}
        <div ref={particleScope} className="absolute inset-0 overflow-hidden">
          {[...Array(60)].map((_, i) => (
            <motion.div
              key={i}
              className="floating-particle absolute rounded-full"
              style={{
                background: `radial-gradient(circle, ${i % 3 === 0 ? 'rgba(59,130,246,0.6)' : i % 3 === 1 ? 'rgba(147,197,253,0.4)' : 'rgba(96,165,250,0.5)'}, transparent)`,
              }}
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}
        </div>

        {/* Enhanced Connection Lines */}
        <svg className="absolute inset-0 pointer-events-none">
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(59,130,246,0)" />
              <stop offset="50%" stopColor="rgba(59,130,246,0.3)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0)" />
            </linearGradient>
            <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(147,197,253,0)" />
              <stop offset="50%" stopColor="rgba(147,197,253,0.4)" />
              <stop offset="100%" stopColor="rgba(147,197,253,0)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M100,100 C200,200 300,0 400,100"
            stroke="url(#lineGradient1)"
            strokeWidth="2"
            fill="transparent"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 1 }}
          />
          <motion.path
            d="M80% 30% Q90% 20% 100% 30%"
            stroke="url(#lineGradient2)"
            strokeWidth="1.5"
            fill="transparent"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 1.2 }}
          />
        </svg>
      </div>
    </>
  );
};

// Component for animating text character by character with futuristic effects
const AnimatedText = ({ text }) => {
  const letters = Array.from(text);
  
  return (
    <span className="relative">
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="relative inline-block"
          initial={{ opacity: 0, y: 20, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ 
            duration: 0.1, 
            delay: index * 0.02 + 0.4,
            type: "spring",
            stiffness: 100
          }}
          whileHover={{
            scale: 1.1,
            color: "#60a5fa",
            textShadow: "0 0 8px rgba(96,165,250,0.5)"
          }}
        >
          {letter === " " ? "\u00A0" : letter}
          <motion.span
            className="absolute inset-0 bg-gradient-to-t from-blue-400/20 to-transparent"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.02 + 0.6,
              ease: "easeInOut"
            }}
          />
        </motion.span>
      ))}
    </span>
  );
};

export default UnauthorizedPage;