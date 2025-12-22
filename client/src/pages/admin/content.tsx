import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Megaphone,
  Bell,
  BookOpen,
  HelpCircle,
  Scale,
  Plus,
  Pencil,
  Trash2,
  Save,
  GripVertical,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface LandingPageContent {
  heroHeadline: string;
  heroSubheadline: string;
  ctaButtonText: string;
  featureHighlights: string[];
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  targetAudience: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface LegalPage {
  id: string;
  name: string;
  lastUpdated: string;
  path: string;
}

const initialLandingContent: LandingPageContent = {
  heroHeadline: "AI-Powered Product Optimization for Shopify",
  heroSubheadline: "Boost your conversions with intelligent product descriptions, SEO optimization, and automated marketing.",
  ctaButtonText: "Start Free Trial",
  featureHighlights: [
    "Smart Product Descriptions",
    "SEO Optimization",
    "A/B Testing",
    "Marketing Automation",
  ],
};

const initialAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "New Feature: Bulk Optimization",
    message: "You can now optimize multiple products at once! Check out our new bulk optimization feature.",
    type: "success",
    targetAudience: "all",
    startDate: "2024-12-01",
    endDate: "2024-12-31",
    active: true,
  },
  {
    id: "2",
    title: "Scheduled Maintenance",
    message: "We will be performing scheduled maintenance on Dec 15th from 2-4 AM UTC.",
    type: "warning",
    targetAudience: "all",
    startDate: "2024-12-10",
    endDate: "2024-12-15",
    active: true,
  },
  {
    id: "3",
    title: "Holiday Promotion",
    message: "Get 20% off on all annual plans this holiday season!",
    type: "info",
    targetAudience: "free_users",
    startDate: "2024-12-15",
    endDate: "2025-01-05",
    active: false,
  },
];

const initialTemplates: NotificationTemplate[] = [
  {
    id: "1",
    name: "Welcome Email",
    subject: "Welcome to Zyra AI!",
    body: "Hi {{name}},\n\nWelcome to Zyra AI! We're excited to have you on board.\n\nGet started by connecting your Shopify store and optimizing your first product.\n\nBest,\nThe Zyra Team",
    type: "email",
  },
  {
    id: "2",
    name: "Optimization Complete",
    subject: "Your product has been optimized!",
    body: "Hi {{name}},\n\nGreat news! Your product \"{{product_name}}\" has been successfully optimized.\n\nView the changes and publish to your store.\n\nBest,\nThe Zyra Team",
    type: "email",
  },
  {
    id: "3",
    name: "Trial Expiring Soon",
    subject: "Your trial is expiring soon",
    body: "Hi {{name}},\n\nYour free trial ends in {{days_remaining}} days. Upgrade now to keep access to all features.\n\nBest,\nThe Zyra Team",
    type: "email",
  },
];

const initialBlogPosts: BlogPost[] = [
  {
    id: "1",
    title: "10 Tips for Better Product Descriptions",
    excerpt: "Learn how to write compelling product descriptions that convert...",
    status: "published",
    createdAt: "2024-11-15",
    updatedAt: "2024-11-15",
  },
  {
    id: "2",
    title: "The Complete Guide to Shopify SEO",
    excerpt: "Everything you need to know about optimizing your Shopify store...",
    status: "published",
    createdAt: "2024-11-20",
    updatedAt: "2024-11-22",
  },
  {
    id: "3",
    title: "How AI is Transforming E-commerce",
    excerpt: "Discover how artificial intelligence is changing the way we sell online...",
    status: "draft",
    createdAt: "2024-12-01",
    updatedAt: "2024-12-01",
  },
];

