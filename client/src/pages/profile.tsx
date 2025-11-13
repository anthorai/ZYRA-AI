import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageShell } from "@/components/ui/page-shell";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "lucide-react";

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data from API
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/me");
      const data = await response.json();
      return data.user; // Unwrap the user object
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
          <div className="space-y-6">
              <DashboardCard
                title="Profile Information"
                description="Update your personal information and profile image"
                headerAction={<User className="w-5 h-5 text-primary" />}
                testId="card-profile-info"
                className="hover:shadow-cyan-500/20 transition-all duration-500"
              >
                <div className="space-y-6">
                  {/* Profile Avatar Section */}
                  <div className="flex justify-center mb-8">
                    <Avatar className="w-32 h-32 border-4 border-primary/30 shadow-lg shadow-primary/20">
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 text-white font-bold tracking-wide">
                        {userData?.fullName?.slice(0, 2).toUpperCase() || "US"}
                      </AvatarFallback>
                    </Avatar>
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
          </div>
        )}
      </div>
    </PageShell>
  );
}