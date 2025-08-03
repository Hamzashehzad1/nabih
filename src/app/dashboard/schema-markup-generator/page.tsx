// src/app/dashboard/schema-markup-generator/page.tsx
"use client";

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Code2, Copy, Trash2, PlusCircle, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const articleSchema = z.object({
  headline: z.string().min(1, "Headline is required"),
  author: z.string().min(1, "Author name is required"),
  publisher: z.string().min(1, "Publisher name is required"),
  publisherLogoUrl: z.string().url("Must be a valid URL"),
  imageUrl: z.string().url("Must be a valid URL"),
  datePublished: z.string().min(1, "Date is required"),
});

const faqSchema = z.object({
  faqs: z.array(z.object({
    question: z.string().min(1, "Question is required"),
    answer: z.string().min(1, "Answer is required"),
  })).min(1, "Add at least one FAQ"),
});

type ArticleFormData = z.infer<typeof articleSchema>;
type FaqFormData = z.infer<typeof faqSchema>;

export default function SchemaMarkupGeneratorPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('article');

    const articleForm = useForm<ArticleFormData>({
        resolver: zodResolver(articleSchema),
        defaultValues: { headline: '', author: '', publisher: '', publisherLogoUrl: '', imageUrl: '', datePublished: new Date().toISOString().split('T')[0] }
    });

    const faqForm = useForm<FaqFormData>({
        resolver: zodResolver(faqSchema),
        defaultValues: { faqs: [{ question: '', answer: '' }] }
    });

    const { fields, append, remove } = useFieldArray({
        control: faqForm.control,
        name: "faqs"
    });

    const articleData = articleForm.watch();
    const faqData = faqForm.watch();

    const generatedSchema = useMemo(() => {
        let schema: any = {};
        if (activeTab === 'article') {
            schema = {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": articleData.headline,
                "image": [articleData.imageUrl],
                "datePublished": new Date(articleData.datePublished).toISOString(),
                "author": [{ "@type": "Person", "name": articleData.author }],
                "publisher": { "@type": "Organization", "name": articleData.publisher, "logo": { "@type": "ImageObject", "url": articleData.publisherLogoUrl } }
            };
        } else if (activeTab === 'faq') {
            schema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqData.faqs.map(faq => ({
                    "@type": "Question",
                    "name": faq.question,
                    "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
                }))
            };
        }
        return JSON.stringify(schema, null, 2);
    }, [activeTab, articleData, faqData]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`<script type="application/ld+json">${generatedSchema}</script>`);
        toast({ title: "Copied!", description: "Schema script copied to clipboard." });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">Schema Markup Generator</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Generate JSON-LD schema markup for your website to improve how search engines read and represent your page in SERPs.
                </p>
            </div>
            
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>How to Use</AlertTitle>
                <AlertDescription>
                   Generate the schema, copy the code, and paste it into the `<head>` section of your webpage's HTML. Many WordPress SEO plugins also have a field for custom schema.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Schema Details</CardTitle>
                        <CardDescription>Select a schema type and fill in the details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="article" onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="article">Article</TabsTrigger>
                                <TabsTrigger value="faq">FAQ</TabsTrigger>
                            </TabsList>
                            <TabsContent value="article" className="space-y-4 pt-4">
                                <Label>Headline</Label><Input {...articleForm.register('headline')} />
                                <Label>Author Name</Label><Input {...articleForm.register('author')} />
                                <Label>Publisher Name</Label><Input {...articleForm.register('publisher')} />
                                <Label>Publisher Logo URL</Label><Input {...articleForm.register('publisherLogoUrl')} />
                                <Label>Featured Image URL</Label><Input {...articleForm.register('imageUrl')} />
                                <Label>Date Published</Label><Input type="date" {...articleForm.register('datePublished')} />
                            </TabsContent>
                            <TabsContent value="faq" className="space-y-4 pt-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded-lg space-y-2 relative">
                                        <Label>Question</Label>
                                        <Input {...faqForm.register(`faqs.${index}.question`)} />
                                        <Label>Answer</Label>
                                        <Textarea {...faqForm.register(`faqs.${index}.answer`)} />
                                        <Button variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={() => append({ question: '', answer: '' })}><PlusCircle className="mr-2" /> Add FAQ</Button>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Generated JSON-LD</CardTitle>
                            <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="mr-2" /> Copy Script</Button>
                        </div>
                        <CardDescription>This is the generated schema markup. Add it to your site.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-black text-white p-4 rounded-md font-mono text-sm overflow-x-auto max-h-[600px]">
                            <pre><code>{`<script type="application/ld+json">\n${generatedSchema}\n</script>`}</code></pre>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}