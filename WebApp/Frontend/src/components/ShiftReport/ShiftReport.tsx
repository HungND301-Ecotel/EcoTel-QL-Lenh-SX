import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik'
import React, { Dispatch, SetStateAction, useEffect } from 'react'
import api from '../../config/api.config';
import { ShiftReportType } from '../../types';
import { showErrorAlert, showSuccessAlert } from '../Alert';

export default function ShiftReport({ open, setOpen, initialValues }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>>, initialValues: any }) {

    const queryClient = useQueryClient()
    const updateMutation = useMutation({
        mutationFn: (updatedShiftReport: ShiftReportType) =>
            api.put(`/shiftReports/${updatedShiftReport._id}`, updatedShiftReport).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            showSuccessAlert('Cập nhật thông tin thành công')
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.response || 'Lỗi')
        }
    });
    const formik = useFormik({
        initialValues: {
            orderId: '',
            assignedTo: '',
            vehicleReports: [{
                vehicle: undefined,
                excavator: undefined,
                dumpingLocation: undefined,
                materialType: undefined,
                tripCount: undefined,
            }],
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
        enableReinitialize: true,
        onSubmit: (values) => {
            updateMutation.mutate({ ...values, _id: initialValues?.shiftReport._id })
        },
    })

    useEffect(() => {
        if (initialValues && open) {
            const shiftReport = initialValues?.shiftReport;

            formik.setValues({
                orderId: initialValues._id,
                assignedTo: initialValues?.assignedTo?._id,
                vehicleReports: shiftReport?.vehicleReports?.map((v: any) => ({
                    vehicle: v?.vehicle?._id,
                    excavator: v?.excavator?._id,
                    dumpingLocation: v?.dumpingLocation?._id,
                    materialType: v?.materialType?._id,
                    tripCount: v?.tripCount,
                })) || [],
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


    const handleClose = () => {
        setOpen(false)
        formik.resetForm()
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
                <Typography variant="h6" gutterBottom>Mã thẻ lương: {initialValues?.assignedTo?.fullName} - {initialValues?.assignedTo?.salaryCode}</Typography>
                <Typography variant="h5">Báo chuyến:</Typography>
                {shiftReport?.vehicleReports?.map((item: any, index: number) => (<Box key={index}>
                    <Grid container spacing={2} mb={2}>
                        <Grid item xs={3}>
                            <Typography variant='h6'>+ Phương tiện:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <Typography>{item.vehicle?.code}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <Typography>Máy xúc:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <Typography>{item.excavator?.code}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <Typography>Điểm đổ:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <Typography>{initialValues?.location?.name}</Typography>
                        </Grid>

                        <Grid item xs={3}>
                            <Typography>Vật liệu:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <Typography>{initialValues?.material?.name}</Typography>
                        </Grid>

                        <Grid item xs={3}>
                            <Typography>Số chuyến:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <TextField
                                fullWidth
                                type="number"
                                size='small'
                                name={`vehicleReports[${index}].tripCount`}
                                value={formik.values.vehicleReports[index]?.tripCount || ''}
                                onChange={formik.handleChange}
                            />
                        </Grid>
                    </Grid>
                </Box>))}

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
                                value={formik.values.vehicleSummaries[index]?.repairHours || ''}
                                onChange={formik.handleChange} />
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
                                value={formik.values.vehicleSummaries[index]?.travelHours || ''}
                                onChange={formik.handleChange}
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
                                value={formik.values.vehicleSummaries[index]?.fuelRemain || ''}
                                onChange={formik.handleChange}
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
                                value={formik.values.vehicleSummaries[index]?.fuelReceived || ''}
                                onChange={formik.handleChange} />
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
                                value={formik.values.vehicleSummaries[index]?.fuelRemainEnd || ''}
                                onChange={formik.handleChange} />
                        </Grid>
                        <Grid item xs={3}>
                            <Typography>Tình trạng xe:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <TextField
                                fullWidth
                                select
                                name={`vehicleSummaries[${index}].status`}
                                value={formik.values.vehicleSummaries[index]?.status || ''}
                                onChange={formik.handleChange} >
                                <MenuItem value="fail">Hỏng</MenuItem>
                                <MenuItem value="good">Tốt</MenuItem>
                            </TextField>
                        </Grid>
                        {formik.values.vehicleSummaries[index]?.status === "fail" &&
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
                                        value={formik.values.vehicleSummaries[index]?.note || ''}
                                        onChange={formik.handleChange} />
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
                                value={formik.values.vehicleSummaries[index]?.gpsStatus || ''}
                                onChange={formik.handleChange} >
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
                                value={formik.values.vehicleSummaries[index]?.sealStatus || ''}
                                onChange={formik.handleChange}  >
                                <MenuItem value="Tốt">Tốt</MenuItem>
                                <MenuItem value="Hỏng">Hỏng</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </Box>))}
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
                                value={formik.values.handoverHours || ''}
                                onChange={formik.handleChange} />
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
                                value={formik.values.otherHours || ''}
                                onChange={formik.handleChange} />
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
                                value={formik.values.handoverNotes || ''}
                                onChange={formik.handleChange} />
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
                                value={formik.values.risks || ''}
                                onChange={formik.handleChange} />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Đóng</Button>
                {!isOver48Hours && <Button variant="contained" onClick={() => formik.handleSubmit()}>Lưu lại</Button>}
            </DialogActions>
        </Dialog >
    )
}
