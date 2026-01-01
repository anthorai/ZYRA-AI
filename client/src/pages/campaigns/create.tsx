import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CampaignWizard } from "@/components/campaigns/CampaignWizard";
import { TemplateSelector } from "@/components/campaigns/TemplateSelector";
import { campaignPresets, getPresetById } from "@/lib/campaign-presets";
import { useAutosave } from "@/hooks/use-autosave";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { apiRequest } from "@/lib/queryClient";
import type { EmailTemplate } from "@shared/schema";
import { 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock,
  Send,
  AlertCircle,
  Save,
  Eye,
  Edit2,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmailBlock } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const campaignSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  type: z.enum(["email", "sms"]),
  goalType: z.string().optional(),
  presetId: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().min(10, "Message must be at least 10 characters"),
  audience: z.enum(["all", "abandoned_cart", "recent_customers", "inactive_customers"]),
  scheduleType: z.enum(["now", "later"]),
  scheduledFor: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "email" && (!data.subject || data.subject.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Email subject is required for email campaigns",
      path: ["subject"],
    });
  }
  
  if (data.scheduleType === "later" && (!data.scheduledFor || data.scheduledFor.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a date and time for scheduled campaigns",
      path: ["scheduledFor"],
    });
  }
  
  if (data.type === "sms" && data.content.length > 320) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "SMS message is too long (max 320 characters for 2 messages)",
      path: ["content"],
    });
  }
});

type CampaignFormData = z.infer<typeof campaignSchema>;

const wizardSteps = [
  {
    id: "template",
    title: "Choose Template",
    description: "Select a campaign template or start from scratch"
  },
  {
    id: "content",
    title: "Create Content",
    description: "Write your campaign message and subject"
  },
  {
    id: "audience",
    title: "Select Audience",
    description: "Choose who will receive this campaign"
  },
  {
    id: "schedule",
    title: "Review & Send",
    description: "Review your campaign and schedule delivery"
  }
];

