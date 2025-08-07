import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronDown, ChevronUp, BarChart2, Clipboard, Shield, Package, Mail } from 'lucide-react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-700 text-white p-4 fixed w-full z-50 shadow-2xl backdrop-blur-lg border-b border-white/20">
      <nav className="container mx-auto flex justify-between items-center">
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center"
        >
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm mr-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Pharmacy Lab
          </h1>
        </motion.div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white focus:outline-none p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <ul className="flex space-x-6">
            <li>
              <a href="/" className="hover:text-blue-200 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10">Home</a>
            </li>
            <li>
              <a href="/unauthorized" className="hover:text-blue-200 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10">Inventory</a>
            </li>
            <li>
              <a href="/unauthorized" className="hover:text-blue-200 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10">Quotations</a>
            </li>
          </ul>
          <div className="flex space-x-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-6 py-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all duration-200 font-medium border border-white/30 backdrop-blur-sm"
            >
              Login
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-6 py-2 rounded-xl bg-white text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium shadow-lg"
            >
              Sign Up
            </motion.button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white/10 backdrop-blur-lg mt-4 p-4 rounded-2xl border border-white/20"
        >
          <ul className="space-y-3">
            <li>
              <a href="/" className="block py-2 px-3 hover:text-blue-200 transition-colors rounded-lg hover:bg-white/10">Home</a>
            </li>
            <li>
              <a href="/unauthorized" className="block py-2 px-3 hover:text-blue-200 transition-colors rounded-lg hover:bg-white/10">Inventory</a>
            </li>
            <li>
              <a href="/unauthorized" className="block py-2 px-3 hover:text-blue-200 transition-colors rounded-lg hover:bg-white/10">Quotations</a>
            </li>
            <li className="pt-2 flex space-x-2">
              <button 
                onClick={() => navigate('/login')}
                className="flex-1 px-4 py-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors border border-white/30"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="flex-1 px-4 py-2 rounded-xl bg-white text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Sign Up
              </button>
            </li>
          </ul>
        </motion.div>
      )}
    </header>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-12">
      <div className="container mx-auto grid md:grid-cols-4 gap-8 px-4">
        <div>
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 mr-3 text-white">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold">Pharmacy Lab</h3>
          </div>
          <p className="text-blue-200">
            Leading pharmacy lab management system for efficient chemical inventory control and lab operations.
          </p>
          <div className="mt-4 flex space-x-4">
            <a href="#" className="text-white hover:text-blue-200 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
              </svg>
            </a>
            <a href="#" className="text-white hover:text-blue-200 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </a>
            <a href="#" className="text-white hover:text-blue-200 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
              </svg>
            </a>
            <a href="#" className="text-white hover:text-blue-200 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
              </svg>
            </a>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><a href="/about" className="text-gray-300 hover:text-blue-200 transition-colors">About Us</a></li>
            <li><a href="/features" className="text-gray-300 hover:text-blue-200 transition-colors">Features</a></li>
            <li><a href="/pricing" className="text-gray-300 hover:text-blue-200 transition-colors">Pricing</a></li>
            <li><a href="/demo" className="text-gray-300 hover:text-blue-200 transition-colors">Request Demo</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Resources</h3>
          <ul className="space-y-2">
            <li><a href="/blog" className="text-gray-300 hover:text-blue-200 transition-colors">Blog</a></li>
            <li><a href="/help" className="text-gray-300 hover:text-blue-200 transition-colors">Help Center</a></li>
            <li><a href="/faq" className="text-gray-300 hover:text-blue-200 transition-colors">FAQ</a></li>
            <li><a href="/contact" className="text-gray-300 hover:text-blue-200 transition-colors">Contact Support</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Contact</h3>
          <p className="text-gray-300 mb-2">Email: support@pharmacylab.com</p>
          <p className="text-gray-300 mb-4">Phone: (123) 456-7890</p>
          <address className="text-gray-300 not-italic">
            123 Lab Street<br />
            Science Park, CA 94043
          </address>
        </div>
      </div>
      <div className="container mx-auto mt-8 pt-8 border-t border-gray-700 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} Pharmacy Lab Management. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="/privacy" className="text-gray-300 hover:text-blue-200 transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-gray-300 hover:text-blue-200 transition-colors">Terms of Service</a>
            <a href="/cookies" className="text-gray-300 hover:text-blue-200 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FeatureCard = ({ title, description, icon }) => (
  <motion.div 
    whileHover={{ y: -8, scale: 1.02 }}
    className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 group"
  >
    <div className="text-transparent bg-gradient-to-br from-blue-500 to-blue-700 bg-clip-text mb-4 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const Testimonial = ({ quote, author, role, company }) => (
  <motion.div 
    whileHover={{ scale: 1.03, y: -5 }}
    className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20"
  >
    <div className="mb-4 text-transparent bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-3xl font-bold">"</div>
    <p className="italic text-gray-700 mb-4">{quote}</p>
    <div className="flex items-center">
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mr-4 shadow-lg">
        {author.charAt(0)}
      </div>
      <div>
        <p className="font-semibold text-gray-800">{author}</p>
        <p className="text-sm text-gray-600">{role}, {company}</p>
      </div>
    </div>
  </motion.div>
);

const BenefitItem = ({ title, description, icon }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="flex items-start group"
  >
    <div className="mr-4 text-white/90 mt-1 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-lg mb-2 text-white">{title}</h3>
      <p className="text-white/80">{description}</p>
    </div>
  </motion.div>
);

const StatCounter = ({ value, label, icon }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="text-center"
  >
    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full text-white mb-4 shadow-lg">
      {icon}
    </div>
    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">{value}+</div>
    <div className="text-gray-600 font-medium">{label}</div>
  </motion.div>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left font-semibold text-lg bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-900 transition-all duration-300"
      >
        <span>{question}</span>
        <div className="text-blue-500">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 text-gray-600 leading-relaxed"
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    alert(`Thank you for subscribing with ${email}!`);
    setEmail('');
  };
  
  return (
    <>
          <Header />
      <main className="flex-grow pt-16 min-h-screen">        {/* Hero Section with Pattern */}
        <section className="relative min-h-screen bg-blue-600 text-white py-24 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ 
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              backgroundSize: '30px 30px'
            }}></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-1/2 text-center lg:text-left">
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
                >
                  Modern Pharmacy <br />
                  <span className="text-blue-200">Lab Management</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl mb-8 max-w-lg mx-auto lg:mx-0"
                >
                  Streamline your laboratory operations with our comprehensive management system designed for modern pharmacies.
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4"
                >
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/register')}
                    className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-blue-50 transition-colors"
                  >
                    Get Started
                  </motion.button>                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/demo')}
                    className="border-2 border-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Watch Demo
                  </motion.button>
                </motion.div>
              </div>
              <div className="lg:w-1/2 mt-12 lg:mt-0">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20"
                >
                  <img 
                    src="https://www.aacp.org/sites/default/files/2017-08/aacp_stock_08.jpg" 
                    alt="Pharmacy Lab Dashboard" 
                    className="rounded-lg shadow-lg w-full"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>       
  );
};

export default Home;