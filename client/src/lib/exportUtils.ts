import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

export interface ExportData {
  keyMetrics: Array<{
    title: string;
    value: string;
    change: string;
    positive: boolean;
  }>;
  products: Array<{
    id: string;
    name: string;
    isOptimized: boolean;
    price?: number;
    category?: string;
  }>;
  emailPerformance: {
    delivered: string;
    opened: string;
    clicked: string;
    converted: string;
  };
  smsPerformance: {
    sent: string;
    delivered: string;
    clicked: string;
    recovered: string;
  };
  seoPerformance: {
    optimizedProducts: number;
    rankingImprovement: string;
    organicTraffic: string;
    keywordRankings: string;
  };
}

export function generateCSV(data: ExportData): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  let csv = `Zyra AI Analytics Report - ${currentDate}\n\n`;
  
  // Key Metrics Section
  csv += "KEY METRICS\n";
  csv += "Metric,Value,Change,Trend\n";
  data.keyMetrics.forEach(metric => {
    csv += `"${metric.title}","${metric.value}","${metric.change}","${metric.positive ? 'Positive' : 'Negative'}"\n`;
  });
  
  csv += "\nPRODUCT PERFORMANCE\n";
  csv += "Product Name,Status,Optimization,Performance\n";
  data.products.forEach(product => {
    const optimizationStatus = product.isOptimized ? "Optimized" : "Not optimized";
    const performance = product.isOptimized ? "+32%" : "--";
    csv += `"${product.name}","Active","${optimizationStatus}","${performance}"\n`;
  });
  
  csv += "\nEMAIL CAMPAIGN PERFORMANCE\n";
  csv += "Metric,Value\n";
  csv += `"Delivered","${data.emailPerformance.delivered}"\n`;
  csv += `"Opened","${data.emailPerformance.opened}"\n`;
  csv += `"Clicked","${data.emailPerformance.clicked}"\n`;
  csv += `"Converted","${data.emailPerformance.converted}"\n`;
  
  csv += "\nSMS CAMPAIGN PERFORMANCE\n";
  csv += "Metric,Value\n";
  csv += `"Sent","${data.smsPerformance.sent}"\n`;
  csv += `"Delivered","${data.smsPerformance.delivered}"\n`;
  csv += `"Clicked","${data.smsPerformance.clicked}"\n`;
  csv += `"Recovered","${data.smsPerformance.recovered}"\n`;
  
  csv += "\nSEO PERFORMANCE\n";
  csv += "Metric,Value\n";
  csv += `"Optimized Products","${data.seoPerformance.optimizedProducts}"\n`;
  csv += `"Avg. Ranking Improvement","${data.seoPerformance.rankingImprovement}"\n`;
  csv += `"Organic Traffic","${data.seoPerformance.organicTraffic}"\n`;
  csv += `"Keyword Rankings","${data.seoPerformance.keywordRankings}"\n`;
  
  return csv;
}

export function generatePDF(data: ExportData): jsPDF {
  const doc = new jsPDF();
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 44, 52);
  doc.text('Zyra AI Analytics Report', 20, 25);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${currentDate} at ${currentTime}`, 20, 35);
  
  let yPosition = 50;
  
  try {
    // Key Metrics Table
    doc.setFontSize(16);
    doc.setTextColor(40, 44, 52);
    doc.text('Key Performance Metrics', 20, yPosition);
    yPosition += 10;
    
    const keyMetricsData = data.keyMetrics.map(metric => [
      metric.title,
      metric.value,
      metric.change,
      metric.positive ? 'Positive' : 'Negative'
    ]);
    
    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value', 'Change', 'Trend']],
      body: keyMetricsData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 20 : yPosition + 80;
    
    // Product Performance Table
    doc.setFontSize(16);
    doc.setTextColor(40, 44, 52);
    doc.text('Product Performance', 20, yPosition);
    yPosition += 10;
    
    const productData = data.products.length > 0 ? data.products.map(product => [
      product.name,
      'Active',
      product.isOptimized ? 'Optimized' : 'Not optimized',
      product.isOptimized ? '+32%' : '--'
    ]) : [['No products available', '--', '--', '--']];
    
    doc.autoTable({
      startY: yPosition,
      head: [['Product Name', 'Status', 'Optimization', 'Performance']],
      body: productData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 20 : yPosition + 80;
    
    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Campaign Performance Section
    doc.setFontSize(16);
    doc.setTextColor(40, 44, 52);
    doc.text('Campaign Performance', 20, yPosition);
    yPosition += 10;
    
    // Email Performance
    doc.setFontSize(14);
    doc.text('Email Campaigns', 20, yPosition);
    yPosition += 5;
    
    const emailData = [
      ['Delivered', data.emailPerformance.delivered],
      ['Opened', data.emailPerformance.opened],
      ['Clicked', data.emailPerformance.clicked],
      ['Converted', data.emailPerformance.converted]
    ];
    
    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: emailData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 100 }
    });
    
    yPosition = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : yPosition + 60;
    
    // SMS Performance
    doc.setFontSize(14);
    doc.text('SMS Campaigns', 20, yPosition);
    yPosition += 5;
    
    const smsData = [
      ['Sent', data.smsPerformance.sent],
      ['Delivered', data.smsPerformance.delivered],
      ['Clicked', data.smsPerformance.clicked],
      ['Recovered', data.smsPerformance.recovered]
    ];
    
    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: smsData,
      theme: 'grid',
      headStyles: { fillColor: [168, 85, 247] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 100 }
    });
    
    yPosition = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : yPosition + 60;
    
    // SEO Performance
    doc.setFontSize(14);
    doc.text('SEO Performance', 20, yPosition);
    yPosition += 5;
    
    const seoData = [
      ['Optimized Products', data.seoPerformance.optimizedProducts.toString()],
      ['Avg. Ranking Improvement', data.seoPerformance.rankingImprovement],
      ['Organic Traffic', data.seoPerformance.organicTraffic],
      ['Keyword Rankings', data.seoPerformance.keywordRankings]
    ];
    
    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: seoData,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 100 }
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    // Add error message to PDF
    doc.setFontSize(12);
    doc.setTextColor(255, 0, 0);
    doc.text('Error generating detailed report. Basic information included.', 20, yPosition);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount} | Zyra AI Analytics Report`, 20, doc.internal.pageSize.height - 10);
  }
  
  return doc;
}

export function downloadFile(content: string | jsPDF, filename: string, type: 'csv' | 'pdf'): void {
  if (type === 'csv') {
    const blob = new Blob([content as string], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (type === 'pdf') {
    (content as jsPDF).save(filename);
  }
}

export function getExportFilename(format: 'csv' | 'pdf'): string {
  const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `Zyra_Report_${currentDate}.${format}`;
}