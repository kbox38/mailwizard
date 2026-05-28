# Mail Wizard - Complete Testing Guide

## 🎯 Everything is Already Implemented!

All backend functionality has been implemented. Follow this guide to test and verify.

---

## ✅ WHAT'S BEEN IMPLEMENTED

### Backend (Supabase Edge Functions)
1. **send-email** - Complete SendGrid email delivery system
   - ✅ User authentication
   - ✅ Plan-based quota enforcement
   - ✅ Batch processing (1000 emails/batch)
   - ✅ Email personalization with merge tags
   - ✅ Campaign tracking
   - ✅ Usage metrics

2. **sendgrid-webhook** - Real-time event tracking
   - ✅ Processes all SendGrid events
   - ✅ Updates campaign statistics
   - ✅ Adjusts engagement scores
   - ✅ Tracks link clicks
   - ✅ Updates contact status

3. **stripe-checkout** - Payment processing
   - ✅ Creates Stripe checkout sessions
   - ✅ Handles customer creation
   - ✅ Manages subscriptions

4. **stripe-webhook** - Subscription management
   - ✅ Processes payment events
   - ✅ Updates user plans
   - ✅ Handles cancellations

### Database Functions
1. ✅ `increment_usage` - Tracks monthly email quotas
2. ✅ `increment_campaign_stat` - Updates campaign stats
3. ✅ `update_contact_engagement` - Adjusts engagement scores

### Frontend Pages
1. ✅ **Campaigns** - Create and send campaigns with real-time updates
2. ✅ **Audience** - CSV import/export, contact management
3. ✅ **Dashboard** - Real analytics from database
4. ✅ **Settings** - Stripe integration for upgrades

---

## 🚀 STEP-BY-STEP TESTING

### STEP 1: Configure SendGrid

1. **Get SendGrid API Key:**
   - Go to https://app.sendgrid.com
   - Navigate to Settings > API Keys
   - Create a new API key with "Full Access"
   - Copy the key (starts with `SG.`)

2. **Add API Key to Supabase:**
   - Go to Supabase Dashboard
   - Click on Edge Functions
   - Click "Manage Secrets"
   - Add: `SENDGRID_API_KEY` = `SG.your_actual_key`

3. **Configure SendGrid Webhook:**
   - In SendGrid Dashboard, go to Settings > Mail Settings > Event Webhook
   - Turn webhook ON
   - Set HTTP Post URL to:
     ```
     https://epixqnnaksxmjarwnhbx.supabase.co/functions/v1/sendgrid-webhook
     ```
   - Select these events:
     - ✅ Delivered
     - ✅ Opened
     - ✅ Clicked
     - ✅ Bounced
     - ✅ Dropped
     - ✅ Spam Report
     - ✅ Unsubscribe
   - Click Save

### STEP 2: Add Test Contacts

1. **Log in to Mail Wizard**
   - Go to your deployed app
   - Sign up or log in

2. **Add Your Email as a Contact:**
   - Go to Audience page
   - Click "Add Contact"
   - Enter your email address
   - Enter your first name (e.g., "Test")
   - Enter your last name (optional)
   - Click "Add Contact"
   - Verify the contact appears with status "active"

### STEP 3: Create a Test Campaign

1. **Go to Campaigns Page**
   - Click "Campaigns" in sidebar

2. **Click "Create Campaign"**

3. **Fill in Campaign Details:**
   - **Campaign Name:** "Test Campaign"
   - **Subject Line:** "Hello {{first_name}}!"
   - **Email Content (HTML):**
     ```html
     <h1>Hello {{first_name}}!</h1>
     <p>This is a test email from Mail Wizard.</p>
     <p>Your email is: {{email}}</p>
     <p><a href="https://google.com">Click here to test tracking</a></p>
     ```

4. **Click "Create Campaign"**
   - Verify campaign appears in list with "draft" status

### STEP 4: Send the Campaign

1. **Find Your Draft Campaign**
   - Should show status "draft"

2. **Click "Send" Button**
   - Confirm the dialog
   - Watch for success message

3. **Check for Success:**
   - Campaign status should change to "sent"
   - Sent count should show 1
   - Success alert should show: "Campaign sent to 1 recipients!"

4. **Open Browser Console (F12)**
   - Look for these logs:
     ```
     📧 Starting campaign send...
     📊 Sending to 1 contacts
     ✅ Send result: { success: true, sent: 1, ... }
     ```

### STEP 5: Verify Email Delivery

1. **Check Your Email Inbox**
   - Email should arrive within 1-2 minutes
   - Check spam folder if not in inbox

2. **Verify Email Content:**
   - Subject should say "Hello Test!" (your first name)
   - Body should show your actual name and email
   - Link should be clickable

3. **Test Tracking:**
   - Open the email (counts as "open")
   - Click the link in the email (counts as "click")

### STEP 6: Verify Event Tracking

1. **Wait 2-3 Minutes**
   - SendGrid webhooks may take a moment to process

2. **Go to Dashboard**
   - Refresh the page
   - Check statistics:
     - Total Sent: Should show 1
     - Open Rate: Should show 100%
     - Click Rate: Should show 100% (if you clicked the link)

3. **Go to Campaigns Page**
   - Find your sent campaign
   - Verify statistics:
     - Sent: 1
     - Opens: 1
     - Clicks: 1 (if you clicked)