export default function CreateCampaignPageV2() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  
  const urlParams = new URLSearchParams(window.location.search);
  const presetFromUrl = urlParams.get('preset');
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(presetFromUrl || undefined);
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<EmailTemplate | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      type: "email",
      audience: "all",
      scheduleType: "now",
    },
  });

  const campaignType = watch("type");
  const scheduleType = watch("scheduleType");
  const content = watch("content");
  const name = watch("name");
  const subject = watch("subject");
  const audience = watch("audience");

  const formData = watch();
  const { isSaving, lastSaved } = useAutosave({
    endpoint: "/api/campaigns/draft",
    data: { ...formData, status: "draft" },
    enabled: currentStep > 0 && !!name,
    debounceMs: 3000,
  });

  useEffect(() => {
    if (selectedPresetId) {
      const preset = getPresetById(selectedPresetId);
      if (preset) {
        setValue("type", preset.type);
        setValue("goalType", preset.goalType);
        setValue("presetId", preset.id);
        if (preset.defaultSubject) {
          setValue("subject", preset.defaultSubject);
        }
        setValue("content", preset.defaultContent);
        setValue("audience", preset.defaultAudience as any);
      }
    }
  }, [selectedPresetId, setValue]);

  const handleSelectCustomTemplate = (template: EmailTemplate) => {
    setSelectedCustomTemplate(template);
    setSelectedPresetId(undefined);
    setValue("type", "email");
    setValue("name", template.name);
    setValue("subject", template.subject || "");
    setValue("content", `[Custom Template: ${template.name}]`);
  };

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const payload = {
        ...data,
        status: data.scheduleType === "now" ? "sending" : "scheduled",
        scheduledFor: data.scheduleType === "later" ? data.scheduledFor : new Date().toISOString(),
        templateId: selectedCustomTemplate?.id,
      };
      
      return apiRequest("POST", "/api/campaigns", payload);
    },
    onSuccess: () => {
      toast({
        title: "Campaign created",
        description: scheduleType === "now" 
          ? "Your campaign is being sent now" 
          : "Your campaign has been scheduled successfully",
      });
      setLocation("/campaigns");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    createCampaignMutation.mutate(data);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!selectedPresetId || !!selectedCustomTemplate;
      case 1:
        if (selectedCustomTemplate) {
          return !!(name && (campaignType === "sms" || subject));
        }
        return !!(name && content && (campaignType === "sms" || subject));
      case 2:
        return !!audience;
      case 3:
        return scheduleType === "now" || !!watch("scheduledFor");
      default:
        return true;
    }
  };

  const charCount = content?.length || 0;
  const smsCharLimit = 160;

  const renderTemplatePreview = (blocks: EmailBlock[]) => {
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No content blocks in this template</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {blocks.map((block, index) => {
          switch (block.type) {
            case 'logo':
              return (
                <div key={block.id || index} className="text-center py-4">
                  {block.content?.src ? (
                    <img 
                      src={block.content.src} 
                      alt={block.content.alt || 'Logo'} 
                      className="max-h-16 mx-auto"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary rounded-lg mx-auto flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              );
            case 'heading':
              const HeadingTag = (block.content?.level || 'h2') as keyof JSX.IntrinsicElements;
              return (
                <HeadingTag 
                  key={block.id || index}
                  className={cn(
                    "font-bold text-gray-900",
                    block.content?.level === 'h1' && "text-3xl",
                    block.content?.level === 'h2' && "text-2xl",
                    block.content?.level === 'h3' && "text-xl",
                    block.content?.level === 'h4' && "text-lg"
                  )}
                  style={{ textAlign: block.content?.align || 'center' }}
                >
                  {block.content?.text || 'Heading'}
                </HeadingTag>
              );
            case 'text':
              return (
                <p 
                  key={block.id || index}
                  className="text-gray-700 leading-relaxed"
                  style={{ textAlign: block.content?.align || 'left' }}
                >
                  {block.content?.text || 'Text content'}
                </p>
              );
            case 'image':
              return (
                <div key={block.id || index} className="text-center py-2">
                  {block.content?.src ? (
                    <img 
                      src={block.content.src} 
                      alt={block.content.alt || 'Image'} 
                      className="max-w-full mx-auto rounded-lg"
                      style={{ maxWidth: block.content.width || '100%' }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Eye className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {block.content?.caption && (
                    <p className="text-sm text-gray-500 mt-2">{block.content.caption}</p>
                  )}
                  {block.content?.productName && (
                    <div className="mt-2">
                      <p className="font-semibold text-gray-900">{block.content.productName}</p>
                      {block.content?.price && (
                        <p className="text-lg font-bold text-primary">{block.content.price}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            case 'button':
              return (
                <div key={block.id || index} className="text-center py-4">
                  <a
                    href={block.content?.url || '#'}
                    className="inline-block px-6 py-3 rounded-lg font-semibold text-white"
                    style={{ 
                      backgroundColor: block.content?.backgroundColor || '#00F0FF',
                      color: block.content?.textColor || '#000000'
                    }}
                  >
                    {block.content?.text || 'Click Here'}
                  </a>
                </div>
              );
            case 'divider':
              return (
                <hr 
                  key={block.id || index} 
                  className="my-4 border-gray-300"
                  style={{ 
                    borderWidth: block.content?.thickness || 1,
                    borderStyle: block.content?.style || 'solid'
                  }}
                />
              );
            case 'spacer':
              return (
                <div 
                  key={block.id || index} 
                  style={{ height: block.content?.height || 20 }}
                />
              );
            case 'columns':
              return (
                <div key={block.id || index} className="flex gap-4">
                  {block.content?.columns?.map((col: any, colIndex: number) => (
                    <div key={colIndex} className="flex-1">
                      {col.blocks?.map((colBlock: EmailBlock, blockIndex: number) => (
                        <div key={blockIndex}>{renderTemplatePreview([colBlock])}</div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            default:
              return (
                <div key={block.id || index} className="p-4 bg-gray-100 rounded text-gray-600 text-sm">
                  {block.type} block
                </div>
              );
          }
        })}
      </div>
    );
  };

  return (
    <PageShell
      title="Create Campaign"
      subtitle="Create and schedule email or SMS campaigns for your customers"
      backTo="/dashboard?tab=campaigns"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Autosave Indicator */}
        {currentStep > 0 && (
          <div className="flex items-center justify-end gap-2 text-sm text-slate-400">
            {isSaving ? (
              <>
                <Save className="w-4 h-4 animate-pulse" />
                <span>Saving draft...</span>
              </>
            ) : lastSaved ? (
              <>
                <Save className="w-4 h-4" />
                <span>Last saved {lastSaved.toLocaleTimeString()}</span>
              </>
            ) : null}
          </div>
        )}

        <CampaignWizard
          steps={wizardSteps}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onComplete={handleSubmit(onSubmit)}
          canProceed={canProceed()}
          isSubmitting={createCampaignMutation.isPending}
        >
          {/* Step 1: Template Selection */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Choose a Campaign Template
                </h2>
                <p className="text-slate-400">
                  Start with a proven template or create a custom campaign
                </p>
              </div>
              
              <TemplateSelector
                selectedPreset={selectedPresetId}
                onSelect={(preset) => {
                  setSelectedPresetId(preset.id);
                  setSelectedCustomTemplate(null);
                }}
                onSelectCustomTemplate={handleSelectCustomTemplate}
                selectedCustomTemplateId={selectedCustomTemplate?.id}
              />
            </div>
          )}

          {/* Step 2: Content Creation */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Campaign Details - Basic info */}
              <DashboardCard
                title="Campaign Details"
                testId="card-campaign-details"
              >
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Campaign Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g., Spring Sale Announcement"
                      className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                      data-testid="input-campaign-name"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {campaignType === "email" && (
                    <div>
                      <Label htmlFor="subject" className="text-white">Email Subject</Label>
                      <Input
                        id="subject"
                        {...register("subject")}
                        placeholder="e.g., Exclusive 50% Off Spring Sale!"
                        className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                        data-testid="input-email-subject"
                      />
                      {errors.subject && (
                        <p className="text-red-400 text-sm mt-1">{errors.subject.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </DashboardCard>

              {/* Email Content - Show template preview or text editor */}
              {selectedCustomTemplate ? (
                <DashboardCard
                  title="Email Template Preview"
                  description={`Using your custom template: "${selectedCustomTemplate.name}"`}
                  testId="card-template-preview"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-green-400 font-medium">Custom Template Selected</span>
                        <Badge variant="secondary" className="text-xs">
                          {Array.isArray(selectedCustomTemplate.blocks) ? selectedCustomTemplate.blocks.length : 0} blocks
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/custom-templates?id=${selectedCustomTemplate.id}`, '_blank')}
                        data-testid="button-edit-template"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Template
                      </Button>
                    </div>
                    
                    {/* Template Preview */}
                    <div className="border border-slate-700 rounded-lg overflow-hidden bg-white">
                      <ScrollArea className="h-[500px]">
                        <div className="p-4">
                          {renderTemplatePreview(selectedCustomTemplate.blocks as EmailBlock[])}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <input type="hidden" {...register("content")} />
                  </div>
                </DashboardCard>
              ) : (
                <DashboardCard
                  title="Message Content"
                  testId="card-message-content"
                >
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="content" className="text-white">
                        Message {campaignType === "sms" && `(${charCount}/${smsCharLimit})`}
                      </Label>
                      <Textarea
                        id="content"
                        {...register("content")}
                        placeholder={
                          campaignType === "email"
                            ? "Write your email content here..."
                            : "Write your SMS message here..."
                        }
                        rows={campaignType === "email" ? 12 : 6}
                        className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                        data-testid="input-campaign-content"
                      />
                      {errors.content && (
                        <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>
                      )}
                      {campaignType === "sms" && charCount >= smsCharLimit && charCount <= 320 && (
                        <Alert className="mt-2 bg-yellow-500/10 border-yellow-500/50">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <AlertDescription className="text-yellow-200">
                            This message will be split into {Math.ceil(charCount / 160)} SMS messages ({charCount} chars)
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </DashboardCard>
              )}
            </div>
          )}

          {/* Step 3: Audience Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <DashboardCard
                title="Target Audience"
                description="Select who should receive this campaign"
                testId="card-target-audience"
              >
                <Select
                  onValueChange={(value) => setValue("audience", value as any)}
                  value={audience}
                >
                  <SelectTrigger 
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="select-audience"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">
                      All Customers
                    </SelectItem>
                    <SelectItem value="abandoned_cart" className="text-white">
                      Abandoned Cart Users
                    </SelectItem>
                    <SelectItem value="recent_customers" className="text-white">
                      Recent Customers (Last 30 days)
                    </SelectItem>
                    <SelectItem value="inactive_customers" className="text-white">
                      Inactive Customers (90+ days)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </DashboardCard>
            </div>
          )}

          {/* Step 4: Schedule & Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <DashboardCard
                title="Schedule Campaign"
                testId="card-schedule-campaign"
              >
                <div className="space-y-4">
                  <RadioGroup
                    value={scheduleType}
                    onValueChange={(value: "now" | "later") => setValue("scheduleType", value)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="relative">
                      <RadioGroupItem
                        value="now"
                        id="now"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="now"
                        className="flex items-center gap-3 rounded-md border-2 border-slate-700 bg-slate-800/50 p-4 peer-data-[state=checked]:border-primary cursor-pointer"
                        data-testid="option-send-now"
                      >
                        <Send className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-white font-semibold">Send Now</div>
                          <div className="text-slate-400 text-sm">Immediate delivery</div>
                        </div>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem
                        value="later"
                        id="later"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="later"
                        className="flex items-center gap-3 rounded-md border-2 border-slate-700 bg-slate-800/50 p-4 peer-data-[state=checked]:border-primary cursor-pointer"
                        data-testid="option-schedule-later"
                      >
                        <Clock className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-white font-semibold">Schedule Later</div>
                          <div className="text-slate-400 text-sm">Pick a date & time</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {scheduleType === "later" && (
                    <div>
                      <Label htmlFor="scheduledFor" className="text-white">Schedule Date & Time</Label>
                      <Input
                        id="scheduledFor"
                        type="datetime-local"
                        {...register("scheduledFor")}
                        className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                        min={new Date().toISOString().slice(0, 16)}
                        data-testid="input-scheduled-time"
                      />
                      {errors.scheduledFor && (
                        <p className="text-red-400 text-sm mt-1">{errors.scheduledFor.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </DashboardCard>

              {/* Campaign Summary */}
              <DashboardCard
                title="Campaign Summary"
                description="Review your campaign before sending"
                testId="card-campaign-summary"
              >
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Campaign Name:</span>
                    <span className="text-white font-medium">{name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="text-white font-medium capitalize">{campaignType}</span>
                  </div>
                  {campaignType === "email" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subject:</span>
                      <span className="text-white font-medium">{subject || "—"}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Audience:</span>
                    <span className="text-white font-medium capitalize">
                      {audience?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Schedule:</span>
                    <span className="text-white font-medium">
                      {scheduleType === "now" ? "Send immediately" : "Scheduled"}
                    </span>
                  </div>
                </div>
              </DashboardCard>
            </div>
          )}
        </CampaignWizard>
      </form>
    </PageShell>
  );
}
