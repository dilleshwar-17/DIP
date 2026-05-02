import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LogOut, Sun, Moon, Laptop, Activity, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useContext(AuthContext);
  const { theme, setTheme } = useTheme();

  const ThemeToggle = () => {
    const themes = [
      { id: 'light', icon: <Sun size={16} />, label: 'Light' },
      { id: 'dark', icon: <Moon size={16} />, label: 'Dark' },
      { id: 'system', icon: <Laptop size={16} />, label: 'System' },
    ];

    return (
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mt-4 border border-gray-200 dark:border-gray-700">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              theme === t.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            title={t.label}
          >
            {t.icon}
            <span className="hidden lg:inline">{t.label}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-500">
              <Activity size={28} />
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">DevTrack</h1>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-4">
            <NavLink
              to="/"
              onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-800/50'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
          </nav>

          <div className="border-t border-gray-200 p-6 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="mb-4 flex items-center px-2">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base uppercase dark:bg-blue-900/50 dark:text-blue-300 shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="ml-3 flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{user?.role || 'Developer'}</span>
              </div>
            </div>

            <ThemeToggle />

            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 mt-4 border border-transparent hover:border-red-100 dark:hover:border-red-800/50"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

