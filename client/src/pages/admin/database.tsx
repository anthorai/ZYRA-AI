import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  HardDrive,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  RefreshCw,
  Shield,
  Activity,
  Clock,
  TableIcon,
  Play,
  Trash2,
  Eye,
  AlertTriangle,
  Server,
  Zap,
  Gauge,
  FileJson,
  RotateCcw,
  Archive,
  Settings,
} from "lucide-react";

interface BackupEntry {
  id: string;
  date: string;
  size: string;
  status: "completed" | "failed" | "in_progress";
  type: "full" | "incremental";
}

interface TableSchema {
  name: string;
  rowCount: number;
  sizeEstimate: string;
  lastUpdated: string;
}

interface QueryResult {
  columns: string[];
  rows: Record<string, string | number | boolean | null>[];
  executionTime: number;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  testId,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger";
  testId: string;
}) {
  const variantStyles = {
    default: "text-muted-foreground",
    success: "text-green-500",
    warning: "text-yellow-500",
    danger: "text-red-500",
  };

  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${variantStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        <span className="text-2xl font-bold" data-testid={`${testId}-value`}>
          {value}
        </span>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DatabaseControls() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [rlsEnabled, setRlsEnabled] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [isQueryExecuting, setIsQueryExecuting] = useState(false);

  const [isCreateBackupDialogOpen, setIsCreateBackupDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isVacuumDialogOpen, setIsVacuumDialogOpen] = useState(false);
  const [isClearSessionsDialogOpen, setIsClearSessionsDialogOpen] = useState(false);
  const [isPurgeLogsDialogOpen, setIsPurgeLogsDialogOpen] = useState(false);
  const [isViewSchemaDialogOpen, setIsViewSchemaDialogOpen] = useState(false);
  const [isViewPoliciesDialogOpen, setIsViewPoliciesDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableSchema | null>(null);

  const mockBackups: BackupEntry[] = [
    {
      id: "backup-1",
      date: new Date(Date.now() - 3600000).toISOString(),
      size: "45.2 MB",
      status: "completed",
      type: "full",
    },
    {
      id: "backup-2",
      date: new Date(Date.now() - 86400000).toISOString(),
      size: "44.8 MB",
      status: "completed",
      type: "full",
    },
    {
      id: "backup-3",
      date: new Date(Date.now() - 172800000).toISOString(),
      size: "12.3 MB",
      status: "completed",
      type: "incremental",
    },
    {
      id: "backup-4",
      date: new Date(Date.now() - 259200000).toISOString(),
      size: "43.1 MB",
      status: "failed",
      type: "full",
    },
  ];

  const mockTables: TableSchema[] = [
    { name: "users", rowCount: 2847, sizeEstimate: "8.2 MB", lastUpdated: "2 min ago" },
    { name: "products", rowCount: 15632, sizeEstimate: "24.5 MB", lastUpdated: "5 min ago" },
    { name: "orders", rowCount: 8421, sizeEstimate: "12.1 MB", lastUpdated: "1 min ago" },
    { name: "sessions", rowCount: 542, sizeEstimate: "1.8 MB", lastUpdated: "Just now" },
    { name: "subscriptions", rowCount: 1256, sizeEstimate: "2.4 MB", lastUpdated: "10 min ago" },
    { name: "campaigns", rowCount: 328, sizeEstimate: "0.9 MB", lastUpdated: "30 min ago" },
    { name: "error_logs", rowCount: 12847, sizeEstimate: "18.6 MB", lastUpdated: "Just now" },
    { name: "audit_logs", rowCount: 45621, sizeEstimate: "32.4 MB", lastUpdated: "1 min ago" },
  ];

  const mockRlsPolicies = [
    { table: "users", policy: "Users can only view their own data", type: "SELECT" },
    { table: "products", policy: "Store owners can manage their products", type: "ALL" },
    { table: "orders", policy: "Users can view their own orders", type: "SELECT" },
    { table: "subscriptions", policy: "Users can view their own subscription", type: "SELECT" },
  ];

  const totalRowCount = mockTables.reduce((acc, t) => acc + t.rowCount, 0);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const handleCreateBackup = () => {
    toast({
      title: "Backup Started",
      description: "A full database backup has been initiated. This may take a few minutes.",
    });
    setIsCreateBackupDialogOpen(false);
  };

  const handleDownloadBackup = () => {
    toast({
      title: "Download Started",
      description: "Your backup file is being prepared for download.",
    });
  };

  const handleRestoreBackup = () => {
    if (!selectedBackup) {
      toast({
        title: "No Backup Selected",
        description: "Please select a backup to restore from.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Restore Initiated",
      description: "Database restore has been initiated. The system will be temporarily unavailable.",
    });
    setIsRestoreDialogOpen(false);
    setSelectedBackup("");
  };

  const handleRunVacuum = () => {
    toast({
      title: "VACUUM Started",
      description: "Database vacuum operation has been initiated. Performance may be affected temporarily.",
    });
    setIsVacuumDialogOpen(false);
  };

  const handleClearSessions = () => {
    toast({
      title: "Sessions Cleared",
      description: "Old and expired sessions have been removed from the database.",
    });
    setIsClearSessionsDialogOpen(false);
  };

  const handlePurgeLogs = () => {
    toast({
      title: "Logs Purged",
      description: "Old log entries have been removed from the database.",
    });
    setIsPurgeLogsDialogOpen(false);
  };

  const handleToggleRls = (checked: boolean) => {
    setRlsEnabled(checked);
    toast({
      title: checked ? "RLS Enabled" : "RLS Disabled",
      description: checked
        ? "Row-Level Security has been enabled for all tables."
        : "Row-Level Security has been disabled. All users can now access all data.",
      variant: checked ? "default" : "destructive",
    });
  };

  const handleViewSchema = (table: TableSchema) => {
    setSelectedTable(table);
    setIsViewSchemaDialogOpen(true);
  };

  const handleExecuteQuery = () => {
    if (!queryInput.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a SQL query to execute.",
        variant: "destructive",
      });
      return;
    }

    if (!queryInput.trim().toLowerCase().startsWith("select")) {
      toast({
        title: "Read-Only Mode",
        description: "Only SELECT queries are allowed in this interface.",
        variant: "destructive",
      });
      return;
    }

    setIsQueryExecuting(true);
    setTimeout(() => {
      setQueryResults({
        columns: ["id", "email", "created_at", "status"],
        rows: [
          { id: 1, email: "john@example.com", created_at: "2024-01-15", status: "active" },
          { id: 2, email: "sarah@example.com", created_at: "2024-01-16", status: "active" },
          { id: 3, email: "mike@example.com", created_at: "2024-01-17", status: "inactive" },
        ],
        executionTime: 42,
      });
      setIsQueryExecuting(false);
      toast({
        title: "Query Executed",
        description: "Query completed successfully in 42ms.",
      });
    }, 800);
  };

  const getStatusBadge = (status: BackupEntry["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "in_progress":
        return <Badge variant="outline">In Progress</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" data-testid="heading-database-controls">
            Database Controls
          </h1>
          <p className="text-muted-foreground">
            Manage database operations, backups, and maintenance tasks
          </p>
          <Badge variant="outline" className="w-fit">
            UI Mock - No real database changes
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Connection Status"
            value={isConnected ? "Connected" : "Disconnected"}
            icon={isConnected ? CheckCircle : XCircle}
            variant={isConnected ? "success" : "danger"}
            testId="stat-connection-status"
          />
          <StatCard
            title="Database Size"
            value="156.8 MB"
            description="Total storage used"
            icon={HardDrive}
            testId="stat-database-size"
          />
          <StatCard
            title="Table Count"
            value={mockTables.length}
            description="Active tables"
            icon={TableIcon}
            testId="stat-table-count"
          />
          <StatCard
            title="Total Rows"
            value={totalRowCount.toLocaleString()}
            description="Approximate count"
            icon={Database}
            testId="stat-row-count"
          />
          <StatCard
            title="Last Backup"
            value="1h ago"
            description={formatDate(mockBackups[0].date)}
            icon={Archive}
            variant="success"
            testId="stat-last-backup"
          />
          <StatCard
            title="Uptime"
            value="99.97%"
            description="Last 30 days"
            icon={Clock}
            variant="success"
            testId="stat-uptime"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-backup-restore">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Backup & Restore
              </CardTitle>
              <CardDescription>Create backups and restore from previous snapshots</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setIsCreateBackupDialogOpen(true)}
                  data-testid="button-create-backup"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadBackup}
                  data-testid="button-download-backup"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Last Backup
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Backup History</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockBackups.map((backup) => (
                      <TableRow key={backup.id} data-testid={`row-backup-${backup.id}`}>
                        <TableCell className="text-sm">
                          {formatDate(backup.date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {backup.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {backup.size}
                        </TableCell>
                        <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 pt-4 border-t">
                <div className="flex-1 space-y-2 w-full sm:w-auto">
                  <Label htmlFor="restore-backup">Restore from Backup</Label>
                  <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                    <SelectTrigger data-testid="select-restore-backup">
                      <SelectValue placeholder="Select a backup..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mockBackups
                        .filter((b) => b.status === "completed")
                        .map((backup) => (
                          <SelectItem key={backup.id} value={backup.id}>
                            {formatDate(backup.date)} ({backup.size})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setIsRestoreDialogOpen(true)}
                  disabled={!selectedBackup}
                  data-testid="button-restore-backup"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-schema-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableIcon className="h-5 w-5" />
                Schema Overview
              </CardTitle>
              <CardDescription>Tables and their row counts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table Name</TableHead>
                      <TableHead className="text-right">Rows</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTables.map((table) => (
                      <TableRow key={table.name} data-testid={`row-table-${table.name}`}>
                        <TableCell className="font-mono text-sm">
                          {table.name}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {table.rowCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {table.sizeEstimate}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewSchema(table)}
                            data-testid={`button-view-schema-${table.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="section-rls">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Row-Level Security (RLS)
              </CardTitle>
              <CardDescription>Control data access at the row level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${rlsEnabled ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    <Shield className={`h-5 w-5 ${rlsEnabled ? "text-green-500" : "text-red-500"}`} />
                  </div>
                  <div>
                    <p className="font-medium">RLS Status</p>
                    <p className="text-sm text-muted-foreground">
                      {rlsEnabled ? "Active on all tables" : "Disabled - unrestricted access"}
                    </p>
                  </div>
                </div>
                <Badge variant={rlsEnabled ? "secondary" : "destructive"} className={rlsEnabled ? "bg-green-500/10 text-green-600" : ""}>
                  {rlsEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="rls-toggle">Enable Row-Level Security</Label>
                  <p className="text-xs text-muted-foreground">
                    Restrict data access based on user policies
                  </p>
                </div>
                <Switch
                  id="rls-toggle"
                  checked={rlsEnabled}
                  onCheckedChange={handleToggleRls}
                  data-testid="switch-rls-toggle"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => setIsViewPoliciesDialogOpen(true)}
                className="w-full"
                data-testid="button-view-policies"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Policies
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="section-database-health">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Database Health
              </CardTitle>
              <CardDescription>Performance metrics and health indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Query Performance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Excellent</span>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">98.5%</Badge>
                  </div>
                </div>
                <Progress value={98.5} className="h-2" data-testid="progress-query-performance" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30" data-testid="metric-slow-queries">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Slow Queries</span>
                  </div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30" data-testid="metric-connection-pool">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Connection Pool</span>
                  </div>
                  <p className="text-2xl font-bold">12/50</p>
                  <p className="text-xs text-muted-foreground">Active connections</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30" data-testid="metric-dead-tuples">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Dead Tuples</span>
                  </div>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-muted-foreground">Needs cleanup</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30" data-testid="metric-cache-hit">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
                  </div>
                  <p className="text-2xl font-bold">99.2%</p>
                  <p className="text-xs text-muted-foreground">Memory efficiency</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="section-maintenance-actions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Maintenance Actions
            </CardTitle>
            <CardDescription>Database maintenance and cleanup operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Run VACUUM</p>
                    <p className="text-xs text-muted-foreground">
                      Reclaim storage and optimize performance
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsVacuumDialogOpen(true)}
                  data-testid="button-run-vacuum"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run VACUUM
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Clear Old Sessions</p>
                    <p className="text-xs text-muted-foreground">
                      Remove expired session data
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsClearSessionsDialogOpen(true)}
                  data-testid="button-clear-sessions"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Clear Sessions
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Purge Old Logs</p>
                    <p className="text-xs text-muted-foreground">
                      Delete logs older than 30 days
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsPurgeLogsDialogOpen(true)}
                  data-testid="button-purge-logs"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Purge Logs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="section-quick-query">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Quick Query
              <Badge variant="outline">Advanced</Badge>
            </CardTitle>
            <CardDescription>Execute read-only SQL queries (SELECT only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sql-query">SQL Query</Label>
              <Textarea
                id="sql-query"
                placeholder="SELECT * FROM users LIMIT 10;"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="font-mono text-sm min-h-[100px]"
                data-testid="input-sql-query"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleExecuteQuery}
                disabled={isQueryExecuting}
                data-testid="button-execute-query"
              >
                {isQueryExecuting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute Query
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setQueryInput("");
                  setQueryResults(null);
                }}
                data-testid="button-clear-query"
              >
                Clear
              </Button>
            </div>

            {queryResults && (
              <div className="space-y-2" data-testid="query-results">
                <div className="flex items-center justify-between">
                  <Label>Results</Label>
                  <Badge variant="outline">{queryResults.executionTime}ms</Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {queryResults.columns.map((col) => (
                          <TableHead key={col}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queryResults.rows.map((row, index) => (
                        <TableRow key={index} data-testid={`row-result-${index}`}>
                          {queryResults.columns.map((col) => (
                            <TableCell key={col} className="text-sm">
                              {String(row[col] ?? "NULL")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Returned {queryResults.rows.length} rows
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={isCreateBackupDialogOpen} onOpenChange={setIsCreateBackupDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Create Database Backup
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>You are about to create a full database backup.</p>
                <p className="text-yellow-600 dark:text-yellow-400">
                  This operation may temporarily affect database performance while the backup is in progress.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-backup">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateBackup} data-testid="button-confirm-backup">
                Create Backup
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Restore Database from Backup
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p className="font-medium text-destructive">
                  WARNING: This is a destructive operation!
                </p>
                <p>Restoring from a backup will:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Overwrite all current database data</li>
                  <li>Log out all active users</li>
                  <li>Temporarily make the system unavailable</li>
                  <li>Cannot be undone without another restore</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-restore">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRestoreBackup}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="button-confirm-restore"
              >
                Restore Database
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isVacuumDialogOpen} onOpenChange={setIsVacuumDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Run VACUUM Operation
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Running VACUUM will reclaim storage space and optimize query performance.</p>
                <p className="text-yellow-600 dark:text-yellow-400">
                  This operation may temporarily impact database performance. It is recommended to run during low-traffic periods.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-vacuum">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRunVacuum} data-testid="button-confirm-vacuum">
                Run VACUUM
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isClearSessionsDialogOpen} onOpenChange={setIsClearSessionsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Clear Old Sessions
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>This will remove all expired and inactive session data from the database.</p>
                <p className="text-yellow-600 dark:text-yellow-400">
                  Active user sessions will not be affected, but any remember-me tokens older than 30 days will be invalidated.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-clear-sessions">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearSessions} data-testid="button-confirm-clear-sessions">
                Clear Sessions
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isPurgeLogsDialogOpen} onOpenChange={setIsPurgeLogsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Purge Old Logs
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>This will permanently delete all log entries older than 30 days.</p>
                <p className="text-yellow-600 dark:text-yellow-400">
                  Estimated records to be deleted: ~{Math.floor(45621 * 0.7).toLocaleString()} entries. This action cannot be undone.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-purge-logs">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePurgeLogs} data-testid="button-confirm-purge-logs">
                Purge Logs
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isViewSchemaDialogOpen} onOpenChange={setIsViewSchemaDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TableIcon className="h-5 w-5" />
                Schema: {selectedTable?.name}
              </DialogTitle>
              <DialogDescription>
                Table structure and column definitions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Row Count:</span>
                  <p className="font-medium">{selectedTable?.rowCount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <p className="font-medium">{selectedTable?.sizeEstimate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <p className="font-medium">{selectedTable?.lastUpdated}</p>
                </div>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Nullable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-sm">id</TableCell>
                      <TableCell>uuid</TableCell>
                      <TableCell><Badge variant="outline">No</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">created_at</TableCell>
                      <TableCell>timestamp</TableCell>
                      <TableCell><Badge variant="outline">No</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">updated_at</TableCell>
                      <TableCell>timestamp</TableCell>
                      <TableCell><Badge variant="secondary">Yes</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">data</TableCell>
                      <TableCell>jsonb</TableCell>
                      <TableCell><Badge variant="secondary">Yes</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewSchemaDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewPoliciesDialogOpen} onOpenChange={setIsViewPoliciesDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                RLS Policies
              </DialogTitle>
              <DialogDescription>
                Row-Level Security policies configured for database tables
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRlsPolicies.map((policy, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{policy.table}</TableCell>
                      <TableCell className="text-sm">{policy.policy}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{policy.type}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewPoliciesDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
