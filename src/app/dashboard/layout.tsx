// src/app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Loader2,
  Library,
  Bot,
  Activity,
  Lightbulb,
  Paintbrush,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase"; // Make sure firebase config is in this file

const navItems = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard", tooltip: { children: "Dashboard", side: "right" } },
  { href: "/dashboard/content-ideas", icon: <Lightbulb />, label: "Content Ideas", tooltip: { children: "Content Ideas", side: "right" } },
  { href: "/dashboard/blog-generator", icon: <FileText />, label: "Blog Generator", tooltip: { children: "Blog Generator", side: "right" } },
  { href: "/dashboard/image-generator", icon: <ImageIcon />, label: "Image Generator", tooltip: { children: "Image Generator", side: "right" } },
  { href: "/dashboard/ai-chatbot", icon: <Bot />, label: "AI Chatbot", tooltip: { children: "AI Chatbot", side: "right" } },
  { href: "/dashboard/website-audit", icon: <Activity />, label: "Website Audit", tooltip: { children: "Website Audit", side: "right" } },
  { href: "/dashboard/white-label", icon: <Paintbrush />, label: "White-Label", tooltip: { children: "White-Label", side: "right" } },
  { href: "/dashboard/advanced-media-library", icon: <Library />, label: "Media Library", tooltip: { children: "Media Library", side: "right" } },
  { href: "/dashboard/settings", icon: <Settings />, label: "Settings", tooltip: { children: "Settings", side: "right" } },
  { href: "/dashboard/profile", icon: <User />, label: "Profile", tooltip: { children: "Profile", side: "right" } },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    router.push("/");
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

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
                      tooltip={item.tooltip}
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
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                    <p className="font-semibold text-sm truncate">{user?.displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto group-data-[collapsible=icon]:hidden" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
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
