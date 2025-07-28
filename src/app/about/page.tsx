import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Alex Johnson',
      title: 'Founder & CEO',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d',
      bio: 'Alex saw the content bottleneck and decided to build the solution.',
    },
    {
      name: 'Maria Garcia',
      title: 'Head of Product',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026708d',
      bio: 'Maria is obsessed with user experience and making ApexFlow intuitive.',
    },
    {
      name: 'Chen Wei',
      title: 'Lead AI Engineer',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026709d',
      bio: 'The mastermind behind our powerful content and image generation models.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              We're on a Mission to End{' '}
              <span className="text-primary">Content Bottlenecks</span>.
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
              We get it. You need to create more content to grow. But who has the time? ApexFlow was born from this exact frustration. We're a team of marketers, engineers, and AI enthusiasts dedicated to building tools that automate the grind, so you can focus on strategy.
            </p>
          </div>
        </section>

        <section className="py-20 bg-card">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
                  Our Story: From Frustration to Innovation
                </h2>
                <p className="text-muted-foreground mb-4">
                  It all started with a simple problem: our marketing agency was spending 80% of its time on content creation and only 20% on the high-impact strategies that actually moved the needle for clients. We knew there had to be a better way.
                </p>
                <p className="text-muted-foreground mb-4">
                  What if we could leverage the power of AI not just to write, but to build an entire content workflow? From the initial idea to the final, illustrated, and published blog post on WordPress.
                </p>
                <p className="text-muted-foreground">
                  That "what if" became our obsession. After months of development, ApexFlow was born. It's the tool we always wished we had, and now we're sharing it with the world.
                </p>
              </div>
              <div>
                <Image
                  src="https://placehold.co/600x400.png"
                  alt="Team working on a project"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg"
                  data-ai-hint="team collaboration"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
              Meet the Innovators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div key={member.name} className="text-center">
                  <Avatar className="h-32 w-32 mx-auto mb-4">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-headline font-semibold">{member.name}</h3>
                  <p className="text-primary mb-2">{member.title}</p>
                  <p className="text-muted-foreground max-w-xs mx-auto">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="py-20 bg-card">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
              Join Us on Our Journey
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Ready to see how ApexFlow can transform your workflow? Start creating smarter, not harder.
            </p>
            <Button asChild size="lg">
              <Link href="/signup">
                Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
