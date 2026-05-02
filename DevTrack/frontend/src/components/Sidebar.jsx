import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LogOut, Sun, Moon, Activity } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ toggleTheme, isDarkMode }) => {
  const { logout, user } = useContext(AuthContext);

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 transition-colors duration-200">
      <div className="p-6">
        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-500">
          <Activity size={28} />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">DevTrack</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`
          }
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
      </nav>

      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="mb-4 flex items-center px-4">
          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm uppercase dark:bg-blue-900 dark:text-blue-300">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="ml-3 flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 mt-2"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
