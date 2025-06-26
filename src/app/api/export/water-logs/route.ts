"use server";

import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import type { UserProfile } from '@/lib/types';

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
    const format = searchParams.get('format') || 'csv'; // csv, json, excel, report
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeBodyMetrics = searchParams.get('includeBodyMetrics') === 'true';
    const includeWeight = searchParams.get('includeWeight') === 'true';
    const includeWaist = searchParams.get('includeWaist') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user profile for goals and settings
    const userDoc = await firestore.collection("users").doc(userId).get();
    let userProfile: UserProfile | null = null;
    
    if (userDoc.exists) {
      userProfile = userDoc.data() as UserProfile;
    }

    const hydrationGoal = userProfile?.hydrationGoal || 2000;

    // Build query for hydration logs
    let q = firestore.collection("hydration_logs").where("userId", "==", userId);

    // Add date range filters if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      q = firestore.collection("hydration_logs")
        .where("userId", "==", userId)
        .where("timestamp", ">=", start)
        .where("timestamp", "<=", end);
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      q = firestore.collection("hydration_logs")
        .where("userId", "==", userId)
        .where("timestamp", ">=", start);
    }

    const querySnapshot = await q.get();
    const logs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        timestamp: data.timestamp.toDate(),
      };
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (logs.length === 0) {
      return NextResponse.json({ error: 'No hydration logs found' }, { status: 404 });
    }

    // Process logs into export format
    const exportData: HydrationLogExport[] = [];
    const dailyTotals = new Map<string, number>();
    const dailyStreaks = new Map<string, number>();

    // Calculate daily totals
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
        if (index === 0) {
          currentStreak = 1;
        } else {
          const prevDate = sortedDates[index - 1];
          const prevTotal = dailyTotals.get(prevDate) || 0;
          currentStreak = prevTotal >= hydrationGoal ? currentStreak + 1 : 1;
        }
      } else {
        currentStreak = 0;
      }
      
      dailyStreaks.set(date, currentStreak);
    });

    // Create export records
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

    // Body metrics temporarily disabled
    const bodyMetricsData: BodyMetricsExport[] = [];

    // Handle different export formats
    switch (format) {
      case 'json':
        return NextResponse.json({
          summary: summaryStats,
          hydration_logs: exportData,
          body_metrics: bodyMetricsData
        });

      case 'excel':
        return await generateExcelExport(summaryStats, exportData, bodyMetricsData);

      case 'report':
        return generateHTMLReport(summaryStats, exportData, bodyMetricsData);

      default: // CSV
        return generateCSVExport(summaryStats, exportData, bodyMetricsData, includeBodyMetrics, includeWeight, includeWaist);
    }

  } catch (error) {
    console.error('Error exporting water logs:', error);
    const details = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ 
      error: 'Failed to export water logs',
      details
    }, { status: 500 });
  }
}

