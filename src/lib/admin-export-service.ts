// src/lib/admin-export-service.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getSession } from 'next-auth/react';


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
      const session = await getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Call API endpoint to get data
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

      const json = await response.json();
      const data = json?.data;
      const meta = json?.meta;
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

      this.exportToExcel({ data, meta }, options, filename);
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Gagal mengexport data');
    }
  }



  private static exportToExcel(payload: any, options: ExportOptions, filename: string) {
    const { data, meta } = payload || {};
    console.log('Export to Excel - dataType:', options.dataType, 'data:', data, 'meta:', meta);
    
    const workbook = XLSX.utils.book_new();

    // SIMPLIFIED: Only create the main results sheet as requested by client
    // Removed Summary and Detailed Data sheets
    if (options.dataType === 'assessments') {
      this.addAssessmentSheets(workbook, data);
    } else if (options.dataType === 'pins') {
      this.addPinSheets(workbook, data);
    } else if (options.dataType === 'triwulan') {
      this.addTriwulanSheets(workbook, { data, meta });
    }

    // Check if workbook has any sheets
    const sheetNames = workbook.SheetNames;
    console.log('Workbook sheet names:', sheetNames);
    
    if (sheetNames.length === 0) {
      console.error('Workbook is empty - no sheets created');
      throw new Error('Tidak ada data yang dapat diekspor');
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
    // Sheet 1: Pins by Giver (siapa memberi kepada siapa dan berapa banyak)
    const giverRows = this.calculatePinsByGiver(data);
    const giverHeader = ['Giver Name', 'Giver Email', 'Receiver Name', 'Receiver Email', 'Pins Given'];
    const giverSheet = XLSX.utils.aoa_to_sheet([giverHeader, ...giverRows]);
    this.styleSheet(giverSheet, giverHeader.length, giverRows);
    XLSX.utils.book_append_sheet(workbook, giverSheet, 'Pins by Giver');

    // Sheet 2: Ranking penerima (siapa menerima pin terbanyak)
    const topReceivers = this.calculateTopReceivers(data);
    const recvHeader = ['Receiver Name', 'Receiver Email', 'Total Pins Received', 'Department'];
    const receiversSheet = XLSX.utils.aoa_to_sheet([recvHeader, ...topReceivers]);
    this.styleSheet(receiversSheet, recvHeader.length, topReceivers);
    XLSX.utils.book_append_sheet(workbook, receiversSheet, 'Top Receivers');
  }

  private static addTriwulanSheets(workbook: XLSX.WorkBook, payload: any) {
    const { data, meta } = payload || {};
    // Extract ranking data and detailed ratings from API shape
    const rankingData = meta?.ranking || [];
    const detailedRatings = Array.isArray(data) ? data : (data?.detailedRatings || []);

    console.log('Triwulan data:', { rankingData: rankingData.length, detailedRatings: detailedRatings.length });

    // Removed: Detail Per Aspek sheet per request. We will only export two sheets below.

    // Sheet 1: Summary Penilaian
    if (detailedRatings.length > 0) {
      const detHeader = [
        'Penilai', 'Email Penilai', 'Kandidat', 'Email Kandidat',
        'Aspek 1', 'Aspek 2', 'Aspek 3', 'Aspek 4', 'Aspek 5', 'Aspek 6', 'Aspek 7', 'Aspek 8', 
        'Aspek 9', 'Aspek 10', 'Aspek 11', 'Aspek 12', 'Aspek 13'
      ];
      const detRows = detailedRatings.map((r: any) => [
        r['Penilai'], r['Email Penilai'], r['Kandidat'], r['Email Kandidat'], 
        r['Aspek 1'], r['Aspek 2'], r['Aspek 3'], r['Aspek 4'], r['Aspek 5'], r['Aspek 6'], r['Aspek 7'], r['Aspek 8'], r['Aspek 9'], r['Aspek 10'], r['Aspek 11'], r['Aspek 12'], r['Aspek 13']
      ]);
      const detSheet = XLSX.utils.aoa_to_sheet([detHeader, ...detRows]);
      this.styleSheet(detSheet, detHeader.length, detRows);
      const label = meta?.period_label ? `Summary Penilaian (${meta.period_label})` : 'Summary Penilaian';
      XLSX.utils.book_append_sheet(workbook, detSheet, label);
    }

    // Sheet 2: Ranking dan Skor Akhir
    if (rankingData.length > 0) {
      const header = ['Peringkat', 'Nama', 'Email', 'Skor Akhir'];
      const rows = rankingData.map((r: any, index: number) => [
        index + 1,
        r.candidate_name || r.name,
        r.email || '',
        r.total_score || r.score
      ]);
      const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
      this.styleSheet(sheet, header.length, rows);
      const label = meta?.period_label ? `Perangkingan (${meta.period_label})` : 'Perangkingan';
      XLSX.utils.book_append_sheet(workbook, sheet, label);
    }

    // Fallback: Jika tidak ada data sama sekali, buat sheet kosong dengan pesan
    if (detailedRatings.length === 0 && rankingData.length === 0) {
      const fallbackHeader = ['Status'];
      const fallbackRows = [['Tidak ada data triwulan tersedia']];
      const fallbackSheet = XLSX.utils.aoa_to_sheet([fallbackHeader, ...fallbackRows]);
      this.styleSheet(fallbackSheet, fallbackHeader.length, fallbackRows);
      XLSX.utils.book_append_sheet(workbook, fallbackSheet, 'Data Kosong');
    }
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
          name: item.receiver_name || item.receiver_full_name || item.receiver?.full_name || '',
          email: item.receiver_email || item.receiver?.email || '',
          department: item.receiver_department || item.receiver?.department || '',
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

  private static calculatePinsByGiver(data: any[]) {
    // Aggregate per giver->receiver pair
    const pairMap = new Map<string, { giverName: string; giverEmail: string; receiverName: string; receiverEmail: string; count: number }>();
    data.forEach(item => {
      const giverId = item.giver_id;
      const receiverId = item.receiver_id;
      const key = `${giverId}__${receiverId}`;
      const giverName = item.giver_name || item.giver_full_name || item.giver?.full_name || '';
      const giverEmail = item.giver_email || item.giver?.email || '';
      const receiverName = item.receiver_name || item.receiver_full_name || item.receiver?.full_name || '';
      const receiverEmail = item.receiver_email || item.receiver?.email || '';
      if (!pairMap.has(key)) {
        pairMap.set(key, { giverName, giverEmail, receiverName, receiverEmail, count: 0 });
      }
      pairMap.get(key)!.count++;
    });
    // Sort by giver name then count desc
    return Array.from(pairMap.values())
      .sort((a, b) => a.giverName.localeCompare(b.giverName) || b.count - a.count)
      .map(r => [r.giverName, r.giverEmail, r.receiverName, r.receiverEmail, r.count]);
  }

  private static styleSheet(sheet: XLSX.WorkSheet, numCols: number, rows: any[][]) {
    // Set header style
    const headerStyle: any = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, size: 12 },
      fill: { fgColor: { rgb: '2563EB' } }, // blue
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      },
    };
    
    // Apply header style
    for (let c = 0; c < numCols; c++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c });
      if (!sheet[cell]) sheet[cell] = {} as any;
      (sheet as any)[cell].s = headerStyle;
    }

    // Data style
    const dataStyle: any = {
      font: { size: 11 },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
        right: { style: 'thin', color: { rgb: 'E5E7EB' } },
      },
    };
    
    // Apply data style
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    for (let r = 1; r <= range.e.r; r++) {
      for (let c = 0; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!sheet[addr]) sheet[addr] = {} as any;
        (sheet as any)[addr].s = dataStyle;
      }
    }

    // Auto width by content length with better calculation
    const matrix = [[...Array(numCols).keys()].map(() => '')].concat(rows as any);
    const widths = Array.from({ length: numCols }).map((_, c) => {
      const maxLen = Math.max(
        ...matrix.map(row => {
          const v = row[c];
          const s = v == null ? '' : String(v);
          // Calculate width based on character count and type
          let width = s.length;
          // Add extra width for numbers and emails
          if (typeof v === 'number' || /^\d+$/.test(s)) width += 2;
          if (/@/.test(s)) width += 5;
          // Add extra width for aspect names
          if (s.includes('Aspek')) width += 3;
          return width;
        })
      );
      // Set minimum and maximum width with better defaults
      return { wch: Math.min(Math.max(maxLen + 4, 12), 80) };
    });
    (sheet as any)['!cols'] = widths;
    
    // Set row height for better readability
    const rowHeights = Array.from({ length: range.e.r + 1 }, (_, r) => {
      return r === 0 ? 25 : 20; // Header row taller
    });
    (sheet as any)['!rows'] = rowHeights;
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
