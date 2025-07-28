
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Globe, Bot, BrainCircuit, Loader2, Send, CheckCircle, Code, Clipboard, Trash2, Power, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { fetchWebsiteContent, addChatbotToSite, removeChatbotFromSite } from './actions';
import { answerQuestion } from '@/ai/flows/website-chat';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

interface ChatbotConfig {
  welcomeMessage: string;
  primaryColor: string;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

const phpSnippet = `
if ( ! function_exists( 'content_forge_chatbot' ) ) {
    function content_forge_chatbot() {
        $chatbot_script = get_option('content_forge_chatbot_script');
        if ($chatbot_script) {
            echo $chatbot_script;
        }
    }
    add_action('wp_footer', 'content_forge_chatbot');
}
`.trim();

export default function AiChatbotPage() {
    const { toast } = useToast();
    const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    
    const [trainingStatus, setTrainingStatus] = useLocalStorage<'idle' | 'training' | 'trained'>('chatbot-training-status', 'idle');
    const [trainedContent, setTrainedContent] = useLocalStorage<string>('chatbot-trained-content', '');
    const [chatbotConfig, setChatbotConfig] = useLocalStorage<ChatbotConfig>('chatbot-config', {
        welcomeMessage: 'Hello! How can I help you today?',
        primaryColor: '#6D28D9',
    });

    const [isTraining, setIsTraining] = useState(false);
    const [isUpdatingSite, setIsUpdatingSite] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const selectedSite = sites.find(s => s.id === selectedSiteId);

    useEffect(() => {
        if(trainingStatus === 'trained' && chatbotConfig.welcomeMessage) {
            setChatMessages([{ sender: 'bot', text: chatbotConfig.welcomeMessage }]);
        }
    }, [trainingStatus, chatbotConfig.welcomeMessage]);

    const handleTrain = async () => {
        if (!selectedSite?.appPassword) {
            toast({ title: "Error", description: "WordPress credentials not found.", variant: "destructive" });
            return;
        }
        setIsTraining(true);
        setTrainingStatus('training');
        
        const result = await fetchWebsiteContent(selectedSite.url, selectedSite.user, selectedSite.appPassword);
        
        if (result.success) {
            const combinedContent = result.data.map(post => `Title: ${post.title}\nContent: ${post.content}`).join('\n\n---\n\n');
            setTrainedContent(combinedContent);
            setTrainingStatus('trained');
            toast({ title: "Training Complete!", description: "Your chatbot is now ready to answer questions." });
        } else {
            toast({ title: "Training Failed", description: result.error, variant: "destructive" });
            setTrainingStatus('idle');
        }
        
        setIsTraining(false);
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isReplying || trainingStatus !== 'trained') return;
        
        const newUserMessage: ChatMessage = { sender: 'user', text: chatInput };
        setChatMessages(prev => [...prev, newUserMessage]);
        setChatInput('');
        setIsReplying(true);

        try {
            const result = await answerQuestion({ question: chatInput, context: trainedContent });
            const botMessage: ChatMessage = { sender: 'bot', text: result.answer };
            setChatMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = { sender: 'bot', text: "Sorry, I encountered an error. Please try again." };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsReplying(false);
        }
    };
    
    const embedCode = useMemo(() => {
        if (typeof window === 'undefined' || !selectedSite) return '';
        const scriptUrl = `${window.location.origin}/chatbot-embed.js`;
        return `<script
  id="content-forge-chatbot"
  data-chatbot-id="${selectedSite.id}"
  data-welcome-message="${chatbotConfig.welcomeMessage}"
  data-primary-color="${chatbotConfig.primaryColor}"
  src="${scriptUrl}"
  defer
></script>`;
    }, [selectedSite, chatbotConfig]);

