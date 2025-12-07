import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
  FolderOpen,
  Image,
  FileText,
  File,
  Search,
  RefreshCw,
  Trash2,
  Download,
  Eye,
  HardDrive,
  AlertTriangle,
  Settings,
  Globe,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Filter,
  MoreHorizontal,
} from "lucide-react";

interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  userEmail: string;
  uploadedAt: string;
  path: string;
  isCorrupted?: boolean;
}

interface StorageStats {
  totalUsed: number;
  totalLimit: number;
  byType: {
    images: number;
    documents: number;
    other: number;
  };
  fileCount: number;
}

interface CDNSettings {
  enabled: boolean;
  url: string;
  status: "active" | "inactive" | "error";
  lastPurge?: string;
}

interface UploadSettings {
  maxFileSize: number;
  allowedTypes: string[];
  userQuota: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) return FileText;
  return File;
}

function getFileTypeBadge(mimeType: string) {
  if (mimeType.startsWith("image/")) return { label: "Image", variant: "default" as const };
  if (mimeType.includes("pdf")) return { label: "PDF", variant: "secondary" as const };
  if (mimeType.includes("document") || mimeType.includes("word")) return { label: "Doc", variant: "secondary" as const };
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return { label: "Sheet", variant: "outline" as const };
  return { label: "Other", variant: "outline" as const };
}

const mockFiles: FileRecord[] = [
  {
    id: "1",
    filename: "product-hero.jpg",
    originalName: "product-hero.jpg",
    mimeType: "image/jpeg",
    size: 2457600,
    uploadedBy: "user-1",
    userEmail: "john@example.com",
    uploadedAt: "2024-12-01T10:30:00Z",
    path: "/uploads/product-hero.jpg",
  },
  {
    id: "2",
    filename: "invoice-2024.pdf",
    originalName: "invoice-2024.pdf",
    mimeType: "application/pdf",
    size: 156000,
    uploadedBy: "user-2",
    userEmail: "jane@example.com",
    uploadedAt: "2024-12-02T14:20:00Z",
    path: "/uploads/invoice-2024.pdf",
  },
  {
    id: "3",
    filename: "logo.png",
    originalName: "logo.png",
    mimeType: "image/png",
    size: 45000,
    uploadedBy: "user-1",
    userEmail: "john@example.com",
    uploadedAt: "2024-12-03T09:15:00Z",
    path: "/uploads/logo.png",
  },
  {
    id: "4",
    filename: "catalog.xlsx",
    originalName: "catalog.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 890000,
    uploadedBy: "user-3",
    userEmail: "admin@example.com",
    uploadedAt: "2024-12-04T16:45:00Z",
    path: "/uploads/catalog.xlsx",
  },
  {
    id: "5",
    filename: "banner-sale.webp",
    originalName: "banner-sale.webp",
    mimeType: "image/webp",
    size: 1234567,
    uploadedBy: "user-2",
    userEmail: "jane@example.com",
    uploadedAt: "2024-12-05T11:00:00Z",
    path: "/uploads/banner-sale.webp",
    isCorrupted: true,
  },
];

const mockStorageStats: StorageStats = {
  totalUsed: 4783167,
  totalLimit: 10737418240,
  byType: {
    images: 3737167,
    documents: 1046000,
    other: 0,
  },
  fileCount: 5,
};

const mockCDNSettings: CDNSettings = {
  enabled: true,
  url: "https://cdn.zyra-ai.com",
  status: "active",
  lastPurge: "2024-12-04T12:00:00Z",
};

const mockUploadSettings: UploadSettings = {
  maxFileSize: 10485760,
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/csv"],
  userQuota: 1073741824,
};

const allFileTypes = [
  { value: "image/jpeg", label: "JPEG Images" },
  { value: "image/png", label: "PNG Images" },
  { value: "image/webp", label: "WebP Images" },
  { value: "image/gif", label: "GIF Images" },
  { value: "application/pdf", label: "PDF Documents" },
  { value: "text/csv", label: "CSV Files" },
  { value: "application/msword", label: "Word Documents" },
  { value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "Excel Sheets" },
];

