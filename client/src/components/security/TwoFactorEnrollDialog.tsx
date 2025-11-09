import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, Shield, AlertTriangle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AccessibleLoading } from "@/components/ui/accessible-loading";

interface TwoFactorEnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface SetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export function TwoFactorEnrollDialog({
  open,
  onOpenChange,
  onSuccess,
}: TwoFactorEnrollDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"setup" | "verify">("setup");
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
      setStep("verify");
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
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep("setup");
    setSetupData(null);
    setVerificationToken("");
    setCopiedSecret(false);
    setCopiedCodes(false);
    setSavedBackupCodes(false);
    onOpenChange(false);
  };

  const handleSetup = () => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-white">
              {step === "setup" ? "Enable Two-Factor Authentication" : "Verify Your Setup"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400">
            {step === "setup"
              ? "Add an extra layer of security to your account with 2FA"
              : "Enter the code from your authenticator app to complete setup"}
          </DialogDescription>
        </DialogHeader>

        {step === "setup" && !setupMutation.isPending && !setupData && (
          <div className="space-y-4 py-4">
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <AlertTriangle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300 text-sm">
                You'll need an authenticator app like Google Authenticator, Authy, or 1Password to continue.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">How it works:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-400">
                <li>Scan a QR code with your authenticator app</li>
                <li>Enter the 6-digit code to verify</li>
                <li>Save your backup codes in a secure location</li>
              </ol>
            </div>
          </div>
        )}

        {setupMutation.isPending && (
          <div className="py-8">
            <AccessibleLoading message="Setting up two-factor authentication..." />
          </div>
        )}

        {step === "verify" && setupData && (
          <div className="space-y-6 py-4">
            {/* QR Code */}
            <Card className="p-4 bg-white border-0">
              <div className="flex flex-col items-center space-y-3">
                <p className="text-sm text-slate-600 text-center">Scan this QR code with your authenticator app</p>
                <img
                  src={setupData.qrCode}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                  data-testid="img-2fa-qr-code"
                />
              </div>
            </Card>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label className="text-white text-sm">Or enter this code manually:</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={setupData.secret}
                  readOnly
                  className="bg-slate-800/50 border-slate-600 text-white font-mono text-sm"
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

            <Separator className="bg-slate-700" />

            {/* Backup Codes */}
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300 text-sm">
                Save these backup codes! You'll need them if you lose access to your authenticator app.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-white text-sm font-medium">Backup Codes</Label>
              <Card className="p-4 bg-slate-800/50 border-slate-700">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm text-slate-300">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-slate-500">{index + 1}.</span>
                      <span>{code}</span>
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

            <div className="flex items-start space-x-2 p-3 bg-slate-800/50 rounded-lg">
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

            <Separator className="bg-slate-700" />

            {/* Verification Code Input */}
            <div className="space-y-2">
              <Label htmlFor="verification-code" className="text-white">
                Enter the 6-digit code from your authenticator app
              </Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="bg-slate-800/50 border-slate-600 text-white text-center text-2xl tracking-widest font-mono"
                data-testid="input-verification-code"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "setup" && !setupMutation.isPending && !setupData && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetup}
                className="gradient-button"
                data-testid="button-start-setup"
              >
                Start Setup
              </Button>
            </>
          )}

          {step === "verify" && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
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
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
