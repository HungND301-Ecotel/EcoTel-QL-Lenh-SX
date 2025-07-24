import React, { useState } from 'react';
import { Box, Typography, Link, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { CheckCircle, ArrowRight, Info, Email, Phone } from '@mui/icons-material'

const PrivacyPolicy: React.FC = () => {
    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom fontWeight={700}>
                🔒 CHÍNH SÁCH BẢO MẬT
            </Typography>
            <Typography variant="body2" color="gray" gutterBottom>
                📅 Cập nhật lần cuối: 24/07/2025
            </Typography>

            <Typography variant="h6" mt={3} fontWeight={600}>1. CAM KẾT BẢO MẬT THÔNG TIN NGƯỞI DÙNG</Typography>
            <List>
                {[
                    'Chỉ thu thập thông tin cần thiết cho mục đích cung cấp dịch vụ',
                    'Không bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn với bên thứ ba không liên quan',
                    'Áp dụng các biện pháp bảo mật vật lý, điện tử và quản lý đối với thông tin',
                    'Chỉ lưu trữ thông tin trong thời gian cần thiết hoặc theo yêu cầu pháp luật',
                    'Minh bạch về cách chỉnh tối và sử dụng dữ liệu cá nhân'
                ].map((item, index) => (
                    <ListItem key={index} disableGutters>
                        <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                        <ListItemText primary={item} />
                    </ListItem>
                ))}
            </List>

            <Typography variant="h6" mt={3} fontWeight={600}>2. QUYỀN CỦA NGƯỞI DÙNG THEO GDPR</Typography>
            {["2.1 Quyền truy cập", "2.2 Quyền sửa đổi", "2.3 Quyền xóa bỏ (quyền được lãng quên)", "2.4 Quyền hạn chế xử lý", "2.5 Quyền phản đối", "2.6 Quyền di chuyển dữ liệu"].map((title, index) => (
                <Typography key={index} mt={1.5}>
                    <ArrowRight sx={{ verticalAlign: 'middle' }} /> {title}
                </Typography>
            ))}

            <Typography variant="h6" mt={3} fontWeight={600}>3. BẢO VỆ DỬ LIỆU TRẺ EM THEO COPPA</Typography>
            <List>
                {[
                    'Ứng dụng/dịch vụ của chúng tôi không nhằm mục tiêu đến trẻ em dưới 13 tuổi',
                    'Nếu chúng tôi phát hiện đã thu thập thông tin từ trẻ em dưới 13 tuổi mà không có sự đồng ý của phụ huynh, chúng tôi sẽ xóa thông tin đó ngay lập tức',
                    'Phụ huynh hoặc người giám hộ có thể xem xét, yêu cầu xóa hoặc từ chối tiếp tục thu thập thông tin về con em mình'
                ].map((item, index) => (
                    <ListItem key={index} disableGutters>
                        <ListItemIcon><Info color="primary" /></ListItemIcon>
                        <ListItemText primary={item} />
                    </ListItem>
                ))}
            </List>

            <Typography variant="h6" mt={3} fontWeight={600}>4. PHẠM VI ÁP DỤNG VÀ THAY ĐỔI CHÍNH SÁCH</Typography>
            <Typography mt={2}><ArrowRight /> 4.1 Phạm vi áp dụng</Typography>
            <List sx={{ pl: 4 }}>
                {[
                    'Ứng dụng di động ESoft eGC trên các nền tảng iOS và Android',
                    'Trang web của chúng tôi (địa chỉ website)',
                    'Bất kỳ dịch vụ, tính năng hoặc nội dung nào liên quan'
                ].map((item, index) => (
                    <ListItem key={index} disableGutters>
                        <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary={item} />
                    </ListItem>
                ))}
            </List>

            <Typography mt={2}><ArrowRight /> 4.2 Thay đổi chính sách</Typography>
            <List sx={{ pl: 4 }}>
                {[
                    'Chúng tôi có thể cập nhật Chính sách Bảo mật này theo thời gian',
                    'Chúng tôi sẽ thông báo cho bạn qua ứng dụng hoặc email',
                    'Chúng tôi sẽ có thông báo nhạy “Cập nhật lần cuối” ở đầu chính sách này',
                    'Việc bạn tiếp tục sử dụng dịch vụ sau khi thay đổi có hiệu lực được coi là chấp nhận chính sách mới'
                ].map((item, index) => (
                    <ListItem key={index} disableGutters>
                        <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary={item} />
                    </ListItem>
                ))}
            </List>

            <Box mt={4} p={2} bgcolor="#f5f5f5" borderRadius={2}>
                <Typography variant="h6" fontWeight={600}>LIÊN HỆ VỜI CHÚNG TÔI</Typography>
                <Typography mt={1}>
                    Nếu bạn có bất kỳ câu hỏi nào về Chính sách Bảo mật này, vui lòng liên hệ:
                </Typography>
                <Typography mt={1}><Email fontSize="small" sx={{ verticalAlign: 'middle' }} /> info@ecotel.com.vn</Typography>
                <Typography><Phone fontSize="small" sx={{ verticalAlign: 'middle' }} /> (+84)378 665822</Typography>
            </Box>
        </Box>
    )
}

export default PrivacyPolicy
