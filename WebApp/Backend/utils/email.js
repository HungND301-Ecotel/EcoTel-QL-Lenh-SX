const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: `Production Order System <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (user, password) => {
    const message = `Cấp lại mật khẩu`;

    try {
        await sendEmail({
            to: user.email,
            subject: 'Cấp lại mật khẩu',
            message,
            html: `
            <!DOCTYPE html>
                <html>
                <head>
                    <title>Thông Báo Cấp Lại Mật Khẩu</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">

                    <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                        <h2 style="color: #333;">Yêu Cầu Cấp Lại Mật Khẩu</h2>
                        <br>
                        
                        <p>Xin chào ${user.fullName},</p>
                        
                        <p>Chúng tôi đã nhận được yêu cầu cấp lại mật khẩu cho tài khoản của bạn.</p>
                        
                        <p>Mật khẩu tạm thời mới của bạn là:</p>
                        
                        <div style="text-align: center; margin: 20px 0; padding: 10px; background-color: #f9f9f9; border: 1px dashed #ccc;">
                            <strong style="font-size: 24px; color: #d9534f;">${password}</strong>
                        </div>
                        
                        <p>⚠️ Vì lý do bảo mật, bạn cần thay đổi mật khẩu này ngay sau khi đăng nhập thành công.</p>
                        
                        <p>Nếu bạn không yêu cầu cấp lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ ngay với bộ phận hỗ trợ của chúng tôi.</p>
                        
                        <p>Trân trọng</p>
                    </div>

                </body>
            </html>
            `
        });
        console.success('Gửi email thành công');
    } catch (err) {
        console.error('Gửi email thất bại', err);
        throw new Error('Gửi email thất bại. Vui lòng thử lại!');
    }
};

const sendShiftNotification = async (user, order, type = "receive") => {

    const shiftName = order.shift?.name || "Không xác định";
    const workingDate = order.workingDate?.toLocaleDateString("vi-VN") || "";
    const startTime = order.shift?.startTime || "";

    let title = "";
    let subject = "";
    let messageHtml = "";

    if (type === "receive") {
        // 📌 THÔNG BÁO NHẬN LỆNH
        title = "⚠️ CẢNH BÁO NHẮC NHỞ NHẬN LỆNH SẢN XUẤT";
        subject = `Cảnh báo: Bạn chưa xác nhận công việc ca ${shiftName}`;
        messageHtml = `
            <p>Chào <strong>${user?.fullName}</strong>,</p>

            <p>Bạn hiện vẫn <strong>chưa xác nhận lệnh sản xuất</strong> của ca làm việc:</p>
        `;
    } else {
        // 📌 THÔNG BÁO KẾT THÚC CA
        title = "⚠️ NHẮC NHỞ KẾT THÚC CA";
        subject = `Nhắc nhở: Ca ${shiftName} vẫn còn công việc chưa hoàn thành`;
        messageHtml = `
            <p>Chào <strong>${user?.fullName}</strong>,</p>

            <p>Hệ thống ghi nhận rằng <strong>ca trước của bạn vẫn còn công việc chưa hoàn thành</strong>.</p>
            <p>Vui lòng kiểm tra lại để đảm bảo ca làm việc được kết thúc đúng quy trình.</p>
        `;
    }

    const html = `
    <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:8px; overflow:hidden; box-shadow:0 3px 10px rgba(0,0,0,0.1);">
            
            <div style="background:#ff9800; padding:18px; color:white; font-size:20px; font-weight:bold; text-align:center;">
                ${title}
            </div>
            
            <div style="padding:20px; font-size:15px; line-height:1.6; color:#333;">
                ${messageHtml}

                <table style="width:100%; margin-top:10px; border-collapse: collapse;">
                    <tr>
                        <td style="padding:8px; border:1px solid #ddd; background:#fafafa;"><strong>Ca</strong></td>
                        <td style="padding:8px; border:1px solid #ddd;">${shiftName}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; border:1px solid #ddd; background:#fafafa;"><strong>Ngày</strong></td>
                        <td style="padding:8px; border:1px solid #ddd;">${workingDate}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; border:1px solid #ddd; background:#fafafa;"><strong>Giờ bắt đầu</strong></td>
                        <td style="padding:8px; border:1px solid #ddd;">${startTime}</td>
                    </tr>
                </table>

                <p style="margin-top:25px; font-size:14px; color:#777;">
                    Đây là email tự động. Vui lòng không phản hồi.
                </p>
            </div>

        </div>
    </div>
    `;

    try {
        await sendEmail({
            to: user?.email,
            subject,
            message: "",
            html
        });

    } catch (err) {
        console.error('Gửi email thất bại', err);
        throw new Error('Gửi email thất bại. Vui lòng thử lại!');
    }
};



module.exports = {
    sendEmail,
    sendPasswordResetEmail,
    sendShiftNotification
}; 