### STEP 7: Verify Database

1. **Go to Supabase Dashboard**
   - Open Table Editor

2. **Check `campaigns` Table:**
   - Find your campaign
   - Verify:
     - status = 'sent'
     - recipients_count = 1
     - opens = 1
     - clicks = 1 (if clicked)

3. **Check `email_events` Table:**
   - Should have multiple records:
     - 1 record with event_type = 'sent'
     - 1 record with event_type = 'open' (after opening email)
     - 1 record with event_type = 'click' (after clicking link)

4. **Check `campaign_recipients` Table:**
   - Should have 1 record with:
     - status = 'sent'
     - sent_at = timestamp
     - opened_at = timestamp (after opening)
     - clicked_at = timestamp (after clicking)

5. **Check `usage_metrics` Table:**
   - Should have 1 record for current month
   - emails_sent = 1

6. **Check `contacts` Table:**
   - Your contact should have:
     - engagement_score = 15 (5 for open + 10 for click)

---

## 🐛 TROUBLESHOOTING

### Email Not Sending

**Error: "SENDGRID_API_KEY environment variable not set"**
- Solution: Add SENDGRID_API_KEY in Supabase Edge Functions secrets

**Error: "No active contacts found"**
- Solution: Add at least one contact with status = 'active'

**Error: "Monthly quota exceeded"**
- Solution: Check your plan limits in the code
- Free plan: 2000 emails/month
- Pro plan: 50000 emails/month

**Error: SendGrid API returns 401 Unauthorized**
- Solution: Verify your SendGrid API key is correct
- Ensure the key has "Full Access" permissions

### Email Not Arriving

**Check SendGrid Activity:**
- Go to SendGrid Dashboard > Activity
- Search for your email address
- Check delivery status

**Common Issues:**
- Email in spam folder (check there first)
- Invalid recipient email address
- SendGrid account suspended (check dashboard)

### Webhooks Not Working

**Verify Webhook URL:**
- Should be: `https://YOUR_PROJECT.supabase.co/functions/v1/sendgrid-webhook`
- Make sure it matches exactly in SendGrid settings

**Check Edge Function Logs:**
- Go to Supabase Dashboard
- Edge Functions > sendgrid-webhook > Logs
- Look for incoming webhook events

**Test Webhook:**
- In SendGrid dashboard, use "Test Your Integration" button
- Should see "OK" response

### Statistics Not Updating

**Wait for Processing:**
- Webhooks may take 1-2 minutes to process
- Refresh the page after waiting

**Check Browser Console:**
- Open F12 Developer Tools
- Look for any error messages

**Verify Database Functions Exist:**
```sql
-- Run in Supabase SQL Editor
SELECT proname FROM pg_proc WHERE proname IN (
  'increment_usage',
  'increment_campaign_stat',
  'update_contact_engagement'
);
```
Should return 3 rows.

---

## 📊 EXPECTED RESULTS AFTER FIRST TEST

### Campaigns Page
```
Campaign: "Test Campaign"
Status: sent ✓
Sent: 1
Opens: 1
Clicks: 1
```

### Dashboard
```
Total Sent: 1
Open Rate: 100%
Click Rate: 100%
Active Contacts: 1
```

### Supabase Database
```
campaigns:
- 1 campaign with status='sent'

email_events:
- 3 events (sent, open, click)

campaign_recipients:
- 1 recipient record

usage_metrics:
- 1 record with emails_sent=1

contacts:
- 1 contact with engagement_score=15
```

---

## 🎯 SUCCESS CHECKLIST

- [ ] SendGrid API key configured
- [ ] SendGrid webhook configured
- [ ] Test contact added
- [ ] Test campaign created
- [ ] Campaign sent successfully
- [ ] Email received in inbox
- [ ] Email opened
- [ ] Link clicked
- [ ] Dashboard shows real stats
- [ ] Campaign shows open/click counts
- [ ] Database tables populated correctly
- [ ] Contact engagement score increased

---

## 🚀 NEXT STEPS

Once basic sending works:

1. **Test with Multiple Contacts:**
   - Add 5-10 contacts
   - Send campaign to all
   - Verify batch processing works

2. **Test CSV Import:**
   - Go to Audience
   - Click "Import CSV"
   - Upload a CSV with multiple contacts
   - Verify all imported correctly

3. **Test Plan Limits:**
   - Try sending more than your plan allows
   - Should get quota exceeded error

4. **Test Stripe Integration:**
   - Go to Settings
   - Click upgrade button
   - Complete test payment
   - Verify plan updates

5. **Monitor for 24 Hours:**
   - Send a few campaigns
   - Watch analytics update
   - Check for any errors

---

## 💡 TIPS

1. **Always test with your own email first**
2. **Check SendGrid activity dashboard regularly**
3. **Monitor Supabase Edge Function logs**
4. **Wait 2-3 minutes for webhook events**
5. **Refresh pages to see updated stats**
6. **Keep browser console open to see errors**

---

## 🎉 YOU'RE DONE!

If all tests pass, you have a fully functional email marketing platform with:
- ✅ Email sending via SendGrid
- ✅ Real-time event tracking
- ✅ Campaign management
- ✅ Contact management with CSV import/export
- ✅ Live analytics dashboard
- ✅ Usage tracking
- ✅ Stripe payment integration

**The platform is production-ready!**
