import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Lock, 
  Store, 
  Camera, 
  Settings, 
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

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch current user data
  const { data: user } = useQuery<any>({
    queryKey: ["/api/me"],
  });

  // Fetch store connections
  const { data: storeConnections = [] } = useQuery<any[]>({
    queryKey: ["/api/store-connections"],
  });

  // Profile update form
  const profileForm = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
    },
    values: {
      fullName: user?.fullName || "",
      email: user?.email || "",
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

  // Profile image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return await apiRequest("POST", "/api/upload-profile-image", formData);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gradient-surface border border-slate-700">
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
        </TabsList>

        {/* Profile Card Tab */}
        <TabsContent value="profile">
          <Card className="gradient-card border-0 hover:shadow-cyan-500/20 transition-all duration-500">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <User className="w-5 h-5 text-primary" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                Update your personal information and profile image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image Section */}
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                    <AvatarFallback className="text-xl gradient-surface text-primary font-bold">
                      {user?.fullName?.slice(0, 2).toUpperCase() || "US"}
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
                      className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
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
                              className="form-input text-white placeholder:text-slate-400 transition-all duration-300"
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
                              className="form-input text-white placeholder:text-slate-400 transition-all duration-300"
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
                      className="gradient-button font-semibold 
                        hover:bg-primary/90 transition-all duration-300 
                        transform hover:scale-105 shadow-lg hover:shadow-cyan-500/30 
                        disabled:opacity-50 disabled:transform-none px-8 py-2"
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Change Password</span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                              className="form-input text-white pr-10"
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
                              className="form-input text-white pr-10"
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
                              className="form-input text-white pr-10"
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
                    className="gradient-button"
                    data-testid="button-change-password"
                  >
                    {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stores Tab */}
        <TabsContent value="stores">
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Store className="w-5 h-5" />
                <span>Store Connections</span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                Connect and manage your e-commerce store integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {storeConnections.length > 0 ? (
                  storeConnections.map((store: any) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-600/30"
                      data-testid={`store-connection-${store.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{store.storeName}</p>
                          <p className="text-sm text-slate-400 capitalize">{store.platform}</p>
                          {store.storeUrl && (
                            <p className="text-xs text-slate-500">{store.storeUrl}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">Connected</span>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => disconnectStoreMutation.mutate(store.id)}
                          disabled={disconnectStoreMutation.isPending}
                          data-testid={`button-disconnect-${store.id}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Store className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">No stores connected yet</p>
                  </div>
                )}

                {/* Connect New Store Form */}
                <div className="pt-6 border-t border-slate-600/30">
                  <h4 className="text-white font-medium mb-4">Connect New Store</h4>
                  <Form {...storeForm}>
                    <form 
                      onSubmit={storeForm.handleSubmit((data) => connectStoreMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={storeForm.control}
                          name="platform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Platform</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="form-select text-white">
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
                      </div>
                      <FormField
                        control={storeForm.control}
                        name="storeUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Store URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="form-input text-white"
                                placeholder="https://your-store.com"
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
                                placeholder="Enter your store access token"
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
                        className="gradient-button"
                        data-testid="button-connect-store"
                      >
                        {connectStoreMutation.isPending ? "Connecting..." : "Connect Store"}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}