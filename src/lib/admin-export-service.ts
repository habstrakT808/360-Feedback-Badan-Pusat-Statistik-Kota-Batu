// src/lib/admin-export-service.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '@/lib/supabase';

interface ExportOptions {
  dataType: "assessments" | "pins" | "triwulan";
  periodFilter: "specific" | "all";
  startDate?: string;
  endDate?: string;
  selectedPeriod?: string;
  format: "excel";
  includeUserDetails: boolean;
  includePeriodDetails: boolean;
}

export class AdminExportService {
  static async exportData(options: ExportOptions) {
    try {
      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Call API endpoint to get data
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          dataType: options.dataType,
          periodFilter: options.periodFilter,
          startDate: options.startDate,
          endDate: options.endDate,
          selectedPeriod: options.selectedPeriod
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const { data } = await response.json();
      let filename = '';

      switch (options.dataType) {
        case 'assessments':
          filename = `Penilaian_360_${this.getDateString()}`;
          break;
        case 'pins':
          filename = `Employee_of_The_Month_${this.getDateString()}`;
          break;
        case 'triwulan':
          filename = `Triwulan_${this.getDateString()}`;
          break;
      }

      this.exportToExcel(data, options, filename);
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Gagal mengexport data');
    }
  }



  private static exportToExcel(data: any[], options: ExportOptions, filename: string) {
    const workbook = XLSX.utils.book_new();

    // SIMPLIFIED: Only create the main results sheet as requested by client
    // Removed Summary and Detailed Data sheets
    if (options.dataType === 'assessments') {
      this.addAssessmentSheets(workbook, data);
    } else if (options.dataType === 'pins') {
      this.addPinSheets(workbook, data);
    } else if (options.dataType === 'triwulan') {
      this.addTriwulanSheets(workbook, data);
    }

    // Export file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, `${filename}.xlsx`);
  }











