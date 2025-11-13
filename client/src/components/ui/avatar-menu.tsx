import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { User, Settings as SettingsIcon, LogOut } from "lucide-react";

export function AvatarMenu() {
  const { appUser, user } = useAuth();
  const { handleLogout, isLoggingOut } = useLogout();
  const [, setLocation] = useLocation();

  // Get display name with robust fallback logic
  const getDisplayName = () => {
    if (appUser?.fullName) return appUser.fullName;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.email) return user.email.split('@')[0];
    return "User";
  };

  const getDisplayPlan = () => {
    return appUser?.plan || "Free";
  };

  const getInitials = () => {
    const name = getDisplayName();
    if (name === "User") return "U";
    return name.charAt(0).toUpperCase();
  };

  const displayName = getDisplayName();
  const displayPlan = getDisplayPlan();
  const initials = getInitials();

  const onLogoutClick = () => {
    handleLogout("/"); // Redirect to landing page for consistency
  };

  const handleProfileClick = () => {
    setLocation("/profile");
  };

  const handleSettingsClick = () => {
    setLocation("/profile"); // Navigate to profile page which has settings tab
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full text-slate-200 hover:text-primary transition-all duration-300 ease-in-out"
          data-testid="avatar-menu-trigger"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={displayName} />
            <AvatarFallback className="gradient-card text-primary border border-primary/20">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 gradient-card border-border/50 text-white" 
        align="end" 
        forceMount
      >
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none min-w-0 flex-1">
            <p className="font-bold text-white text-sm break-words overflow-hidden" data-testid="text-user-name">{displayName}</p>
            <p className="text-xs text-slate-300 capitalize" data-testid="text-user-plan">{displayPlan} Plan</p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-border/30" />
        <DropdownMenuItem
          className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
          onClick={handleProfileClick}
          data-testid="menuitem-profile"
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
          onClick={handleSettingsClick}
          data-testid="menuitem-settings"
        >
          <SettingsIcon className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/30" />
        <DropdownMenuItem
          className={`text-red-300 hover:text-red-200 hover:bg-red-500/20 focus:text-red-200 focus:bg-red-500/20 cursor-pointer ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={isLoggingOut ? undefined : onLogoutClick}
          disabled={isLoggingOut}
          data-testid="menuitem-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? 'Logging Out...' : 'Logout'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}