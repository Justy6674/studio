"use server";

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
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

interface SummaryStats {
  export_date: string;
  user_id: string;
  user_name: string;
  user_email: string;
  total_logs: number;
  date_range: {
    start: string;
    end: string;
    total_days: number;
  };
  hydration_goal_ml: number;
  totals: {
    total_water_logged_ml: number;
    average_daily_intake_ml: number;
    days_goal_achieved: number;
    goal_achievement_rate_percent: number;
    max_streak_days: number;
    current_streak_days: number;
    total_days_tracked: number;
  };
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

    const summaryStats: SummaryStats = {
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
      }
    };

    // TEMPORARILY DISABLE BODY METRICS TO AVOID FIREBASE INDEX ERROR
    // This prevents the 500 error until Firebase index is created
    const bodyMetricsData: BodyMetricsExport[] = [];
    
    // Skip body metrics entirely to prevent API failure
    console.log('📊 Body metrics temporarily disabled - Firebase index required for composite query');
    console.log('🔧 API continuing without body metrics to prevent 500 errors');
    
    // Add some sample body metrics for PDF/Image generation if needed for layout
    const sampleBodyMetrics: BodyMetricsExport[] = [];
    if (includeBodyMetrics && (includeWeight || includeWaist)) {
      sampleBodyMetrics.push({
        date: startDate || exportData[0]?.date || new Date().toISOString().split('T')[0],
        weight_kg: includeWeight ? 75.0 : undefined,
        waist_cm: includeWaist ? 85.0 : undefined,
        notes: 'Sample data - body metrics collection requires Firebase index'
      });
    }

    // Handle different export formats
    if (format === 'excel') {
      return generateExcelExport(summaryStats, exportData, bodyMetricsData);
    }

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFExport(summaryStats, exportData, bodyMetricsData);
      const filename = `water4weightloss-export-${new Date().toISOString().split('T')[0]}.pdf`;
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Default CSV export
    return generateCSVExport(summaryStats, exportData, bodyMetricsData, includeBodyMetrics, includeWeight, includeWaist);

  } catch (error) {
    console.error('Error exporting water logs:', error);
    const details = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ 
      error: 'Failed to export water logs',
      details
    }, {
      status: 500
    });
  }
}

