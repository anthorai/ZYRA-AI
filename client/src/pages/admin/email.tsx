import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit,
  Play,
  Settings,
  MessageSquare,
  Bell,
  Smartphone,
  BarChart3,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  FileText,
} from "lucide-react";

interface EmailServiceStatus {
  connected: boolean;
  provider: string;
  dailyQuotaRemaining: number;
  dailyQuotaTotal: number;
  emailsSentToday: number;
  emailsSentThisMonth: number;
  bounceRate: number;
  openRate: number;
  lastChecked: string;
}

interface SMTPConfig {
  provider: "sendgrid" | "mailgun" | "custom";
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: "welcome" | "password-reset" | "billing" | "marketing" | "system";
  subject: string;
  lastUpdated: string;
  isActive: boolean;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: "email" | "sms" | "push" | "in-app";
  enabled: boolean;
  status: "connected" | "disconnected" | "error";
  provider?: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  status: "active" | "scheduled" | "completed" | "paused";
  sentCount: number;
  openRate: number;
  clickRate: number;
  scheduledDate?: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  testId,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger";
  testId: string;
}) {
  const variantStyles = {
    default: "text-muted-foreground",
    success: "text-green-500",
    warning: "text-yellow-500",
    danger: "text-red-500",
  };

  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${variantStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        <span className="text-2xl font-bold" data-testid={`${testId}-value`}>
          {value}
        </span>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function getTypeBadgeVariant(type: EmailTemplate["type"]): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "welcome":
      return "default";
    case "password-reset":
      return "destructive";
    case "billing":
      return "secondary";
    case "marketing":
      return "outline";
    case "system":
      return "secondary";
    default:
      return "outline";
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function EmailNotificationControl() {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestEmailDialogOpen, setIsTestEmailDialogOpen] = useState(false);
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = useState(false);
  const [isPreviewTemplateDialogOpen, setIsPreviewTemplateDialogOpen] = useState(false);
  const [isDeleteTemplateDialogOpen, setIsDeleteTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig>({
    provider: "sendgrid",
    apiKey: "SG.xxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    fromEmail: "noreply@zyra.ai",
    fromName: "Zyra AI",
  });

  const mockServiceStatus: EmailServiceStatus = {
    connected: true,
    provider: "SendGrid",
    dailyQuotaRemaining: 9847,
    dailyQuotaTotal: 10000,
    emailsSentToday: 153,
    emailsSentThisMonth: 4782,
    bounceRate: 0.8,
    openRate: 42.5,
    lastChecked: new Date(Date.now() - 300000).toISOString(),
  };

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: "1",
      name: "Welcome Email",
      type: "welcome",
      subject: "Welcome to Zyra AI - Let's Get Started!",
      lastUpdated: new Date(Date.now() - 86400000 * 2).toISOString(),
      isActive: true,
    },
    {
      id: "2",
      name: "Password Reset",
      type: "password-reset",
      subject: "Reset Your Password - Zyra AI",
      lastUpdated: new Date(Date.now() - 86400000 * 5).toISOString(),
      isActive: true,
    },
    {
      id: "3",
      name: "Trial Expiring",
      type: "billing",
      subject: "Your Trial Ends in 3 Days - Upgrade Now",
      lastUpdated: new Date(Date.now() - 86400000 * 3).toISOString(),
      isActive: true,
    },
    {
      id: "4",
      name: "Subscription Confirmation",
      type: "billing",
      subject: "Your Subscription is Confirmed!",
      lastUpdated: new Date(Date.now() - 86400000 * 7).toISOString(),
      isActive: true,
    },
    {
      id: "5",
      name: "Payment Receipt",
      type: "billing",
      subject: "Payment Receipt - Zyra AI",
      lastUpdated: new Date(Date.now() - 86400000 * 4).toISOString(),
      isActive: true,
    },
    {
      id: "6",
      name: "Payment Failed",
      type: "billing",
      subject: "Action Required: Payment Failed",
      lastUpdated: new Date(Date.now() - 86400000 * 6).toISOString(),
      isActive: true,
    },
    {
      id: "7",
      name: "Cart Recovery",
      type: "marketing",
      subject: "You Left Something Behind!",
      lastUpdated: new Date(Date.now() - 86400000).toISOString(),
      isActive: true,
    },
    {
      id: "8",
      name: "Product Optimized Notification",
      type: "system",
      subject: "Your Product Has Been Optimized",
      lastUpdated: new Date(Date.now() - 86400000 * 8).toISOString(),
      isActive: true,
    },
  ]);

  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>([
    {
      id: "email",
      name: "Email Notifications",
      type: "email",
      enabled: true,
      status: "connected",
      provider: "SendGrid",
    },
    {
      id: "sms",
      name: "SMS Notifications",
      type: "sms",
      enabled: true,
      status: "connected",
      provider: "Twilio",
    },
    {
      id: "push",
      name: "Push Notifications",
      type: "push",
      enabled: false,
      status: "disconnected",
    },
    {
      id: "in-app",
      name: "In-App Notifications",
      type: "in-app",
      enabled: true,
      status: "connected",
    },
  ]);

  const mockCampaigns: EmailCampaign[] = [
    {
      id: "1",
      name: "Welcome Series",
      status: "active",
      sentCount: 1247,
      openRate: 58.2,
      clickRate: 12.4,
    },
    {
      id: "2",
      name: "Black Friday Promo",
      status: "scheduled",
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      scheduledDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    },
    {
      id: "3",
      name: "Feature Announcement",
      status: "completed",
      sentCount: 3892,
      openRate: 45.6,
      clickRate: 8.9,
    },
  ];

  const activeCampaigns = mockCampaigns.filter(c => c.status === "active").length;
  const scheduledCampaigns = mockCampaigns.filter(c => c.status === "scheduled").length;

  const handleProviderChange = (value: string) => {
    setSMTPConfig(prev => ({ ...prev, provider: value as SMTPConfig["provider"] }));
    toast({
      title: "Provider Updated",
      description: `Email provider changed to ${value}`,
    });
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim() || !testEmailAddress.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingTest(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSendingTest(false);

    toast({
      title: "Test Email Sent",
      description: `Test email sent successfully to ${testEmailAddress}`,
    });

    setIsTestEmailDialogOpen(false);
    setTestEmailAddress("");
  };

  const handleToggleChannel = (channelId: string) => {
    setNotificationChannels(prev =>
      prev.map(channel =>
        channel.id === channelId
          ? { ...channel, enabled: !channel.enabled }
          : channel
      )
    );

    const channel = notificationChannels.find(c => c.id === channelId);
    toast({
      title: "Channel Updated",
      description: `${channel?.name} ${channel?.enabled ? "disabled" : "enabled"}`,
    });
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditTemplateDialogOpen(true);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewTemplateDialogOpen(true);
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `${Date.now()}`,
      name: `${template.name} (Copy)`,
      lastUpdated: new Date().toISOString(),
    };
    setEmailTemplates(prev => [...prev, newTemplate]);
    toast({
      title: "Template Duplicated",
      description: `Created copy of "${template.name}"`,
    });
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;
    setEmailTemplates(prev => prev.filter(t => t.id !== selectedTemplate.id));
    toast({
      title: "Template Deleted",
      description: `"${selectedTemplate.name}" has been deleted`,
    });
    setIsDeleteTemplateDialogOpen(false);
    setSelectedTemplate(null);
  };

  const getChannelIcon = (type: NotificationChannel["type"]) => {
    switch (type) {
      case "email":
        return <Mail className="h-5 w-5" />;
      case "sms":
        return <Smartphone className="h-5 w-5" />;
      case "push":
        return <Bell className="h-5 w-5" />;
      case "in-app":
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: NotificationChannel["status"]) => {
    switch (status) {
      case "connected":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <XCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCampaignStatusBadge = (status: EmailCampaign["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "paused":
        return <Badge variant="destructive">Paused</Badge>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" data-testid="heading-email-notifications">
            Email & Notification Control
          </h1>
          <p className="text-muted-foreground">
            Manage email services, templates, and notification channels
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            title="SendGrid Status"
            value={mockServiceStatus.connected ? "Connected" : "Disconnected"}
            icon={mockServiceStatus.connected ? CheckCircle : XCircle}
            variant={mockServiceStatus.connected ? "success" : "danger"}
            description={`Checked ${formatTimeAgo(mockServiceStatus.lastChecked)}`}
            testId="stat-sendgrid-status"
          />
          <StatCard
            title="Daily Quota"
            value={`${mockServiceStatus.dailyQuotaRemaining.toLocaleString()} / ${mockServiceStatus.dailyQuotaTotal.toLocaleString()}`}
            icon={Zap}
            description={`${((mockServiceStatus.dailyQuotaRemaining / mockServiceStatus.dailyQuotaTotal) * 100).toFixed(0)}% remaining`}
            testId="stat-daily-quota"
          />
          <StatCard
            title="Emails Today"
            value={mockServiceStatus.emailsSentToday}
            icon={Send}
            description={`${mockServiceStatus.emailsSentThisMonth.toLocaleString()} this month`}
            testId="stat-emails-today"
          />
          <StatCard
            title="Bounce Rate"
            value={`${mockServiceStatus.bounceRate}%`}
            icon={TrendingDown}
            variant={mockServiceStatus.bounceRate > 2 ? "warning" : "success"}
            description="Last 30 days"
            testId="stat-bounce-rate"
          />
          <StatCard
            title="Open Rate"
            value={`${mockServiceStatus.openRate}%`}
            icon={TrendingUp}
            variant={mockServiceStatus.openRate > 30 ? "success" : "warning"}
            description="Last 30 days"
            testId="stat-open-rate"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-smtp-config">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                SMTP Configuration
              </CardTitle>
              <CardDescription>Configure your email service provider settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="provider">Email Provider</Label>
                <Select
                  value={smtpConfig.provider}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger data-testid="select-email-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                    <SelectItem value="custom">Custom SMTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      value={smtpConfig.apiKey}
                      onChange={(e) => setSMTPConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      data-testid="input-api-key"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                    data-testid="button-toggle-api-key"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={smtpConfig.fromEmail}
                    onChange={(e) => setSMTPConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                    data-testid="input-from-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    type="text"
                    value={smtpConfig.fromName}
                    onChange={(e) => setSMTPConfig(prev => ({ ...prev, fromName: e.target.value }))}
                    data-testid="input-from-name"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setIsTestEmailDialogOpen(true)}
                  data-testid="button-send-test-email"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-notification-channels">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Channels
              </CardTitle>
              <CardDescription>Enable or disable notification channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                  data-testid={`channel-${channel.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-md bg-muted">
                      {getChannelIcon(channel.type)}
                    </div>
                    <div>
                      <p className="font-medium">{channel.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(channel.status)}
                        {channel.provider && (
                          <span className="text-xs text-muted-foreground">
                            via {channel.provider}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={channel.enabled}
                    onCheckedChange={() => handleToggleChannel(channel.id)}
                    data-testid={`switch-channel-${channel.id}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="section-email-templates">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Email Templates
            </CardTitle>
            <CardDescription>Manage and customize email templates</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Subject Preview</TableHead>
                  <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailTemplates.map((template) => (
                  <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(template.type)}>
                        {template.type.charAt(0).toUpperCase() + template.type.slice(1).replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[200px] truncate text-muted-foreground">
                      {template.subject}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatTimeAgo(template.lastUpdated)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTemplate(template)}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreviewTemplate(template)}
                          data-testid={`button-preview-template-${template.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicateTemplate(template)}
                          data-testid={`button-duplicate-template-${template.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsDeleteTemplateDialogOpen(true);
                          }}
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card data-testid="section-email-campaigns">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Email Campaigns Overview
            </CardTitle>
            <CardDescription>Monitor active and scheduled email campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/30 text-center" data-testid="stat-active-campaigns">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Play className="h-4 w-4" />
                  <span className="text-sm">Active Campaigns</span>
                </div>
                <span className="text-2xl font-bold">{activeCampaigns}</span>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 text-center" data-testid="stat-scheduled-campaigns">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Scheduled</span>
                </div>
                <span className="text-2xl font-bold">{scheduledCampaigns}</span>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 text-center" data-testid="stat-avg-open-rate">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Avg. Open Rate</span>
                </div>
                <span className="text-2xl font-bold">
                  {(mockCampaigns.filter(c => c.sentCount > 0).reduce((acc, c) => acc + c.openRate, 0) / mockCampaigns.filter(c => c.sentCount > 0).length || 0).toFixed(1)}%
                </span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Sent</TableHead>
                  <TableHead className="hidden md:table-cell">Open Rate</TableHead>
                  <TableHead className="hidden md:table-cell">Click Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCampaigns.map((campaign) => (
                  <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCampaignStatusBadge(campaign.status)}
                        {campaign.scheduledDate && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {new Date(campaign.scheduledDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {campaign.sentCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {campaign.sentCount > 0 ? `${campaign.openRate}%` : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {campaign.sentCount > 0 ? `${campaign.clickRate}%` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isTestEmailDialogOpen} onOpenChange={setIsTestEmailDialogOpen}>
          <DialogContent data-testid="dialog-test-email">
            <DialogHeader>
              <DialogTitle>Send Test Email</DialogTitle>
              <DialogDescription>
                Send a test email to verify your SMTP configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="test-email-address">Recipient Email</Label>
                <Input
                  id="test-email-address"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  data-testid="input-test-email-address"
                />
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="text-sm font-medium">Email will be sent with:</p>
                <p className="text-xs text-muted-foreground">From: {smtpConfig.fromName} &lt;{smtpConfig.fromEmail}&gt;</p>
                <p className="text-xs text-muted-foreground">Provider: {smtpConfig.provider}</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTestEmailDialogOpen(false)}
                data-testid="button-cancel-test-email"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                data-testid="button-confirm-test-email"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditTemplateDialogOpen} onOpenChange={setIsEditTemplateDialogOpen}>
          <DialogContent data-testid="dialog-edit-template">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Modify the email template settings
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={selectedTemplate.name}
                    onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                    data-testid="input-template-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-subject">Subject Line</Label>
                  <Input
                    id="template-subject"
                    value={selectedTemplate.subject}
                    onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                    data-testid="input-template-subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-type">Type</Label>
                  <Select
                    value={selectedTemplate.type}
                    onValueChange={(value) => setSelectedTemplate(prev => prev ? { ...prev, type: value as EmailTemplate["type"] } : null)}
                  >
                    <SelectTrigger data-testid="select-template-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="password-reset">Password Reset</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditTemplateDialogOpen(false)}
                data-testid="button-cancel-edit-template"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedTemplate) {
                    setEmailTemplates(prev =>
                      prev.map(t =>
                        t.id === selectedTemplate.id
                          ? { ...selectedTemplate, lastUpdated: new Date().toISOString() }
                          : t
                      )
                    );
                    toast({
                      title: "Template Updated",
                      description: `"${selectedTemplate.name}" has been updated`,
                    });
                    setIsEditTemplateDialogOpen(false);
                  }
                }}
                data-testid="button-save-template"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPreviewTemplateDialogOpen} onOpenChange={setIsPreviewTemplateDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-preview-template">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
              <DialogDescription>
                Preview how the email will appear to recipients
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getTypeBadgeVariant(selectedTemplate.type)}>
                      {selectedTemplate.type.charAt(0).toUpperCase() + selectedTemplate.type.slice(1).replace("-", " ")}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Last updated {formatTimeAgo(selectedTemplate.lastUpdated)}
                    </span>
                  </div>
                </div>
                <div className="border rounded-lg p-4 bg-background">
                  <div className="border-b pb-3 mb-3">
                    <p className="text-sm text-muted-foreground">Subject:</p>
                    <p className="font-medium">{selectedTemplate.subject}</p>
                  </div>
                  <div className="min-h-[200px] text-muted-foreground text-sm">
                    <p>Dear [Customer Name],</p>
                    <br />
                    <p>This is a preview of the "{selectedTemplate.name}" email template.</p>
                    <br />
                    <p>The actual content will be personalized based on the recipient and context.</p>
                    <br />
                    <p>Best regards,</p>
                    <p>The Zyra AI Team</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPreviewTemplateDialogOpen(false)}
                data-testid="button-close-preview"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsPreviewTemplateDialogOpen(false);
                  if (selectedTemplate) {
                    handleEditTemplate(selectedTemplate);
                  }
                }}
                data-testid="button-edit-from-preview"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteTemplateDialogOpen} onOpenChange={setIsDeleteTemplateDialogOpen}>
          <AlertDialogContent data-testid="dialog-delete-template">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-template">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTemplate}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-template"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