const initialFAQs: FAQItem[] = [
  {
    id: "1",
    question: "How does Zyra AI optimize my products?",
    answer: "Zyra AI uses advanced machine learning to analyze your products and generate SEO-optimized titles, descriptions, and meta tags that are designed to improve your search rankings and conversion rates.",
    order: 1,
  },
  {
    id: "2",
    question: "How do I connect my Shopify store?",
    answer: "Go to Settings > Integrations and click 'Connect Shopify'. You'll be redirected to Shopify to authorize the connection. Once connected, your products will sync automatically.",
    order: 2,
  },
  {
    id: "3",
    question: "Can I undo changes made by Zyra AI?",
    answer: "Yes! Every optimization is saved with a rollback point. You can instantly revert to any previous version of your product content at any time.",
    order: 3,
  },
  {
    id: "4",
    question: "What payment methods do you accept?",
    answer: "All subscription payments are handled through Shopify Billing, which integrates with your existing Shopify payment methods.",
    order: 4,
  },
];

const legalPages: LegalPage[] = [
  {
    id: "1",
    name: "Terms of Service",
    lastUpdated: "2024-11-01",
    path: "/terms",
  },
  {
    id: "2",
    name: "Privacy Policy",
    lastUpdated: "2024-11-01",
    path: "/privacy-policy",
  },
];

