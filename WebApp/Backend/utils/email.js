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

const createOrderTableHTML = (orders) => {
    let tableRows = orders.map((order, index) => {
        // Xác định loại nhắc nhở để hiển thị Trạng thái (status) hoặc Lý do nhắc
        let reminderReason = "";
        let statusDisplay = "";

        if (order.reminderType === "pending") {
            statusDisplay = "CHƯA NHẬN LỆNH";
            reminderReason = "Cần nhận lệnh sản xuất";
        } else { // Các loại completed, shiftReport, report
            statusDisplay = order.status; // Có thể hiển thị trạng thái hiện tại
            if (order.reminderType === "shiftReport") {
                reminderReason = "Chưa báo công ca trước";
            } else if (order.reminderType === "report") {
                reminderReason = "Chưa báo chuyến/sản lượng ca trước";
            } else {
                reminderReason = "Ca trước còn lệnh chưa hoàn thành.";
            }
        }

        const assignedToName = order.assignedTo?.fullName || 'N/A';
        const salaryCode = order.assignedTo?.salaryCode || 'N/A';
        const jobName = order.job?.name || 'N/A'; // Giả sử job có trường name

        // Lưu ý: Cần đảm bảo các trường như order.job.name có sẵn thông qua populate
        return `
            <tr>
                <td style="padding: 2px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                <td style="padding: 2px; border: 1px solid #ddd;">${assignedToName}</td>
                <td style="padding: 2px; border: 1px solid #ddd; text-align: center;">${salaryCode}</td>
                <td style="padding: 2px; border: 1px solid #ddd;">${jobName}</td>
                <td style="padding: 2px; border: 1px solid #ddd; color: red; font-weight: bold;">${reminderReason}</td>
            </tr>
        `;
    }).join('');

    const tableHTML = `
        <table style="width:100%; margin-top:20px; border-collapse: collapse; font-size: 10px;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th style="padding: 8px; border: 1px solid #ddd;">STT</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Công nhân</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Mã thẻ</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Công việc</th>
                    <th style="padding: 8px; border: 1px solid #ddd;width:100px">Lý do cảnh báo</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
    return `
        <div style="margin-top:20px; overflow-x: auto; max-width: 100%;">
            ${tableHTML}
        </div>
    `;
};
// Giữ nguyên hàm createOrderTableHTML (đã định nghĩa ở phần trước)

const sendCombinedNotification = async (user, allOrders) => {
    // 1. Phân loại lệnh
    const pendingOrders = allOrders.filter(o => o.reminderType === "pending");
    const previousOrders = allOrders.filter(o => o.reminderType !== "pending");

    // Lấy thông tin ca/ngày từ lệnh đầu tiên (dùng để hiển thị thông tin chung)
    const firstOrder = allOrders[0];
    const shiftName = firstOrder.shift?.name || "Không xác định";
    const workingDate = firstOrder.workingDate?.toLocaleDateString("vi-VN") || "";

    // 2. Tạo nội dung và tiêu đề
    const title = "⚠️ BÁO CÁO TỔNG HỢP CẢNH BÁO LỆNH SẢN XUẤT";
    const subject = `Báo cáo: ${allOrders.length} lệnh tồn đọng/chưa nhận ca ${shiftName} ngày ${workingDate}`;

    let pendingSectionHTML = "";
    let previousSectionHTML = "";

    // A. Xử lý phần Lệnh PENDING (Nhắc nhận lệnh)
    if (pendingOrders.length > 0) {
        pendingSectionHTML = `
            <h3 style="color:#ff9800; border-bottom: 2px solid #ff9800; padding-bottom: 5px;">I. CẢNH BÁO LỆNH SẢN XUẤT CHƯA NHẬN (${pendingOrders.length} lệnh)</h3>
            <p>Phòng/Ban của bạn hiện có <strong>${pendingOrders.length} lệnh</strong> ca hiện tại/sắp tới chưa được công nhân xác nhận:</p>
            ${createOrderTableHTML(pendingOrders)}
        `;
    }

    // B. Xử lý phần Lệnh CA TRƯỚC (Nhắc kết thúc ca/báo cáo)
    if (previousOrders.length > 0) {
        previousSectionHTML = `
            <h3 style="color:#f44336; border-bottom: 2px solid #f44336; padding-bottom: 5px; margin-top: 30px;">II. NHẮC NHỞ LỆNH CA TRƯỚC CÒN TỒN ĐỌNG (${previousOrders.length} lệnh)</h3>
            <p>Hệ thống ghi nhận <strong>${previousOrders.length} lệnh</strong> từ ca trước vẫn chưa hoàn thành hoặc chưa có báo cáo cần thiết:</p>
            ${createOrderTableHTML(previousOrders)}
        `;
    }

    // Nếu không có lỗi nào, thì không gửi email
    if (allOrders.length === 0) return;

    const messageHtml = `
        <p>Chào <strong>${user?.fullName}</strong>,</p>
        <p>Đây là báo cáo tổng hợp các cảnh báo về lệnh sản xuất chưa nhận hoặc lệnh tồn đọng từ ca trước.</p>
        
        ${pendingSectionHTML}
        ${previousSectionHTML}
    `;

    // --- Template Email (Giữ nguyên cấu trúc HTML bên ngoài) ---
    const html = `
    <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
        <div style="max-width:850px; margin:auto; background:white; border-radius:8px; overflow:hidden; box-shadow:0 3px 10px rgba(0,0,0,0.1);">
            
            <div style="background:#007bff; padding:18px; color:white; font-size:20px; font-weight:bold; text-align:center;">
                ${title}
            </div>
            
            <div style="padding:20px; font-size:15px; line-height:1.6; color:#333;">
                ${messageHtml}

                <p style="margin-top:25px; font-size:14px; color:#777;">
                    Đây là email tự động. Vui lòng không phản hồi.
                </p>
            </div>
        </div>
    </div>
    `;

    // Gửi email
    try {
        await sendEmail({
            to: user?.email,
            subject,
            message: "",
            html
        });
    } catch (err) {
        console.error('Gửi email tổng hợp thất bại', err);
        throw new Error('Gửi email thất bại. Vui lòng thử lại!');
    }
};



module.exports = {
    sendEmail,
    sendPasswordResetEmail,
    sendCombinedNotification
}; 