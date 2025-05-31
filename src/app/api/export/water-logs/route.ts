import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { UserProfile, BodyMetrics } from '@/lib/types';

interface HydrationLogExport {
  date: string;
  time: string;
  amount_ml: number;
  daily_total_ml: number;
  goal_ml: number;
  percentage_of_goal: number;
  day_of_week: string;
  streak_day: number;
}

interface BodyMetricsExport {
  date: string;
  weight_kg?: number;
  waist_cm?: number;
  notes?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const format = searchParams.get('format') || 'csv'; // csv, json, excel, pdf
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeBodyMetrics = searchParams.get('includeBodyMetrics') === 'true';
    const includeWeight = searchParams.get('includeWeight') === 'true';
    const includeWaist = searchParams.get('includeWaist') === 'true';
    const includeWatermark = searchParams.get('includeWatermark') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user profile for goals and settings
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    let userProfile: UserProfile | null = null;
    
    if (userDoc.exists()) {
      userProfile = userDoc.data() as UserProfile;
    }

    const hydrationGoal = userProfile?.hydrationGoal || 2000;

    // Build query for hydration logs without orderBy to avoid index issues
    let q = query(
      collection(db, "hydration_logs"),
      where("userId", "==", userId)
    );

    // Add date range filters if provided
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      q = query(
        collection(db, "hydration_logs"),
        where("userId", "==", userId),
        where("timestamp", ">=", Timestamp.fromDate(start))
      );
    }

    if (endDate && startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      q = query(
        collection(db, "hydration_logs"),
        where("userId", "==", userId),
        where("timestamp", ">=", Timestamp.fromDate(start)),
        where("timestamp", "<=", Timestamp.fromDate(end))
      );
    }

    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        timestamp: (data.timestamp as Timestamp).toDate(),
      };
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort in JavaScript (oldest first)

    if (logs.length === 0) {
      return NextResponse.json({ error: 'No hydration logs found' }, { status: 404 });
    }

    // Process logs into export format with daily calculations
    const exportData: HydrationLogExport[] = [];
    const dailyTotals = new Map<string, number>();
    const dailyStreaks = new Map<string, number>();

    // First pass: calculate daily totals
    logs.forEach(log => {
      const dateKey = log.timestamp.toISOString().split('T')[0];
      dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + log.amount);
    });

    // Calculate streaks
    const sortedDates = Array.from(dailyTotals.keys()).sort();
    let currentStreak = 0;
    
    sortedDates.forEach((date, index) => {
      const dailyTotal = dailyTotals.get(date) || 0;
      
      if (dailyTotal >= hydrationGoal) {
        // Check if previous day was also a goal day
        if (index === 0) {
          currentStreak = 1;
        } else {
          const prevDate = sortedDates[index - 1];
          const prevTotal = dailyTotals.get(prevDate) || 0;
          if (prevTotal >= hydrationGoal) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        }
      } else {
        currentStreak = 0;
      }
      
      dailyStreaks.set(date, currentStreak);
    });

    // Second pass: create export records
    logs.forEach(log => {
      const dateKey = log.timestamp.toISOString().split('T')[0];
      const dailyTotal = dailyTotals.get(dateKey) || 0;
      const streakDay = dailyStreaks.get(dateKey) || 0;
      
      exportData.push({
        date: log.timestamp.toISOString().split('T')[0],
        time: log.timestamp.toTimeString().split(' ')[0],
        amount_ml: log.amount,
        daily_total_ml: dailyTotal,
        goal_ml: hydrationGoal,
        percentage_of_goal: Math.round((dailyTotal / hydrationGoal) * 100),
        day_of_week: log.timestamp.toLocaleDateString('en-US', { weekday: 'long' }),
        streak_day: streakDay
      });
    });

    // Calculate summary statistics
    const uniqueDays = new Set(exportData.map(log => log.date)).size;
    const totalWaterLogged = exportData.reduce((sum, log) => sum + log.amount_ml, 0);
    const averageDailyIntake = totalWaterLogged / uniqueDays;
    const goalAchievedDays = Array.from(dailyTotals.values()).filter(total => total >= hydrationGoal).length;
    const goalAchievementRate = (goalAchievedDays / uniqueDays) * 100;
    const maxStreak = Math.max(...Array.from(dailyStreaks.values()));
    const currentActiveStreak = dailyStreaks.get(sortedDates[sortedDates.length - 1]) || 0;

    // Fetch body metrics if requested
    let bodyMetricsData: BodyMetricsExport[] = [];
    if (includeBodyMetrics && (includeWeight || includeWaist)) {
      try {
        // Use simple query without orderBy to avoid index requirements
        const bodyQ = query(
          collection(db, "body_metrics"),
          where("userId", "==", userId)
        );

        const bodyQuerySnapshot = await getDocs(bodyQ);
        const allBodyMetrics = bodyQuerySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            weight_kg: data.weight_kg,
            waist_cm: data.waist_cm,
            notes: data.notes || "",
            timestamp: (data.timestamp as Timestamp).toDate(),
          } as BodyMetrics;
        });

        // Client-side filtering by date range and sorting
        let filteredMetrics = allBodyMetrics;
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          filteredMetrics = allBodyMetrics.filter(metric => {
            const metricDate = metric.timestamp;
            return metricDate >= start && metricDate <= end;
          });
        }

        // Sort by timestamp (newest first)
        filteredMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        bodyMetricsData = filteredMetrics.map(metric => {
          const exportEntry: BodyMetricsExport = {
            date: metric.timestamp.toISOString().split('T')[0],
            notes: metric.notes
          };
          
          if (includeWeight) {
            exportEntry.weight_kg = metric.weight_kg;
          }
          
          if (includeWaist) {
            exportEntry.waist_cm = metric.waist_cm;
          }
          
          return exportEntry;
        });

      } catch (error: any) {
        console.error('Error fetching body metrics, continuing without them:', error.message);
        // Continue without body metrics rather than failing the entire export
        bodyMetricsData = [];
      }
    }

    const summaryStats = {
      export_date: new Date().toISOString(),
      user_id: userId,
      user_name: userProfile?.name || 'Unknown',
      user_email: userProfile?.email || 'Unknown',
      total_logs: exportData.length,
      date_range: {
        start: exportData[0]?.date || 'N/A',
        end: exportData[exportData.length - 1]?.date || 'N/A',
        total_days: uniqueDays
      },
      hydration_goal_ml: hydrationGoal,
      totals: {
        total_water_logged_ml: totalWaterLogged,
        average_daily_intake_ml: Math.round(averageDailyIntake),
        days_goal_achieved: goalAchievedDays,
        goal_achievement_rate_percent: Math.round(goalAchievementRate),
        max_streak_days: maxStreak,
        current_streak_days: currentActiveStreak
      }
    };

    // Handle different export formats
    if (format === 'excel') {
      return generateExcelExport(summaryStats, exportData, bodyMetricsData, includeWatermark);
    }

    if (format === 'pdf') {
      return generatePDFExport(summaryStats, exportData, bodyMetricsData, includeWatermark);
    }

    // Default CSV export
    return generateCSVExport(summaryStats, exportData, bodyMetricsData, includeBodyMetrics, includeWeight, includeWaist, includeWatermark);

  } catch (error: any) {
    console.error('Error exporting water logs:', error);
    return NextResponse.json({ 
      error: 'Failed to export water logs',
      details: error.message 
    }, { status: 500 });
  }
}

