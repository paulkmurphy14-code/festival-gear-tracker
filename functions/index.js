const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

/**
 * Trigger when new invitation is created in Firestore
 * Sends beautiful HTML email with invitation link
 */
exports.sendInvitationEmail = functions.firestore
  .document('invitations/{invitationId}')
  .onCreate(async (snap, context) => {
    // Set SendGrid API key from environment variables
    // Configure in functions/.env file
    sgMail.setApiKey(process.env.SENDGRID_KEY);

    const invitation = snap.data();
    const invitationId = context.params.invitationId;

    // Check if email should be sent
    if (invitation.emailSent) {
      console.log('Email already sent for invitation:', invitationId);
      return null;
    }

    // Get the app URL from environment variables
    // Configure in functions/.env file
    const appUrl = process.env.APP_URL || 'https://your-app.web.app';
    const inviteLink = `${appUrl}/invite/${invitationId}`;

    const msg = {
      to: invitation.email,
      from: {
        email: 'festivalgeartracker@gmail.com', // Must be verified in SendGrid
        name: 'Festival Gear Tracker'
      },
      subject: `You've been invited to ${invitation.festivalName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background-color: #1a1a1a;
              color: #e0e0e0;
              padding: 20px;
              margin: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #2d2d2d;
              border-radius: 20px;
              padding: 40px;
              border: 2px solid #ffa500;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .emoji {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              color: #ffa500;
              font-size: 24px;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 700;
            }
            .content {
              background: #1a1a1a;
              padding: 20px;
              border-radius: 12px;
              margin: 20px 0;
              border: 2px solid #664400;
            }
            .detail {
              margin: 12px 0;
              font-size: 16px;
            }
            .label {
              color: #ffa500;
              font-weight: 700;
            }
            .role {
              text-transform: uppercase;
              color: #4caf50;
              font-weight: 700;
            }
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: #ffa500;
              color: #1a1a1a;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 700;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 20px auto;
              display: block;
              text-align: center;
              max-width: 300px;
            }
            .button:hover {
              background: #ff8c00;
            }
            .footer {
              text-align: center;
              color: #888;
              font-size: 12px;
              margin-top: 30px;
            }
            .link-text {
              color: #888;
              font-size: 12px;
              word-break: break-all;
              margin-top: 20px;
              padding: 10px;
              background: #1a1a1a;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">🎪</div>
              <h1>You've Been Invited!</h1>
            </div>

            <div class="content">
              <div class="detail">
                <span class="label">Festival:</span> ${invitation.festivalName}
              </div>
              <div class="detail">
                <span class="label">Your Role:</span>
                <span class="role">${invitation.role}</span>
              </div>
              <div class="detail">
                <span class="label">Your Email:</span> ${invitation.email}
              </div>
            </div>

            <a href="${inviteLink}" class="button">
              Accept Invitation & Join
            </a>

            <div class="link-text">
              Or copy this link: ${inviteLink}
            </div>

            <div class="footer">
              <p>This invitation will expire in 7 days.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p style="margin-top: 20px;">
                Powered by <strong>Festival Gear Tracker</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
You've been invited to ${invitation.festivalName}!

Festival: ${invitation.festivalName}
Your Role: ${invitation.role}
Your Email: ${invitation.email}

Click here to accept your invitation:
${inviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
      `
    };

    try {
      await sgMail.send(msg);

      // Update invitation to mark email as sent
      await admin.firestore()
        .collection('invitations')
        .doc(invitationId)
        .update({
          emailSent: true,
          emailSentAt: admin.firestore.FieldValue.serverTimestamp()
        });

      console.log('Invitation email sent successfully to:', invitation.email);
      return null;

    } catch (error) {
      console.error('Error sending email:', error);

      // Log error to Firestore
      await admin.firestore()
        .collection('invitations')
        .doc(invitationId)
        .update({
          emailError: error.message,
          emailSent: false
        });

      throw error;
    }
  });
