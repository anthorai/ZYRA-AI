import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, Shield, AlertTriangle, Download, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AccessibleLoading } from "@/components/ui/accessible-loading";

interface TwoFactorSetupInlineProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface SetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export function TwoFactorSetupInline({
  onSuccess,
  onCancel,
}: TwoFactorSetupInlineProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"intro" | "setup">("intro");
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [verificationToken, setVerificationToken] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [savedBackupCodes, setSavedBackupCodes] = useState(false);

  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/2fa/setup");
      return response.json() as Promise<SetupResponse>;
    },
    onSuccess: (data) => {
      setSetupData(data);
      setStep("setup");
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup 2FA",
        variant: "destructive",
      });
    },
  });

  const enableMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/2fa/enable", { token });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication is now protecting your account",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  const handleStartSetup = () => {
    setupMutation.mutate();
  };

  const handleVerify = () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code from your authenticator app",
        variant: "destructive",
      });
      return;
    }

    if (!savedBackupCodes) {
      toast({
        title: "Save Backup Codes",
        description: "Please confirm you have saved your backup codes before continuing",
        variant: "destructive",
      });
      return;
    }

    enableMutation.mutate(verificationToken);
  };

  const copyToClipboard = async (text: string, type: "secret" | "codes") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "secret") {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedCodes(true);
        setTimeout(() => setCopiedCodes(false), 2000);
      }
      toast({
        title: "Copied!",
        description: `${type === "secret" ? "Secret" : "Backup codes"} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;

    const content = `Zyra AI - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes securely. Each code can only be used once.

${setupData.backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}

Keep these codes in a safe place. You will need them if you lose access to your authenticator app.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zyra-2fa-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSavedBackupCodes(true);
    toast({
      title: "Backup Codes Downloaded",
      description: "Your backup codes have been saved securely",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-slate-400 hover:text-white"
          data-testid="button-back-2fa"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {step === "intro" ? "Enable Two-Factor Authentication" : "Complete 2FA Setup"}
            </h2>
            <p className="text-sm text-slate-400">
              {step === "intro"
                ? "Add an extra layer of security to your account"
                : "Scan the QR code and verify your setup"}
            </p>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      {/* Intro Step */}
      {step === "intro" && !setupMutation.isPending && (
        <div className="space-y-6">
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <AlertTriangle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300 text-sm">
              You'll need an authenticator app like Google Authenticator, Authy, or 1Password to continue.
            </AlertDescription>
          </Alert>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">How it works:</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-slate-300">
                <li>Scan a QR code with Google Authenticator or another authenticator app</li>
                <li>Enter the 6-digit code to verify</li>
                <li>Save your backup codes in a secure location</li>
              </ol>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
              data-testid="button-cancel-intro"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartSetup}
              className="gradient-button"
              data-testid="button-start-setup"
            >
              Start Setup
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {setupMutation.isPending && (
        <div className="py-12">
          <AccessibleLoading message="Setting up two-factor authentication..." />
        </div>
      )}

      {/* Setup Step */}
      {step === "setup" && setupData && (
        <div className="space-y-6">
          {/* QR Code Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Step 1: Scan QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card className="p-6 bg-white border-0">
                <div className="flex flex-col items-center space-y-3">
                  <p className="text-sm text-slate-600 text-center font-medium">
                    Scan this QR code with Google Authenticator or another authenticator app
                  </p>
                  <img
                    src={setupData.qrCode}
                    alt="2FA QR Code"
                    className="w-56 h-56"
                    data-testid="img-2fa-qr-code"
                  />
                </div>
              </Card>

              <div className="space-y-2">
                <Label className="text-white text-sm">Or enter this code manually:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={setupData.secret}
                    readOnly
                    className="bg-slate-900/50 border-slate-600 text-white font-mono text-sm"
                    data-testid="input-2fa-secret"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(setupData.secret, "secret")}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    data-testid="button-copy-secret"
                  >
                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup Codes Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Step 2: Save Backup Codes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-500/10 border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-300 text-sm">
                  Save these backup codes! You'll need them if you lose access to your authenticator app.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Card className="p-4 bg-slate-900/50 border-slate-700">
                  <div className="grid grid-cols-2 gap-3 font-mono text-sm text-slate-300">
                    {setupData.backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-slate-500 w-5">{index + 1}.</span>
                        <span className="select-all">{code}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(setupData.backupCodes.join("\n"), "codes")}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 flex-1"
                    data-testid="button-copy-codes"
                  >
                    {copiedCodes ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadBackupCodes}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 flex-1"
                    data-testid="button-download-codes"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  id="saved-codes"
                  checked={savedBackupCodes}
                  onChange={(e) => setSavedBackupCodes(e.target.checked)}
                  className="mt-1"
                  data-testid="checkbox-saved-codes"
                />
                <Label htmlFor="saved-codes" className="text-sm text-slate-300 cursor-pointer">
                  I have saved my backup codes in a secure location
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Verification Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Step 3: Verify Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code" className="text-white">
                  Enter the 6-digit code from Google Authenticator or your authenticator app
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="bg-slate-900/50 border-slate-600 text-white text-center text-2xl tracking-widest font-mono"
                  data-testid="input-verification-code"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={enableMutation.isPending}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
              data-testid="button-cancel-verify"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!verificationToken || verificationToken.length !== 6 || !savedBackupCodes || enableMutation.isPending}
              className="gradient-button"
              data-testid="button-enable-2fa"
            >
              {enableMutation.isPending ? "Verifying..." : "Enable 2FA"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
