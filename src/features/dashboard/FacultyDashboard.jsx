import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserDetails from '../../components/UserDetails';
import RequestPage from '../requests/RequestPage';
import MyRequestsPage from '../requests/MyRequestsPage';
import CreateRequestForm from '../requests/CreateRequestForm';
import { useNavigate } from 'react-router-dom';
// Medical Icons from React Icons
import { 
  FaUserMd, 
  FaFlask, 
  FaMicroscope, 
  FaHeartbeat, 
  FaVial, 
  FaStethoscope, 
  FaPills, 
  FaSyringe, 
  FaThermometerHalf, 
  FaBandAid, 
  FaDna, 
  FaWeight,
  FaLungs,
  FaTooth
} from 'react-icons/fa';
import { 
  MdLocalHospital, 
  MdScience, 
  MdBiotech,
  MdMedicalServices 
} from 'react-icons/md';
import { 
  GiMedicines, 
  GiChemicalDrop 
} from 'react-icons/gi';

// Floating Bubbles Component
const FloatingBubbles = () => {
  const bubbles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 20, // 20-80px
    left: Math.random() * 100, // 0-100%
    delay: Math.random() * 20, // 0-20s
    duration: Math.random() * 10 + 15, // 15-25s
    opacity: Math.random() * 0.3 + 0.1, // 0.1-0.4
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full bg-gradient-to-br from-blue-200/30 to-blue-400/20 backdrop-blur-sm"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            bottom: '-100px',
            opacity: bubble.opacity,
            animation: `floatUp ${bubble.duration}s linear infinite`,
            animationDelay: `${bubble.delay}s`,
            boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.2), 0 0 20px rgba(59, 130, 246, 0.1)',
          }}
        />
      ))}
    </div>
  );
};