async function generateExcelExport(
  summaryStats: any,
  exportData: HydrationLogExport[],
  bodyMetricsData: BodyMetricsExport[],
  includeWatermark: boolean
) {
  // Dynamic import to avoid build issues
  const XLSX = await import('xlsx');
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Water4WeightLoss - Hydration Export Report'],
    ['Generated:', summaryStats.export_date],
    ['User:', summaryStats.user_name],
    ['Email:', summaryStats.user_email],
    ['Date Range:', `${summaryStats.date_range.start} to ${summaryStats.date_range.end}`],
    ['Total Days:', summaryStats.date_range.total_days],
    ['Daily Goal:', `${summaryStats.hydration_goal_ml}ml`],
    [],
    ['📊 SUMMARY STATISTICS'],
    ['Total Water Logged:', `${summaryStats.totals.total_water_logged_ml}ml`],
    ['Average Daily Intake:', `${summaryStats.totals.average_daily_intake_ml}ml`],
    ['Goal Achievement Rate:', `${summaryStats.totals.goal_achievement_rate_percent}%`],
    ['Max Streak:', `${summaryStats.totals.max_streak_days} days`],
    ['Current Streak:', `${summaryStats.totals.current_streak_days} days`],
    [],
    includeWatermark ? ['Generated by Water4WeightLoss - Track your hydration journey'] : []
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Hydration logs sheet
  const hydrationHeaders = [
    'Date', 'Time', 'Amount (ml)', 'Daily Total (ml)', 
    'Goal (ml)', 'Goal %', 'Day of Week', 'Streak Day'
  ];
  
  const hydrationData = [
    hydrationHeaders,
    ...exportData.map(log => [
      log.date,
      log.time,
      log.amount_ml,
      log.daily_total_ml,
      log.goal_ml,
      log.percentage_of_goal,
      log.day_of_week,
      log.streak_day
    ])
  ];
  
  const hydrationSheet = XLSX.utils.aoa_to_sheet(hydrationData);
  XLSX.utils.book_append_sheet(workbook, hydrationSheet, 'Hydration Logs');
  
  // Body metrics sheet (if data exists)
  if (bodyMetricsData.length > 0) {
    const bodyHeaders = ['Date'];
    if (bodyMetricsData.some(m => m.weight_kg)) bodyHeaders.push('Weight (kg)');
    if (bodyMetricsData.some(m => m.waist_cm)) bodyHeaders.push('Waist (cm)');
    bodyHeaders.push('Notes');
    
    const bodyData = [
      bodyHeaders,
      ...bodyMetricsData.map(metric => {
        const row = [metric.date];
        if (bodyMetricsData.some(m => m.weight_kg)) row.push(metric.weight_kg?.toString() || '');
        if (bodyMetricsData.some(m => m.waist_cm)) row.push(metric.waist_cm?.toString() || '');
        row.push(metric.notes || '');
        return row;
      })
    ];
    
    const bodySheet = XLSX.utils.aoa_to_sheet(bodyData);
    XLSX.utils.book_append_sheet(workbook, bodySheet, 'Body Metrics');
  }
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  const filename = `water4weightloss-export-${new Date().toISOString().split('T')[0]}.xlsx`;
  
  return new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache'
    }
  });
}

