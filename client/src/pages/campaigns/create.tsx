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
import { 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock,
  Send,
  AlertCircle,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          status: data.scheduleType === "now" ? "sending" : "scheduled",
          scheduledFor: data.scheduleType === "later" ? data.scheduledFor : new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create campaign");
      }

      return response.json();
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
        return !!selectedPresetId;
      case 1:
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

  return (
    <PageShell
      title="Create Campaign"
      subtitle="Create and schedule email or SMS campaigns for your customers"
      backTo="/campaigns"
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
                onSelect={(preset) => setSelectedPresetId(preset.id)}
              />
            </div>
          )}

          {/* Step 2: Content Creation */}
          {currentStep === 1 && (
            <div className="space-y-6">
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
