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
import { AlertTriangle, ShieldOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TwoFactorDisableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TwoFactorDisableDialog({
  open,
  onOpenChange,
  onSuccess,
}: TwoFactorDisableDialogProps) {
  const { toast } = useToast();
  const [verificationToken, setVerificationToken] = useState("");

  const disableMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/2fa/disable", { token });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been turned off",
      });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setVerificationToken("");
    onOpenChange(false);
  };

  const handleDisable = () => {
    // Accept either 6-digit TOTP codes or 8-character backup codes
    if (!verificationToken || (verificationToken.length !== 6 && verificationToken.length !== 8)) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit authenticator code or 8-character backup code",
        variant: "destructive",
      });
      return;
    }

    disableMutation.mutate(verificationToken);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/20">
              <ShieldOff className="w-5 h-5 text-red-400" />
            </div>
            <DialogTitle className="text-white">Disable Two-Factor Authentication</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400">
            Enter your verification code to turn off 2FA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm">
              Disabling 2FA will make your account less secure. You'll only need your password to sign in.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="disable-code" className="text-white">
              Enter the 6-digit code from your authenticator app
            </Label>
            <Input
              id="disable-code"
              type="text"
              placeholder="000000 or ABCD1234"
              value={verificationToken}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().slice(0, 8);
                // Only allow alphanumeric characters
                setVerificationToken(value.replace(/[^A-Z0-9]/g, ""));
              }}
              maxLength={8}
              className="bg-slate-800/50 border-slate-600 text-white text-center text-2xl tracking-widest font-mono"
              data-testid="input-disable-code"
              autoFocus
            />
            <p className="text-xs text-slate-500">
              Enter a 6-digit code from your authenticator app or an 8-character backup code
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={disableMutation.isPending}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
            data-testid="button-cancel-disable"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDisable}
            disabled={!verificationToken || (verificationToken.length !== 6 && verificationToken.length !== 8) || disableMutation.isPending}
            className="bg-red-500 hover:bg-red-600 text-white"
            data-testid="button-confirm-disable"
          >
            {disableMutation.isPending ? "Disabling..." : "Disable 2FA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
