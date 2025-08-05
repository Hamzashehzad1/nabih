
// src/app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Settings,
  User,
  LogOut,
  Loader2,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase"; // Make sure firebase config is in this file
import { cn } from "@/lib/utils";
import { contentSuiteNav, siteManagementNav, seoSuiteNav, agencyToolkitNav, conversionToolkitNav } from "@/lib/nav-data";


const generalNav = [
    { href: "/dashboard/settings", icon: <Settings />, label: "Settings", tooltip: { children: "Settings", side: "right" } },
    { href: "/dashboard/profile", icon: <User />, label: "Profile", tooltip: { children: "Profile", side: "right" } },
];

const adminNav = [
    { href: "/dashboard/admin-analytics", icon: <Users />, label: "User Analytics", tooltip: { children: "User Analytics", side: "right" } },
]

// Convert landing page links to dashboard links
const dashboardNavs = [
  contentSuiteNav,
  siteManagementNav,
  seoSuiteNav,
  agencyToolkitNav,
  conversionToolkitNav
].map(nav => 
  nav.map(item => ({
    ...item,
    href: item.href.startsWith('/') && !item.href.startsWith('/dashboard') ? `/dashboard${item.href.replace('/tools', '')}` : item.href
  }))
);

const [
    dashboardContentSuiteNav,
    dashboardSiteManagementNav,
    dashboardSeoSuiteNav,
    dashboardAgencyToolkitNav,
    dashboardConversionToolkitNav,
] = dashboardNavs;


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
        <Sidebar className="glass-sidebar !border-r !border-white/10">
          <SidebarHeader>
            <Logo />
            <SidebarTrigger className="group-data-[collapsible=icon]:ml-auto" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/dashboard">
                    <SidebarMenuButton
                      isActive={pathname === "/dashboard"}
                      tooltip={{children: "Dashboard", side: "right"}}
                    >
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
            </SidebarMenu>

            <SidebarGroup>
                <SidebarGroupLabel>Content Suite</SidebarGroupLabel>
                <SidebarMenu>
                {dashboardContentSuiteNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                        <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        >
                        {item.icon}
                        <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarGroup>
            
            <SidebarGroup>
                <SidebarGroupLabel>SEO Suite</SidebarGroupLabel>
                <SidebarMenu>
                {dashboardSeoSuiteNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                        <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        >
                        {item.icon}
                        <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarGroup>
            
             <SidebarGroup>
                <SidebarGroupLabel>Compress & Convert</SidebarGroupLabel>
                <SidebarMenu>
                {dashboardConversionToolkitNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                        <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        >
                        {item.icon}
                        <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarGroupLabel>Site Management</SidebarGroupLabel>
                <SidebarMenu>
                {dashboardSiteManagementNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                        <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        >
                        {item.icon}
                        <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarGroup>
            
            <SidebarGroup>
                <SidebarGroupLabel>Agency Toolkit</SidebarGroupLabel>
                <SidebarMenu>
                {dashboardAgencyToolkitNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                        <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        >
                        {item.icon}
                        <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarGroup>
            
            <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarMenu>
                {adminNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                        <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        >
                        {item.icon}
                        <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarGroup>

             <SidebarGroup>
                <SidebarGroupLabel>General</SidebarGroupLabel>
                <SidebarMenu>
                {generalNav.map((item) => (
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
            </SidebarGroup>

          </SidebarContent>
          <SidebarFooter>
            <div className={cn("flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-sidebar-accent", "group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center")}>
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
          <main className="flex flex-col flex-1 p-4 sm:p-6 lg:p-8">
            <div className="flex-grow">
                {children}
            </div>
            <footer className="mt-12 pt-8 border-t border-border/20 text-center text-sm text-muted-foreground">
                <p>Enjoying the tools? <Link href="/pricing" className="text-primary underline">Upgrade to Pro</Link> to unlock unlimited access.</p>
                 <div className="flex justify-center gap-4 mt-4">
                    <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
                    <Link href="/#features" className="hover:text-primary">Features</Link>
                    <Link href="/contact" className="hover:text-primary">Contact Support</Link>
                 </div>
            </footer>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