async function generatePDFExport(
  summaryStats: any,
  exportData: HydrationLogExport[],
  bodyMetricsData: BodyMetricsExport[],
  includeWatermark: boolean
) {
  // Dynamic import to avoid build issues
  const { jsPDF } = await import('jspdf');
  
  const pdf = new jsPDF();
  
  // Load and embed logo
  let logoDataUrl = '';
  try {
    // Convert logo to base64 for embedding
    const fs = await import('fs');
    const path = await import('path');
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('Could not load logo for PDF export:', error);
  }
  
  // Define colors to match app branding
  const colors = {
    primary: [82, 113, 255] as [number, number, number], // Hydration blue
    secondary: [182, 138, 113] as [number, number, number], // Brown/tan
    success: [34, 197, 94] as [number, number, number], // Green
    purple: [168, 85, 247] as [number, number, number], // Purple
    text: [15, 23, 42] as [number, number, number], // Slate-900
    muted: [100, 116, 139] as [number, number, number], // Slate-500
    light: [248, 250, 252] as [number, number, number] // Slate-50
  };
  
  // Page setup
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;
  
  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };
  
  // Helper function to draw a section divider
  const drawSectionDivider = (y: number) => {
    pdf.setDrawColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
  };
  
  // HEADER SECTION
  // Add logo if available
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', margin, yPosition, 25, 25);
    } catch (error) {
      console.warn('Could not add logo to PDF:', error);
    }
  }
  
  // Main title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Water4WeightLoss', logoDataUrl ? margin + 35 : margin, yPosition + 18);
  
  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(16);
  pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  pdf.text('Hydration Progress Report', logoDataUrl ? margin + 35 : margin, yPosition + 26);
  
  yPosition += 45;
  
  // USER INFO SECTION
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  const userInfo = [
    { label: 'Name:', value: summaryStats.user_name },
    { label: 'Email:', value: summaryStats.user_email },
    { label: 'Report Period:', value: `${summaryStats.date_range.start} to ${summaryStats.date_range.end}` },
    { label: 'Generated:', value: new Date(summaryStats.export_date).toLocaleDateString('en-AU', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}
  ];
  
  userInfo.forEach(info => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    pdf.text(info.label, margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(info.value, margin + 35, yPosition);
    yPosition += 8;
  });
  
  yPosition += 15;
  drawSectionDivider(yPosition);
  yPosition += 20;
  
  // SUMMARY STATISTICS SECTION
  checkPageBreak(80);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text('📊 Summary Statistics', margin, yPosition);
  yPosition += 20;
  
  // Create a visually appealing stats grid
  const stats = [
    { 
      label: 'Total Water Consumed', 
      value: `${(summaryStats.totals.total_water_logged_ml / 1000).toFixed(1)}L`,
      desc: `Over ${summaryStats.date_range.total_days} days`
    },
    { 
      label: 'Daily Average', 
      value: `${(summaryStats.totals.average_daily_intake_ml / 1000).toFixed(1)}L`,
      desc: `Target: ${(summaryStats.hydration_goal_ml / 1000).toFixed(1)}L`
    },
    { 
      label: 'Goal Achievement', 
      value: `${summaryStats.totals.goal_achievement_rate_percent}%`,
      desc: `${summaryStats.totals.goal_achievement_rate_percent >= 80 ? 'Excellent!' : summaryStats.totals.goal_achievement_rate_percent >= 60 ? 'Good progress' : 'Room for improvement'}`
    },
    { 
      label: 'Longest Streak', 
      value: `${summaryStats.totals.max_streak_days} days`,
      desc: summaryStats.totals.max_streak_days > 7 ? 'Great consistency!' : 'Building habits'
    },
    { 
      label: 'Current Streak', 
      value: `${summaryStats.totals.current_streak_days} days`,
      desc: summaryStats.totals.current_streak_days > 0 ? 'Keep it up!' : 'Start fresh today'
    }
  ];
  
  // Draw stats in a clean grid layout
  stats.forEach((stat, index) => {
    const isLeftColumn = index % 2 === 0;
    const xPos = isLeftColumn ? margin : margin + (contentWidth / 2) + 10;
    const currentY = yPosition + Math.floor(index / 2) * 35;
    
    // Stat value (large)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.text(stat.value, xPos, currentY);
    
    // Stat label
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(stat.label, xPos, currentY + 8);
    
    // Stat description
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    pdf.text(stat.desc, xPos, currentY + 16);
  });
  
  yPosition += Math.ceil(stats.length / 2) * 35 + 20;
  
  // BODY METRICS SECTION (if available)
  if (bodyMetricsData.length > 0) {
    checkPageBreak(60);
    drawSectionDivider(yPosition);
    yPosition += 20;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.text('📏 Body Metrics Summary', margin, yPosition);
    yPosition += 20;
    
    const latestMetrics = bodyMetricsData[bodyMetricsData.length - 1];
    const earliestMetrics = bodyMetricsData[0];
    
    if (latestMetrics.weight_kg) {
      const weightChange = earliestMetrics.weight_kg ? 
        (latestMetrics.weight_kg - earliestMetrics.weight_kg).toFixed(1) : '0';
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.text(`Current Weight: ${latestMetrics.weight_kg}kg`, margin, yPosition);
      
      if (bodyMetricsData.length > 1 && parseFloat(weightChange) !== 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const changeColor = parseFloat(weightChange) < 0 ? colors.success : colors.muted;
        pdf.setTextColor(changeColor[0], changeColor[1], changeColor[2]);
        pdf.text(`(${parseFloat(weightChange) > 0 ? '+' : ''}${weightChange}kg change)`, margin + 80, yPosition);
      }
      yPosition += 15;
    }
    
    if (latestMetrics.waist_cm) {
      const waistChange = earliestMetrics.waist_cm ? 
        (latestMetrics.waist_cm - earliestMetrics.waist_cm).toFixed(1) : '0';
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.text(`Current Waist: ${latestMetrics.waist_cm}cm`, margin, yPosition);
      
      if (bodyMetricsData.length > 1 && parseFloat(waistChange) !== 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const changeColor = parseFloat(waistChange) < 0 ? colors.success : colors.muted;
        pdf.setTextColor(changeColor[0], changeColor[1], changeColor[2]);
        pdf.text(`(${parseFloat(waistChange) > 0 ? '+' : ''}${waistChange}cm change)`, margin + 80, yPosition);
      }
      yPosition += 15;
    }
    
    yPosition += 10;
  }
  
  // RECENT ACTIVITY SECTION
  checkPageBreak(80);
  drawSectionDivider(yPosition);
  yPosition += 20;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(colors.purple[0], colors.purple[1], colors.purple[2]);
  pdf.text('⚡ Recent Activity', margin, yPosition);
  yPosition += 20;
  
  // Show last 15 entries in a clean table format
  const recentLogs = exportData.slice(-15);
  
  // Table headers
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  const colWidths = [35, 25, 30, 40, 30];
  const headers = ['Date', 'Time', 'Amount', 'Daily Total', 'Goal %'];
  let xPos = margin;
  
  headers.forEach((header, index) => {
    pdf.text(header, xPos, yPosition);
    xPos += colWidths[index];
  });
  
  yPosition += 12;
  
  // Table content
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  recentLogs.forEach((log, index) => {
    checkPageBreak(12);
    
    // Alternate row background (simulated with subtle text color change)
    const textColor = index % 2 === 0 ? colors.text : colors.muted;
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    xPos = margin;
    const rowData = [
      new Date(log.date).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit' }),
      log.time,
      `${log.amount_ml}ml`,
      `${(log.daily_total_ml / 1000).toFixed(1)}L`,
      `${log.percentage_of_goal.toFixed(0)}%`
    ];
    
    rowData.forEach((data, colIndex) => {
      pdf.text(data, xPos, yPosition);
      xPos += colWidths[colIndex];
    });
    
    yPosition += 10;
  });
  
  // FOOTER
  yPosition = pageHeight - 30;
  
  // Professional footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  
  const footerText = includeWatermark ? 
    'Generated by Water4WeightLoss | Professional Hydration Tracking | www.water4weightloss.com.au' :
    'Professional Hydration Tracking Report';
  
  // Center the footer text
  const textWidth = pdf.getTextWidth(footerText);
  const footerX = (pageWidth - textWidth) / 2;
  pdf.text(footerText, footerX, yPosition);
  
  // Add a thin line above footer
  pdf.setDrawColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition - 8, pageWidth - margin, yPosition - 8);
  
  const pdfBuffer = pdf.output('arraybuffer');
  const filename = `water4weightloss-report-${new Date().toISOString().split('T')[0]}.pdf`;
  
  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache'
    }
  });
}

