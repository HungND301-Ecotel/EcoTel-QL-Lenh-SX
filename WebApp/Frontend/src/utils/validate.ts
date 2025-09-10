import * as yup from 'yup';

export const trvelLogValidationSchema = yup.object({
    excavator: yup.string().required('Vui lòng chọn máy xúc'),
    location: yup.string().required('Vui lòng chọn điểm đổ tải'),
    distance: yup.string().required('Vui lòng nhập cung độ'),
    startTime: yup.string().required('Vui lòng chọn thời gian bắt đầu'),
    endTime: yup.string().required('Vui lòng chọn thời gian kết thúc'),
});