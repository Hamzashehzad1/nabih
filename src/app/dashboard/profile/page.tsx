
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { getAuth, updateProfile, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setName(currentUser.displayName || '');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName: name });
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    setIsUploading(true);

    // This is a mock upload. In a real app, you would upload to Firebase Storage
    // and then update the user's photoURL.
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const file = event.target.files[0];
    const mockPhotoURL = URL.createObjectURL(file);

    try {
      // To show the change instantly in the UI, we'll update the state.
      // In a real app, you would get the URL from storage and use updateProfile.
      setUser({ ...user, photoURL: mockPhotoURL } as User); 
      // await updateProfile(user, { photoURL: realStorageUrl });
      toast({
        title: "Success",
        description: "Profile picture updated.",
      });
    } catch (error: any) {
        toast({
            title: "Error",
            description: "Failed to upload picture: " + error.message,
            variant: "destructive",
        });
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and personal information.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your name and email address.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
              </div>
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password. It's a good idea to use a strong password that you're not using elsewhere.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button>Change Password</Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your avatar.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Input 
                id="picture" 
                type="file" 
                className="text-sm"
                onChange={handlePictureUpload}
                accept="image/png, image/jpeg"
                disabled={isUploading}
              />
              <Button className="w-full" disabled={isUploading} onClick={() => document.getElementById('picture')?.click()}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload Picture
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
