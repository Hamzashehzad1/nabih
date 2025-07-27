// src/app/dashboard/advanced-media-library/connect/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CloudConnectPage() {
  const searchParams = useSearchParams();
  const service = searchParams.get('service');

  useEffect(() => {
    if (window.opener && service) {
      // Simulate API call and authentication
      const timeout = setTimeout(() => {
        const isSuccess = Math.random() > 0.1; // 90% success rate
        if (isSuccess) {
          window.opener.postMessage({ type: `cloud-auth-${service}`, status: 'success' }, window.location.origin);
        } else {
           window.opener.postMessage({ type: `cloud-auth-${service}`, status: 'error' }, window.location.origin);
        }
      }, 2000); // 2-second delay to simulate auth

      return () => clearTimeout(timeout);
    }
  }, [service]);

  const serviceName = service === 'gdrive' ? 'Google Drive' : service === 'dropbox' ? 'Dropbox' : 'Cloud Service';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <h1 className="mt-4 text-2xl font-bold">
          Connecting to {serviceName}...
        </h1>
        <p className="mt-2 text-muted-foreground">
          Please follow the instructions in this window.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
            You will be redirected back to the application shortly.
        </p>
      </div>
    </div>
  );
}
