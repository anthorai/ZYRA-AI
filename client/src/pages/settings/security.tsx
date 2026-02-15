import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { Shield, Lock, Smartphone, Download, Trash2, Chrome, Monitor, Laptop, Loader2, AlertTriangle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

const sectionStyle = {
  background: '#121833',
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
};

export default function SecurityPage() {
  const { toast } = useToast();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSetupInline, setShowSetupInline] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: twoFactorStatus, isLoading: twoFactorLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/2fa/status'],
  });

  const twoFactorEnabled = twoFactorStatus?.enabled || false;

  const { data: sessions, isLoading: sessionsLoading } = useQuery<Session[]>({
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
      });
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      let description = error.message || "Failed to change password";
      if (error.feedback?.length > 0) {
        description = error.feedback.map((f: string) => `${f}`).join('. ');
      }
      toast({
        title: "Password Change Failed",
        description,
        variant: "destructive",
      });
    }
  });

  const handlePasswordUpdate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Missing Fields", description: "Please fill in all password fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    const validation = PasswordValidation.validate(newPassword);
    if (!validation.isValid) {
      toast({ title: "Password Too Weak", description: validation.feedback.join('. '), variant: "destructive" });
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
      toast({ title: "Session Revoked", description: "The device has been logged out" });
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message || "Unable to revoke session", variant: "destructive" });
    }
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/gdpr/export-data');
      const disposition = response.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `zyra_data_export_${new Date().toISOString().split('T')[0]}.json`;
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({ title: "Data Exported", description: "Your data file has been downloaded" });
    },
    onError: () => {
      toast({ title: "Export Failed", description: "Unable to export your data. Please try again.", variant: "destructive" });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/gdpr/delete-account', { confirmation: deleteConfirmation });
    },
    onSuccess: () => {
      toast({ title: "Account Deleted", description: "Your account and all data have been permanently deleted" });
      window.location.href = '/auth';
    },
    onError: (error: any) => {
      toast({ title: "Deletion Failed", description: error.message || "Unable to delete account", variant: "destructive" });
    }
  });

  return (
    <>
      <TwoFactorDisableDialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
        onSuccess={handle2FASuccess}
      />

      <PageShell
        title="Security Settings"
        subtitle="Protect your account"
        maxWidth="xl"
        spacing="normal"
        useHistoryBack={true}
      >
        <div className="space-y-6">
            <Card className="border-0" style={sectionStyle} data-testid="card-2fa">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <Shield className="w-6 h-6" style={{ color: '#22C55E' }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#E6F7FF' }}>
                      Two-Factor Authentication
                    </h2>
                    <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                      Require a code from your authenticator app when signing in
                    </p>
                  </div>
                  {twoFactorLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#A9B4E5' }} />
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={twoFactorEnabled ? {
                        background: 'rgba(34,197,94,0.15)',
                        color: '#22C55E',
                        border: '1px solid rgba(34,197,94,0.3)',
                      } : {
                        background: 'rgba(245,158,11,0.15)',
                        color: '#F59E0B',
                        border: '1px solid rgba(245,158,11,0.3)',
                      }}
                      data-testid="badge-2fa-status"
                    >
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  )}
                </div>

                {!showSetupInline ? (
                  <div
                    className="flex items-center justify-between gap-3 p-4 rounded-xl"
                    style={{
                      background: '#0F152B',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div>
                      <Label className="font-medium" style={{ color: '#E6F7FF' }}>
                        {twoFactorEnabled ? '2FA is protecting your account' : 'Enable 2FA for extra security'}
                      </Label>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={handleToggle2FA}
                      disabled={twoFactorLoading}
                      className="data-[state=checked]:bg-[#00F0FF]"
                      data-testid="switch-2fa"
                    />
                  </div>
                ) : (
                  <div
                    className="mt-4 p-4 rounded-xl"
                    style={{
                      background: '#0F152B',
                      border: '1px solid rgba(0,240,255,0.15)',
                    }}
                    data-testid="card-2fa-setup"
                  >
                    <TwoFactorSetupInline
                      onSuccess={handle2FASuccess}
                      onCancel={() => setShowSetupInline(false)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0" style={sectionStyle} data-testid="card-password">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,240,255,0.1)' }}>
                    <Lock className="w-6 h-6" style={{ color: '#00F0FF' }} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#E6F7FF' }}>
                      Password
                    </h2>
                    <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                      Change your account password
                    </p>
                  </div>
                </div>

                {!showPasswordForm ? (
                  <Button
                    onClick={() => setShowPasswordForm(true)}
                    variant="outline"
                    style={{
                      background: '#0F152B',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: '#E6F7FF',
                    }}
                    data-testid="button-change-password"
                  >
                    Change Password
                  </Button>
                ) : (
                  <div
                    className="space-y-4 p-4 rounded-xl"
                    style={{ background: '#0F152B', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="text-sm" style={{ color: '#A9B4E5' }}>Current Password</Label>
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
                      <Label htmlFor="new-password" className="text-sm" style={{ color: '#A9B4E5' }}>New Password</Label>
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
                      <Label htmlFor="confirm-password" className="text-sm" style={{ color: '#A9B4E5' }}>Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ background: '#0B0E1A', borderColor: 'rgba(255,255,255,0.08)', color: '#E6F7FF' }}
                        data-testid="input-confirm-password"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
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
                        className="border-0 font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #00F0FF, #00FFE5)',
                          color: '#04141C',
                        }}
                        data-testid="button-update-password"
                      >
                        {passwordChangeMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {sessions && sessions.length > 0 && (
              <Card className="border-0" style={sectionStyle} data-testid="card-active-sessions">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl" style={{ background: 'rgba(167,139,250,0.1)' }}>
                      <Monitor className="w-6 h-6" style={{ color: '#A78BFA' }} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#E6F7FF' }}>
                        Active Sessions
                      </h2>
                      <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                        Devices currently signed into your account
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {sessions.map((session: Session, index: number) => {
                      const deviceName = session.browser && session.os
                        ? `${session.browser} on ${session.os}`
                        : session.userAgent || 'Unknown Device';

                      return (
                        <div
                          key={session.sessionId}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl"
                          style={{
                            background: '#0F152B',
                            border: index === 0 ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(255,255,255,0.04)',
                          }}
                          data-testid={`session-${session.sessionId}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ background: 'rgba(167,139,250,0.1)' }}>
                              <div style={{ color: '#A78BFA' }}>
                                {getDeviceIcon(session.deviceType, session.browser)}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-sm" style={{ color: '#E6F7FF' }}>{deviceName}</p>
                              <p className="text-xs" style={{ color: '#7C86B8' }}>
                                {session.location || session.ipAddress || 'Unknown location'} - {formatLastSeen(session.lastSeenAt)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeSessionMutation.mutate(session.sessionId)}
                            disabled={revokeSessionMutation.isPending}
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              color: '#FCA5A5',
                              border: '1px solid rgba(239,68,68,0.25)',
                            }}
                            data-testid={`button-revoke-session-${session.sessionId}`}
                          >
                            Revoke
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0" style={sectionStyle} data-testid="card-data">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <Download className="w-6 h-6" style={{ color: '#EF4444' }} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#E6F7FF' }}>
                      Your Data
                    </h2>
                    <p className="text-xs sm:text-sm" style={{ color: '#A9B4E5' }}>
                      Export or permanently delete your account data
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="flex items-center justify-between gap-3 p-4 rounded-xl"
                    style={{ background: '#0F152B', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div>
                      <Label className="font-medium" style={{ color: '#E6F7FF' }}>Export Your Data</Label>
                      <p className="text-xs" style={{ color: '#7C86B8' }}>
                        Download all your account data as a JSON file
                      </p>
                    </div>
                    <Button
                      onClick={() => exportDataMutation.mutate()}
                      disabled={exportDataMutation.isPending}
                      variant="outline"
                      style={{
                        background: '#0F152B',
                        borderColor: 'rgba(255,255,255,0.08)',
                        color: '#E6F7FF',
                      }}
                      data-testid="button-export-data"
                    >
                      {exportDataMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </>
                      )}
                    </Button>
                  </div>

                  <div
                    className="p-4 rounded-xl"
                    style={{ background: '#0F152B', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <Label className="font-medium" style={{ color: '#E6F7FF' }}>Delete Account</Label>
                        <p className="text-xs" style={{ color: '#7C86B8' }}>
                          This permanently deletes all your data and cannot be undone
                        </p>
                      </div>
                      {!showDeleteConfirm ? (
                        <Button
                          variant="ghost"
                          onClick={() => setShowDeleteConfirm(true)}
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            color: '#FCA5A5',
                            border: '1px solid rgba(239,68,68,0.25)',
                          }}
                          data-testid="button-delete-account"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      ) : null}
                    </div>

                    {showDeleteConfirm && (
                      <div
                        className="p-4 rounded-lg space-y-3"
                        style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
                          <p className="text-sm" style={{ color: '#FCA5A5' }}>
                            This will permanently delete your account, all products, campaigns, analytics, and connected store data. This action cannot be undone.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: '#A9B4E5' }}>
                            Type <span style={{ color: '#EF4444', fontWeight: 600 }}>DELETE MY ACCOUNT</span> to confirm
                          </Label>
                          <Input
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="DELETE MY ACCOUNT"
                            style={{ background: '#0B0E1A', borderColor: 'rgba(239,68,68,0.2)', color: '#E6F7FF' }}
                            data-testid="input-delete-confirmation"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmation(""); }}
                            data-testid="button-cancel-delete"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => deleteAccountMutation.mutate()}
                            disabled={deleteConfirmation !== 'DELETE MY ACCOUNT' || deleteAccountMutation.isPending}
                            data-testid="button-confirm-delete"
                          >
                            {deleteAccountMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              'Permanently Delete Account'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </PageShell>
    </>
  );
}
