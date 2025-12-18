import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export budget data to Excel
 */
export const exportBudgetToExcel = (budgetCodes, filename = 'budget_report') => {
  try {
    // Prepare data for Excel
    const excelData = budgetCodes.map(code => ({
      'Budget Code': code.code,
      'Name': code.name,
      'Department': code.department,
      'Budget Type': code.budgetType,
      'Total Budget (XAF)': code.budget,
      'Used (XAF)': code.used,
      'Remaining (XAF)': code.budget - code.used,
      'Utilization (%)': Math.round((code.used / code.budget) * 100),
      'Status': code.status,
      'Fiscal Year': code.fiscalYear,
      'Owner': code.budgetOwner?.fullName || 'N/A',
      'Created Date': new Date(code.createdAt).toLocaleDateString('en-GB')
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Budget Code
      { wch: 30 }, // Name
      { wch: 15 }, // Department
      { wch: 15 }, // Budget Type
      { wch: 18 }, // Total Budget
      { wch: 18 }, // Used
      { wch: 18 }, // Remaining
      { wch: 15 }, // Utilization
      { wch: 12 }, // Status
      { wch: 12 }, // Fiscal Year
      { wch: 20 }, // Owner
      { wch: 15 }  // Created Date
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Budget Codes');

    // Generate file
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);

    return { success: true, message: 'Excel file downloaded successfully' };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, message: 'Failed to export Excel file' };
  }
};

/**
 * Export budget utilization report to Excel
 */
export const exportUtilizationReportToExcel = (reportData, filename = 'budget_utilization_report') => {
  try {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Budget Utilization Report'],
      ['Generated:', new Date().toLocaleDateString('en-GB')],
      [''],
      ['Summary Statistics'],
      ['Total Budget (XAF):', reportData.summary.totalBudget],
      ['Total Used (XAF):', reportData.summary.totalUsed],
      ['Total Remaining (XAF):', reportData.summary.totalRemaining],
      ['Average Utilization (%):', reportData.summary.averageUtilization],
      ['Number of Budget Codes:', reportData.summary.codesCount]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // By Department sheet
    const deptData = Object.keys(reportData.byDepartment).map(dept => ({
      'Department': dept,
      'Total Budget (XAF)': reportData.byDepartment[dept].budget,
      'Used (XAF)': reportData.byDepartment[dept].used,
      'Remaining (XAF)': reportData.byDepartment[dept].remaining,
      'Utilization (%)': reportData.byDepartment[dept].utilization,
      'Number of Codes': reportData.byDepartment[dept].count
    }));
    const wsDept = XLSX.utils.json_to_sheet(deptData);
    XLSX.utils.book_append_sheet(wb, wsDept, 'By Department');

    // By Budget Type sheet
    const typeData = Object.keys(reportData.byBudgetType).map(type => ({
      'Budget Type': type,
      'Total Budget (XAF)': reportData.byBudgetType[type].budget,
      'Used (XAF)': reportData.byBudgetType[type].used,
      'Remaining (XAF)': reportData.byBudgetType[type].remaining,
      'Utilization (%)': reportData.byBudgetType[type].utilization,
      'Number of Codes': reportData.byBudgetType[type].count
    }));
    const wsType = XLSX.utils.json_to_sheet(typeData);
    XLSX.utils.book_append_sheet(wb, wsType, 'By Budget Type');

    // Top Utilizers sheet
    if (reportData.topUtilizers && reportData.topUtilizers.length > 0) {
      const topData = reportData.topUtilizers.map(code => ({
        'Code': code.code,
        'Name': code.name,
        'Department': code.department,
        'Budget (XAF)': code.budget,
        'Used (XAF)': code.used,
        'Remaining (XAF)': code.remaining,
        'Utilization (%)': code.utilization
      }));
      const wsTop = XLSX.utils.json_to_sheet(topData);
      XLSX.utils.book_append_sheet(wb, wsTop, 'Top Utilizers');
    }

    // Underutilized sheet
    if (reportData.underutilized && reportData.underutilized.length > 0) {
      const underData = reportData.underutilized.map(code => ({
        'Code': code.code,
        'Name': code.name,
        'Department': code.department,
        'Budget (XAF)': code.budget,
        'Used (XAF)': code.used,
        'Remaining (XAF)': code.remaining,
        'Utilization (%)': code.utilization
      }));
      const wsUnder = XLSX.utils.json_to_sheet(underData);
      XLSX.utils.book_append_sheet(wb, wsUnder, 'Underutilized');
    }

    // Generate file
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);

    return { success: true, message: 'Report exported successfully' };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, message: 'Failed to export report' };
  }
};

