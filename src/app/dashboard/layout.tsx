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
  FileText,
  ImageIcon,
  LogOut,
  Loader2,
  Library,
  Bot,
  Activity,
  Lightbulb,
  Paintbrush,
  Shield,
  TrendingDown,
  Link2,
  Files,
  Palette,
  LayoutTemplate,
  Smartphone,
  MessageSquareQuote,
  Receipt,
  HelpCircle,
  Type,
  Code2,
  Unlink,
  Layers3,
  Network,
  DownloadCloud,
  Crop,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase"; // Make sure firebase config is in this file
import { cn } from "@/lib/utils";

const contentSuiteNav = [
    { href: "/dashboard/content-ideas", icon: <Lightbulb />, label: "Content Ideas", tooltip: { children: "Content Ideas", side: "right" } },
    { href: "/dashboard/blog-generator", icon: <FileText />, label: "Blog Generator", tooltip: { children: "Blog Generator", side: "right" } },
    { href: "/dashboard/bulk-blog-generator", icon: <Files />, label: "Bulk Blog Generator", tooltip: { children: "Bulk Blog Generator", side: "right" } },
    { href: "/dashboard/image-generator", icon: <ImageIcon />, label: "Image Generator", tooltip: { children: "Image Generator", side: "right" } },
    { href: "/dashboard/brand-kit-generator", icon: <Palette />, label: "Brand Kit Generator", tooltip: { children: "Brand Kit Generator", side: "right" } },
    { href: "/dashboard/wireframe-generator", icon: <LayoutTemplate />, label: "Wireframe Generator", tooltip: { children: "Wireframe Generator", side: "right" } },
];

const siteManagementNav = [
    { href: "/dashboard/ai-chatbot", icon: <Bot />, label: "AI Chatbot", tooltip: { children: "AI Chatbot", side: "right" } },
    { href: "/dashboard/website-audit", icon: <Activity />, label: "Website Audit", tooltip: { children: "Website Audit", side: "right" } },
    { href: "/dashboard/advanced-media-library", icon: <Library />, label: "Media Library", tooltip: { children: "Media Library", side: "right" } },
    { href: "/dashboard/image-resizer", icon: <Crop />, label: "Image Resizer", tooltip: { children: "Image Resizer", side: "right" } },
    { href: "/dashboard/internal-linking", icon: <Link2 />, label: "Internal Linking", tooltip: { children: "Internal Linking", side: "right" } },
    { href: "/dashboard/stale-content", icon: <TrendingDown />, label: "Stale Content", tooltip: { children: "Stale Content", side: "right" } },
    { href: "/dashboard/legal-generator", icon: <Shield />, label: "Legal Generator", tooltip: { children: "Legal Generator", side: "right" } },
];

const seoSuiteNav = [
    { href: "/dashboard/keyword-clustering", icon: <Layers3 />, label: "Keyword Clustering", tooltip: { children: "Keyword Clustering", side: "right" } },
    { href: "/dashboard/keyword-density-checker", icon: <Type />, label: "Keyword Density", tooltip: { children: "Keyword Density", side: "right" } },
    { href: "/dashboard/people-also-ask", icon: <HelpCircle />, label: "People Also Ask", tooltip: { children: "People Also Ask", side: "right" } },
    { href: "/dashboard/schema-markup-generator", icon: <Code2 />, label: "Schema Generator", tooltip: { children: "Schema Generator", side: "right" } },
    { href: "/dashboard/broken-link-checker", icon: <Unlink />, label: "Broken Link Checker", tooltip: { children: "Broken Link Checker", side: "right" } },
    { href: "/dashboard/sitemap-generator", icon: <Network />, label: "Sitemap Generator", tooltip: { children: "Sitemap Generator", side: "right" } },
];

const agencyToolkitNav = [
    { href: "/dashboard/invoice-generator", icon: <Receipt />, label: "Invoice Generator", tooltip: { children: "Invoice Generator", side: "right" } },
    { href: "/dashboard/visual-feedback", icon: <MessageSquareQuote />, label: "Visual Feedback", tooltip: { children: "Visual Feedback", side: "right" } },
    { href: "/dashboard/responsiveness-checker", icon: <Smartphone />, label: "Mockup Generator", tooltip: { children: "Mockup Generator", side: "right" } },
    { href: "/dashboard/white-label", icon: <Paintbrush />, label: "White-Label", tooltip: { children: "White-Label", side: "right" } },
    { href: "/dashboard/woocommerce-scraper", icon: <DownloadCloud />, label: "Products Scraper", tooltip: { children: "Products Scraper", side: "right" } },
];

const generalNav = [
    { href: "/dashboard/settings", icon: <Settings />, label: "Settings", tooltip: { children: "Settings", side: "right" } },
    { href: "/dashboard/profile", icon: <User />, label: "Profile", tooltip: { children: "Profile", side: "right" } },
];

const adminNav = [
    { href: "/dashboard/admin-analytics", icon: <Users />, label: "User Analytics", tooltip: { children: "User Analytics", side: "right" } },
]


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
                {contentSuiteNav.map((item) => (
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
                {seoSuiteNav.map((item) => (
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
                {siteManagementNav.map((item) => (
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
                {agencyToolkitNav.map((item) => (
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
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
