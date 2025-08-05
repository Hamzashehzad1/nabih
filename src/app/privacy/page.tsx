
"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent } from '@/components/ui/card';
import Head from 'next/head';

export default function PrivacyPolicyPage() {
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy",
    "url": "https://nabih.ai/privacy"
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
        />
      </Head>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-headline font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground mb-8">Last Updated: {lastUpdated}</p>
              
              <Card className="glass-card">
                <CardContent className="pt-6 space-y-6">
                  <section>
                    <h2 className="text-2xl font-headline font-semibold mb-2">1. Information We Collect</h2>
                    <p className="text-muted-foreground">
                      We collect information you provide directly to us, such as when you create an account (name, email). We also collect information automatically, such as your IP address and usage data, through cookies and similar technologies.
                    </p>
                  </section>
                  <section>
                    <h2 className="text-2xl font-headline font-semibold mb-2">2. How We Use Your Information</h2>
                    <p className="text-muted-foreground">
                      We use the information we collect to operate, maintain, and provide the features and functionality of our service, to communicate with you, and to personalize your experience.
                    </p>
                  </section>
                  <section>
                    <h2 className="text-2xl font-headline font-semibold mb-2">3. Data Security</h2>
                    <p className="text-muted-foreground">
                      We use commercially reasonable safeguards to help keep the information collected through the service secure. However, no security system is impenetrable, and we cannot guarantee the security of our systems 100%.
                    </p>
                  </section>
                  <section>
                    <h2 className="text-2xl font-headline font-semibold mb-2">4. Your Data Rights</h2>
                    <p className="text-muted-foreground">
                      Depending on your location, you may have rights regarding your personal information, including the right to access, correct, or delete your data. Please contact us to exercise your rights.
                    </p>
                  </section>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