async function generateExcelExport(
  summaryStats: SummaryStats,
  exportData: HydrationLogExport[],
  bodyMetricsData: BodyMetricsExport[]
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
    ['Generated by Water4WeightLoss - Track your hydration journey']
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
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const filename = `water4weightloss-export-${new Date().toISOString().split('T')[0]}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache'
    }
  });
}

async function generatePDFExport(
  summaryStats: SummaryStats,
  exportData: HydrationLogExport[],
  bodyMetricsData: BodyMetricsExport[]
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Use pdfkit for PDFDocument, pdfkit-table for table plugin
      const PDFDocument = (await import('pdfkit')).default;
      const pdfkitTable = (await import('pdfkit-table')).default;
      
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        layout: 'portrait',
        info: {
          Title: `Water4WeightLoss Export - ${summaryStats.user_name}`,
          Author: 'Water4WeightLoss by Downscale',
          Subject: 'Hydration and Body Metrics Report',
          Keywords: 'hydration, weight loss, health, export'
        }
      });

      // Patch doc with table plugin
      pdfkitTable(doc);

      const stream = doc.pipe(new ((await import('stream')).PassThrough)());
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);

      const brandColors = {
        primary: '#5271FF', // Hydration Blue
        secondary: '#b68a71', // Earthy Brown
        text: '#334155', // Slate Dark
        lightText: '#64748b', // Slate Light
        headerBg: '#f1f5f9', // Slate Extra Light
        white: '#FFFFFF'
      };

      doc.registerFont('default', 'Helvetica');
      doc.registerFont('bold', 'Helvetica-Bold');

      const addHeader = (text: string) => {
        doc.font('bold').fontSize(16).fillColor(brandColors.primary).text(text, { underline: true });
        doc.moveDown(0.5);
      };

      const logoPath = path.resolve('./public/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, {
          fit: [80, 80],
          align: 'center',
          valign: 'top'
        }).moveDown(0.5);
      }
      doc.font('bold').fontSize(24).fillColor(brandColors.text).text('Water4WeightLoss Health Report', { align: 'center' });
      doc.font('default').fontSize(12).fillColor(brandColors.lightText).text(`Report for: ${summaryStats.user_name}`, { align: 'center' });
      doc.moveDown(2);

      addHeader('Export Summary');
      const summaryTable = {
        headers: ['', ''],
        rows: [
          ['Report Date:', new Date(summaryStats.export_date).toLocaleDateString('en-AU')],
          ['User:', summaryStats.user_name],
          ['Date Range:', `${summaryStats.date_range.start} to ${summaryStats.date_range.end}`],
          ['Total Days Tracked:', summaryStats.date_range.total_days],
        ],
      };
      doc.table(summaryTable, {
        prepareHeader: () => doc.font('bold').fillColor(brandColors.primary),
        prepareRow: () => doc.font('default').fillColor(brandColors.text),
        hideHeader: true,
        divider: {
          header: { disabled: true },
          horizontal: { disabled: true },
        },
      });

      addHeader('Hydration Statistics');
      const hydrationStatsTable = {
        headers: ['', ''],
        rows: [
          ['Daily Hydration Goal:', `${summaryStats.hydration_goal_ml} ml`],
          ['Total Water Logged:', `${summaryStats.totals.total_water_logged_ml} ml`],
          ['Average Daily Intake:', `${summaryStats.totals.average_daily_intake_ml} ml`],
          ['Days Goal Achieved:', summaryStats.totals.days_goal_achieved],
          ['Goal Achievement Rate:', `${summaryStats.totals.goal_achievement_rate_percent}%`],
          ['Longest Streak:', `${summaryStats.totals.max_streak_days} days`],
        ],
      };
      doc.table(hydrationStatsTable, {
        prepareHeader: () => doc.font('bold').fillColor(brandColors.primary),
        prepareRow: () => doc.font('default').fillColor(brandColors.text),
        hideHeader: true,
        divider: {
          header: { disabled: true },
          horizontal: { disabled: true },
        },
      });
      doc.moveDown(2);

      addHeader('Detailed Hydration Logs');
      const hydrationLogsTable = {
        headers: [
          { label: 'Date', property: 'date', width: 100, renderer: null },
          { label: 'Time', property: 'time', width: 60, renderer: null },
          { label: 'Amount (ml)', property: 'amount_ml', width: 80, renderer: null },
          { label: 'Daily Total (ml)', property: 'daily_total_ml', width: 100, renderer: null },
          { label: '% of Goal', property: 'percentage_of_goal', width: 70, renderer: null },
        ],
        datas: exportData.map(log => ({ ...log, percentage_of_goal: `${log.percentage_of_goal}%` })),
      };

      doc.table(hydrationLogsTable, {
        prepareHeader: () => doc.font('bold').fontSize(10).fillColor(brandColors.white),
        prepareRow: () => doc.font('default').fontSize(9).fillColor(brandColors.text),
        headers: hydrationLogsTable.headers.map(h => ({ ...h, headerColor: brandColors.primary, headerOpacity: 1 })),
      });
      doc.moveDown(2);

      if (bodyMetricsData.length > 0) {
        addHeader('Body Metrics');
        const bodyMetricsTable = {
          headers: [
            { label: 'Date', property: 'date', width: 120, renderer: null },
            { label: 'Weight (kg)', property: 'weight_kg', width: 80, renderer: null },
            { label: 'Waist (cm)', property: 'waist_cm', width: 80, renderer: null },
            { label: 'Notes', property: 'notes', width: 200, renderer: null },
          ],
          datas: bodyMetricsData,
        };
        doc.table(bodyMetricsTable, {
          prepareHeader: () => doc.font('bold').fontSize(10).fillColor(brandColors.white),
          prepareRow: () => doc.font('default').fontSize(9).fillColor(brandColors.text),
          headers: bodyMetricsTable.headers.map(h => ({ ...h, headerColor: brandColors.secondary, headerOpacity: 1 })),
        });
        doc.moveDown(2);
      }

      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.font('default').fontSize(8).fillColor(brandColors.lightText)
           .text('water4weightloss.com.au by Downscale', 50, doc.page.height - 30, { align: 'left' });
        doc.font('default').fontSize(8).fillColor(brandColors.lightText)
           .text(`Page ${i + 1} of ${range.count}`, doc.page.width - 100, doc.page.height - 30, { align: 'right' });
      }

      doc.end();
    } catch (pdfGenError) {
      console.error('PDF generation internal error:', pdfGenError);
      reject(pdfGenError);
    }
  });
}

function generateCSVExport(
  summaryStats: SummaryStats,
  exportData: HydrationLogExport[],
  bodyMetricsData: BodyMetricsExport[],
  includeBodyMetrics: boolean,
  includeWeight: boolean,
  includeWaist: boolean
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