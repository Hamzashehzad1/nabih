// src/app/dashboard/gdpr-compliance/page.tsx
"use client";

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const complianceItems = [
    {
        id: 'privacy-policy',
        title: 'Have a Clear and Accessible Privacy Policy',
        description: 'Your privacy policy must be easy to understand and access. It should detail what data you collect, why you collect it, how you process it, and who you share it with.',
    },
    {
        id: 'cookie-consent',
        title: 'Implement a Compliant Cookie Consent Banner',
        description: 'You must obtain explicit and informed consent from users before placing any non-essential cookies on their device. "Implied consent" is not enough. The banner must allow users to accept or reject different categories of cookies.',
    },
    {
        id: 'data-subject-rights',
        title: 'Establish a Process for Data Subject Rights',
        description: 'Users have the right to access, rectify, erase, and port their data. You need a clear process for users to submit these requests and for you to respond to them within one month.',
    },
    {
        id: 'contact-form-consent',
        title: 'Add Consent Checkboxes to Forms',
        description: 'Any form that collects personal data (contact forms, newsletter sign-ups) must have an unticked checkbox for users to consent to their data being used for specific purposes.',
    },
    {
        id: 'data-security',
        title: 'Ensure Data Security Measures are in Place',
        description: 'You must take appropriate technical and organizational measures to protect personal data from unauthorized access, loss, or destruction. This includes using HTTPS, secure passwords, and limiting access to data.',
    },
    {
        id: 'data-breach-plan',
        title: 'Have a Data Breach Notification Plan',
        description: 'In the event of a data breach that poses a risk to individuals, you must notify the relevant supervisory authority within 72 hours. You should have a clear plan for how to detect, report, and manage breaches.',
    },
    {
        id: 'third-party-compliance',
        title: 'Verify Third-Party Service Compliance',
        description: 'If you use third-party services that process user data on your behalf (e.g., Google Analytics, Mailchimp), you must ensure they are also GDPR compliant. Check their Data Processing Agreements (DPAs).',
    }
];

export default function GdprCompliancePage() {
    const [checkedState, setCheckedState] = useLocalStorage<Record<string, boolean>>('gdpr-checklist', {});

    const handleCheckboxChange = (id: string, checked: boolean) => {
        setCheckedState(prev => ({ ...prev, [id]: checked }));
    };
    
    const completedCount = Object.values(checkedState).filter(Boolean).length;
    const totalCount = complianceItems.length;
    const progressPercentage = (completedCount / totalCount) * 100;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">GDPR Compliance Checklist</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Use this checklist to review key GDPR requirements for your website. Completing this checklist is a step towards compliance, but does not guarantee it.
                </p>
            </div>

            <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Not Legal Advice</AlertTitle>
                <AlertDescription>
                    This checklist is for informational purposes only and is not a substitute for professional legal advice. Always consult with a qualified lawyer to ensure your website and business practices are fully compliant with GDPR and other applicable regulations.
                </AlertDescription>
            </Alert>
            
            <Card>
                <CardHeader>
                    <CardTitle>Compliance Progress</CardTitle>
                    <div className="flex items-center gap-4 pt-2">
                        <Progress value={progressPercentage} className="w-full" />
                        <span className="text-lg font-bold">{completedCount} / {totalCount}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {complianceItems.map(item => (
                            <AccordionItem value={item.id} key={item.id}>
                                <div className="flex items-center p-4 border-b">
                                    <Checkbox
                                        id={item.id}
                                        checked={!!checkedState[item.id]}
                                        onCheckedChange={(checked) => handleCheckboxChange(item.id, !!checked)}
                                        className="h-6 w-6 mr-4"
                                    />
                                    <AccordionTrigger className="flex-1 text-left">
                                        <Label htmlFor={item.id} className="text-base font-semibold cursor-pointer">
                                            {item.title}
                                        </Label>
                                    </AccordionTrigger>
                                </div>
                                <AccordionContent className="p-4">
                                    <p className="text-muted-foreground">
                                        {item.description}
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

        </div>
    );
}
