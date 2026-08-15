'use client';

import React from 'react';
import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  PackageSearch, 
  Ticket,
  Settings, 
  LogOut,
  Bell,
  Search,
  Power,
  Loader2
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '@/services/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  const { user, isAuthenticated } = useSelector((state: any) => state.auth);
  const isAuthorized = isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  // Fetch restaurant open/closed status
  const { data: serverSettings } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      try {
        const res = await API.get('/admin/settings');
        return res.data?.settings || [];
      } catch {
        return [];
      }
    },
    enabled: isAuthorized,
  });

  const isOpenSetting = serverSettings?.find((s: any) => s.key === 'is_open');
  const isOpen = isOpenSetting ? isOpenSetting.value === 'true' : true;

  // Toggle restaurant on/off mutation
  const toggleStoreMutation = useMutation({
    mutationFn: async (nextStatus: boolean) => {
      await API.post('/admin/settings', { key: 'is_open', value: nextStatus ? 'true' : 'false' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      queryClient.invalidateQueries({ queryKey: ['publicRestaurantSettings'] });
    },
  });

  const handleToggleStore = () => {
    toggleStoreMutation.mutate(!isOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    sessionStorage.clear();
    router.push('/dashboard'); 
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Menu Management', href: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Orders', href: '/admin/orders', icon: PackageSearch },
    { name: 'Coupons & Offers', href: '/admin/coupons', icon: Ticket },
  ];

  return (
    <AdminGuard>
      <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 bg-[#111111] border-r border-white/5 flex flex-col z-20 shadow-2xl shadow-black">
          <div className="h-20 flex items-center px-8 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/image/logo01.png"
              alt="Bloomon Logo"
              width={38}
              height={38}
              className="rounded-full object-cover"
            />
            <span className="text-xl font-display font-black tracking-widest text-[#D4AF37] drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">
              BLOOMON
            </span>
          </div>
          
          <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link key={item.name} href={item.href}
                  className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-lg shadow-primary/10' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-4 transition-transform duration-300 ${isActive ? 'text-primary scale-110' : 'text-gray-500 group-hover:scale-110 group-hover:text-primary-light'}`} />
                  <span className="text-sm font-semibold tracking-wide">{item.name}</span>
                </Link>
              );
            })}

            {/* RESTAURANT ON / OFF BUTTON (Directly after Coupons) */}
            <div className="pt-2 pb-2">
              <button
                type="button"
                onClick={handleToggleStore}
                disabled={toggleStoreMutation.isPending}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isOpen
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-md shadow-emerald-500/10'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-md shadow-rose-500/10'
                }`}
                title={isOpen ? 'Click to turn Restaurant OFF' : 'Click to turn Restaurant ON'}
              >
                <div className="flex items-center space-x-3">
                  <Power className={`w-4 h-4 ${isOpen ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-none">
                      Restaurant: {isOpen ? 'ON' : 'OFF'}
                    </p>
                    <p className="text-[10px] opacity-75 mt-0.5">
                      {isOpen ? 'Store is Open' : 'Store is Closed'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  {toggleStoreMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-rose-400 shadow-[0_0_8px_#f87171]'}`} />
                  )}
                </div>
              </button>
            </div>

            {/* Settings Link */}
            <Link href="/admin/settings"
              className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')
                  ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-lg shadow-primary/10' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className={`w-5 h-5 mr-4 transition-transform duration-300 ${pathname === '/admin/settings' ? 'text-primary scale-110' : 'text-gray-500 group-hover:scale-110 group-hover:text-primary-light'}`} />
              <span className="text-sm font-semibold tracking-wide">Settings</span>
            </Link>
          </nav>

          <div className="p-6 border-t border-white/5 bg-gradient-to-t from-black/20 to-transparent">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 group"
            >
              <LogOut className="w-5 h-5 mr-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-semibold tracking-wide">Logout Account</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Top Navbar */}
          <header className="h-20 bg-[#111111]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-10">
            
            {/* Search */}
            <div className="flex items-center bg-white/5 rounded-2xl px-5 py-2.5 w-[380px] border border-white/5 focus-within:border-primary/50 focus-within:bg-white/10 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all duration-300">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search anything (Press '/' to focus)" 
                className="bg-transparent border-none outline-none text-sm text-white ml-3 w-full placeholder-gray-500 font-medium"
              />
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-6">
              {/* Header Restaurant Status Badge */}
              <button
                type="button"
                onClick={handleToggleStore}
                disabled={toggleStoreMutation.isPending}
                className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  isOpen
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                <span>{isOpen ? 'RESTAURANT: OPEN' : 'RESTAURANT: CLOSED'}</span>
              </button>

              <button className="relative text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center space-x-4 pl-6 border-l border-white/10 cursor-pointer group">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{user?.name || 'Administrator'}</p>
                  <p className="text-[11px] font-medium tracking-wide text-gray-500">{user?.email || 'bloomonrestaurant@gmail.com'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-yellow-200 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-shadow duration-300">
                  <span className="text-bg-dark font-black text-lg">{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0a0a0a] to-[#111111] p-10 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="relative z-10 h-full">
              {children}
            </div>
          </main>
          
        </div>
      </div>
    </AdminGuard>
  );
}