// Floating Medical Icons Component
const FloatingMedicalIcons = () => {
  const medicalIcons = [
    // === TOP ROW - FULL WIDTH COVERAGE ===
    { 
      icon: <FaUserMd className="w-12 h-12" />,
      delay: '0s',
      duration: '8s',
      position: { top: '2%', left: '3%' }
    },
    {
      icon: <FaFlask className="w-11 h-11" />,
      delay: '1s',
      duration: '10s',
      position: { top: '4%', left: '12%' }
    },
    {
      icon: <FaVial className="w-10 h-10" />,
      delay: '2s',
      duration: '9s',
      position: { top: '6%', left: '21%' }
    },
    {
      icon: <FaHeartbeat className="w-12 h-12" />,
      delay: '3s',
      duration: '11s',
      position: { top: '3%', left: '30%' }
    },
    {
      icon: <FaStethoscope className="w-13 h-13" />,
      delay: '4s',
      duration: '8s',
      position: { top: '7%', left: '39%' }
    },
    {
      icon: <FaMicroscope className="w-14 h-14" />,
      delay: '5s',
      duration: '12s',
      position: { top: '2%', left: '48%' }
    },
    {
      icon: <FaPills className="w-11 h-11" />,
      delay: '6s',
      duration: '9s',
      position: { top: '5%', left: '57%' }
    },
    {
      icon: <FaSyringe className="w-12 h-12" />,
      delay: '7s',
      duration: '10s',
      position: { top: '8%', left: '66%' }
    },
    {
      icon: <MdLocalHospital className="w-11 h-11" />,
      delay: '8s',
      duration: '11s',
      position: { top: '3%', left: '75%' }
    },
    {
      icon: <FaWeight className="w-10 h-10" />,
      delay: '9s',
      duration: '8s',
      position: { top: '6%', left: '84%' }
    },
    {
      icon: <MdScience className="w-12 h-12" />,
      delay: '10s',
      duration: '9s',
      position: { top: '4%', right: '2%' }
    },

    // === UPPER MIDDLE ROW ===
    {
      icon: <GiChemicalDrop className="w-10 h-10" />,
      delay: '11s',
      duration: '10s',
      position: { top: '18%', left: '5%' }
    },
    {
      icon: <FaLungs className="w-11 h-11" />,
      delay: '12s',
      duration: '11s',
      position: { top: '20%', left: '15%' }
    },
    {
      icon: <FaTooth className="w-9 h-9" />,
      delay: '13s',
      duration: '8s',
      position: { top: '22%', left: '25%' }
    },
    {
      icon: <FaThermometerHalf className="w-10 h-10" />,
      delay: '14s',
      duration: '9s',
      position: { top: '19%', left: '35%' }
    },
    {
      icon: <FaBandAid className="w-12 h-12" />,
      delay: '15s',
      duration: '10s',
      position: { top: '23%', left: '45%' }
    },
    {
      icon: <FaDna className="w-11 h-11" />,
      delay: '16s',
      duration: '11s',
      position: { top: '18%', left: '55%' }
    },
    {
      icon: <MdBiotech className="w-13 h-13" />,
      delay: '17s',
      duration: '8s',
      position: { top: '21%', left: '65%' }
    },
    {
      icon: <MdMedicalServices className="w-12 h-12" />,
      delay: '18s',
      duration: '9s',
      position: { top: '24%', left: '75%' }
    },
    {
      icon: <FaUserMd className="w-10 h-10" />,
      delay: '19s',
      duration: '10s',
      position: { top: '20%', left: '85%' }
    },
    {
      icon: <FaFlask className="w-11 h-11" />,
      delay: '20s',
      duration: '11s',
      position: { top: '22%', right: '3%' }
    },

    // === CENTER ROW ===
    {
      icon: <FaVial className="w-12 h-12" />,
      delay: '21s',
      duration: '8s',
      position: { top: '38%', left: '2%' }
    },
    {
      icon: <FaHeartbeat className="w-11 h-11" />,
      delay: '22s',
      duration: '9s',
      position: { top: '35%', left: '12%' }
    },
    {
      icon: <FaStethoscope className="w-13 h-13" />,
      delay: '23s',
      duration: '10s',
      position: { top: '42%', left: '22%' }
    },
    {
      icon: <FaMicroscope className="w-12 h-12" />,
      delay: '24s',
      duration: '11s',
      position: { top: '36%', left: '32%' }
    },
    {
      icon: <FaPills className="w-10 h-10" />,
      delay: '25s',
      duration: '8s',
      position: { top: '44%', left: '42%' }
    },
    {
      icon: <FaSyringe className="w-11 h-11" />,
      delay: '26s',
      duration: '9s',
      position: { top: '38%', left: '52%' }
    },
    {
      icon: <MdLocalHospital className="w-12 h-12" />,
      delay: '27s',
      duration: '10s',
      position: { top: '41%', left: '62%' }
    },
    {
      icon: <FaWeight className="w-10 h-10" />,
      delay: '28s',
      duration: '11s',
      position: { top: '37%', left: '72%' }
    },
    {
      icon: <MdScience className="w-11 h-11" />,
      delay: '29s',
      duration: '8s',
      position: { top: '43%', left: '82%' }
    },
    {
      icon: <GiChemicalDrop className="w-9 h-9" />,
      delay: '30s',
      duration: '9s',
      position: { top: '39%', right: '2%' }
    },

    // === LOWER MIDDLE ROW ===
    {
      icon: <FaLungs className="w-12 h-12" />,
      delay: '31s',
      duration: '10s',
      position: { top: '58%', left: '4%' }
    },
    {
      icon: <FaTooth className="w-10 h-10" />,
      delay: '32s',
      duration: '11s',
      position: { top: '62%', left: '14%' }
    },
    {
      icon: <FaThermometerHalf className="w-11 h-11" />,
      delay: '33s',
      duration: '8s',
      position: { top: '56%', left: '24%' }
    },
    {
      icon: <FaBandAid className="w-12 h-12" />,
      delay: '34s',
      duration: '9s',
      position: { top: '64%', left: '34%' }
    },
    {
      icon: <FaDna className="w-10 h-10" />,
      delay: '35s',
      duration: '10s',
      position: { top: '58%', left: '44%' }
    },
    {
      icon: <MdBiotech className="w-11 h-11" />,
      delay: '36s',
      duration: '11s',
      position: { top: '61%', left: '54%' }
    },
    {
      icon: <MdMedicalServices className="w-12 h-12" />,
      delay: '37s',
      duration: '8s',
      position: { top: '59%', left: '64%' }
    },
    {
      icon: <FaUserMd className="w-11 h-11" />,
      delay: '38s',
      duration: '9s',
      position: { top: '63%', left: '74%' }
    },
    {
      icon: <FaFlask className="w-10 h-10" />,
      delay: '39s',
      duration: '10s',
      position: { top: '57%', left: '84%' }
    },
    {
      icon: <FaVial className="w-11 h-11" />,
      delay: '40s',
      duration: '11s',
      position: { top: '60%', right: '3%' }
    },

    // === BOTTOM ROW - FULL WIDTH COVERAGE ===
    {
      icon: <FaHeartbeat className="w-12 h-12" />,
      delay: '41s',
      duration: '8s',
      position: { top: '78%', left: '2%' }
    },
    {
      icon: <FaStethoscope className="w-11 h-11" />,
      delay: '42s',
      duration: '9s',
      position: { top: '82%', left: '10%' }
    },
    {
      icon: <FaMicroscope className="w-13 h-13" />,
      delay: '43s',
      duration: '10s',
      position: { top: '76%', left: '18%' }
    },
    {
      icon: <FaPills className="w-10 h-10" />,
      delay: '44s',
      duration: '11s',
      position: { top: '84%', left: '26%' }
    },
    {
      icon: <FaSyringe className="w-12 h-12" />,
      delay: '45s',
      duration: '8s',
      position: { top: '80%', left: '34%' }
    },
    {
      icon: <MdLocalHospital className="w-11 h-11" />,
      delay: '46s',
      duration: '9s',
      position: { top: '78%', left: '42%' }
    },
    {
      icon: <FaWeight className="w-10 h-10" />,
      delay: '47s',
      duration: '10s',
      position: { top: '83%', left: '50%' }
    },
    {
      icon: <MdScience className="w-12 h-12" />,
      delay: '48s',
      duration: '11s',
      position: { top: '77%', left: '58%' }
    },
    {
      icon: <GiChemicalDrop className="w-9 h-9" />,
      delay: '49s',
      duration: '8s',
      position: { top: '81%', left: '66%' }
    },
    {
      icon: <FaLungs className="w-11 h-11" />,
      delay: '50s',
      duration: '9s',
      position: { top: '85%', left: '74%' }
    },
    {
      icon: <FaTooth className="w-10 h-10" />,
      delay: '51s',
      duration: '10s',
      position: { top: '79%', left: '82%' }
    },
    {
      icon: <FaThermometerHalf className="w-11 h-11" />,
      delay: '52s',
      duration: '11s',
      position: { top: '83%', right: '2%' }
    },

    // === VERY BOTTOM EDGE ===
    {
      icon: <FaBandAid className="w-10 h-10" />,
      delay: '53s',
      duration: '8s',
      position: { top: '94%', left: '8%' }
    },
    {
      icon: <FaDna className="w-11 h-11" />,
      delay: '54s',
      duration: '9s',
      position: { top: '96%', left: '25%' }
    },
    {
      icon: <MdBiotech className="w-12 h-12" />,
      delay: '55s',
      duration: '10s',
      position: { top: '92%', left: '42%' }
    },
    {
      icon: <MdMedicalServices className="w-10 h-10" />,
      delay: '56s',
      duration: '11s',
      position: { top: '95%', left: '59%' }
    },
    {
      icon: <FaUserMd className="w-11 h-11" />,
      delay: '57s',
      duration: '8s',
      position: { top: '93%', left: '76%' }
    },

    // === LEFT EDGE - VERTICAL COVERAGE ===
    {
      icon: <FaFlask className="w-10 h-10" />,
      delay: '58s',
      duration: '9s',
      position: { top: '12%', left: '0.5%' }
    },
    {
      icon: <FaVial className="w-11 h-11" />,
      delay: '59s',
      duration: '10s',
      position: { top: '28%', left: '1%' }
    },
    {
      icon: <FaHeartbeat className="w-10 h-10" />,
      delay: '60s',
      duration: '11s',
      position: { top: '48%', left: '0.5%' }
    },
    {
      icon: <FaStethoscope className="w-11 h-11" />,
      delay: '61s',
      duration: '8s',
      position: { top: '68%', left: '1%' }
    },
    {
      icon: <FaMicroscope className="w-12 h-12" />,
      delay: '62s',
      duration: '9s',
      position: { top: '88%', left: '0.5%' }
    },

    // === RIGHT EDGE - VERTICAL COVERAGE ===
    {
      icon: <FaPills className="w-10 h-10" />,
      delay: '63s',
      duration: '10s',
      position: { top: '12%', right: '0.5%' }
    },
    {
      icon: <FaSyringe className="w-11 h-11" />,
      delay: '64s',
      duration: '11s',
      position: { top: '28%', right: '1%' }
    },
    {
      icon: <MdLocalHospital className="w-10 h-10" />,
      delay: '65s',
      duration: '8s',
      position: { top: '48%', right: '0.5%' }
    },
    {
      icon: <FaWeight className="w-11 h-11" />,
      delay: '66s',
      duration: '9s',
      position: { top: '68%', right: '1%' }
    },
    {
      icon: <MdScience className="w-12 h-12" />,
      delay: '67s',
      duration: '10s',
      position: { top: '88%', right: '0.5%' }
    }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {medicalIcons.map((item, index) => (
        <div
          key={index}
          className="absolute text-blue-500/70 opacity-85"
          style={{
            ...item.position,
            animation: `floatMedical ${item.duration} ease-in-out infinite`,
            animationDelay: item.delay,
            filter: 'drop-shadow(0 2px 6px rgba(59, 130, 246, 0.25))',
          }}
        >
          {item.icon}
        </div>
      ))}
    </div>
  );
};

