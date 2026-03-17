const twilio = require('twilio');

class TwilioService {
    constructor() {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        // TWILIO_PHONE_NUMBER is for SMS, TWILIO_WHATSAPP_NUMBER is for WhatsApp
        let rawFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+9080799320';
        if (rawFrom.length === 10 && !rawFrom.startsWith('+') && !rawFrom.includes(':')) {
            rawFrom = `+91${rawFrom}`;
        }
        this.fromNumber = rawFrom;

        if (sid && sid.startsWith('AC') && token) {
            this.client = twilio(sid, token);
            console.log('✓ Twilio Service Initialized using:', this.fromNumber);
        } else {
            console.warn('⚠️ Twilio Credentials missing. Operating in MOCK mode.');
            this.client = null;
        }
    }

    async sendOTP(phone, code) {
        return this.sendMessage(phone, `Your SparkMotors verification code is: ${code}. Valid for 5 minutes.`);
    }

    async sendMessage(phone, message) {
        let formattedPhone = phone;
        if (phone.length === 10 && !phone.startsWith('+')) {
            formattedPhone = `+91${phone}`;
        }

        if (this.client) {
            try {
                // Determine if we should use WhatsApp prefix
                const isWhatsApp = this.fromNumber.startsWith('whatsapp:');
                const to = isWhatsApp ? (formattedPhone.startsWith('whatsapp:') ? formattedPhone : `whatsapp:${formattedPhone}`) : formattedPhone;

                await this.client.messages.create({
                    body: message,
                    from: this.fromNumber,
                    to: to
                });
                console.log(`✓ Real Message (${isWhatsApp ? 'WhatsApp' : 'SMS'}) sent to ${to}`);
                return true;
            } catch (err) {
                console.error('✗ Twilio Error:', err.message);
                throw new Error(`Twilio Error: ${err.message}`);
            }
        } else {
            console.log(`[MOCK MESSAGE] To: ${formattedPhone}, Body: ${message}`);
            return true;
        }
    }
}

module.exports = new TwilioService();
