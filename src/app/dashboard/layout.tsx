'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, LayoutDashboard, FileText, Folder, Users } from 'lucide-react';

interface User {
  id: string;
  nomeCompleto: string;
  nomeGuerra?: string;
  postoGraduacao: string;
  role: string;
  om: {
    nome: string;
    sigla: string;
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');

      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Operações', href: '/dashboard/operacoes', icon: Folder },
    { name: 'Planos de Trabalho', href: '/dashboard/planos', icon: FileText },
  ];

  if (user.role === 'SUPER_ADMIN') {
    navigation.push({ name: 'Usuários', href: '/dashboard/usuarios', icon: Users });
  }

  return (
    <div className="min-h-screen bg-military-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-military-900 border-r border-military-800">
        {/* Logo/Header */}
        <div className="h-16 flex items-center px-6 border-b border-military-800 bg-military-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-military-600 rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-military-50">SisPTrab</h1>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-military-800 bg-military-900/50">
          <div className="font-medium text-military-50">
            {user.postoGraduacao} {user.nomeGuerra || user.nomeCompleto}
          </div>
          <div className="text-sm text-military-300">{user.om.sigla}</div>
          <div className="text-xs text-military-400 mt-1">{user.role.replace('_', ' ')}</div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-military-600 text-white font-medium'
                    : 'text-military-200 hover:bg-military-800'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-military-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