// Skeleton loader component
const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="animate-pulse rounded-2xl p-6 h-40 w-full bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="h-4 bg-gray-200/50 rounded-full w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200/50 rounded-full w-1/2 mb-3"></div>
        <div className="h-3 bg-gray-200/50 rounded-full w-2/3"></div>
      </div>
    );
  }
  return (
    <div className="animate-pulse flex items-center justify-center h-40">
      <div className="rounded-full h-12 w-12 bg-gray-200/50"></div>
    </div>
  );
};

const menuItems = [
  { 
    key: 'myrequests', 
    label: 'My Requests', 
    component: MyRequestsPage, 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )
  },
  { 
    key: 'request', 
    label: 'New Request', 
    component: CreateRequestForm, 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    )
  },
  { 
    key: 'profile', 
    label: 'Profile', 
    component: UserDetails, 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
];

// Animation keyframes
const AnimatedBackground = () => (
  <style>{`
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    @keyframes floatMedical { 
      0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.6; } 
      25% { transform: translateY(-8px) translateX(3px) rotate(1deg); opacity: 0.8; }
      50% { transform: translateY(-4px) translateX(-2px) rotate(-0.5deg); opacity: 0.7; } 
      75% { transform: translateY(-12px) translateX(5px) rotate(0.8deg); opacity: 0.9; }
    }
    @keyframes floatUp {
      0% {
        transform: translateY(0) translateX(0) scale(0);
        opacity: 0;
      }
      10% {
        opacity: 1;
        transform: scale(1);
      }
      90% {
        opacity: 1;
      }
      100% {
        transform: translateY(-100vh) translateX(-20px) scale(0.8);
        opacity: 0;
      }
    }
    .animated-gradient { background-size: 400% 400%; animation: gradientShift 15s ease infinite; }
    .fade-in { animation: fadeIn 0.3s ease-out forwards; }
    .slide-down { animation: slideDown 0.4s ease-out forwards; }
    .scale-in { animation: scaleIn 0.4s ease-out forwards; }
    .float { animation: float 6s ease-in-out infinite; }
    .hover-scale { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
    .hover-scale:hover { transform: translateY(-2px); }
    .soft-shadow { box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.05), -4px -4px 12px rgba(255, 255, 255, 0.8); }
    .soft-shadow-inset { box-shadow: inset 3px 3px 6px rgba(0, 0, 0, 0.05), inset -3px -3px 6px rgba(255, 255, 255, 0.8); }
    .neumorphic-active { box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.05), inset -2px -2px 4px rgba(255, 255, 255, 0.8); }
    .skeleton-wave { position: relative; overflow: hidden; }
    .skeleton-wave::after { position: absolute; top: 0; right: 0; bottom: 0; left: 0; transform: translateX(-100%); background: linear-gradient(90deg,rgba(255,255,255,0) 0,rgba(255,255,255,0.2) 20%,rgba(255,255,255,0.5) 60%,rgba(255,255,255,0)); animation: shimmer 2s infinite; content: ''; }
    @keyframes shimmer { 100% { transform: translateX(100%); } }
    .w-10 { width: 2.5rem; height: 2.5rem; }
    .h-10 { width: 2.5rem; height: 2.5rem; }
    .w-11 { width: 2.75rem; height: 2.75rem; }
    .h-11 { width: 2.75rem; height: 2.75rem; }
    .w-13 { width: 3.25rem; height: 3.25rem; }
    .h-13 { width: 3.25rem; height: 3.25rem; }
  `}</style>
);

