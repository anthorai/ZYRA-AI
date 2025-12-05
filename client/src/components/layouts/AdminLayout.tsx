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
  Sparkles,
} from "lucide-react";
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
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Zyra AI Admin
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Control Panel
            </span>
          </div>
        </div>
        <div className="px-2 pb-2">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              data-testid="button-back-to-app"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Button>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
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
