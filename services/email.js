const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.host = process.env.EMAIL_HOST || 'smtp.gmail.com';
        this.port = process.env.EMAIL_PORT || 587;
        this.user = process.env.EMAIL_USER;
        this.pass = process.env.EMAIL_PASS;

        if (this.user && this.pass) {
            this.transporter = nodemailer.createTransport({
                host: this.host,
                port: this.port,
                secure: this.port == 465,
                auth: {
                    user: this.user,
                    pass: this.pass
                }
            });
            console.log('✓ Email Service Initialized (SMTP)');
        } else {
            console.warn('⚠️ Email Credentials missing. Operating in MOCK mode.');
            this.transporter = null;
        }
    }

    async sendOTP(email, code) {
        return this.sendMail(email, 'Verification Code - SparkMotors', `Your verification code is: ${code}`, `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #c97d3c;">SparkMotors Verification</h2>
                <p>Use the code below to complete your login. It remains valid for 5 minutes.</p>
                <div style="font-size: 2rem; font-weight: bold; background: #f5f5f0; padding: 15px; border-radius: 8px; text-align: center; color: #000; letter-spacing: 5px;">
                    ${code}
                </div>
                <p style="margin-top: 20px; font-size: 0.9rem; color: #666;">If you did not request this code, please ignore this email.</p>
            </div>
        `);
    }

    async sendOrderConfirmation(email, orderId, name) {
        return this.sendMail(email, `Order Placed Successfully! #${orderId}`, `Thank you ${name}, your order ${orderId} has been placed.`, `
            <div style="font-family: Arial, sans-serif; padding: 30px; color: #222; background: #fff; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px;">
                <h2 style="color: #c97d3c; margin-bottom: 5px;">Order Placed Successfully!</h2>
                <p style="color: #666; margin-top: 0;">Thank you for shopping with SparkMotors, ${name}.</p>
                
                <div style="background: #fdfaf5; padding: 25px; border: 2px dashed #c97d3c; border-radius: 10px; text-align: center; margin: 25px 0;">
                    <p style="text-transform: uppercase; font-size: 0.8rem; color: #888; letter-spacing: 2px; margin-bottom: 5px;">Your Order Tracking ID</p>
                    <h1 style="margin: 0; font-family: monospace; font-size: 1.8rem;">${orderId}</h1>
                </div>
                
                <p style="line-height: 1.6;">You can track your order status anytime on our website using your Tracking ID.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.8rem; color: #999; text-align: center;">
                    SparkMotors — Premium Spare Parts Shop
                </div>
            </div>
        `);
    }

    async sendMail(to, subject, text, html) {
        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: `"SparkMotors" <${this.user}>`,
                    to, subject, text, html
                });
                console.log(`✓ Real Email sent to ${to}`);
                return true;
            } catch (err) {
                console.error('✗ Email Error:', err.message);
                throw new Error(`Email Error: ${err.message}`);
            }
        } else {
            console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
            return true;
        }
    }
}

module.exports = new EmailService();
