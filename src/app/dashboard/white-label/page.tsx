

"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Clipboard, Paintbrush } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface WhiteLabelConfig {
    loginLogoUrl: string;
    adminFooterText: string;
    loginBackgroundColor: string;
    loginFormColor: string;
    loginButtonColor: string;
    loginButtonTextColor: string;
    loginLinkColor: string;
}

export default function WhiteLabelPage() {
    const { toast } = useToast();
    const [config, setConfig] = useState<WhiteLabelConfig>({
        loginLogoUrl: '',
        adminFooterText: 'Thank you for creating with WordPress.',
        loginBackgroundColor: '#f1f1f1',
        loginFormColor: '#ffffff',
        loginButtonColor: '#2271b1',
        loginButtonTextColor: '#ffffff',
        loginLinkColor: '#555d66',
    });

    const generatedCode = useMemo(() => {
        const css = `
<style type="text/css">
    body.login {
        background-color: ${config.loginBackgroundColor} !important;
    }
    #login h1 a, .login h1 a {
        background-image: url(${config.loginLogoUrl || '/wp-admin/images/w-logo-white.svg'});
        height: 84px;
        width: 84px;
        background-size: contain;
        background-repeat: no-repeat;
        padding-bottom: 30px;
    }
    #loginform {
        background-color: ${config.loginFormColor} !important;
    }
    .wp-core-ui .button-primary {
        background: ${config.loginButtonColor} !important;
        border-color: ${config.loginButtonColor} !important;
        color: ${config.loginButtonTextColor} !important;
        box-shadow: none !important;
        text-shadow: none !important;
    }
    .login #backtoblog a, .login #nav a {
        color: ${config.loginLinkColor} !important;
    }
</style>
`;

        const php = `
// White-labeling for WordPress Login Page
function my_login_logo() {
    echo '${css.replace(/\n/g, '').replace(/'/g, "\\'") }';
}
add_action( 'login_enqueue_scripts', 'my_login_logo' );

function my_login_logo_url() {
    return home_url();
}
add_filter( 'login_headerurl', 'my_login_logo_url' );

function my_login_logo_url_title() {
    return get_bloginfo('name');
}
add_filter( 'login_headertext', 'my_login_logo_url_title' );

// White-labeling for WordPress Admin Footer
function remove_footer_admin () {
    echo '${config.adminFooterText.replace(/'/g, "\\'") }';
}
add_filter('admin_footer_text', 'remove_footer_admin');
`;
        return php.trim();
    }, [config]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard!",
            description: "The PHP snippet has been copied.",
        });
    };

    const handleColorChange = (key: keyof WhiteLabelConfig, value: string) => {
        // Basic hex color validation
        if (/^#([0-9A-F]{3}){1,2}$/i.test(value) || value === '') {
            setConfig(prev => ({...prev, [key]: value}));
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">WordPress Admin Branding & White-Label Tool</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Customize the WordPress admin and login page to match your brand. Configure the options below and copy the generated snippet into your theme's `functions.php` file.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Branding Options</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-logo-url">Login Logo URL</Label>
                                <Input 
                                    id="login-logo-url" 
                                    placeholder="https://yoursite.com/logo.png"
                                    value={config.loginLogoUrl}
                                    onChange={(e) => setConfig(prev => ({...prev, loginLogoUrl: e.target.value}))}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="admin-footer-text">Admin Footer Text</Label>
                                <Input 
                                    id="admin-footer-text" 
                                    placeholder="Powered by Your Agency"
                                    value={config.adminFooterText}
                                    onChange={(e) => setConfig(prev => ({...prev, adminFooterText: e.target.value}))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader>
                            <CardTitle>Login Page Colors</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="login-bg-color">Background Color</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        value={config.loginBackgroundColor}
                                        onChange={(e) => setConfig(prev => ({...prev, loginBackgroundColor: e.target.value}))}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input 
                                        id="login-bg-color" 
                                        value={config.loginBackgroundColor}
                                        onChange={(e) => handleColorChange('loginBackgroundColor', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="login-form-color">Form Background Color</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        value={config.loginFormColor}
                                        onChange={(e) => setConfig(prev => ({...prev, loginFormColor: e.target.value}))}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input 
                                        id="login-form-color"
                                        value={config.loginFormColor}
                                        onChange={(e) => handleColorChange('loginFormColor', e.target.value)}
                                    />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="login-button-color">Button Color</Label>
                                 <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        value={config.loginButtonColor}
                                        onChange={(e) => setConfig(prev => ({...prev, loginButtonColor: e.target.value}))}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input 
                                        id="login-button-color"
                                        value={config.loginButtonColor}
                                        onChange={(e) => handleColorChange('loginButtonColor', e.target.value)}
                                    />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="login-button-text-color">Button Text Color</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        value={config.loginButtonTextColor}
                                        onChange={(e) => setConfig(prev => ({...prev, loginButtonTextColor: e.target.value}))}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input 
                                        id="login-button-text-color"
                                        value={config.loginButtonTextColor}
                                        onChange={(e) => handleColorChange('loginButtonTextColor', e.target.value)}
                                    />
                                </div>
                            </div>
                              <div className="space-y-2">
                                <Label htmlFor="login-link-color">Link Color</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        value={config.loginLinkColor}
                                        onChange={(e) => setConfig(prev => ({...prev, loginLinkColor: e.target.value}))}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input 
                                        id="login-link-color"
                                        value={config.loginLinkColor}
                                        onChange={(e) => handleColorChange('loginLinkColor', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Generated PHP Snippet</CardTitle>
                                <Button variant="outline" onClick={() => copyToClipboard(generatedCode)}>
                                    <Clipboard className="mr-2 h-4 w-4" />
                                    Copy Code
                                </Button>
                            </div>
                            <CardDescription>
                                Copy this entire snippet and paste it at the end of your active WordPress theme's `functions.php` file.
                                 <InfoTooltip info="You can usually find functions.php under Appearance > Theme File Editor in WordPress, or by accessing your site's files via FTP/cPanel." />
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative bg-black text-white p-4 rounded-md font-mono text-sm overflow-auto max-h-[70vh]">
                                <pre><code>{generatedCode}</code></pre>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
