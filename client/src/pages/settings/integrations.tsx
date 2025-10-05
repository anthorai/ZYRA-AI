import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Zap, ArrowLeft, Mail, MessageSquare, BarChart3, Link2, Plus, X } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: string;
  icon: JSX.Element;
  isConnected: boolean;
  description: string;
}

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "gmail",
      name: "Gmail",
      type: "Email Provider",
      icon: <Mail className="w-5 h-5" />,
      isConnected: true,
      description: "Send marketing emails via Gmail"
    },
    {
      id: "twilio",
      name: "Twilio",
      type: "SMS Service",
      icon: <MessageSquare className="w-5 h-5" />,
      isConnected: false,
      description: "Send SMS campaigns and alerts"
    },
    {
      id: "analytics",
      name: "Google Analytics",
      type: "Analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      isConnected: true,
      description: "Track campaign performance"
    },
    {
      id: "zapier",
      name: "Zapier",
      type: "Automation",
      icon: <Zap className="w-5 h-5" />,
      isConnected: false,
      description: "Connect with 5000+ apps"
    },
    {
      id: "outlook",
      name: "Outlook",
      type: "Email Provider",
      icon: <Mail className="w-5 h-5" />,
      isConnected: false,
      description: "Microsoft email integration"
    },
    {
      id: "meta-pixel",
      name: "Meta Pixel",
      type: "Analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      isConnected: true,
      description: "Facebook & Instagram tracking"
    }
  ]);

  const [showApiKeyInput, setShowApiKeyInput] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  const handleConnect = (id: string) => {
    if (!showApiKeyInput) {
      setShowApiKeyInput(id);
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key to connect",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, isConnected: true }
          : integration
      )
    );
    
    toast({
      title: "Integration Connected",
      description: `Successfully connected to ${integrations.find(i => i.id === id)?.name}`,
      duration: 3000,
    });
    
    setShowApiKeyInput(null);
    setApiKey("");
  };

  const handleDisconnect = (id: string, name: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, isConnected: false }
          : integration
      )
    );
    
    toast({
      title: "Integration Disconnected",
      description: `${name} has been disconnected`,
      duration: 3000,
    });
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/settings')}
          className="text-slate-300 hover:text-white hover:bg-slate-800"
          data-testid="button-back-to-settings"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Settings
        </Button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 rounded-lg bg-primary/20">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Integrations
          </h1>
          <p className="text-slate-300 text-lg mt-1">
            Connect email providers, SMS services, analytics tools, and automation platforms
          </p>
        </div>
      </div>

      {/* Connected Summary */}
      <Card className="gradient-card border-0 bg-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link2 className="w-6 h-6 text-primary" />
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {integrations.filter(i => i.isConnected).length} Active Integrations
                </h3>
                <p className="text-slate-400 text-sm">
                  {integrations.filter(i => !i.isConnected).length} more available to connect
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/20"
              data-testid="button-add-integration"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integrations List */}
      <div className="space-y-4">
        {integrations.map((integration) => (
          <Card key={integration.id} className="gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${integration.isConnected ? 'bg-primary/20' : 'bg-slate-800/50'}`}>
                    <div className={integration.isConnected ? 'text-primary' : 'text-slate-400'}>
                      {integration.icon}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-semibold">{integration.name}</h3>
                      <Badge
                        variant={integration.isConnected ? "default" : "secondary"}
                        className={integration.isConnected
                          ? "bg-green-500/20 text-green-400"
                          : "bg-slate-500/20 text-slate-400"
                        }
                      >
                        {integration.isConnected ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{integration.type}</p>
                    <p className="text-sm text-slate-300 mt-1">{integration.description}</p>
                  </div>
                </div>
                
                {integration.isConnected ? (
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnect(integration.id, integration.name)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    data-testid={`button-disconnect-${integration.id}`}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect(integration.id)}
                    className="gradient-button"
                    data-testid={`button-connect-${integration.id}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
              
              {showApiKeyInput === integration.id && !integration.isConnected && (
                <div className="mt-4 space-y-3 p-4 bg-slate-800/50 rounded-lg">
                  <Label htmlFor={`api-key-${integration.id}`} className="text-white">
                    API Key for {integration.name}
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id={`api-key-${integration.id}`}
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key"
                      className="bg-slate-900/50 border-slate-600 text-white"
                      data-testid={`input-api-key-${integration.id}`}
                    />
                    <Button
                      onClick={() => handleConnect(integration.id)}
                      className="gradient-button"
                      data-testid={`button-submit-api-key-${integration.id}`}
                    >
                      Connect
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowApiKeyInput(null);
                        setApiKey("");
                      }}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      data-testid={`button-cancel-api-key-${integration.id}`}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
