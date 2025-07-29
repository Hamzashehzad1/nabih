import { WifiOff } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function OfflinePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center p-8">
          <WifiOff className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
          <h1 className="text-4xl font-bold font-headline mb-2">You're Offline</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            It looks like you've lost your connection. This page hasn't been cached yet, but other pages might be available.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
