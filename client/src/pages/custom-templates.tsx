import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageShell } from "@/components/ui/page-shell";
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
  Zap
} from "lucide-react";

const templateVariables = [
  { var: "{customerName}", desc: "Customer's full name" },
  { var: "{firstName}", desc: "First name only" },
  { var: "{email}", desc: "Email address" },
  { var: "{orderNumber}", desc: "Order number" },
  { var: "{orderTotal}", desc: "Order total" },
  { var: "{productName}", desc: "Product name" },
  { var: "{discountCode}", desc: "Discount code" },
  { var: "{storeName}", desc: "Store name" },
  { var: "{date}", desc: "Current date" }
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
    <PageShell
      title="Template Editor"
      subtitle="Create and manage your marketing templates"
      backTo="/campaigns"
      rightActions={
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="border-[rgba(0,240,255,0.3)] text-white hidden sm:flex">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSaveTemplate} className="bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Save Template</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Sidebar - Template List */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="gradient-card overflow-hidden">
            <div className="p-4 border-b border-[rgba(0,240,255,0.15)]">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-primary" />
                </div>
                <Input 
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0D0D1F] border-[rgba(0,240,255,0.2)] text-white placeholder:text-muted-foreground h-10 w-full pl-[33px] pr-[33px]"
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
                        : "hover:bg-[#1a1a3a] border border-transparent"
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
                                : "bg-[#1a1a3a] text-muted-foreground"
                            }`}
                          >
                            {template.status}
                          </Badge>
                          <span className="text-muted-foreground text-xs">{template.usageCount} uses</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white flex-shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-muted-foreground text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{template.lastModified}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-[rgba(0,240,255,0.15)]">
              <Button className="w-full bg-[#1a1a3a] hover:bg-[#252550] text-white border border-[rgba(0,240,255,0.2)]" data-testid="button-new-template">
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>
          </Card>

          {/* Quick Variables */}
          <Card className="gradient-card p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Quick Variables
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {templateVariables.slice(0, 6).map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleCopyVariable(item.var)}
                  className="text-left p-2 rounded-md bg-[#0D0D1F] hover:bg-[#1a1a3a] border border-[rgba(0,240,255,0.15)] hover:border-primary/50 transition-all group"
                  data-testid={`variable-${index}`}
                >
                  <code className="text-primary text-xs font-mono block truncate">{item.var}</code>
                  <span className="text-muted-foreground text-[10px] block truncate">{item.desc}</span>
                </button>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-2 text-muted-foreground hover:text-white text-xs">
              View all variables
            </Button>
          </Card>
        </div>

        {/* Main Editor Area */}
        <div className="xl:col-span-9">
          <Card className="gradient-card overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-[rgba(0,240,255,0.15)] px-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <TabsList className="bg-transparent h-14 p-0 gap-1">
                    <TabsTrigger 
                      value="editor" 
                      className="data-[state=active]:bg-[#1a1a3a] data-[state=active]:text-white text-muted-foreground rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger 
                      value="preview" 
                      className="data-[state=active]:bg-[#1a1a3a] data-[state=active]:text-white text-muted-foreground rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="code" 
                      className="data-[state=active]:bg-[#1a1a3a] data-[state=active]:text-white text-muted-foreground rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
                    >
                      <Code className="w-4 h-4 mr-2" />
                      HTML
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-[#0D0D1F] rounded-lg p-1 border border-[rgba(0,240,255,0.15)]">
                      <button
                        onClick={() => setTemplateType("email")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          templateType === "email" 
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:text-white"
                        }`}
                      >
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email
                      </button>
                      <button
                        onClick={() => setTemplateType("sms")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          templateType === "sms" 
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:text-white"
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
                      <Label className="text-white text-sm font-medium">Template Name</Label>
                      <Input 
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="bg-[#0D0D1F] border-[rgba(0,240,255,0.2)] text-white h-11"
                        placeholder="Enter template name..."
                        data-testid="input-template-name"
                      />
                    </div>
                    {templateType === "email" && (
                      <div className="space-y-2">
                        <Label className="text-white text-sm font-medium">Subject Line</Label>
                        <Input 
                          value={subjectLine}
                          onChange={(e) => setSubjectLine(e.target.value)}
                          className="bg-[#0D0D1F] border-[rgba(0,240,255,0.2)] text-white h-11"
                          placeholder="Email subject..."
                          data-testid="input-subject-line"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white text-sm font-medium">Content</Label>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white h-8">
                          <Sparkles className="w-4 h-4 mr-1" />
                          AI Enhance
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white h-8">
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative">
                      <Textarea
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                        className="bg-[#0D0D1F] border-[rgba(0,240,255,0.2)] text-white min-h-[300px] font-mono text-sm resize-none"
                        placeholder="Write your template content here..."
                        data-testid="textarea-content"
                      />
                      <div className="absolute bottom-3 right-3 text-muted-foreground text-xs">
                        {templateContent.length} characters
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-[rgba(0,240,255,0.15)]">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>Auto-saved</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button variant="outline" className="border-[rgba(0,240,255,0.3)] text-white">
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-950/30 hover:text-red-300">
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
                      <div className="bg-gray-100 p-4 border-b">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <span className="font-medium">Subject:</span>
                          <span>{subjectLine.replace(/{storeName}/g, "Your Store")}</span>
                        </div>
                      </div>
                    )}
                    <div className="p-8">
                      <pre className="whitespace-pre-wrap font-sans text-gray-800 text-base leading-relaxed">
                        {renderPreview()}
                      </pre>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-muted-foreground text-sm">Preview showing sample data</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="code" className="m-0">
                <div className="p-6">
                  <div className="bg-[#0D0D1F] rounded-lg p-4 font-mono text-sm overflow-x-auto border border-[rgba(0,240,255,0.15)]">
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
                    <Button variant="outline" className="border-[rgba(0,240,255,0.3)] text-white">
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
    </PageShell>
  );
}
