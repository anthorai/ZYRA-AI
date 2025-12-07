import { ReactNode } from "react";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  ToggleLeft,
  Brain,
  BarChart3,
  Clock,
  Shield,
  ShoppingBag,
  Key,
  Mail,
  FileWarning,
  FileText,
  FolderOpen,
  Database,
  ArrowLeft,
} from "lucide-react";
import zyraLogo from "@assets/zyra logo_1758518826550.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavGroups = [
  {
    label: "Core Management",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
        testId: "nav-admin-dashboard",
      },
      {
        title: "Users & Subscriptions",
        url: "/admin/subscriptions",
        icon: Users,
        testId: "nav-admin-subscriptions",
      },
      {
        title: "Support Inbox",
        url: "/admin/support-inbox",
        icon: MessageSquare,
        testId: "nav-admin-support-inbox",
      },
    ],
  },
  {
    label: "AI & Features",
    items: [
      {
        title: "Feature Toggles",
        url: "/admin/feature-toggles",
        icon: ToggleLeft,
        testId: "nav-admin-feature-toggles",
      },
      {
        title: "AI Engine Controls",
        url: "/admin/ai-engine",
        icon: Brain,
        testId: "nav-admin-ai-engine",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "System Analytics",
        url: "/admin/analytics",
        icon: BarChart3,
        testId: "nav-admin-analytics",
      },
      {
        title: "Scheduler Console",
        url: "/admin/scheduler",
        icon: Clock,
        testId: "nav-admin-scheduler",
      },
      {
        title: "Security Center",
        url: "/admin/security",
        icon: Shield,
        testId: "nav-admin-security",
      },
    ],
  },
  {
    label: "Integrations",
    items: [
      {
        title: "Shopify Controls",
        url: "/admin/shopify",
        icon: ShoppingBag,
        testId: "nav-admin-shopify",
      },
      {
        title: "API Key Management",
        url: "/admin/api-keys",
        icon: Key,
        testId: "nav-admin-api-keys",
      },
      {
        title: "Email & Notifications",
        url: "/admin/email",
        icon: Mail,
        testId: "nav-admin-email",
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        title: "Content Moderation",
        url: "/admin/moderation",
        icon: FileWarning,
        testId: "nav-admin-moderation",
      },
      {
        title: "Content Management",
        url: "/admin/content",
        icon: FileText,
        testId: "nav-admin-content",
      },
      {
        title: "File Manager",
        url: "/admin/files",
        icon: FolderOpen,
        testId: "nav-admin-files",
      },
      {
        title: "Database Controls",
        url: "/admin/database",
        icon: Database,
        testId: "nav-admin-database",
      },
    ],
  },
];

function AdminSidebar() {
  const [location] = useLocation();

  const isActive = (url: string) => {
    if (url === "/admin") {
      return location === "/admin";
    }
    return location.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="bg-[#16162c] p-6">
        <div className="flex items-center space-x-3 mb-4" data-testid="admin-sidebar-logo">
          <img 
            src={zyraLogo} 
            alt="Zyra AI Logo" 
            className="w-10 h-10 rounded-lg"
          />
          <span className="text-xl sm:text-2xl font-bold text-foreground">Zyra AI</span>
        </div>
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-3 h-auto text-muted-foreground hover:text-foreground hover:bg-muted"
            data-testid="button-back-to-app"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="ml-3">Back to App</span>
          </Button>
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-[#16162c]">
        {adminNavGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      data-testid={item.testId}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
