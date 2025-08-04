// src/app/updates/page.tsx
"use client";

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Bot, Wand2, CheckCircle, Sparkles } from 'lucide-react';
import { contentSuiteNav, seoSuiteNav, siteManagementNav, agencyToolkitNav } from '@/lib/nav-data';

const toolCategories = [
    { title: "Content Suite", tools: contentSuiteNav, icon: <Wand2 className="h-6 w-6 text-primary"/> },
    { title: "SEO Suite", tools: seoSuiteNav, icon: <Rocket className="h-6 w-6 text-primary"/> },
    { title: "Site Management", tools: siteManagementNav, icon: <Bot className="h-6 w-6 text-primary"/> },
    { title: "Agency Toolkit", tools: agencyToolkitNav, icon: <Sparkles className="h-6 w-6 text-primary"/> },
];

export default function UpdatesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Platform <span className="text-primary">Features & Updates</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              We're constantly shipping new features and improvements. Here's a look at the powerful tools currently available in your Nabih toolkit.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="relative border-l-2 border-primary/20 pl-8 space-y-12">
                {toolCategories.map((category) => (
                    <div key={category.title}>
                        <div className="absolute -left-5 h-10 w-10 bg-background border-2 border-primary/50 rounded-full flex items-center justify-center">
                            {category.icon}
                        </div>
                         <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>{category.title}</CardTitle>
                                <CardDescription>All the tools available in the {category.title}.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {category.tools.map(tool => (
                                        <li key={tool.label} className="flex items-center gap-3">
                                            <Badge variant="default" className="flex-shrink-0">
                                                Active
                                            </Badge>
                                            <p className="text-muted-foreground">{tool.label}</p>
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
