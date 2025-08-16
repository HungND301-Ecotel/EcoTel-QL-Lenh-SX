import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik'
import React, { Dispatch, SetStateAction, useEffect } from 'react'
import api from '../../config/api.config';
import { ShiftReportType, Report, Job } from '../../types';
import { showErrorAlert, showSuccessAlert } from '../Alert';

export default function ShiftReport({ open, setOpen, initialValues }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>>, initialValues: any }) {

    const queryClient = useQueryClient()

    const { data: reports = [] } = useQuery({
        queryKey: ['reports', initialValues],
        queryFn: () => api.get(`/reports/getByOrder/${initialValues._id}`).then(res => res.data.data),
    });
    const updateMutation = useMutation({
        mutationFn: (updatedShiftReport: ShiftReportType) =>
            api.put(`/shiftReports/${updatedShiftReport._id}`, updatedShiftReport).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            // showSuccessAlert('Cập nhật thông tin thành công')
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });
    const updateReportMutation = useMutation({
        mutationFn: (updateReport: Report) =>
            api.put(`/reports/${updateReport._id}`, updateReport).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            // showSuccessAlert('Cập nhật thông tin thành công')
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });
    const shiftReportFormik = useFormik({
        initialValues: {
            orderId: '',
            assignedTo: '',
            vehicleSummaries: [{
                vehicle: undefined,
                repairHours: undefined,
                travelHours: undefined,
                fuelRemain: undefined,
                fuelReceived: undefined,
                fuelRemainEnd: undefined,
                status: "",
                note: "",
                gpsStatus: "",
                sealStatus: ""
            }],
            handoverHours: undefined,
            otherHours: undefined,
            handoverNotes: "",
            risks: "",
        },
        onSubmit: (values) => {
        },
    })

    const reportFormik = useFormik({
        initialValues: {
            orderId: '',
            vehicleReports: [{
                device: undefined,
                excavator: undefined,
                fromLocation: undefined,
                toLocation: undefined,
                material: undefined,
                distanceKm: undefined,
                drillDepth: undefined,
                hardnessF: undefined,
                workingMinutes: undefined,
                quantity: undefined,
            }],
        },
        onSubmit: (values) => {
        },
    })
    useEffect(() => {
        if (initialValues && open) {
            const shiftReport = initialValues?.shiftReport;

            shiftReportFormik.setValues({
                orderId: initialValues._id,
                assignedTo: initialValues?.assignedTo?._id,
                vehicleSummaries: shiftReport?.vehicleSummaries?.map((v: any) => ({
                    vehicle: v?.vehicle?._id,
                    repairHours: v?.repairHours,
                    travelHours: v?.travelHours,
                    fuelRemain: v?.fuelRemain,
                    fuelReceived: v?.fuelReceived,
                    fuelRemainEnd: v?.fuelRemainEnd,
                    status: v?.status || '',
                    note: v?.note || '',
                    gpsStatus: v?.gpsStatus || '',
                    sealStatus: v?.sealStatus || '',
                })) || [],
                handoverHours: shiftReport?.handoverHours,
                otherHours: shiftReport?.otherHours,
                handoverNotes: shiftReport?.handoverNotes || '',
                risks: shiftReport?.risks || '',
            });
        }
    }, [initialValues, open]);
    useEffect(() => {
        if (reports.length > 0 && open) {
            reportFormik.setValues({
                orderId: initialValues._id,
                vehicleReports: reports.map((v: any) => ({
                    _id: v._id,
                    device: v.device?._id,
                    excavator: v.excavator?._id,
                    fromLocation: v.fromLocation?._id,
                    toLocation: v.toLocation?._id,
                    material: v.material?._id,
                    distanceKm: v?.distanceKm,
                    drillDepth: v?.drillDepth,
                    hardnessF: v?.hardnessF,
                    workingMinutes: v?.workingMinutes,
                    quantity: v?.quantity,
                })) || [],
            });
        }
    }, [open, reports]);

    const handleUpdateAll = async () => {
        try {
            await Promise.all(
                [updateMutation.mutateAsync({ ...shiftReportFormik.values, _id: initialValues?.shiftReport._id })]
                    .concat(
                        reports.length > 0
                            ? reportFormik.values.vehicleReports.map((r: any) => updateReportMutation.mutateAsync(r))
                            : []
                    )
            );
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            showSuccessAlert("Cập nhật thành công!");
            handleClose();
        } catch (err: any) {
            showErrorAlert(err.response?.data?.message || err.message || "Lỗi");
        }
    };

    const handleClose = () => {
        setOpen(false)
        shiftReportFormik.resetForm()
        reportFormik.resetForm()
    }

    const shiftReport = initialValues?.shiftReport

    let isOver48Hours = false;

    if (initialValues?.endTime) {
        const end = new Date(initialValues.endTime);
        if (!isNaN(end.getTime())) {
            const hours = (Date.now() - end.getTime()) / (1000 * 60 * 60);
            isOver48Hours = hours >= 48;
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogContent>
                <Typography variant="h6" gutterBottom>Mã thẻ lương: {initialValues?.assignedTo?.fullName} - {initialValues?.assignedTo?.salaryCode} - {initialValues?.job?.name}</Typography>
                {["Vận hành xe", "Vận hành xúc", "Vận hành gạt", "Vận hành khoan", "Vận hành xe phục vụ"].includes(initialValues?.job?.type ?? "") && <Box>
                    <Typography variant="h5">Báo chuyến/ sản lượng:</Typography>
                    {reports.length > 0 ? (reports?.map((item: any, index: number) => (<Box key={index}>
                        <Grid container spacing={2} mb={2} key={index}>
                            <Grid item xs={3}>
                                <Typography variant='h6'>+ Phương tiện:</Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <Typography>{item.device?.code}</Typography>
                            </Grid>
                            {["Vận hành xe"].includes(initialValues.job?.type ?? "") && <Grid item xs={3}>
                                <Typography>Từ máy xúc:</Typography>
                            </Grid>}
                            {["Vận hành xe"].includes(initialValues.job?.type ?? "") && <Grid item xs={9}>
                                <Typography>{item.excavator?.code}</Typography>
                            </Grid>}
                            {["Vận hành xe phục vụ"].includes(initialValues.job?.type ?? "") && <Grid item xs={3}>
                                <Typography>Từ điểm:</Typography>
                            </Grid>}
                            {["Vận hành xe phục vụ"].includes(initialValues.job?.type ?? "") && <Grid item xs={9}>
                                <Typography>{item.fromLocation?.name}</Typography>
                            </Grid>}
                            {["Vận hành xe", "Vận hành xe phục vụ"].includes(initialValues.job?.type ?? "") && <Grid item xs={3}>
                                <Typography>Đến điểm:</Typography>
                            </Grid>}
                            {["Vận hành xe", "Vận hành xe phục vụ"].includes(initialValues.job?.type ?? "") && <Grid item xs={9}>
                                <Typography>{item.toLocation?.name}</Typography>
                            </Grid>}
                            <Grid item xs={3}>
                                <Typography>Chủng loại:</Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <Typography>{item.material?.name}</Typography>
                            </Grid>
                            {["Vận hành khoan"].includes(initialValues.job?.type ?? "") && <Grid item xs={3}>
                                <Typography>Mét khoan sâu:</Typography>
                            </Grid>}
                            {["Vận hành khoan"].includes(initialValues.job?.type ?? "") && <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    size='small'
                                    name={`vehicleReports[${index}].drillDepth`}
                                    value={reportFormik.values.vehicleReports[index]?.drillDepth || ''}
                                    onChange={reportFormik.handleChange} />
                            </Grid>}
                            {["Vận hành khoan"].includes(initialValues.job?.type as Job["type"] ?? "") && <Grid item xs={3}>
                                <Typography>Độ cứng:</Typography>
                            </Grid>}
                            {["Vận hành khoan"].includes(initialValues.job?.type as Job["type"] ?? "") && <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    size='small'
                                    name={`vehicleReports[${index}].hardnessF`}
                                    value={reportFormik.values.vehicleReports[index]?.hardnessF || ''}
                                    onChange={reportFormik.handleChange} />
                            </Grid>}
                            {["Vận hành xe", "Vận hành xúc", "Vận hành xe phục vụ"].includes(initialValues?.job?.type as Job["type"] ?? "") && <Grid item xs={3}>
                                <Typography>Số chuyến:</Typography>
                            </Grid>}
                            {["Vận hành xe", "Vận hành xúc", "Vận hành xe phục vụ"].includes(initialValues?.job?.type as Job["type"] ?? "") && <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    size='small'
                                    name={`vehicleReports[${index}].quantity`}
                                    value={reportFormik.values.vehicleReports[index]?.quantity || ''}
                                    onChange={reportFormik.handleChange} />
                            </Grid>}
                            {["Vận hành xe phục vụ"].includes(initialValues?.job?.type as Job["type"] ?? "") && <Grid item xs={3}>
                                <Typography>Km di chuyến:</Typography>
                            </Grid>}
                            {["Vận hành xe phục vụ"].includes(initialValues?.job?.type as Job["type"] ?? "") && <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    size='small'
                                    name={`vehicleReports[${index}].distanceKm`}
                                    value={reportFormik.values.vehicleReports[index]?.distanceKm || ''}
                                    onChange={reportFormik.handleChange} />
                            </Grid>}
                            {["Vận hành gạt", "Vận hành xe phục vụ"].includes(initialValues?.job?.type ?? "") && <Grid item xs={3}>
                                <Typography>Giờ sản phẩm (phút):</Typography>
                            </Grid>}
                            {["Vận hành gạt", "Vận hành xe phục vụ"].includes(initialValues?.job?.type ?? "") && <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    size='small'
                                    name={`vehicleReports[${index}].workingMinutes`}
                                    value={reportFormik.values.vehicleReports[index]?.workingMinutes || ''}
                                    onChange={reportFormik.handleChange} />
                            </Grid>}
                        </Grid>
                    </Box>))) : <Typography align='center'>Chưa có dữ liệu</Typography>}
                    <Typography variant="h5">Tình trạng phương tiện:</Typography>
                    {shiftReport?.vehicleSummaries?.map((item: any, index: number) => (<Box key={index}>
                        <Grid container spacing={2} mb={2} key={index}>
                            <Grid item xs={3}>
                                <Typography variant='h6'>+ Phương tiện:</Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <Typography>{item.vehicle?.code}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography>Giờ sửa chữa:</Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    size='small'
                                    name={`vehicleSummaries[${index}].repairHours`}
                                    value={shiftReportFormik.values.vehicleSummaries[index]?.repairHours || ''}
                                    onChange={shiftReportFormik.handleChange} />
                            </Grid>
                            <Grid item xs={3}>
                                <Typography>Giờ di chuyển:</Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    size='small'
                                    name={`vehicleSummaries[${index}].travelHours`}
                                    value={shiftReportFormik.values.vehicleSummaries[index]?.travelHours || ''}
                                    onChange={shiftReportFormik.handleChange}
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <Typography>Tồn dầu:</Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    size='small'
                                    name={`vehicleSummaries[${index}].fuelRemain`}
                                    value={shiftReportFormik.values.vehicleSummaries[index]?.fuelRemain || ''}
                                    onChange={shiftReportFormik.handleChange}
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <Typography>Lĩnh trong ca:</Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    size='small'
                                    name={`vehicleSummaries[${index}].fuelReceived`}
                                    value={shiftReportFormik.values.vehicleSummaries[index]?.fuelReceived || ''}
                                    onChange={shiftReportFormik.handleChange} />
                            </Grid>
                            <Grid item xs={3}>
                                <Typography>Tồn cuối ca:</Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    size='small'
                                    name={`vehicleSummaries[${index}].fuelRemainEnd`}
                                    value={shiftReportFormik.values.vehicleSummaries[index]?.fuelRemainEnd || ''}
                                    onChange={shiftReportFormik.handleChange} />
                            </Grid>
                            <Grid item xs={3}>
                                <Typography>Tình trạng xe:</Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    select
                                    name={`vehicleSummaries[${index}].status`}
                                    value={shiftReportFormik.values.vehicleSummaries[index]?.status || ''}
                                    onChange={shiftReportFormik.handleChange} >
                                    <MenuItem value="fail">Hỏng</MenuItem>
                                    <MenuItem value="good">Tốt</MenuItem>
                                </TextField>
                            </Grid>
                            {shiftReportFormik.values.vehicleSummaries[index]?.status === "fail" &&
                                <>
                                    <Grid item xs={3}>
                                        <Typography>Lý do hỏng*:</Typography>
                                    </Grid>
                                    <Grid item xs={9}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            name={`vehicleSummaries[${index}].note`}
                                            value={shiftReportFormik.values.vehicleSummaries[index]?.note || ''}
                                            onChange={shiftReportFormik.handleChange} />
                                    </Grid>
                                </>
                            }
                            <Grid item xs={3}>
                                <Typography>GPS:</Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    select
                                    name={`vehicleSummaries[${index}].gpsStatus`}
                                    value={shiftReportFormik.values.vehicleSummaries[index]?.gpsStatus || ''}
                                    onChange={shiftReportFormik.handleChange} >
                                    <MenuItem value="Hoạt động bình thường">Hoạt động bình thường</MenuItem>
                                    <MenuItem value="Mất tín hiệu">Mất tín hiệu</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography>Kẹp chì/ niêm phong:</Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    fullWidth
                                    select
                                    name={`vehicleSummaries[${index}].sealStatus`}
                                    value={shiftReportFormik.values.vehicleSummaries[index]?.sealStatus || ''}
                                    onChange={shiftReportFormik.handleChange}  >
                                    <MenuItem value="Tốt">Tốt</MenuItem>
                                    <MenuItem value="Hỏng">Hỏng</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </Box>))}
                </Box>}
                <Typography variant="h5">Khác:</Typography>
                <Box>
                    <Grid container spacing={2}>
                        <Grid item xs={3}>
                            <Typography>Giờ bàn giao ca:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <TextField
                                fullWidth
                                type="number"
                                size='small'
                                name="handoverHours"
                                value={shiftReportFormik.values.handoverHours || ''}
                                onChange={shiftReportFormik.handleChange} />
                        </Grid>
                        <Grid item xs={3}>
                            <Typography>Giờ khác:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <TextField
                                fullWidth
                                type="number"
                                size='small'
                                name="otherHours"
                                value={shiftReportFormik.values.otherHours || ''}
                                onChange={shiftReportFormik.handleChange} />
                        </Grid>
                        <Grid item xs={3}>
                            <Typography>Nội dung bàn giao ca:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <TextField
                                multiline
                                rows={5}
                                fullWidth
                                size='small'
                                name="handoverNotes"
                                value={shiftReportFormik.values.handoverNotes || ''}
                                onChange={shiftReportFormik.handleChange} />
                        </Grid>
                        <Grid item xs={3}>
                            <Typography>Kiến nghị, rủi ro:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <TextField
                                multiline
                                rows={5}
                                fullWidth
                                size='small'
                                name="risks"
                                value={shiftReportFormik.values.risks || ''}
                                onChange={shiftReportFormik.handleChange} />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            {shiftReport && <DialogActions>
                <Button onClick={handleClose}>Đóng</Button>
                {!isOver48Hours && <Button variant="contained" onClick={handleUpdateAll}>Lưu lại</Button>}
            </DialogActions>}
        </Dialog >
    )
}