    const handleAddChatbotToSite = async () => {
        if (!selectedSite?.appPassword) {
            toast({ title: "Error", description: "WordPress credentials not found.", variant: "destructive" });
            return;
        }
        setIsUpdatingSite(true);
        const result = await addChatbotToSite(selectedSite.url, selectedSite.user, selectedSite.appPassword, embedCode);
        if (result.success) {
            toast({
                title: "Chatbot Activated!",
                description: `The chatbot has been enabled for ${selectedSite.url}. It may take a minute to appear.`
            });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsUpdatingSite(false);
    };
    
    const handleRemoveChatbotFromSite = async () => {
         if (!selectedSite?.appPassword) {
            toast({ title: "Error", description: "WordPress credentials not found.", variant: "destructive" });
            return;
        }
        setIsUpdatingSite(true);
        const result = await removeChatbotFromSite(selectedSite.url, selectedSite.user, selectedSite.appPassword);
        if (result.success) {
            toast({
                title: "Chatbot Deactivated!",
                description: `The chatbot has been disabled on ${selectedSite.url}.`
            });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsUpdatingSite(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard!",
          description: "The snippet has been copied.",
        });
      };

    const renderSiteSelection = () => (
        <Card>
            <CardHeader>
                <CardTitle>1. Select a Site</CardTitle>
                <CardDescription>Choose the WordPress site you want to train the chatbot on.</CardDescription>
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

    const renderTraining = () => (
        <Card>
            <CardHeader>
                <CardTitle>2. Train Your Chatbot</CardTitle>
                <CardDescription>The AI will read your site's content to learn about your business. This includes key pages and up to 50 of your most recent posts.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={handleTrain} disabled={isTraining || trainingStatus === 'training'}>
                    {isTraining || trainingStatus === 'training' ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Training...
                        </>
                    ) : (
                        <>
                           <BrainCircuit className="mr-2 h-4 w-4" /> Train Chatbot
                        </>
                    )}
                </Button>
                {trainingStatus === 'trained' && (
                     <Alert className="mt-4">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Training Complete!</AlertTitle>
                        <AlertDescription>Your chatbot is now trained on {new URL(selectedSite!.url).hostname}. You can test it in the preview window.</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );

    const renderConfiguration = () => (
        <Card>
            <CardHeader>
                <CardTitle>3. Customize Your Chatbot</CardTitle>
                <CardDescription>Adjust the appearance and behavior of your chatbot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="welcome-message">Welcome Message</Label>
                    <Textarea
                        id="welcome-message"
                        value={chatbotConfig.welcomeMessage}
                        onChange={(e) => setChatbotConfig(prev => ({...prev, welcomeMessage: e.target.value}))}
                        placeholder="Hello! How can I help you today?"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="primary-color"
                            type="color"
                            value={chatbotConfig.primaryColor}
                            onChange={(e) => setChatbotConfig(prev => ({...prev, primaryColor: e.target.value}))}
                            className="w-12 h-10 p-1"
                        />
                        <Input
                            value={chatbotConfig.primaryColor}
                            onChange={(e) => setChatbotConfig(prev => ({...prev, primaryColor: e.target.value}))}
                            className="w-32"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const renderChatPreview = () => (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Chatbot Preview</CardTitle>
                <CardDescription>Test your chatbot's responses here.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <ScrollArea className="flex-grow h-96 rounded-md border bg-muted/50 p-4">
                    <div className="space-y-4">
                        {chatMessages.map((msg, index) => (
                            <div key={index} className={cn("flex items-end gap-2", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                                {msg.sender === 'bot' && <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: chatbotConfig.primaryColor}}><Bot className="h-5 w-5 text-white" /></div>}
                                <div className={cn(
                                    "rounded-lg px-4 py-2 max-w-sm",
                                     msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background'
                                )}>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isReplying && (
                            <div className="flex items-end gap-2 justify-start">
                                <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: chatbotConfig.primaryColor}}><Bot className="h-5 w-5 text-white" /></div>
                                <div className="rounded-lg px-4 py-2 bg-background"><Loader2 className="h-5 w-5 animate-spin"/></div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter>
                 <div className="flex w-full gap-2">
                    <Input 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={trainingStatus !== 'trained' ? "Train the chatbot to enable..." : "Ask a question..."}
                        disabled={trainingStatus !== 'trained' || isReplying}
                    />
                    <Button onClick={handleSendMessage} disabled={trainingStatus !== 'trained' || isReplying}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );

    const renderInstallation = () => (
        <Card>
            <CardHeader>
                <CardTitle>4. Install on Your Website</CardTitle>
                <CardDescription>Enable or disable the chatbot on your site, or install it manually.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>One-Time Setup Required</AlertTitle>
                    <AlertDescription>
                        For automatic installation to work, please add the following PHP snippet to your WordPress theme's <strong>functions.php</strong> file once. This is a safe, standard way to allow applications to add scripts.
                    </AlertDescription>
                    <div className="relative bg-black text-white p-4 rounded-md font-mono text-sm mt-2">
                        <pre><code>{phpSnippet}</code></pre>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-white hover:bg-gray-700"
                            onClick={() => copyToClipboard(phpSnippet)}
                        >
                            <Clipboard className="h-4 w-4"/>
                        </Button>
                    </div>
                </Alert>
                <div className="flex gap-2">
                    <Button onClick={handleAddChatbotToSite} disabled={isUpdatingSite}>
                        {isUpdatingSite ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
                        Activate on Website
                    </Button>
                    <Button onClick={handleRemoveChatbotFromSite} variant="destructive" disabled={isUpdatingSite}>
                        {isUpdatingSite ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                        Deactivate
                    </Button>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Manual Installation (if you prefer not to use the one-time snippet)</Label>
                    <div className="relative bg-black text-white p-4 rounded-md font-mono text-sm mt-1">
                        <pre><code>{embedCode}</code></pre>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-white hover:bg-gray-700"
                            onClick={() => copyToClipboard(embedCode)}
                        >
                            <Clipboard className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">AI Website Chatbot</h1>
        <p className="text-muted-foreground max-w-2xl">
          Create and train a custom chatbot that understands your website's content and can answer visitor questions instantly.
        </p>
      </div>
      
      {renderSiteSelection()}

      {selectedSiteId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                {renderTraining()}
                {trainingStatus === 'trained' && (
                    <>
                        {renderConfiguration()}
                        {renderInstallation()}
                    </>
                )}
            </div>
            <div className="lg:col-span-1">
                {renderChatPreview()}
            </div>
        </div>
      )}
    </div>
  );
}