const FacultyDashboard = () => {
  const [selected, setSelected] = useState('myrequests');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
      );
    }
    const found = menuItems.find((item) => item.key === selected);
    return found && found.component ? React.createElement(found.component) : null;
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50 relative">
      <AnimatedBackground />
      <FloatingBubbles />
      <FloatingMedicalIcons />
      
      {/* Backdrop blur overlay when MyRequestsPage is active */}
      {selected === 'myrequests' && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-[0.5px] z-[1]" />
      )}
      
      {/* Navigation Bar */}
      <header className="w-full bg-white/80 backdrop-blur-lg sticky top-0 z-10 border-b border-gray-100/50 slide-down">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          {/* Main header line - Logo, Title, Navigation, User, Menu Button, Logout */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 soft-shadow">
                <img src="/pydah.svg" alt="Logo" className="h-8 w-auto" />
              </div>
              <span className="text-xl font-semibold text-gray-700 tracking-tight whitespace-nowrap">
                Faculty Dashboard
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:block flex-1 mx-8">
              <ul className="flex flex-wrap gap-2 items-center justify-center">
                {menuItems.map((item) => (
                  <li key={item.key}>
                    <button
                      className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm whitespace-nowrap flex items-center gap-2 hover-scale ${
                        selected === item.key 
                          ? 'bg-blue-100/50 text-blue-600 scale-in neumorphic-active' 
                          : 'bg-white text-gray-600 soft-shadow hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (item.route) {
                          navigate(item.route);
                        } else {
                          setSelected(item.key);
                        }
                      }}
                    >
                      <span className="text-lg" role="img" aria-label={item.label}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white soft-shadow">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {user.name}
                  </span>
                </div>
              )}
              
              {/* Mobile Menu Button */}
              <button
                className="md:hidden flex items-center justify-center p-2 rounded-xl focus:outline-none bg-white soft-shadow hover-scale"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {sidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-white text-gray-600 font-medium hover:bg-gray-50 transition-all soft-shadow hover-scale"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {sidebarOpen && (
          <div className="md:hidden w-full bg-white/95 backdrop-blur-lg border-t border-gray-100/50 fade-in">
            <ul className="flex flex-col gap-1 py-3 px-4">
              {menuItems.map((item) => (
                <li key={item.key}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                      selected === item.key 
                        ? 'bg-blue-100/50 text-blue-600 neumorphic-active' 
                        : 'bg-white text-gray-600 soft-shadow'
                    }`}
                    onClick={() => {
                      if (item.route) {
                        navigate(item.route);
                      } else {
                        setSelected(item.key);
                      }
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="text-lg" role="img" aria-label={item.label}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                </li>
              ))}
              {user && (
                <li className="px-4 py-3 mt-2 rounded-xl bg-white soft-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">Logged in as</div>
                      <div>{user.name}</div>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="w-full relative z-20">
        <div className="w-full p-4 md:p-6">
          <div className="w-full">
            {renderContent()}
          </div>
        </div>
      </main>
      
      {/* Subtle footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>Faculty Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default FacultyDashboard;