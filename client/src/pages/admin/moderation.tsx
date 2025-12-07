import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Shield,
  Brain,
  MessageSquare,
  Search,
  Plus,
  Trash2,
  Settings,
  Clock,
  Ban,
  Mail,
  Activity,
  FileWarning,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FlaggedContent {
  id: string;
  userEmail: string;
  contentType: "product_description" | "campaign" | "template" | "review";
  contentPreview: string;
  fullContent: string;
  flagReason: "profanity" | "spam" | "unsafe" | "copyright" | "other";
  flaggedAt: string;
  status: "pending" | "approved" | "blocked";
}

interface BannedKeyword {
  id: string;
  keyword: string;
  autoBlock: boolean;
  createdAt: string;
}

interface UserReport {
  id: string;
  reporterEmail: string;
  contentType: string;
  reason: string;
  reportedAt: string;
  status: "pending" | "investigating" | "dismissed" | "resolved";
}

const mockFlaggedContent: FlaggedContent[] = [
  {
    id: "fc-1",
    userEmail: "seller1@example.com",
    contentType: "product_description",
    contentPreview: "AMAZING DEAL!!! BUY NOW!!! LIMITED TIME OFFER!!!...",
    fullContent: "AMAZING DEAL!!! BUY NOW!!! LIMITED TIME OFFER!!! This is the best product you will ever find. Click here now to save 99% off the original price. Act fast before it's gone forever!!! Don't miss out!!!",
    flagReason: "spam",
    flaggedAt: "2024-12-05T10:30:00Z",
    status: "pending",
  },
  {
    id: "fc-2",
    userEmail: "merchant2@shop.com",
    contentType: "campaign",
    contentPreview: "Visit our special page at bit.ly/suspicious-link...",
    fullContent: "Visit our special page at bit.ly/suspicious-link for exclusive discounts. We guarantee results or money back. Contact us at unknown-email@temp.com for more info.",
    flagReason: "unsafe",
    flaggedAt: "2024-12-05T09:15:00Z",
    status: "pending",
  },
  {
    id: "fc-3",
    userEmail: "store3@business.com",
    contentType: "template",
    contentPreview: "Get your [blocked word] products now with free...",
    fullContent: "Get your [blocked word] products now with free shipping worldwide. This template contains keywords that match our blocked list and requires review.",
    flagReason: "profanity",
    flaggedAt: "2024-12-05T08:45:00Z",
    status: "pending",
  },
  {
    id: "fc-4",
    userEmail: "vendor4@store.com",
    contentType: "product_description",
    contentPreview: "Disney Princess Collection - Authentic replicas...",
    fullContent: "Disney Princess Collection - Authentic replicas of your favorite characters. Marvel Avengers toys and accessories. All officially licensed products.",
    flagReason: "copyright",
    flaggedAt: "2024-12-04T16:20:00Z",
    status: "pending",
  },
];

const mockBannedKeywords: BannedKeyword[] = [
  { id: "kw-1", keyword: "free money", autoBlock: true, createdAt: "2024-11-01T00:00:00Z" },
  { id: "kw-2", keyword: "guaranteed results", autoBlock: true, createdAt: "2024-11-05T00:00:00Z" },
  { id: "kw-3", keyword: "miracle cure", autoBlock: true, createdAt: "2024-11-10T00:00:00Z" },
  { id: "kw-4", keyword: "act now", autoBlock: false, createdAt: "2024-11-15T00:00:00Z" },
  { id: "kw-5", keyword: "limited time", autoBlock: false, createdAt: "2024-11-20T00:00:00Z" },
];

