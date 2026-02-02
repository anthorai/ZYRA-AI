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
  CircleDot,
  Activity,
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
  SidebarTrigger,
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
      {
        title: "Revenue Loop",
        url: "/admin/revenue-loop",
        icon: CircleDot,
        testId: "nav-admin-revenue-loop",
      },
      {
        title: "Master Loop",
        url: "/admin/master-loop",
        icon: Activity,
        testId: "nav-admin-master-loop",
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
      <SidebarHeader className="p-4 bg-[#16162c] pt-[7px] pb-[7px]">
        <div className="flex items-start gap-3" data-testid="admin-sidebar-header">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
              data-testid="button-back-to-app"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col pt-1">
            <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage your application</p>
          </div>
        </div>
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
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-12 items-center gap-2 border-b px-4 md:px-6 bg-[#16162c]">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm font-medium text-muted-foreground">Admin</span>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
