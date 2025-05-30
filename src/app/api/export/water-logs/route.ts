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
    const format = searchParams.get('format') || 'csv'; // csv or json
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
      let bodyQ = query(
        collection(db, "body_metrics"),
        where("userId", "==", userId)
      );

      // Add date range filters for body metrics
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        bodyQ = query(
          collection(db, "body_metrics"),
          where("userId", "==", userId),
          where("timestamp", ">=", Timestamp.fromDate(start))
        );
      }

      if (endDate && startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        bodyQ = query(
          collection(db, "body_metrics"),
          where("userId", "==", userId),
          where("timestamp", ">=", Timestamp.fromDate(start)),
          where("timestamp", "<=", Timestamp.fromDate(end))
        );
      }

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
      }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Process body metrics for export
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

    if (format === 'json') {
      return NextResponse.json({
        summary: summaryStats,
        logs: exportData,
        body_metrics: bodyMetricsData
      });
    }

    // Generate CSV
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

    const filename = `hydration-export-${userId}-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('Error exporting water logs:', error);
    return NextResponse.json({ 
      error: 'Failed to export water logs',
      details: error.message 
    }, { status: 500 });
  }
} 