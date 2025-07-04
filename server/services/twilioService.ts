import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

let client: twilio.Twilio | null = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

export async function sendSMSNotification(to: string, message: string): Promise<boolean> {
  if (!client || !fromNumber) {
    console.warn('Twilio not configured. SMS notification not sent.');
    return false;
  }

  try {
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    
    console.log(`SMS sent to ${to}: ${message}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

export async function sendWhatsAppNotification(to: string, message: string): Promise<boolean> {
  if (!client || !fromNumber) {
    console.warn('Twilio not configured. WhatsApp notification not sent.');
    return false;
  }

  try {
    await client.messages.create({
      body: message,
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${to}`
    });
    
    console.log(`WhatsApp sent to ${to}: ${message}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return false;
  }
}
