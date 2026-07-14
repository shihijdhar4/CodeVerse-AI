import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Code2, 
  Trophy, 
  History, 
  Bot, 
  User, 
  ShieldAlert, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
  const { user, logout, notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'editor', name: 'Code Editor', icon: Code2 },
    { id: 'challenges', name: 'Challenges', icon: Trophy },
    { id: 'history', name: 'Saved Codes', icon: History },
    { id: 'ai-chat', name: 'AI Assistant', icon: Bot },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  // If user is Admin, add Admin panel
  if (user && user.role === 'admin') {
    menuItems.push({ id: 'admin', name: 'Admin Operations', icon: ShieldAlert });
  }

  const handleNavClick = (viewId) => {
    setActiveView(viewId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 glass-panel border-b border-gray-800 bg-[#0f172a] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">CODEVERSE AI</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Notifications Trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white scale-90">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Desktop & Mobile Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#090d16] border-r border-slate-900 flex flex-col justify-between transition-transform duration-300
        lg:translate-x-0 lg:static lg:h-screen
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header Section */}
        <div>
          <div className="hidden lg:flex items-center gap-3 px-6 py-6 border-b border-slate-900 bg-[#090d16]" style={{ height: '74px' }}>
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <h1 className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              CODEVERSE AI
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 py-6 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-650 to-indigo-500 text-white shadow-xl shadow-indigo-950/20' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile card & actions */}
        <div className="p-4 border-t border-slate-900 bg-[#080c14]">
          {/* User Block */}
          {user && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-4 glass-panel bg-slate-950/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center font-bold text-white text-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`
                    text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                    ${user.role === 'admin' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-slate-800 text-slate-300'}
                  `}>
                    {user.role}
                  </span>
                </div>
              </div>
              
              {/* Notification Bell Desktop */}
              <div className="relative hidden lg:block">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white scale-90">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-450 border border-slate-900 hover:border-rose-950 rounded-xl font-medium transition duration-200"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Notifications Drawer Dialog overlay */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 overflow-hidden" onClick={() => setShowNotifications(false)}>
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm pointer-events-none" />
          
          <div 
            className="absolute top-16 right-4 lg:right-6 w-80 lg:w-96 rounded-2xl glass-panel bg-[#0b0f19] shadow-2xl p-4 max-h-[80vh] flex flex-col border border-indigo-950/45 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <Bell className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="font-bold text-white text-md">System Notifications</h3>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllNotificationsRead} 
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto mt-2 flex-grow space-y-2 max-h-[60vh] pr-0.5">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  You have no notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif._id} 
                    onClick={() => !notif.isRead && markNotificationRead(notif._id)}
                    className={`
                      p-3 rounded-lg border text-xs leading-relaxed transition cursor-pointer
                      ${notif.isRead 
                        ? 'bg-slate-950/40 text-slate-400 border-slate-950' 
                        : 'bg-indigo-950/20 text-slate-200 border-indigo-950/40 hover:bg-indigo-950/30'}
                    `}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="flex-1 font-medium">{notif.message}</p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 mt-1" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1.5">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
