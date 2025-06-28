const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: `Production Order System <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (user, resetToken) => {
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for only 10 minutes)',
            message,
            html: `
                <h1>Password Reset</h1>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetURL}">Reset Password</a>
                <p>This link will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });
    } catch (err) {
        console.error('Error sending password reset email:', err);
        throw new Error('There was an error sending the email. Try again later!');
    }
};

const sendShiftNotification = async (shift, users) => {
    const message = `New shift created: ${shift.name} on ${shift.date}`;
    const html = `
        <h1>New Shift Notification</h1>
        <p>A new shift has been created:</p>
        <ul>
            <li>Name: ${shift.name}</li>
            <li>Date: ${shift.date}</li>
            <li>Start Time: ${shift.startTime}</li>
            <li>End Time: ${shift.endTime}</li>
            <li>Department: ${shift.department.name}</li>
        </ul>
    `;

    try {
        for (const user of users) {
            await sendEmail({
                email: user.email,
                subject: 'New Shift Notification',
                message,
                html
            });
        }
    } catch (err) {
        console.error('Error sending shift notification:', err);
        throw new Error('There was an error sending shift notifications. Try again later!');
    }
};

module.exports = {
    sendEmail,
    sendPasswordResetEmail,
    sendShiftNotification
}; 