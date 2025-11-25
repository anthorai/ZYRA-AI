import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText,
  Edit3,
  Eye,
  Plus,
  Save,
  Copy,
  Trash2,
  Mail,
  MessageSquare,
  Maximize2,
  Code,
  Sparkles,
  Search,
  MoreVertical,
  Clock,
  CheckCircle2,
  Zap,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

const templateVariables = [
  { var: "{customerName}", desc: "Customer's full name", icon: "user" },
  { var: "{firstName}", desc: "First name only", icon: "user" },
  { var: "{email}", desc: "Email address", icon: "mail" },
  { var: "{orderNumber}", desc: "Order number", icon: "hash" },
  { var: "{orderTotal}", desc: "Order total", icon: "dollar" },
  { var: "{productName}", desc: "Product name", icon: "box" },
  { var: "{discountCode}", desc: "Discount code", icon: "tag" },
  { var: "{storeName}", desc: "Store name", icon: "store" },
  { var: "{date}", desc: "Current date", icon: "calendar" }
];

const savedTemplates = [
  { id: 1, name: "Welcome Email", type: "email", status: "active", lastModified: "2 days ago", usageCount: 156 },
  { id: 2, name: "Abandoned Cart Recovery", type: "email", status: "active", lastModified: "1 week ago", usageCount: 89 },
  { id: 3, name: "Order Confirmation SMS", type: "sms", status: "draft", lastModified: "3 days ago", usageCount: 0 },
  { id: 4, name: "Thank You Email", type: "email", status: "active", lastModified: "5 days ago", usageCount: 234 },
  { id: 5, name: "Flash Sale Alert", type: "sms", status: "active", lastModified: "1 day ago", usageCount: 412 }
];

