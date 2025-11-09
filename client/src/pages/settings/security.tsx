import { useState } from "react";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PageShell } from "@/components/ui/page-shell";
import { Shield, Lock, Smartphone, Key, Download, Trash2, Eye, Chrome, Monitor, Laptop } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AccessibleLoading } from "@/components/ui/accessible-loading";
import type { Session } from "@shared/schema";
import { TwoFactorEnrollDialog } from "@/components/security/TwoFactorEnrollDialog";
import { TwoFactorDisableDialog } from "@/components/security/TwoFactorDisableDialog";
import { PasswordStrengthMeter } from "@/components/security/PasswordStrengthMeter";
import { PasswordValidation } from "@shared/password-validation";

// Helper to get icon based on device type or browser
function getDeviceIcon(deviceType?: string | null, browser?: string | null) {
  const browserName = browser?.toLowerCase() ?? '';
  
  if (deviceType === 'mobile' || deviceType?.includes('mobile')) {
    return <Smartphone className="w-5 h-5" />;
  }
  if (browserName.includes('chrome')) {
    return <Chrome className="w-5 h-5" />;
  }
  if (deviceType === 'desktop' || deviceType?.includes('desktop')) {
    return <Monitor className="w-5 h-5" />;
  }
  return <Laptop className="w-5 h-5" />;
}

