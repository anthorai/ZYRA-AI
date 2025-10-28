import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email};
}

export async function getUncachableSendGridClient() {
  const {apiKey, email} = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

export async function sendEmail(to: string | string[], subject: string, htmlContent: string) {
  const {client, fromEmail} = await getUncachableSendGridClient();
  
  const msg = {
    to: Array.isArray(to) ? to : [to],
    from: fromEmail,
    subject,
    html: htmlContent,
  };

  try {
    const result = await client.send(msg);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error: any) {
    console.error('SendGrid error:', error.response?.body || error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendBulkEmails(messages: Array<{to: string, subject: string, html: string}>) {
  const {client, fromEmail} = await getUncachableSendGridClient();
  
  const formattedMessages = messages.map(msg => ({
    to: msg.to,
    from: fromEmail,
    subject: msg.subject,
    html: msg.html,
  }));

  try {
    const result = await client.send(formattedMessages);
    return { success: true, count: formattedMessages.length };
  } catch (error: any) {
    console.error('SendGrid bulk error:', error.response?.body || error.message);
    throw new Error(`Failed to send bulk emails: ${error.message}`);
  }
}
