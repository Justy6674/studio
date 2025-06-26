"use server";

import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
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
    const docRef = await firestore.collection("body_metrics").add({
      userId,
      weight_kg: Number(weight_kg),
      waist_cm: Number(waist_cm),
      notes: notes || "",
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: "Body metrics logged successfully!" 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error('Error adding body metrics:', error);
    return NextResponse.json({ 
      error: 'Failed to log body metrics',
      details: errorMessage 
    }, { status: 500 });
  }
}

// GET - Retrieve body metrics with stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitNum = parseInt(searchParams.get('limit') || '30');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('📊 Body metrics API - attempting to fetch data');
    
    try {
      // Try the simple query first without ordering to avoid index issues
      const snapshot = await firestore.collection('body_metrics')
        .where('userId', '==', userId)
        .limit(limitNum)
        .get();
      const bodyMetrics: BodyMetrics[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          weight_kg: data.weight_kg,
          waist_cm: data.waist_cm,
          timestamp: data.timestamp?.toDate() || new Date(),
          notes: data.notes || ""
        } as BodyMetrics;
      });

      console.log(`📊 Found ${bodyMetrics.length} body metrics entries`);

      // Calculate basic stats
      const stats: BodyMetricsStats = {
        latest: null,
        earliest: null,
        total_entries: bodyMetrics.length,
        weight_change_kg: 0,
        waist_change_cm: 0,
        avg_weight_kg: 0,
        avg_waist_cm: 0,
        trend_period_days: 0
      };

      if (bodyMetrics.length > 0) {
        // Sort by timestamp to get latest/earliest
        const sorted = bodyMetrics.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        stats.latest = sorted[0];
        stats.earliest = sorted[sorted.length - 1];
        
        // Calculate changes if we have weight data
        if (stats.latest?.weight_kg && stats.earliest?.weight_kg) {
          stats.weight_change_kg = parseFloat((stats.latest.weight_kg - stats.earliest.weight_kg).toFixed(1));
        }
        
        if (stats.latest?.waist_cm && stats.earliest?.waist_cm) {
          stats.waist_change_cm = parseFloat((stats.latest.waist_cm - stats.earliest.waist_cm).toFixed(1));
        }
        
        // Calculate averages
        stats.avg_weight_kg = parseFloat((bodyMetrics.reduce((sum, m) => sum + m.weight_kg, 0) / bodyMetrics.length).toFixed(1));
        stats.avg_waist_cm = parseFloat((bodyMetrics.reduce((sum, m) => sum + m.waist_cm, 0) / bodyMetrics.length).toFixed(1));
        
        // Calculate trend period in days
        const daysDiff = Math.ceil((stats.latest.timestamp.getTime() - stats.earliest.timestamp.getTime()) / (1000 * 60 * 60 * 24));
        stats.trend_period_days = daysDiff;
      }

      return NextResponse.json({
        body_metrics: bodyMetrics,
        stats: stats,
        success: true
      });

    } catch (firestoreError) {
      const error = firestoreError as { code?: string };
      console.error('📊 Firestore query failed:', error);
      
      // If it's an index error, return empty data gracefully
      if (error.code === 'failed-precondition') {
        console.log('📊 Firebase index required - returning empty data gracefully');
        return NextResponse.json({
          body_metrics: [],
          stats: {
            latest: null,
            earliest: null,
            total_entries: 0,
            weight_change_kg: 0,
            waist_change_cm: 0,
            avg_weight_kg: 0,
            avg_waist_cm: 0,
            trend_period_days: 0
          },
          success: true,
          message: 'Body metrics temporarily unavailable - Firebase index being created'
        });
      }
      
      throw firestoreError;
    }

  } catch (error) {
    console.error('Error fetching body metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch body metrics' },
      { status: 500 }
    );
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
    const entryDoc = await firestore.collection("body_metrics").doc(entryId).get();
    
    if (!entryDoc.exists) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const entryData = entryDoc.data();
    if (!entryData || entryData.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this entry' }, { status: 403 });
    }

    await firestore.collection("body_metrics").doc(entryId).delete();

    return NextResponse.json({ 
      success: true,
      message: "Body metrics entry deleted successfully!" 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error('Error deleting body metrics:', error);
    return NextResponse.json({ 
      error: 'Failed to delete body metrics entry',
      details: errorMessage 
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
    const entryDoc = await firestore.collection("body_metrics").doc(entryId).get();
    
    if (!entryDoc.exists) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const entryData = entryDoc.data();
    if (!entryData || entryData.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to update this entry' }, { status: 403 });
    }

    await firestore.collection("body_metrics").doc(entryId).update({
      weight_kg: Number(weight_kg),
      waist_cm: Number(waist_cm),
      notes: notes || "",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true,
      message: "Body metrics entry updated successfully!" 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error('Error updating body metrics:', error);
    return NextResponse.json({ 
      error: 'Failed to update body metrics entry',
      details: errorMessage 
    }, { status: 500 });
  }
} 