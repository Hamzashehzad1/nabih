// src/app/dashboard/admin-analytics/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Wifi, BarChart2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, subMonths, getMonth } from 'date-fns';

// This is a mock user interface. In a real app, this would come from your database.
interface MockUser {
    id: string;
    name: string;
    email: string;
    avatar: string;
    signupDate: string;
}

// Generate some mock user data
const generateMockUsers = (count: number): MockUser[] => {
    return Array.from({ length: count }, (_, i) => {
        const signupDate = subMonths(new Date(), Math.floor(Math.random() * 12));
        return {
            id: `user-${i + 1}`,
            name: `User ${i + 1}`,
            email: `user${i+1}@example.com`,
            avatar: `https://i.pravatar.cc/150?u=user${i+1}`,
            signupDate: signupDate.toISOString(),
        }
    });
};

const MOCK_USERS = generateMockUsers(50);

export default function AdminAnalyticsPage() {
    const [users] = useLocalStorage<MockUser[]>("mock-users", MOCK_USERS);
    const [onlineUsers, setOnlineUsers] = useState(0);

    useEffect(() => {
        // Simulate fluctuating online user count
        setOnlineUsers(Math.floor(Math.random() * (users.length / 4)) + 5);
        const interval = setInterval(() => {
            setOnlineUsers(prev => Math.max(5, Math.min(users.length, prev + Math.floor(Math.random() * 7) - 3)));
        }, 3000);
        return () => clearInterval(interval);
    }, [users.length]);

    const stats = useMemo(() => {
        const now = new Date();
        const oneMonthAgo = subMonths(now, 1);
        const newUsersThisMonth = users.filter(u => new Date(u.signupDate) > oneMonthAgo).length;
        return [
            { title: "Total Users", value: users.length, icon: <Users className="h-6 w-6 text-muted-foreground" /> },
            { title: "New Users (Month)", value: newUsersThisMonth, icon: <UserPlus className="h-6 w-6 text-muted-foreground" /> },
            { title: "Users Online", value: onlineUsers, icon: <Wifi className="h-6 w-6 text-muted-foreground" /> },
        ];
    }, [users, onlineUsers]);

    const chartData = useMemo(() => {
        const monthCounts = Array(12).fill(0);
        users.forEach(user => {
            const month = getMonth(new Date(user.signupDate));
            monthCounts[month]++;
        });
        return monthCounts.map((count, i) => ({
            month: format(new Date(2000, i), 'MMM'),
            users: count,
        }));
    }, [users]);
    
     const chartConfig = {
        users: {
            label: "Users",
            color: "hsl(var(--primary))",
        },
    };

    const recentUsers = useMemo(() => {
        return [...users].sort((a,b) => new Date(b.signupDate).getTime() - new Date(a.signupDate).getTime()).slice(0, 5);
    }, [users]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">Admin Analytics</h1>
                <p className="text-muted-foreground">An overview of your application's user base.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        {stat.icon}
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Users Over Time</CardTitle>
                        <CardDescription>A monthly breakdown of user sign-ups.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                       <ChartContainer config={chartConfig} className="h-[350px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    content={<ChartTooltipContent hideLabel />}
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                />
                                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                       </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Sign-ups</CardTitle>
                        <CardDescription>The latest users to join your platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentUsers.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {format(new Date(user.signupDate), 'MMM d, yyyy')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
