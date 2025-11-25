import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock,
  Save,
  Send,
  ArrowLeft,
  Loader2
} from "lucide-react";

const campaignSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  type: z.enum(["email", "sms"]),
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
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  subject?: string;
  content?: string;
  message?: string;
  audience?: string;
  scheduledFor?: string;
  createdAt?: string;
}

export default function EditCampaignPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: campaign, isLoading, error } = useQuery<Campaign>({
    queryKey: ['/api/campaigns', campaignId],
    enabled: !!campaignId,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      type: "email",
      audience: "all",
      scheduleType: "now",
    },
  });

  useEffect(() => {
    if (campaign) {
      const messageContent = campaign.message || campaign.content || '';
      reset({
        name: campaign.name || '',
        type: (campaign.type as "email" | "sms") || 'email',
        subject: campaign.subject || '',
        content: messageContent,
        audience: (campaign.audience as any) || 'all',
        scheduleType: campaign.scheduledFor ? 'later' : 'now',
        scheduledFor: campaign.scheduledFor || '',
      });
    }
  }, [campaign, reset]);

  const campaignType = watch("type");
  const scheduleType = watch("scheduleType");
  const content = watch("content");

  const updateMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const response = await apiRequest("PATCH", `/api/campaigns/${campaignId}`, {
        name: data.name,
        type: data.type,
        subject: data.subject,
        content: data.content,
        audience: data.audience,
        scheduledFor: data.scheduleType === 'later' ? data.scheduledFor : null,
        status: 'draft',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId] });
      toast({
        title: "Campaign Updated",
        description: "Your campaign has been saved successfully.",
      });
      setLocation(`/campaigns/${campaignId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign",
        variant: "destructive",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      await apiRequest("PATCH", `/api/campaigns/${campaignId}`, {
        name: data.name,
        type: data.type,
        subject: data.subject,
        content: data.content,
        audience: data.audience,
        scheduledFor: data.scheduleType === 'later' ? data.scheduledFor : null,
        status: data.scheduleType === 'later' ? 'scheduled' : 'sending',
      });
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign Sent",
        description: scheduleType === 'later' 
          ? "Your campaign has been scheduled."
          : "Your campaign is being sent.",
      });
      setLocation("/campaigns");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send campaign",
        variant: "destructive",
      });
    },
  });

  const onSave = handleSubmit((data) => {
    updateMutation.mutate(data);
  });

  const onSend = handleSubmit((data) => {
    sendMutation.mutate(data);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen dark-theme-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen dark-theme-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load campaign</p>
          <Button
            onClick={() => setLocation("/campaigns")}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      title="Edit Campaign"
      subtitle={`Editing: ${campaign.name}`}
      backTo={`/campaigns/${campaignId}`}
      rightActions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onSave}
            disabled={updateMutation.isPending}
            data-testid="button-save-draft"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button
            className="gradient-button"
            onClick={onSend}
            disabled={sendMutation.isPending}
            data-testid="button-send-campaign"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {scheduleType === 'later' ? 'Schedule' : 'Send Now'}
          </Button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="gradient-card border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {campaignType === 'email' ? (
                <Mail className="w-5 h-5 text-primary" />
              ) : (
                <MessageSquare className="w-5 h-5 text-primary" />
              )}
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Campaign Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter campaign name"
                className="bg-slate-800/50 border-slate-700"
                data-testid="input-campaign-name"
              />
              {errors.name && (
                <p className="text-red-400 text-sm">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Campaign Type</Label>
              <RadioGroup
                value={campaignType}
                onValueChange={(value) => setValue("type", value as "email" | "sms")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="type-email" />
                  <Label htmlFor="type-email" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="type-sms" />
                  <Label htmlFor="type-sms" className="flex items-center gap-2 cursor-pointer">
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {campaignType === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-slate-300">Subject Line</Label>
                <Input
                  id="subject"
                  {...register("subject")}
                  placeholder="Enter email subject"
                  className="bg-slate-800/50 border-slate-700"
                  data-testid="input-subject"
                />
                {errors.subject && (
                  <p className="text-red-400 text-sm">{errors.subject.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content" className="text-slate-300">
                Message Content
                {campaignType === 'sms' && (
                  <span className="text-slate-500 ml-2">
                    ({content?.length || 0}/320 characters)
                  </span>
                )}
              </Label>
              <Textarea
                id="content"
                {...register("content")}
                placeholder="Write your message here..."
                className="bg-slate-800/50 border-slate-700 min-h-[200px]"
                data-testid="input-content"
              />
              {errors.content && (
                <p className="text-red-400 text-sm">{errors.content.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Target Audience</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={watch("audience")}
              onValueChange={(value) => setValue("audience", value as any)}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-700" data-testid="select-audience">
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                <SelectItem value="recent_customers">Recent Customers</SelectItem>
                <SelectItem value="inactive_customers">Inactive Customers</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="gradient-card border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Delivery Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={scheduleType}
              onValueChange={(value) => setValue("scheduleType", value as "now" | "later")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="schedule-now" />
                <Label htmlFor="schedule-now" className="cursor-pointer">
                  Send immediately
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="later" id="schedule-later" />
                <Label htmlFor="schedule-later" className="flex items-center gap-2 cursor-pointer">
                  <Calendar className="w-4 h-4" />
                  Schedule for later
                </Label>
              </div>
            </RadioGroup>

            {scheduleType === 'later' && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="scheduledFor" className="text-slate-300">
                  Send Date & Time
                </Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  {...register("scheduledFor")}
                  className="bg-slate-800/50 border-slate-700 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                  data-testid="input-scheduled-for"
                />
                {errors.scheduledFor && (
                  <p className="text-red-400 text-sm">{errors.scheduledFor.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
