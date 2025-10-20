import React, { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Box,
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Checkbox,
    TextField,
    Autocomplete,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TablePagination,
    Stack,
    Table,
} from "@mui/material";
import { format } from "date-fns";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Delete,
} from "@mui/icons-material";
import { FieldArray, FormikProvider, useFormik } from "formik";
import api from "../../config/api.config";
import { Device, Location, Material, Shift, TravelLog } from "../../types";
import {
    DatePicker,
    LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
    showConfirmAlert,
    showErrorAlert,
    showSuccessAlert,
} from "../../components/Alert";
import { useAtom } from "jotai";
import { userAtom } from "../../atoms/userAtoms";
import { trvelLogValidationSchema } from "../../utils/validation";
import TravelLogService from "../../services/travelLogService";
import { RoleEnum } from "../../enums";
import { getFormikFieldProps } from "../../utils/helper";
import { StyledPopper } from "../../ui/poppers";


const TravelLogs: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [selectedTravelLog, setSelectedTravelLog] = useState<any | null>(null);
    const [selectedTravelLogs, setSelectedTravelLogs] = useState<any[]>([]);
    const [user] = useAtom(userAtom);
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [total, setTotal] = useState(0);
    const [travelLogs, setTravelLogs] = useState<any[]>([]);

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, page: number) => {
        setPage(page);
    };


    // const defaultColumns = [
    //     { id: "stt", label: "STT" },
    //     { id: "excavator", label: "Máy xúc" },
    //     { id: "area", label: "Khu vực" },
    //     { id: "location", label: "Điểm đổ tải" },
    //     { id: "excavationLevel", label: "Tầng xúc" },
    //     { id: "dumpHeightActual", label: "Độ cao thực tế nơi đổ" },
    //     { id: "dumpHeightActual", label: "Cung độ (km)" },
    //     { id: "dumpHeightActual", label: "Chiều cao nâng tải (m)" },
    //     { id: "dumpHeightActual", label: "H min" },
    //     { id: "dumpHeightActual", label: "H max" },
    //     { id: "dumpHeightActual", label: "Cung độ (km)" },
    //     { id: "note", label: "Chiều cao nâng tải(m)" },
    //     {
    //         id: "edit",
    //         label: "Sửa",
    //         width: 60,
    //         renderCell: (params: { row: any }) => (
    //             <IconButton
    //                 color="primary"
    //                 disabled={user?.role !== RoleEnum.ADMIN}
    //                 onClick={async () => {
    //                     if (user?.role !== RoleEnum.ADMIN) return;
    //                     if (open) {
    //                         const result = await showConfirmAlert(
    //                             "Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?"
    //                         );
    //                         if (result.isConfirmed) {
    //                             handleOpen(params.row.edit);
    //                         }
    //                     } else {
    //                         handleOpen(params.row.edit);
    //                     }
    //                 }}
    //             >
    //                 <EditIcon />
    //             </IconButton>
    //         ),
    //         sortable: false,
    //         filterable: false,
    //     },
    // ];

    // const [visibleColumns, setVisibleColumns] = useState<string[]>(
    //     user?.role === RoleEnum.ADMIN
    //         ? defaultColumns.map((i) => i.id)
    //         : defaultColumns.filter((i) => i.id !== "edit").map((i) => i.id)
    // );

    // const handleToggleColumn = (id: string) => {
    //     setVisibleColumns((prev) =>
    //         prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    //     );
    // };

    const { data: excavators = [] } = useQuery({
        queryKey: ["excavators"],
        queryFn: () =>
            api.get("/devices/excavators/all").then((res) => res.data.data),
    });
    const { data: shifts = [] } = useQuery({
        queryKey: ["shifts"],
        queryFn: () =>
            api.get("/shifts").then((res) => res.data.data),
    });
    const { data: materials = [] } = useQuery({
        queryKey: ["materials"],
        queryFn: () =>
            api.get("/materials").then((res) => res.data.data),
    });
    const { data: locations = [] } = useQuery({
        queryKey: ["locations"],
        queryFn: () => api.get("/locations").then((res) => res.data.data),
    });
    const { data } = useQuery({
        queryKey: ["travellogs", page, pageSize, startTime, endTime],
        queryFn: () =>
            TravelLogService.getAll({
                page: page + 1,
                limit: pageSize,
                startTime: startTime ? startTime.toISOString() : "",
                endTime: endTime ? endTime.toISOString() : "",
            }),
    });
    useEffect(() => {
        if (data) {
            setTravelLogs(data.data);
            setTotal(data.totalDocs);
        }
    }, [data]);

    const createMutation = useMutation({
        mutationFn: TravelLogService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["travellogs"] });
            showSuccessAlert("Thêm cung độ thành công");
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || "Lỗi");
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedTravelLog: Partial<TravelLog>) =>
            api
                .put(`/travellogs/${updatedTravelLog._id}`, updatedTravelLog)
                .then((res) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["travellogs"] });
            showSuccessAlert("Cập nhật cung độ thành công");
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || "Lỗi");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: string[]) =>
            api
                .delete(`/travellogs`, { data: { ids } })
                .then((res) => res.data.message),
        onSuccess: (message) => {
            queryClient.invalidateQueries({ queryKey: ["travellogs"] });
            setSelectedTravelLogs([]);
            showSuccessAlert(message || "Xóa thành công");
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || "Lỗi");
        },
    });

    const formik = useFormik({
        initialValues: {
            excavator: undefined,
            workingDate: new Date(),
            shift: undefined,
            area: "",
            routes: [{
                location: undefined,
                material: undefined,
                excavationLevel: "",
                dumpHeightActual: "",
                fullDistanceKm: undefined as number | undefined,
                fullLiftHeightM: undefined as number | undefined,
                localMinHeightM: undefined as number | undefined,
                localMaxHeightM: undefined as number | undefined,
                localDistanceKm: undefined as number | undefined,
                localLiftHeightM: undefined as number | undefined,
            }]
        },
        // enableReinitialize: true,
        validationSchema: trvelLogValidationSchema,
        onSubmit: (values) => {
            const travellog: Partial<TravelLog> = {
                excavator: values.excavator,
                workingDate: dayjs.utc(dayjs(values.workingDate).format('YYYY-MM-DD')).toDate(),
                shift: values.shift,
                area: values.area,
                routes: (values.routes || []).filter(r => r.location).map((i) => ({
                    location: i.location,
                    material: i.material,
                    excavationLevel: i.excavationLevel,
                    dumpHeightActual: i.dumpHeightActual,
                    fullDistanceKm: i.fullDistanceKm,
                    fullLiftHeightM: i.fullLiftHeightM,
                    localMinHeightM: i.localMinHeightM,
                    localMaxHeightM: i.localMaxHeightM,
                    localDistanceKm: i.localDistanceKm,
                    localLiftHeightM: i.localLiftHeightM,

                }))
            };
            if (selectedTravelLog) {
                updateMutation.mutate({
                    ...travellog,
                    _id: selectedTravelLog._id,
                });
            } else {
                createMutation.mutate(travellog);
            }
        },
    });

    const handleOpen = (travellog?: any) => {
        if (travellog) {
            const value = {
                _id: travellog?._id,
                excavator: travellog.excavator !== null &&
                    typeof travellog.excavator === "object"
                    ? travellog.excavator._id
                    : travellog.excavator || undefined,
                workingDate: travellog.workingDate
                    ? dayjs(travellog.workingDate).startOf('day').toDate()
                    : new Date(),
                shift: travellog.shift !== null &&
                    typeof travellog.shift === "object"
                    ? travellog.shift._id
                    : travellog.shift || undefined,
                area: travellog.area,
                routes: (travellog.routes || []).map((i: any) => ({
                    location: i.location !== null &&
                        typeof i.location === "object"
                        ? i.location._id
                        : i.location || undefined,
                    material: i.material !== null &&
                        typeof i.material === "object"
                        ? i.material._id
                        : i.material || undefined,
                    excavationLevel: i.excavationLevel,
                    dumpHeightActual: i.dumpHeightActual,
                    fullDistanceKm: i.fullDistanceKm,
                    fullLiftHeightM: i.fullLiftHeightM,
                    localMinHeightM: i.localMinHeightM,
                    localMaxHeightM: i.localMaxHeightM,
                    localDistanceKm: i.localDistanceKm,
                    localLiftHeightM: i.localLiftHeightM,

                }))
            }
            setSelectedTravelLog(value);
            formik.setValues(value);
        } else {
            setSelectedTravelLog(null);
        }
        setExpanded(true);
        setOpen(true);
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        }, 500);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedTravelLog(null);
        setExpanded(false);
        formik.resetForm()
    };

    const handleDelete = () => {
        if (selectedTravelLogs.length === 0) {
            return showErrorAlert("Không tìm thấy bản ghi cần xóa");
        }
        showConfirmAlert("Bạn có muốn xóa?. Bạn sẽ không thể hoàn tác.").then(
            (result) => {
                if (result.isConfirmed) {
                    deleteMutation.mutate(selectedTravelLogs.map((o) => o));
                }
            }
        );
    };

    const handleSelected = (id: string) => {
        setSelectedTravelLogs(prev =>
            prev.includes(id)
                ? prev.filter(id => id !== id)
                : [...prev, id]
        );
    };

    return (
        <FormikProvider value={formik}>
            <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                    <Typography variant="h3" color={"blue"}>
                        Cung độ
                    </Typography>
                </Box>
                <Accordion expanded={expanded} ref={formRef}>
                    <AccordionSummary
                        expandIcon={<></>}
                        aria-controls="panel1-content"
                        id="panel1-header"
                        sx={{
                            backgroundColor: "white",
                            "&.Mui-focusVisible": {
                                backgroundColor: "white",
                            },
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                gap: 2,
                                alignItems: "center",
                                width: "100%",
                                flexWrap: "wrap", // Tự động xuống dòng khi không đủ không gian
                                flexDirection: {
                                    xs: "column", // Màn hình nhỏ: các items xếp dọc
                                    md: "row", // Màn hình lớn: các items xếp ngang
                                },
                                // Thêm các thuộc tính căn chỉnh để bố cục đẹp hơn
                                justifyContent: {
                                    xs: "flex-start", // Màn hình nhỏ: căn trái
                                    md: "space-between", // Màn hình lớn: giãn đều các items
                                },
                            }}
                        >
                            {/* Nhóm các nút lại với nhau */}
                            {user?.role === RoleEnum.ADMIN && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1, // Khoảng cách nhỏ hơn giữa các nút
                                        flexDirection: {
                                            xs: "column",
                                            md: "row",
                                        },
                                        width: {
                                            xs: "100%", // Group này chiếm 100% khi xếp dọc
                                            md: "auto",
                                        },
                                    }}
                                >
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleOpen()}
                                    >
                                        Thêm
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<DeleteIcon />}
                                        color="error"
                                        onClick={handleDelete}
                                    >
                                        Xóa
                                    </Button>
                                </Box>
                            )}

                            {/* Nhóm các Autocomplete và DatePicker lại với nhau */}
                            <Box
                                sx={{
                                    display: "flex",
                                    flexGrow: 1, // Chiếm hết phần còn lại của không gian
                                    gap: 2,
                                    alignItems: "center",
                                    flexDirection: {
                                        xs: "column",
                                        md: "row",
                                    },
                                    width: {
                                        xs: "100%", // Group này chiếm 100% khi xếp dọc
                                        md: "auto",
                                    },
                                }}
                            >
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Từ ngày"
                                        inputFormat="DD/MM/YYYY"
                                        value={startTime ? dayjs(startTime) : null}
                                        onChange={(value) => setStartTime(value)}
                                        renderInput={(params) => (
                                            <TextField {...params} fullWidth size="small" />
                                        )}
                                    />
                                </LocalizationProvider>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Đến ngày"
                                        inputFormat="DD/MM/YYYY"
                                        value={endTime ? dayjs(endTime) : null}
                                        onChange={(value) => setEndTime(value)}
                                        renderInput={(params) => (
                                            <TextField {...params} fullWidth size="small" />
                                        )}
                                    />
                                </LocalizationProvider>
                            </Box>

                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <AccordionDetails>
                            <DialogTitle>
                                {selectedTravelLog ? "Sửa cung độ" : "Thêm cung độ"}
                            </DialogTitle>
                            <DialogContent>
                                <Box
                                    component="form"
                                    onSubmit={formik.handleSubmit}
                                    sx={{ mt: 2 }}
                                >
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                    <DatePicker
                                                        label="Ngày làm việc"
                                                        inputFormat="DD/MM/YYYY" // v5 vẫn hỗ trợ
                                                        value={formik.values.workingDate ? dayjs(formik.values.workingDate) : null}
                                                        onChange={(value) => {
                                                            formik.setFieldValue('workingDate', value ? value : '');
                                                        }}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                fullWidth
                                                                {...getFormikFieldProps(formik, "workingDate")}
                                                            />
                                                        )}
                                                    />
                                                </LocalizationProvider>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Autocomplete
                                                    fullWidth
                                                    options={shifts}
                                                    getOptionLabel={(option: Shift) => `Ca ${option.name}` || ""}
                                                    value={
                                                        shifts.find(
                                                            (p: any) => p._id === formik.values.shift
                                                        ) || null
                                                    }
                                                    onChange={(event, newValue) => {
                                                        formik.setFieldValue("shift", newValue?._id || "");
                                                    }}
                                                    PopperComponent={StyledPopper}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Ca làm việc"
                                                            {...getFormikFieldProps(formik, "shift")}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Autocomplete
                                                    fullWidth
                                                    options={excavators}
                                                    getOptionLabel={(option: Device) => option.code || ""}
                                                    value={
                                                        excavators.find(
                                                            (p: any) => p._id === formik.values.excavator
                                                        ) || null
                                                    }
                                                    onChange={(event, newValue) => {
                                                        formik.setFieldValue("excavator", newValue?._id || "");
                                                    }}
                                                    PopperComponent={StyledPopper}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Máy xúc"
                                                            {...getFormikFieldProps(formik, "excavator")}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <TextField
                                                    fullWidth
                                                    id="area"
                                                    name="area"
                                                    label="Khu vực"
                                                    value={formik.values.area ?? ""}
                                                    onChange={formik.handleChange}
                                                    {...getFormikFieldProps(formik, "area")}
                                                />
                                            </Grid>
                                        </Grid>
                                        <FieldArray name="routes">
                                            {({ push, remove }) => (
                                                <Stack spacing={3} sx={{ mt: 2 }}>
                                                    {formik.values.routes.map((route, index) => (
                                                        <Box key={index} sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, position: 'relative' }}>
                                                            {index > 0 && (
                                                                <IconButton
                                                                    onClick={() => remove(index)}
                                                                    color="error"
                                                                    sx={{
                                                                        position: 'absolute',
                                                                        top: -16,             // nổi lên trên viền 1 chút
                                                                        left: 12,
                                                                        bgcolor: 'background.paper',
                                                                    }}
                                                                >
                                                                    <Delete fontSize='small' />
                                                                    <Typography variant="caption" sx={{ userSelect: 'none' }}>Xóa</Typography>
                                                                </IconButton>
                                                            )}
                                                            <Grid container spacing={2}>
                                                                {/* --- Nhóm 1: Chọn địa điểm & vật liệu --- */}
                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <Autocomplete
                                                                        fullWidth
                                                                        options={locations}
                                                                        getOptionLabel={(option: Location) => option.name || ""}
                                                                        value={locations.find((p: any) => p._id === route.location) || null}
                                                                        onChange={(e, newValue) =>
                                                                            formik.setFieldValue(`routes[${index}].location`, newValue?._id || "")
                                                                        }
                                                                        renderInput={(params) => (
                                                                            <TextField
                                                                                {...params}
                                                                                label="Điểm đổ"
                                                                                {...getFormikFieldProps(formik, `routes[${index}].location`)}
                                                                            />
                                                                        )}
                                                                    />
                                                                </Grid>

                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <Autocomplete
                                                                        fullWidth
                                                                        options={materials}
                                                                        getOptionLabel={(option: Material) => option.name || ""}
                                                                        value={materials.find((p: any) => p._id === route.material) || null}
                                                                        onChange={(e, newValue) =>
                                                                            formik.setFieldValue(`routes[${index}].material`, newValue?._id || "")
                                                                        }
                                                                        renderInput={(params) => (
                                                                            <TextField
                                                                                {...params}
                                                                                label="Vật liệu"
                                                                                {...getFormikFieldProps(formik, `routes[${index}].material`)}
                                                                            />
                                                                        )}
                                                                    />
                                                                </Grid>

                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Tầng xúc"
                                                                        name={`routes[${index}].excavationLevel`}
                                                                        value={route.excavationLevel}
                                                                        onChange={formik.handleChange}
                                                                        {...getFormikFieldProps(formik, `routes[${index}].excavationLevel`)}
                                                                    />
                                                                </Grid>

                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <TextField
                                                                        fullWidth
                                                                        type="number"
                                                                        label="Độ cao thực tế điểm đổ"
                                                                        name={`routes[${index}].dumpHeightActual`}
                                                                        value={route.dumpHeightActual}
                                                                        onChange={formik.handleChange}
                                                                        {...getFormikFieldProps(formik, `routes[${index}].dumpHeightActual`)}
                                                                    />
                                                                </Grid>

                                                                {/* --- Nhóm 2: Thông số toàn tuyến --- */}
                                                                <Grid item xs={12}>
                                                                    <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600 }}>
                                                                        Thông số toàn tuyến
                                                                    </Typography>
                                                                </Grid>

                                                                <Grid item xs={12} sm={6}>
                                                                    <TextField
                                                                        fullWidth
                                                                        type="number"
                                                                        label="Cung độ (km)"
                                                                        name={`routes[${index}].fullDistanceKm`}
                                                                        value={route.fullDistanceKm ?? ''}
                                                                        onChange={formik.handleChange}
                                                                        InputLabelProps={{ shrink: true }}
                                                                        {...getFormikFieldProps(formik, `routes[${index}].fullDistanceKm`)}
                                                                    />
                                                                </Grid>

                                                                <Grid item xs={12} sm={6}>
                                                                    <TextField
                                                                        fullWidth
                                                                        type="number"
                                                                        label="Chiều cao nâng tải (m)"
                                                                        name={`routes[${index}].fullLiftHeightM`}
                                                                        value={route.fullLiftHeightM?.toString() ?? ''}
                                                                        onChange={formik.handleChange}
                                                                        InputLabelProps={{ shrink: true }}
                                                                        {...getFormikFieldProps(formik, `routes[${index}].fullLiftHeightM`)}
                                                                    />
                                                                </Grid>

                                                                {/* --- Nhóm 3: Thông số cục bộ --- */}
                                                                <Grid item xs={12}>
                                                                    <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600 }}>
                                                                        Thông số cục bộ
                                                                    </Typography>
                                                                </Grid>

                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <TextField
                                                                        fullWidth
                                                                        type="number"
                                                                        label="Chiều cao tối thiểu (m)"
                                                                        name={`routes[${index}].localMinHeightM`}
                                                                        value={route.localMinHeightM ?? ''}
                                                                        onChange={formik.handleChange}
                                                                        InputLabelProps={{ shrink: true }}
                                                                        {...getFormikFieldProps(formik, `routes[${index}].localMinHeightM`)}
                                                                    />
                                                                </Grid>

                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <TextField
                                                                        fullWidth
                                                                        type="number"
                                                                        label="Chiều cao tối đa (m)"
                                                                        name={`routes[${index}].localMaxHeightM`}
                                                                        value={route.localMaxHeightM ?? ''}
                                                                        onChange={formik.handleChange}
                                                                        InputLabelProps={{ shrink: true }}
                                                                        {...getFormikFieldProps(formik, `routes[${index}].localMaxHeightM`)}
                                                                    />
                                                                </Grid>

                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <TextField
                                                                        fullWidth
                                                                        type="number"
                                                                        label="Cung độ (km)"
                                                                        name={`routes[${index}].localDistanceKm`}
                                                                        value={route.localDistanceKm ?? ''}
                                                                        onChange={formik.handleChange}
                                                                        InputLabelProps={{ shrink: true }}
                                                                        {...getFormikFieldProps(formik, `routes[${index}].localDistanceKm`)}
                                                                    />
                                                                </Grid>

                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <TextField
                                                                        fullWidth
                                                                        type="number"
                                                                        label="Chiều cao nâng tải (m)"
                                                                        name={`routes[${index}].localLiftHeightM`}
                                                                        value={route.localLiftHeightM ?? ''}
                                                                        onChange={formik.handleChange}
                                                                        InputLabelProps={{ shrink: true }}
                                                                        {...getFormikFieldProps(formik, `routes[${index}].localLiftHeightM`)}
                                                                    />
                                                                </Grid>
                                                            </Grid>

                                                        </Box>
                                                    ))}

                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<AddIcon />}
                                                        onClick={() =>
                                                            push({
                                                                location: "",
                                                                material: "",
                                                                excavationLevel: "",
                                                                dumpHeightActual: "",
                                                                fullDistanceKm: "",
                                                                fullLiftHeightM: "",
                                                                localMinHeightM: "",
                                                                localMaxHeightM: "",
                                                                localDistanceKm: "",
                                                                localLiftHeightM: "",
                                                            })
                                                        }
                                                    >
                                                        Thêm tuyến
                                                    </Button>
                                                </Stack>
                                            )}
                                        </FieldArray>
                                    </Box>
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleClose}>Hủy</Button>
                                <Button onClick={() => formik.submitForm()} variant="contained">
                                    {selectedTravelLog ? "Sửa" : "Thêm mới"}
                                </Button>
                            </DialogActions>
                        </AccordionDetails>
                    </AccordionDetails>
                </Accordion>
                <Box display="flex" alignItems="center" sx={{ mb: 2, mt: 2 }}>
                    <Typography variant="h4">Bảng cung độ</Typography>
                    {/* <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Settings sx={{ fontSize: 30 }} />
                    </IconButton> */}
                    {/* <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        sx={{ maxHeight: 400 }}
                    >
                        {defaultColumns.map((col) => (
                            <MenuItem key={col.id} onClick={() => handleToggleColumn(col.id)}>
                                <Switch checked={visibleColumns.includes(col.id)} />
                                <ListItemText primary={col.label} />
                            </MenuItem>
                        ))}
                    </Menu> */}
                </Box>
                <Paper>
                    <TableContainer>
                        <Table sx={{
                            "& td, & th": { padding: "4px 8px" },
                        }}>
                            <TableHead>
                                <TableRow>
                                    {user?.role === RoleEnum.ADMIN && <TableCell rowSpan={2} align="center" sx={{
                                        backgroundColor: '#f5f5f5',
                                    }}>
                                        <Checkbox
                                            color="primary"
                                            checked={travelLogs.length > 0 && selectedTravelLogs.length === travelLogs.length}
                                            indeterminate={selectedTravelLogs.length > 0 && selectedTravelLogs.length < travelLogs.length}
                                            onChange={() => {
                                                if (selectedTravelLogs.length === travelLogs.length) {
                                                    setSelectedTravelLogs([]);
                                                } else {
                                                    setSelectedTravelLogs(travelLogs.map((t: TravelLog) => t._id));
                                                }
                                            }}
                                        />
                                    </TableCell>}
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5', }} rowSpan={2}>TT</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }} rowSpan={2}>Máy xúc</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }} rowSpan={2}>Ngày</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }} rowSpan={2}>Ca</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }} rowSpan={2}>Khu vực</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }} rowSpan={2}>Điểm đổ tải</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }} rowSpan={2}>Vật liệu</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }} rowSpan={2}>Tầng xúc</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }} rowSpan={2}>Độ cao thực tế nơi đổ</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }} colSpan={2}>Toàn tuyến</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }} colSpan={4}>Trong đó cục bộ</TableCell>
                                    {user?.role === RoleEnum.ADMIN && <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }} rowSpan={2}>Sửa</TableCell>}
                                </TableRow>
                                <TableRow>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }}>C.độ (km)</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }}>Chiều cao N.tải(m)</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }}>H min</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }}>H max</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }}>C. độ (km)</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", background: '#f5f5f5' }}>Chiều cao N.tải (m)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {travelLogs.map((t: any, index: number) => {
                                    const span = t.routes?.length || 1;

                                    return (
                                        <>
                                            {(t.routes.length > 0 ? t.routes : [{}]).map((r: any, routeIndex: number) => (
                                                <TableRow key={`${t._id}-${routeIndex}`} sx={{ backgroundColor: index % 2 === 0 ? 'white' : '#e3f2fd', }}>
                                                    {/* Chỉ hiển thị các ô gộp ở dòng đầu */}
                                                    {routeIndex === 0 && (
                                                        <>
                                                            {user?.role === RoleEnum.ADMIN && <TableCell align='center' rowSpan={span} sx={{ width: 50 }}><Checkbox onChange={() => handleSelected(t._id)} checked={selectedTravelLogs.includes(t._id)} /></TableCell>}
                                                            <TableCell align="center" rowSpan={span} sx={{ width: 30 }}>{(page * pageSize) + index + 1}</TableCell>
                                                            <TableCell align="center" rowSpan={span}>{t.excavator?.code}</TableCell>
                                                            <TableCell align="center" rowSpan={span}>{t.workingDate ? format(new Date(t.workingDate), 'dd-MM-yyyy') : ''}</TableCell>
                                                            <TableCell align="center" rowSpan={span}>{t.shift?.name}</TableCell>
                                                            <TableCell align="center" rowSpan={span}>{t.area}</TableCell>
                                                        </>
                                                    )}
                                                    <TableCell align="center">{r.location?.name}</TableCell>
                                                    <TableCell align="center">{r.material?.name}</TableCell>
                                                    <TableCell align="center">{r.excavationLevel}</TableCell>
                                                    <TableCell align="center">{r.dumpHeightActual}</TableCell>
                                                    <TableCell align="center">{r.fullDistanceKm}</TableCell>
                                                    <TableCell align="center">{r.fullLiftHeightM}</TableCell>
                                                    <TableCell align="center">{r.localMinHeightM}</TableCell>
                                                    <TableCell align="center">{r.localMaxHeightM}</TableCell>
                                                    <TableCell align="center">{r.localDistanceKm}</TableCell>
                                                    <TableCell align="center">{r.localLiftHeightM}</TableCell>
                                                    {routeIndex === 0 && user?.role === RoleEnum.ADMIN && (
                                                        <TableCell align='center' rowSpan={span} sx={{ width: 50 }}>
                                                            <IconButton color="primary" onClick={async () => {
                                                                if (open) {
                                                                    const result = await showConfirmAlert(
                                                                        "Bạn đang cập nhật một mục. Nếu tiếp tục chỉnh sửa, dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn tiếp tục?"
                                                                    );
                                                                    if (result.isConfirmed) {
                                                                        handleOpen(t);
                                                                    }
                                                                } else {
                                                                    handleOpen(t);
                                                                }
                                                            }}>
                                                                <EditIcon />
                                                            </IconButton>
                                                        </TableCell>
                                                    )}
                                                </TableRow>

                                            ))}
                                        </>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={pageSize}
                            onRowsPerPageChange={(event) => {
                                setPageSize(parseInt(event.target.value, 10));
                                setPage(0);
                            }}
                        />
                    </TableContainer>
                </Paper>
            </Box>
        </FormikProvider>
    );
};

export default TravelLogs;