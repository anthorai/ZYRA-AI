import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageShell } from "@/components/ui/page-shell";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Lock, 
  Store, 
  Globe, 
  Camera, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  Trash2
} from "lucide-react";

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const connectStoreSchema = z.object({
  platform: z.enum(["shopify", "woocommerce"]),
  storeName: z.string().min(1, "Store name is required"),
  storeUrl: z.string().url("Invalid store URL"),
  accessToken: z.string().min(1, "Access token is required"),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const { handleLogout } = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user data from API
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/me");
      const data = await response.json();
      return data.user; // Unwrap the user object
    },
  });

  // Fetch store connections from API
  const { data: storeConnections = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ["/api/store-connections"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/store-connections");
      return await response.json();
    },
  });

  // Profile update form
  const profileForm = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: userData?.fullName || "",
      email: userData?.email || "",
    },
    values: {
      fullName: userData?.fullName || "",
      email: userData?.email || "",
    },
  });

  // Password change form
  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Store connection form
  const storeForm = useForm({
    resolver: zodResolver(connectStoreSchema),
    defaultValues: {
      platform: "shopify" as const,
      storeName: "",
      storeUrl: "",
      accessToken: "",
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Success", description: "Profile updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/change-password", data);
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: "Success", description: "Password changed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Store connection mutation
  const connectStoreMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/store-connections", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-connections"] });
      storeForm.reset();
      toast({ title: "Success", description: "Store connected successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect store",
        variant: "destructive",
      });
    },
  });

  // Language update mutation
  const updateLanguageMutation = useMutation({
    mutationFn: async (language: string) => {
      return await apiRequest("PUT", "/api/language", { preferredLanguage: language });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Success", description: "Language preference updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update language",
        variant: "destructive",
      });
    },
  });

  // Profile image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return await apiRequest("POST", "/api/profile/upload-image", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Success", description: "Profile image updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  // Disconnect store mutation
  const disconnectStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      return await apiRequest("DELETE", `/api/store-connections/${storeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-connections"] });
      toast({ title: "Success", description: "Store disconnected successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect store",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadImageMutation.mutate(file);
    }
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "pt", name: "Portuguese" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
  ];

  return (
    <PageShell
      title="Profile Settings"
      subtitle="Manage your personal information and preferences"
      
      maxWidth="xl"
      spacing="normal"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {isLoadingUser ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="h-10 items-center justify-center rounded-md p-1 grid w-full grid-cols-4 border border-slate-700 text-[#f7f9ff] bg-[#16162c]">
            <TabsTrigger value="profile" className="flex items-center space-x-2 data-[state=active]:active-tab">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center space-x-2 data-[state=active]:active-tab">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Password</span>
            </TabsTrigger>
            <TabsTrigger value="stores" className="flex items-center space-x-2 data-[state=active]:active-tab">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Stores</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center space-x-2 data-[state=active]:active-tab">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Language</span>
            </TabsTrigger>
          </TabsList>

            {/* Profile Card Tab */}
            <TabsContent value="profile">
              <DashboardCard
                title="Profile Information"
                description="Update your personal information and profile image"
                headerAction={<User className="w-5 h-5 text-primary" />}
                testId="card-profile-info"
                className="hover:shadow-cyan-500/20 transition-all duration-500"
              >
                <div className="space-y-6">
                  {/* Profile Image Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative group">
                      <Avatar className="w-24 h-24 border-4 border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                        <AvatarImage src={userData?.imageUrl} alt={userData?.fullName || "User"} />
                        <AvatarFallback className="text-xl bg-gradient-to-br gradient-surface text-primary font-bold">
                          {userData?.fullName?.slice(0, 2).toUpperCase() || "US"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="space-y-2">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadImageMutation.isPending}
                          className="gradient-button transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
                          data-testid="button-upload-image"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {uploadImageMutation.isPending ? "Uploading..." : "Change Photo"}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          data-testid="input-file-upload"
                        />
                        <p className="text-xs text-slate-400">
                          JPG, PNG or GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <Form {...profileForm}>
                    <form 
                      onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200 font-medium">Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 
                                    focus:border-primary focus:ring-primary/20 focus:ring-2 focus:ring-offset-0 
                                    focus:shadow-lg focus:shadow-cyan-500/25 transition-all duration-300 
                                    hover:border-slate-500 hover:shadow-md hover:shadow-cyan-500/10"
                                  placeholder="Enter your full name"
                                  data-testid="input-full-name"
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200 font-medium">Email Address</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 
                                    focus:border-primary focus:ring-primary/20 focus:ring-2 focus:ring-offset-0 
                                    focus:shadow-lg focus:shadow-cyan-500/25 transition-all duration-300 
                                    hover:border-slate-500 hover:shadow-md hover:shadow-cyan-500/10"
                                  placeholder="Enter your email address"
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 bg-gradient-to-r gradient-surface font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:transform-none px-8 py-2 text-[#101024]"
                          data-testid="button-save-profile"
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </DashboardCard>
            </TabsContent>


            {/* Password Tab */}
            <TabsContent value="password">
              <DashboardCard
                title="Change Password"
                description="Update your password to keep your account secure"
                headerAction={<Lock className="w-5 h-5" />}
                testId="card-password"
              >
                  <Form {...passwordForm}>
                    <form 
                      onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Current Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showCurrentPassword ? "text" : "password"}
                                  className="bg-slate-800 border-slate-600 text-white pr-10"
                                  placeholder="Enter current password"
                                  data-testid="input-current-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                  {showCurrentPassword ? (
                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-slate-400" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showNewPassword ? "text" : "password"}
                                  className="bg-slate-800 border-slate-600 text-white pr-10"
                                  placeholder="Enter new password"
                                  data-testid="input-new-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-slate-400" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Confirm New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showConfirmPassword ? "text" : "password"}
                                  className="bg-slate-800 border-slate-600 text-white pr-10"
                                  placeholder="Confirm new password"
                                  data-testid="input-confirm-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-slate-400" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        data-testid="button-change-password"
                      >
                        {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                      </Button>
                    </form>
                  </Form>
              </DashboardCard>
            </TabsContent>

            {/* Stores Tab */}
            <TabsContent value="stores">
              <div className="space-y-6">
                {/* Connected Stores */}
                <DashboardCard
                  title="Connected Stores"
                  description="Manage your connected e-commerce platforms"
                  headerAction={<Store className="w-5 h-5" />}
                  testId="card-connected-stores"
                >
                    {storeConnections.length > 0 ? (
                      <div className="space-y-4">
                        {storeConnections.map((store: any) => (
                          <div
                            key={store.id}
                            className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-600"
                            data-testid={`store-connection-${store.id}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                                <Store className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="text-white font-medium">{store.storeName}</h3>
                                <p className="text-slate-400 text-sm capitalize">{store.platform}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={store.status === "active" ? "default" : "destructive"}
                                className={store.status === "active" ? "bg-green-500/20 text-green-400" : ""}
                              >
                                {store.status === "active" ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                )}
                                {store.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => disconnectStoreMutation.mutate(store.id)}
                                disabled={disconnectStoreMutation.isPending}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                data-testid={`button-disconnect-${store.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-center py-8">
                        No stores connected yet. Add your first store below.
                      </p>
                    )}
                </DashboardCard>

                {/* Connect New Store */}
                <DashboardCard
                  title="Connect New Store"
                  description="Add a new Shopify or WooCommerce store to sync with Zyra AI"
                  testId="card-connect-store"
                >
                    <Form {...storeForm}>
                      <form 
                        onSubmit={storeForm.handleSubmit((data) => connectStoreMutation.mutate(data))}
                        className="space-y-4"
                      >
                        <FormField
                          control={storeForm.control}
                          name="platform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Platform</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="form-select text-white" data-testid="select-platform">
                                    <SelectValue placeholder="Select platform" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="gradient-surface">
                                  <SelectItem value="shopify">Shopify</SelectItem>
                                  <SelectItem value="woocommerce">WooCommerce</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={storeForm.control}
                          name="storeName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Store Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="form-input text-white"
                                  placeholder="My Store"
                                  data-testid="input-store-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={storeForm.control}
                          name="storeUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Store URL</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="url"
                                  className="form-input text-white"
                                  placeholder="https://mystore.shopify.com"
                                  data-testid="input-store-url"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={storeForm.control}
                          name="accessToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Access Token</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  className="form-input text-white"
                                  placeholder="Enter your access token"
                                  data-testid="input-access-token"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          disabled={connectStoreMutation.isPending}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          data-testid="button-connect-store"
                        >
                          {connectStoreMutation.isPending ? "Connecting..." : "Connect Store"}
                        </Button>
                      </form>
                    </Form>
                </DashboardCard>
              </div>
            </TabsContent>

            {/* Language Tab */}
            <TabsContent value="language">
              <DashboardCard
                title="Language Preferences"
                description="Choose your preferred language for the interface"
                headerAction={<Globe className="w-5 h-5" />}
                testId="card-language"
              >
                  <div className="space-y-4">
                    <Label className="text-white">Preferred Language</Label>
                    <Select
                      value={userData?.preferredLanguage || "en"}
                      onValueChange={(value) => updateLanguageMutation.mutate(value)}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="gradient-surface">
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {updateLanguageMutation.isPending && (
                      <p className="text-slate-400 text-sm">Updating language preference...</p>
                    )}
                  </div>
              </DashboardCard>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageShell>
  );
}