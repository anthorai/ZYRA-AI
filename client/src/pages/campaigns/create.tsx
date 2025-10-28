import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/ui/standardized-layout";
import { 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock,
  Send,
  Users,
  Type,
  AlertCircle
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const campaignSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  type: z.enum(["email", "sms"]),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  scheduledFor: z.string().optional(),
  template_id: z.number().optional(),
  audience: z.enum(["all", "abandoned_cart", "recent_customers", "inactive_customers"]),
  scheduleType: z.enum(["now", "later"]).optional(),
}).superRefine((data, ctx) => {
  // Require subject for email campaigns
  if (data.type === "email" && (!data.subject || data.subject.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Email subject is required for email campaigns",
      path: ["subject"],
    });
  }
  
  // Require scheduledFor when scheduling later
  if (data.scheduleType === "later" && (!data.scheduledFor || data.scheduledFor.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a date and time for scheduled campaigns",
      path: ["scheduledFor"],
    });
  }
  
  // Validate SMS length (warning for >160, error for >320 which would be 3 messages)
  if (data.type === "sms" && data.message.length > 320) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "SMS message is too long (max 320 characters for 2 messages)",
      path: ["message"],
    });
  }
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function CreateCampaignPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [campaignType, setCampaignType] = useState<"email" | "sms">("email");
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");

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

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
    const campaignData = {
      ...data,
      status: "scheduled", // Always scheduled - "now" campaigns are scheduled for immediate send
      scheduledFor: scheduleType === "later" ? data.scheduledFor : new Date().toISOString(),
    };
    createCampaignMutation.mutate(campaignData);
  };

  const message = watch("message");
  const charCount = message?.length || 0;
  const smsCharLimit = 160;

  return (
    <div className="min-h-screen dark-theme-bg">
      <PageContainer>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campaign Type */}
          <Card className="dark-theme-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Type className="w-5 h-5" />
                Campaign Type
              </CardTitle>
              <CardDescription className="text-slate-400">
                Choose between email or SMS campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={campaignType}
                onValueChange={(value: "email" | "sms") => {
                  setCampaignType(value);
                  setValue("type", value);
                }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="relative">
                  <RadioGroupItem
                    value="email"
                    id="email"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="email"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-slate-700 bg-slate-800/50 p-6 hover:bg-slate-800 peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                  >
                    <Mail className="w-8 h-8 mb-2 text-primary" />
                    <span className="text-white font-semibold">Email Campaign</span>
                    <span className="text-slate-400 text-sm mt-1">Best for detailed content</span>
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem
                    value="sms"
                    id="sms"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="sms"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-slate-700 bg-slate-800/50 p-6 hover:bg-slate-800 peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                  >
                    <MessageSquare className="w-8 h-8 mb-2 text-primary" />
                    <span className="text-white font-semibold">SMS Campaign</span>
                    <span className="text-slate-400 text-sm mt-1">Quick & direct messages</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card className="dark-theme-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Campaign Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Spring Sale Announcement"
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
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
                  />
                  {errors.subject && (
                    <p className="text-red-400 text-sm mt-1">{errors.subject.message}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="message" className="text-white">
                  Message {campaignType === "sms" && `(${charCount}/${smsCharLimit})`}
                </Label>
                <Textarea
                  id="message"
                  {...register("message")}
                  placeholder={
                    campaignType === "email"
                      ? "Write your email content here..."
                      : "Write your SMS message here..."
                  }
                  rows={campaignType === "email" ? 8 : 4}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                />
                {errors.message && (
                  <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
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
            </CardContent>
          </Card>

          {/* Audience Selection */}
          <Card className="dark-theme-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Target Audience
              </CardTitle>
              <CardDescription className="text-slate-400">
                Select who should receive this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                onValueChange={(value) => setValue("audience", value as any)}
                defaultValue="all"
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    All Customers
                  </SelectItem>
                  <SelectItem value="abandoned_cart" className="text-white hover:bg-slate-700">
                    Abandoned Cart Users
                  </SelectItem>
                  <SelectItem value="recent_customers" className="text-white hover:bg-slate-700">
                    Recent Customers (Last 30 days)
                  </SelectItem>
                  <SelectItem value="inactive_customers" className="text-white hover:bg-slate-700">
                    Inactive Customers (90+ days)
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="dark-theme-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={scheduleType}
                onValueChange={(value: "now" | "later") => {
                  setScheduleType(value);
                  setValue("scheduleType", value);
                }}
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
                    className="flex items-center gap-3 rounded-md border-2 border-slate-700 bg-slate-800/50 p-4 hover:bg-slate-800 peer-data-[state=checked]:border-primary cursor-pointer"
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
                    className="flex items-center gap-3 rounded-md border-2 border-slate-700 bg-slate-800/50 p-4 hover:bg-slate-800 peer-data-[state=checked]:border-primary cursor-pointer"
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
                  />
                  {errors.scheduledFor && (
                    <p className="text-red-400 text-sm mt-1">{errors.scheduledFor.message}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/campaigns")}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCampaignMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {createCampaignMutation.isPending ? (
                <>Creating...</>
              ) : scheduleType === "now" ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Campaign
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Campaign
                </>
              )}
            </Button>
          </div>
        </form>
      </PageContainer>
    </div>
  );
}
