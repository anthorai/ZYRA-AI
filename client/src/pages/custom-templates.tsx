import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { 
  Type,
  Image,
  MousePointer2,
  Minus,
  Space,
  Columns,
  Mail,
  Eye,
  Save,
  Copy,
  Trash2,
  Plus,
  Sparkles,
  Search,
  MoreVertical,
  Clock,
  CheckCircle2,
  Zap,
  ArrowLeft,
  Monitor,
  Smartphone,
  Undo2,
  Redo2,
  GripVertical,
  Settings,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Link2,
  ChevronDown,
  History,
  FileText,
  ShoppingCart,
  Package,
  TrendingUp,
  UserPlus,
  RefreshCw,
  Wand2,
  AlertTriangle,
  Shield,
  Target,
  MessageSquare,
  X,
  Check,
  Loader2,
  ImageIcon
} from "lucide-react";
import { Link } from "wouter";
import type { EmailBlock, BrandSettings } from "@shared/schema";

// Email variable definitions for personalization
const emailVariables = [
  { var: "{{customer.firstName}}", desc: "Customer's first name", category: "customer" },
  { var: "{{customer.lastName}}", desc: "Customer's last name", category: "customer" },
  { var: "{{customer.email}}", desc: "Customer's email address", category: "customer" },
  { var: "{{customer.fullName}}", desc: "Customer's full name", category: "customer" },
  { var: "{{order.number}}", desc: "Order number", category: "order" },
  { var: "{{order.total}}", desc: "Order total amount", category: "order" },
  { var: "{{order.itemCount}}", desc: "Number of items", category: "order" },
  { var: "{{order.shippingAddress}}", desc: "Shipping address", category: "order" },
  { var: "{{cart.total}}", desc: "Cart total value", category: "cart" },
  { var: "{{cart.itemCount}}", desc: "Items in cart", category: "cart" },
  { var: "{{cart.recoveryUrl}}", desc: "Cart recovery link", category: "cart" },
  { var: "{{store.name}}", desc: "Your store name", category: "store" },
  { var: "{{store.url}}", desc: "Store URL", category: "store" },
  { var: "{{discount.code}}", desc: "Discount code", category: "promo" },
  { var: "{{discount.percent}}", desc: "Discount percentage", category: "promo" },
  { var: "{{unsubscribe.url}}", desc: "Unsubscribe link", category: "compliance" },
];

// Workflow types for email templates
const workflowTypes = [
  { value: "onboarding", label: "Onboarding", icon: UserPlus, color: "text-green-400" },
  { value: "abandoned_cart", label: "Abandoned Cart", icon: ShoppingCart, color: "text-orange-400" },
  { value: "order_confirmation", label: "Order Confirmation", icon: Package, color: "text-blue-400" },
  { value: "upsell", label: "Upsell / Cross-sell", icon: TrendingUp, color: "text-purple-400" },
  { value: "re_engagement", label: "Re-engagement", icon: RefreshCw, color: "text-pink-400" },
  { value: "newsletter", label: "Newsletter", icon: Mail, color: "text-cyan-400" },
  { value: "custom", label: "Custom", icon: FileText, color: "text-gray-400" },
];

// Block type definitions
const blockTypes = [
  { type: "heading", label: "Heading", icon: Type, description: "Add a title or section header" },
  { type: "text", label: "Text", icon: AlignLeft, description: "Rich text paragraph content" },
  { type: "image", label: "Image", icon: Image, description: "Add an image with optional link" },
  { type: "button", label: "Button", icon: MousePointer2, description: "Call-to-action button" },
  { type: "divider", label: "Divider", icon: Minus, description: "Horizontal line separator" },
  { type: "spacer", label: "Spacer", icon: Space, description: "Add vertical spacing" },
  { type: "columns", label: "Columns", icon: Columns, description: "Two-column layout" },
  { type: "logo", label: "Logo", icon: ImageIcon, description: "Brand logo with link" },
] as const;

// Font family options
const fontFamilies = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Trebuchet MS, sans-serif", label: "Trebuchet MS" },
];

// Default brand settings
const defaultBrandSettings: BrandSettings = {
  logoUrl: "",
  primaryColor: "#00F0FF",
  secondaryColor: "#8B5CF6",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  fontFamily: "Arial, sans-serif",
  footerText: "",
  socialLinks: {},
};

// Generate unique ID for blocks
const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Create default block content based on type
const createDefaultBlock = (type: EmailBlock["type"]): EmailBlock => {
  const baseBlock = {
    id: generateId(),
    type,
    styles: {
      padding: "24px 32px",
      margin: "0",
      textAlign: "left" as const,
    },
  };

  switch (type) {
    case "heading":
      return {
        ...baseBlock,
        content: { text: "Welcome to Your Order", level: "h1" },
        styles: { ...baseBlock.styles, fontSize: "28px", textAlign: "center" as const, padding: "32px 32px 16px 32px" },
      };
    case "text":
      return {
        ...baseBlock,
        content: { text: "Hi {{customer.firstName}},\n\nThank you for your recent purchase! We're excited to let you know that your order is being prepared and will be shipped soon.\n\nIf you have any questions, our support team is here to help." },
        styles: { ...baseBlock.styles, fontSize: "16px", padding: "16px 32px" },
      };
    case "image":
      return {
        ...baseBlock,
        content: { src: "", alt: "Product image", linkUrl: "", borderRadius: "12px" },
        styles: { ...baseBlock.styles, textAlign: "center" as const, width: "100%", padding: "24px 32px" },
      };
    case "button":
      return {
        ...baseBlock,
        content: { text: "View Your Order", url: "{{order.statusUrl}}" },
        styles: { 
          ...baseBlock.styles, 
          textAlign: "center" as const, 
          backgroundColor: "#00F0FF", 
          textColor: "#000000",
          borderRadius: "8px",
          padding: "16px 32px",
          fontSize: "16px",
        },
      };
    case "divider":
      return {
        ...baseBlock,
        content: { style: "solid", color: "#e5e7eb" },
        styles: { ...baseBlock.styles, padding: "16px 32px" },
      };
    case "spacer":
      return {
        ...baseBlock,
        content: { height: "32px" },
        styles: { ...baseBlock.styles, padding: "0" },
      };
    case "columns":
      return {
        ...baseBlock,
        content: { 
          leftContent: "Left column content",
          rightContent: "Right column content",
          ratio: "50-50"
        },
        styles: baseBlock.styles,
      };
    case "logo":
      return {
        ...baseBlock,
        content: { src: "", alt: "Company Logo", linkUrl: "{{store.url}}" },
        styles: { ...baseBlock.styles, textAlign: "center" as const, width: "150px" },
      };
    default:
      return baseBlock;
  }
};

