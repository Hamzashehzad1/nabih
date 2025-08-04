
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Cpu, PenTool, Satellite, Loader2 } from 'lucide-react';

const openPositions = [
    {
        title: "Senior AI Engineer",
        department: "Engineering",
        location: "Remote",
        icon: <Cpu className="h-6 w-6 text-primary"/>,
        description: "You'll be at the forefront of developing and refining the AI models that power our entire suite of tools. If you dream in algorithms, we want to talk to you."
    },
    {
        title: "Content Marketing Lead",
        department: "Marketing",
        location: "Remote",
        icon: <PenTool className="h-6 w-6 text-primary"/>,
        description: "Use our own tools to create a content machine that drives growth. You'll own the content strategy from top to bottom."
    },
     {
        title: "Customer Success Manager",
        department: "Support",
        location: "Remote",
        icon: <Satellite className="h-6 w-6 text-primary"/>,
        description: "Be the voice of Nabih and the champion of our users. You'll help our customers get the most out of the platform and build a thriving community."
    }
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const applicationSchema = z.object({
    name: z.string().min(2, { message: "Full name is required." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().optional(),
    coverLetter: z.string().optional(),
    resume: z.any()
      .refine((files) => files?.length == 1, "Resume is required.")
      .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
      .refine(
        (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
        ".pdf, .doc, and .docx files are accepted."
      ),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function CareersPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    const form = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            coverLetter: '',
            resume: undefined,
        }
    });
    
    const { register } = form; // To handle file input

    const onSubmit = async (values: ApplicationFormValues, positionTitle: string) => {
        setIsSubmitting(true);
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log({ position: positionTitle, ...values });
        setIsSubmitting(false);
        setOpenDialogs(prev => ({...prev, [positionTitle]: false}));
        form.reset();
        toast({
            title: "Application Sent!",
            description: `Your application for the ${positionTitle} role has been submitted.`,
        });
    };
    
    const handleOpenChange = (isOpen: boolean, positionTitle: string) => {
        setOpenDialogs(prev => ({ ...prev, [positionTitle]: isOpen }));
        if (!isOpen) {
            form.reset();
        }
    }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Help Us Build the <span className="text-primary">Future of Content</span>.
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              We're a small, ambitious team on a mission to eliminate content bottlenecks for creators and agencies everywhere. If you're passionate about AI, technology, and building amazing products, you're in the right place.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-headline font-bold mb-8 text-center">Open Positions</h2>
             <div className="space-y-6">
                {openPositions.map((position) => (
                    <Card key={position.title} className="glass-card hover:border-primary/50 transition-colors">
                        <CardHeader className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">
                                <CardTitle>{position.title}</CardTitle>
                                <CardDescription>
                                    {position.department} &middot; {position.location}
                                </CardDescription>
                            </div>
                            <div className="flex md:justify-end">
                                 <Dialog open={openDialogs[position.title]} onOpenChange={(open) => handleOpenChange(open, position.title)}>
                                    <DialogTrigger asChild>
                                        <Button>Apply Now <ArrowRight className="ml-2 h-4 w-4"/></Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[625px]">
                                        <DialogHeader>
                                            <DialogTitle>Apply for {position.title}</DialogTitle>
                                            <DialogDescription>
                                                Fill out the form below to submit your application. We're excited to hear from you!
                                            </DialogDescription>
                                        </DialogHeader>
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit((data) => onSubmit(data, position.title))} className="space-y-4">
                                                <FormField control={form.control} name="name" render={({ field }) => (
                                                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="email" render={({ field }) => (
                                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="phone" render={({ field }) => (
                                                    <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input placeholder="+1 (555) 123-4567" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="coverLetter" render={({ field }) => (
                                                    <FormItem><FormLabel>Cover Letter (Optional)</FormLabel><FormControl><Textarea placeholder="Tell us why you're a great fit..." {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="resume" render={({ field: { onChange, ...fieldProps } }) => (
                                                    <FormItem>
                                                        <FormLabel>CV / Resume</FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                type="file"
                                                                accept=".pdf,.doc,.docx"
                                                                {...register("resume")}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <DialogFooter>
                                                    <Button type="submit" disabled={isSubmitting}>
                                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                        Submit Application
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 p-3 rounded-full mt-1">
                                    {position.icon}
                                </div>
                                <p className="text-muted-foreground">{position.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
             </div>
             
             <div className="text-center mt-12">
                <h3 className="text-2xl font-headline font-semibold">Don't see your role?</h3>
                <p className="text-muted-foreground mt-2">We're always looking for talented people. Send your resume to <a href="mailto:careers@nabih.ai" className="text-primary underline">careers@nabih.ai</a>.</p>
             </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
