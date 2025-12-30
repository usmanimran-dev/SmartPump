import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Smart Insights - AI-powered fuel analytics
 * 
 * STATUS: SKELETON - Ready for Blaze plan activation
 * 
 * This function analyzes fuel entries, detects patterns, and generates
 * predictive insights for station owners.
 * 
 * REQUIRES: Firebase Blaze plan (scheduled functions)
 */
export const smartInsights = functions.pubsub
    .schedule('every 24 hours')
    .timeZone('UTC')
    .onRun(async (context) => {
        const firestore = admin.firestore();
        const today = new Date().toISOString().split('T')[0];

        try {
            // Fetch today's fuel entries
            const entriesSnapshot = await firestore
                .collection('fuelEntries')
                .where('date', '==', today)
                .get();

            const entries = entriesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`Processing ${entries.length} fuel entries for ${today}`);

            // TODO: Implement AI logic here
            // - Calculate rolling averages
            // - Detect unusual patterns
            // - Generate recommendations
            // - Update insights collection

            // Example placeholder logic:
            for (const entry of entries) {
                const variance = Math.abs((entry as any).variance || 0);

                if (variance > 75) {
                    // Create high-priority insight
                    await firestore.collection('insights').add({
                        stationId: (entry as any).stationId,
                        type: 'HIGH_VARIANCE_ALERT',
                        message: `Consistent high variance detected at station ${(entry as any).stationId}`,
                        priority: 'high',
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }

            return { success: true, processed: entries.length };
        } catch (error) {
            console.error('Smart Insights Error:', error);
            return { success: false, error };
        }
    });

/**
 * Send Variance Alert via SMS/WhatsApp
 * 
 * STATUS: SKELETON - Ready for Blaze plan + Twilio integration
 * 
 * Triggers when a high-severity alert is created in Firestore.
 * 
 * REQUIRES: 
 * - Firebase Blaze plan
 * - Twilio account for SMS
 * - WhatsApp Business API (optional)
 */
export const sendVarianceAlert = functions.firestore
    .document('alerts/{alertId}')
    .onCreate(async (snapshot, context) => {
        const alert = snapshot.data();

        if (alert.severity !== 'high') {
            console.log('Alert severity not high, skipping notification');
            return null;
        }

        console.log(`High-severity alert detected: ${context.params.alertId}`);

        // TODO: Implement SMS/WhatsApp notification
        // Example with Twilio:
        /*
        const twilio = require('twilio');
        const client = twilio(
          functions.config().twilio.sid,
          functions.config().twilio.token
        );
        
        await client.messages.create({
          body: `⚠️ ALERT: High variance detected at Station ${alert.stationId}. Variance: ${alert.variance}L`,
          from: functions.config().twilio.phone,
          to: alert.managerPhone
        });
        */

        return { success: true, alertId: context.params.alertId };
    });

/**
 * Generate Daily Report
 * 
 * STATUS: SKELETON - Ready for Blaze plan activation
 * 
 * Runs every night at midnight to compile daily statistics
 * and prepare PDF/CSV reports.
 * 
 * REQUIRES: Firebase Blaze plan + PDF generation library
 */
export const generateDailyReport = functions.pubsub
    .schedule('0 0 * * *') // Midnight every day
    .timeZone('UTC')
    .onRun(async (context) => {
        const firestore = admin.firestore();
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        console.log(`Generating daily report for ${yesterday}`);

        try {
            // Fetch all entries for yesterday
            const entriesSnapshot = await firestore
                .collection('fuelEntries')
                .where('date', '==', yesterday)
                .get();

            const stats = {
                totalRevenue: 0,
                totalVariance: 0,
                totalLitresSold: 0,
                alertCount: 0
            };

            entriesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                stats.totalRevenue += data.revenue || 0;
                stats.totalVariance += Math.abs(data.variance || 0);
                stats.totalLitresSold += data.soldLitres || 0;
                if (data.severity && data.severity !== 'low') {
                    stats.alertCount++;
                }
            });

            // Save report to Firestore
            await firestore.collection('reports').add({
                date: yesterday,
                stats,
                generatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Report generated:`, stats);

            // TODO: Generate PDF and send via email
            // TODO: Export to CSV and upload to Cloud Storage

            return { success: true, date: yesterday, stats };
        } catch (error) {
            console.error('Report generation error:', error);
            return { success: false, error };
        }
    });

/**
 * Auto-Close Old Alerts
 * 
 * STATUS: SKELETON - Ready for Blaze plan activation
 * 
 * Automatically closes alerts older than 7 days if not manually resolved.
 */
export const autoCloseOldAlerts = functions.pubsub
    .schedule('0 2 * * *') // 2 AM daily
    .timeZone('UTC')
    .onRun(async (context) => {
        const firestore = admin.firestore();
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

        try {
            const oldAlertsSnapshot = await firestore
                .collection('alerts')
                .where('createdAt', '<', sevenDaysAgo)
                .where('status', '==', 'open')
                .get();

            const batch = firestore.batch();
            let count = 0;

            oldAlertsSnapshot.docs.forEach(doc => {
                batch.update(doc.ref, {
                    status: 'auto-closed',
                    closedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                count++;
            });

            await batch.commit();

            console.log(`Auto-closed ${count} old alerts`);
            return { success: true, closedCount: count };
        } catch (error) {
            console.error('Auto-close error:', error);
            return { success: false, error };
        }
    });
