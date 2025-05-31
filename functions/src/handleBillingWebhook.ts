import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const handleBillingWebhook = functions.https.onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const event = req.body;
    
    // Verify the webhook signature (you'll need to add your Stripe webhook secret)
    // const sig = req.headers['stripe-signature'];
    // const webhookSecret = functions.config().stripe?.webhook_secret;
    
    console.log('Received Stripe webhook event:', event.type);

    const db = admin.firestore();

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          const status = subscription.status;
          
          // Find user by Stripe customer ID
          const userQuery = await db
            .collection('users')
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();
          
          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            await userDoc.ref.update({
              tier: status === 'active' ? 'subscribed' : 'free',
              subscriptionStatus: status,
              subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Updated subscription status for user ${userDoc.id} to ${status}`);
          }
        }
        break;

      case 'customer.subscription.deleted':
        {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          
          // Find user by Stripe customer ID
          const userQuery = await db
            .collection('users')
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();
          
          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            await userDoc.ref.update({
              tier: 'free',
              subscriptionStatus: 'canceled',
              subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Canceled subscription for user ${userDoc.id}`);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        {
          const invoice = event.data.object;
          const customerId = invoice.customer;
          
          // Find user and log successful payment
          const userQuery = await db
            .collection('users')
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();
          
          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            
            // Log payment in analytics
            await db.collection('analytics_events').add({
              userId: userDoc.id,
              type: 'payment_succeeded',
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              metadata: {
                amount: invoice.amount_paid,
                currency: invoice.currency,
                invoiceId: invoice.id
              }
            });
            
            console.log(`Payment succeeded for user ${userDoc.id}`);
          }
        }
        break;

      case 'invoice.payment_failed':
        {
          const invoice = event.data.object;
          const customerId = invoice.customer;
          
          // Find user and log failed payment
          const userQuery = await db
            .collection('users')
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();
          
          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            
            // Log failed payment in analytics
            await db.collection('analytics_events').add({
              userId: userDoc.id,
              type: 'payment_failed',
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              metadata: {
                amount: invoice.amount_due,
                currency: invoice.currency,
                invoiceId: invoice.id,
                failureReason: invoice.charge?.failure_message || 'Unknown'
              }
            });
            
            console.log(`Payment failed for user ${userDoc.id}`);
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
}); 