const mockUserReports: UserReport[] = [
  {
    id: "ur-1",
    reporterEmail: "customer1@email.com",
    contentType: "Product Review",
    reason: "Fake review with promotional links",
    reportedAt: "2024-12-05T11:00:00Z",
    status: "pending",
  },
  {
    id: "ur-2",
    reporterEmail: "user2@mail.com",
    contentType: "Campaign Email",
    reason: "Misleading discount claims",
    reportedAt: "2024-12-04T15:30:00Z",
    status: "investigating",
  },
  {
    id: "ur-3",
    reporterEmail: "buyer3@shop.com",
    contentType: "Product Description",
    reason: "Inappropriate content",
    reportedAt: "2024-12-04T10:45:00Z",
    status: "pending",
  },
];

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
  variant?: "default" | "warning" | "success" | "danger";
  testId: string;
}) {
  const variantStyles = {
    default: "text-muted-foreground",
    warning: "text-yellow-500",
    success: "text-green-500",
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
        <div className="text-2xl font-bold" data-testid={`${testId}-value`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function getFlagReasonBadgeVariant(reason: FlaggedContent["flagReason"]) {
  switch (reason) {
    case "profanity":
      return "destructive";
    case "spam":
      return "secondary";
    case "unsafe":
      return "destructive";
    case "copyright":
      return "outline";
    default:
      return "secondary";
  }
}

function getContentTypeBadgeVariant(type: FlaggedContent["contentType"]) {
  switch (type) {
    case "product_description":
      return "default";
    case "campaign":
      return "secondary";
    case "template":
      return "outline";
    case "review":
      return "secondary";
    default:
      return "secondary";
  }
}

function formatContentType(type: FlaggedContent["contentType"]) {
  return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContentModerationPage() {
  const { toast } = useToast();
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>(mockFlaggedContent);
  const [bannedKeywords, setBannedKeywords] = useState<BannedKeyword[]>(mockBannedKeywords);
  const [userReports, setUserReports] = useState<UserReport[]>(mockUserReports);
  const [newKeyword, setNewKeyword] = useState("");
  const [newKeywordAutoBlock, setNewKeywordAutoBlock] = useState(false);
  const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const [autoModerationEnabled, setAutoModerationEnabled] = useState(true);
  const [sensitivityLevel, setSensitivityLevel] = useState("medium");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);

  const pendingCount = flaggedContent.filter(c => c.status === "pending").length;
  const blockedCount = flaggedContent.filter(c => c.status === "blocked").length;
  const reviewedToday = 12;
  const aiGenerationsLast24h = 847;
  const flaggedAiOutputs = 3;

  const handleApproveContent = (id: string) => {
    setFlaggedContent(prev =>
      prev.map(c => c.id === id ? { ...c, status: "approved" as const } : c)
    );
    toast({
      title: "Content Approved",
      description: "The flagged content has been approved and is now visible.",
    });
  };

  const handleBlockContent = (id: string) => {
    setFlaggedContent(prev =>
      prev.map(c => c.id === id ? { ...c, status: "blocked" as const } : c)
    );
    toast({
      title: "Content Blocked",
      description: "The content has been blocked and removed from public view.",
    });
  };

  const handleViewFullContent = (content: FlaggedContent) => {
    setSelectedContent(content);
    setViewDialogOpen(true);
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    const keyword: BannedKeyword = {
      id: `kw-${Date.now()}`,
      keyword: newKeyword.trim().toLowerCase(),
      autoBlock: newKeywordAutoBlock,
      createdAt: new Date().toISOString(),
    };
    
    setBannedKeywords(prev => [...prev, keyword]);
    setNewKeyword("");
    setNewKeywordAutoBlock(false);
    
    toast({
      title: "Keyword Added",
      description: `"${keyword.keyword}" has been added to the banned keywords list.`,
    });
  };

  const handleRemoveKeyword = (id: string) => {
    setBannedKeywords(prev => prev.filter(k => k.id !== id));
    toast({
      title: "Keyword Removed",
      description: "The keyword has been removed from the banned list.",
    });
  };

  const handleToggleKeywordAutoBlock = (id: string) => {
    setBannedKeywords(prev =>
      prev.map(k => k.id === id ? { ...k, autoBlock: !k.autoBlock } : k)
    );
  };

  const handleInvestigateReport = (id: string) => {
    setUserReports(prev =>
      prev.map(r => r.id === id ? { ...r, status: "investigating" as const } : r)
    );
    toast({
      title: "Investigation Started",
      description: "The report has been marked for investigation.",
    });
  };

  const handleDismissReport = (id: string) => {
    setUserReports(prev =>
      prev.map(r => r.id === id ? { ...r, status: "dismissed" as const } : r)
    );
    toast({
      title: "Report Dismissed",
      description: "The report has been dismissed.",
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" data-testid="heading-content-moderation">
            Content Moderation
          </h1>
          <p className="text-muted-foreground">
            Monitor and moderate user-generated content across the platform
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Flagged Content"
            value={flaggedContent.length}
            description="Total flagged items"
            icon={Flag}
            variant="warning"
            testId="stat-flagged-content"
          />
          <StatCard
            title="Reviewed Today"
            value={reviewedToday}
            description="Content items reviewed"
            icon={CheckCircle}
            variant="success"
            testId="stat-reviewed-today"
          />
          <StatCard
            title="Auto-Blocked"
            value={blockedCount}
            description="Automatically blocked"
            icon={Ban}
            variant="danger"
            testId="stat-auto-blocked"
          />
          <StatCard
            title="Pending Review"
            value={pendingCount}
            description="Awaiting moderation"
            icon={Clock}
            variant="warning"
            testId="stat-pending-review"
          />
        </div>

        <Card data-testid="section-flagged-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5" />
              Flagged Content Queue
            </CardTitle>
            <CardDescription>
              Review and take action on flagged user-generated content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Preview</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="hidden sm:table-cell">Flagged At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flaggedContent.filter(c => c.status === "pending").map((content) => (
                  <TableRow key={content.id} data-testid={`row-flagged-${content.id}`}>
                    <TableCell className="font-medium">
                      <span data-testid={`text-user-email-${content.id}`}>
                        {content.userEmail}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getContentTypeBadgeVariant(content.contentType)} data-testid={`badge-content-type-${content.id}`}>
                        {formatContentType(content.contentType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs">
                      <span className="text-muted-foreground truncate block" data-testid={`text-preview-${content.id}`}>
                        {content.contentPreview}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getFlagReasonBadgeVariant(content.flagReason)} data-testid={`badge-reason-${content.id}`}>
                        {content.flagReason}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground" data-testid={`text-flagged-at-${content.id}`}>
                      {formatDate(content.flaggedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApproveContent(content.id)}
                          data-testid={`button-approve-${content.id}`}
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleBlockContent(content.id)}
                          data-testid={`button-block-${content.id}`}
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewFullContent(content)}
                          data-testid={`button-view-${content.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {flaggedContent.filter(c => c.status === "pending").length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No pending content to review
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-banned-keywords">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Banned Keywords Management
              </CardTitle>
              <CardDescription>
                Manage keywords that trigger content flags or automatic blocks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter keyword or phrase..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                  data-testid="input-new-keyword"
                  className="bg-background"
                />
                <Button onClick={handleAddKeyword} data-testid="button-add-keyword">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="new-keyword-autoblock"
                  checked={newKeywordAutoBlock}
                  onCheckedChange={setNewKeywordAutoBlock}
                  data-testid="switch-new-keyword-autoblock"
                />
                <Label htmlFor="new-keyword-autoblock" className="text-sm">
                  Auto-block content with this keyword
                </Label>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bannedKeywords.map((keyword) => (
                  <div
                    key={keyword.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    data-testid={`row-keyword-${keyword.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium" data-testid={`text-keyword-${keyword.id}`}>
                        {keyword.keyword}
                      </span>
                      <Badge
                        variant={keyword.autoBlock ? "destructive" : "outline"}
                        data-testid={`badge-autoblock-${keyword.id}`}
                      >
                        {keyword.autoBlock ? "Auto-block" : "Flag only"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={keyword.autoBlock}
                        onCheckedChange={() => handleToggleKeywordAutoBlock(keyword.id)}
                        data-testid={`switch-keyword-${keyword.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveKeyword(keyword.id)}
                        data-testid={`button-remove-keyword-${keyword.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-ai-monitoring">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Content Generation Monitoring
              </CardTitle>
              <CardDescription>
                Monitor AI-generated content and safety filter performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Activity className="h-4 w-4" />
                    Generations (24h)
                  </div>
                  <p className="text-2xl font-bold mt-1" data-testid="text-ai-generations">
                    {aiGenerationsLast24h}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Flagged Outputs
                  </div>
                  <p className="text-2xl font-bold mt-1" data-testid="text-flagged-ai">
                    {flaggedAiOutputs}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-green-500/10">
                      <Shield className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="font-medium">Content Safety Filter</span>
                  </div>
                  <Badge variant="default" className="bg-green-500/20 text-green-400" data-testid="badge-safety-filter">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-green-500/10">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="font-medium">Profanity Filter</span>
                  </div>
                  <Badge variant="default" className="bg-green-500/20 text-green-400" data-testid="badge-profanity-filter">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-green-500/10">
                      <Search className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="font-medium">Link Scanner</span>
                  </div>
                  <Badge variant="default" className="bg-green-500/20 text-green-400" data-testid="badge-link-scanner">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="section-user-reports">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              User Report Queue
            </CardTitle>
            <CardDescription>
              Review reports submitted by users about inappropriate content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Content Type</TableHead>
                  <TableHead className="hidden md:table-cell">Reason</TableHead>
                  <TableHead className="hidden sm:table-cell">Reported</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userReports.map((report) => (
                  <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                    <TableCell className="font-medium" data-testid={`text-reporter-${report.id}`}>
                      {report.reporterEmail}
                    </TableCell>
                    <TableCell data-testid={`text-report-type-${report.id}`}>
                      {report.contentType}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground" data-testid={`text-report-reason-${report.id}`}>
                      {report.reason}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground" data-testid={`text-reported-at-${report.id}`}>
                      {formatDate(report.reportedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          report.status === "pending" ? "secondary" :
                          report.status === "investigating" ? "default" :
                          report.status === "dismissed" ? "outline" :
                          "secondary"
                        }
                        data-testid={`badge-report-status-${report.id}`}
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleInvestigateReport(report.id)}
                          disabled={report.status !== "pending"}
                          data-testid={`button-investigate-${report.id}`}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismissReport(report.id)}
                          disabled={report.status === "dismissed"}
                          data-testid={`button-dismiss-${report.id}`}
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {userReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No user reports in queue
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card data-testid="section-moderation-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Moderation Settings
            </CardTitle>
            <CardDescription>
              Configure automatic moderation behavior and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-Moderation</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically flag or block content based on rules
                </p>
              </div>
              <Switch
                checked={autoModerationEnabled}
                onCheckedChange={setAutoModerationEnabled}
                data-testid="switch-auto-moderation"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Sensitivity Level</Label>
                <p className="text-sm text-muted-foreground">
                  How strictly content is flagged for review
                </p>
              </div>
              <Select value={sensitivityLevel} onValueChange={setSensitivityLevel}>
                <SelectTrigger className="w-32" data-testid="select-sensitivity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive email alerts for flagged content
                </p>
              </div>
              <Switch
                checked={emailNotificationsEnabled}
                onCheckedChange={setEmailNotificationsEnabled}
                data-testid="switch-email-notifications"
              />
            </div>
          </CardContent>
        </Card>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Flagged Content Details</DialogTitle>
              <DialogDescription>
                Review the full content and take appropriate action
              </DialogDescription>
            </DialogHeader>
            {selectedContent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">User</Label>
                    <p className="font-medium" data-testid="dialog-user-email">
                      {selectedContent.userEmail}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Content Type</Label>
                    <p>
                      <Badge variant={getContentTypeBadgeVariant(selectedContent.contentType)}>
                        {formatContentType(selectedContent.contentType)}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Flag Reason</Label>
                    <p>
                      <Badge variant={getFlagReasonBadgeVariant(selectedContent.flagReason)}>
                        {selectedContent.flagReason}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Flagged At</Label>
                    <p className="font-medium">
                      {formatDate(selectedContent.flaggedAt)}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Full Content</Label>
                  <div className="mt-2 p-4 rounded-lg bg-muted/30 text-sm" data-testid="dialog-full-content">
                    {selectedContent.fullContent}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setViewDialogOpen(false)}
                data-testid="button-dialog-close"
              >
                Close
              </Button>
              {selectedContent && selectedContent.status === "pending" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleBlockContent(selectedContent.id);
                      setViewDialogOpen(false);
                    }}
                    data-testid="button-dialog-block"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Block
                  </Button>
                  <Button
                    onClick={() => {
                      handleApproveContent(selectedContent.id);
                      setViewDialogOpen(false);
                    }}
                    data-testid="button-dialog-approve"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
