import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  FileText,
  Inbox,
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

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
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

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground/70 max-w-sm">{description}</p>
    </div>
  );
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

  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig>({
    provider: "sendgrid",
    apiKey: "",
    fromEmail: "noreply@zyra.ai",
    fromName: "Zyra AI",
  });

  const { data: serviceStatus, isLoading: isLoadingStatus } = useQuery<EmailServiceStatus>({
    queryKey: ["/api/admin/email-service-status"],
  });

  const { data: emailTemplates = [], isLoading: isLoadingTemplates } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
  });

  const { data: notificationChannels = [], isLoading: isLoadingChannels } = useQuery<NotificationChannel[]>({
    queryKey: ["/api/admin/notification-channels"],
  });

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/admin/email-campaigns"],
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (template: Partial<EmailTemplate> & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/email-templates/${template.id}`, template);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({
        title: "Template Updated",
        description: "Email template has been updated successfully",
      });
      setIsEditTemplateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: Omit<EmailTemplate, "id" | "lastUpdated">) => {
      const res = await apiRequest("POST", "/api/admin/email-templates", template);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({
        title: "Template Created",
        description: "New email template has been created",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({
        title: "Template Deleted",
        description: "Email template has been deleted",
      });
      setIsDeleteTemplateDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleChannelMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/notification-channels/${id}`, { enabled });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-channels"] });
      const channel = notificationChannels.find(c => c.id === variables.id);
      toast({
        title: "Channel Updated",
        description: `${channel?.name} ${variables.enabled ? "enabled" : "disabled"}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async (data: { to: string; fromEmail: string; fromName: string }) => {
      const res = await apiRequest("POST", "/api/admin/send-test-email", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Test Email Sent",
        description: `Test email sent successfully to ${variables.to}`,
      });
      setIsTestEmailDialogOpen(false);
      setTestEmailAddress("");
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const scheduledCampaigns = campaigns.filter(c => c.status === "scheduled").length;
  const avgOpenRate = campaigns.filter(c => c.sentCount > 0).length > 0
    ? campaigns.filter(c => c.sentCount > 0).reduce((acc, c) => acc + c.openRate, 0) / campaigns.filter(c => c.sentCount > 0).length
    : 0;

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

    sendTestEmailMutation.mutate({
      to: testEmailAddress,
      fromEmail: smtpConfig.fromEmail,
      fromName: smtpConfig.fromName,
    });
  };

  const handleToggleChannel = (channelId: string) => {
    const channel = notificationChannels.find(c => c.id === channelId);
    if (channel) {
      toggleChannelMutation.mutate({ id: channelId, enabled: !channel.enabled });
    }
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
    createTemplateMutation.mutate({
      name: `${template.name} (Copy)`,
      type: template.type,
      subject: template.subject,
      isActive: template.isActive,
    });
  };

  const handleDeleteTemplate = () => {
    if (selectedTemplate) {
      deleteTemplateMutation.mutate(selectedTemplate.id);
    }
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
          {isLoadingStatus ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : serviceStatus ? (
            <>
              <StatCard
                title="SendGrid Status"
                value={serviceStatus.connected ? "Connected" : "Disconnected"}
                icon={serviceStatus.connected ? CheckCircle : XCircle}
                variant={serviceStatus.connected ? "success" : "danger"}
                description={`Checked ${formatTimeAgo(serviceStatus.lastChecked)}`}
                testId="stat-sendgrid-status"
              />
              <StatCard
                title="Daily Quota"
                value={`${serviceStatus.dailyQuotaRemaining.toLocaleString()} / ${serviceStatus.dailyQuotaTotal.toLocaleString()}`}
                icon={Zap}
                description={`${((serviceStatus.dailyQuotaRemaining / serviceStatus.dailyQuotaTotal) * 100).toFixed(0)}% remaining`}
                testId="stat-daily-quota"
              />
              <StatCard
                title="Emails Today"
                value={serviceStatus.emailsSentToday}
                icon={Send}
                description={`${serviceStatus.emailsSentThisMonth.toLocaleString()} this month`}
                testId="stat-emails-today"
              />
              <StatCard
                title="Bounce Rate"
                value={`${serviceStatus.bounceRate}%`}
                icon={TrendingDown}
                variant={serviceStatus.bounceRate > 2 ? "warning" : "success"}
                description="Last 30 days"
                testId="stat-bounce-rate"
              />
              <StatCard
                title="Open Rate"
                value={`${serviceStatus.openRate}%`}
                icon={TrendingUp}
                variant={serviceStatus.openRate > 30 ? "success" : "warning"}
                description="Last 30 days"
                testId="stat-open-rate"
              />
            </>
          ) : (
            <div className="col-span-5 text-center text-muted-foreground py-8">
              Unable to load email service status
            </div>
          )}
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
                      placeholder="Enter API key..."
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
              {isLoadingChannels ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-10" />
                    </div>
                  ))}
                </div>
              ) : notificationChannels.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No Channels Configured"
                  description="Configure notification channels to send emails, SMS, and push notifications."
                />
              ) : (
                notificationChannels.map((channel) => (
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
                      disabled={toggleChannelMutation.isPending}
                      data-testid={`switch-channel-${channel.id}`}
                    />
                  </div>
                ))
              )}
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
            {isLoadingTemplates ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b last:border-0">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : emailTemplates.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Email Templates"
                description="Create email templates for welcome emails, password resets, billing notifications, and more."
              />
            ) : (
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
                            disabled={createTemplateMutation.isPending}
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
            )}
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
              {isLoadingCampaigns ? (
                <>
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </>
              ) : (
                <>
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
                    <span className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</span>
                  </div>
                </>
              )}
            </div>

            {isLoadingCampaigns ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b last:border-0">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No Campaigns Yet"
                description="Create email campaigns to engage with your customers and track performance."
              />
            ) : (
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
                  {campaigns.map((campaign) => (
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
            )}
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
                disabled={sendTestEmailMutation.isPending}
                data-testid="button-confirm-test-email"
              >
                {sendTestEmailMutation.isPending ? (
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
                    updateTemplateMutation.mutate({
                      id: selectedTemplate.id,
                      name: selectedTemplate.name,
                      type: selectedTemplate.type,
                      subject: selectedTemplate.subject,
                    });
                  }
                }}
                disabled={updateTemplateMutation.isPending}
                data-testid="button-save-template"
              >
                {updateTemplateMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
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
                disabled={deleteTemplateMutation.isPending}
                data-testid="button-confirm-delete-template"
              >
                {deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