async function generateExcelExport(
  summaryStats: SummaryStats,
  exportData: HydrationLogExport[],
  bodyMetricsData: BodyMetricsExport[]
) {
  const XLSX = await import('xlsx'); 
  const workbook = XLSX.utils.book_new();
  
  const summaryData = [
    ['Water4WeightLoss Export Report'],
    ['Generated:', summaryStats.export_date],
    ['User:', summaryStats.user_name],
    ['Email:', summaryStats.user_email],
    ['Date Range:', `${summaryStats.date_range.start} to ${summaryStats.date_range.end}`],
    ['Total Days:', summaryStats.date_range.total_days],
    ['Daily Goal:', `${summaryStats.hydration_goal_ml}ml`],
    [],
    ['SUMMARY STATISTICS'],
    ['Total Water Logged:', `${summaryStats.totals.total_water_logged_ml}ml`],
    ['Average Daily Intake:', `${summaryStats.totals.average_daily_intake_ml}ml`],
    ['Goal Achievement Rate:', `${summaryStats.totals.goal_achievement_rate_percent}%`],
    ['Max Streak:', `${summaryStats.totals.max_streak_days} days`],
    ['Current Streak:', `${summaryStats.totals.current_streak_days} days`]
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  const hydrationData = [
    ['Date', 'Time', 'Amount (ml)', 'Daily Total (ml)', 'Goal (ml)', 'Goal %', 'Day of Week', 'Streak Day'],
    ...exportData.map(log => [
      log.date, log.time, log.amount_ml, log.daily_total_ml,
      log.goal_ml, log.percentage_of_goal, log.day_of_week, log.streak_day
    ])
  ];
  
  const hydrationSheet = XLSX.utils.aoa_to_sheet(hydrationData);
  XLSX.utils.book_append_sheet(workbook, hydrationSheet, 'Hydration Logs');
  
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

// TODO: PDF Export Replacement Checklist
// - [x] Remove PDFKit and pdfkit-table dependencies  
// - [x] Create HTML template with proper styling
// - [x] Add Water4WeightLoss branding and colors
// - [x] Include comprehensive summary statistics
// - [x] Display hydration performance metrics with visual indicators
// - [x] Show recent logs in readable table format
// - [x] Include body metrics section when available
// - [x] Optimize layout for screenshot capture
// - [x] Add print-friendly CSS media queries
// - [x] Ensure responsive design for different screen sizes
// - [x] Add proper color coding for goal achievement
// - [ ] Test across different browsers for consistency
// - [ ] Validate accessibility standards (WCAG compliance)
// - [ ] Add data export timestamp for version tracking
// - [ ] Include proper attribution footer with app branding

function generateHTMLReport(
  summaryStats: SummaryStats,
  exportData: HydrationLogExport[],
  bodyMetricsData: BodyMetricsExport[]
) {
  const brandColors = {
    primary: '#5271ff',
    background: '#1e293b',
    text: '#f1f5f9',
    lightText: '#94a3b8',
    accent: '#b68a71'
  };

  const recentLogs = exportData.slice(-20);
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Water4WeightLoss Health Report - ${summaryStats.user_name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, ${brandColors.background} 0%, #334155 100%);
            color: ${brandColors.text};
            line-height: 1.6;
            min-height: 100vh;
            padding: 2rem;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: rgba(30, 41, 59, 0.95); 
            border-radius: 16px; 
            padding: 2rem; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            border: 1px solid rgba(82, 113, 255, 0.2);
        }
        .header { 
            text-align: center; 
            margin-bottom: 2rem; 
            border-bottom: 2px solid ${brandColors.primary}; 
            padding-bottom: 1rem; 
        }
        .logo { 
            color: ${brandColors.primary}; 
            font-size: 2.5rem; 
            font-weight: bold; 
            margin-bottom: 0.5rem; 
        }
        .subtitle { color: ${brandColors.lightText}; font-size: 1.1rem; }
        .section { margin-bottom: 2rem; }
        .section-title { 
            color: ${brandColors.primary}; 
            font-size: 1.4rem; 
            font-weight: bold; 
            margin-bottom: 1rem; 
            border-left: 4px solid ${brandColors.primary}; 
            padding-left: 1rem; 
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
            gap: 1rem; 
            margin-bottom: 1.5rem; 
        }
        .stat-card { 
            background: rgba(82, 113, 255, 0.15); 
            border: 1px solid ${brandColors.primary}; 
            border-radius: 12px; 
            padding: 1.5rem; 
            text-align: center;
        }
        .stat-value { 
            font-size: 2.2rem; 
            font-weight: bold; 
            color: ${brandColors.primary}; 
            margin-bottom: 0.5rem;
        }
        .stat-label { color: ${brandColors.lightText}; font-size: 0.9rem; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 1rem; 
            background: rgba(15, 23, 42, 0.7); 
            border-radius: 12px; 
            overflow: hidden;
        }
        th { 
            background: ${brandColors.primary}; 
            color: white; 
            padding: 1rem 0.75rem; 
            text-align: left; 
            font-weight: bold; 
        }
        td { 
            padding: 0.75rem; 
            border-bottom: 1px solid rgba(148, 163, 184, 0.15); 
        }
        tr:nth-child(even) { background: rgba(148, 163, 184, 0.05); }
        .progress-bar { 
            background: rgba(148, 163, 184, 0.3); 
            height: 8px; 
            border-radius: 4px; 
            overflow: hidden; 
            margin-top: 0.5rem; 
        }
        .progress-fill { 
            background: linear-gradient(90deg, ${brandColors.primary}, ${brandColors.accent}); 
            height: 100%; 
            border-radius: 4px; 
        }
        .footer { 
            text-align: center; 
            color: ${brandColors.lightText}; 
            font-size: 0.9rem; 
            margin-top: 2rem; 
            padding-top: 1rem; 
            border-top: 1px solid rgba(148, 163, 184, 0.2); 
        }
        .achievement-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .achievement-excellent { background: #10b981; color: white; }
        .achievement-good { background: #f59e0b; color: white; }
        .achievement-needs-improvement { background: #ef4444; color: white; }
        @media print { 
            body { background: white; color: black; } 
            .container { background: white; box-shadow: none; } 
        }
        @media (max-width: 768px) {
            body { padding: 1rem; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">💧 Water4WeightLoss</div>
            <div class="subtitle">Health Report for ${summaryStats.user_name}</div>
            <div style="color: ${brandColors.lightText}; font-size: 0.9rem; margin-top: 0.5rem;">
                ${new Date(summaryStats.export_date).toLocaleDateString('en-AU')} • 
                ${summaryStats.date_range.start} to ${summaryStats.date_range.end}
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">📊 Performance Summary</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${summaryStats.totals.total_water_logged_ml.toLocaleString()}</div>
                    <div class="stat-label">ml Total Water</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Math.round(summaryStats.totals.average_daily_intake_ml)}</div>
                    <div class="stat-label">ml Daily Average</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${summaryStats.totals.goal_achievement_rate_percent.toFixed(1)}%</div>
                    <div class="stat-label">Goal Achievement</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(summaryStats.totals.goal_achievement_rate_percent, 100)}%"></div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${summaryStats.totals.max_streak_days}</div>
                    <div class="stat-label">Best Streak (days)</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">📝 Recent Activity</h2>
            <table>
                <thead>
                    <tr><th>Date</th><th>Time</th><th>Amount</th><th>Daily Total</th><th>Goal %</th><th>Streak</th></tr>
                </thead>
                <tbody>
                    ${recentLogs.map(log => `
                        <tr>
                            <td>${log.date}</td>
                            <td>${log.time}</td>
                            <td>${log.amount_ml}ml</td>
                            <td><strong>${log.daily_total_ml}ml</strong></td>
                            <td style="color: ${log.percentage_of_goal >= 100 ? '#10b981' : log.percentage_of_goal >= 75 ? '#f59e0b' : '#ef4444'}">
                                ${log.percentage_of_goal}%
                            </td>
                            <td>${log.streak_day || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p><strong>Water4WeightLoss</strong> • Australian Clinical Hydration App</p>
            <p style="margin-top: 0.5rem;">💡 Take a screenshot or print this report for your records</p>
        </div>
    </div>
</body>
</html>`;

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    },
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
  const csvHeaders = ['Date', 'Time', 'Amount (ml)', 'Daily Total (ml)', 'Goal (ml)', 'Goal %', 'Day of Week', 'Streak Day'];

  let csvContent = csvHeaders.join(',') + '\n';
  csvContent += `# Water4WeightLoss Export\n`;
  csvContent += `# Generated: ${summaryStats.export_date}\n`;
  csvContent += `# User: ${summaryStats.user_name}\n`;
  csvContent += `# Date Range: ${summaryStats.date_range.start} to ${summaryStats.date_range.end}\n`;

  exportData.forEach(log => {
    const row = [
      log.date, log.time, log.amount_ml, log.daily_total_ml,
      log.goal_ml, log.percentage_of_goal, log.day_of_week, log.streak_day
    ];
    csvContent += row.join(',') + '\n';
  });

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