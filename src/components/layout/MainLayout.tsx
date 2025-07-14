
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppSidebar } from '@/components/layout/AppSidebar';

export default function MainLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 transition-colors duration-300">
        <AppSidebar />
        <main className="flex-1 overflow-auto pt-8 pb-16">
          <div className="container mx-auto py-0 px-4 md:px-6 lg:px-8 max-w-6xl transition-all duration-300 ease-in-out">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
      <Sonner />
    </SidebarProvider>
  );
}
