import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Circles */}
        <motion.div
          className="absolute w-64 h-64 bg-blue-200 rounded-full opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-32 h-32 bg-blue-300 rounded-full opacity-30"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          style={{ top: '60%', right: '15%' }}
        />
        <motion.div
          className="absolute w-48 h-48 bg-blue-100 rounded-full opacity-25"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          style={{ bottom: '20%', left: '70%' }}
        />
        
        {/* Medical Cross Elements */}
        <motion.div
          className="absolute w-12 h-12 text-blue-200 opacity-30"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '30%', left: '20%' }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 8h-2V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h2v2c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-2h2c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-8 6h-2v2H7v-2H5v-2h2V10h2v2h2v2z"/>
          </svg>
        </motion.div>
        
        <motion.div
          className="absolute w-8 h-8 text-blue-300 opacity-40"
          animate={{
            x: [0, 15, 0],
            y: [0, -15, 0],
            rotate: [0, -10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
          style={{ top: '70%', right: '30%' }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 8h-2V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h2v2c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-2h2c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-8 6h-2v2H7v-2H5v-2h2V10h2v2h2v2z"/>
          </svg>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 1
          }}
          className="mb-8"
        >
          <h1 className="text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 leading-none">
            404
          </h1>
        </motion.div>

        {/* Floating Pill Icon */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <motion.div
            className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl"
            animate={{
              y: [0, -10, 0],
              boxShadow: [
                "0 25px 50px -12px rgba(59, 130, 246, 0.25)",
                "0 35px 60px -12px rgba(59, 130, 246, 0.35)",
                "0 25px 50px -12px rgba(59, 130, 246, 0.25)"
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.22 11.29l2.4-2.4c.39-.39 1.02-.39 1.41 0l3.17 3.17c.39.39.39 1.02 0 1.41l-2.4 2.4c-.39.39-1.02.39-1.41 0L4.22 12.7c-.39-.39-.39-1.02 0-1.41z"/>
              <path d="M16.78 12.71l-2.4 2.4c-.39.39-1.02.39-1.41 0l-3.17-3.17c-.39-.39-.39-1.02 0-1.41l2.4-2.4c.39-.39 1.02-.39 1.41 0l3.17 3.17c.39.39.39 1.02 0 1.41z"/>
            </svg>
          </motion.div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            The page you're looking for seems to have wandered off like a missing medication bottle. 
            Don't worry, our pharmacy team is here to help you find what you need!
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to="/">
            <motion.button
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px -12px rgba(59, 130, 246, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go Home
            </motion.button>
          </Link>
          
          <motion.button
            whileHover={{ 
              scale: 1.05,
              backgroundColor: "rgb(239, 246, 255)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg border-2 border-blue-600 hover:bg-blue-50 transition-all duration-300 flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </motion.button>
        </motion.div>

        {/* Additional Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-sm">
            Need help? Contact our support team or visit our{' '}
            <Link to="/help" className="text-blue-600 hover:text-blue-700 underline">
              help center
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-32 text-blue-100"
          fill="currentColor"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,50 C300,120 500,0 800,50 C1000,100 1100,20 1200,50 L1200,120 L0,120 Z"
            animate={{
              d: [
                "M0,50 C300,120 500,0 800,50 C1000,100 1100,20 1200,50 L1200,120 L0,120 Z",
                "M0,70 C300,100 500,20 800,70 C1000,80 1100,40 1200,70 L1200,120 L0,120 Z",
                "M0,50 C300,120 500,0 800,50 C1000,100 1100,20 1200,50 L1200,120 L0,120 Z"
              ]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </svg>
      </div>
    </div>
  );
};

export default NotFound;
