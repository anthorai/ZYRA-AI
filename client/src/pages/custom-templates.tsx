import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  ArrowLeft,
  Edit3,
  Eye,
  Plus
} from "lucide-react";

export default function CustomTemplatesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [templateName, setTemplateName] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [templateType, setTemplateType] = useState("email");

  const savedTemplates = [
    { id: 1, name: "Welcome Email", type: "email", lastModified: "2 days ago" },
    { id: 2, name: "Abandoned Cart", type: "email", lastModified: "1 week ago" },
    { id: 3, name: "Thank You SMS", type: "sms", lastModified: "3 days ago" },
    { id: 4, name: "Order Confirmation", type: "email", lastModified: "5 days ago" },
    { id: 5, name: "Flash Sale Popup", type: "popup", lastModified: "1 day ago" }
  ];

  const handleSaveTemplate = () => {
    toast({
      title: "Template Saved!",
      description: `${templateName || "New Template"} has been saved successfully.`,
    });
  };

  const handleGoBack = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen dark-theme-bg">
      {/* Header */}
      <header className="dark-theme-bg backdrop-blur-sm border-b border-border/50 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl">
        <div className="flex items-center">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="text-slate-200 hover:text-primary hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate flex items-center">
                <FileText className="w-5 h-5 text-primary mr-2" />
                Custom Template Editor
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Create and edit email & SMS workflow templates
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
            <AvatarMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Template Editor */}
          <Card className="gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-xl">Create New Template</CardTitle>
                  <CardDescription className="text-slate-300">
                    Design custom templates for your marketing campaigns
                  </CardDescription>
                </div>
                <div className="flex space-x-4">
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger className="w-48 form-select text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="gradient-surface">
                      <SelectItem value="email">Email Template</SelectItem>
                      <SelectItem value="sms">SMS Template</SelectItem>
                      <SelectItem value="popup">Popup Template</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white text-lg">Template Name</Label>
                  <Input 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="mt-2 form-input text-white" 
                    placeholder="Welcome Email Template" 
                  />
                </div>
                {templateType === "email" && (
                  <div>
                    <Label className="text-white text-lg">Subject Line</Label>
                    <Input 
                      value={subjectLine}
                      onChange={(e) => setSubjectLine(e.target.value)}
                      className="mt-2 form-input text-white" 
                      placeholder="Welcome to our store!" 
                    />
                  </div>
                )}
              </div>
              <div>
                <Label className="text-white text-lg">Content</Label>
                <Textarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  className="mt-2 form-textarea text-white text-lg"
                  rows={10}
                  placeholder="Enter your template content here...

Use variables like:
{customerName} - Customer's name
{productName} - Product name
{orderTotal} - Order total
{discountCode} - Discount code"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveTemplate} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Templates */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-white text-xl">Saved Templates ({savedTemplates.length})</CardTitle>
              <CardDescription className="text-slate-300">
                Manage your existing templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-medium text-lg">{template.name}</span>
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full uppercase">
                          {template.type}
                        </span>
                      </div>
                      <div className="text-slate-400 text-sm mt-1">
                        Last modified {template.lastModified}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Variables Reference */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-white text-xl">Template Variables</CardTitle>
              <CardDescription className="text-slate-300">
                Available variables you can use in your templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { var: "{customerName}", desc: "Customer's full name" },
                  { var: "{firstName}", desc: "Customer's first name" },
                  { var: "{email}", desc: "Customer's email address" },
                  { var: "{orderNumber}", desc: "Order number" },
                  { var: "{orderTotal}", desc: "Total order amount" },
                  { var: "{productName}", desc: "Product name" },
                  { var: "{discountCode}", desc: "Discount code" },
                  { var: "{storeName}", desc: "Your store name" },
                  { var: "{date}", desc: "Current date" }
                ].map((item, index) => (
                  <div key={index} className="p-3 bg-slate-800/30 rounded border border-slate-600">
                    <div className="text-primary font-mono text-sm">{item.var}</div>
                    <div className="text-slate-300 text-xs mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}