export default function FileManager() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [cleanupDays, setCleanupDays] = useState("30");
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isCDNDialogOpen, setIsCDNDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [files, setFiles] = useState<FileRecord[]>(mockFiles);
  const [storageStats, setStorageStats] = useState<StorageStats>(mockStorageStats);
  const [cdnSettings, setCdnSettings] = useState<CDNSettings>(mockCDNSettings);
  const [uploadSettings, setUploadSettings] = useState<UploadSettings>(mockUploadSettings);
  const [isLoading, setIsLoading] = useState(false);

  const uniqueUsers = Array.from(new Set(files.map((f) => f.userEmail)));

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = fileTypeFilter === "all" ||
      (fileTypeFilter === "images" && file.mimeType.startsWith("image/")) ||
      (fileTypeFilter === "documents" && (file.mimeType.includes("pdf") || file.mimeType.includes("document") || file.mimeType.includes("text") || file.mimeType.includes("sheet"))) ||
      (fileTypeFilter === "other" && !file.mimeType.startsWith("image/") && !file.mimeType.includes("pdf") && !file.mimeType.includes("document"));
    
    const matchesUser = userFilter === "all" || file.userEmail === userFilter;
    
    return matchesSearch && matchesType && matchesUser;
  });

  const handleSelectFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const handleDeleteFile = (file: FileRecord) => {
    setFileToDelete(file);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteFile = () => {
    if (fileToDelete) {
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      toast({
        title: "File Deleted",
        description: `${fileToDelete.originalName} has been permanently deleted.`,
      });
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setFiles((prev) => prev.filter((f) => !selectedFiles.has(f.id)));
    toast({
      title: "Files Deleted",
      description: `${selectedFiles.size} files have been permanently deleted.`,
    });
    setSelectedFiles(new Set());
    setIsBulkDeleteOpen(false);
  };

  const handleCleanupOldFiles = () => {
    const daysAgo = parseInt(cleanupDays);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    const oldFiles = files.filter((f) => new Date(f.uploadedAt) < cutoffDate);
    setFiles((prev) => prev.filter((f) => new Date(f.uploadedAt) >= cutoffDate));
    
    toast({
      title: "Cleanup Complete",
      description: `${oldFiles.length} files older than ${daysAgo} days have been removed.`,
    });
    setIsCleanupDialogOpen(false);
  };

  const handleFindCorruptedFiles = () => {
    const corrupted = files.filter((f) => f.isCorrupted);
    if (corrupted.length > 0) {
      toast({
        title: "Corrupted Files Found",
        description: `Found ${corrupted.length} corrupted file(s). They are highlighted in the table.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "No Issues Found",
        description: "All files passed integrity check.",
      });
    }
  };

  const handleCachePurge = () => {
    setCdnSettings((prev) => ({
      ...prev,
      lastPurge: new Date().toISOString(),
    }));
    toast({
      title: "Cache Purged",
      description: "CDN cache has been successfully purged.",
    });
  };

  const handleViewFile = (file: FileRecord) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const handleDownloadFile = (file: FileRecord) => {
    toast({
      title: "Download Started",
      description: `Downloading ${file.originalName}...`,
    });
  };

  const storageUsagePercent = (storageStats.totalUsed / storageStats.totalLimit) * 100;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" data-testid="heading-file-manager">
            File Manager
          </h1>
          <p className="text-muted-foreground">
            Manage user uploads, media files, and storage settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2" data-testid="card-storage-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Overview
              </CardTitle>
              <CardDescription>Current storage usage and allocation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Total Storage Used</span>
                  <span className="text-sm text-muted-foreground" data-testid="text-storage-used">
                    {formatBytes(storageStats.totalUsed)} / {formatBytes(storageStats.totalLimit)}
                  </span>
                </div>
                <Progress 
                  value={storageUsagePercent} 
                  className="h-3" 
                  data-testid="progress-storage" 
                />
                <p className="text-xs text-muted-foreground">
                  {storageUsagePercent.toFixed(2)}% of storage limit used
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30">
                  <Image className="h-8 w-8 text-blue-500 mb-2" />
                  <span className="text-lg font-bold" data-testid="stat-images-size">
                    {formatBytes(storageStats.byType.images)}
                  </span>
                  <span className="text-xs text-muted-foreground">Images</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30">
                  <FileText className="h-8 w-8 text-green-500 mb-2" />
                  <span className="text-lg font-bold" data-testid="stat-documents-size">
                    {formatBytes(storageStats.byType.documents)}
                  </span>
                  <span className="text-xs text-muted-foreground">Documents</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30">
                  <File className="h-8 w-8 text-gray-500 mb-2" />
                  <span className="text-lg font-bold" data-testid="stat-other-size">
                    {formatBytes(storageStats.byType.other)}
                  </span>
                  <span className="text-xs text-muted-foreground">Other</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Total Files</span>
                </div>
                <span className="font-bold" data-testid="stat-total-files">{storageStats.fileCount}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card data-testid="card-cdn-settings">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4" />
                  CDN Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge 
                    variant={cdnSettings.status === "active" ? "default" : "destructive"}
                    data-testid="badge-cdn-status"
                  >
                    {cdnSettings.status === "active" ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                    )}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">CDN URL</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded" data-testid="text-cdn-url">
                    {cdnSettings.url}
                  </code>
                </div>
                {cdnSettings.lastPurge && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Last Purge</span>
                    <span className="text-xs">{formatDate(cdnSettings.lastPurge)}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleCachePurge}
                    data-testid="button-purge-cache"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Purge Cache
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setIsCDNDialogOpen(true)}
                    data-testid="button-cdn-settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-upload-limits">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="h-4 w-4" />
                  Upload Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Max File Size</span>
                  <span className="text-sm font-medium" data-testid="text-max-file-size">
                    {formatBytes(uploadSettings.maxFileSize)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User Quota</span>
                  <span className="text-sm font-medium" data-testid="text-user-quota">
                    {formatBytes(uploadSettings.userQuota)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Allowed Types</span>
                  <div className="flex flex-wrap gap-1">
                    {uploadSettings.allowedTypes.slice(0, 4).map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type.split("/")[1]}
                      </Badge>
                    ))}
                    {uploadSettings.allowedTypes.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{uploadSettings.allowedTypes.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsSettingsDialogOpen(true)}
                  data-testid="button-edit-limits"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Edit Limits
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card data-testid="card-files-table">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Files</CardTitle>
                <CardDescription>Manage uploaded files and media</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 pr-9 bg-background"
                    data-testid="input-search-files"
                  />
                </div>
                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <SelectTrigger className="w-36" data-testid="select-file-type">
                    <Filter className="h-4 w-4 mr-1" />
                    <SelectValue placeholder="File type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="images">Images</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-44" data-testid="select-user-filter">
                    <SelectValue placeholder="Filter by user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUsers.map((email) => (
                      <SelectItem key={email} value={email}>
                        {email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    setSearchQuery("");
                    setFileTypeFilter("all");
                    setUserFilter("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">Bulk Actions:</span>
              <Button 
                size="sm" 
                variant="destructive"
                disabled={selectedFiles.size === 0}
                onClick={() => setIsBulkDeleteOpen(true)}
                data-testid="button-bulk-delete"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Selected ({selectedFiles.size})
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsCleanupDialogOpen(true)}
                data-testid="button-cleanup-old"
              >
                <Clock className="h-3 w-3 mr-1" />
                Cleanup Old Files
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleFindCorruptedFiles}
                data-testid="button-find-corrupted"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Find Corrupted
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredFiles.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                          onCheckedChange={handleSelectAll}
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => {
                      const FileIcon = getFileIcon(file.mimeType);
                      const typeBadge = getFileTypeBadge(file.mimeType);
                      
                      return (
                        <TableRow 
                          key={file.id} 
                          className={file.isCorrupted ? "bg-destructive/10" : ""}
                          data-testid={`row-file-${file.id}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedFiles.has(file.id)}
                              onCheckedChange={() => handleSelectFile(file.id)}
                              data-testid={`checkbox-file-${file.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate" data-testid={`text-filename-${file.id}`}>
                                  {file.originalName}
                                </span>
                                {file.isCorrupted && (
                                  <Badge variant="destructive" className="w-fit text-xs mt-1">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Corrupted
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={typeBadge.variant} data-testid={`badge-type-${file.id}`}>
                              {typeBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-size-${file.id}`}>
                            {formatBytes(file.size)}
                          </TableCell>
                          <TableCell data-testid={`text-uploader-${file.id}`}>
                            {file.userEmail}
                          </TableCell>
                          <TableCell data-testid={`text-date-${file.id}`}>
                            {formatDate(file.uploadedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleViewFile(file)}
                                data-testid={`button-view-${file.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDownloadFile(file)}
                                data-testid={`button-download-${file.id}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => handleDeleteFile(file)}
                                data-testid={`button-delete-${file.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || fileTypeFilter !== "all" || userFilter !== "all"
                    ? "No files found matching your filters"
                    : "No files uploaded yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{fileToDelete?.originalName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteFile} data-testid="button-confirm-delete">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Selected Files</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedFiles.size} selected file(s)? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-bulk-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} data-testid="button-confirm-bulk-delete">
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isCleanupDialogOpen} onOpenChange={setIsCleanupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cleanup Old Files</DialogTitle>
              <DialogDescription>
                Remove files older than a specified number of days. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Delete files older than:</label>
                <Select value={cleanupDays} onValueChange={setCleanupDays}>
                  <SelectTrigger data-testid="select-cleanup-days">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCleanupDialogOpen(false)} data-testid="button-cancel-cleanup">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleCleanupOldFiles} data-testid="button-confirm-cleanup">
                <Trash2 className="h-4 w-4 mr-1" />
                Cleanup Files
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Limits Settings</DialogTitle>
              <DialogDescription>
                Configure upload restrictions and user quotas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Maximum File Size</label>
                <Select 
                  value={uploadSettings.maxFileSize.toString()} 
                  onValueChange={(v) => setUploadSettings((prev) => ({ ...prev, maxFileSize: parseInt(v) }))}
                >
                  <SelectTrigger data-testid="select-max-file-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5242880">5 MB</SelectItem>
                    <SelectItem value="10485760">10 MB</SelectItem>
                    <SelectItem value="26214400">25 MB</SelectItem>
                    <SelectItem value="52428800">50 MB</SelectItem>
                    <SelectItem value="104857600">100 MB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">User Storage Quota</label>
                <Select 
                  value={uploadSettings.userQuota.toString()} 
                  onValueChange={(v) => setUploadSettings((prev) => ({ ...prev, userQuota: parseInt(v) }))}
                >
                  <SelectTrigger data-testid="select-user-quota">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="104857600">100 MB</SelectItem>
                    <SelectItem value="524288000">500 MB</SelectItem>
                    <SelectItem value="1073741824">1 GB</SelectItem>
                    <SelectItem value="5368709120">5 GB</SelectItem>
                    <SelectItem value="10737418240">10 GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Allowed File Types</label>
                <div className="grid grid-cols-2 gap-2">
                  {allFileTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.value}
                        checked={uploadSettings.allowedTypes.includes(type.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setUploadSettings((prev) => ({
                              ...prev,
                              allowedTypes: [...prev.allowedTypes, type.value],
                            }));
                          } else {
                            setUploadSettings((prev) => ({
                              ...prev,
                              allowedTypes: prev.allowedTypes.filter((t) => t !== type.value),
                            }));
                          }
                        }}
                        data-testid={`checkbox-type-${type.value.replace("/", "-")}`}
                      />
                      <label htmlFor={type.value} className="text-sm">
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)} data-testid="button-cancel-settings">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast({ title: "Settings Saved", description: "Upload limits have been updated." });
                  setIsSettingsDialogOpen(false);
                }}
                data-testid="button-save-settings"
              >
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCDNDialogOpen} onOpenChange={setIsCDNDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>CDN Configuration</DialogTitle>
              <DialogDescription>
                Configure Content Delivery Network settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">CDN Enabled</label>
                  <p className="text-xs text-muted-foreground">Enable or disable CDN for file delivery</p>
                </div>
                <Checkbox
                  checked={cdnSettings.enabled}
                  onCheckedChange={(checked) => setCdnSettings((prev) => ({ ...prev, enabled: !!checked }))}
                  data-testid="checkbox-cdn-enabled"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CDN URL</label>
                <Input
                  value={cdnSettings.url}
                  onChange={(e) => setCdnSettings((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://cdn.example.com"
                  data-testid="input-cdn-url"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCDNDialogOpen(false)} data-testid="button-cancel-cdn">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast({ title: "CDN Settings Saved", description: "CDN configuration has been updated." });
                  setIsCDNDialogOpen(false);
                }}
                data-testid="button-save-cdn"
              >
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>File Preview</DialogTitle>
              <DialogDescription>
                {previewFile?.originalName}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {previewFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center min-h-[200px] bg-muted/30 rounded-lg">
                    {previewFile.mimeType.startsWith("image/") ? (
                      <div className="text-center p-8">
                        <Image className="h-16 w-16 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Image preview not available in mock mode</p>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <span className="ml-2 font-medium">{formatBytes(previewFile.size)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 font-medium">{previewFile.mimeType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Uploaded by:</span>
                      <span className="ml-2 font-medium">{previewFile.userEmail}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <span className="ml-2 font-medium">{formatDate(previewFile.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)} data-testid="button-close-preview">
                Close
              </Button>
              <Button onClick={() => previewFile && handleDownloadFile(previewFile)} data-testid="button-download-preview">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