// Type for email template from API
interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  subject?: string | null;
  preheader?: string | null;
  workflowType: string;
  status: "draft" | "active" | "archived";
  blocks?: EmailBlock[] | null;
  brandSettings?: BrandSettings | null;
  htmlContent?: string | null;
  plainTextContent?: string | null;
  variables?: Record<string, string> | null;
  unsubscribeLink?: string | null;
  physicalAddress?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplateBuilder() {
  const { toast } = useToast();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // UI state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [leftPanelTab, setLeftPanelTab] = useState<"blocks" | "variables" | "ai">("blocks");
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBlockType, setDraggedBlockType] = useState<EmailBlock["type"] | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  
  // Editor state (for new template or local edits)
  const [templateName, setTemplateName] = useState("New Email Template");
  const [subject, setSubject] = useState("Your subject line here");
  const [preheader, setPreheader] = useState("");
  const [workflowType, setWorkflowType] = useState<string>("custom");
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [blocks, setBlocks] = useState<EmailBlock[]>([
    createDefaultBlock("logo"),
    createDefaultBlock("spacer"),
    createDefaultBlock("heading"),
    createDefaultBlock("text"),
    createDefaultBlock("image"),
    createDefaultBlock("button"),
    createDefaultBlock("spacer"),
  ]);
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(defaultBrandSettings);

  // Fetch all email templates
  const { data: templates = [], isLoading: templatesLoading, error: templatesError } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  // Fetch selected template details
  const { data: selectedTemplate, isLoading: templateLoading } = useQuery<EmailTemplate>({
    queryKey: ["/api/email-templates", selectedTemplateId],
    enabled: !!selectedTemplateId,
  });

  // Fetch version history
  const { data: versionHistory = [], isLoading: versionsLoading } = useQuery<any[]>({
    queryKey: ["/api/email-templates", selectedTemplateId, "versions"],
    enabled: !!selectedTemplateId && showVersionHistory,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: Partial<EmailTemplate>) => {
      const res = await apiRequest("POST", "/api/email-templates", data);
      return res.json();
    },
    onSuccess: (data: EmailTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      setSelectedTemplateId(data.id);
      toast({ title: "Template Created", description: `"${data.name}" has been created successfully.` });
      setShowNewTemplateDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create template", variant: "destructive" });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmailTemplate> }) => {
      const res = await apiRequest("PATCH", `/api/email-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates", selectedTemplateId] });
      setAutoSaveStatus("saved");
    },
    onError: (error: any) => {
      toast({ title: "Save Failed", description: error.message || "Failed to save template", variant: "destructive" });
      setAutoSaveStatus("unsaved");
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/email-templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      setSelectedTemplateId(null);
      resetEditor();
      toast({ title: "Template Deleted", description: "The template has been deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete template", variant: "destructive" });
    },
  });

  // Duplicate template mutation
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/email-templates/${id}/duplicate`);
      return res.json();
    },
    onSuccess: (data: EmailTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      setSelectedTemplateId(data.id);
      toast({ title: "Template Duplicated", description: `Copy created: "${data.name}"` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to duplicate template", variant: "destructive" });
    },
  });

  // AI action mutation
  const aiActionMutation = useMutation({
    mutationFn: async ({ action, content, subject }: { action: string; content: string; subject?: string }) => {
      const res = await apiRequest("POST", `/api/email-templates/ai/${action}`, { content, subject, blocks });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "AI Enhancement Complete", description: `Successfully applied enhancement to your email template.` });
      if (data.result) {
        // For text-based actions, update the first text block with the result
        const textBlockIndex = blocks.findIndex(b => b.type === "text");
        if (textBlockIndex !== -1) {
          const updatedBlocks = [...blocks];
          updatedBlocks[textBlockIndex] = {
            ...updatedBlocks[textBlockIndex],
            content: { ...updatedBlocks[textBlockIndex].content, text: data.result }
          };
          setBlocks(updatedBlocks);
        }
      }
    },
    onError: (error: any) => {
      toast({ title: "AI Action Failed", description: error.message || "Failed to process AI action", variant: "destructive" });
    },
  });

  // Render HTML mutation
  const renderHtmlMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/email-templates/${id}/render`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates", selectedTemplateId] });
      toast({ title: "HTML Generated", description: "Email-safe HTML has been generated with inline CSS." });
    },
    onError: (error: any) => {
      toast({ title: "Render Failed", description: error.message || "Failed to generate HTML", variant: "destructive" });
    },
  });

  // Reset editor to default state
  const resetEditor = useCallback(() => {
    setTemplateName("New Email Template");
    setSubject("Your subject line here");
    setPreheader("");
    setWorkflowType("custom");
    setStatus("draft");
    setBlocks([
      createDefaultBlock("logo"),
      createDefaultBlock("heading"),
      createDefaultBlock("text"),
      createDefaultBlock("button"),
      createDefaultBlock("divider"),
      createDefaultBlock("text"),
    ]);
    setBrandSettings(defaultBrandSettings);
    setSelectedBlockId(null);
    setAutoSaveStatus("saved");
  }, []);

  // Load template into editor when selected
  useEffect(() => {
    if (selectedTemplate) {
      setTemplateName(selectedTemplate.name);
      setSubject(selectedTemplate.subject || "");
      setPreheader(selectedTemplate.preheader || "");
      setWorkflowType(selectedTemplate.workflowType || "custom");
      setStatus(selectedTemplate.status);
      setBlocks(selectedTemplate.blocks || [
        createDefaultBlock("logo"),
        createDefaultBlock("heading"),
        createDefaultBlock("text"),
        createDefaultBlock("button"),
      ]);
      setBrandSettings(selectedTemplate.brandSettings || defaultBrandSettings);
      setAutoSaveStatus("saved");
    }
  }, [selectedTemplate]);

  // Get the currently selected block
  const selectedBlock = useMemo(() => 
    blocks.find(b => b.id === selectedBlockId), 
    [blocks, selectedBlockId]
  );

  // Filter templates based on search
  const filteredTemplates = useMemo(() => 
    templates.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.workflowType.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [templates, searchQuery]
  );

  // Auto-save with debounce
  useEffect(() => {
    if (selectedTemplateId && autoSaveStatus === "unsaved") {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        setAutoSaveStatus("saving");
        updateTemplateMutation.mutate({
          id: selectedTemplateId,
          data: {
            name: templateName,
            subject,
            preheader,
            workflowType,
            status,
            blocks,
            brandSettings,
          },
        });
      }, 2000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [selectedTemplateId, blocks, templateName, subject, preheader, workflowType, status, brandSettings, autoSaveStatus]);

  // Mark as unsaved when content changes (only if editing existing template)
  useEffect(() => {
    if (selectedTemplateId && selectedTemplate) {
      setAutoSaveStatus("unsaved");
    }
  }, [blocks, templateName, subject, preheader, workflowType, status, brandSettings]);

  // Block operations
  const addBlock = useCallback((type: EmailBlock["type"], index?: number) => {
    const newBlock = createDefaultBlock(type);
    setBlocks(prev => {
      if (index !== undefined) {
        const updated = [...prev];
        updated.splice(index, 0, newBlock);
        return updated;
      }
      return [...prev, newBlock];
    });
    setSelectedBlockId(newBlock.id);
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<EmailBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return updated;
    });
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    const blockIndex = blocks.findIndex(b => b.id === id);
    if (blockIndex !== -1) {
      const originalBlock = blocks[blockIndex];
      const newBlock = { ...originalBlock, id: generateId() };
      setBlocks(prev => {
        const updated = [...prev];
        updated.splice(blockIndex + 1, 0, newBlock);
        return updated;
      });
      setSelectedBlockId(newBlock.id);
    }
  }, [blocks]);

  // AI actions
  const handleAIAction = async (action: string) => {
    setAiLoading(action);
    
    // Gather content from text blocks
    const textContent = blocks
      .filter(b => b.type === "text" || b.type === "heading")
      .map(b => b.content?.text || "")
      .join("\n\n");
    
    aiActionMutation.mutate(
      { action, content: textContent, subject },
      {
        onSettled: () => setAiLoading(null),
      }
    );
  };

  // Handle save
  const handleSave = () => {
    if (selectedTemplateId) {
      setAutoSaveStatus("saving");
      updateTemplateMutation.mutate({
        id: selectedTemplateId,
        data: {
          name: templateName,
          subject,
          preheader,
          workflowType,
          status,
          blocks,
          brandSettings,
        },
      });
    } else {
      createTemplateMutation.mutate({
        name: templateName,
        subject,
        preheader,
        workflowType,
        status,
        blocks,
        brandSettings,
      });
    }
  };

  // Handle duplicate template
  const handleDuplicateTemplate = () => {
    if (selectedTemplateId) {
      duplicateTemplateMutation.mutate(selectedTemplateId);
    } else {
      setTemplateName(`${templateName} (Copy)`);
      toast({
        title: "Template Duplicated",
        description: "A copy of your template has been created (save to persist).",
      });
    }
  };

  // Handle delete template
  const handleDeleteTemplate = () => {
    if (selectedTemplateId) {
      deleteTemplateMutation.mutate(selectedTemplateId);
    }
  };

  // Handle new template
  const handleNewTemplate = () => {
    setSelectedTemplateId(null);
    resetEditor();
    setShowNewTemplateDialog(true);
  };

  // Handle select template
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    setSelectedBlockId(null);
  };

  // Handle generate HTML
  const handleGenerateHtml = () => {
    if (selectedTemplateId) {
      renderHtmlMutation.mutate(selectedTemplateId);
    } else {
      toast({
        title: "Save Required",
        description: "Please save your template first before generating HTML.",
        variant: "destructive",
      });
    }
  };

  // Copy variable to clipboard
  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast({
      title: "Copied",
      description: `${variable} copied to clipboard`,
    });
  };

  // Drag and drop handlers
  const handleDragStart = (type: EmailBlock["type"]) => {
    setIsDragging(true);
    setDraggedBlockType(type);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedBlockType(null);
  };

  const handleDrop = (index: number) => {
    if (draggedBlockType) {
      addBlock(draggedBlockType, index);
    }
    handleDragEnd();
  };

  // Render email block preview with professional email-safe inline styles
  const renderBlockPreview = (block: EmailBlock) => {
    const baseStyles: React.CSSProperties = {
      padding: block.styles?.padding || "24px 32px",
      margin: block.styles?.margin || "0",
      textAlign: (block.styles?.textAlign || "left") as React.CSSProperties["textAlign"],
      backgroundColor: block.styles?.backgroundColor || "transparent",
      color: block.styles?.textColor || brandSettings.textColor,
      fontFamily: block.styles?.fontFamily || brandSettings.fontFamily,
    };

    switch (block.type) {
      case "heading":
        const headingLevel = block.content?.level || "h1";
        const headingSize = headingLevel === "h1" ? "28px" : headingLevel === "h2" ? "24px" : "20px";
        return (
          <div style={{ ...baseStyles, textAlign: "center" as const }}>
            <h2 style={{ 
              fontSize: block.styles?.fontSize || headingSize, 
              fontWeight: "700",
              margin: 0,
              color: baseStyles.color,
              lineHeight: "1.3",
              letterSpacing: "-0.02em",
            }}>
              {block.content?.text || "Your Heading Here"}
            </h2>
          </div>
        );
      
      case "text":
        return (
          <div style={{ 
            ...baseStyles, 
            fontSize: block.styles?.fontSize || "16px", 
            lineHeight: "1.7",
            whiteSpace: "pre-wrap",
          }}>
            {block.content?.text || "Add your email content here..."}
          </div>
        );
      
      case "image":
        return (
          <div style={{ ...baseStyles, textAlign: "center" as const }}>
            {block.content?.src ? (
              <img 
                src={block.content.src} 
                alt={block.content?.alt || "Image"} 
                style={{ 
                  maxWidth: block.styles?.width || "100%", 
                  height: "auto",
                  borderRadius: block.content?.borderRadius || "12px",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            ) : (
              <div style={{
                backgroundColor: "#f8f9fa",
                border: "2px dashed #dee2e6",
                borderRadius: "12px",
                padding: "48px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Image style={{ width: 48, height: 48, color: "#adb5bd", marginBottom: 12 }} />
                <span style={{ color: "#868e96", fontSize: "14px" }}>Add product image</span>
                <span style={{ color: "#adb5bd", fontSize: "12px", marginTop: 4 }}>Recommended: 600x400px</span>
              </div>
            )}
          </div>
        );
      
      case "button":
        return (
          <div style={{ ...baseStyles, textAlign: "center" as const, padding: "24px 32px" }}>
            <table cellPadding="0" cellSpacing="0" style={{ margin: "0 auto" }}>
              <tbody>
                <tr>
                  <td 
                    style={{
                      backgroundColor: block.styles?.backgroundColor || brandSettings.primaryColor,
                      borderRadius: block.styles?.borderRadius || "8px",
                      textAlign: "center" as const,
                    }}
                  >
                    <a 
                      href="#" 
                      onClick={(e) => e.preventDefault()}
                      style={{
                        display: "inline-block",
                        padding: "14px 32px",
                        backgroundColor: block.styles?.backgroundColor || brandSettings.primaryColor,
                        color: block.styles?.textColor || "#000000",
                        textDecoration: "none",
                        borderRadius: block.styles?.borderRadius || "8px",
                        fontWeight: "600",
                        fontSize: block.styles?.fontSize || "16px",
                        letterSpacing: "0.02em",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {block.content?.text || "Shop Now"}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      
      case "divider":
        return (
          <div style={{ ...baseStyles, textAlign: "center" as const }}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tbody>
                <tr>
                  <td style={{ padding: "16px 0" }}>
                    <div style={{ 
                      borderTop: `1px ${block.content?.style || "solid"} ${block.content?.color || "#e5e7eb"}`,
                      height: 0,
                      lineHeight: 0,
                      fontSize: 0,
                    }} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      
      case "spacer":
        return (
          <div style={{ height: block.content?.height || "32px", lineHeight: block.content?.height || "32px", fontSize: 0 }}>
            &nbsp;
          </div>
        );
      
      case "columns":
        return (
          <div style={baseStyles}>
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td width="48%" style={{ padding: "16px", verticalAlign: "top", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                    <div style={{ fontSize: "14px", color: "#495057", textAlign: "center" as const }}>
                      {block.content?.leftContent || "Left column content"}
                    </div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style={{ padding: "16px", verticalAlign: "top", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                    <div style={{ fontSize: "14px", color: "#495057", textAlign: "center" as const }}>
                      {block.content?.rightContent || "Right column content"}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      
      case "logo":
        return (
          <div style={{ ...baseStyles, textAlign: "center" as const, padding: "32px 32px 16px 32px" }}>
            {block.content?.src || brandSettings.logoUrl ? (
              <img 
                src={block.content?.src || brandSettings.logoUrl} 
                alt={block.content?.alt || "Logo"} 
                style={{ 
                  maxWidth: block.styles?.width || "160px", 
                  height: "auto",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            ) : (
              <div style={{
                backgroundColor: "#f8f9fa",
                border: "2px dashed #dee2e6",
                borderRadius: "8px",
                padding: "20px 40px",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <ImageIcon style={{ width: 32, height: 32, color: "#adb5bd", marginBottom: 8 }} />
                <span style={{ color: "#868e96", fontSize: "13px" }}>Your Logo</span>
              </div>
            )}
          </div>
        );
      
      default:
        return <div style={baseStyles}>Unknown block type</div>;
    }
  };

  // Get workflow icon
  const getWorkflowIcon = (type: string) => {
    const workflow = workflowTypes.find(w => w.value === type);
    return workflow ? workflow.icon : FileText;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 rounded-b-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="text-lg font-semibold bg-transparent border-none h-8 px-0 focus-visible:ring-0"
                  data-testid="input-template-name"
                />
                <Badge 
                  variant={status === "active" ? "default" : "secondary"}
                  className={status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                >
                  {status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {autoSaveStatus === "saved" && (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span>Auto-saved</span>
                  </>
                )}
                {autoSaveStatus === "saving" && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                )}
                {autoSaveStatus === "unsaved" && (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>Unsaved changes</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Preview mode toggle */}
            <div className="flex items-center bg-muted/50 rounded-lg p-1">
              <Button
                variant={previewMode === "desktop" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode("desktop")}
                className="h-8"
                data-testid="button-preview-desktop"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={previewMode === "mobile" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode("mobile")}
                className="h-8"
                data-testid="button-preview-mobile"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Undo/Redo */}
            <Button variant="ghost" size="icon" data-testid="button-undo">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-redo">
              <Redo2 className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Version history */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowVersionHistory(true)}
              data-testid="button-version-history"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            
            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-more-actions">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicateTemplate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate Template
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  Send Test Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setStatus(status === "active" ? "draft" : "active")}
                >
                  {status === "active" ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Set as Draft
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Set as Active
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      onSelect={(e) => e.preventDefault()}
                      className="text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Template
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete "{templateName}" 
                        and all its version history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-500 hover:bg-red-600"
                        onClick={handleDeleteTemplate}
                        disabled={deleteTemplateMutation.isPending}
                      >
                        {deleteTemplateMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Generate HTML button */}
            <Button 
              variant="outline" 
              onClick={handleGenerateHtml}
              disabled={renderHtmlMutation.isPending || !selectedTemplateId}
              data-testid="button-generate-html"
            >
              {renderHtmlMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Export HTML
            </Button>
            
            {/* Save button */}
            <Button 
              onClick={handleSave} 
              className="bg-primary hover:bg-primary/90" 
              data-testid="button-save"
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {selectedTemplateId ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </header>
      {/* Main 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Blocks, Variables, AI Actions */}
        <div className="w-80 border-r border-border flex flex-col bg-[#14142b]">
          <Tabs value={leftPanelTab} onValueChange={(v) => setLeftPanelTab(v as typeof leftPanelTab)} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-12 px-2">
              <TabsTrigger value="blocks" className="data-[state=active]:bg-primary/10">
                <Columns className="w-4 h-4 mr-2" />
                Blocks
              </TabsTrigger>
              <TabsTrigger value="variables" className="data-[state=active]:bg-primary/10">
                <Zap className="w-4 h-4 mr-2" />
                Variables
              </TabsTrigger>
              <TabsTrigger value="ai" className="data-[state=active]:bg-primary/10">
                <Sparkles className="w-4 h-4 mr-2" />
                AI
              </TabsTrigger>
            </TabsList>

            {/* Blocks Tab */}
            <TabsContent value="blocks" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {/* Template List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">My Templates</h3>
                      <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7" data-testid="button-new-template">
                            <Plus className="w-3 h-3 mr-1" />
                            New
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Template</DialogTitle>
                            <DialogDescription>
                              Start from scratch or choose a workflow type to get started with pre-built content.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-3 py-4">
                            {workflowTypes.map((wf) => {
                              const Icon = wf.icon;
                              return (
                                <Button
                                  key={wf.value}
                                  variant="outline"
                                  className="h-auto py-4 flex-col gap-2 hover:border-primary/50"
                                  disabled={createTemplateMutation.isPending}
                                  onClick={() => {
                                    const newBlocks = [
                                      createDefaultBlock("logo"),
                                      createDefaultBlock("heading"),
                                      createDefaultBlock("text"),
                                      createDefaultBlock("button"),
                                    ];
                                    createTemplateMutation.mutate({
                                      name: `New ${wf.label} Template`,
                                      workflowType: wf.value,
                                      status: "draft",
                                      blocks: newBlocks,
                                      brandSettings: defaultBrandSettings,
                                    });
                                  }}
                                >
                                  {createTemplateMutation.isPending ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                  ) : (
                                    <Icon className={`w-6 h-6 ${wf.color}`} />
                                  )}
                                  <span className="text-sm">{wf.label}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="relative mb-3">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-9 h-9"
                        data-testid="input-search-templates"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      {templatesLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">Loading templates...</span>
                        </div>
                      ) : templatesError ? (
                        <div className="text-sm text-red-400 py-4 text-center">
                          Failed to load templates
                        </div>
                      ) : filteredTemplates.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-4 text-center">
                          No templates yet. Click "New" to create one.
                        </div>
                      ) : (
                        filteredTemplates.slice(0, 5).map((template) => {
                          const WorkflowIcon = getWorkflowIcon(template.workflowType);
                          const workflow = workflowTypes.find(w => w.value === template.workflowType);
                          return (
                            <div
                              key={template.id}
                              onClick={() => handleSelectTemplate(template.id)}
                              className={`p-2 rounded-md cursor-pointer transition-all ${
                                selectedTemplateId === template.id
                                  ? "bg-primary/20 border border-primary/50"
                                  : "hover:bg-muted/50"
                              }`}
                              data-testid={`template-item-${template.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <WorkflowIcon className={`w-4 h-4 ${workflow?.color || "text-gray-400"}`} />
                                <span className="text-sm font-medium truncate flex-1">{template.name}</span>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-[10px] ${
                                    template.status === "active" 
                                      ? "bg-green-500/20 text-green-400" 
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {template.status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Block Types */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Email Blocks</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Drag blocks to the preview or click to add
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {blockTypes.map((block) => {
                        const Icon = block.icon;
                        return (
                          <Tooltip key={block.type}>
                            <TooltipTrigger asChild>
                              <div
                                draggable
                                onDragStart={() => handleDragStart(block.type as EmailBlock["type"])}
                                onDragEnd={handleDragEnd}
                                onClick={() => addBlock(block.type as EmailBlock["type"])}
                                className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-all"
                                data-testid={`block-${block.type}`}
                              >
                                <Icon className="w-5 h-5 text-muted-foreground" />
                                <span className="text-xs">{block.label}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>{block.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Variables Tab */}
            <TabsContent value="variables" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Click to copy a variable to your clipboard, then paste it in your email content.
                  </p>
                  
                  {["customer", "order", "cart", "store", "promo", "compliance"].map((category) => (
                    <div key={category}>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 capitalize">
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {emailVariables
                          .filter((v) => v.category === category)
                          .map((variable, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleCopyVariable(variable.var)}
                              className="w-full text-left p-2 rounded-md bg-muted/30 hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all group"
                              data-testid={`variable-${category}-${idx}`}
                            >
                              <code className="text-primary text-xs font-mono block">
                                {variable.var}
                              </code>
                              <span className="text-muted-foreground text-[10px]">
                                {variable.desc}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* AI Tab */}
            <TabsContent value="ai" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold">AI Email Optimization</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use AI to enhance your email copy, improve deliverability, and boost conversions.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleAIAction("tone-improvement")}
                      disabled={aiLoading !== null}
                      data-testid="ai-tone-improvement"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-md bg-blue-500/10">
                          <MessageSquare className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">Improve Tone</div>
                          <div className="text-xs text-muted-foreground">Make copy more engaging</div>
                        </div>
                        {aiLoading === "tone-improvement" && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleAIAction("ctr-optimization")}
                      disabled={aiLoading !== null}
                      data-testid="ai-ctr-optimization"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-md bg-green-500/10">
                          <Target className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">Optimize for CTR</div>
                          <div className="text-xs text-muted-foreground">Improve click-through rates</div>
                        </div>
                        {aiLoading === "ctr-optimization" && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleAIAction("professional-rewrite")}
                      disabled={aiLoading !== null}
                      data-testid="ai-professional-rewrite"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-md bg-purple-500/10">
                          <Wand2 className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">Professional Rewrite</div>
                          <div className="text-xs text-muted-foreground">Polish and refine copy</div>
                        </div>
                        {aiLoading === "professional-rewrite" && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleAIAction("spam-analysis")}
                      disabled={aiLoading !== null}
                      data-testid="ai-spam-analysis"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-md bg-orange-500/10">
                          <AlertTriangle className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">Spam Analysis</div>
                          <div className="text-xs text-muted-foreground">Check deliverability risks</div>
                        </div>
                        {aiLoading === "spam-analysis" && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleAIAction("can-spam-check")}
                      disabled={aiLoading !== null}
                      data-testid="ai-can-spam-check"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-md bg-cyan-500/10">
                          <Shield className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">CAN-SPAM Compliance</div>
                          <div className="text-xs text-muted-foreground">Verify legal requirements</div>
                        </div>
                        {aiLoading === "can-spam-check" && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleAIAction("generate-email")}
                      disabled={aiLoading !== null}
                      data-testid="ai-generate-email"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-md bg-gradient-to-r from-purple-500/20 to-cyan-500/20">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">Generate Full Email</div>
                          <div className="text-xs text-muted-foreground">Create from scratch with AI</div>
                        </div>
                        {aiLoading === "generate-email" && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* CENTER PANEL - Email Preview */}
        <div className="flex-1 bg-muted/20 overflow-hidden flex flex-col">
          {/* Email metadata */}
          <div className="p-4 border-b border-border space-y-3 bg-[#14142b]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Subject Line</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="h-9"
                  data-testid="input-subject"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Preheader Text</Label>
                <Input
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="Preview text shown in inbox..."
                  className="h-9"
                  data-testid="input-preheader"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Workflow:</Label>
                <Select value={workflowType} onValueChange={setWorkflowType}>
                  <SelectTrigger className="h-8 w-40" data-testid="select-workflow-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workflowTypes.map((wf) => {
                      const Icon = wf.icon;
                      return (
                        <SelectItem key={wf.value} value={wf.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${wf.color}`} />
                            <span>{wf.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Email canvas - Professional ESP-style preview */}
          <ScrollArea className="flex-1">
            <div className="p-8 flex justify-center" style={{ backgroundColor: "#1a1a2e", minHeight: "100%" }}>
              {/* Email container wrapper - mimics email client */}
              <div className="w-full" style={{ maxWidth: previewMode === "mobile" ? "375px" : "680px" }}>
                {/* Email client header simulation */}
                <div className="rounded-t-xl overflow-hidden" style={{ backgroundColor: "#2d2d44" }}>
                  <div className="flex items-center gap-2 px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                      <div className="w-3 h-3 rounded-full bg-green-400/80" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-[#1a1a2e] rounded-md px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{subject || "Email Preview"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actual email content */}
                <div 
                  className="shadow-2xl transition-all duration-300"
                  style={{ 
                    backgroundColor: brandSettings.backgroundColor,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {/* Email blocks */}
                  <div 
                    className="min-h-[500px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(blocks.length)}
                  >
                    {blocks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[500px] text-center p-12" style={{ backgroundColor: brandSettings.backgroundColor }}>
                        <div style={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: "50%", 
                          backgroundColor: "#f8f9fa",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 24,
                        }}>
                          <Mail style={{ width: 40, height: 40, color: "#adb5bd" }} />
                        </div>
                        <h3 style={{ 
                          fontSize: "20px", 
                          fontWeight: "600", 
                          color: "#495057",
                          marginBottom: 8,
                        }}>
                          Build Your Email Template
                        </h3>
                        <p style={{ 
                          fontSize: "14px", 
                          color: "#868e96",
                          marginBottom: 24,
                          maxWidth: 280,
                          lineHeight: 1.6,
                        }}>
                          Drag blocks from the left panel to create a professional email that converts
                        </p>
                        <Button onClick={() => addBlock("heading")} style={{ backgroundColor: brandSettings.primaryColor, color: "#000" }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Block
                        </Button>
                      </div>
                    ) : (
                      blocks.map((block, index) => (
                        <div
                          key={block.id}
                          onClick={() => setSelectedBlockId(block.id)}
                          className={`group relative cursor-pointer transition-all duration-150`}
                          style={{
                            outline: selectedBlockId === block.id ? `2px solid ${brandSettings.primaryColor}` : "none",
                            outlineOffset: "-2px",
                          }}
                          data-testid={`block-preview-${block.id}`}
                        >
                          {/* Block controls - left side drag handle */}
                          <div 
                            className={`absolute left-0 top-0 bottom-0 w-10 flex flex-col items-center justify-center gap-1 transition-opacity duration-150 ${
                              selectedBlockId === block.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}
                            style={{ backgroundColor: `${brandSettings.primaryColor}15` }}
                          >
                            <GripVertical className="w-5 h-5 cursor-grab" style={{ color: brandSettings.primaryColor }} />
                          </div>
                          
                          {/* Block actions - top right */}
                          <div 
                            className={`absolute right-3 top-3 flex items-center gap-1.5 transition-opacity duration-150 ${
                              selectedBlockId === block.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}
                            style={{ zIndex: 10 }}
                          >
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7 shadow-md"
                              style={{ backgroundColor: "#fff", border: "1px solid #dee2e6" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateBlock(block.id);
                              }}
                            >
                              <Copy className="w-3.5 h-3.5" style={{ color: "#495057" }} />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7 shadow-md"
                              style={{ backgroundColor: "#fff", border: "1px solid #dee2e6" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBlock(block.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" style={{ color: "#dc3545" }} />
                            </Button>
                          </div>
                          
                          {/* Block content */}
                          <div className="pl-10">
                            {renderBlockPreview(block)}
                          </div>
                          
                          {/* Drop zone indicator */}
                          {isDragging && (
                            <div
                              className="absolute inset-x-0 bottom-0 h-1"
                              style={{ backgroundColor: brandSettings.primaryColor }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.stopPropagation();
                                handleDrop(index + 1);
                              }}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Professional footer for CAN-SPAM compliance */}
                  <div style={{ 
                    backgroundColor: "#f8f9fa",
                    borderTop: "1px solid #e9ecef",
                    padding: "32px",
                  }}>
                    {/* Help section */}
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                      <p style={{ fontSize: "14px", color: "#495057", marginBottom: 8 }}>
                        Need help with your order?
                      </p>
                      <a 
                        href="#" 
                        onClick={(e) => e.preventDefault()}
                        style={{ 
                          color: brandSettings.primaryColor, 
                          textDecoration: "none",
                          fontWeight: "500",
                          fontSize: "14px",
                        }}
                      >
                        Contact Support
                      </a>
                    </div>
                    
                    {/* Divider */}
                    <div style={{ borderTop: "1px solid #dee2e6", margin: "0 0 24px 0" }} />
                    
                    {/* Company info and compliance */}
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: "12px", color: "#6c757d", marginBottom: 8 }}>
                        {brandSettings.footerText || "Your Company Name | 123 Business Street, City, State 12345"}
                      </p>
                      <p style={{ fontSize: "12px", color: "#868e96", marginBottom: 16 }}>
                        You received this email because you made a purchase or signed up for updates.
                      </p>
                      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                        <a 
                          href="#" 
                          onClick={(e) => e.preventDefault()}
                          style={{ fontSize: "12px", color: "#495057", textDecoration: "underline" }}
                        >
                          Unsubscribe
                        </a>
                        <a 
                          href="#" 
                          onClick={(e) => e.preventDefault()}
                          style={{ fontSize: "12px", color: "#495057", textDecoration: "underline" }}
                        >
                          Email Preferences
                        </a>
                        <a 
                          href="#" 
                          onClick={(e) => e.preventDefault()}
                          style={{ fontSize: "12px", color: "#495057", textDecoration: "underline" }}
                        >
                          Privacy Policy
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Email client footer simulation */}
                <div className="rounded-b-xl overflow-hidden" style={{ backgroundColor: "#2d2d44", padding: "8px 16px" }}>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{previewMode === "mobile" ? "Mobile Preview" : "Desktop Preview"} - 600px max width</span>
                    <span>Email-safe HTML</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* RIGHT PANEL - Styling Controls */}
        <div className="w-80 border-l border-border bg-card/30 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6 bg-[#14142b]">
              {selectedBlock ? (
                <>
                  {/* Block-specific settings */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Settings className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold capitalize">{selectedBlock.type} Settings</h3>
                    </div>
                    
                    {/* Content settings based on block type */}
                    {selectedBlock.type === "heading" && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs">Heading Text</Label>
                          <Textarea
                            value={selectedBlock.content?.text || ""}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              content: { ...selectedBlock.content, text: e.target.value }
                            })}
                            className="mt-1"
                            rows={2}
                            data-testid="input-heading-text"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Heading Level</Label>
                          <Select
                            value={selectedBlock.content?.level || "h2"}
                            onValueChange={(value) => updateBlock(selectedBlock.id, {
                              content: { ...selectedBlock.content, level: value }
                            })}
                          >
                            <SelectTrigger className="mt-1" data-testid="select-heading-level">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="h1">H1 - Large</SelectItem>
                              <SelectItem value="h2">H2 - Medium</SelectItem>
                              <SelectItem value="h3">H3 - Small</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {selectedBlock.type === "text" && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs">Content</Label>
                          <Textarea
                            value={selectedBlock.content?.text || ""}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              content: { ...selectedBlock.content, text: e.target.value }
                            })}
                            className="mt-1"
                            rows={4}
                            data-testid="input-text-content"
                          />
                        </div>
                      </div>
                    )}

                    {selectedBlock.type === "image" && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs">Image URL</Label>
                          <Input
                            value={selectedBlock.content?.src || ""}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              content: { ...selectedBlock.content, src: e.target.value }
                            })}
                            placeholder="https://..."
                            className="mt-1"
                            data-testid="input-image-url"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Alt Text</Label>
                          <Input
                            value={selectedBlock.content?.alt || ""}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              content: { ...selectedBlock.content, alt: e.target.value }
                            })}
                            placeholder="Image description"
                            className="mt-1"
                            data-testid="input-image-alt"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Link URL (optional)</Label>
                          <Input
                            value={selectedBlock.content?.linkUrl || ""}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              content: { ...selectedBlock.content, linkUrl: e.target.value }
                            })}
                            placeholder="https://..."
                            className="mt-1"
                            data-testid="input-image-link"
                          />
                        </div>
                      </div>
                    )}

                    {selectedBlock.type === "button" && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs">Button Text</Label>
                          <Input
                            value={selectedBlock.content?.text || ""}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              content: { ...selectedBlock.content, text: e.target.value }
                            })}
                            className="mt-1"
                            data-testid="input-button-text"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Button URL</Label>
                          <Input
                            value={selectedBlock.content?.url || ""}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              content: { ...selectedBlock.content, url: e.target.value }
                            })}
                            placeholder="https:// or {{variable}}"
                            className="mt-1"
                            data-testid="input-button-url"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Button Color</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="color"
                              value={selectedBlock.styles?.backgroundColor || brandSettings.primaryColor}
                              onChange={(e) => updateBlock(selectedBlock.id, {
                                styles: { ...selectedBlock.styles, backgroundColor: e.target.value }
                              })}
                              className="w-12 h-9 p-1 cursor-pointer"
                              data-testid="input-button-color"
                            />
                            <Input
                              value={selectedBlock.styles?.backgroundColor || brandSettings.primaryColor}
                              onChange={(e) => updateBlock(selectedBlock.id, {
                                styles: { ...selectedBlock.styles, backgroundColor: e.target.value }
                              })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Text Color</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="color"
                              value={selectedBlock.styles?.textColor || "#000000"}
                              onChange={(e) => updateBlock(selectedBlock.id, {
                                styles: { ...selectedBlock.styles, textColor: e.target.value }
                              })}
                              className="w-12 h-9 p-1 cursor-pointer"
                              data-testid="input-button-text-color"
                            />
                            <Input
                              value={selectedBlock.styles?.textColor || "#000000"}
                              onChange={(e) => updateBlock(selectedBlock.id, {
                                styles: { ...selectedBlock.styles, textColor: e.target.value }
                              })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedBlock.type === "spacer" && (
                      <div>
                        <Label className="text-xs">Height (px)</Label>
                        <Input
                          type="number"
                          value={parseInt(selectedBlock.content?.height || "24")}
                          onChange={(e) => updateBlock(selectedBlock.id, {
                            content: { ...selectedBlock.content, height: `${e.target.value}px` }
                          })}
                          min={8}
                          max={200}
                          className="mt-1"
                          data-testid="input-spacer-height"
                        />
                      </div>
                    )}

                    {selectedBlock.type === "divider" && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs">Line Style</Label>
                          <Select
                            value={selectedBlock.content?.style || "solid"}
                            onValueChange={(value) => updateBlock(selectedBlock.id, {
                              content: { ...selectedBlock.content, style: value }
                            })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solid">Solid</SelectItem>
                              <SelectItem value="dashed">Dashed</SelectItem>
                              <SelectItem value="dotted">Dotted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Line Color</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="color"
                              value={selectedBlock.content?.color || "#e5e7eb"}
                              onChange={(e) => updateBlock(selectedBlock.id, {
                                content: { ...selectedBlock.content, color: e.target.value }
                              })}
                              className="w-12 h-9 p-1 cursor-pointer"
                            />
                            <Input
                              value={selectedBlock.content?.color || "#e5e7eb"}
                              onChange={(e) => updateBlock(selectedBlock.id, {
                                content: { ...selectedBlock.content, color: e.target.value }
                              })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Common styling controls */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Palette className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">Style</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Text alignment */}
                      {["heading", "text", "button", "image", "logo"].includes(selectedBlock.type) && (
                        <div>
                          <Label className="text-xs">Alignment</Label>
                          <div className="flex gap-1 mt-1">
                            {[
                              { value: "left", icon: AlignLeft },
                              { value: "center", icon: AlignCenter },
                              { value: "right", icon: AlignRight },
                            ].map(({ value, icon: Icon }) => (
                              <Button
                                key={value}
                                variant={selectedBlock.styles?.textAlign === value ? "secondary" : "ghost"}
                                size="icon"
                                onClick={() => updateBlock(selectedBlock.id, {
                                  styles: { ...selectedBlock.styles, textAlign: value as "left" | "center" | "right" }
                                })}
                              >
                                <Icon className="w-4 h-4" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Font size */}
                      {["heading", "text", "button"].includes(selectedBlock.type) && (
                        <div>
                          <Label className="text-xs">Font Size</Label>
                          <Select
                            value={selectedBlock.styles?.fontSize || "16px"}
                            onValueChange={(value) => updateBlock(selectedBlock.id, {
                              styles: { ...selectedBlock.styles, fontSize: value }
                            })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12px">12px - Small</SelectItem>
                              <SelectItem value="14px">14px - Caption</SelectItem>
                              <SelectItem value="16px">16px - Body</SelectItem>
                              <SelectItem value="18px">18px - Large</SelectItem>
                              <SelectItem value="24px">24px - Heading</SelectItem>
                              <SelectItem value="32px">32px - Display</SelectItem>
                              <SelectItem value="48px">48px - Hero</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Padding */}
                      <div>
                        <Label className="text-xs">Padding</Label>
                        <Select
                          value={selectedBlock.styles?.padding || "16px"}
                          onValueChange={(value) => updateBlock(selectedBlock.id, {
                            styles: { ...selectedBlock.styles, padding: value }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None</SelectItem>
                            <SelectItem value="8px">Small (8px)</SelectItem>
                            <SelectItem value="16px">Medium (16px)</SelectItem>
                            <SelectItem value="24px">Large (24px)</SelectItem>
                            <SelectItem value="32px">Extra Large (32px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Background color */}
                      {!["button"].includes(selectedBlock.type) && (
                        <div>
                          <Label className="text-xs">Background Color</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="color"
                              value={selectedBlock.styles?.backgroundColor || "#ffffff"}
                              onChange={(e) => updateBlock(selectedBlock.id, {
                                styles: { ...selectedBlock.styles, backgroundColor: e.target.value }
                              })}
                              className="w-12 h-9 p-1 cursor-pointer"
                            />
                            <Input
                              value={selectedBlock.styles?.backgroundColor || "transparent"}
                              onChange={(e) => updateBlock(selectedBlock.id, {
                                styles: { ...selectedBlock.styles, backgroundColor: e.target.value }
                              })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Brand Settings when no block selected */
                (<div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Palette className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">Brand Settings</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Select a block to edit its properties, or customize your brand settings below.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs">Logo URL</Label>
                      <Input
                        value={brandSettings.logoUrl}
                        onChange={(e) => setBrandSettings({ ...brandSettings, logoUrl: e.target.value })}
                        placeholder="https://..."
                        className="mt-1"
                        data-testid="input-brand-logo"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Primary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={brandSettings.primaryColor}
                          onChange={(e) => setBrandSettings({ ...brandSettings, primaryColor: e.target.value })}
                          className="w-12 h-9 p-1 cursor-pointer"
                          data-testid="input-primary-color"
                        />
                        <Input
                          value={brandSettings.primaryColor}
                          onChange={(e) => setBrandSettings({ ...brandSettings, primaryColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Secondary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={brandSettings.secondaryColor}
                          onChange={(e) => setBrandSettings({ ...brandSettings, secondaryColor: e.target.value })}
                          className="w-12 h-9 p-1 cursor-pointer"
                          data-testid="input-secondary-color"
                        />
                        <Input
                          value={brandSettings.secondaryColor}
                          onChange={(e) => setBrandSettings({ ...brandSettings, secondaryColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Background Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={brandSettings.backgroundColor}
                          onChange={(e) => setBrandSettings({ ...brandSettings, backgroundColor: e.target.value })}
                          className="w-12 h-9 p-1 cursor-pointer"
                          data-testid="input-bg-color"
                        />
                        <Input
                          value={brandSettings.backgroundColor}
                          onChange={(e) => setBrandSettings({ ...brandSettings, backgroundColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={brandSettings.textColor}
                          onChange={(e) => setBrandSettings({ ...brandSettings, textColor: e.target.value })}
                          className="w-12 h-9 p-1 cursor-pointer"
                          data-testid="input-text-color"
                        />
                        <Input
                          value={brandSettings.textColor}
                          onChange={(e) => setBrandSettings({ ...brandSettings, textColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Font Family</Label>
                      <Select
                        value={brandSettings.fontFamily}
                        onValueChange={(value) => setBrandSettings({ ...brandSettings, fontFamily: value })}
                      >
                        <SelectTrigger className="mt-1" data-testid="select-font-family">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontFamilies.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-xs">Footer Text (CAN-SPAM)</Label>
                      <Textarea
                        value={brandSettings.footerText}
                        onChange={(e) => setBrandSettings({ ...brandSettings, footerText: e.target.value })}
                        placeholder="Company Name | Address"
                        className="mt-1"
                        rows={2}
                        data-testid="input-footer-text"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Required for CAN-SPAM compliance
                      </p>
                    </div>
                  </div>
                </div>)
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and restore previous versions of this template
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              {[
                { version: 3, date: "Today, 2:30 PM", note: "Updated button styles" },
                { version: 2, date: "Yesterday, 4:15 PM", note: "Changed subject line" },
                { version: 1, date: "Dec 28, 2025", note: "Initial version" },
              ].map((v) => (
                <div
                  key={v.version}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">v{v.version}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{v.note}</p>
                      <p className="text-xs text-muted-foreground">{v.date}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
