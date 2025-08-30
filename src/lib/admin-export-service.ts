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
  format: "excel" | "csv";
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

      if (options.format === 'excel') {
        this.exportToExcel(data, options, filename);
      } else {
        this.exportToCSV(data, options, filename);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Gagal mengexport data');
    }
  }



  private static exportToExcel(data: any[], options: ExportOptions, filename: string) {
    const workbook = XLSX.utils.book_new();

    // Create summary sheet
    const summaryData = this.createSummarySheet(data, options);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Create detailed data sheet
    const detailedData = this.createDetailedSheet(data, options);
    const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Data');

    // Create additional sheets based on data type
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

  private static exportToCSV(data: any[], options: ExportOptions, filename: string) {
    const detailedData = this.createDetailedSheet(data, options);
    const csvContent = detailedData.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  }

  private static createSummarySheet(data: any[], options: ExportOptions) {
    const summary = [
      ['BPS Kota Batu - Data Export Summary'],
      [''],
      ['Export Information'],
      ['Data Type', this.getDataTypeName(options.dataType)],
      ['Export Date', new Date().toLocaleDateString('id-ID')],
      ['Total Records', data.length],
      [''],
    ];

    if (options.dataType === 'assessments') {
      const totalAssessments = data.length;
      const completedAssessments = data.filter(d => d.is_completed).length;
      const avgRating = data.length > 0 
        ? (data.reduce((sum, d) => sum + parseFloat(d.average_rating || '0'), 0) / data.length).toFixed(2)
        : '0.00';

      summary.push(
        ['Assessment Statistics'],
        ['Total Assessments', totalAssessments],
        ['Completed Assessments', completedAssessments],
        ['Completion Rate', `${((completedAssessments / totalAssessments) * 100).toFixed(1)}%`],
        ['Average Rating', avgRating],
        [''],
      );
    } else if (options.dataType === 'pins') {
      const totalPins = data.length;
      const uniqueGivers = new Set(data.map(d => d.giver_id)).size;
      const uniqueReceivers = new Set(data.map(d => d.receiver_id)).size;

      summary.push(
        ['Pin Statistics'],
        ['Total Pins Given', totalPins],
        ['Unique Givers', uniqueGivers],
        ['Unique Receivers', uniqueReceivers],
        [''],
      );
    } else if (options.dataType === 'triwulan') {
      const totalWinners = data.length;
      const avgScore = data.length > 0 
        ? (data.reduce((sum, d) => sum + parseFloat(d.total_score || '0'), 0) / data.length).toFixed(2)
        : '0.00';

      summary.push(
        ['Triwulan Statistics'],
        ['Total Winners', totalWinners],
        ['Average Score', avgScore],
        [''],
      );
    }

    return summary;
  }

  private static createDetailedSheet(data: any[], options: ExportOptions) {
    if (data.length === 0) return [['No data available']];

    const headers = this.getHeaders(options.dataType, options);
    const rows = data.map(item => this.flattenData(item, options.dataType, options));

    return [headers, ...rows];
  }

  private static getHeaders(dataType: string, options: ExportOptions) {
    const baseHeaders = ['ID', 'Created At'];

    if (options.includePeriodDetails) {
      baseHeaders.push('Period ID', 'Period Month', 'Period Year', 'Period Start', 'Period End');
    }

    if (options.includeUserDetails) {
      baseHeaders.push('User ID', 'User Name', 'User Email', 'User Position', 'User Department');
    }

    switch (dataType) {
      case 'assessments':
        return [
          ...baseHeaders,
          'Assessor Name', 'Assessor Email', 'Assessor Position', 'Assessor Department', 'Is Supervisor Assessment',
          'Assessee Name', 'Assessee Email', 'Assessee Position', 'Assessee Department',
          'Is Completed', 'Completed At', 'Total Responses', 'Average Rating', 'Total Rating'
        ];
      case 'pins':
        return [
          ...baseHeaders,
          'Given At', 'Week Number', 'Month', 'Year',
          'Giver Name', 'Giver Email', 'Giver Position', 'Giver Department',
          'Receiver Name', 'Receiver Email', 'Receiver Position', 'Receiver Department'
        ];
      case 'triwulan':
        return [
          ...baseHeaders,
          'Winner Name', 'Winner Email', 'Winner Position', 'Winner Department',
          'Total Score', 'Decided At'
        ];
      default:
        return baseHeaders;
    }
  }

  private static flattenData(item: any, dataType: string, options: ExportOptions) {
    const baseData = [item.id || item.assignment_id || item.pin_id || item.winner_id, item.created_at];

    if (options.includePeriodDetails) {
      baseData.push(
        item.period_id,
        item.period_month,
        item.period_year,
        item.period_start_date,
        item.period_end_date
      );
    }

    if (options.includeUserDetails) {
      baseData.push(
        item.user_id || item.assessor_id || item.giver_id || item.winner_id,
        item.user_name || item.assessor_name || item.giver_name || item.winner_name,
        item.user_email || item.assessor_email || item.giver_email || item.winner_email,
        item.user_position || item.assessor_position || item.giver_position || item.winner_position,
        item.user_department || item.assessor_department || item.giver_department || item.winner_department
      );
    }

    switch (dataType) {
      case 'assessments':
        return [
          ...baseData,
          item.assessor_name, item.assessor_email, item.assessor_position, item.assessor_department, item.is_supervisor_assessment ? 'Yes' : 'No',
          item.assessee_name, item.assessee_email, item.assessee_position, item.assessee_department,
          item.is_completed, item.completed_at, item.total_responses, item.average_rating, item.total_rating
        ];
      case 'pins':
        return [
          ...baseData,
          item.given_at, item.week_number, item.month, item.year,
          item.giver_name, item.giver_email, item.giver_position, item.giver_department,
          item.receiver_name, item.receiver_email, item.receiver_position, item.receiver_department
        ];
      case 'triwulan':
        return [
          ...baseData,
          item.winner_name, item.winner_email, item.winner_position, item.winner_department,
          item.total_score, item.decided_at
        ];
      default:
        return baseData;
    }
  }

  private static addAssessmentSheets(workbook: XLSX.WorkBook, data: any[]) {
    // Individual User Results Sheet - Similar to supervisor team view
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
      
      if (isSupervisorAssessment) {
        userData.supervisorRatings.push(parseFloat(assignment.average_rating || '0'));
      } else {
        userData.peerRatings.push(parseFloat(assignment.average_rating || '0'));
      }
    });
    
    // Calculate individual user results
    userMap.forEach((userData, userId) => {
      const supervisorAvg = userData.supervisorRatings.length > 0 
        ? userData.supervisorRatings.reduce((sum: number, r: number) => sum + r, 0) / userData.supervisorRatings.length
        : null;
      
      const peerAvg = userData.peerRatings.length > 0
        ? userData.peerRatings.reduce((sum: number, r: number) => sum + r, 0) / userData.peerRatings.length
        : null;
      
      // Calculate weighted final score (60% supervisor, 40% peer)
      let finalScore = null;
      if (supervisorAvg !== null || peerAvg !== null) {
        if (supervisorAvg !== null && peerAvg !== null) {
          finalScore = (supervisorAvg * 0.6) + (peerAvg * 0.4);
        } else if (supervisorAvg !== null) {
          finalScore = supervisorAvg;
        } else {
          finalScore = peerAvg;
        }
      }
      
      userResultsData.push([
        userData.user.name,
        userData.user.email,
        userData.user.position,
        userData.user.department,
        supervisorAvg ? supervisorAvg.toFixed(1) : 'Belum dinilai',
        peerAvg ? peerAvg.toFixed(1) : 'Belum ada',
        finalScore ? finalScore.toFixed(1) : 'N/A',
        userData.allResponses.length,
        userData.assignments.filter((a: any) => a.is_completed).length,
        userData.assignments.length
      ]);
    });
    
    if (userResultsData.length > 0) {
      const userResultsSheet = XLSX.utils.aoa_to_sheet([
        ['Nama', 'Email', 'Posisi', 'Departemen', 'Nilai Supervisor', 'Nilai Peer', 'Skor Final', 'Total Feedback', 'Assessment Selesai', 'Total Assessment'],
        ...userResultsData
      ]);
      XLSX.utils.book_append_sheet(workbook, userResultsSheet, 'Individual Results');
    }

    // Responses Detail Sheet - Enhanced with more information
    const responsesData: any[][] = [];
    data.forEach(assignment => {
      if (assignment.responses && assignment.responses.length > 0) {
        assignment.responses.forEach((response: any) => {
          responsesData.push([
            assignment.assignment_id,
            assignment.assessor_name,
            assignment.assessor_email,
            assignment.assessor_position,
            assignment.assessee_name,
            assignment.assessee_email,
            assignment.assessee_position,
            assignment.assessee_department,
            response.aspect,
            response.indicator,
            response.rating,
            response.comment || 'Tidak ada komentar',
            response.created_at,
            assignment.is_completed ? 'Selesai' : 'Belum selesai',
            assignment.completed_at || 'N/A'
          ]);
        });
      }
    });

    if (responsesData.length > 0) {
      const responsesSheet = XLSX.utils.aoa_to_sheet([
        ['Assignment ID', 'Assessor', 'Email Assessor', 'Posisi Assessor', 'Assessee', 'Email Assessee', 'Posisi Assessee', 'Departemen Assessee', 'Aspek', 'Indikator', 'Rating', 'Komentar', 'Tanggal Dibuat', 'Status', 'Tanggal Selesai'],
        ...responsesData
      ]);
      XLSX.utils.book_append_sheet(workbook, responsesSheet, 'Responses Detail');
    }

    // Comments Summary Sheet - Focus on comments only
    const commentsData: any[][] = [];
    data.forEach(assignment => {
      if (assignment.responses && assignment.responses.length > 0) {
        assignment.responses.forEach((response: any) => {
          if (response.comment && response.comment.trim() !== '') {
            commentsData.push([
              assignment.assessee_name,
              assignment.assessee_department,
              assignment.assessor_name,
              response.aspect,
              response.rating,
              response.comment,
              response.created_at
            ]);
          }
        });
      }
    });

    if (commentsData.length > 0) {
      const commentsSheet = XLSX.utils.aoa_to_sheet([
        ['Nama Karyawan', 'Departemen', 'Pemberi Feedback', 'Aspek', 'Rating', 'Komentar', 'Tanggal'],
        ...commentsData
      ]);
      XLSX.utils.book_append_sheet(workbook, commentsSheet, 'Comments Summary');
    }

    // Performance by Department Sheet
    const deptStats = this.calculateDepartmentStats(data);
    const deptSheet = XLSX.utils.aoa_to_sheet([
      ['Department', 'Total Assessments', 'Average Rating', 'Completion Rate', 'Total Employees'],
      ...deptStats
    ]);
    XLSX.utils.book_append_sheet(workbook, deptSheet, 'Department Stats');
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

  private static calculateDepartmentStats(data: any[]) {
    const deptMap = new Map();
    const uniqueEmployees = new Set();
    
    data.forEach(item => {
      const dept = item.assessee_department || 'Unknown';
      const employeeId = item.assessee_id;
      
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { total: 0, ratings: [], completed: 0, employees: new Set() });
      }
      
      const stats = deptMap.get(dept);
      stats.total++;
      stats.employees.add(employeeId);
      if (item.average_rating) stats.ratings.push(parseFloat(item.average_rating));
      if (item.is_completed) stats.completed++;
    });

    return Array.from(deptMap.entries()).map(([dept, stats]: [string, any]) => [
      dept,
      stats.total,
      stats.ratings.length > 0 ? (stats.ratings.reduce((a: number, b: number) => a + b, 0) / stats.ratings.length).toFixed(2) : '0.00',
      `${((stats.completed / stats.total) * 100).toFixed(1)}%`,
      stats.employees.size
    ]);
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
