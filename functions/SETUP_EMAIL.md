# Email Infrastructure Setup Guide

This guide will help you set up automatic email sending for festival invitations using Firebase Cloud Functions and SendGrid.

## Prerequisites

- Firebase project (you already have this)
- SendGrid account (free tier available)
- Node.js installed (you have this)
- Firebase CLI installed

---

## Step 1: Install Firebase CLI

If not already installed:

```bash
npm install -g firebase-tools
```

---

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window to authenticate with your Google account.

---

## Step 3: Initialize Firebase Functions

From your project root directory:

```bash
cd C:\Users\paulk\festival-gear-tracker
firebase init functions
```

**Important**: When asked:
- "What language would you like to use?" → **JavaScript**
- "Do you want to use ESLint?" → **No** (or Yes, doesn't matter)
- "Do you want to install dependencies now?" → **Yes**

This will create/update the `functions` directory (already created for you).

---

## Step 4: Sign Up for SendGrid

1. Go to https://sendgrid.com/
2. Click "Start for free"
3. Create account (100 free emails/day forever)
4. Verify your email address

---

## Step 5: Verify Sender Email in SendGrid

**Important**: SendGrid requires you to verify the email you'll send FROM.

1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Fill in the form:
   - **From Name**: Festival Gear Tracker
   - **From Email Address**: noreply@yourdomain.com (use your actual domain)
   - **Reply To**: Your actual email
   - Fill in other required fields
4. Click "Create"
5. Check your email and click the verification link

**Note**: For production, you should use your own domain. For testing, you can use a Gmail address.

---

## Step 6: Get SendGrid API Key

1. In SendGrid Dashboard → Settings → API Keys
2. Click "Create API Key"
3. Name: "Festival Gear Tracker"
4. Permissions: **Full Access** (for simplicity) or **Mail Send** (more secure)
5. Click "Create & View"
6. **COPY THE API KEY** - you won't see it again!

Example: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 7: Update Sender Email in functions/index.js

Edit `functions/index.js` line 37:

```javascript
from: {
  email: 'noreply@yourfestival.com', // Change this to your verified SendGrid sender email
  name: 'Festival Gear Tracker'
},
```

**Replace** `noreply@yourfestival.com` with the email you verified in SendGrid.

---

## Step 8: Configure Firebase Functions

Set the SendGrid API key and your app URL:

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY_HERE"
firebase functions:config:set app.url="https://your-app.web.app"
```

**Replace**:
- `YOUR_SENDGRID_API_KEY_HERE` with your actual SendGrid API key from Step 6
- `https://your-app.web.app` with your actual Vercel URL

Example:
```bash
firebase functions:config:set sendgrid.key="SG.abc123..."
firebase functions:config:set app.url="https://festival-gear-tracker.vercel.app"
```

To verify config:
```bash
firebase functions:config:get
```

---

## Step 9: Deploy Functions

**Important**: Make sure you're on the Firebase Blaze plan (pay-as-you-go). Cloud Functions require this.

Upgrade if needed:
```bash
firebase open billing
```

Then deploy:

```bash
firebase deploy --only functions
```

This will:
1. Upload your function code to Firebase
2. Set up the trigger (onCreate for invitations)
3. Return a deployment URL

**Expected output**:
```
✔  functions[sendInvitationEmail]: Successful create operation.
Function URL: https://us-central1-your-project.cloudfunctions.net/sendInvitationEmail
```

---

## Step 10: Test the Email System

1. Go to your app's User Management page
2. Create a test invitation with your own email
3. Check your email inbox (and spam folder)
4. You should receive a beautiful branded invitation email!

---

## Troubleshooting

### "Billing account not configured"
- You need to upgrade to Firebase Blaze plan
- Go to Firebase Console → Spark (Free) → Upgrade
- Don't worry - you likely won't be charged anything for low volume

### "Failed to send email"
- Check SendGrid API key is correct: `firebase functions:config:get`
- Check sender email is verified in SendGrid
- Check Firebase Functions logs: `firebase functions:log`

### "Permission denied"
- Make sure you're logged in: `firebase login`
- Make sure you're in the right project: `firebase use --add`

### Email goes to spam
- This is normal for new SendGrid accounts
- After sending a few emails, deliverability improves
- Consider setting up domain authentication in SendGrid (advanced)

### Check Firebase Logs
```bash
firebase functions:log
```

This shows all function execution logs and errors.

---

## Costs

**SendGrid**:
- Free tier: 100 emails/day forever
- Paid plans start at $15/month for 40,000 emails

**Firebase**:
- Blaze plan required for Cloud Functions
- Generous free tier: 2M invocations/month
- You'll likely stay in free tier unless you have massive volume
- Typical costs for small festivals: $0/month

---

## How It Works

1. User creates invitation in your app
2. Firestore document created in `invitations` collection
3. Firebase Cloud Function automatically triggers
4. Function checks `emailSent` flag
5. If false, sends email via SendGrid
6. Marks `emailSent: true` in Firestore
7. Recipient gets beautiful HTML email
8. They click link → Your invitation page

**Fully automatic!** No manual work needed after setup.

---

## Next Steps

After email is working:
- Consider adding email templates for other events (festival updates, reminders, etc.)
- Set up domain authentication in SendGrid for better deliverability
- Monitor SendGrid dashboard for email statistics
- Add error notifications if emails fail

---

## Support

If you need help:
1. Check Firebase Functions logs: `firebase functions:log`
2. Check SendGrid activity: SendGrid Dashboard → Activity Feed
3. Check Firestore to see if `emailSent` is being set
4. Google the specific error message

Good luck! 🎉
