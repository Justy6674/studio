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

    // Build query for hydration logs
    let q = query(
      collection(db, "hydration_logs"),
      where("userId", "==", userId),
      orderBy("timestamp", "asc")
    );

    // Add date range filters if provided
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      q = query(
        collection(db, "hydration_logs"),
        where("userId", "==", userId),
        where("timestamp", ">=", Timestamp.fromDate(start)),
        orderBy("timestamp", "asc")
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
        where("timestamp", "<=", Timestamp.fromDate(end)),
        orderBy("timestamp", "asc")
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
    });

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
        let bodyQ = query(
          collection(db, "body_metrics"),
          where("userId", "==", userId),
          orderBy("timestamp", "desc")
        );

        // Try with date range filters - if this fails due to missing index, we'll fallback
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          try {
            bodyQ = query(
              collection(db, "body_metrics"),
              where("userId", "==", userId),
              where("timestamp", ">=", Timestamp.fromDate(start)),
              where("timestamp", "<=", Timestamp.fromDate(end)),
              orderBy("timestamp", "desc")
            );
            
            const bodyQuerySnapshot = await getDocs(bodyQ);
            const bodyMetrics = bodyQuerySnapshot.docs.map(doc => {
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

            // Client-side filtering by date range if needed
            const filteredMetrics = bodyMetrics.filter(metric => {
              const metricDate = metric.timestamp;
              return metricDate >= start && metricDate <= end;
            });

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

          } catch (indexError: any) {
            // If compound index doesn't exist, fall back to simple query and filter client-side
            console.log('Falling back to simple query due to missing index:', indexError.message);
            
            const simpleBodyQ = query(
              collection(db, "body_metrics"),
              where("userId", "==", userId),
              orderBy("timestamp", "desc")
            );
            
            const bodyQuerySnapshot = await getDocs(simpleBodyQ);
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

            // Client-side filtering by date range
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            const filteredMetrics = allBodyMetrics.filter(metric => {
              const metricDate = metric.timestamp;
              return metricDate >= start && metricDate <= end;
            });

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
          }
        } else {
          // No date range, simple query
          const bodyQuerySnapshot = await getDocs(bodyQ);
          const bodyMetrics = bodyQuerySnapshot.docs.map(doc => {
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

          bodyMetricsData = bodyMetrics.map(metric => {
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
        }
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
  let yPosition = 20;
  
  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(59, 130, 246); // Blue color
  pdf.text('💧 Water4WeightLoss Report', 20, yPosition);
  yPosition += 15;
  
  // User info
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`User: ${summaryStats.user_name}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Date Range: ${summaryStats.date_range.start} to ${summaryStats.date_range.end}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Generated: ${new Date(summaryStats.export_date).toLocaleDateString()}`, 20, yPosition);
  yPosition += 20;
  
  // Summary statistics
  pdf.setFontSize(16);
  pdf.setTextColor(34, 197, 94); // Green color
  pdf.text('📊 Summary Statistics', 20, yPosition);
  yPosition += 15;
  
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  const summaryItems = [
    `Total Water Logged: ${(summaryStats.totals.total_water_logged_ml / 1000).toFixed(1)}L`,
    `Average Daily Intake: ${(summaryStats.totals.average_daily_intake_ml / 1000).toFixed(1)}L`,
    `Goal Achievement Rate: ${summaryStats.totals.goal_achievement_rate_percent}%`,
    `Maximum Streak: ${summaryStats.totals.max_streak_days} days`,
    `Current Streak: ${summaryStats.totals.current_streak_days} days`,
    `Total Days Tracked: ${summaryStats.date_range.total_days}`
  ];
  
  summaryItems.forEach(item => {
    pdf.text(`• ${item}`, 25, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Body metrics summary (if available)
  if (bodyMetricsData.length > 0) {
    pdf.setFontSize(16);
    pdf.setTextColor(182, 138, 113); // Brown color
    pdf.text('📊 Body Metrics Summary', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    
    const latestMetrics = bodyMetricsData[bodyMetricsData.length - 1];
    if (latestMetrics.weight_kg) {
      pdf.text(`• Current Weight: ${latestMetrics.weight_kg}kg`, 25, yPosition);
      yPosition += 8;
    }
    if (latestMetrics.waist_cm) {
      pdf.text(`• Current Waist: ${latestMetrics.waist_cm}cm`, 25, yPosition);
      yPosition += 8;
    }
    
    yPosition += 10;
  }
  
  // Recent activity
  pdf.setFontSize(16);
  pdf.setTextColor(168, 85, 247); // Purple color
  pdf.text('⚡ Recent Activity', 20, yPosition);
  yPosition += 15;
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  // Show last 10 entries
  const recentLogs = exportData.slice(-10);
  recentLogs.forEach(log => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.text(`${log.date} ${log.time}: ${log.amount_ml}ml (Day total: ${log.daily_total_ml}ml)`, 25, yPosition);
    yPosition += 6;
  });
  
  // Watermark
  if (includeWatermark) {
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Generated by Water4WeightLoss - Track your hydration journey', 20, 285);
  }
  
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