
"use client";

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-headline font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <Card className="glass-card">
              <CardContent className="pt-6 space-y-6">
                <section>
                  <h2 className="text-2xl font-headline font-semibold mb-2">1. Introduction</h2>
                  <p className="text-muted-foreground">
                    Welcome to Nabih! These Terms of Service ("Terms") govern your use of our website and services. By accessing or using our platform, you agree to be bound by these Terms.
                  </p>
                </section>
                <section>
                  <h2 className="text-2xl font-headline font-semibold mb-2">2. User Accounts</h2>
                  <p className="text-muted-foreground">
                    When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
                  </p>
                </section>
                <section>
                  <h2 className="text-2xl font-headline font-semibold mb-2">3. Content</h2>
                  <p className="text-muted-foreground">
                    Our service allows you to generate and manage content. You are responsible for the content that you generate, including its legality, reliability, and appropriateness. You retain all of your rights to any content you submit, post or display on or through the service.
                  </p>
                </section>
                <section>
                  <h2 className="text-2xl font-headline font-semibold mb-2">4. Prohibited Uses</h2>
                  <p className="text-muted-foreground">
                    You may use our service only for lawful purposes. You agree not to use the service in any way that violates any applicable national or international law or regulation.
                  </p>
                </section>
                 <section>
                  <h2 className="text-2xl font-headline font-semibold mb-2">5. Limitation of Liability</h2>
                  <p className="text-muted-foreground">
                    In no event shall Nabih, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
