import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Grid,
    MenuItem,
    TextField,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import React, { Dispatch, SetStateAction, useEffect, useMemo } from 'react';
import api from '../../config/api.config';
import { ShiftReportType, Report, Job } from '../../types';
import { showErrorAlert, showSuccessAlert } from '../Alert';
import { format } from 'date-fns';

export default function ShiftReport({
    open,
    setOpen,
    initialValues,
}: {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    initialValues: any;
}) {
    const queryClient = useQueryClient();

    const { data: reports = [] } = useQuery({
        queryKey: ['reports', initialValues],
        queryFn: () => api.get(`/reports/getByOrder/${initialValues._id}`).then((res) => res.data.data),
    });
    console.log(reports)
    const { data: shiftReportHistories = [] } = useQuery({
        queryKey: ['shiftReportHistories', initialValues?.shiftReport?._id],
        queryFn: () => api.get(`/reporthistories/${initialValues.shiftReport._id}`).then((res) => res.data.data),
        enabled: !!initialValues?.shiftReport?._id && open,
    });

    const reportHistories = useQueries({
        queries: reports.map((r: any) => ({
            queryKey: ['reportHistory', r._id],
            queryFn: () => api.get(`/reporthistories/${r._id}`).then((res) => res.data.data),
            enabled: !!reports.length && open,
        })),
    }) as any[];

    const updateMutation = useMutation({
        mutationFn: (updatedShiftReport: ShiftReportType) =>
            api.put(`/shiftReports/${updatedShiftReport._id}`, updatedShiftReport).then((res) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response?.data?.message || error.message || 'Lỗi');
        },
    });

    const updateReportMutation = useMutation({
        mutationFn: (updateReport: Report) => api.put(`/reports/${updateReport._id}`, updateReport).then((res) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response?.data?.message || error.message || 'Lỗi');
        },
    });

    const shiftReportFormik = useFormik({
        initialValues: {
            orderId: '',
            assignedTo: '',
            vehicleSummaries: [
                {
                    vehicle: undefined,
                    repairHours: undefined,
                    travelHours: undefined,
                    fuelRemain: undefined,
                    fuelReceived: undefined,
                    fuelRemainEnd: undefined,
                    status: '',
                    note: '',
                    gpsStatus: '',
                    sealStatus: '',
                },
            ],
            handoverHours: undefined,
            otherHours: undefined,
            handoverNotes: '',
            risks: '',
        },
        onSubmit: () => { },
    });

    const reportFormik = useFormik({
        initialValues: {
            orderId: '',
            vehicleReports: [
                {
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
                },
            ],
        },
        onSubmit: () => { },
    });

    useEffect(() => {
        if (initialValues && open) {
            const shiftReport = initialValues?.shiftReport;

            shiftReportFormik.setValues({
                orderId: initialValues._id,
                assignedTo: initialValues?.assignedTo?._id,
                vehicleSummaries:
                    shiftReport?.vehicleSummaries?.map((v: any) => ({
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialValues, open]);

    useEffect(() => {
        if (reports.length > 0 && open) {
            reportFormik.setValues({
                orderId: initialValues._id,
                vehicleReports:
                    reports.map((v: any) => ({
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, reports]);

    const handleUpdateAll = async () => {
        try {
            await Promise.all(
                [updateMutation.mutateAsync({ ...shiftReportFormik.values, _id: initialValues?.shiftReport._id })].concat(
                    reports.length > 0
                        ? reportFormik.values.vehicleReports.map((r: any) => updateReportMutation.mutateAsync(r))
                        : [],
                ),
            );
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            showSuccessAlert('Cập nhật thành công!');
            handleClose();
        } catch (err: any) {
            showErrorAlert(err.response?.data?.message || err.message || 'Lỗi');
        }
    };

    const handleClose = () => {
        setOpen(false);
        shiftReportFormik.resetForm();
        reportFormik.resetForm();
    };

    const shiftReport = initialValues?.shiftReport;

    let isOver48Hours = false;
    if (initialValues?.endTime) {
        const end = new Date(initialValues.endTime);
        if (!isNaN(end.getTime())) {
            const hours = (Date.now() - end.getTime()) / (1000 * 60 * 60);
            isOver48Hours = hours >= 48;
        }
    }

    // ====== NHÓM DỮ LIỆU THEO KHÓA & TÍNH TỔNG ======

    const jobType = (initialValues?.job?.type as Job['type']) ?? '';

    const idToFormIndex = useMemo(() => {
        const map: Record<string, number> = {};
        (reportFormik.values.vehicleReports || []).forEach((vr: any, idx: number) => {
            if (vr?._id) map[vr._id] = idx;
        });
        return map;
    }, [reportFormik.values.vehicleReports]);

    const historyById = useMemo(() => {
        const m: Record<string, any[]> = {};
        reports.forEach((r: any, i: number) => {
            m[r._id] = reportHistories[i]?.data || [];
        });
        return m;
    }, [reports, reportHistories]);

    function getGroupKey(jt: string, r: any) {
        switch (jt) {
            case 'Vận hành xúc':
                // gộp theo Phương tiện + Chủng loại
                return `device:${r.device?._id || ''}__mat:${r.material?._id || ''}`;
            case 'Vận hành xe':
                // gộp theo xe + máy xúc + điểm đến + chủng loại (tùy nghiệp vụ)
                return `device:${r.device?._id || ''}__exc:${r.excavator?._id || ''}__to:${r.toLocation?._id || ''}__mat:${r.material?._id || ''}`;
            case 'Vận hành xe phục vụ':
                // gộp theo xe + from + to + chủng loại
                return `device:${r.device?._id || ''}__from:${r.fromLocation?._id || ''}__to:${r.toLocation?._id || ''}__mat:${r.material?._id || ''}`;
            case 'Vận hành gạt':
                // gộp theo device + material
                return `device:${r.device?._id || ''}__mat:${r.material?._id || ''}`;
            case 'Vận hành khoan':
                // để mỗi bản ghi 1 nhóm riêng (không cộng số chuyến)
                return `single:${r._id}`;
            default:
                return `single:${r._id}`;
        }
    }

    type GroupedItem = {
        key: string;
        device?: any;
        material?: any;
        excavator?: any;
        fromLocation?: any;
        toLocation?: any;
        totalQuantity?: number;
        totalDistanceKm?: number;
        totalWorkingMinutes?: number;
        totalDrillDepth?: number,
        totalHardnessF?: number,
        children: Array<{
            report: any;
            formIndex: number;
            history: any[];
        }>;
    };

    // Nếu muốn tổng cập nhật "live" theo Formik, cộng từ reportFormik thay vì reports
    const groupedReports: GroupedItem[] = useMemo(() => {
        if (!reports?.length) return [];

        const byKey: Record<string, GroupedItem> = {};

        reports.forEach((r: any) => {
            const key = getGroupKey(jobType, r);

            if (!byKey[key]) {
                byKey[key] = {
                    key,
                    device: r.device,
                    material: r.material,
                    excavator: r.excavator,
                    fromLocation: r.fromLocation,
                    toLocation: r.toLocation,
                    totalQuantity: 0,
                    totalDistanceKm: 0,
                    totalWorkingMinutes: 0,
                    totalDrillDepth: 0,
                    totalHardnessF: 0,
                    children: [],
                };
            }

            const formIndex = idToFormIndex[r._id];
            const hist = historyById[r._id] || [];
            byKey[key].children.push({ report: r, formIndex, history: hist });

            // Cộng dồn từ Formik để hiển thị tổng "sống"
            const vr = reportFormik.values.vehicleReports?.[formIndex] || {};
            if (['Vận hành xe', 'Vận hành xúc', 'Vận hành xe phục vụ'].includes(jobType)) {
                byKey[key].totalQuantity = (byKey[key].totalQuantity || 0) + (Number(vr.quantity) || 0);
            }
            if (jobType === 'Vận hành xe phục vụ') {
                byKey[key].totalDistanceKm = (byKey[key].totalDistanceKm || 0) + (Number(vr.distanceKm) || 0);
                byKey[key].totalWorkingMinutes =
                    (byKey[key].totalWorkingMinutes || 0) + (Number(vr.workingMinutes) || 0);
            }
            if (jobType === 'Vận hành gạt') {
                byKey[key].totalWorkingMinutes =
                    (byKey[key].totalWorkingMinutes || 0) + (Number(vr.workingMinutes) || 0);
            }
            if (jobType === 'Vận hành khoan') {
                byKey[key].totalDrillDepth =
                    (byKey[key].totalDrillDepth || 0) + (Number(vr.drillDepth) || 0);
                byKey[key].totalHardnessF =
                    (byKey[key].totalHardnessF || 0) + (Number(vr.hardnessF) || 0);
            }
        });

        return Object.values(byKey);
    }, [reports, jobType, idToFormIndex, historyById, reportFormik.values.vehicleReports]);

    // ====== RENDER ======

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogContent>
                <Typography variant="h6" gutterBottom>
                    Mã thẻ lương: {initialValues?.assignedTo?.fullName} - {initialValues?.assignedTo?.salaryCode} -{' '}
                    {initialValues?.job?.name}
                </Typography>

                {['Vận hành xe', 'Vận hành xúc', 'Vận hành gạt', 'Vận hành khoan', 'Vận hành xe phục vụ'].includes(
                    jobType ?? '',
                ) && (
                        <Box>
                            <Typography variant="h5">Báo chuyến/ sản lượng:</Typography>

                            {reports.length > 0 ? (
                                groupedReports.map((group) => {
                                    const deviceCode = group.device?.code || '(N/A)';
                                    const materialName = group.material?.name || '';
                                    const excCode = group.excavator?.code || '';
                                    const fromName = group.fromLocation?.name || '';
                                    const toName = group.toLocation?.name || '';

                                    const headerRight =
                                        jobType === 'Vận hành xúc'
                                            ? `Tổng số chuyến: ${group.totalQuantity || 0}`
                                            : jobType === 'Vận hành xe'
                                                ? `Tổng số chuyến: ${group.totalQuantity || 0}`
                                                : jobType === 'Vận hành xe phục vụ'
                                                    ? `Tổng chuyến: ${group.totalQuantity || 0} • Tổng km: ${group.totalDistanceKm || 0} • Tổng phút: ${group.totalWorkingMinutes || 0
                                                    }`
                                                    : jobType === 'Vận hành gạt'
                                                        ? `Tổng phút: ${group.totalWorkingMinutes || 0}`
                                                        : '';

                                    return (
                                        <Accordion key={group.key} disableGutters>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Grid container alignItems="center">
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="subtitle1">
                                                            + Phương tiện: <b>{deviceCode}</b>
                                                        </Typography>
                                                        {jobType === 'Vận hành xe' && excCode && (
                                                            <Typography variant="body2">Từ máy xúc: {excCode} • Đến điểm: {toName}</Typography>
                                                        )}
                                                        {jobType === 'Vận hành xe phục vụ' && (fromName || toName) && (
                                                            <Typography variant="body2">
                                                                {fromName ? `Từ điểm: ${fromName}` : ''}
                                                                {fromName && toName ? ' • ' : ''}
                                                                {toName ? `Đến điểm: ${toName}` : ''}
                                                            </Typography>
                                                        )}
                                                        {materialName && <Typography variant="body2">Chủng loại: {materialName}</Typography>}
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography align="right" variant="subtitle2">
                                                            {headerRight}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </AccordionSummary>

                                            <AccordionDetails>
                                                {group.children.map(({ report, formIndex, history }) => (
                                                    <Box key={report._id} sx={{ mb: 2 }}>
                                                        <Grid container spacing={2}>
                                                            <Grid item xs={12}>
                                                                <Typography variant="h6" >
                                                                    {formIndex + 1}.Tạo lúc: {report?.createdAt
                                                                        ? format(new Date(report.createdAt), 'HH:mm dd/MM/yyyy')
                                                                        : '—'}
                                                                </Typography>
                                                            </Grid>
                                                            {/* KHOAN: drillDepth + hardnessF */}
                                                            {jobType === 'Vận hành khoan' && (
                                                                <>
                                                                    <Grid item xs={3}>
                                                                        <Typography>Mét khoan sâu:</Typography>
                                                                    </Grid>
                                                                    <Grid item xs={9}>
                                                                        <TextField
                                                                            fullWidth
                                                                            type="number"
                                                                            size="small"
                                                                            name={`vehicleReports[${formIndex}].drillDepth`}
                                                                            value={reportFormik.values.vehicleReports[formIndex]?.drillDepth || ''}
                                                                            onChange={reportFormik.handleChange}
                                                                        />
                                                                        {history
                                                                            .filter((h: any) => h.changes.some((c: any) => c.field === 'drillDepth'))
                                                                            .map((h: any, i: number) => {
                                                                                const changesText = h.changes
                                                                                    .filter((c: any) => c.field === 'drillDepth')
                                                                                    .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                                                    .join(', ');
                                                                                return (
                                                                                    <Typography key={i} variant="caption" color="secondary" display="block">
                                                                                        Nội dung: Mét khoan sâu: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                                                        {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                                                    </Typography>
                                                                                );
                                                                            })}
                                                                    </Grid>

                                                                    <Grid item xs={3}>
                                                                        <Typography>Độ cứng:</Typography>
                                                                    </Grid>
                                                                    <Grid item xs={9}>
                                                                        <TextField
                                                                            fullWidth
                                                                            type="number"
                                                                            size="small"
                                                                            name={`vehicleReports[${formIndex}].hardnessF`}
                                                                            value={reportFormik.values.vehicleReports[formIndex]?.hardnessF || ''}
                                                                            onChange={reportFormik.handleChange}
                                                                        />
                                                                        {history
                                                                            .filter((h: any) => h.changes.some((c: any) => c.field === 'hardnessF'))
                                                                            .map((h: any, i: number) => {
                                                                                const changesText = h.changes
                                                                                    .filter((c: any) => c.field === 'hardnessF')
                                                                                    .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                                                    .join(', ');
                                                                                return (
                                                                                    <Typography key={i} variant="caption" color="secondary" display="block">
                                                                                        Nội dung: Độ cứng: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                                                        {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                                                    </Typography>
                                                                                );
                                                                            })}
                                                                    </Grid>
                                                                </>
                                                            )}

                                                            {/* XE/XÚC/SERVICE: quantity */}
                                                            {['Vận hành xe', 'Vận hành xúc', 'Vận hành xe phục vụ'].includes(jobType) && (
                                                                <>
                                                                    <Grid item xs={3}>
                                                                        <Typography>Số chuyến:</Typography>
                                                                    </Grid>
                                                                    <Grid item xs={9}>
                                                                        <TextField
                                                                            fullWidth
                                                                            type="number"
                                                                            size="small"
                                                                            name={`vehicleReports[${formIndex}].quantity`}
                                                                            value={reportFormik.values.vehicleReports[formIndex]?.quantity || ''}
                                                                            onChange={reportFormik.handleChange}
                                                                        />
                                                                        {history
                                                                            .filter((h: any) => h.changes.some((c: any) => c.field === 'quantity'))
                                                                            .map((h: any, i: number) => {
                                                                                const changesText = h.changes
                                                                                    .filter((c: any) => c.field === 'quantity')
                                                                                    .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                                                    .join(', ');
                                                                                return (
                                                                                    <Typography key={i} variant="caption" color="secondary" display="block">
                                                                                        Nội dung: Số chuyến: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                                                        {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                                                    </Typography>
                                                                                );
                                                                            })}
                                                                    </Grid>
                                                                </>
                                                            )}

                                                            {/* SERVICE: distanceKm + workingMinutes */}
                                                            {jobType === 'Vận hành xe phục vụ' && (
                                                                <>
                                                                    <Grid item xs={3}>
                                                                        <Typography>Km di chuyển:</Typography>
                                                                    </Grid>
                                                                    <Grid item xs={9}>
                                                                        <TextField
                                                                            fullWidth
                                                                            type="number"
                                                                            size="small"
                                                                            name={`vehicleReports[${formIndex}].distanceKm`}
                                                                            value={reportFormik.values.vehicleReports[formIndex]?.distanceKm || ''}
                                                                            onChange={reportFormik.handleChange}
                                                                        />
                                                                        {history
                                                                            .filter((h: any) => h.changes.some((c: any) => c.field === 'distanceKm'))
                                                                            .map((h: any, i: number) => {
                                                                                const changesText = h.changes
                                                                                    .filter((c: any) => c.field === 'distanceKm')
                                                                                    .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                                                    .join(', ');
                                                                                return (
                                                                                    <Typography key={i} variant="caption" color="secondary" display="block">
                                                                                        Nội dung: Km di chuyển: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                                                        {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                                                    </Typography>
                                                                                );
                                                                            })}
                                                                    </Grid>

                                                                    <Grid item xs={3}>
                                                                        <Typography>Giờ sản phẩm (phút):</Typography>
                                                                    </Grid>
                                                                    <Grid item xs={9}>
                                                                        <TextField
                                                                            fullWidth
                                                                            type="number"
                                                                            size="small"
                                                                            name={`vehicleReports[${formIndex}].workingMinutes`}
                                                                            value={reportFormik.values.vehicleReports[formIndex]?.workingMinutes || ''}
                                                                            onChange={reportFormik.handleChange}
                                                                        />
                                                                        {history
                                                                            .filter((h: any) => h.changes.some((c: any) => c.field === 'workingMinutes'))
                                                                            .map((h: any, i: number) => {
                                                                                const changesText = h.changes
                                                                                    .filter((c: any) => c.field === 'workingMinutes')
                                                                                    .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                                                    .join(', ');
                                                                                return (
                                                                                    <Typography key={i} variant="caption" color="secondary" display="block">
                                                                                        Nội dung: Giờ sản phẩm: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                                                        {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                                                    </Typography>
                                                                                );
                                                                            })}
                                                                    </Grid>
                                                                </>
                                                            )}

                                                            {/* GẠT: workingMinutes */}
                                                            {jobType === 'Vận hành gạt' && (
                                                                <>
                                                                    <Grid item xs={3}>
                                                                        <Typography>Giờ sản phẩm (phút):</Typography>
                                                                    </Grid>
                                                                    <Grid item xs={9}>
                                                                        <TextField
                                                                            fullWidth
                                                                            type="number"
                                                                            size="small"
                                                                            name={`vehicleReports[${formIndex}].workingMinutes`}
                                                                            value={reportFormik.values.vehicleReports[formIndex]?.workingMinutes || ''}
                                                                            onChange={reportFormik.handleChange}
                                                                        />
                                                                        {history
                                                                            .filter((h: any) => h.changes.some((c: any) => c.field === 'workingMinutes'))
                                                                            .map((h: any, i: number) => {
                                                                                const changesText = h.changes
                                                                                    .filter((c: any) => c.field === 'workingMinutes')
                                                                                    .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                                                    .join(', ');
                                                                                return (
                                                                                    <Typography key={i} variant="caption" color="secondary" display="block">
                                                                                        Nội dung: Giờ sản phẩm: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                                                        {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                                                    </Typography>
                                                                                );
                                                                            })}
                                                                    </Grid>
                                                                </>
                                                            )}
                                                        </Grid>
                                                    </Box>
                                                ))}
                                            </AccordionDetails>
                                        </Accordion>
                                    );
                                })
                            ) : (
                                <Typography align="center">Chưa có dữ liệu</Typography>
                            )}

                            <Typography variant="h5" sx={{ mt: 2 }}>
                                Tình trạng phương tiện:
                            </Typography>
                            {shiftReport?.vehicleSummaries?.map((item: any, index: number) => (
                                <Box key={index}>
                                    <Grid container spacing={2} mb={2} key={index}>
                                        <Grid item xs={3}>
                                            <Typography variant="h6">+ Phương tiện:</Typography>
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
                                                size="small"
                                                name={`vehicleSummaries[${index}].repairHours`}
                                                value={shiftReportFormik.values.vehicleSummaries[index]?.repairHours || ''}
                                                onChange={shiftReportFormik.handleChange}
                                            />
                                            {shiftReportHistories
                                                .filter((h: any) => h.changes.some((c: any) => c.field === 'repairHours'))
                                                .map((h: any, i: number) => {
                                                    const changesText = h.changes
                                                        .filter((c: any) => c.field === 'repairHours' && c.index === index)
                                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                        .join(', ');
                                                    return (
                                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                                            Nội dung: Giờ sửa chữa: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                        </Typography>
                                                    );
                                                })}
                                        </Grid>

                                        <Grid item xs={3}>
                                            <Typography>Giờ di chuyển:</Typography>
                                        </Grid>
                                        <Grid item xs={9}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                size="small"
                                                name={`vehicleSummaries[${index}].travelHours`}
                                                value={shiftReportFormik.values.vehicleSummaries[index]?.travelHours || ''}
                                                onChange={shiftReportFormik.handleChange}
                                            />
                                            {shiftReportHistories
                                                .filter((h: any) => h.changes.some((c: any) => c.field === 'travelHours'))
                                                .map((h: any, i: number) => {
                                                    const changesText = h.changes
                                                        .filter((c: any) => c.field === 'travelHours' && c.index === index)
                                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                        .join(', ');
                                                    return (
                                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                                            Nội dung: Giờ di chuyển: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                        </Typography>
                                                    );
                                                })}
                                        </Grid>

                                        <Grid item xs={3}>
                                            <Typography>Tồn dầu:</Typography>
                                        </Grid>
                                        <Grid item xs={9}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                size="small"
                                                name={`vehicleSummaries[${index}].fuelRemain`}
                                                value={shiftReportFormik.values.vehicleSummaries[index]?.fuelRemain || ''}
                                                onChange={shiftReportFormik.handleChange}
                                            />
                                            {shiftReportHistories
                                                .filter((h: any) => h.changes.some((c: any) => c.field === 'fuelRemain'))
                                                .map((h: any, i: number) => {
                                                    const changesText = h.changes
                                                        .filter((c: any) => c.field === 'fuelRemain' && c.index === index)
                                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                        .join(', ');
                                                    return (
                                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                                            Nội dung: Tồn dầu: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                        </Typography>
                                                    );
                                                })}
                                        </Grid>

                                        <Grid item xs={3}>
                                            <Typography>Lĩnh trong ca:</Typography>
                                        </Grid>
                                        <Grid item xs={9}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                size="small"
                                                name={`vehicleSummaries[${index}].fuelReceived`}
                                                value={shiftReportFormik.values.vehicleSummaries[index]?.fuelReceived || ''}
                                                onChange={shiftReportFormik.handleChange}
                                            />
                                            {shiftReportHistories
                                                .filter((h: any) => h.changes.some((c: any) => c.field === 'fuelReceived'))
                                                .map((h: any, i: number) => {
                                                    const changesText = h.changes
                                                        .filter((c: any) => c.field === 'fuelReceived' && c.index === index)
                                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                        .join(', ');
                                                    return (
                                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                                            Nội dung: Lĩnh trong ca: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                        </Typography>
                                                    );
                                                })}
                                        </Grid>

                                        <Grid item xs={3}>
                                            <Typography>Tồn cuối ca:</Typography>
                                        </Grid>
                                        <Grid item xs={9}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                size="small"
                                                name={`vehicleSummaries[${index}].fuelRemainEnd`}
                                                value={shiftReportFormik.values.vehicleSummaries[index]?.fuelRemainEnd || ''}
                                                onChange={shiftReportFormik.handleChange}
                                            />
                                            {shiftReportHistories
                                                .filter((h: any) => h.changes.some((c: any) => c.field === 'fuelRemainEnd'))
                                                .map((h: any, i: number) => {
                                                    const changesText = h.changes
                                                        .filter((c: any) => c.field === 'fuelRemainEnd' && c.index === index)
                                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                        .join(', ');
                                                    return (
                                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                                            Nội dung: Tồn cuối ca: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                        </Typography>
                                                    );
                                                })}
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
                                                onChange={shiftReportFormik.handleChange}
                                            >
                                                <MenuItem value="fail">Hỏng</MenuItem>
                                                <MenuItem value="good">Tốt</MenuItem>
                                            </TextField>
                                            {shiftReportHistories
                                                .filter((h: any) => h.changes.some((c: any) => c.field === 'status'))
                                                .map((h: any, i: number) => {
                                                    const changesText = h.changes
                                                        .filter((c: any) => c.field === 'status' && c.index === index)
                                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                        .join(', ');
                                                    return (
                                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                                            Nội dung: Tình trạng xe: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                        </Typography>
                                                    );
                                                })}
                                        </Grid>
                                    </Grid>

                                    {shiftReportFormik.values.vehicleSummaries[index]?.status === 'fail' && (
                                        <Grid container spacing={2} mb={2} key={`${index}-reason`}>
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
                                                    onChange={shiftReportFormik.handleChange}
                                                />
                                                {shiftReportHistories
                                                    .filter((h: any) => h.changes.some((c: any) => c.field === 'note'))
                                                    .map((h: any, i: number) => {
                                                        const changesText = h.changes
                                                            .filter((c: any) => c.field === 'note' && c.index === index)
                                                            .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                            .join(', ');
                                                        return (
                                                            <Typography key={i} variant="caption" color="secondary" display="block">
                                                                Nội dung: Lý do hỏng: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                                {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                            </Typography>
                                                        );
                                                    })}
                                            </Grid>
                                        </Grid>
                                    )}

                                    <Grid container spacing={2} mb={2} key={`${index}-gps`}>
                                        <Grid item xs={3}>
                                            <Typography>GPS:</Typography>
                                        </Grid>
                                        <Grid item xs={9}>
                                            <TextField
                                                fullWidth
                                                select
                                                name={`vehicleSummaries[${index}].gpsStatus`}
                                                value={shiftReportFormik.values.vehicleSummaries[index]?.gpsStatus || ''}
                                                onChange={shiftReportFormik.handleChange}
                                            >
                                                <MenuItem value="Hoạt động bình thường">Hoạt động bình thường</MenuItem>
                                                <MenuItem value="Mất tín hiệu">Mất tín hiệu</MenuItem>
                                            </TextField>
                                            {shiftReportHistories
                                                .filter((h: any) => h.changes.some((c: any) => c.field === 'gpsStatus'))
                                                .map((h: any, i: number) => {
                                                    const changesText = h.changes
                                                        .filter((c: any) => c.field === 'gpsStatus' && c.index === index)
                                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                        .join(', ');
                                                    return (
                                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                                            Nội dung: GPS: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                        </Typography>
                                                    );
                                                })}
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
                                                onChange={shiftReportFormik.handleChange}
                                            >
                                                <MenuItem value="Tốt">Tốt</MenuItem>
                                                <MenuItem value="Hỏng">Hỏng</MenuItem>
                                            </TextField>
                                            {shiftReportHistories
                                                .filter((h: any) => h.changes.some((c: any) => c.field === 'sealStatus'))
                                                .map((h: any, i: number) => {
                                                    const changesText = h.changes
                                                        .filter((c: any) => c.field === 'sealStatus' && c.index === index)
                                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                                        .join(', ');
                                                    return (
                                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                                            Nội dung: kẹp chì/Niêm phong: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                                        </Typography>
                                                    );
                                                })}
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                        </Box>
                    )}

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
                                size="small"
                                name="handoverHours"
                                value={shiftReportFormik.values.handoverHours || ''}
                                onChange={shiftReportFormik.handleChange}
                            />
                            {shiftReportHistories
                                .filter((h: any) => h.changes.some((c: any) => c.field === 'handoverHours'))
                                .map((h: any, i: number) => {
                                    const changesText = h.changes
                                        .filter((c: any) => c.field === 'handoverHours')
                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                        .join(', ');
                                    return (
                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                            Nội dung: Giờ bàn giao ca: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                        </Typography>
                                    );
                                })}
                        </Grid>

                        <Grid item xs={3}>
                            <Typography>Giờ khác:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <TextField
                                fullWidth
                                type="number"
                                size="small"
                                name="otherHours"
                                value={shiftReportFormik.values.otherHours || ''}
                                onChange={shiftReportFormik.handleChange}
                            />
                            {shiftReportHistories
                                .filter((h: any) => h.changes.some((c: any) => c.field === 'otherHours'))
                                .map((h: any, i: number) => {
                                    const changesText = h.changes
                                        .filter((c: any) => c.field === 'otherHours')
                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                        .join(', ');
                                    return (
                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                            Nội dung: Giờ khác: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                        </Typography>
                                    );
                                })}
                        </Grid>

                        <Grid item xs={3}>
                            <Typography>Nội dung bàn giao ca:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <TextField
                                multiline
                                rows={5}
                                fullWidth
                                size="small"
                                name="handoverNotes"
                                value={shiftReportFormik.values.handoverNotes || ''}
                                onChange={shiftReportFormik.handleChange}
                            />
                            {shiftReportHistories
                                .filter((h: any) => h.changes.some((c: any) => c.field === 'handoverNotes'))
                                .map((h: any, i: number) => {
                                    const changesText = h.changes
                                        .filter((c: any) => c.field === 'handoverNotes')
                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                        .join(', ');
                                    return (
                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                            Nội dung: Nội dung bàn giao ca: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                        </Typography>
                                    );
                                })}
                        </Grid>

                        <Grid item xs={3}>
                            <Typography>Kiến nghị, rủi ro:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <TextField
                                multiline
                                rows={5}
                                fullWidth
                                size="small"
                                name="risks"
                                value={shiftReportFormik.values.risks || ''}
                                onChange={shiftReportFormik.handleChange}
                            />
                            {shiftReportHistories
                                .filter((h: any) => h.changes.some((c: any) => c.field === 'risks'))
                                .map((h: any, i: number) => {
                                    const changesText = h.changes
                                        .filter((c: any) => c.field === 'risks')
                                        .map((c: any) => `"${c.oldValue || ''}" → "${c.newValue || ''}"`)
                                        .join(', ');
                                    return (
                                        <Typography key={i} variant="caption" color="secondary" display="block">
                                            Nội dung: Kiến nghị, rủi ro: {changesText}, Thay đổi bởi: {h.changedBy?.username}{' '}
                                            {format(new Date(h.createdAt), 'HH:mm dd/MM/yyyy')}
                                        </Typography>
                                    );
                                })}
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            {shiftReport && (
                <DialogActions>
                    <Button onClick={handleClose}>Đóng</Button>
                    {!isOver48Hours && (
                        <Button variant="contained" onClick={handleUpdateAll}>
                            Lưu lại
                        </Button>
                    )}
                </DialogActions>
            )}
        </Dialog>
    );
}