function LandingPageSection() {
  const { toast } = useToast();
  const [content, setContent] = useState<LandingPageContent>(initialLandingContent);
  const [newFeature, setNewFeature] = useState("");

  const handleSave = () => {
    toast({
      title: "Changes Saved",
      description: "Landing page content has been updated successfully.",
    });
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setContent({
        ...content,
        featureHighlights: [...content.featureHighlights, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setContent({
      ...content,
      featureHighlights: content.featureHighlights.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-hero-content">
        <CardHeader>
          <CardTitle className="text-lg">Hero Section</CardTitle>
          <CardDescription>Edit the main hero section of your landing page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero-headline">Hero Headline</Label>
            <Input
              id="hero-headline"
              data-testid="input-hero-headline"
              value={content.heroHeadline}
              onChange={(e) => setContent({ ...content, heroHeadline: e.target.value })}
              placeholder="Enter hero headline..."
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-subheadline">Hero Subheadline</Label>
            <Textarea
              id="hero-subheadline"
              data-testid="input-hero-subheadline"
              value={content.heroSubheadline}
              onChange={(e) => setContent({ ...content, heroSubheadline: e.target.value })}
              placeholder="Enter hero subheadline..."
              rows={3}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta-button">CTA Button Text</Label>
            <Input
              id="cta-button"
              data-testid="input-cta-button"
              value={content.ctaButtonText}
              onChange={(e) => setContent({ ...content, ctaButtonText: e.target.value })}
              placeholder="Enter CTA button text..."
              className="bg-background"
            />
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-feature-highlights">
        <CardHeader>
          <CardTitle className="text-lg">Feature Highlights</CardTitle>
          <CardDescription>Manage the feature highlights displayed on the landing page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              data-testid="input-new-feature"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add new feature highlight..."
              onKeyDown={(e) => e.key === "Enter" && addFeature()}
              className="bg-background"
            />
            <Button onClick={addFeature} data-testid="button-add-feature">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {content.featureHighlights.map((feature, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/30"
                data-testid={`feature-item-${index}`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span>{feature}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFeature(index)}
                  data-testid={`button-remove-feature-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} data-testid="button-save-landing-content">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function AnnouncementsSection() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as Announcement["type"],
    targetAudience: "all",
    startDate: "",
    endDate: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "info",
      targetAudience: "all",
      startDate: "",
      endDate: "",
    });
    setEditingAnnouncement(null);
  };

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        targetAudience: announcement.targetAudience,
        startDate: announcement.startDate,
        endDate: announcement.endDate,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingAnnouncement) {
      setAnnouncements(announcements.map((a) =>
        a.id === editingAnnouncement.id
          ? { ...a, ...formData }
          : a
      ));
      toast({ title: "Announcement Updated", description: "The announcement has been updated." });
    } else {
      const newAnnouncement: Announcement = {
        id: Date.now().toString(),
        ...formData,
        active: true,
      };
      setAnnouncements([...announcements, newAnnouncement]);
      toast({ title: "Announcement Created", description: "New announcement has been created." });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setAnnouncements(announcements.filter((a) => a.id !== id));
    toast({ title: "Announcement Deleted", description: "The announcement has been removed." });
  };

  const toggleActive = (id: string) => {
    setAnnouncements(announcements.map((a) =>
      a.id === id ? { ...a, active: !a.active } : a
    ));
  };

  const getTypeIcon = (type: Announcement["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Active Announcements</h3>
          <p className="text-sm text-muted-foreground">Manage in-app announcements and notifications</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-announcement">
              <Plus className="h-4 w-4 mr-2" />
              Add Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
              </DialogTitle>
              <DialogDescription>
                Create or edit an in-app announcement for users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-title">Title</Label>
                <Input
                  id="announcement-title"
                  data-testid="input-announcement-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-message">Message</Label>
                <Textarea
                  id="announcement-message"
                  data-testid="input-announcement-message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Announcement message..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Announcement["type"]) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger data-testid="select-announcement-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value) =>
                      setFormData({ ...formData, targetAudience: value })
                    }
                  >
                    <SelectTrigger data-testid="select-announcement-audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="free_users">Free Users</SelectItem>
                      <SelectItem value="paid_users">Paid Users</SelectItem>
                      <SelectItem value="new_users">New Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="announcement-start">Start Date</Label>
                  <Input
                    id="announcement-start"
                    type="date"
                    data-testid="input-announcement-start"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="announcement-end">End Date</Label>
                  <Input
                    id="announcement-end"
                    type="date"
                    data-testid="input-announcement-end"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-announcement">
                Cancel
              </Button>
              <Button onClick={handleSave} data-testid="button-save-announcement">
                {editingAnnouncement ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card data-testid="card-announcements-list">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => (
                <TableRow key={announcement.id} data-testid={`row-announcement-${announcement.id}`}>
                  <TableCell className="font-medium">{announcement.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getTypeIcon(announcement.type)}
                      <span className="capitalize">{announcement.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {announcement.targetAudience.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {announcement.startDate} - {announcement.endDate}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={announcement.active}
                        onCheckedChange={() => toggleActive(announcement.id)}
                        data-testid={`switch-announcement-${announcement.id}`}
                      />
                      <span className="text-sm">
                        {announcement.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(announcement)}
                        data-testid={`button-edit-announcement-${announcement.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(announcement.id)}
                        data-testid={`button-delete-announcement-${announcement.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationTemplatesSection() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<NotificationTemplate[]>(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(templates[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    subject: "",
    body: "",
  });

  const handleSelectTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setEditForm({ subject: template.subject, body: template.body });
    setIsEditing(false);
  };

  const handleSave = () => {
    if (selectedTemplate) {
      setTemplates(templates.map((t) =>
        t.id === selectedTemplate.id
          ? { ...t, subject: editForm.subject, body: editForm.body }
          : t
      ));
      setSelectedTemplate({ ...selectedTemplate, subject: editForm.subject, body: editForm.body });
      setIsEditing(false);
      toast({ title: "Template Saved", description: "Notification template has been updated." });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1" data-testid="card-template-list">
        <CardHeader>
          <CardTitle className="text-lg">Templates</CardTitle>
          <CardDescription>Select a template to edit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedTemplate?.id === template.id
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-muted/30 hover-elevate"
              }`}
              onClick={() => handleSelectTemplate(template)}
              data-testid={`button-select-template-${template.id}`}
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{template.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {template.subject}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2" data-testid="card-template-editor">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-lg">Template Editor</CardTitle>
            <CardDescription>
              {selectedTemplate ? selectedTemplate.name : "Select a template"}
            </CardDescription>
          </div>
          {selectedTemplate && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-template">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} data-testid="button-save-template">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)} data-testid="button-edit-template">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedTemplate ? (
            <>
              <div className="space-y-2">
                <Label>Subject</Label>
                {isEditing ? (
                  <Input
                    data-testid="input-template-subject"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-muted/30 text-sm">
                    {selectedTemplate.subject}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                {isEditing ? (
                  <Textarea
                    data-testid="input-template-body"
                    value={editForm.body}
                    onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                    rows={10}
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap font-mono">
                    {selectedTemplate.body}
                  </div>
                )}
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Info className="h-4 w-4" />
                  <span>Available variables: {"{{name}}"}, {"{{product_name}}"}, {"{{days_remaining}}"}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a template to view and edit
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BlogContentSection() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    status: "draft" as BlogPost["status"],
  });

  const resetForm = () => {
    setFormData({ title: "", excerpt: "", status: "draft" });
    setEditingPost(null);
  };

  const handleOpenDialog = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({ title: post.title, excerpt: post.excerpt, status: post.status });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const now = new Date().toISOString().split("T")[0];
    if (editingPost) {
      setPosts(posts.map((p) =>
        p.id === editingPost.id
          ? { ...p, ...formData, updatedAt: now }
          : p
      ));
      toast({ title: "Post Updated", description: "Blog post has been updated." });
    } else {
      const newPost: BlogPost = {
        id: Date.now().toString(),
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      setPosts([...posts, newPost]);
      toast({ title: "Post Created", description: "New blog post has been created." });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setPosts(posts.filter((p) => p.id !== id));
    toast({ title: "Post Deleted", description: "Blog post has been deleted." });
  };

  const toggleStatus = (id: string) => {
    setPosts(posts.map((p) =>
      p.id === id
        ? { ...p, status: p.status === "draft" ? "published" : "draft" }
        : p
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Blog Posts</h3>
          <p className="text-sm text-muted-foreground">Manage your blog content</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-blog-post">
              <Plus className="h-4 w-4 mr-2" />
              Add Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPost ? "Edit Post" : "New Blog Post"}</DialogTitle>
              <DialogDescription>Create or edit a blog post</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="post-title">Title</Label>
                <Input
                  id="post-title"
                  data-testid="input-post-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Post title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-excerpt">Excerpt</Label>
                <Textarea
                  id="post-excerpt"
                  data-testid="input-post-excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: BlogPost["status"]) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger data-testid="select-post-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-post">
                Cancel
              </Button>
              <Button onClick={handleSave} data-testid="button-save-post">
                {editingPost ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card data-testid="card-blog-posts-list">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id} data-testid={`row-blog-post-${post.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {post.excerpt}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={post.status === "published" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{post.createdAt}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{post.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus(post.id)}
                        data-testid={`button-toggle-post-${post.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(post)}
                        data-testid={`button-edit-post-${post.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(post.id)}
                        data-testid={`button-delete-post-${post.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function FAQSection() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQItem[]>(initialFAQs);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
  });

  const resetForm = () => {
    setFormData({ question: "", answer: "" });
    setEditingFaq(null);
  };

  const handleOpenDialog = (faq?: FAQItem) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({ question: faq.question, answer: faq.answer });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingFaq) {
      setFaqs(faqs.map((f) =>
        f.id === editingFaq.id ? { ...f, ...formData } : f
      ));
      toast({ title: "FAQ Updated", description: "FAQ item has been updated." });
    } else {
      const newFaq: FAQItem = {
        id: Date.now().toString(),
        ...formData,
        order: faqs.length + 1,
      };
      setFaqs([...faqs, newFaq]);
      toast({ title: "FAQ Created", description: "New FAQ item has been created." });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
    toast({ title: "FAQ Deleted", description: "FAQ item has been deleted." });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFaqs = [...faqs];
    [newFaqs[index - 1], newFaqs[index]] = [newFaqs[index], newFaqs[index - 1]];
    newFaqs.forEach((f, i) => (f.order = i + 1));
    setFaqs(newFaqs);
  };

  const moveDown = (index: number) => {
    if (index === faqs.length - 1) return;
    const newFaqs = [...faqs];
    [newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]];
    newFaqs.forEach((f, i) => (f.order = i + 1));
    setFaqs(newFaqs);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">FAQ Management</h3>
          <p className="text-sm text-muted-foreground">Manage frequently asked questions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-faq">
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFaq ? "Edit FAQ" : "New FAQ"}</DialogTitle>
              <DialogDescription>Create or edit a FAQ item</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="faq-question">Question</Label>
                <Input
                  id="faq-question"
                  data-testid="input-faq-question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter the question..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faq-answer">Answer</Label>
                <Textarea
                  id="faq-answer"
                  data-testid="input-faq-answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Enter the answer..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-faq">
                Cancel
              </Button>
              <Button onClick={handleSave} data-testid="button-save-faq">
                {editingFaq ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card data-testid="card-faq-list">
        <CardContent className="p-4 space-y-3">
          {faqs.sort((a, b) => a.order - b.order).map((faq, index) => (
            <div
              key={faq.id}
              className="flex items-start gap-3 p-4 rounded-lg bg-muted/30"
              data-testid={`faq-item-${faq.id}`}
            >
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  data-testid={`button-faq-up-${faq.id}`}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveDown(index)}
                  disabled={index === faqs.length - 1}
                  data-testid={`button-faq-down-${faq.id}`}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    #{faq.order}
                  </Badge>
                  <h4 className="font-medium text-sm">{faq.question}</h4>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(faq)}
                  data-testid={`button-edit-faq-${faq.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(faq.id)}
                  data-testid={`button-delete-faq-${faq.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function LegalPagesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Legal Pages</h3>
        <p className="text-sm text-muted-foreground">
          Manage your terms of service and privacy policy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {legalPages.map((page) => (
          <Card key={page.id} data-testid={`card-legal-${page.id}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{page.name}</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last updated: {page.lastUpdated}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1" data-testid={`button-view-${page.id}`}>
                  <a href={page.path} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </a>
                </Button>
                <Button variant="outline" className="flex-1" data-testid={`button-edit-${page.id}`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="icon" asChild data-testid={`button-external-${page.id}`}>
                  <a href={page.path} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" data-testid="card-legal-notice">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Important Notice
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Changes to legal documents may have legal implications. Please consult with a legal professional before making significant updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ContentManagement() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" data-testid="heading-content-management">
            Content Management
          </h1>
          <p className="text-muted-foreground">
            Manage landing pages, announcements, templates, and more
          </p>
        </div>

        <Tabs defaultValue="landing" className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full lg:w-auto gap-1" data-testid="tabs-content-sections">
            <TabsTrigger value="landing" className="gap-2" data-testid="tab-landing">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Landing</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2" data-testid="tab-announcements">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Announcements</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2" data-testid="tab-templates">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2" data-testid="tab-blog">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Blog</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2" data-testid="tab-faq">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">FAQ</span>
            </TabsTrigger>
            <TabsTrigger value="legal" className="gap-2" data-testid="tab-legal">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Legal</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="landing" data-testid="section-landing">
            <LandingPageSection />
          </TabsContent>

          <TabsContent value="announcements" data-testid="section-announcements">
            <AnnouncementsSection />
          </TabsContent>

          <TabsContent value="templates" data-testid="section-templates">
            <NotificationTemplatesSection />
          </TabsContent>

          <TabsContent value="blog" data-testid="section-blog">
            <BlogContentSection />
          </TabsContent>

          <TabsContent value="faq" data-testid="section-faq">
            <FAQSection />
          </TabsContent>

          <TabsContent value="legal" data-testid="section-legal">
            <LegalPagesSection />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
