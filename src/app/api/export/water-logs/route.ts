import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { UserProfile, BodyMetrics } from '@/lib/types';
import path from 'path';
import fs from 'fs';

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
        // TEMPORARILY DISABLED DUE TO FIREBASE INDEX REQUIREMENTS
        // Firebase needs composite index: userId + timestamp
        // For now, we'll continue without body metrics to prevent API failures
        console.log('Body metrics export temporarily disabled - Firebase index required');
        bodyMetricsData = [];
        
        /*
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
        */

      } catch (error: any) {
        console.error('Error fetching body metrics, continuing without them:', error.message);
        // Continue without body metrics rather than failing the entire export
        bodyMetricsData = [];
      }
    }

    const summaryStats = {
      export_date: new Date().toISOString(),
      user_id: userId,
      user_name: userProfile?.name?.split(' ')[0] || userProfile?.email?.split('@')[0] || 'User',
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
        current_streak_days: currentActiveStreak,
        total_days_tracked: uniqueDays
      },
      body_metrics: bodyMetricsData
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
  
  // Define branded colors to match the app - BRAND COLORS
  const colors = {
    slate: '#334155',        // App background
    brown: '#b68a71',        // App highlight/header color
    blue: '#5271FF',         // Hydration blue
    wheat: '#F1E5A6',        // Soft wheat color
    dark: '#334155',         // Dark slate
    muted: '#64748B',        // Muted text
    light: '#F8FAFC'         // Light background
  };
  
  // Page setup
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;
  let yPosition = margin;
  
  // HEADER SECTION - Professional header with brand colors
  pdf.setFillColor('#334155'); // App slate background
  pdf.rect(0, 0, pageWidth, 60, 'F');
  
  // Add logo if available
  try {
    // Try to load the logo and add it to PDF
    const logoPath = path.join(process.cwd(), 'public', 'Logo (1).png');
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      const logoBase64 = logoData.toString('base64');
      pdf.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin + 10, 15, 30, 30);
    }
  } catch (error) {
    console.log('Logo not found, continuing without logo');
  }
  
  // App title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor('#b68a71'); // Brown brand color
  pdf.text('Water4WeightLoss', margin + 50, 32);
  
  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor('#b68a71'); // Brown brand color
  pdf.text('Hydration and Weight Tracking', margin + 50, 45);
  
  yPosition = 80;
  
  // USER INFO SECTION
  pdf.setFillColor('#334155'); // App slate background
  pdf.rect(margin, yPosition - 5, pageWidth - margin * 2, 30, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor('#b68a71'); // Brown brand color for user name
  const userName = summaryStats.user_name || 'User';
  pdf.text(`${userName}'s Progress`, margin + 10, yPosition + 10);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(148, 163, 184); // Gray text for date range
  pdf.text(`${summaryStats.date_range.start} to ${summaryStats.date_range.end}`, margin + 10, yPosition + 22);
  
  yPosition += 50;
  
  // SUMMARY STATISTICS - 2x2 Grid like social media
  const cardWidth = (pageWidth - margin * 2 - 10) / 2; // 2 columns
  const cardHeight = 40;
  let cardX = margin;
  let cardY = yPosition;
  
  // Calculate summary stats
  const totalWaterL = Math.round((exportData.reduce((sum: number, log: any) => sum + (log.amount_ml || 0), 0) / 1000) * 10) / 10;
  const daysTracked = summaryStats.date_range.total_days || 0;
  const goalAchievement = summaryStats.totals.goal_achievement_rate_percent || 0;
  const maxStreak = summaryStats.totals.max_streak_days || 0;
  
  // Card 1: Total Water (Blue)
  pdf.setFillColor('#5271FF'); // Hydration blue
  pdf.rect(cardX, cardY, cardWidth, cardHeight, 'F');
  pdf.setDrawColor('#4361EE'); // Darker blue border
  pdf.setLineWidth(1);
  pdf.rect(cardX, cardY, cardWidth, cardHeight, 'S');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255); // White text
  pdf.text(`${totalWaterL}L`, cardX + 10, cardY + 20);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Total Water', cardX + 10, cardY + 30);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(240, 240, 240); // Light gray
  pdf.text(`Over ${daysTracked} days`, cardX + 10, cardY + 37);
  
  // Card 2: Goal Achievement (Brown)
  cardX = margin + cardWidth + 10;
  pdf.setFillColor('#b68a71'); // Brown brand color
  pdf.rect(cardX, cardY, cardWidth, cardHeight, 'F');
  pdf.setDrawColor('#8b6f47'); // Darker brown border
  pdf.rect(cardX, cardY, cardWidth, cardHeight, 'S');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255); // White text
  pdf.text(`${goalAchievement}%`, cardX + 10, cardY + 20);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Goal Achievement', cardX + 10, cardY + 30);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(240, 240, 240); // Light gray
  pdf.text(goalAchievement >= 80 ? 'Excellent progress!' : 'Keep going!', cardX + 10, cardY + 37);
  
  // Card 3: Max Streak (Wheat)
  cardX = margin;
  cardY += cardHeight + 10;
  pdf.setFillColor('#F1E5A6'); // Wheat color
  pdf.rect(cardX, cardY, cardWidth, cardHeight, 'F');
  pdf.setDrawColor('#D4C374'); // Darker wheat border
  pdf.rect(cardX, cardY, cardWidth, cardHeight, 'S');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor('#334155'); // Dark slate text for contrast
  pdf.text(`${maxStreak}`, cardX + 10, cardY + 20);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor('#334155'); // Dark slate text
  pdf.text('Max Streak', cardX + 10, cardY + 30);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor('#334155'); // Dark slate text
  pdf.text('Building habits', cardX + 10, cardY + 37);
  
  // Card 4: Days Tracked (Blue)
  cardX = margin + cardWidth + 10;
  pdf.setFillColor('#5271FF'); // Hydration blue
  pdf.rect(cardX, cardY, cardWidth, cardHeight, 'F');
  pdf.setDrawColor('#4361EE'); // Darker blue border
  pdf.rect(cardX, cardY, cardWidth, cardHeight, 'S');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255); // White text
  pdf.text(`${daysTracked}`, cardX + 10, cardY + 20);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Days Tracked', cardX + 10, cardY + 30);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(240, 240, 240); // Light gray
  pdf.text('Consistent monitoring', cardX + 10, cardY + 37);
  
  yPosition = cardY + cardHeight + 20;
  
  // BODY METRICS SECTION (if available)
  if (bodyMetricsData.length > 0) {
    const latestMetrics = bodyMetricsData[bodyMetricsData.length - 1];
    
    // Body Metrics background - brown brand color
    pdf.setFillColor('#b68a71'); // Brown brand color
    pdf.rect(margin, yPosition - 5, pageWidth - margin * 2, 50, 'F');
    pdf.setDrawColor('#8b6f47'); // Darker brown border
    pdf.setLineWidth(1);
    pdf.rect(margin, yPosition - 5, pageWidth - margin * 2, 50, 'S');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255); // White text
    pdf.text('📊 Body Metrics', margin + 10, yPosition + 10);
    
    // Metrics cards
    const metricsCardWidth = (pageWidth - margin * 2 - 30) / 2;
    let metricsX = margin + 10;
    
    if (latestMetrics.weight_kg) {
      // Weight card
      pdf.setFillColor(255, 255, 255, 0.2); // Semi-transparent white
      pdf.rect(metricsX, yPosition + 15, metricsCardWidth, 25, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${latestMetrics.weight_kg}kg`, metricsX + 5, yPosition + 27);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Current Weight', metricsX + 5, yPosition + 35);
      
      metricsX += metricsCardWidth + 10;
    }
    
    if (latestMetrics.waist_cm) {
      // Waist card
      pdf.setFillColor(255, 255, 255, 0.2); // Semi-transparent white
      pdf.rect(metricsX, yPosition + 15, metricsCardWidth, 25, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${latestMetrics.waist_cm}cm`, metricsX + 5, yPosition + 27);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Current Waist', metricsX + 5, yPosition + 35);
    }
    
    yPosition += 60;
  }
  
  // FOOTER SECTION
  yPosition = pageHeight - 30; // Position near bottom
  
  pdf.setFillColor('#b68a71'); // Brown brand background
  pdf.rect(margin, yPosition - 5, pageWidth - margin * 2, 20, 'F');
  pdf.setDrawColor('#8b6f47'); // Darker brown border
  pdf.setLineWidth(0.5);
  pdf.rect(margin, yPosition - 5, pageWidth - margin * 2, 20, 'S');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255); // White text for brand name
  pdf.text('Generated by water4weightloss.com.au', margin + 10, yPosition + 5);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255); // White text
  pdf.text('Track your hydration journey with us', margin + 10, yPosition + 12);
  
  // Add watermark if requested
  if (includeWatermark) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Downscale Weight Loss Clinic', pageWidth - margin - 50, yPosition + 12);
  }
  
  return pdf.output('arraybuffer');
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