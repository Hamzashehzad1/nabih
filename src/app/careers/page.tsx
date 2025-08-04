
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Cpu, PenTool, Satellite } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers | Nabih',
  description: 'Join our mission to end content bottlenecks. We are looking for passionate individuals to help us build the future of content creation.',
  alternates: {
    canonical: '/careers',
  },
};

const openPositions = [
    {
        title: "Senior AI Engineer",
        department: "Engineering",
        location: "Remote",
        icon: <Cpu className="h-6 w-6 text-primary"/>,
        description: "You'll be at the forefront of developing and refining the AI models that power our entire suite of tools. If you dream in algorithms, we want to talk to you."
    },
    {
        title: "Content Marketing Lead",
        department: "Marketing",
        location: "Remote",
        icon: <PenTool className="h-6 w-6 text-primary"/>,
        description: "Use our own tools to create a content machine that drives growth. You'll own the content strategy from top to bottom."
    },
     {
        title: "Customer Success Manager",
        department: "Support",
        location: "Remote",
        icon: <Satellite className="h-6 w-6 text-primary"/>,
        description: "Be the voice of Nabih and the champion of our users. You'll help our customers get the most out of the platform and build a thriving community."
    }
]

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Help Us Build the <span className="text-primary">Future of Content</span>.
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              We're a small, ambitious team on a mission to eliminate content bottlenecks for creators and agencies everywhere. If you're passionate about AI, technology, and building amazing products, you're in the right place.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-headline font-bold mb-8 text-center">Open Positions</h2>
             <div className="space-y-6">
                {openPositions.map((position) => (
                    <Card key={position.title} className="glass-card hover:border-primary/50 transition-colors">
                        <CardHeader className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">
                                <CardTitle>{position.title}</CardTitle>
                                <CardDescription>
                                    {position.department} &middot; {position.location}
                                </CardDescription>
                            </div>
                            <div className="flex md:justify-end">
                                 <Button>Apply Now <ArrowRight className="ml-2 h-4 w-4"/></Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 p-3 rounded-full mt-1">
                                    {position.icon}
                                </div>
                                <p className="text-muted-foreground">{position.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
             </div>
             
             <div className="text-center mt-12">
                <h3 className="text-2xl font-headline font-semibold">Don't see your role?</h3>
                <p className="text-muted-foreground mt-2">We're always looking for talented people. Send your resume to <a href="mailto:careers@nabih.ai" className="text-primary underline">careers@nabih.ai</a>.</p>
             </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
