// src/app/dashboard/brand-kit-generator/page.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Palette, Sparkles, Wand2, ArrowRight, ArrowLeft, Copy, Download, RefreshCw, Check, Upload, Bot, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generateBrandKit, type GenerateBrandKitOutput } from "@/ai/flows/generate-brand-kit";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const formSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  websiteType: z.enum(['Blog', 'Portfolio', 'Online Store', 'Service-based', 'Landing Page', 'Membership/Community', 'Other']),
  targetAudience: z.string().min(10, "Target audience must be at least 10 characters"),
  hasLogo: z.boolean(),
});


type FormValues = z.infer<typeof formSchema>;

export default function BrandKitGeneratorPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedKit, setGeneratedKit] = useState<GenerateBrandKitOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      description: "",
      websiteType: 'Blog',
      targetAudience: "",
      hasLogo: false,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedKit(null);
    try {
      const result = await generateBrandKit(data);
      setGeneratedKit(result);
    } catch (error) {
      console.error("Error generating brand kit:", error);
      toast({
        title: "Error",
        description: "Failed to generate brand kit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, entity: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: `The ${entity} has been copied.`,
    });
  };

  const handleNextStep = async () => {
    const fieldsToValidate: (keyof FormValues)[] = currentStep === 0 
      ? ['businessName', 'description', 'websiteType', 'targetAudience']
      : ['hasLogo'];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const handleRegenerate = () => {
      setGeneratedKit(null);
      setCurrentStep(0);
      form.reset();
  }

  const renderStepContent = () => {
    switch(currentStep) {
        case 0: return (
            <div className="space-y-6">
                <FormField control={form.control} name="businessName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>What is the name of your website or business?</FormLabel>
                        <FormControl><Input placeholder="e.g., Content Forge" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>What is your website about? (Brief description)</FormLabel>
                        <FormControl><Textarea placeholder="e.g., An AI-powered platform to help creators..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="websiteType" render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>What type of website are you creating?</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                {(['Blog', 'Portfolio', 'Online Store', 'Service-based', 'Landing Page', 'Membership/Community'] as const).map(type => (
                                    <FormItem key={type} className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value={type} /></FormControl>
                                        <FormLabel className="font-normal">{type}</FormLabel>
                                    </FormItem>
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="targetAudience" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Who is your target audience?</FormLabel>
                        <FormControl><Textarea placeholder="e.g., Digital marketers and small business owners aged 25-45..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
        );
        case 1: return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-2xl font-bold font-headline mb-4">Do you have a logo?</h2>
                 <FormField control={form.control} name="hasLogo" render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormControl>
                             <RadioGroup onValueChange={(val) => field.onChange(val === 'true')} className="flex items-center space-x-4">
                                <Button asChild variant={field.value ? 'default' : 'outline'} size="lg" className="h-auto">
                                <Label htmlFor="hasLogoYes" className="flex flex-col items-center gap-2 p-4 cursor-pointer">
                                    <Upload className="h-8 w-8" />
                                    <span>Upload Logo</span>
                                    <RadioGroupItem value="true" id="hasLogoYes" className="sr-only"/>
                                </Label>
                                </Button>
                                <Button asChild variant={!field.value ? 'default' : 'outline'} size="lg" className="h-auto">
                                <Label htmlFor="hasLogoNo" className="flex flex-col items-center gap-2 p-4 cursor-pointer">
                                    <Bot className="h-8 w-8" />
                                    <span>Generate for me</span>
                                    <RadioGroupItem value="false" id="hasLogoNo" className="sr-only"/>
                                </Label>
                                </Button>
                            </RadioGroup>
                        </FormControl>
                    </FormItem>
                )} />
                <p className="text-muted-foreground mt-4 text-sm">Logo color extraction is coming soon! For now, we'll generate a palette based on your brand personality.</p>
            </div>
        );
        default: return null;
    }
  }

  const renderResults = () => {
    if (isLoading) {
        return (
            <div className="space-y-8">
                 <div className="flex flex-col items-center justify-center text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <h2 className="text-2xl font-bold font-headline">Generating your brand identity...</h2>
                    <p className="text-muted-foreground">The AI is mixing colors and picking fonts. This may take a moment.</p>
                </div>
                <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><div className="flex gap-4"><Skeleton className="h-24 w-24 rounded-lg" /><Skeleton className="h-24 w-24 rounded-lg" /><Skeleton className="h-24 w-24 rounded-lg" /><Skeleton className="h-24 w-24 rounded-lg" /><Skeleton className="h-24 w-24 rounded-lg" /></div></CardContent></Card>
                 <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full mt-2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardContent></Card>
            </div>
        )
    }

    if (!generatedKit) return null;
    
    const { colorPalette, colorPsychology, fontCombination, moodboard, suggestedThemes, uxTip } = generatedKit;
    const palette = [
        { name: "Primary", value: colorPalette.primary },
        { name: "Secondary", value: colorPalette.secondary },
        { name: "Accent", value: colorPalette.accent },
        { name: "Background", value: colorPalette.background },
        { name: "Text", value: colorPalette.text },
    ];

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold font-headline">Your Brand Kit is Ready!</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">Here's the brand identity our AI has crafted for "{form.getValues('businessName')}".</p>
            </div>
            
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5"/> Color Palette</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    {palette.map(color => (
                        <div key={color.name} className="flex flex-col items-center gap-2">
                             <div className="w-24 h-24 rounded-lg border flex items-center justify-center" style={{ backgroundColor: color.value }}>
                                 <div className="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-mono cursor-pointer" onClick={() => copyToClipboard(color.value, `${color.name} color`)}>{color.value}</div>
                             </div>
                             <p className="text-sm font-medium">{color.name}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Color Psychology</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{colorPsychology}</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Font Combination</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Headline</p>
                            <p className="text-4xl" style={{ fontFamily: `'${fontCombination.headline}', sans-serif` }}>{fontCombination.headline}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Body</p>
                            <p className="text-lg" style={{ fontFamily: `'${fontCombination.body}', sans-serif` }}>{fontCombination.body}</p>
                        </div>
                        <Alert>
                           <AlertTitle className="font-semibold">Reasoning</AlertTitle>
                           <AlertDescription className="text-muted-foreground">{fontCombination.reasoning}</AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Suggested Themes</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {suggestedThemes.map((theme) => (
                           <div key={theme} className="bg-muted text-muted-foreground rounded-lg p-4 text-center">
                                <p className="text-2xl font-headline font-bold">{theme}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Moodboard Image Queries</CardTitle></CardHeader>
                <CardContent>
                    <Tabs defaultValue="pexels">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="pexels">Pexels</TabsTrigger>
                            <TabsTrigger value="unsplash">Unsplash</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pexels" className="mt-4">
                           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {moodboard.pexelsQueries.map(keyword => (
                                    <div key={keyword}>
                                        <Image 
                                            src={`https://placehold.co/400x300.png`} 
                                            alt={keyword} 
                                            width={400} 
                                            height={300} 
                                            className="rounded-lg aspect-[4/3] object-cover bg-muted"
                                            data-ai-hint={keyword}
                                        />
                                        <p className="text-center text-sm mt-2 text-muted-foreground">{keyword}</p>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="unsplash" className="mt-4">
                           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {moodboard.unsplashQueries.map(keyword => (
                                    <div key={keyword}>
                                        <Image 
                                            src={`https://placehold.co/400x300.png`} 
                                            alt={keyword} 
                                            width={400} 
                                            height={300} 
                                            className="rounded-lg aspect-[4/3] object-cover bg-muted"
                                            data-ai-hint={keyword}
                                        />
                                        <p className="text-center text-sm mt-2 text-muted-foreground">{keyword}</p>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Alert variant="default" className="bg-primary/10 border-primary/20">
                <Lightbulb className="h-5 w-5 text-primary" />
                <AlertTitle className="text-primary font-bold">Bonus UX/UI Tip</AlertTitle>
                <AlertDescription className="text-primary/90">{uxTip}</AlertDescription>
            </Alert>
            
            <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleRegenerate}>
                    <RefreshCw className="mr-2" />
                    Regenerate Kit
                </Button>
                 <Button>
                    <Download className="mr-2" />
                    Save Brand Kit
                </Button>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8">
        {!generatedKit && !isLoading && (
            <div>
                <h1 className="text-3xl font-headline font-bold">Let's Build Your Brand</h1>
                <p className="text-muted-foreground max-w-2xl">
                We’ll help you generate the perfect color palette, font styles, and image suggestions — based on your business and psychology-backed design principles.
                </p>
            </div>
        )}

      <Card className={cn(isLoading || generatedKit ? "hidden" : "block")}>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Step {currentStep + 1} of 2</CardTitle>
                <div className="flex items-center gap-2">
                    <div className="relative h-2 w-24 rounded-full bg-muted">
                        <div className="absolute top-0 left-0 h-2 rounded-full bg-primary transition-all" style={{width: `${(currentStep + 1) * 50}%`}}></div>
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="min-h-[400px]">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    {renderStepContent()}
                </form>
            </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 0}>
                <ArrowLeft className="mr-2" /> Back
            </Button>
            {currentStep < 1 ? (
                <Button onClick={handleNextStep}>
                    Next <ArrowRight className="ml-2" />
                </Button>
            ) : (
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                    Generate Brand Kit
                </Button>
            )}
        </CardFooter>
      </Card>
      
      {renderResults()}
    </div>
  );
}