  private static addAssessmentSheets(workbook: XLSX.WorkBook, data: any[]) {
    // Simple Individual User Results Sheet - Client requested format
    const userResultsData: any[][] = [];
    
    // Group data by assessee
    const userMap = new Map();
    data.forEach(assignment => {
      const assesseeId = assignment.assessee_id;
      if (!userMap.has(assesseeId)) {
        userMap.set(assesseeId, {
          user: {
            id: assesseeId,
            name: assignment.assessee_name,
            email: assignment.assessee_email,
            position: assignment.assessee_position,
            department: assignment.assessee_department
          },
          assignments: [],
          supervisorRatings: [],
          peerRatings: [],
          allResponses: []
        });
      }
      
      const userData = userMap.get(assesseeId);
      userData.assignments.push(assignment);
      
      // Add responses to all responses
      if (assignment.responses && assignment.responses.length > 0) {
        userData.allResponses.push(...assignment.responses);
      }
      
      // Categorize by assessor type using the field provided by API
      const isSupervisorAssessment = assignment.is_supervisor_assessment;
      
      // Calculate rating from individual feedback responses (not from assignment average)
      if (assignment.responses && assignment.responses.length > 0) {
        const totalRating = assignment.responses.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
        const avgRating = totalRating / assignment.responses.length;
        
        if (isSupervisorAssessment) {
          userData.supervisorRatings.push(avgRating);
        } else {
          userData.peerRatings.push(avgRating);
        }
      }
    });
    
    // Calculate individual user results - SIMPLIFIED FORMAT
    userMap.forEach((userData, userId) => {
      const supervisorAvg = userData.supervisorRatings.length > 0 
        ? userData.supervisorRatings.reduce((sum: number, r: number) => sum + r, 0) / userData.supervisorRatings.length
        : null;
      
      const peerAvg = userData.peerRatings.length > 0
        ? userData.peerRatings.reduce((sum: number, r: number) => sum + r, 0) / userData.peerRatings.length
        : null;
      
      // SIMPLIFIED: Only 6 columns as requested by client
      userResultsData.push([
        userData.user.name || 'N/A',                                    // 1. Nama Pegawai
        userData.user.email || 'N/A',                                  // 2. Email Pegawai  
        userData.user.position || 'N/A',                               // 3. Posisi
        userData.user.department || 'N/A',                             // 4. Departemen
        supervisorAvg ? supervisorAvg.toFixed(1) : 'Belum dinilai',    // 5. Nilai Supervisor
        peerAvg ? peerAvg.toFixed(1) : 'Belum ada'                     // 6. Nilai dari penilaian 360 / Skor Rekan Kerja
      ]);
    });
    
    if (userResultsData.length > 0) {
      const userResultsSheet = XLSX.utils.aoa_to_sheet([
        ['Nama Pegawai', 'Email Pegawai', 'Posisi', 'Departemen', 'Nilai Supervisor', 'Nilai dari penilaian 360 / Skor Rekan Kerja'],
        ...userResultsData
      ]);

      // Auto-width untuk semua kolom
      const colWidths = [
        { wch: 25 }, // Nama Pegawai
        { wch: 30 }, // Email Pegawai 
        { wch: 20 }, // Posisi
        { wch: 25 }, // Departemen
        { wch: 18 }, // Nilai Supervisor
        { wch: 35 }  // Nilai dari penilaian 360 / Skor Rekan Kerja
      ];
      userResultsSheet['!cols'] = colWidths;

      // Styling untuk header
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } }, // Purple background
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };

      // Apply styling to header row (A1:F1)
      const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'];
      headerCells.forEach(cell => {
        if (!userResultsSheet[cell]) userResultsSheet[cell] = {};
        userResultsSheet[cell].s = headerStyle;
      });

      // Styling untuk data rows
      const dataStyle = {
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } }
        }
      };

      // Apply border to all data cells
      const range = XLSX.utils.decode_range(userResultsSheet['!ref'] || 'A1:F1');
      for (let row = 1; row <= range.e.r; row++) {
        for (let col = 0; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!userResultsSheet[cellAddress]) userResultsSheet[cellAddress] = {};
          userResultsSheet[cellAddress].s = dataStyle;
        }
      }

      XLSX.utils.book_append_sheet(workbook, userResultsSheet, 'Hasil Penilaian 360°');
    }

    // SIMPLIFIED: Only main results sheet as requested by client
    // Removed detailed sheets to match team page simplicity
  }

  private static addPinSheets(workbook: XLSX.WorkBook, data: any[]) {
    // Pin Statistics by Week
    const weekStats = this.calculateWeekStats(data);
    const weekSheet = XLSX.utils.aoa_to_sheet([
      ['Week', 'Year', 'Month', 'Total Pins', 'Unique Givers', 'Unique Receivers'],
      ...weekStats
    ]);
    XLSX.utils.book_append_sheet(workbook, weekSheet, 'Weekly Stats');

    // Top Receivers
    const topReceivers = this.calculateTopReceivers(data);
    const receiversSheet = XLSX.utils.aoa_to_sheet([
      ['Receiver Name', 'Receiver Email', 'Total Pins Received', 'Department'],
      ...topReceivers
    ]);
    XLSX.utils.book_append_sheet(workbook, receiversSheet, 'Top Receivers');
  }

  private static addTriwulanSheets(workbook: XLSX.WorkBook, data: any[]) {
    // Winners by Period
    const periodWinners = data.map(winner => [
      winner.period_month,
      winner.period_year,
      winner.winner_name,
      winner.winner_email,
      winner.total_score,
      winner.decided_at
    ]);

    const winnersSheet = XLSX.utils.aoa_to_sheet([
      ['Month', 'Year', 'Winner Name', 'Winner Email', 'Score', 'Decided At'],
      ...periodWinners
    ]);
    XLSX.utils.book_append_sheet(workbook, winnersSheet, 'Winners by Period');
  }



  private static calculateWeekStats(data: any[]) {
    const weekMap = new Map();
    
    data.forEach(item => {
      const key = `${item.week_number}-${item.year}`;
      if (!weekMap.has(key)) {
        weekMap.set(key, { 
          week: item.week_number, 
          year: item.year, 
          month: item.month,
          total: 0, 
          givers: new Set(), 
          receivers: new Set() 
        });
      }
      
      const stats = weekMap.get(key);
      stats.total++;
      stats.givers.add(item.giver_id);
      stats.receivers.add(item.receiver_id);
    });

    return Array.from(weekMap.values()).map(stats => [
      stats.week,
      stats.year,
      stats.month,
      stats.total,
      stats.givers.size,
      stats.receivers.size
    ]);
  }

  private static calculateTopReceivers(data: any[]) {
    const receiverMap = new Map();
    
    data.forEach(item => {
      const receiverId = item.receiver_id;
      if (!receiverMap.has(receiverId)) {
        receiverMap.set(receiverId, {
          name: item.receiver_name,
          email: item.receiver_email,
          department: item.receiver_department,
          count: 0
        });
      }
      receiverMap.get(receiverId).count++;
    });

    return Array.from(receiverMap.values())
      .sort((a, b) => b.count - a.count)
      .map(receiver => [
        receiver.name,
        receiver.email,
        receiver.count,
        receiver.department
      ]);
  }

  private static getDataTypeName(dataType: string) {
    switch (dataType) {
      case 'assessments': return 'Penilaian 360°';
      case 'pins': return 'Employee of The Month (Pin)';
      case 'triwulan': return 'Triwulan';
      default: return dataType;
    }
  }

  private static getDateString() {
    return new Date().toISOString().split('T')[0];
  }
}
