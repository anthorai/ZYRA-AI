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
import { Shield, Lock, Smartphone, Key, Download, Trash2, Eye, Chrome, Monitor } from "lucide-react";

export default function SecurityPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const activeSessions = [
    {
      id: "1",
      device: "Chrome on Windows",
      location: "New York, USA",
      lastActive: "Active now",
      icon: <Chrome className="w-5 h-5" />
    },
    {
      id: "2",
      device: "Safari on iPhone",
      location: "New York, USA",
      lastActive: "2 hours ago",
      icon: <Smartphone className="w-5 h-5" />
    },
    {
      id: "3",
      device: "Firefox on MacOS",
      location: "Boston, USA",
      lastActive: "1 day ago",
      icon: <Monitor className="w-5 h-5" />
    }
  ];

  const handleToggle2FA = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    toast({
      title: enabled ? "2FA Enabled" : "2FA Disabled",
      description: enabled 
        ? "Two-factor authentication has been enabled for your account"
        : "Two-factor authentication has been disabled",
      duration: 3000,
    });
  };

  const handlePasswordUpdate = () => {
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

    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully",
      duration: 3000,
    });
    
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleRevokeSession = (sessionId: string, device: string) => {
    toast({
      title: "Session Revoked",
      description: `Logged out from ${device}`,
      duration: 3000,
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Initiated",
      description: "Your data export will be ready in a few minutes",
      duration: 3000,
    });
  };

  return (
    <PageShell
      title="Security Settings"
      subtitle="Protect your account with advanced security features"
      backTo="/settings"
      maxWidth="xl"
      spacing="normal"
    >
      {/* Two-Factor Authentication */}
      <DashboardCard
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
        headerAction={
          <Badge
            variant={twoFactorEnabled ? "default" : "secondary"}
            className={twoFactorEnabled
              ? "bg-green-500/20 text-green-400"
              : "bg-slate-500/20 text-slate-400"
            }
          >
            {twoFactorEnabled ? "Enabled" : "Disabled"}
          </Badge>
        }
        testId="card-2fa"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Smartphone className="w-5 h-5 text-primary" />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white font-medium">Enable 2FA</Label>
              <p className="text-sm text-slate-400 mt-1">
                Require a code from your authenticator app when signing in
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
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
                  className="gradient-button"
                  data-testid="button-update-password"
                >
                  Update Password
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
        <div className="space-y-4">
          {activeSessions.map((session, index) => (
            <div key={session.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-slate-800/50">
                    <div className="text-primary">{session.icon}</div>
                  </div>
                  <div>
                    <p className="text-white font-medium">{session.device}</p>
                    <p className="text-sm text-slate-400">{session.location}</p>
                    <p className="text-xs text-slate-500">{session.lastActive}</p>
                  </div>
                </div>
                {session.id !== "1" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id, session.device)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    data-testid={`button-revoke-session-${session.id}`}
                  >
                    Revoke
                  </Button>
                )}
              </div>
              {index < activeSessions.length - 1 && <Separator className="bg-slate-700 mt-4" />}
            </div>
          ))}
        </div>
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
  );
}
