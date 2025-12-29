const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface BrevoEmailOptions {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendBrevoEmail(options: BrevoEmailOptions) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'team@zzyraai.com';
  const fromName = process.env.BREVO_FROM_NAME || 'Zyra AI';

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  const recipients = Array.isArray(options.to) 
    ? options.to.map(email => ({ email }))
    : [{ email: options.to }];

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: recipients,
    subject: options.subject,
    htmlContent: options.htmlContent,
    textContent: options.textContent || options.htmlContent.replace(/<[^>]*>/g, '')
  };

  console.log('📧 Sending email via Brevo:', { 
    to: options.to, 
    subject: options.subject,
    from: fromEmail 
  });

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Brevo API error:', errorData);
    throw new Error(`Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  console.log('✅ Email sent successfully via Brevo:', result);
  return { success: true, messageId: result.messageId };
}

export async function sendConfirmationEmail(email: string, confirmationUrl: string) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm Your Email - Zyra AI</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Zyra AI</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered E-commerce Platform</p>
          </td>
        </tr>
        <tr>
          <td style="background-color: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Confirm Your Email</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
              Thank you for signing up for Zyra AI! Please click the button below to verify your email address and activate your account.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="text-align: center;">
                  <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Verify Email Address
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              If you didn't create an account with Zyra AI, you can safely ignore this email.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0;">
              This link will expire in 24 hours.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Zyra AI - Empowering your e-commerce with artificial intelligence
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    to: email,
    subject: 'Confirm Your Email - Zyra AI',
    htmlContent
  });
}