/**
 * Export budget data to PDF
 */
export const exportBudgetToPDF = (budgetCodes, filename = 'budget_report') => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

    // Add title
    doc.setFontSize(18);
    doc.text('Budget Management Report', 14, 20);

    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`, 14, 28);
    doc.text(`Total Budget Codes: ${budgetCodes.length}`, 14, 34);

    // Calculate summary statistics
    const totalBudget = budgetCodes.reduce((sum, code) => sum + code.budget, 0);
    const totalUsed = budgetCodes.reduce((sum, code) => sum + code.used, 0);
    const avgUtilization = Math.round((totalUsed / totalBudget) * 100);

    doc.text(`Total Budget: XAF ${totalBudget.toLocaleString()}`, 14, 40);
    doc.text(`Total Used: XAF ${totalUsed.toLocaleString()}`, 14, 46);
    doc.text(`Average Utilization: ${avgUtilization}%`, 14, 52);

    // Prepare table data
    const tableData = budgetCodes.map(code => [
      code.code,
      code.name.substring(0, 25) + (code.name.length > 25 ? '...' : ''),
      code.department,
      code.budgetType,
      `XAF ${code.budget.toLocaleString()}`,
      `XAF ${code.used.toLocaleString()}`,
      `${Math.round((code.used / code.budget) * 100)}%`,
      code.status
    ]);

    // Add table
    doc.autoTable({
      startY: 60,
      head: [['Code', 'Name', 'Department', 'Type', 'Budget', 'Used', 'Utilization', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [24, 144, 255] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 45 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
        6: { cellWidth: 25 },
        7: { cellWidth: 20 }
      }
    });

    // Save PDF
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);

    return { success: true, message: 'PDF downloaded successfully' };
  } catch (error) {
    console.error('PDF export error:', error);
    return { success: false, message: 'Failed to export PDF' };
  }
};

/**
 * Export budget utilization report to PDF
 */
export const exportUtilizationReportToPDF = (reportData, filename = 'budget_utilization_report') => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Page 1: Summary
    doc.setFontSize(20);
    doc.text('Budget Utilization Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 30);
    doc.text(`Fiscal Year: ${reportData.period.fiscalYear}`, 14, 36);

    // Summary statistics
    doc.setFontSize(14);
    doc.text('Summary Statistics', 14, 50);
    
    doc.setFontSize(10);
    doc.text(`Total Budget: XAF ${reportData.summary.totalBudget.toLocaleString()}`, 20, 60);
    doc.text(`Total Used: XAF ${reportData.summary.totalUsed.toLocaleString()}`, 20, 66);
    doc.text(`Total Remaining: XAF ${reportData.summary.totalRemaining.toLocaleString()}`, 20, 72);
    doc.text(`Average Utilization: ${reportData.summary.averageUtilization}%`, 20, 78);
    doc.text(`Number of Budget Codes: ${reportData.summary.codesCount}`, 20, 84);

    // By Department table
    doc.setFontSize(14);
    doc.text('Budget by Department', 14, 100);

    const deptTableData = Object.keys(reportData.byDepartment).map(dept => [
      dept,
      `XAF ${reportData.byDepartment[dept].budget.toLocaleString()}`,
      `XAF ${reportData.byDepartment[dept].used.toLocaleString()}`,
      `${reportData.byDepartment[dept].utilization}%`,
      reportData.byDepartment[dept].count
    ]);

    doc.autoTable({
      startY: 105,
      head: [['Department', 'Budget', 'Used', 'Utilization', 'Codes']],
      body: deptTableData,
      theme: 'striped',
      headStyles: { fillColor: [24, 144, 255] },
      styles: { fontSize: 9 }
    });

    // Page 2: Budget Types
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Budget by Type', 14, 20);

    const typeTableData = Object.keys(reportData.byBudgetType).map(type => [
      type,
      `XAF ${reportData.byBudgetType[type].budget.toLocaleString()}`,
      `XAF ${reportData.byBudgetType[type].used.toLocaleString()}`,
      `${reportData.byBudgetType[type].utilization}%`,
      reportData.byBudgetType[type].count
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Type', 'Budget', 'Used', 'Utilization', 'Codes']],
      body: typeTableData,
      theme: 'striped',
      headStyles: { fillColor: [24, 144, 255] },
      styles: { fontSize: 9 }
    });

    // Top Utilizers
    if (reportData.topUtilizers && reportData.topUtilizers.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 80;
      
      doc.setFontSize(14);
      doc.text('Top Utilizers (≥80%)', 14, finalY + 15);

      const topTableData = reportData.topUtilizers.map(code => [
        code.code,
        code.name.substring(0, 30) + (code.name.length > 30 ? '...' : ''),
        code.department,
        `${code.utilization}%`
      ]);

      doc.autoTable({
        startY: finalY + 20,
        head: [['Code', 'Name', 'Department', 'Utilization']],
        body: topTableData,
        theme: 'striped',
        headStyles: { fillColor: [255, 124, 124] },
        styles: { fontSize: 9 }
      });
    }

    // Save PDF
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);

    return { success: true, message: 'PDF report downloaded successfully' };
  } catch (error) {
    console.error('PDF export error:', error);
    return { success: false, message: 'Failed to export PDF report' };
  }
};

/**
 * Export budget revisions to Excel
 */
export const exportRevisionsToExcel = (revisions, filename = 'budget_revisions') => {
  try {
    const excelData = revisions.map(revision => ({
      'Request Date': new Date(revision.requestDate).toLocaleDateString('en-GB'),
      'Budget Code': revision.budgetCode.code,
      'Budget Name': revision.budgetCode.name,
      'Previous Budget (XAF)': revision.previousBudget,
      'Requested Budget (XAF)': revision.requestedBudget,
      'Change Amount (XAF)': revision.changeAmount,
      'Change Type': revision.changeAmount > 0 ? 'Increase' : 'Decrease',
      'Requested By': revision.requestedBy?.fullName || 'N/A',
      'Status': revision.status,
      'Approval Date': revision.approvalDate ? new Date(revision.approvalDate).toLocaleDateString('en-GB') : 'Pending',
      'Reason': revision.reason
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    ws['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 20 },
      { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 20 },
      { wch: 12 }, { wch: 12 }, { wch: 40 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Budget Revisions');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);

    return { success: true, message: 'Excel file downloaded successfully' };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, message: 'Failed to export Excel file' };
  }
};

/**
 * Export budget transfers to Excel
 */
export const exportTransfersToExcel = (transfers, filename = 'budget_transfers') => {
  try {
    const excelData = transfers.map(transfer => ({
      'Date': new Date(transfer.createdAt).toLocaleDateString('en-GB'),
      'From Code': transfer.fromBudgetCode?.code,
      'From Name': transfer.fromBudgetCode?.name,
      'To Code': transfer.toBudgetCode?.code,
      'To Name': transfer.toBudgetCode?.name,
      'Amount (XAF)': transfer.amount,
      'Requested By': transfer.requestedBy?.fullName || 'N/A',
      'Status': transfer.status,
      'Executed Date': transfer.executedDate ? new Date(transfer.executedDate).toLocaleDateString('en-GB') : 'Pending',
      'Reason': transfer.reason
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    ws['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
      { wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 12 },
      { wch: 15 }, { wch: 40 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Budget Transfers');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);

    return { success: true, message: 'Excel file downloaded successfully' };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, message: 'Failed to export Excel file' };
  }
};