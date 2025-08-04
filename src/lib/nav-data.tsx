
import {
  LayoutDashboard,
  Settings,
  User,
  FileText,
  ImageIcon,
  LogOut,
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
  GitCompare,
} from "lucide-react";

export const contentSuiteNav = [
    { href: "/content-ideas", icon: <Lightbulb />, label: "Content Ideas", tooltip: { children: "Content Ideas", side: "right" } },
    { href: "/blog-generator", icon: <FileText />, label: "Blog Generator", tooltip: { children: "Blog Generator", side: "right" } },
    { href: "/bulk-blog-generator", icon: <Files />, label: "Bulk Blog Generator", tooltip: { children: "Bulk Blog Generator", side: "right" } },
    { href: "/dashboard/image-generator", icon: <ImageIcon />, label: "Image Generator", tooltip: { children: "Image Generator", side: "right" } },
    { href: "/dashboard/brand-kit-generator", icon: <Palette />, label: "Brand Kit Generator", tooltip: { children: "Brand Kit Generator", side: "right" } },
    { href: "/dashboard/wireframe-generator", icon: <LayoutTemplate />, label: "Wireframe Generator", tooltip: { children: "Wireframe Generator", side: "right" } },
];

export const siteManagementNav = [
    { href: "/dashboard/ai-chatbot", icon: <Bot />, label: "AI Chatbot", tooltip: { children: "AI Chatbot", side: "right" } },
    { href: "/dashboard/website-audit", icon: <Activity />, label: "Website Audit", tooltip: { children: "Website Audit", side: "right" } },
    { href: "/dashboard/advanced-media-library", icon: <Library />, label: "Media Library", tooltip: { children: "Media Library", side: "right" } },
    { href: "/dashboard/image-resizer", icon: <Crop />, label: "Image Resizer", tooltip: { children: "Image Resizer", side: "right" } },
    { href: "/dashboard/internal-linking", icon: <Link2 />, label: "Internal Linking", tooltip: { children: "Internal Linking", side: "right" } },
    { href: "/dashboard/stale-content", icon: <TrendingDown />, label: "Stale Content", tooltip: { children: "Stale Content", side: "right" } },
    { href: "/dashboard/woocommerce-sync", icon: <GitCompare />, label: "WooCommerce Sync", tooltip: { children: "WooCommerce Sync", side: "right" } },
    { href: "/dashboard/legal-generator", icon: <Shield />, label: "Legal Generator", tooltip: { children: "Legal Generator", side: "right" } },
];

export const seoSuiteNav = [
    { href: "/dashboard/keyword-clustering", icon: <Layers3 />, label: "Keyword Clustering", tooltip: { children: "Keyword Clustering", side: "right" } },
    { href: "/dashboard/keyword-density-checker", icon: <Type />, label: "Keyword Density", tooltip: { children: "Keyword Density", side: "right" } },
    { href: "/dashboard/people-also-ask", icon: <HelpCircle />, label: "People Also Ask", tooltip: { children: "People Also Ask", side: "right" } },
    { href: "/dashboard/schema-markup-generator", icon: <Code2 />, label: "Schema Generator", tooltip: { children: "Schema Generator", side: "right" } },
    { href: "/dashboard/broken-link-checker", icon: <Unlink />, label: "Broken Link Checker", tooltip: { children: "Broken Link Checker", side: "right" } },
    { href: "/dashboard/sitemap-generator", icon: <Network />, label: "Sitemap Generator", tooltip: { children: "Sitemap Generator", side: "right" } },
];

export const agencyToolkitNav = [
    { href: "/dashboard/invoice-generator", icon: <Receipt />, label: "Invoice Generator", tooltip: { children: "Invoice Generator", side: "right" } },
    { href: "/dashboard/visual-feedback", icon: <MessageSquareQuote />, label: "Visual Feedback", tooltip: { children: "Visual Feedback", side: "right" } },
    { href: "/dashboard/responsiveness-checker", icon: <Smartphone />, label: "Mockup Generator", tooltip: { children: "Mockup Generator", side: "right" } },
    { href: "/dashboard/white-label", icon: <Paintbrush />, label: "White-Label", tooltip: { children: "White-Label", side: "right" } },
    { href: "/dashboard/woocommerce-scraper", icon: <DownloadCloud />, label: "Products Scraper", tooltip: { children: "Products Scraper", side: "right" } },
];
