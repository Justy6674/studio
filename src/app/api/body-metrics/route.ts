import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, doc, deleteDoc, updateDoc, getDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import type { BodyMetrics, BodyMetricsEntry, BodyMetricsStats } from '@/lib/types';

// POST - Add new body metrics entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as BodyMetricsEntry & { userId: string };
    const { userId, weight_kg, waist_cm, notes } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!weight_kg || weight_kg <= 0) {
      return NextResponse.json({ error: 'Valid weight in kg required' }, { status: 400 });
    }

    if (!waist_cm || waist_cm <= 0) {
      return NextResponse.json({ error: 'Valid waist measurement in cm required' }, { status: 400 });
    }

    // Add the body metrics entry
    const docRef = await addDoc(collection(db, "body_metrics"), {
      userId,
      weight_kg: Number(weight_kg),
      waist_cm: Number(waist_cm),
      notes: notes || "",
      timestamp: serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: "Body metrics logged successfully!" 
    });

  } catch (error: any) {
    console.error('Error adding body metrics:', error);
    return NextResponse.json({ 
      error: 'Failed to log body metrics',
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Retrieve body metrics with stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get body metrics ordered by timestamp (newest first)
    const q = query(
      collection(db, "body_metrics"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const metrics: BodyMetrics[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        weight_kg: data.weight_kg,
        waist_cm: data.waist_cm,
        notes: data.notes || "",
        timestamp: (data.timestamp as Timestamp).toDate(),
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort in JavaScript

    // Calculate statistics
    let stats: BodyMetricsStats = {
      latest: null,
      earliest: null,
      total_entries: metrics.length,
      weight_change_kg: 0,
      waist_change_cm: 0,
      avg_weight_kg: 0,
      avg_waist_cm: 0,
      trend_period_days: 0
    };

    if (metrics.length > 0) {
      const latest = metrics[0]; // Newest first due to desc order
      const earliest = metrics[metrics.length - 1];
      
      stats.latest = latest;
      stats.earliest = earliest;
      stats.weight_change_kg = Number((latest.weight_kg - earliest.weight_kg).toFixed(1));
      stats.waist_change_cm = Number((latest.waist_cm - earliest.waist_cm).toFixed(1));
      stats.avg_weight_kg = Number((metrics.reduce((sum, m) => sum + m.weight_kg, 0) / metrics.length).toFixed(1));
      stats.avg_waist_cm = Number((metrics.reduce((sum, m) => sum + m.waist_cm, 0) / metrics.length).toFixed(1));
      
      // Calculate trend period in days
      const daysDiff = Math.ceil((latest.timestamp.getTime() - earliest.timestamp.getTime()) / (1000 * 60 * 60 * 24));
      stats.trend_period_days = daysDiff;
    }

    // Return limited results for display
    const limitedMetrics = metrics.slice(0, limit);

    return NextResponse.json({
      metrics: limitedMetrics,
      stats,
      total_count: metrics.length
    });

  } catch (error: any) {
    console.error('Error fetching body metrics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch body metrics',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - Remove a body metrics entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');
    const userId = searchParams.get('userId');

    if (!entryId || !userId) {
      return NextResponse.json({ error: 'Entry ID and User ID required' }, { status: 400 });
    }

    // Verify the entry belongs to the user before deleting
    const entryRef = doc(db, "body_metrics", entryId);
    const entryDoc = await getDoc(entryRef);
    
    if (!entryDoc.exists()) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const entryData = entryDoc.data();
    if (entryData.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this entry' }, { status: 403 });
    }

    await deleteDoc(entryRef);

    return NextResponse.json({ 
      success: true,
      message: "Body metrics entry deleted successfully!" 
    });

  } catch (error: any) {
    console.error('Error deleting body metrics:', error);
    return NextResponse.json({ 
      error: 'Failed to delete body metrics entry',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Update a body metrics entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId, userId, weight_kg, waist_cm, notes } = body;

    if (!entryId || !userId) {
      return NextResponse.json({ error: 'Entry ID and User ID required' }, { status: 400 });
    }

    if (!weight_kg || weight_kg <= 0) {
      return NextResponse.json({ error: 'Valid weight in kg required' }, { status: 400 });
    }

    if (!waist_cm || waist_cm <= 0) {
      return NextResponse.json({ error: 'Valid waist measurement in cm required' }, { status: 400 });
    }

    // Verify the entry belongs to the user before updating
    const entryRef = doc(db, "body_metrics", entryId);
    const entryDoc = await getDoc(entryRef);
    
    if (!entryDoc.exists()) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const entryData = entryDoc.data();
    if (entryData.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to update this entry' }, { status: 403 });
    }

    await updateDoc(entryRef, {
      weight_kg: Number(weight_kg),
      waist_cm: Number(waist_cm),
      notes: notes || "",
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true,
      message: "Body metrics entry updated successfully!" 
    });

  } catch (error: any) {
    console.error('Error updating body metrics:', error);
    return NextResponse.json({ 
      error: 'Failed to update body metrics entry',
      details: error.message 
    }, { status: 500 });
  }
} 