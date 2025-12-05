import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Play,
  Pause,
  XCircle,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Activity,
  Server,
  Database,
  Zap,
  RotateCw,
  PlayCircle,
  PauseCircle,
  ArrowDownToLine,
} from "lucide-react";

type TaskStatus = "active" | "paused" | "failed";
type TaskType = "cron" | "one-time" | "recurring";

interface ScheduledTask {
  id: string;
  name: string;
  type: TaskType;
  schedule: string;
  nextRun: string;
  lastRun: string;
  status: TaskStatus;
}

interface FailedTask {
  id: string;
  taskName: string;
  failedAt: string;
  errorMessage: string;
}

interface WorkerStatus {
  name: string;
  status: "online" | "degraded" | "offline";
  details: string;
}

const initialTasks: ScheduledTask[] = [
  {
    id: "1",
    name: "Daily SEO Refresh",
    type: "cron",
    schedule: "0 6 * * *",
    nextRun: "2025-12-06T06:00:00",
    lastRun: "2025-12-05T06:00:00",
    status: "active",
  },
  {
    id: "2",
    name: "Trial Expiration Check",
    type: "recurring",
    schedule: "Every hour",
    nextRun: "2025-12-05T15:00:00",
    lastRun: "2025-12-05T14:00:00",
    status: "active",
  },
  {
    id: "3",
    name: "Credit Reset",
    type: "cron",
    schedule: "0 0 1 * *",
    nextRun: "2026-01-01T00:00:00",
    lastRun: "2025-12-01T00:00:00",
    status: "active",
  },
  {
    id: "4",
    name: "Cart Recovery Emails",
    type: "recurring",
    schedule: "Every 15 minutes",
    nextRun: "2025-12-05T14:15:00",
    lastRun: "2025-12-05T14:00:00",
    status: "active",
  },
  {
    id: "5",
    name: "Analytics Aggregation",
    type: "cron",
    schedule: "0 0 * * *",
    nextRun: "2025-12-06T00:00:00",
    lastRun: "2025-12-05T00:00:00",
    status: "paused",
  },
  {
    id: "6",
    name: "Backup Database",
    type: "cron",
    schedule: "0 2 * * 0",
    nextRun: "2025-12-08T02:00:00",
    lastRun: "2025-12-01T02:00:00",
    status: "active",
  },
  {
    id: "7",
    name: "Cleanup Old Sessions",
    type: "cron",
    schedule: "0 3 * * *",
    nextRun: "2025-12-06T03:00:00",
    lastRun: "2025-12-05T03:00:00",
    status: "failed",
  },
];

const initialFailedTasks: FailedTask[] = [
  {
    id: "f1",
    taskName: "Cleanup Old Sessions",
    failedAt: "2025-12-05T03:00:15",
    errorMessage: "Connection timeout: Unable to reach session store after 30s",
  },
  {
    id: "f2",
    taskName: "Analytics Aggregation",
    failedAt: "2025-12-04T00:00:45",
    errorMessage: "Memory limit exceeded during data aggregation",
  },
  {
    id: "f3",
    taskName: "Daily SEO Refresh",
    failedAt: "2025-12-03T06:02:30",
    errorMessage: "API rate limit exceeded (429 Too Many Requests)",
  },
];

