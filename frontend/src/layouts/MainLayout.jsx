import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [key, setKey] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Force re-render of the Outlet component when navigating to the same route
  useEffect(() => {
    setKey(prevKey => prevKey + 1);
  }, [location.pathname, location.search]);

  const handleNavigation = (path) => {
    if (location.pathname === path) {
      // If already on the same path, force a reload of the component
      setKey(prevKey => prevKey + 1);
    }
  };

  const navItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
    {
      path: '/companies',
      name: 'Companies',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      ),
      dropdown: [
        { name: 'All Companies', path: '/companies' },
        { name: 'Clients', path: '/companies?type=client' },
        { name: 'Providers', path: '/companies?type=provider' },
        { name: 'Both', path: '/companies?type=both' }
      ]
    },
    {
      path: '/tasks',
      name: 'Deals',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      ),
    },
    {
      path: '/banks',
      name: 'Bank Accounts',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      ),
    },
    {
      path: '/brokers',
      name: 'Brokers',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      ),
    },
    {
      path: '/expenses',
      name: 'Expenses',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      path: '/advances',
      name: 'Advances',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      path: '/slabs',
      name: 'Slabs',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      ),
    },
    {
      path: '/statements',
      name: 'Statements',
      icon: (
        <path 
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Watermark */}
      <div className="fixed bottom-8 right-16 px-4 py-2 bg-white/80 backdrop-blur-sm border-t border-l border-r border-b border-gray-200 rounded-tl-lg rounded-br-lg text-gray-600 text-xs font-medium pointer-events-none">
        Design and Developed by Kasper Infotech Pvt. Ltd.
      </div>
      
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {isSidebarOpen && (
            <>
              <img 
                src="https://kasperinfotech.net/static/media/MUNCSMALL.248e32a2.svg"
                alt="MUN-C Logo"
                className="h-12 w-auto" 
              />
              <div className="flex items-center">
                <span className="ml-2 text-2xl font-bold text-blue-600">MUN-C</span>
              </div>
            </>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                {item.dropdown ? (
                  <div className="relative group">
                    <Link
                      to={item.path}
                      className={`nav-link ${
                        isActive(item.path) ? 'active' : ''
                      }`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {item.icon}
                      </svg>
                      {isSidebarOpen && (
                        <div className="flex items-center justify-between w-full">
                          <span>{item.name}</span>
                          <svg
                            className="w-4 h-4 ml-2 transition-transform group-hover:rotate-180"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      )}
                    </Link>
                    <div className={`absolute ${isSidebarOpen ? 'left-full' : 'left-full'} top-0 ml-1 w-56 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border-l-4 border-blue-500`}>
                      <div className="absolute -left-1 top-1/2 w-1 h-0.5 bg-blue-500 transform -translate-y-1/2"></div>
                      {item.dropdown.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.path}
                          to={dropdownItem.path}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 border-l-4 border-transparent hover:border-blue-200"
                          onClick={() => handleNavigation(dropdownItem.path)}
                        >
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`nav-link ${
                      isActive(item.path) ? 'active' : ''
                    }`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {item.icon}
                    </svg>
                    {isSidebarOpen && <span>{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-semibold text-blue-900">Broker Management System</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.name || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet key={key} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 