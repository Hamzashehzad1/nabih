import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans | Nabih',
  description: 'Simple, transparent pricing for the Nabih AI content toolkit. Choose the plan that fits your needs, from free for individuals to enterprise for large agencies.',
  alternates: {
    canonical: '/pricing',
  },
};


export default function PricingPage() {
  const pricingTiers = [
    {
      name: 'Free',
      price: '$0',
      period: '/ month',
      description: 'The perfect plan to get started and explore our core features.',
      features: [
        '3 Blog Posts per month',
        '10 Image Generations per month',
        '1 Connected WordPress Site',
        'Standard AI Models',
        'Community Support',
      ],
      cta: 'Start for Free',
      variant: 'outline' as const,
      href: '/signup'
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/ month',
      description: 'For content creators and businesses who want to scale.',
      features: [
        'Unlimited Blog Posts',
        'Unlimited Image Generations',
        '5 Connected WordPress Sites',
        'Advanced AI Models',
        'Email & Chat Support',
      ],
      cta: 'Get Started with Pro',
      variant: 'default' as const,
      isFeatured: true,
      href: '/signup'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For agencies and large teams with custom needs.',
      features: [
        'Everything in Pro, plus:',
        'Unlimited WordPress Sites',
        'API Access',
        'Dedicated Account Manager',
        'Custom Integrations',
      ],
      cta: 'Contact Sales',
      variant: 'outline' as const,
      href: '/contact'
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Find the <span className="text-primary">Perfect Plan</span>.
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Whether you're just starting out or scaling your content empire, we have a plan that fits. Start for free today, no credit card required.
            </p>
          </div>
        </section>

        <section className="pb-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
              {pricingTiers.map((tier) => (
                <Card key={tier.name} className={cn('flex flex-col h-full', tier.isFeatured && 'border-primary shadow-lg shadow-primary/20')}>
                  <CardHeader>
                    <CardTitle className="font-headline text-3xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="flex items-baseline pt-4">
                      <span className="text-5xl font-bold">{tier.price}</span>
                      {tier.period && <span className="text-muted-foreground ml-1">{tier.period}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-4">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full" variant={tier.variant}>
                      <Link href={tier.href}>{tier.cta}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
