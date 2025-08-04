
"use client";

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Bot, Wand2 } from 'lucide-react';

const updates = [
    {
        version: "v1.2.0",
        date: "October 26, 2023",
        title: "The Agency Toolkit Update",
        icon: <Rocket className="h-6 w-6 text-primary" />,
        changes: [
            { type: "New", description: "Launched the Agency Toolkit, including Invoice Generator, Visual Feedback, and Mockup Generator." },
            { type: "New", description: "Added White-Labeling feature to customize the WordPress admin experience." },
            { type: "Improvement", description: "Enhanced AI model for the Blog Generator to produce more structured content." },
        ]
    },
    {
        version: "v1.1.0",
        date: "September 15, 2023",
        title: "SEO & Site Management Suite",
        icon: <Bot className="h-6 w-6 text-primary" />,
        changes: [
            { type: "New", description: "Introduced the full SEO Suite with Keyword Clustering, PAA Finder, and more." },
            { type: "New", description: "Launched the AI Chatbot and Advanced Media Library for comprehensive site management." },
            { type: "Fix", description: "Resolved an issue with image uploads in the Image Generator." },
        ]
    },
     {
        version: "v1.0.0",
        date: "August 1, 2023",
        title: "Initial Launch",
        icon: <Wand2 className="h-6 w-6 text-primary" />,
        changes: [
            { type: "New", description: "Nabih launched with the core Content Suite, including the Blog Generator and Content Idea Generator." },
        ]
    }
]

export default function UpdatesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Platform <span className="text-primary">Updates</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              We're constantly shipping new features and improvements. Here's what's new at Nabih.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="relative border-l-2 border-primary/20 pl-8">
                {updates.map((update, index) => (
                    <div key={update.version} className="mb-12">
                        <div className="absolute -left-5 h-10 w-10 bg-background border-2 border-primary/50 rounded-full flex items-center justify-center">
                            {update.icon}
                        </div>
                         <Card className="glass-card">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>{update.title}</CardTitle>
                                    <div className="text-sm text-muted-foreground">{update.date}</div>
                                </div>
                                <CardDescription>Version {update.version}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {update.changes.map(change => (
                                        <li key={change.description} className="flex items-start gap-3">
                                            <Badge variant={change.type === 'New' ? 'default' : change.type === 'Improvement' ? 'secondary' : 'destructive'} className="flex-shrink-0 mt-1">
                                                {change.type}
                                            </Badge>
                                            <p className="text-muted-foreground">{change.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
