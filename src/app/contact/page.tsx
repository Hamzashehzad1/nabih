
"use client";

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Metadata } from 'next';

// Although metadata can't be used in client components, we can define it for static rendering
// export const metadata: Metadata = {
//   title: 'Contact Us | Nabih',
//   description: 'Get in touch with the Nabih team. We are here to answer your questions about our AI content toolkit, discuss enterprise plans, or receive your feedback.',
//   alternates: {
//     canonical: '/contact',
//   },
// };

export default function ContactPage() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "Thank you for reaching out. We'll get back to you shortly.",
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Get In <span className="text-primary">Touch</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Have a question, feedback, or a brilliant idea? We'd love to hear from you. Fill out the form below or use the contact details provided, and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Our team typically responds within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Your Name" required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="How can we help?" rows={5} required/>
                  </div>
                  <Button type="submit" className="w-full">
                    Submit Message
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-8">
              <h2 className="text-2xl font-headline font-semibold">Contact Information</h2>
              <p className="text-muted-foreground">
                You can also reach us through these channels. For support questions, please use the form for the fastest response. We look forward to connecting with you!
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-md">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email Us</h3>
                    <a href="mailto:hello@nabih.ai" className="text-primary hover:underline">
                      hello@nabih.ai
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-md">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Call Us</h3>
                    <a href="tel:+1-555-123-4567" className="text-primary hover:underline">
                      +1 (555) 123-4567
                    </a>
                  </div>
                </div>
                 <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-md">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Our Office</h3>
                    <p className="text-muted-foreground">123 AI Lane, Tech City, 12345</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
