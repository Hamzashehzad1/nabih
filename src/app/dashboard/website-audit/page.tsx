
"use client";

import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Globe, Loader2, Activity, CheckCircle, AlertTriangle, ShieldCheck, TrendingUp, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { runWebsiteAudit, type AuditResults } from './actions';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';


interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
};

export default function WebsiteAuditPage() {
    const { toast } = useToast();
    const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditStatus, setAuditStatus] = useState('');
    const [auditResults, setAuditResults] = useState<AuditResults | null>(null);

    const selectedSite = sites.find(s => s.id === selectedSiteId);

    const handleRunAudit = async () => {
        if (!selectedSite) return;

        setIsAuditing(true);
        setAuditResults(null);
        
        const statuses = [
            "Analyzing Core Web Vitals...",
            "Checking mobile-friendliness...",
            "Scanning for security vulnerabilities...",
            "Auditing on-page SEO factors...",
            "Finalizing report...",
        ];

        for (const status of statuses) {
            setAuditStatus(status);
            await new Promise(res => setTimeout(res, 1000 + Math.random() * 500));
        }

        const results = await runWebsiteAudit(selectedSite.url);
        setAuditResults(results);
        setIsAuditing(false);
        setAuditStatus('');
        toast({ title: "Audit Complete!", description: `Finished auditing ${selectedSite.url}` });
    };

    const renderSiteSelection = () => (
        <Card>
            <CardHeader>
                <CardTitle>1. Select a Site to Audit</CardTitle>
                <CardDescription>Choose the WordPress site you want to analyze.</CardDescription>
            </CardHeader>
            <CardContent>
                {sites.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                        <Globe className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">Connect a Site to Begin</h3>
                        <p className="mt-1 text-sm">Go to settings to connect your WordPress site.</p>
                        <Button asChild size="sm" className="mt-4">
                            <Link href="/dashboard/settings">Go to Settings</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sites.map(site => (
                            <Card 
                                key={site.id} 
                                onClick={() => setSelectedSiteId(site.id)}
                                className={cn("cursor-pointer hover:border-primary transition-colors", selectedSiteId === site.id && "border-primary ring-2 ring-primary")}
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" />
                                        {new URL(site.url).hostname}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
    
    const renderAuditRunner = () => (
        <Card>
            <CardHeader>
                <CardTitle>2. Run Website Audit</CardTitle>
                <CardDescription>
                    This audit will check for performance, SEO, security, and overall site health issues.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleRunAudit} disabled={isAuditing}>
                    {isAuditing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Auditing...
                        </>
                    ) : (
                        <>
                           <Activity className="mr-2 h-4 w-4" /> Start Audit
                        </>
                    )}
                </Button>
                 {isAuditing && (
                    <div className="mt-4 space-y-2">
                        <Progress value={(auditStatus.length / 25) * 100} className="w-full" />
                        <p className="text-sm text-muted-foreground">{auditStatus}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const renderAuditResults = () => {
        if (!auditResults) return null;

        const { performance, seo, security, health } = auditResults;
        const performanceChartData = [
            { name: "FCP", value: performance.fcp, fill: "var(--color-fcp)" },
            { name: "LCP", value: performance.lcp, fill: "var(--color-lcp)" },
            { name: "CLS", value: performance.cls, fill: "var(--color-cls)" },
            { name: "TTI", value: performance.tti, fill: "var(--color-tti)" },
        ];
        const chartConfig = {
            fcp: { label: "FCP", color: "hsl(var(--chart-1))" },
            lcp: { label: "LCP", color: "hsl(var(--chart-2))" },
            cls: { label: "CLS", color: "hsl(var(--chart-3))" },
            tti: { label: "TTI", color: "hsl(var(--chart-4))" },
        };

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Audit Results for {new URL(selectedSite!.url).hostname}</CardTitle>
                    <CardDescription>Review the findings below and take action to improve your site.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                               <TrendingUp className="h-6 w-6" />
                               <CardTitle>Performance</CardTitle>
                            </div>
                            <span className={cn("text-3xl font-bold", getScoreColor(performance.score))}>{performance.score}</span>
                        </CardHeader>
                        <CardContent>
                             <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                <BarChart data={performanceChartData} layout="vertical" margin={{ left: 10 }}>
                                    <XAxis type="number" dataKey="value" hide />
                                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} />
                                    <CartesianGrid horizontal={false} />
                                     <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                        />
                                    <Bar dataKey="value" radius={5} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                             <div className="flex items-center gap-2">
                               <ShieldCheck className="h-6 w-6" />
                               <CardTitle>Security</CardTitle>
                            </div>
                            <span className={cn("text-3xl font-bold", getScoreColor(security.score))}>{security.score}</span>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                {security.recommendations.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        {item.status === 'pass' ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                                        <span>{item.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                               <Globe className="h-6 w-6" />
                               <CardTitle>SEO</CardTitle>
                            </div>
                            <span className={cn("text-3xl font-bold", getScoreColor(seo.score))}>{seo.score}</span>
                        </CardHeader>
                        <CardContent>
                           <ul className="space-y-2 text-sm">
                                {seo.recommendations.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        {item.status === 'pass' ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                                        <span>{item.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                               <HeartPulse className="h-6 w-6" />
                               <CardTitle>Site Health</CardTitle>
                            </div>
                           <span className={cn("text-3xl font-bold", getScoreColor(health.score))}>{health.score}</span>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                {health.recommendations.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        {item.status === 'pass' ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                                        <span>{item.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        );
    }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Website Audit</h1>
        <p className="text-muted-foreground max-w-2xl">
          Analyze your website's performance, SEO, security, and more to identify areas for improvement.
        </p>
      </div>
      
      {!selectedSiteId && renderSiteSelection()}

      {selectedSiteId && (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Auditing: {new URL(selectedSite!.url).hostname}</CardTitle>
                        <Button variant="outline" onClick={() => setSelectedSiteId(null)}>Change Site</Button>
                    </div>
                </CardHeader>
            </Card>
            {renderAuditRunner()}
            {auditResults && renderAuditResults()}
        </div>
      )}
    </div>
  );
}
