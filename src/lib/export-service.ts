// src/lib/export-service.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { ASSESSMENT_ASPECTS } from '@/lib/assessment-data'

export class ExportService {
  static async exportToPDF(data: any, type: 'individual' | 'team' | 'summary', title: string) {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.width
    const pageHeight = pdf.internal.pageSize.height
    
    // Header
    pdf.setFontSize(20)
    pdf.setTextColor(59, 130, 246) // Blue color
    pdf.text('BPS Kota Batu - 360° Feedback System', 20, 20)
    
    pdf.setFontSize(16)
    pdf.setTextColor(0, 0, 0)
    pdf.text(title, 20, 35)
    
    pdf.setFontSize(10)
    pdf.setTextColor(128, 128, 128)
    pdf.text(`Generated on: ${new Date().toLocaleDateString('id-ID')}`, 20, 45)
    
    let yPosition = 60
    
    if (type === 'individual') {
      yPosition = this.addIndividualReport(pdf, data, yPosition, pageWidth, pageHeight)
    } else if (type === 'team') {
      yPosition = this.addTeamReport(pdf, data, yPosition, pageWidth, pageHeight)
    } else if (type === 'summary') {
      yPosition = this.addSummaryReport(pdf, data, yPosition, pageWidth, pageHeight)
    }
    
    // Footer
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(128, 128, 128)
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10)
    }
    
    pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`)
  }

  private static addIndividualReport(pdf: jsPDF, data: any, yPosition: number, pageWidth: number, pageHeight: number): number {
    // Employee Info
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 0)
    pdf.text('Employee Information', 20, yPosition)
    yPosition += 10
    
    pdf.setFontSize(10)
    pdf.text(`Name: ${data.employee?.full_name || 'N/A'}`, 25, yPosition)
    yPosition += 8
    pdf.text(`Position: ${data.employee?.position || 'N/A'}`, 25, yPosition)
    yPosition += 8
    pdf.text(`Department: ${data.employee?.department || 'N/A'}`, 25, yPosition)
    yPosition += 15
    
    // Overall Rating
    pdf.setFontSize(14)
    pdf.text('Overall Performance', 20, yPosition)
    yPosition += 10
    
    const overallRating = data.overallRating || 0
    pdf.setFontSize(12)
    pdf.setTextColor(59, 130, 246)
    pdf.text(`Overall Rating: ${overallRating.toFixed(1)}/10`, 25, yPosition)
    yPosition += 8
    
    pdf.setTextColor(0, 0, 0)
    pdf.text(`Total Feedback: ${data.totalFeedback || 0}`, 25, yPosition)
    yPosition += 15
    
    // Aspect Ratings
    pdf.setFontSize(14)
    pdf.text('Aspect Ratings', 20, yPosition)
    yPosition += 10
    
    if (data.aspectResults) {
      data.aspectResults.forEach((aspect: any) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage()
          yPosition = 20
        }
        
        pdf.setFontSize(10)
        pdf.text(`${aspect.aspect}: ${aspect.rating.toFixed(1)}/10`, 25, yPosition)
        yPosition += 8
      })
    }
    
    return yPosition
  }

  private static addTeamReport(pdf: jsPDF, data: any[], yPosition: number, pageWidth: number, pageHeight: number): number {
    // Team Summary
    pdf.setFontSize(14)
    pdf.text('Team Summary', 20, yPosition)
    yPosition += 10
    
    const avgRating = data.length > 0 
      ? data.reduce((sum, emp) => sum + (emp.averageRating || 0), 0) / data.length 
      : 0
    
    pdf.setFontSize(10)
    pdf.text(`Total Employees: ${data.length}`, 25, yPosition)
    yPosition += 8
    pdf.text(`Average Team Rating: ${avgRating.toFixed(1)}/10`, 25, yPosition)
    yPosition += 15
    
    // Employee List
    pdf.setFontSize(14)
    pdf.text('Employee Performance', 20, yPosition)
    yPosition += 10
    
    // Table Header
    pdf.setFontSize(9)
    pdf.setTextColor(128, 128, 128)
    pdf.text('Name', 25, yPosition)
    pdf.text('Position', 80, yPosition)
    pdf.text('Rating', 130, yPosition)
    pdf.text('Feedback', 160, yPosition)
    yPosition += 8
    
    // Draw line
    pdf.line(20, yPosition - 2, pageWidth - 20, yPosition - 2)
    yPosition += 5
    
    data.forEach((emp) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = 20
      }
      
      pdf.setTextColor(0, 0, 0)
      pdf.text(emp.employee?.full_name || 'N/A', 25, yPosition)
      pdf.text(emp.employee?.position || 'N/A', 80, yPosition)
      pdf.text(`${(emp.averageRating || 0).toFixed(1)}/10`, 130, yPosition)
      pdf.text(`${emp.totalFeedback || 0}`, 160, yPosition)
      yPosition += 8
    })
    
    return yPosition
  }

  private static addSummaryReport(pdf: jsPDF, data: any, yPosition: number, pageWidth: number, pageHeight: number): number {
    // Add summary statistics and charts data
    pdf.setFontSize(14)
    pdf.text('Assessment Summary', 20, yPosition)
    yPosition += 15
    
    // Add more summary content based on your needs
    return yPosition
  }

  static exportToExcel(data: any, type: 'individual' | 'team' | 'summary', filename: string) {
    const workbook = XLSX.utils.book_new()
    
    if (type === 'individual') {
      this.addIndividualExcelSheet(workbook, data)
    } else if (type === 'team') {
      this.addTeamExcelSheet(workbook, data)
    } else if (type === 'summary') {
      this.addSummaryExcelSheet(workbook, data)
    }
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${filename}_${new Date().getTime()}.xlsx`)
  }

  private static addIndividualExcelSheet(workbook: XLSX.WorkBook, data: any) {
    // Employee Info Sheet
    const employeeInfo = [
      ['Employee Information'],
      ['Name', data.employee?.full_name || 'N/A'],
      ['Position', data.employee?.position || 'N/A'],
      ['Department', data.employee?.department || 'N/A'],
      ['Email', data.employee?.email || 'N/A'],
      [],
      ['Overall Performance'],
      ['Overall Rating', `${(data.overallRating || 0).toFixed(1)}/10`],
      ['Total Feedback', data.totalFeedback || 0],
    ]
    
    const employeeSheet = XLSX.utils.aoa_to_sheet(employeeInfo)
    XLSX.utils.book_append_sheet(workbook, employeeSheet, 'Employee Info')
    
    // Aspect Ratings Sheet
    if (data.aspectResults) {
      const aspectData = [
        ['Aspect', 'Average Rating', 'Total Responses'],
        ...data.aspectResults.map((aspect: any) => [
          aspect.aspect,
          aspect.rating.toFixed(1),
          aspect.totalResponses
        ])
      ]
      
      const aspectSheet = XLSX.utils.aoa_to_sheet(aspectData)
      XLSX.utils.book_append_sheet(workbook, aspectSheet, 'Aspect Ratings')
    }
    
    // Comments Sheet
    if (data.comments && data.comments.length > 0) {
      const commentsData = [
        ['Aspect', 'Rating', 'Comment'],
        ...data.comments.map((comment: any) => [
          this.getAspectName(comment.aspect),
          comment.rating,
          comment.comment
        ])
      ]
      
      const commentsSheet = XLSX.utils.aoa_to_sheet(commentsData)
      XLSX.utils.book_append_sheet(workbook, commentsSheet, 'Comments')
    }
  }

  private static addTeamExcelSheet(workbook: XLSX.WorkBook, data: any[]) {
    // Team Overview Sheet
    const avgRating = data.length > 0 
      ? data.reduce((sum, emp) => sum + (emp.averageRating || 0), 0) / data.length 
      : 0
    
    const teamOverview = [
      ['Team Performance Summary'],
      ['Total Employees', data.length],
      ['Average Team Rating', `${avgRating.toFixed(1)}/10`],
      ['Top Performers (8+)', data.filter(emp => (emp.averageRating || 0) >= 8).length],
      ['Need Improvement (<6)', data.filter(emp => (emp.averageRating || 0) < 6).length],
    ]
    
    const overviewSheet = XLSX.utils.aoa_to_sheet(teamOverview)
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Team Overview')
    
    // Detailed Team Data
    const teamData = [
      ['Name', 'Position', 'Department', 'Email', 'Average Rating', 'Total Feedback'],
      ...data.map(emp => [
        emp.employee?.full_name || 'N/A',
        emp.employee?.position || 'N/A',
        emp.employee?.department || 'N/A',
        emp.employee?.email || 'N/A',
        (emp.averageRating || 0).toFixed(1),
        emp.totalFeedback || 0
      ])
    ]
    
    const teamSheet = XLSX.utils.aoa_to_sheet(teamData)
    XLSX.utils.book_append_sheet(workbook, teamSheet, 'Team Details')
  }

  private static addSummaryExcelSheet(workbook: XLSX.WorkBook, data: any) {
    // Add summary data based on your requirements
    const summaryData = [
      ['Assessment Summary'],
      ['Generated Date', new Date().toLocaleDateString('id-ID')],
      // Add more summary data
    ]
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  }

  private static getAspectName(aspectId: string): string {
    const aspect = ASSESSMENT_ASPECTS.find((a: any) => a.id === aspectId)
    return aspect?.name || aspectId
  }

  static async exportChartAsPNG(chartElementId: string, filename: string) {
    const element = document.getElementById(chartElementId)
    if (!element) {
      throw new Error('Chart element not found')
    }
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true
    })
    
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${filename}_${new Date().getTime()}.png`)
      }
    })
  }

  static exportToCSV(data: any[], filename: string, headers: string[]) {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || ''
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      }).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${filename}_${new Date().getTime()}.csv`)
  }
}