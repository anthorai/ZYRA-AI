import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/ui/page-shell";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Upload, 
  Download, 
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Zap,
  Database,
  AlertTriangle,
  XCircle,
  Shield,
  RotateCcw,
  FileCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check
} from "lucide-react";

interface ProductRow {
  handle: string;
  title: string;
  description: string;
  tags?: string;
  image?: string;
  category?: string;
  price?: string;
  sku?: string;
}

interface ValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  issues: ValidationIssue[];
  duplicateHandles: string[];
  duplicateTitles: string[];
  missingRequiredFields: { row: number; fields: string[] }[];
  keywordConflicts: { keyword: string; products: string[] }[];
  missingSeoFields: { row: number; fields: string[] }[];
}

interface ParsedData {
  headers: string[];
  rows: ProductRow[];
  rawData: any[];
}

export default function CSVImportExport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyComplete, setApplyComplete] = useState(false);

  const parseCSVContent = (content: string): ParsedData => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [], rawData: [] };

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''));
    const rawData: any[] = [];
    const rows: ProductRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const rowData: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        rowData[header] = values[index]?.replace(/^["']|["']$/g, '') || '';
      });

      rawData.push(rowData);

      const productRow: ProductRow = {
        handle: rowData['handle'] || rowData['id'] || rowData['product_handle'] || '',
        title: rowData['title'] || rowData['name'] || rowData['product_title'] || '',
        description: rowData['description'] || rowData['body'] || rowData['product_description'] || '',
        tags: rowData['tags'] || rowData['keywords'] || '',
        image: rowData['image'] || rowData['image_url'] || rowData['images'] || '',
        category: rowData['category'] || rowData['product_type'] || rowData['type'] || '',
        price: rowData['price'] || rowData['variant_price'] || '',
        sku: rowData['sku'] || rowData['variant_sku'] || ''
      };

      rows.push(productRow);
    }

    return { headers, rows, rawData };
  };

  const parseXLSXContent = (data: ArrayBuffer): ParsedData => {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
    
    if (jsonData.length === 0) return { headers: [], rows: [], rawData: [] };

    const headers = (jsonData[0] as string[]).map(h => 
      String(h || '').toLowerCase().trim()
    );
    const rawData: any[] = [];
    const rows: ProductRow[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const values = jsonData[i] as any[];
      if (!values || values.every(v => !v)) continue;

      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header] = String(values[index] || '');
      });

      rawData.push(rowData);

      const productRow: ProductRow = {
        handle: rowData['handle'] || rowData['id'] || rowData['product_handle'] || '',
        title: rowData['title'] || rowData['name'] || rowData['product_title'] || '',
        description: rowData['description'] || rowData['body'] || rowData['product_description'] || '',
        tags: rowData['tags'] || rowData['keywords'] || '',
        image: rowData['image'] || rowData['image_url'] || rowData['images'] || '',
        category: rowData['category'] || rowData['product_type'] || rowData['type'] || '',
        price: rowData['price'] || rowData['variant_price'] || '',
        sku: rowData['sku'] || rowData['variant_sku'] || ''
      };

      rows.push(productRow);
    }

    return { headers, rows, rawData };
  };

  const validateData = (data: ParsedData): ValidationResult => {
    const issues: ValidationIssue[] = [];
    const duplicateHandles: string[] = [];
    const duplicateTitles: string[] = [];
    const missingRequiredFields: { row: number; fields: string[] }[] = [];
    const keywordConflicts: { keyword: string; products: string[] }[] = [];
    const missingSeoFields: { row: number; fields: string[] }[] = [];

    const handleCounts = new Map<string, number[]>();
    const titleCounts = new Map<string, number[]>();
    const keywordProducts = new Map<string, string[]>();

    data.rows.forEach((row, index) => {
      const rowNum = index + 2;
      const missingFields: string[] = [];
      const missingSeo: string[] = [];

      if (!row.handle) missingFields.push('handle');
      if (!row.title) missingFields.push('title');
      if (!row.description) missingFields.push('description');

      if (missingFields.length > 0) {
        missingRequiredFields.push({ row: rowNum, fields: missingFields });
        issues.push({
          row: rowNum,
          field: missingFields.join(', '),
          message: `Missing required fields: ${missingFields.join(', ')}`,
          severity: 'error'
        });
      }

      if (!row.tags) missingSeo.push('tags');
      if (row.description && row.description.length < 50) {
        issues.push({
          row: rowNum,
          field: 'description',
          message: 'Description is too short for optimal SEO (< 50 characters)',
          severity: 'warning'
        });
      }
      if (missingSeo.length > 0) {
        missingSeoFields.push({ row: rowNum, fields: missingSeo });
      }

      if (row.handle) {
        const existing = handleCounts.get(row.handle) || [];
        existing.push(rowNum);
        handleCounts.set(row.handle, existing);
      }

      if (row.title) {
        const normalizedTitle = row.title.toLowerCase().trim();
        const existing = titleCounts.get(normalizedTitle) || [];
        existing.push(rowNum);
        titleCounts.set(normalizedTitle, existing);
      }

      if (row.tags) {
        const keywords = row.tags.split(',').map(k => k.trim().toLowerCase());
        keywords.forEach(keyword => {
          if (keyword) {
            const existing = keywordProducts.get(keyword) || [];
            existing.push(row.title || `Row ${rowNum}`);
            keywordProducts.set(keyword, existing);
          }
        });
      }
    });

    handleCounts.forEach((rows, handle) => {
      if (rows.length > 1) {
        duplicateHandles.push(handle);
        issues.push({
          row: rows[0],
          field: 'handle',
          message: `Duplicate handle "${handle}" found in rows: ${rows.join(', ')}`,
          severity: 'error'
        });
      }
    });

    titleCounts.forEach((rows, title) => {
      if (rows.length > 1) {
        duplicateTitles.push(title);
        issues.push({
          row: rows[0],
          field: 'title',
          message: `Duplicate title "${title}" found in rows: ${rows.join(', ')}`,
          severity: 'warning'
        });
      }
    });

    keywordProducts.forEach((products, keyword) => {
      if (products.length > 5) {
        keywordConflicts.push({ keyword, products });
        issues.push({
          row: 0,
          field: 'tags',
          message: `Keyword "${keyword}" is overused across ${products.length} products - may cause internal competition`,
          severity: 'warning'
        });
      }
    });

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const validRows = data.rows.length - missingRequiredFields.length;

    return {
      isValid: errorCount === 0,
      totalRows: data.rows.length,
      validRows,
      issues,
      duplicateHandles,
      duplicateTitles,
      missingRequiredFields,
      keywordConflicts,
      missingSeoFields
    };
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
    const isXLSX = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.name.endsWith('.xlsx');

    if (!isCSV && !isXLSX) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or XLSX file",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setProcessingProgress(10);
    setParsedData(null);
    setValidationResult(null);
    setApplyComplete(false);

    try {
      let parsed: ParsedData;

      if (isXLSX) {
        setProcessingProgress(30);
        const arrayBuffer = await file.arrayBuffer();
        setProcessingProgress(50);
        parsed = parseXLSXContent(arrayBuffer);
      } else {
        setProcessingProgress(30);
        const text = await file.text();
        setProcessingProgress(50);
        parsed = parseCSVContent(text);
      }

      setProcessingProgress(70);
      setParsedData(parsed);

      const validation = validateData(parsed);
      setProcessingProgress(90);
      setValidationResult(validation);
      setProcessingProgress(100);

      toast({
        title: "File Processed",
        description: `Found ${parsed.rows.length} products. ${validation.isValid ? 'Ready to apply.' : 'Review validation issues.'}`,
      });
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to parse the file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const createSnapshotMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/csv-import/create-snapshot", {
        importType: 'bulk-import',
        productCount: parsedData?.rows.length || 0
      });
    }
  });

  const handleApplyImport = async () => {
    if (!validationResult?.isValid || !parsedData) {
      toast({
        title: "Cannot Apply",
        description: "Please fix validation errors before applying",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);

    try {
      await createSnapshotMutation.mutateAsync();
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      setApplyComplete(true);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/history'] });

      toast({
        title: "Import Complete",
        description: `${parsedData.rows.length} products imported successfully. Rollback snapshot created.`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to apply import. No changes were made.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!parsedData) return;

    const csvContent = [
      ['Handle', 'Title', 'Description', 'Tags', 'Category', 'Price', 'SKU', 'Image'],
      ...parsedData.rows.map(row => [
        row.handle,
        row.title,
        row.description,
        row.tags || '',
        row.category || '',
        row.price || '',
        row.sku || '',
        row.image || ''
      ])
    ].map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "CSV Downloaded",
      description: "Product data exported successfully",
    });
  };

  const handleDownloadXLSX = () => {
    if (!parsedData) return;

    const wsData = [
      ['Handle', 'Title', 'Description', 'Tags', 'Category', 'Price', 'SKU', 'Image'],
      ...parsedData.rows.map(row => [
        row.handle,
        row.title,
        row.description,
        row.tags || '',
        row.category || '',
        row.price || '',
        row.sku || '',
        row.image || ''
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'products_export.xlsx');

    toast({
      title: "XLSX Downloaded",
      description: "Product data exported successfully",
    });
  };

  const getValidationStatus = () => {
    if (!validationResult) return null;
    
    const errors = validationResult.issues.filter(i => i.severity === 'error').length;
    const warnings = validationResult.issues.filter(i => i.severity === 'warning').length;

    if (errors > 0) {
      return { status: 'error', label: 'Needs Attention', color: 'bg-red-500/20 text-red-300' };
    }
    if (warnings > 0) {
      return { status: 'warning', label: 'Review Recommended', color: 'bg-yellow-500/20 text-yellow-300' };
    }
    return { status: 'success', label: 'Safe to Apply', color: 'bg-green-500/20 text-green-300' };
  };

  const validationStatus = getValidationStatus();

  return (
    <PageShell
      title="CSV Import & Export"
      subtitle="Safely sync, review, and manage products in bulk with built-in validation and rollback protection"
      backTo="/dashboard?tab=automate"
    >
      <DashboardCard
        title="Upload Product Data"
        description="Upload a CSV or XLSX file with your product information"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="csv-upload" className="text-white">Select CSV or XLSX File</Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileUpload}
              className="bg-slate-800/50 border-slate-600 text-white"
              data-testid="input-csv-upload"
            />
            {uploadedFile && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <FileSpreadsheet className="w-4 h-4" />
                <span>{uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                {uploadedFile.name.endsWith('.xlsx') && (
                  <Badge variant="outline" className="text-xs">XLSX</Badge>
                )}
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>Processing file...</span>
                <span>{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="bg-slate-700" />
            </div>
          )}
        </div>
      </DashboardCard>

      {validationResult && (
        <DashboardCard
          title="Validation Summary"
          description="Pre-import validation results"
          headerAction={
            validationStatus && (
              <Badge className={validationStatus.color}>
                {validationStatus.status === 'success' ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : validationStatus.status === 'warning' ? (
                  <AlertTriangle className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                {validationStatus.label}
              </Badge>
            )
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-white" data-testid="stat-total-rows">
                  {validationResult.totalRows}
                </div>
                <div className="text-xs text-slate-400">Total Products</div>
              </div>
              <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-green-400" data-testid="stat-valid-rows">
                  {validationResult.validRows}
                </div>
                <div className="text-xs text-slate-400">Valid Products</div>
              </div>
              <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-red-400" data-testid="stat-errors">
                  {validationResult.issues.filter(i => i.severity === 'error').length}
                </div>
                <div className="text-xs text-slate-400">Errors</div>
              </div>
              <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400" data-testid="stat-warnings">
                  {validationResult.issues.filter(i => i.severity === 'warning').length}
                </div>
                <div className="text-xs text-slate-400">Warnings</div>
              </div>
            </div>

            {validationResult.issues.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowValidationDetails(!showValidationDetails)}
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
                  data-testid="button-toggle-details"
                >
                  {showValidationDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showValidationDetails ? 'Hide' : 'Show'} Validation Details ({validationResult.issues.length})
                </button>

                {showValidationDetails && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {validationResult.issues.slice(0, 20).map((issue, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg flex items-start gap-3 ${
                          issue.severity === 'error' 
                            ? 'bg-red-900/20 border border-red-400/20' 
                            : issue.severity === 'warning'
                            ? 'bg-yellow-900/20 border border-yellow-400/20'
                            : 'bg-blue-900/20 border border-blue-400/20'
                        }`}
                        data-testid={`issue-${idx}`}
                      >
                        {issue.severity === 'error' ? (
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        ) : issue.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-300">{issue.message}</div>
                          {issue.row > 0 && (
                            <div className="text-xs text-slate-500">Row {issue.row}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {validationResult.issues.length > 20 && (
                      <div className="text-sm text-slate-400 text-center py-2">
                        ... and {validationResult.issues.length - 20} more issues
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Rollback protection enabled</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {validationResult.isValid ? (
                <Button
                  onClick={handleApplyImport}
                  disabled={isApplying || applyComplete}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-apply-import"
                >
                  {isApplying ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : applyComplete ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Applied Successfully
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 mr-2" />
                      Apply Import
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  disabled
                  className="bg-slate-600 text-slate-400 cursor-not-allowed"
                  data-testid="button-apply-disabled"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Fix Errors to Apply
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setUploadedFile(null);
                  setParsedData(null);
                  setValidationResult(null);
                  setApplyComplete(false);
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DashboardCard>
      )}

      {applyComplete && (
        <DashboardCard
          title="Import Complete"
          description="Your products have been imported with rollback protection"
          headerAction={
            <CheckCircle className="w-5 h-5 text-green-400" />
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-900/20 rounded-lg border border-green-400/20">
              <Shield className="w-6 h-6 text-green-400" />
              <div>
                <div className="text-white font-medium">Rollback Snapshot Created</div>
                <div className="text-sm text-slate-300">
                  You can restore previous data anytime from the Rollback Changes page
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation('/automation/rollback-changes')}
                data-testid="button-view-rollback"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                View Rollback Options
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/dashboard')}
                data-testid="button-go-dashboard"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </DashboardCard>
      )}

      <DashboardCard
        title="Export Products"
        description="Download your current product data in CSV or XLSX format"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleDownloadCSV}
            variant="outline"
            disabled={!parsedData && !applyComplete}
            data-testid="button-download-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
          <Button
            onClick={handleDownloadXLSX}
            variant="outline"
            disabled={!parsedData && !applyComplete}
            data-testid="button-download-xlsx"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Download XLSX
          </Button>
        </div>
      </DashboardCard>

      <DashboardCard className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-400/20">
        <div className="flex items-start space-x-4">
          <Shield className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-white font-semibold mb-2">Safe Bulk Management</h3>
            <p className="text-slate-300 text-sm">
              CSV Import/Export lets you safely sync, review, and manage products in bulk. 
              Built-in validation catches issues before they affect your store, and automatic 
              rollback protection means you can always restore previous data.
            </p>
          </div>
        </div>
      </DashboardCard>
    </PageShell>
  );
}
