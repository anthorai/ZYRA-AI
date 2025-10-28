import twilio from 'twilio';

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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
  accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendSMS(to: string, message: string) {
  const client = await getTwilioClient();
  const fromNumber = await getTwilioFromPhoneNumber();

  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    });
    return { success: true, messageId: result.sid };
  } catch (error: any) {
    console.error('Twilio SMS error:', error.message);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

export async function sendBulkSMS(messages: Array<{to: string, message: string}>) {
  const client = await getTwilioClient();
  const fromNumber = await getTwilioFromPhoneNumber();

  const results = [];
  const errors = [];

  for (const msg of messages) {
    try {
      const result = await client.messages.create({
        body: msg.message,
        from: fromNumber,
        to: msg.to,
      });
      results.push({ to: msg.to, messageId: result.sid, success: true });
    } catch (error: any) {
      console.error(`Twilio SMS error for ${msg.to}:`, error.message);
      errors.push({ to: msg.to, error: error.message });
    }
  }

  return { 
    success: errors.length === 0, 
    sent: results.length, 
    failed: errors.length,
    results,
    errors
  };
}
