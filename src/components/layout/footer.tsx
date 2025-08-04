
import Link from 'next/link';
import { Twitter, Github, Linkedin } from 'lucide-react';
import { Logo } from '@/components/logo';
import { EngagementBanner } from '../engagement-banner';

export default function Footer() {
  const socialLinks = [
    { name: 'Twitter', icon: <Twitter className="h-5 w-5" />, href: '#' },
    { name: 'GitHub', icon: <Github className="h-5 w-5" />, href: '#' },
    { name: 'LinkedIn', icon: <Linkedin className="h-5 w-5" />, href: '#' },
  ];

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '/#features' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Tools', href: '/#tools' },
        { name: 'Updates', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '/about' },
        { name: 'Careers', href: '#' },
        { name: 'Contact', href: '/contact' },
      ],
    },
     {
      title: 'Resources',
      links: [
        { name: 'Checklist', href: '/checklist' },
        { name: 'Sitemap', href: '/sitemap.xml' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms of Service', href: '#' },
        { name: 'Privacy Policy', href: '#' },
      ],
    },
  ];

  return (
    <>
      <footer className="bg-background/50 border-t border-white/10">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1 lg:col-span-2">
              <Link href="/">
                <Logo />
              </Link>
              <p className="mt-4 text-muted-foreground max-w-xs">
                AI-powered content creation for modern teams.
              </p>
            </div>

            {footerLinks.map((section) => (
              <div key={section.title}>
                <h3 className="font-headline font-semibold">{section.title}</h3>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Nabih. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
      <EngagementBanner />
    </>
  );
}
