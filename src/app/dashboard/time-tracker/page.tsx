
// src/app/dashboard/time-tracker/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, Play, Square, Trash2, Timer } from 'lucide-react';
import { format, formatDistanceStrict } from 'date-fns';

interface TimeEntry {
    id: string;
    task: string;
    startTime: string;
    endTime: string;
    duration: string;
    notes: string;
}

const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function TimeTrackerPage() {
    const { toast } = useToast();
    const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>("time-entries", []);
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [task, setTask] = useState("");
    const [notes, setNotes] = useState("");
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<Date | null>(null);

    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning]);

    const handleStart = () => {
        if (!task.trim()) {
            toast({ title: "Task is required", description: "Please enter a task description before starting.", variant: "destructive" });
            return;
        }
        setIsRunning(true);
        setElapsedTime(0);
        startTimeRef.current = new Date();
    };

    const handleStop = () => {
        setIsRunning(false);
        if (!startTimeRef.current) return;

        const newEntry: TimeEntry = {
            id: Date.now().toString(),
            task,
            startTime: startTimeRef.current.toISOString(),
            endTime: new Date().toISOString(),
            duration: formatDuration(elapsedTime),
            notes,
        };

        setTimeEntries(prev => [newEntry, ...prev]);
        setTask("");
        setNotes("");
        setElapsedTime(0);
        toast({ title: "Time Entry Saved", description: `Task "${newEntry.task}" saved with duration ${newEntry.duration}.` });
    };

    const handleDelete = (id: string) => {
        setTimeEntries(prev => prev.filter(entry => entry.id !== id));
        toast({ title: "Entry Deleted", description: "The time entry has been removed." });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">Advanced Time Tracker</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Track your work hours with precision. Start the timer for a task, add notes as you go, and maintain a clear log of your billable time.
                </p>
            </div>
            
            <Card className="bg-gradient-to-br from-primary/10 to-background">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Timer className="h-6 w-6 text-primary"/>
                        Current Session
                    </CardTitle>
                    <CardDescription>
                        {isRunning ? "A timer is currently active." : "Start a new work session."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-background/50">
                        <div className="text-5xl font-mono font-bold text-primary tabular-nums">
                            {formatDuration(elapsedTime)}
                        </div>
                        <div className="flex-grow space-y-2">
                            <Label htmlFor="task-input">Task Description</Label>
                            <Input 
                                id="task-input" 
                                placeholder="e.g., Designing the new homepage" 
                                value={task} 
                                onChange={(e) => setTask(e.target.value)}
                                disabled={isRunning}
                            />
                        </div>
                         <div className="flex items-center gap-2">
                            <Button size="lg" onClick={handleStart} disabled={isRunning} className="w-32">
                                <Play className="mr-2"/> Start
                            </Button>
                            <Button size="lg" onClick={handleStop} disabled={!isRunning} variant="destructive" className="w-32">
                                <Square className="mr-2"/> Stop
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="notes-input">Session Notes</Label>
                        <Textarea 
                            id="notes-input" 
                            placeholder="e.g., Finalized hero section, implemented feedback on CTA..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            disabled={!isRunning}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Time Log</CardTitle>
                    <CardDescription>A record of all your past work sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                     {timeEntries.length === 0 ? (
                         <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                            <p>Your logged time entries will appear here.</p>
                        </div>
                     ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {timeEntries.map(entry => (
                                    <TableRow key={entry.id}>
                                        <TableCell>
                                            <p className="font-medium">{entry.task}</p>
                                            <p className="text-xs text-muted-foreground">{entry.notes}</p>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{entry.duration}</Badge></TableCell>
                                        <TableCell>{format(new Date(entry.startTime), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
