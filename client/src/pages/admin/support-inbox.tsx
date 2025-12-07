import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Mail, CheckCircle, Clock, AlertCircle, User, Calendar, Tag } from "lucide-react";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    plan: string;
  };
}

const statusColors: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  resolved: "bg-green-500/20 text-green-400",
  closed: "bg-gray-500/20 text-gray-400",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-500/20 text-gray-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
};

export default function SupportInboxPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newPriority, setNewPriority] = useState("");

  // Build query params for filters
  const queryParams = new URLSearchParams();
  if (statusFilter && statusFilter !== "all") queryParams.set("status", statusFilter);
  if (priorityFilter && priorityFilter !== "all") queryParams.set("priority", priorityFilter);
  if (search) queryParams.set("search", search);

  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/admin/support-tickets", statusFilter, priorityFilter, search],
    queryFn: async () => {
      const url = `/api/admin/support-tickets${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await apiRequest("GET", url);
      return res.json() as Promise<SupportTicket[]>;
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      return await apiRequest("PATCH", `/api/admin/support-tickets/${data.id}`, data.updates);
    },
    onSuccess: () => {
      toast({
        title: "Ticket Updated",
        description: "Support ticket has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      setSelectedTicket(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update ticket",
        variant: "destructive",
      });
    },
  });

  const handleUpdateTicket = () => {
    if (!selectedTicket) return;

    const updates: any = {};
    if (newStatus) updates.status = newStatus;
    if (newPriority) updates.priority = newPriority;

    if (Object.keys(updates).length > 0) {
      updateTicketMutation.mutate({ id: selectedTicket.id, updates });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Mail className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "closed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Support Inbox</h1>
          <p className="text-muted-foreground">Manage and respond to support tickets</p>
        </div>

        <Card className="mb-6" data-testid="card-filters">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search" className="mb-2 block">Search</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets..."
                className="pr-10 bg-slate-800/50 border-slate-600"
                data-testid="input-search-tickets"
              />
            </div>
          </div>

          <div className="min-w-[150px]">
            <Label htmlFor="status" className="text-white mb-2 block">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-800/50 border-slate-600" data-testid="select-status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[150px]">
            <Label htmlFor="priority" className="text-white mb-2 block">Priority</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="bg-slate-800/50 border-slate-600" data-testid="select-priority-filter">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-tickets-list">
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
            <p className="text-sm text-muted-foreground">{tickets?.length || 0} tickets found</p>
          </CardHeader>
          <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Loading tickets...</div>
        ) : !tickets || tickets.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No tickets found</div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setNewStatus(ticket.status);
                  setNewPriority(ticket.priority);
                }}
                className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                data-testid={`ticket-${ticket.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-medium truncate">{ticket.subject}</h3>
                      <Badge className={statusColors[ticket.status]}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1">{ticket.status.replace("_", " ")}</span>
                      </Badge>
                      <Badge className={priorityColors[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-2">{ticket.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ticket.user.full_name} ({ticket.user.email})
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {ticket.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
          </CardContent>
        </Card>

        {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedTicket?.subject}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Ticket from {selectedTicket?.user.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User Info */}
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white ml-2">{selectedTicket?.user.email}</span>
                </div>
                <div>
                  <span className="text-slate-400">Plan:</span>
                  <span className="text-white ml-2">{selectedTicket?.user.plan}</span>
                </div>
                <div>
                  <span className="text-slate-400">Category:</span>
                  <span className="text-white ml-2">{selectedTicket?.category}</span>
                </div>
                <div>
                  <span className="text-slate-400">Created:</span>
                  <span className="text-white ml-2">
                    {selectedTicket && new Date(selectedTicket.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <Label className="text-white mb-2 block">Message</Label>
              <div className="p-3 bg-slate-800/50 rounded-lg text-slate-300 whitespace-pre-wrap">
                {selectedTicket?.message}
              </div>
            </div>

            {/* Update Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="update-status" className="text-white mb-2 block">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600" id="update-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="update-priority" className="text-white mb-2 block">Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600" id="update-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedTicket(null)}
              className="border-slate-600"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTicket}
              className="gradient-button"
              disabled={updateTicketMutation.isPending}
              data-testid="button-update-ticket"
            >
              {updateTicketMutation.isPending ? "Updating..." : "Update Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
