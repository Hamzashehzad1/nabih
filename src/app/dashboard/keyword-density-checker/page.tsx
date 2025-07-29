// src/app/dashboard/keyword-density-checker/page.tsx
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Type, Percent } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';

interface DensityResult {
  keyword: string;
  count: number;
  density: string;
}

const stopWords = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 
  'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 
  'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 
  'just', 'don', 'should', 'now'
]);

export default function KeywordDensityCheckerPage() {
    const [text, setText] = useState('');
    
    const { wordCount, oneWord, twoWords, threeWords } = useMemo(() => {
        const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
        const filteredWords = words.filter(word => !stopWords.has(word));
        
        const getPhraseDensity = (n: number) => {
            if (words.length < n) return [];
            const phraseCounts: Record<string, number> = {};
            for (let i = 0; i <= filteredWords.length - n; i++) {
                const phrase = filteredWords.slice(i, i + n).join(' ');
                phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
            }
            return Object.entries(phraseCounts)
                .map(([keyword, count]) => ({
                    keyword,
                    count,
                    density: ((count / words.length) * 100).toFixed(2) + '%'
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20);
        };

        return {
            wordCount: words.length,
            oneWord: getPhraseDensity(1),
            twoWords: getPhraseDensity(2),
            threeWords: getPhraseDensity(3),
        };
    }, [text]);

    const renderTable = (data: DensityResult[]) => (
        <ScrollArea className="h-[400px]">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Keyword/Phrase</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Density</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(item => (
                        <TableRow key={item.keyword}>
                            <TableCell className="font-medium">{item.keyword}</TableCell>
                            <TableCell className="text-right">{item.count}</TableCell>
                            <TableCell className="text-right">{item.density}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    );

    return (
        <div className="grid gap-8 md:grid-cols-2 items-start">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-headline font-bold">Keyword Density Checker</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Analyze your text to find the frequency of keywords and phrases. Useful for avoiding keyword stuffing and ensuring balanced content.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Enter Your Text</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea 
                            placeholder="Paste your article content here..." 
                            className="h-96"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </CardContent>
                    <CardFooter>
                        <div className="text-sm text-muted-foreground">
                            Word Count: {wordCount}
                        </div>
                    </CardFooter>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Density Results</CardTitle>
                    <CardDescription>Top 20 one, two, and three-word phrases found in your text.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="one-word">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="one-word">One Word</TabsTrigger>
                            <TabsTrigger value="two-words">Two Words</TabsTrigger>
                            <TabsTrigger value="three-words">Three Words</TabsTrigger>
                        </TabsList>
                        <TabsContent value="one-word">
                            {oneWord.length > 0 ? renderTable(oneWord) : <p className="text-center text-muted-foreground p-8">No keywords to show.</p>}
                        </TabsContent>
                        <TabsContent value="two-words">
                             {twoWords.length > 0 ? renderTable(twoWords) : <p className="text-center text-muted-foreground p-8">No two-word phrases found.</p>}
                        </TabsContent>
                        <TabsContent value="three-words">
                             {threeWords.length > 0 ? renderTable(threeWords) : <p className="text-center text-muted-foreground p-8">No three-word phrases found.</p>}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
