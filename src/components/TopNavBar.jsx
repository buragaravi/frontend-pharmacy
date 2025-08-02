import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TopNavBar = ({ selected, setSelected, onLogout, navItems }) => {
  const [dropdown, setDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdown(null);
      }
    }
    if (dropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdown]);

  const handleNavClick = (item) => {
    setSelected(item.key);
    if (item.route) navigate(item.route);
    setDropdown(null);
    setMobileMenuOpen(false);
  };

  const handleDropdownToggle = (itemKey) => {
    setDropdown(dropdown === itemKey ? null : itemKey);
  };

  return (
    <header className="w-full bg-white/80 shadow-md backdrop-blur sticky top-0 z-50">
      <nav className="w-full flex items-center justify-between px-2 sm:px-4 py-2">
        <span className="text-2xl font-extrabold text-blue-900 tracking-tight whitespace-nowrap mr-4">Central Store Admin</span>
        {/* Hamburger for mobile */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-7 h-7 text-blue-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {/* Desktop Nav */}
        <ul className="hidden md:flex flex-1 gap-2 lg:gap-4 items-center justify-center overflow-x-auto flex-wrap min-w-0">
          {navItems.map((item) => (
            <li key={item.key} className="relative group min-w-fit">
              {item.children ? (
                <>
                  <button
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-1 ${selected === item.key ? 'bg-blue-100 text-blue-900' : 'hover:bg-blue-50 text-blue-800'}`}
                    onClick={() => handleDropdownToggle(item.key)}
                    aria-haspopup="true"
                    aria-expanded={dropdown === item.key}
                  >
                    <span className="truncate max-w-[120px]">{item.label}</span>
                    <svg className={`w-4 h-4 transition-transform ${dropdown === item.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {dropdown === item.key && (
                    <ul ref={dropdownRef} className="absolute left-1/2 -translate-x-1/2 mt-3 w-56 bg-white rounded-lg shadow-2xl border z-50 animate-fade-in-down" style={{top: '100%'}}>
                      {item.children.map((child) => (
                        <li key={child.key}>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-blue-100 rounded-lg text-blue-900"
                            onClick={() => handleNavClick(child)}
                          >
                            {child.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <button
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 truncate max-w-[120px] ${selected === item.key ? 'bg-blue-100 text-blue-900' : 'hover:bg-blue-50 text-blue-800'}`}
                  onClick={() => handleNavClick(item)}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
        <button
          onClick={onLogout}
          className="ml-4 px-4 py-2 rounded-lg bg-blue-100 text-blue-900 font-semibold hover:bg-blue-200 transition-colors whitespace-nowrap"
        >
          Logout
        </button>
      </nav>
      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full bg-white/95 shadow-lg border-t border-blue-100 animate-fade-in-down">
          <ul className="flex flex-col gap-1 py-2 px-4">
            {navItems.map((item) => (
              <li key={item.key} className="relative">
                {item.children ? (
                  <>
                    <button
                      className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-1 ${selected === item.key ? 'bg-blue-100 text-blue-900' : 'hover:bg-blue-50 text-blue-800'}`}
                      onClick={() => handleDropdownToggle(item.key)}
                      aria-haspopup="true"
                      aria-expanded={dropdown === item.key}
                    >
                      {item.label}
                      <svg className={`w-4 h-4 transition-transform ${dropdown === item.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {dropdown === item.key && (
                      <ul className="pl-4">
                        {item.children.map((child) => (
                          <li key={child.key}>
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-blue-100 rounded-lg text-blue-900"
                              onClick={() => handleNavClick(child)}
                            >
                              {child.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <button
                    className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition-colors duration-200 truncate max-w-full ${selected === item.key ? 'bg-blue-100 text-blue-900' : 'hover:bg-blue-50 text-blue-800'}`}
                    onClick={() => handleNavClick(item)}
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
            <li>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 rounded-lg bg-blue-100 text-blue-900 font-semibold hover:bg-blue-200 transition-colors mt-2"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default TopNavBar;
