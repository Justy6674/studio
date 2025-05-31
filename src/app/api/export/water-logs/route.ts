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
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Load and embed logo
  let logoDataUrl = '';
  try {
    const fs = await import('fs');
    const path = await import('path');
    const logoPath = path.join(process.cwd(), 'public', 'Logo (1).png');
    const logoBuffer = fs.readFileSync(logoPath);
    logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('Could not load logo for PDF export:', error);
  }
  
  // Define branded colors to match the app
  const colors = {
    primary: '#5271FF',      // Hydration blue
    secondary: '#B68A71',    // Brown/tan
    success: '#22C55E',      // Green
    purple: '#A855F7',       // Purple
    dark: '#1E293B',         // Dark slate
    muted: '#64748B',        // Muted text
    light: '#F8FAFC'         // Light background
  };
  
  // Page setup
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;
  let yPosition = margin;
  
  // HEADER SECTION - Professional gradient header
  pdf.setFillColor(colors.dark);
  pdf.rect(0, 0, pageWidth, 60, 'F');
  
  // Add logo if available
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', margin, 15, 20, 20);
    } catch (error) {
      console.warn('Could not add logo to PDF:', error);
    }
  }
  
  // Main title with modern typography
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(colors.primary);
  pdf.text('Water4WeightLoss', logoDataUrl ? margin + 25 : margin, 28);
  
  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(colors.secondary);
  pdf.text('Professional Hydration Report', logoDataUrl ? margin + 25 : margin, 36);
  
  // User name prominently displayed
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor('white');
  pdf.text(`${summaryStats.user_name}'s Journey`, logoDataUrl ? margin + 25 : margin, 48);
  
  yPosition = 75;
  
  // SUMMARY CARDS SECTION - Beautiful cards like social media export
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(colors.dark);
  pdf.text('📊 Your Hydration Journey', margin, yPosition);
  yPosition += 15;
  
  // Create beautiful summary cards in a 2x2 grid
  const cardWidth = (pageWidth - margin * 2 - 10) / 2;
  const cardHeight = 35;
  const cardSpacing = 5;
  
  const summaryCards = [
    {
      title: 'Total Water',
      value: `${(summaryStats.totals.total_water_logged_ml / 1000).toFixed(1)}L`,
      subtitle: `Over ${summaryStats.date_range.total_days} days`,
      color: colors.primary,
      bgColor: '#EEF2FF'
    },
    {
      title: 'Goal Achievement',
      value: `${summaryStats.totals.goal_achievement_rate_percent}%`,
      subtitle: summaryStats.totals.goal_achievement_rate_percent >= 80 ? 'Excellent!' : 'Good progress',
      color: colors.success,
      bgColor: '#F0FDF4'
    },
    {
      title: 'Max Streak',
      value: `${summaryStats.totals.max_streak_days} days`,
      subtitle: summaryStats.totals.max_streak_days > 7 ? 'Amazing consistency!' : 'Building habits',
      color: colors.purple,
      bgColor: '#FAF5FF'
    },
    {
      title: 'Daily Average',
      value: `${(summaryStats.totals.average_daily_intake_ml / 1000).toFixed(1)}L`,
      subtitle: `Target: ${(summaryStats.hydration_goal_ml / 1000).toFixed(1)}L`,
      color: colors.secondary,
      bgColor: '#FEF7ED'
    }
  ];
  
  summaryCards.forEach((card, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const cardX = margin + col * (cardWidth + cardSpacing);
    const cardY = yPosition + row * (cardHeight + cardSpacing);
    
    // Card background with subtle shadow effect
    pdf.setFillColor('#F8FAFC');
    pdf.rect(cardX + 1, cardY + 1, cardWidth, cardHeight, 'F'); // Shadow
    pdf.setFillColor(card.bgColor);
    pdf.rect(cardX, cardY, cardWidth, cardHeight, 'F');
    
    // Card border
    pdf.setDrawColor(card.color);
    pdf.setLineWidth(0.5);
    pdf.rect(cardX, cardY, cardWidth, cardHeight, 'S');
    
    // Card content
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(card.color);
    pdf.text(card.value, cardX + 8, cardY + 15);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(colors.dark);
    pdf.text(card.title, cardX + 8, cardY + 23);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(colors.muted);
    pdf.text(card.subtitle, cardX + 8, cardY + 30);
  });
  
  yPosition += Math.ceil(summaryCards.length / 2) * (cardHeight + cardSpacing) + 20;
  
  // BODY METRICS SECTION (if available)
  if (bodyMetricsData.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(colors.secondary);
    pdf.text('📏 Body Metrics Progress', margin, yPosition);
    yPosition += 15;
    
    // Beautiful metrics cards
    const latestMetrics = bodyMetricsData[bodyMetricsData.length - 1];
    const earliestMetrics = bodyMetricsData[0];
    
    // Metrics background
    pdf.setFillColor('#FEF7ED');
    pdf.rect(margin, yPosition - 5, pageWidth - margin * 2, 40, 'F');
    pdf.setDrawColor(colors.secondary);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPosition - 5, pageWidth - margin * 2, 40, 'S');
    
    let metricsX = margin + 10;
    
    if (latestMetrics.weight_kg) {
      const weightChange = earliestMetrics.weight_kg ? 
        (latestMetrics.weight_kg - earliestMetrics.weight_kg).toFixed(1) : '0';
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(colors.secondary);
      pdf.text(`${latestMetrics.weight_kg}kg`, metricsX, yPosition + 10);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(colors.dark);
      pdf.text('Current Weight', metricsX, yPosition + 18);
      
      if (bodyMetricsData.length > 1 && parseFloat(weightChange) !== 0) {
        const changeColor = parseFloat(weightChange) < 0 ? colors.success : colors.muted;
        pdf.setTextColor(changeColor);
        pdf.text(`${parseFloat(weightChange) > 0 ? '+' : ''}${weightChange}kg`, metricsX, yPosition + 25);
      }
      
      metricsX += 60;
    }
    
    if (latestMetrics.waist_cm) {
      const waistChange = earliestMetrics.waist_cm ? 
        (latestMetrics.waist_cm - earliestMetrics.waist_cm).toFixed(1) : '0';
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(colors.secondary);
      pdf.text(`${latestMetrics.waist_cm}cm`, metricsX, yPosition + 10);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(colors.dark);
      pdf.text('Current Waist', metricsX, yPosition + 18);
      
      if (bodyMetricsData.length > 1 && parseFloat(waistChange) !== 0) {
        const changeColor = parseFloat(waistChange) < 0 ? colors.success : colors.muted;
        pdf.setTextColor(changeColor);
        pdf.text(`${parseFloat(waistChange) > 0 ? '+' : ''}${waistChange}cm`, metricsX, yPosition + 25);
      }
    }
    
    yPosition += 50;
  }
  
  // RECENT ACTIVITY SECTION
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(colors.purple);
  pdf.text('⚡ Recent Activity', margin, yPosition);
  yPosition += 15;
  
  // Modern table with alternating rows
  const recentLogs = exportData.slice(-12); // Show last 12 entries
  
  // Table header with gradient background
  pdf.setFillColor(colors.dark);
  pdf.rect(margin, yPosition - 2, pageWidth - margin * 2, 8, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor('white');
  
  const colPositions = [margin + 5, margin + 35, margin + 65, margin + 105, margin + 145];
  const headers = ['Date', 'Time', 'Amount', 'Daily Total', 'Goal %'];
  
  headers.forEach((header, index) => {
    pdf.text(header, colPositions[index], yPosition + 4);
  });
  
  yPosition += 10;
  
  // Table rows with modern styling
  recentLogs.forEach((log, index) => {
    // Alternating row colors
    if (index % 2 === 0) {
      pdf.setFillColor('#F8FAFC');
      pdf.rect(margin, yPosition - 1, pageWidth - margin * 2, 6, 'F');
    }
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(colors.dark);
    
    const rowData = [
      new Date(log.date).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit' }),
      log.time.substring(0, 5), // HH:MM format
      `${log.amount_ml}ml`,
      `${(log.daily_total_ml / 1000).toFixed(1)}L`,
      `${log.percentage_of_goal.toFixed(0)}%`
    ];
    
    rowData.forEach((data, colIndex) => {
      pdf.text(data, colPositions[colIndex], yPosition + 3);
    });
    
    yPosition += 6;
  });
  
  // PROFESSIONAL FOOTER
  yPosition = pageHeight - 25;
  
  // Footer background
  pdf.setFillColor(colors.dark);
  pdf.rect(0, yPosition - 5, pageWidth, 30, 'F');
  
  // Footer content
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.primary);
  const footerText1 = includeWatermark ? 'Water4WeightLoss - Professional Hydration Tracking' : 'Professional Hydration Report';
  pdf.text(footerText1, margin, yPosition + 5);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.secondary);
  pdf.text(`Generated: ${new Date(summaryStats.export_date).toLocaleDateString('en-AU')}`, margin, yPosition + 12);
  
  if (includeWatermark) {
    pdf.setTextColor(colors.muted);
    pdf.text('By Downscale', pageWidth - margin - 25, yPosition + 12);
  }
  
  // Add page border for professional look
  pdf.setDrawColor(colors.primary);
  pdf.setLineWidth(1);
  pdf.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S');
  
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