export default function CustomTemplatesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("editor");
  const [templateName, setTemplateName] = useState("Welcome Email");
  const [subjectLine, setSubjectLine] = useState("Welcome to {storeName}!");
  const [templateType, setTemplateType] = useState<"email" | "sms">("email");
  const [templateContent, setTemplateContent] = useState(`Hi {firstName},

Welcome to our family! We're thrilled to have you join us.

Thank you for your recent order #{orderNumber}. Your order total was {orderTotal}.

We've included a special discount code just for you: {discountCode}

Use it on your next purchase for 15% off!

Best regards,
The {storeName} Team`);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const handleSaveTemplate = () => {
    toast({
      title: "Template Saved",
      description: `"${templateName}" has been saved successfully.`,
    });
  };

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast({
      title: "Copied",
      description: `${variable} copied to clipboard`,
    });
  };

  const filteredTemplates = savedTemplates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPreview = () => {
    let preview = templateContent
      .replace(/{customerName}/g, "John Smith")
      .replace(/{firstName}/g, "John")
      .replace(/{email}/g, "john@example.com")
      .replace(/{orderNumber}/g, "ORD-12345")
      .replace(/{orderTotal}/g, "$149.99")
      .replace(/{productName}/g, "Premium Widget")
      .replace(/{discountCode}/g, "WELCOME15")
      .replace(/{storeName}/g, "Your Store")
      .replace(/{date}/g, new Date().toLocaleDateString());
    return preview;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/campaigns">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Template Editor
                </h1>
                <p className="text-slate-400 text-sm hidden sm:block">Create and manage your marketing templates</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hidden sm:flex">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSaveTemplate} className="bg-primary hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Save Template</span>
                <span className="sm:hidden">Save</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    data-testid="input-search-templates"
                  />
                </div>
              </div>
              <ScrollArea className="h-[300px] xl:h-[400px]">
                <div className="p-2">
                  {filteredTemplates.map((template) => (
                    <div 
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all mb-2 ${
                        selectedTemplate === template.id 
                          ? "bg-primary/20 border border-primary/50" 
                          : "hover:bg-slate-800/50 border border-transparent"
                      }`}
                      data-testid={`template-item-${template.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {template.type === "email" ? (
                              <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-green-400 flex-shrink-0" />
                            )}
                            <span className="text-white font-medium text-sm truncate">{template.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge 
                              variant={template.status === "active" ? "default" : "secondary"}
                              className={`text-[10px] px-1.5 py-0 ${
                                template.status === "active" 
                                  ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                  : "bg-slate-700 text-slate-400"
                              }`}
                            >
                              {template.status}
                            </Badge>
                            <span className="text-slate-500 text-xs">{template.usageCount} uses</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{template.lastModified}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-3 border-t border-slate-800">
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white" data-testid="button-new-template">
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Quick Variables
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {templateVariables.slice(0, 6).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleCopyVariable(item.var)}
                    className="text-left p-2 rounded-md bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-primary/50 transition-all group"
                    data-testid={`variable-${index}`}
                  >
                    <code className="text-primary text-xs font-mono block truncate group-hover:text-primary/80">{item.var}</code>
                    <span className="text-slate-500 text-[10px] block truncate">{item.desc}</span>
                  </button>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-2 text-slate-400 hover:text-white text-xs">
                View all variables
              </Button>
            </Card>
          </div>

          <div className="xl:col-span-9">
            <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-slate-800 px-4">
                  <div className="flex items-center justify-between">
                    <TabsList className="bg-transparent h-14 p-0 gap-1">
                      <TabsTrigger 
                        value="editor" 
                        className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Editor
                      </TabsTrigger>
                      <TabsTrigger 
                        value="preview" 
                        className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="code" 
                        className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
                      >
                        <Code className="w-4 h-4 mr-2" />
                        HTML
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-slate-800 rounded-lg p-1">
                        <button
                          onClick={() => setTemplateType("email")}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            templateType === "email" 
                              ? "bg-primary text-white" 
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <Mail className="w-4 h-4 inline mr-1" />
                          Email
                        </button>
                        <button
                          onClick={() => setTemplateType("sms")}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            templateType === "sms" 
                              ? "bg-primary text-white" 
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          SMS
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <TabsContent value="editor" className="m-0">
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm font-medium">Template Name</Label>
                        <Input 
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          className="bg-slate-800/50 border-slate-700 text-white h-11"
                          placeholder="Enter template name..."
                          data-testid="input-template-name"
                        />
                      </div>
                      {templateType === "email" && (
                        <div className="space-y-2">
                          <Label className="text-slate-300 text-sm font-medium">Subject Line</Label>
                          <Input 
                            value={subjectLine}
                            onChange={(e) => setSubjectLine(e.target.value)}
                            className="bg-slate-800/50 border-slate-700 text-white h-11"
                            placeholder="Email subject..."
                            data-testid="input-subject-line"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-300 text-sm font-medium">Content</Label>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8">
                            <Sparkles className="w-4 h-4 mr-1" />
                            AI Enhance
                          </Button>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8">
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="relative">
                        <Textarea
                          value={templateContent}
                          onChange={(e) => setTemplateContent(e.target.value)}
                          className="bg-slate-800/50 border-slate-700 text-white min-h-[300px] font-mono text-sm resize-none"
                          placeholder="Write your template content here..."
                          data-testid="textarea-content"
                        />
                        <div className="absolute bottom-3 right-3 text-slate-500 text-xs">
                          {templateContent.length} characters
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Auto-saved</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" className="border-slate-700 text-slate-300">
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button variant="outline" className="border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                        <Button onClick={handleSaveTemplate} className="bg-primary hover:bg-primary/90">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="m-0">
                  <div className="p-6">
                    <div className="bg-white rounded-lg max-w-2xl mx-auto shadow-2xl overflow-hidden">
                      {templateType === "email" && (
                        <div className="bg-slate-100 p-4 border-b">
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <span className="font-medium">Subject:</span>
                            <span>{subjectLine.replace(/{storeName}/g, "Your Store")}</span>
                          </div>
                        </div>
                      )}
                      <div className="p-8">
                        <pre className="whitespace-pre-wrap font-sans text-slate-800 text-base leading-relaxed">
                          {renderPreview()}
                        </pre>
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <p className="text-slate-500 text-sm">Preview showing sample data</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="code" className="m-0">
                  <div className="p-6">
                    <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-400">
{`<!DOCTYPE html>
<html>
<head>
  <title>${templateName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${templateContent.split('\n').map(line => `    <p>${line || '&nbsp;'}</p>`).join('\n')}
  </div>
</body>
</html>`}
                      </pre>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button variant="outline" className="border-slate-700 text-slate-300">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy HTML
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
