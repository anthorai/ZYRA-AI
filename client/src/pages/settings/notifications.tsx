import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mail, CheckCircle2, AlertCircle, Loader2, Pencil, Trash2
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { NotificationChannel } from "@shared/schema";
import { Input } from "@/components/ui/input";

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [emailAddress, setEmailAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: channels = [], isLoading } = useQuery<NotificationChannel[]>({
    queryKey: ['/api/notification-channels'],
  });

  const emailChannel = channels.find(c => c.channelType === 'email');
  const hasEmail = !!emailChannel?.channelValue;
  const emailEnabled = emailChannel?.enabled || false;

  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return apiRequest('PUT', `/api/notification-channels/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-channels'] });
      toast({
        title: "Updated",
        description: "Email notification settings saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update",
        variant: "destructive",
      });
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/notification-channels', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-channels'] });
      setIsEditing(false);
      toast({
        title: "Email Saved",
        description: "You'll now receive notifications at this email address",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save email",
        variant: "destructive",
      });
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/notification-channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-channels'] });
      setEmailAddress("");
      toast({
        title: "Email Removed",
        description: "Email notifications have been disabled",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove email",
        variant: "destructive",
      });
    },
  });

  const handleEmailToggle = (checked: boolean) => {
    if (!hasEmail) {
      toast({
        title: "Email Required",
        description: "Please add your email address first",
      });
      return;
    }
    if (emailChannel) {
      updateChannelMutation.mutate({
        id: emailChannel.id,
        updates: { enabled: checked }
      });
    }
  };

  const handleSaveEmail = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (emailChannel) {
      updateChannelMutation.mutate({
        id: emailChannel.id,
        updates: { channelValue: emailAddress, enabled: true }
      });
      setIsEditing(false);
      setEmailAddress("");
    } else {
      await createChannelMutation.mutateAsync({
        channelType: 'email',
        channelValue: emailAddress,
        enabled: true,
        isPrimary: true
      });
      setEmailAddress("");
    }
  };

  const handleEdit = () => {
    setEmailAddress(emailChannel?.channelValue || "");
    setIsEditing(true);
  };

  const handleRemove = () => {
    if (emailChannel) {
      deleteChannelMutation.mutate(emailChannel.id);
    }
  };

  return (
    <PageShell
      title="Notification Settings"
      subtitle="Manage your email notifications"
      maxWidth="xl"
      spacing="normal"
      useHistoryBack={true}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00F0FF' }} />
          <span className="ml-3" style={{ color: '#A9B4E5' }}>Loading...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <Card
            className="border-0"
            style={{
              background: '#121833',
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            }}
            data-testid="card-email-notifications"
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,240,255,0.1)' }}>
                  <Mail className="w-6 h-6" style={{ color: '#00F0FF' }} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#E6F7FF' }}>
                    Email Notifications
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                    Get notified about store activity, optimizations, and alerts
                  </p>
                </div>
              </div>

              {hasEmail && !isEditing ? (
                <div className="space-y-4">
                  <div
                    className="flex items-center justify-between gap-3 p-4 rounded-xl"
                    style={{
                      background: '#0F152B',
                      border: '1px solid rgba(0,240,255,0.15)',
                    }}
                    data-testid="email-configured"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#22C55E' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#E6F7FF' }} data-testid="text-email-value">
                          {emailChannel?.channelValue}
                        </p>
                        <p className="text-xs" style={{ color: '#A9B4E5' }}>
                          {emailEnabled ? 'Notifications active' : 'Notifications paused'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Switch
                        checked={emailEnabled}
                        onCheckedChange={handleEmailToggle}
                        className="data-[state=checked]:bg-[#00F0FF]"
                        data-testid="switch-email-notifications"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleEdit}
                        data-testid="button-edit-email"
                      >
                        <Pencil className="w-4 h-4" style={{ color: '#A9B4E5' }} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleRemove}
                        disabled={deleteChannelMutation.isPending}
                        data-testid="button-remove-email"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                      </Button>
                    </div>
                  </div>

                  {emailEnabled && (
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        background: 'rgba(34,197,94,0.05)',
                        border: '1px solid rgba(34,197,94,0.15)',
                      }}
                      data-testid="text-notifications-active"
                    >
                      <p className="text-sm" style={{ color: '#A9B4E5' }}>
                        You'll receive emails for optimization results, store alerts, abandoned cart notifications, and weekly performance reports.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {!hasEmail && (
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#F59E0B' }}>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Setup Required
                      </Badge>
                      <span className="text-xs" style={{ color: '#A9B4E5' }}>
                        Add your email to start receiving notifications
                      </span>
                    </div>
                  )}
                  <div
                    className="p-4 rounded-xl space-y-3"
                    style={{
                      background: '#0F152B',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Label htmlFor="email" className="text-sm" style={{ color: '#A9B4E5' }}>
                      Email Address
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEmail()}
                        data-testid="input-email-address"
                        className="flex-1 focus:ring-1 focus:ring-[#00F0FF]/35 focus:border-[#00F0FF]"
                        style={{ background: '#0B0E1A', border: '1px solid rgba(255,255,255,0.06)', color: '#E6F7FF' }}
                      />
                      <Button
                        onClick={handleSaveEmail}
                        disabled={createChannelMutation.isPending || updateChannelMutation.isPending || !emailAddress}
                        data-testid="button-save-email"
                        className="border-0 font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #00F0FF, #00FFE5)',
                          color: '#04141C',
                        }}
                      >
                        {(createChannelMutation.isPending || updateChannelMutation.isPending) ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          onClick={() => { setIsEditing(false); setEmailAddress(""); }}
                          data-testid="button-cancel-edit"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
