import { Request, Response, NextFunction } from "express";
import { checkCredits } from "../lib/credits";
import { FeatureType } from "../lib/constants/feature-credits";

interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  plan: string;
  imageUrl?: string;
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  creditCheck?: {
    hasEnoughCredits: boolean;
    creditsUsed: number;
    creditsRemaining: number;
    creditLimit: number;
  };
}

export function requireCredits(featureType: FeatureType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          error: "Unauthorized",
          message: "User not authenticated" 
        });
      }

      const creditCheck = await checkCredits(userId, featureType);
      
      if (!creditCheck.hasEnoughCredits) {
        return res.status(403).json({ 
          error: "Insufficient credits",
          message: creditCheck.message || "You don't have enough credits to use this feature",
          creditsRequired: creditCheck.creditLimit - creditCheck.creditsRemaining,
          creditsAvailable: creditCheck.creditsRemaining,
          upgradeRequired: true
        });
      }

      // Attach credit info to request for logging/tracking
      (req as AuthenticatedRequest).creditCheck = creditCheck;
      next();
    } catch (error) {
      console.error("Credits middleware error:", error);
      res.status(500).json({ 
        error: "Internal server error",
        message: "Failed to check credits" 
      });
    }
  };
}