// Helper to format last seen time
function formatLastSeen(lastSeenAt: Date | string | null) {
  if (!lastSeenAt) return "Unknown";
  
  const lastSeen = lastSeenAt instanceof Date ? lastSeenAt : new Date(lastSeenAt);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Active now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default function SecurityPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  // Fetch 2FA status from backend
  const { data: twoFactorStatus, isLoading: twoFactorLoading, error: twoFactorError } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/2fa/status'],
  });

  const twoFactorEnabled = twoFactorStatus?.enabled || false;

  // Fetch active sessions from backend
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = useQuery<Session[]>({
    queryKey: ['/api/sessions'],
  });

  const handleToggle2FA = (enabled: boolean) => {
    if (enabled) {
      setShowEnrollDialog(true);
    } else {
      setShowDisableDialog(true);
    }
  };

  const handle2FASuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/2fa/status'] });
  };

  const passwordChangeMutation = useMutation({
    mutationFn: async (data: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
      const response = await apiRequest('POST', '/api/profile/change-password', data);
      const result = await response.json();
      
      // If response contains feedback, it's a validation error
      if (result.feedback && !response.ok) {
        throw { message: result.message, feedback: result.feedback };
      }
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
        duration: 3000,
      });
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      // Show detailed feedback if available
      let description = error.message || "Failed to change password";
      if (error.feedback && error.feedback.length > 0) {
        const feedbackList = error.feedback.map((f: string) => `• ${f}`).join('\n');
        description = `${error.message}\n${feedbackList}`;
      }
        
      toast({
        title: "Password Change Failed",
        description,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const handlePasswordUpdate = () => {
    // Client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all password fields",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Validate password strength using shared validation
    const validation = PasswordValidation.validate(newPassword);
    if (!validation.isValid) {
      const feedbackList = validation.feedback.map(f => `• ${f}`).join('\n');
      toast({
        title: "Password Too Weak",
        description: `Please address the following:\n${feedbackList}`,
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    // Call backend API
    passwordChangeMutation.mutate({
      oldPassword: currentPassword,
      newPassword,
      confirmPassword
    });
  };

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest('DELETE', `/api/sessions/${sessionId}`);
      return response.json();
    },
    onSuccess: (_, sessionId) => {
      // Invalidate sessions query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({
        title: "Session Revoked",
        description: "The session has been logged out successfully",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Revoke Session",
        description: error.message || "Unable to revoke the session",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const handleRevokeSession = (sessionId: string, device: string) => {
    revokeSessionMutation.mutate(sessionId);
  };

  const handleExportData = () => {
    toast({
      title: "Export Initiated",
      description: "Your data export will be ready in a few minutes",
      duration: 3000,
    });
  };

  return (
    <>
      <TwoFactorEnrollDialog
        open={showEnrollDialog}
        onOpenChange={setShowEnrollDialog}
        onSuccess={handle2FASuccess}
      />
      <TwoFactorDisableDialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
        onSuccess={handle2FASuccess}
      />

      <PageShell
        title="Security Settings"
        subtitle="Protect your account with advanced security features"
        maxWidth="xl"
        spacing="normal"
      >
      {/* Two-Factor Authentication */}
      <DashboardCard
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
        headerAction={
          twoFactorLoading ? (
            <Badge variant="secondary" className="bg-slate-500/20 text-slate-400" data-testid="badge-2fa-status">
              Loading...
            </Badge>
          ) : twoFactorError ? (
            <Badge variant="secondary" className="bg-red-500/20 text-red-400" data-testid="badge-2fa-status">
              Error
            </Badge>
          ) : (
            <Badge
              variant={twoFactorEnabled ? "default" : "secondary"}
              className={twoFactorEnabled
                ? "bg-green-500/20 text-green-400"
                : "bg-slate-500/20 text-slate-400"
              }
              data-testid="badge-2fa-status"
            >
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          )
        }
        testId="card-2fa"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <div>
                <Label className="text-white font-medium">Enable 2FA</Label>
                <p className="text-sm text-slate-400 mt-1">
                  Require a code from your authenticator app when signing in
                </p>
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
              disabled={twoFactorLoading || !!twoFactorError}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-2fa"
            />
          </div>
          
          {twoFactorEnabled && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400">
                Two-factor authentication is protecting your account. You'll need your authenticator app to sign in.
              </p>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Password Management */}
      <DashboardCard
        title="Password"
        description="Update your password regularly to keep your account secure"
        headerAction={<Lock className="w-5 h-5 text-primary" />}
        testId="card-password"
      >
        <div className="space-y-4">
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium">Password</Label>
                <p className="text-sm text-slate-400 mt-1">
                  Last changed 30 days ago
                </p>
              </div>
              <Button
                onClick={() => setShowPasswordForm(true)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                data-testid="button-change-password"
              >
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-white">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white"
                  data-testid="input-current-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-white">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white"
                  data-testid="input-new-password"
                />
                <PasswordStrengthMeter password={newPassword} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white"
                  data-testid="input-confirm-password"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  data-testid="button-cancel-password"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={
                    passwordChangeMutation.isPending ||
                    !newPassword ||
                    !PasswordValidation.validate(newPassword).isValid
                  }
                  className="gradient-button"
                  data-testid="button-update-password"
                >
                  {passwordChangeMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Active Sessions */}
      <DashboardCard
        title="Active Sessions"
        description="Manage devices currently signed into your account"
        headerAction={<Monitor className="w-5 h-5 text-primary" />}
        testId="card-active-sessions"
      >
        {sessionsLoading ? (
          <AccessibleLoading message="Loading active sessions..." />
        ) : sessionsError ? (
          <div className="text-center py-4">
            <p className="text-red-400 mb-2">Failed to load active sessions</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/sessions'] })}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Retry
            </Button>
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session: Session, index: number) => {
              const deviceName = session.browser && session.os 
                ? `${session.browser} on ${session.os}`
                : session.userAgent || 'Unknown Device';
              
              return (
                <div key={session.sessionId}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <div className="text-primary">
                          {getDeviceIcon(session.deviceType, session.browser)}
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-medium">{deviceName}</p>
                        <p className="text-sm text-slate-400">
                          {session.location || session.ipAddress || 'Unknown location'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatLastSeen(session.lastSeenAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(session.sessionId, deviceName)}
                      disabled={revokeSessionMutation.isPending}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      data-testid={`button-revoke-session-${session.sessionId}`}
                    >
                      {revokeSessionMutation.isPending ? "Revoking..." : "Revoke"}
                    </Button>
                  </div>
                  {index < sessions.length - 1 && <Separator className="bg-slate-700 mt-4" />}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-4">No active sessions found</p>
        )}
      </DashboardCard>

      {/* Data Management */}
      <DashboardCard
        title="Data Management"
        description="Export or delete your account data (GDPR compliant)"
        headerAction={<Key className="w-5 h-5 text-primary" />}
        testId="card-data-management"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white font-medium">Export Your Data</Label>
              <p className="text-sm text-slate-400 mt-1">
                Download a copy of all your account information
              </p>
            </div>
            <Button
              onClick={handleExportData}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
              data-testid="button-export-data"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          
          <Separator className="bg-slate-700" />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white font-medium">Delete Account</Label>
              <p className="text-sm text-slate-400 mt-1">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              data-testid="button-delete-account"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DashboardCard>
      </PageShell>
    </>
  );
}
