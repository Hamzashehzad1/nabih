
// src/app/adminlogin/page.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const auth = getAuth(app);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On successful admin login, redirect to the admin-specific part of the dashboard
      router.push('/dashboard/admin-analytics');
    } catch (error: any) {
      toast({
        title: 'Admin Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/">
            <Logo className="inline-flex" />
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
               <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Admin Access</CardTitle>
            <CardDescription>
              Please enter your administrator credentials to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@nabih.ai"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log In as Admin
              </Button>
            </form>
             <div className="mt-6 text-center text-sm">
                <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                  Return to user login
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
