import twilio from 'twilio';
import { User } from '@shared/schema';

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

/**
 * Send notifications to a user based on their preferences and available contact methods
 */
export async function sendUserNotification(user: User, message: string): Promise<{sms: boolean, whatsapp: boolean}> {
  const results = { sms: false, whatsapp: false };

  // Send SMS if user has SMS notifications enabled and mobile number available
  if (user.enableSmsNotifications && user.mobileNumber) {
    results.sms = await sendSMSNotification(user.mobileNumber, message);
  }

  // Send WhatsApp if user has WhatsApp notifications enabled and WhatsApp number available
  if (user.enableWhatsappNotifications && user.whatsappNumber) {
    results.whatsapp = await sendWhatsAppNotification(user.whatsappNumber, message);
  }

  // Log notification attempt
  const methods = [];
  if (results.sms) methods.push('SMS');
  if (results.whatsapp) methods.push('WhatsApp');
  
  if (methods.length > 0) {
    console.log(`Notifications sent to ${user.firstName} ${user.lastName} via: ${methods.join(', ')}`);
  } else {
    console.log(`No notifications sent to ${user.firstName} ${user.lastName} - no enabled contact methods`);
  }

  return results;
}

/**
 * Send notifications to multiple users
 */
export async function sendBulkUserNotifications(users: User[], message: string): Promise<void> {
  const promises = users.map(user => sendUserNotification(user, message));
  await Promise.all(promises);
}
