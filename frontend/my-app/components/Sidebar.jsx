'use client';
// Thanh sidebar cố định bên trái 

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, PlusCircle, Settings, LogOut } from 'lucide-react';

// Danh sách menu 
const menuItems = [
  { name: 'Tổng quan', icon: Home, href: '/dashboard' },
  { name: 'Nhóm Telegram', icon: Users, href: '/dashboard/groups' },
  { name: 'Tạo nhóm mới', icon: PlusCircle, href: '/dashboard/groups/new' },
  { name: 'Cài đặt', icon: Settings, href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname(); // lấy đường dẫn hiện tại để highlight

  // Hàm đăng xuất 
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen hidden md:block fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-bold">TG Manager</h2>
      </div>

      {/* Menu */}
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-4 hover:bg-gray-800 transition-all ${
                isActive ? 'bg-gray-800 border-l-4 border-blue-500' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-4" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Đăng xuất  */}
      <div className="absolute bottom-0 w-full p-6 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center text-gray-400 hover:text-white transition w-full"
        >
          <LogOut className="w-5 h-5 mr-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}