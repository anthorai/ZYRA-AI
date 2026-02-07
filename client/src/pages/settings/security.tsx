import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { Shield, Lock, Smartphone, Key, Download, Trash2, Chrome, Monitor, Laptop } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AccessibleLoading } from "@/components/ui/accessible-loading";
import type { Session } from "@shared/schema";
import { TwoFactorSetupInline } from "@/components/security/TwoFactorSetupInline";
import { TwoFactorDisableDialog } from "@/components/security/TwoFactorDisableDialog";
import { PasswordStrengthMeter } from "@/components/security/PasswordStrengthMeter";
import { PasswordValidation } from "@shared/password-validation";

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

const sectionAccents = {
  twoFactor: '#22C55E',
  password: '#00F0FF',
  sessions: '#A78BFA',
  data: '#EF4444',
};

const sectionCardStyle = {
  background: '#121833',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px',
};

const actionButtonStyle = {
  background: '#1A2142',
  color: '#E6F7FF',
  border: '1px solid rgba(255,255,255,0.08)',
};

const destructiveButtonStyle = {
  background: 'rgba(239,68,68,0.15)',
  color: '#FCA5A5',
  border: '1px solid rgba(239,68,68,0.35)',
};

export default function SecurityPage() {
  const { toast } = useToast();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSetupInline, setShowSetupInline] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const { data: twoFactorStatus, isLoading: twoFactorLoading, error: twoFactorError } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/2fa/status'],
  });

  const twoFactorEnabled = twoFactorStatus?.enabled || false;

  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = useQuery<Session[]>({
    queryKey: ['/api/sessions'],
  });

  const handleToggle2FA = (enabled: boolean) => {
    if (enabled) {
      setShowSetupInline(true);
    } else {
      setShowDisableDialog(true);
    }
  };

  const handle2FASuccess = () => {
    setShowSetupInline(false);
    queryClient.invalidateQueries({ queryKey: ['/api/2fa/status'] });
  };

  const handle2FACancel = () => {
    setShowSetupInline(false);
  };

  const passwordChangeMutation = useMutation({
    mutationFn: async (data: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
      const response = await apiRequest('POST', '/api/profile/change-password', data);
      const result = await response.json();
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
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Missing Fields", description: "Please fill in all password fields", variant: "destructive", duration: 3000 });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match", variant: "destructive", duration: 3000 });
      return;
    }
    const validation = PasswordValidation.validate(newPassword);
    if (!validation.isValid) {
      const feedbackList = validation.feedback.map(f => `• ${f}`).join('\n');
      toast({ title: "Password Too Weak", description: `Please address the following:\n${feedbackList}`, variant: "destructive", duration: 5000 });
      return;
    }
    passwordChangeMutation.mutate({ oldPassword: currentPassword, newPassword, confirmPassword });
  };

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest('DELETE', `/api/sessions/${sessionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({ title: "Session Revoked", description: "The session has been logged out successfully", duration: 3000 });
    },
    onError: (error: any) => {
      toast({ title: "Failed to Revoke Session", description: error.message || "Unable to revoke the session", variant: "destructive", duration: 3000 });
    }
  });

  const handleRevokeSession = (sessionId: string) => {
    revokeSessionMutation.mutate(sessionId);
  };

  const handleExportData = () => {
    toast({ title: "Export Initiated", description: "Your data export will be ready in a few minutes", duration: 3000 });
  };

  return (
    <>
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
        useHistoryBack={true}
      >
        {showSetupInline ? (
          <div
            className="relative overflow-hidden"
            style={sectionCardStyle}
            data-testid="card-2fa-setup"
          >
            <div
              className="absolute top-0 left-0 bottom-0 w-[3px]"
              style={{ background: sectionAccents.twoFactor, borderRadius: '14px 0 0 14px' }}
            />
            <div className="p-4 sm:p-5">
              <TwoFactorSetupInline
                onSuccess={handle2FASuccess}
                onCancel={handle2FACancel}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Two-Factor Authentication */}
            <div
              className="relative overflow-hidden"
              style={sectionCardStyle}
              data-testid="card-2fa"
            >
              <div
                className="absolute top-0 left-0 bottom-0 w-[3px]"
                style={{ background: sectionAccents.twoFactor, borderRadius: '14px 0 0 14px' }}
              />
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg" style={{ background: `${sectionAccents.twoFactor}15` }}>
                      <Shield className="w-5 h-5" style={{ color: `${sectionAccents.twoFactor}CC` }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg" style={{ color: '#E6F7FF' }}>
                        Two-Factor Authentication
                      </h3>
                      <p className="text-sm" style={{ color: '#A9B4E5' }}>
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  {twoFactorLoading ? (
                    <Badge variant="secondary" style={{ background: 'rgba(100,116,139,0.2)', color: '#94A3B8' }} data-testid="badge-2fa-status">
                      Loading...
                    </Badge>
                  ) : twoFactorError ? (
                    <Badge variant="secondary" style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }} data-testid="badge-2fa-status">
                      Error
                    </Badge>
                  ) : twoFactorEnabled ? (
                    <Badge
                      variant="secondary"
                      style={{
                        background: 'rgba(34,197,94,0.15)',
                        color: '#9EFFC3',
                        border: '1px solid rgba(34,197,94,0.35)',
                      }}
                      data-testid="badge-2fa-status"
                    >
                      Enabled
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      style={{
                        background: 'rgba(245,158,11,0.15)',
                        color: '#FFD27D',
                        border: '1px solid rgba(245,158,11,0.35)',
                      }}
                      data-testid="badge-2fa-status"
                    >
                      Disabled
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" style={{ color: `${sectionAccents.twoFactor}CC` }} />
                    <div>
                      <Label className="font-medium" style={{ color: '#E6F7FF' }}>Enable 2FA</Label>
                      <p className="text-sm" style={{ color: '#7C86B8' }}>
                        Require a code from your authenticator app when signing in
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={handleToggle2FA}
                    disabled={twoFactorLoading || !!twoFactorError}
                    data-testid="switch-2fa"
                  />
                </div>

                {twoFactorEnabled && (
                  <div
                    className="mt-4 p-3 rounded-lg"
                    style={{
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.2)',
                    }}
                  >
                    <p className="text-sm" style={{ color: '#9EFFC3' }}>
                      Two-factor authentication is protecting your account. You'll need your authenticator app to sign in.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Password Management */}
            <div
              className="relative overflow-hidden"
              style={sectionCardStyle}
              data-testid="card-password"
            >
              <div
                className="absolute top-0 left-0 bottom-0 w-[3px]"
                style={{ background: sectionAccents.password, borderRadius: '14px 0 0 14px' }}
              />
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-lg" style={{ background: `${sectionAccents.password}15` }}>
                    <Lock className="w-5 h-5" style={{ color: `${sectionAccents.password}CC` }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg" style={{ color: '#E6F7FF' }}>
                      Password
                    </h3>
                    <p className="text-sm" style={{ color: '#A9B4E5' }}>
                      Update your password regularly to keep your account secure
                    </p>
                  </div>
                </div>

                {!showPasswordForm ? (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label className="font-medium" style={{ color: '#E6F7FF' }}>Password</Label>
                      <p className="text-sm" style={{ color: '#7C86B8' }}>
                        Last changed 30 days ago
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowPasswordForm(true)}
                      variant="ghost"
                      style={actionButtonStyle}
                      data-testid="button-change-password"
                    >
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <div
                    className="space-y-4 p-4 rounded-lg"
                    style={{ background: '#0F152B' }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="current-password" style={{ color: '#E6F7FF' }}>Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        style={{ background: '#0B0E1A', borderColor: 'rgba(255,255,255,0.08)', color: '#E6F7FF' }}
                        data-testid="input-current-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password" style={{ color: '#E6F7FF' }}>New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ background: '#0B0E1A', borderColor: 'rgba(255,255,255,0.08)', color: '#E6F7FF' }}
                        data-testid="input-new-password"
                      />
                      <PasswordStrengthMeter password={newPassword} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" style={{ color: '#E6F7FF' }}>Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ background: '#0B0E1A', borderColor: 'rgba(255,255,255,0.08)', color: '#E6F7FF' }}
                        data-testid="input-confirm-password"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        style={actionButtonStyle}
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
                        style={{
                          background: 'linear-gradient(135deg, #00F0FF, #00FFE5)',
                          color: '#04141C',
                          fontWeight: 600,
                        }}
                        data-testid="button-update-password"
                      >
                        {passwordChangeMutation.isPending ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Sessions */}
            <div
              className="relative overflow-hidden"
              style={sectionCardStyle}
              data-testid="card-active-sessions"
            >
              <div
                className="absolute top-0 left-0 bottom-0 w-[3px]"
                style={{ background: sectionAccents.sessions, borderRadius: '14px 0 0 14px' }}
              />
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-lg" style={{ background: `${sectionAccents.sessions}15` }}>
                    <Monitor className="w-5 h-5" style={{ color: `${sectionAccents.sessions}CC` }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg" style={{ color: '#E6F7FF' }}>
                      Active Sessions
                    </h3>
                    <p className="text-sm" style={{ color: '#A9B4E5' }}>
                      Manage devices currently signed into your account
                    </p>
                  </div>
                </div>

                {sessionsLoading ? (
                  <AccessibleLoading message="Loading active sessions..." />
                ) : sessionsError ? (
                  <div className="text-center py-4">
                    <p className="mb-2" style={{ color: '#FCA5A5' }}>Failed to load active sessions</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/sessions'] })}
                      style={actionButtonStyle}
                      data-testid="button-retry-sessions"
                    >
                      Retry
                    </Button>
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map((session: Session, index: number) => {
                      const deviceName = session.browser && session.os
                        ? `${session.browser} on ${session.os}`
                        : session.userAgent || 'Unknown Device';

                      return (
                        <div
                          key={session.sessionId}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg"
                          style={{
                            background: '#0F152B',
                            border: index === 0 ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ background: `${sectionAccents.sessions}15` }}>
                              <div style={{ color: `${sectionAccents.sessions}CC` }}>
                                {getDeviceIcon(session.deviceType, session.browser)}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: '#E6F7FF' }}>{deviceName}</p>
                              <p className="text-sm" style={{ color: '#7C86B8' }}>
                                {session.location || session.ipAddress || 'Unknown location'}
                              </p>
                              <p className="text-xs" style={{ color: '#7C86B8' }}>
                                {formatLastSeen(session.lastSeenAt)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeSession(session.sessionId)}
                            disabled={revokeSessionMutation.isPending}
                            style={destructiveButtonStyle}
                            data-testid={`button-revoke-session-${session.sessionId}`}
                          >
                            {revokeSessionMutation.isPending ? "Revoking..." : "Revoke"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-4" style={{ color: '#7C86B8' }}>No active sessions found</p>
                )}
              </div>
            </div>

            {/* Data Management */}
            <div
              className="relative overflow-hidden"
              style={sectionCardStyle}
              data-testid="card-data-management"
            >
              <div
                className="absolute top-0 left-0 bottom-0 w-[3px]"
                style={{ background: sectionAccents.data, borderRadius: '14px 0 0 14px' }}
              />
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-lg" style={{ background: `${sectionAccents.data}15` }}>
                    <Key className="w-5 h-5" style={{ color: `${sectionAccents.data}CC` }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg" style={{ color: '#E6F7FF' }}>
                      Data Management
                    </h3>
                    <p className="text-sm" style={{ color: '#A9B4E5' }}>
                      Export or delete your account data (GDPR compliant)
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <Label className="font-medium" style={{ color: '#E6F7FF' }}>Export Your Data</Label>
                      <p className="text-sm" style={{ color: '#7C86B8' }}>
                        Download a copy of all your account information
                      </p>
                    </div>
                    <Button
                      onClick={handleExportData}
                      variant="ghost"
                      style={actionButtonStyle}
                      data-testid="button-export-data"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <Label className="font-medium" style={{ color: '#E6F7FF' }}>Delete Account</Label>
                      <p className="text-sm" style={{ color: '#7C86B8' }}>
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      style={destructiveButtonStyle}
                      data-testid="button-delete-account"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </PageShell>
    </>
  );
}
