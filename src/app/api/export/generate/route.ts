import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from 'canvas';

interface ProgressSummaryData {
  userName?: string;
  currentIntake?: number;
  hydrationGoal?: number;
  dailyStreak?: number;
  longestStreak?: number;
}

interface HydrationChartData {
  // Define properties for hydration chart data later
  date: string;
  goal: number;
  consumed: number;
}

type RequestBody =
  | {
      type: 'progress-summary';
      data: ProgressSummaryData;
      timeRange: string;
      format: 'image' | 'pdf';
    }
  | {
      type: 'hydration-chart';
      data: HydrationChartData;
      timeRange: string;
      format: 'image' | 'pdf';
    }
  | {
      type: 'weight-chart' | 'streak-calendar' | 'comparison-chart';
      timeRange: string;
      format: 'image' | 'pdf';
    };

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { timeRange, format } = body;

    console.log('🎨 Generating export:', { type: body.type, timeRange, format });

    let buffer: Buffer;

    switch (body.type) {
      case 'progress-summary':
        buffer = await generateProgressSummary(body.data);
        break;
      case 'hydration-chart':
        buffer = await generateHydrationChart(body.data, timeRange);
        break;
      case 'weight-chart':
        buffer = await generateWeightChart();
        break;
      case 'streak-calendar':
        buffer = await generateStreakCalendar();
        break;
      case 'comparison-chart':
        buffer = await generateComparisonChart();
        break;
      default:
        return NextResponse.json({ error: `Unknown export type` }, { status: 400 });
    }

    const contentType = format === 'image' ? 'image/png' : 'application/pdf';
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${body.type}-${timeRange}.${format === 'image' ? 'png' : 'pdf'}"`,
      },
    });

  } catch (error) {
    console.error('❌ Export generation failed:', error);
    return NextResponse.json({ 
      error: 'Export generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateProgressSummary(data: ProgressSummaryData): Promise<Buffer> {
  const width = 1080;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Brand colors
  const colors = {
    background: '#334155',
    header: '#b68a71', 
    primary: '#5271FF',
    secondary: '#F1E5A6',
    white: '#ffffff',
    text: '#1f2937'
  };

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors.background);
  gradient.addColorStop(1, '#475569');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Header
  ctx.fillStyle = colors.white;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  const firstName = data.userName?.split(' ')[0] || 'Your';
  ctx.fillText(`${firstName}'s Progress`, width / 2, 120);

  // Subtitle
  ctx.fillStyle = colors.secondary;
  ctx.font = '24px Arial';
  ctx.fillText('Hydration & Weight Tracking', width / 2, 160);

  // Stats cards in 2x2 grid
  const cardWidth = 400;
  const cardHeight = 200;
  const cardSpacing = 40;
  const startX = (width - (cardWidth * 2 + cardSpacing)) / 2;
  const startY = 250;

  const stats = [
    {
      title: 'Total Water',
      value: `${data.currentIntake || 0}L`,
      subtitle: `Goal: ${data.hydrationGoal || 2000}ml`,
      color: colors.primary
    },
    {
      title: 'Achievement',
      value: `${Math.round(((data.currentIntake || 0) * 1000) / (data.hydrationGoal || 2000) * 100)}%`,
      subtitle: 'of daily goal',
      color: colors.header
    },
    {
      title: 'Current Streak',
      value: `${data.dailyStreak || 0}`,
      subtitle: 'days',
      color: colors.primary
    },
    {
      title: 'Best Streak',
      value: `${data.longestStreak || 0}`,
      subtitle: 'days record',
      color: colors.header
    }
  ];

  stats.forEach((stat, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = startX + col * (cardWidth + cardSpacing);
    const y = startY + row * (cardHeight + cardSpacing);

    // Card background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.roundRect(x, y, cardWidth, cardHeight, 20);
    ctx.fill();

    // Card border
    ctx.strokeStyle = stat.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Value
    ctx.fillStyle = colors.white;
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(stat.value, x + cardWidth / 2, y + 100);

    // Title
    ctx.fillStyle = stat.color;
    ctx.font = 'bold 24px Arial';
    ctx.fillText(stat.title, x + cardWidth / 2, y + 40);

    // Subtitle
    ctx.fillStyle = colors.secondary;
    ctx.font = '18px Arial';
    ctx.fillText(stat.subtitle, x + cardWidth / 2, y + 140);
  });

  // Footer
  ctx.fillStyle = colors.secondary;
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Downscale Weight Loss Clinic', width / 2, height - 80);
  ctx.fillText('Generated by water4weightloss.com.au', width / 2, height - 50);

  return canvas.toBuffer('image/png');
}

async function generateHydrationChart(_data: HydrationChartData, timeRange: string): Promise<Buffer> {
  // For now, create a placeholder chart
  // TODO: Implement actual chart generation with Chart.js or similar
  const width = 1080;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Hydration Trends', width / 2, 120);

  // Placeholder for chart
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(80, 200, width - 160, 600);

  ctx.fillStyle = '#5271FF';
  ctx.font = '24px Arial';
  ctx.fillText(`${timeRange} Chart Coming Soon`, width / 2, 500);

  return canvas.toBuffer('image/png');
}

async function generateWeightChart(): Promise<Buffer> {
  // Placeholder for weight chart
  const width = 1080;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Weight Progress', width / 2, 120);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(80, 200, width - 160, 600);

  ctx.fillStyle = '#b68a71';
  ctx.font = '24px Arial';
  ctx.fillText('Weight Chart Coming Soon', width / 2, 500);

  return canvas.toBuffer('image/png');
}

async function generateStreakCalendar(): Promise<Buffer> {
  // Placeholder for streak calendar
  const width = 1080;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Streak Calendar', width / 2, 120);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(80, 200, width - 160, 600);

  ctx.fillStyle = '#F1E5A6';
  ctx.font = '24px Arial';
  ctx.fillText('Calendar Heatmap Coming Soon', width / 2, 500);

  return canvas.toBuffer('image/png');
}

async function generateComparisonChart(): Promise<Buffer> {
  // Placeholder for comparison chart
  const width = 1080;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Water vs Weight', width / 2, 120);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(80, 200, width - 160, 600);

  ctx.fillStyle = '#5271FF';
  ctx.font = '24px Arial';
  ctx.fillText('Water vs Weight Chart Coming Soon', width / 2, 500);

  return canvas.toBuffer('image/png');
} 