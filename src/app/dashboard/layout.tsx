"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Settings,
  User,
  FileText,
  ImageIcon,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
  { href: "/dashboard/blog-generator", icon: <FileText />, label: "Blog Generator" },
  { href: "/dashboard/image-generator", icon: <ImageIcon />, label: "Image Generator" },
  { href: "/dashboard/settings", icon: <Settings />, label: "Settings" },
  { href: "/dashboard/profile", icon: <User />, label: "Profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={{ children: item.label, side:"right"}}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-sidebar-accent">
                <Avatar className="h-10 w-10">
                    <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                    <p className="font-semibold text-sm truncate">User Name</p>
                    <p className="text-xs text-muted-foreground truncate">user@email.com</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto group-data-[collapsible=icon]:hidden" asChild>
                  <Link href="/">
                    <LogOut className="h-4 w-4" />
                  </Link>
                </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
