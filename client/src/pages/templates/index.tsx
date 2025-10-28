import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/ui/standardized-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Mail,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  FileText,
  Info,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Template {
  id: string;
  name: string;
  type: "email" | "sms";
  subject?: string;
  content: string;
  variables?: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  name: string;
  type: "email" | "sms";
  subject: string;
  content: string;
}

export default function TemplatesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    type: "email",
    subject: "",
    content: "",
  });

  // Fetch templates
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/campaign-templates'],
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const response = await fetch('/api/campaign-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaign-templates'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Template created",
        description: "Your template has been saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateFormData> }) => {
      const response = await fetch(`/api/campaign-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaign-templates'] });
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast({
        title: "Template updated",
        description: "Your changes have been saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/campaign-templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaign-templates'] });
      setDeleteConfirmId(null);
      toast({
        title: "Template deleted",
        description: "The template has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "email",
      subject: "",
      content: "",
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || "",
      content: template.content,
    });
    setIsEditDialogOpen(true);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingTemplate) return;
    updateMutation.mutate({ id: editingTemplate.id, data: formData });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Extract variables from template content
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.slice(1, -1))));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen dark-theme-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-300">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-end mb-6">
        <Button
          onClick={openCreateDialog}
          className="bg-primary text-white hover:bg-primary/90"
          data-testid="button-create-template"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

        {/* Info Card */}
        <Card className="dark-theme-bg border-blue-500/30 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">Template Variables</h3>
                <p className="text-slate-400 text-sm">
                  Use variables in your templates: <code className="bg-slate-800 px-2 py-0.5 rounded text-blue-400">{"{customer_name}"}</code>,{" "}
                  <code className="bg-slate-800 px-2 py-0.5 rounded text-blue-400">{"{product_name}"}</code>,{" "}
                  <code className="bg-slate-800 px-2 py-0.5 rounded text-blue-400">{"{discount_code}"}</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {(!templates || templates.length === 0) && (
          <Card className="dark-theme-bg border-slate-700">
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No templates yet</h3>
                <p className="text-slate-400 mb-6">
                  Create your first template to streamline your campaign creation
                </p>
                <Button
                  onClick={openCreateDialog}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Template
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates Grid */}
        {templates && templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="shadow-lg border border-slate-700/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-xl sm:rounded-2xl dark-theme-bg">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-start justify-between min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 min-w-0">
                        {template.type === "email" ? (
                          <Mail className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                        ) : (
                          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                        )}
                        <CardTitle className="text-white text-base sm:text-lg md:text-xl truncate">{template.name}</CardTitle>
                        {template.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      {template.type === "email" && template.subject && (
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm text-slate-300 truncate">
                          {template.subject}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(template)}
                        className="border-slate-600 text-slate-300 hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      </Button>
                      {!template.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirmId(template.id)}
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm mb-3 truncate">
                    {template.content.length > 150
                      ? `${template.content.substring(0, 150)}...`
                      : template.content}
                  </p>
                  {extractVariables(template.content).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {extractVariables(template.content).map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-400">
                          {`{${variable}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingTemplate(null);
            resetForm();
          }
        }}>
          <DialogContent className="dark-theme-bg border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {isEditDialogOpen ? "Edit Template" : "Create Template"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {isEditDialogOpen ? "Update your campaign template" : "Create a new reusable campaign template"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Template Name */}
              <div>
                <Label htmlFor="template-name" className="text-white">Template Name</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email, Cart Recovery SMS"
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Template Type */}
              <div>
                <Label className="text-white">Template Type</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value: "email" | "sms") => setFormData({ ...formData, type: value })}
                  className="grid grid-cols-2 gap-4 mt-2"
                >
                  <div className="relative">
                    <RadioGroupItem value="email" id="type-email" className="peer sr-only" />
                    <Label
                      htmlFor="type-email"
                      className="flex items-center gap-2 rounded-md border-2 border-slate-700 bg-slate-800/50 p-3 hover:bg-slate-800 peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <Mail className="w-5 h-5 text-primary" />
                      <span className="text-white">Email</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem value="sms" id="type-sms" className="peer sr-only" />
                    <Label
                      htmlFor="type-sms"
                      className="flex items-center gap-2 rounded-md border-2 border-slate-700 bg-slate-800/50 p-3 hover:bg-slate-800 peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <span className="text-white">SMS</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Email Subject (only for email templates) */}
              {formData.type === "email" && (
                <div>
                  <Label htmlFor="template-subject" className="text-white">Email Subject</Label>
                  <Input
                    id="template-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Welcome to our store, {customer_name}!"
                    className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}

              {/* Template Content */}
              <div>
                <Label htmlFor="template-content" className="text-white">
                  Template Content
                </Label>
                <Textarea
                  id="template-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={
                    formData.type === "email"
                      ? "Hi {customer_name},\n\nWelcome to our store! We're excited to have you..."
                      : "Hi {customer_name}! Your order is ready. Check it out: {order_link}"
                  }
                  rows={8}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white font-mono text-sm"
                />
                {extractVariables(formData.content).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-slate-400">Variables:</span>
                    {extractVariables(formData.content).map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-400">
                        {`{${variable}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={isEditDialogOpen ? handleUpdate : handleCreate}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isEditDialogOpen
                  ? "Update Template"
                  : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent className="dark-theme-bg border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This action cannot be undone. This will permanently delete the template.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-700 text-slate-300">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </PageContainer>
  );
}
