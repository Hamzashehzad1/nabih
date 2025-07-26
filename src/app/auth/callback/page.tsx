// src/app/auth/callback/page.tsx
'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    if (window.opener) {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'signInSuccess') {
        window.opener.postMessage('auth-success', window.location.origin);
      }
      window.close();
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Please wait, redirecting...</p>
    </div>
  );
}
