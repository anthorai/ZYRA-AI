import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { User, Loader2 } from "lucide-react";

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
});

const sectionStyle = {
  background: '#121833',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
};

const inputStyle = {
  background: '#0F152B',
  border: '1px solid rgba(255,255,255,0.06)',
  color: '#E6F7FF',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/me");
      const data = await response.json();
      return data.user;
    },
  });

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
      useHistoryBack={true}
      maxWidth="xl"
      spacing="normal"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {isLoadingUser ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00F0FF' }} />
            <span className="ml-3" style={{ color: '#A9B4E5' }}>Loading profile...</span>
          </div>
        ) : (
          <Card
            className="relative overflow-hidden border-0 rounded-2xl"
            style={sectionStyle}
            data-testid="card-profile-info"
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-[2px]"
              style={{ backgroundColor: 'rgba(0,240,255,0.2)' }}
            />

            <CardHeader className="pb-0">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold" style={{ color: '#E6F7FF' }} data-testid="text-profile-title">
                    Profile Information
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: '#9AA6D6' }}>
                    Update your personal information and profile image
                  </p>
                </div>
                <User className="w-5 h-5 flex-shrink-0" style={{ color: '#7C86B8' }} />
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Avatar */}
              <div className="flex justify-center mb-8">
                <Avatar
                  className="w-28 h-28 sm:w-32 sm:h-32"
                  style={{
                    boxShadow: '0 0 24px rgba(0,240,255,0.6)',
                  }}
                  data-testid="img-avatar"
                >
                  <AvatarFallback
                    className="text-3xl sm:text-4xl font-bold tracking-wide"
                    style={{
                      background: 'linear-gradient(135deg, #00F0FF, #00FFE5)',
                      color: '#04141C',
                    }}
                  >
                    {userData?.fullName?.slice(0, 2).toUpperCase() || "US"}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Form */}
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
                          <FormLabel className="text-sm" style={{ color: '#A9B4E5' }}>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="focus:ring-1 focus:ring-[#00F0FF]/35 focus:border-[#00F0FF] placeholder:text-[#7C86B8]"
                              style={inputStyle}
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
                          <FormLabel className="text-sm" style={{ color: '#A9B4E5' }}>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              className="focus:ring-1 focus:ring-[#00F0FF]/35 focus:border-[#00F0FF] placeholder:text-[#7C86B8]"
                              style={inputStyle}
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
                      className="border-0 font-semibold"
                      style={{
                        background: 'linear-gradient(135deg, #00F0FF, #00FFE5)',
                        color: '#04141C',
                        boxShadow: '0 6px 20px rgba(0,240,255,0.45)',
                      }}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
        )}
      </div>
    </PageShell>
  );
}