const workerStatuses: WorkerStatus[] = [
  { name: "Queue Worker", status: "online", details: "Processing 3 jobs" },
  { name: "Redis Connection", status: "online", details: "Latency: 2ms" },
  { name: "Task Queue", status: "online", details: "12 pending tasks" },
];

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadgeVariant(status: TaskStatus): "default" | "secondary" | "destructive" {
  switch (status) {
    case "active":
      return "default";
    case "paused":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
}

function getTypeBadgeVariant(type: TaskType): "default" | "secondary" | "outline" {
  switch (type) {
    case "cron":
      return "outline";
    case "recurring":
      return "secondary";
    case "one-time":
      return "default";
    default:
      return "outline";
  }
}

function StatusIcon({ status }: { status: "online" | "degraded" | "offline" }) {
  switch (status) {
    case "online":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "degraded":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "offline":
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
}

export default function SchedulerConsole() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<ScheduledTask[]>(initialTasks);
  const [failedTasks, setFailedTasks] = useState<FailedTask[]>(initialFailedTasks);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [isPausingAll, setIsPausingAll] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRunNow = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    toast({
      title: "Task Started",
      description: `"${task?.name}" is now running...`,
    });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, lastRun: new Date().toISOString(), status: "active" as TaskStatus }
          : t
      )
    );
  };

  const handlePause = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const newStatus = task?.status === "paused" ? "active" : "paused";
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as TaskStatus } : t))
    );
    toast({
      title: newStatus === "paused" ? "Task Paused" : "Task Resumed",
      description: `"${task?.name}" has been ${newStatus === "paused" ? "paused" : "resumed"}.`,
    });
  };

  const handleCancel = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast({
      title: "Task Cancelled",
      description: `"${task?.name}" has been removed from the schedule.`,
      variant: "destructive",
    });
  };

  const handleRetry = (failedTaskId: string) => {
    const failedTask = failedTasks.find((t) => t.id === failedTaskId);
    setFailedTasks((prev) => prev.filter((t) => t.id !== failedTaskId));
    toast({
      title: "Retrying Task",
      description: `"${failedTask?.taskName}" is being retried...`,
    });
  };

  const handleRunAllPending = () => {
    setIsRunningAll(true);
    setTimeout(() => {
      setIsRunningAll(false);
      toast({
        title: "All Pending Tasks Started",
        description: "All pending scheduled tasks are now running.",
      });
    }, 1500);
  };

  const handlePauseAll = () => {
    setIsPausingAll(true);
    setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => ({ ...t, status: "paused" as TaskStatus }))
      );
      setIsPausingAll(false);
      toast({
        title: "All Tasks Paused",
        description: "All scheduled tasks have been paused.",
      });
    }, 1000);
  };

  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Sync Complete",
        description: "Scheduler state has been synchronized with the database.",
      });
    }, 2000);
  };

  const activeCount = tasks.filter((t) => t.status === "active").length;
  const pausedCount = tasks.filter((t) => t.status === "paused").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" data-testid="heading-scheduler-console">
            Scheduler Console
          </h1>
          <p className="text-muted-foreground">
            Manage scheduled tasks, cron jobs, and background workers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="stat-total-tasks">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tasks
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold" data-testid="stat-total-tasks-value">
                {tasks.length}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Scheduled jobs</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-tasks">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-green-500" data-testid="stat-active-tasks-value">
                {activeCount}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Running on schedule</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-paused-tasks">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paused
              </CardTitle>
              <Pause className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-yellow-500" data-testid="stat-paused-tasks-value">
                {pausedCount}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Temporarily stopped</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-failed-tasks">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-red-500" data-testid="stat-failed-tasks-value">
                {failedCount}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="section-quick-actions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Manage all scheduled tasks at once</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleRunAllPending}
                disabled={isRunningAll}
                data-testid="button-run-all-pending"
              >
                {isRunningAll ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Run All Pending
              </Button>
              <Button
                variant="secondary"
                onClick={handlePauseAll}
                disabled={isPausingAll}
                data-testid="button-pause-all"
              >
                {isPausingAll ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PauseCircle className="h-4 w-4 mr-2" />
                )}
                Pause All
              </Button>
              <Button
                variant="outline"
                onClick={handleForceSync}
                disabled={isSyncing}
                data-testid="button-force-sync"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                )}
                Force Sync
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="section-scheduled-tasks">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Scheduled Tasks
            </CardTitle>
            <CardDescription>All scheduled cron jobs and recurring tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id} data-testid={`row-task-${task.id}`}>
                      <TableCell className="font-medium" data-testid={`text-task-name-${task.id}`}>
                        {task.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(task.type)} data-testid={`badge-task-type-${task.id}`}>
                          {task.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded" data-testid={`text-task-schedule-${task.id}`}>
                          {task.schedule}
                        </code>
                      </TableCell>
                      <TableCell data-testid={`text-task-next-run-${task.id}`}>
                        {formatDateTime(task.nextRun)}
                      </TableCell>
                      <TableCell data-testid={`text-task-last-run-${task.id}`}>
                        {formatDateTime(task.lastRun)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(task.status)} data-testid={`badge-task-status-${task.id}`}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRunNow(task.id)}
                            title="Run Now"
                            data-testid={`button-run-now-${task.id}`}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePause(task.id)}
                            title={task.status === "paused" ? "Resume" : "Pause"}
                            data-testid={`button-pause-${task.id}`}
                          >
                            {task.status === "paused" ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancel(task.id)}
                            title="Cancel"
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-cancel-${task.id}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No scheduled tasks found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-failed-tasks">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Failed Tasks
              </CardTitle>
              <CardDescription>Recently failed tasks that require attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {failedTasks.length > 0 ? (
                failedTasks.map((failedTask) => (
                  <div
                    key={failedTask.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30 border border-destructive/20"
                    data-testid={`failed-task-${failedTask.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium" data-testid={`text-failed-task-name-${failedTask.id}`}>
                        {failedTask.taskName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Failed: {formatDateTime(failedTask.failedAt)}
                      </p>
                      <p className="text-sm text-destructive mt-1 break-words" data-testid={`text-failed-task-error-${failedTask.id}`}>
                        {failedTask.errorMessage}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetry(failedTask.id)}
                      data-testid={`button-retry-${failedTask.id}`}
                    >
                      <RotateCw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                  <p className="text-muted-foreground">No failed tasks</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="section-worker-health">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Worker Health Status
              </CardTitle>
              <CardDescription>Status of background workers and connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {workerStatuses.map((worker, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  data-testid={`worker-status-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-md ${
                        worker.status === "online"
                          ? "bg-green-500/10"
                          : worker.status === "degraded"
                          ? "bg-yellow-500/10"
                          : "bg-red-500/10"
                      }`}
                    >
                      {worker.name === "Queue Worker" && (
                        <Server
                          className={`h-4 w-4 ${
                            worker.status === "online"
                              ? "text-green-500"
                              : worker.status === "degraded"
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        />
                      )}
                      {worker.name === "Redis Connection" && (
                        <Database
                          className={`h-4 w-4 ${
                            worker.status === "online"
                              ? "text-green-500"
                              : worker.status === "degraded"
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        />
                      )}
                      {worker.name === "Task Queue" && (
                        <Activity
                          className={`h-4 w-4 ${
                            worker.status === "online"
                              ? "text-green-500"
                              : worker.status === "degraded"
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium" data-testid={`text-worker-name-${index}`}>
                        {worker.name}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-worker-details-${index}`}>
                        {worker.details}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={worker.status} />
                    <span
                      className={`text-sm capitalize ${
                        worker.status === "online"
                          ? "text-green-500"
                          : worker.status === "degraded"
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                      data-testid={`text-worker-status-${index}`}
                    >
                      {worker.status}
                    </span>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                Worker status is simulated for demonstration purposes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