function generateCSVExport(
  summaryStats: any,
  exportData: HydrationLogExport[],
  bodyMetricsData: BodyMetricsExport[],
  includeBodyMetrics: boolean,
  includeWeight: boolean,
  includeWaist: boolean,
  includeWatermark: boolean
) {
  const csvHeaders = [
    'Date',
    'Time',
    'Amount (ml)',
    'Daily Total (ml)',
    'Goal (ml)',
    'Goal %',
    'Day of Week',
    'Streak Day'
  ];

  // Add body metrics headers if included
  if (includeBodyMetrics && includeWeight) {
    csvHeaders.push('Weight (kg)');
  }
  if (includeBodyMetrics && includeWaist) {
    csvHeaders.push('Waist (cm)');
  }
  if (includeBodyMetrics && (includeWeight || includeWaist)) {
    csvHeaders.push('Body Notes');
  }

  let csvContent = csvHeaders.join(',') + '\n';
  
  // Add summary stats as comments
  csvContent += `# Water4WeightLoss Comprehensive Export\n`;
  csvContent += `# Generated: ${summaryStats.export_date}\n`;
  csvContent += `# User: ${summaryStats.user_name} (${summaryStats.user_email})\n`;
  csvContent += `# Date Range: ${summaryStats.date_range.start} to ${summaryStats.date_range.end}\n`;
  csvContent += `# Total Days: ${summaryStats.date_range.total_days}\n`;
  csvContent += `# Hydration Goal: ${summaryStats.hydration_goal_ml}ml\n`;
  csvContent += `# Goal Achievement Rate: ${summaryStats.totals.goal_achievement_rate_percent}%\n`;
  if (includeBodyMetrics && bodyMetricsData.length > 0) {
    csvContent += `# Body Metrics Entries: ${bodyMetricsData.length}\n`;
  }
  if (includeWatermark) {
    csvContent += `# Generated by Water4WeightLoss - Track your hydration journey\n`;
  }
  csvContent += `#\n`;

  // Create a map of body metrics by date for easy lookup
  const bodyMetricsByDate = new Map<string, BodyMetricsExport>();
  bodyMetricsData.forEach(metric => {
    bodyMetricsByDate.set(metric.date, metric);
  });

  // Add data rows
  exportData.forEach(log => {
    const row = [
      log.date,
      log.time,
      log.amount_ml.toString(),
      log.daily_total_ml.toString(),
      log.goal_ml.toString(),
      log.percentage_of_goal.toString(),
      log.day_of_week,
      log.streak_day.toString()
    ];

    // Add body metrics data if available for this date
    const bodyMetric = bodyMetricsByDate.get(log.date);
    
    if (includeBodyMetrics && includeWeight) {
      row.push(bodyMetric?.weight_kg?.toString() || '');
    }
    if (includeBodyMetrics && includeWaist) {
      row.push(bodyMetric?.waist_cm?.toString() || '');
    }
    if (includeBodyMetrics && (includeWeight || includeWaist)) {
      row.push(bodyMetric?.notes ? `"${bodyMetric.notes.replace(/"/g, '""')}"` : '');
    }

    csvContent += row.join(',') + '\n';
  });

  // Add separate body metrics section if there are entries not matched with hydration logs
  const unMatchedBodyMetrics = bodyMetricsData.filter(metric => 
    !exportData.some(log => log.date === metric.date)
  );

  if (unMatchedBodyMetrics.length > 0) {
    csvContent += '\n# Additional Body Metrics (dates without hydration logs)\n';
    unMatchedBodyMetrics.forEach(metric => {
      const row = [
        metric.date,
        '', // No time for body metrics
        '', '', '', '', '', '' // Empty hydration columns
      ];
      
      if (includeBodyMetrics && includeWeight) {
        row.push(metric.weight_kg?.toString() || '');
      }
      if (includeBodyMetrics && includeWaist) {
        row.push(metric.waist_cm?.toString() || '');
      }
      if (includeBodyMetrics && (includeWeight || includeWaist)) {
        row.push(metric.notes ? `"${metric.notes.replace(/"/g, '""')}"` : '');
      }

      csvContent += row.join(',') + '\n';
    });
  }

  const filename = `water4weightloss-export-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache'
    }
  });
} 