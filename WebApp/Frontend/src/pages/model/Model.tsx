import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    Typography,
    Checkbox,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TablePagination,
    LinearProgress,
    FormControlLabel, // Thêm FormControlLabel
    TextField,
    Breadcrumbs,
    AccordionActions, // Thêm TextField để nhập Date/Time
} from '@mui/material';
import {
    Save,
    ExpandMore,
    Add as AddIcon,
} from '@mui/icons-material';
import api from '../../config/api.config';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';
import CustomDataGrid from '../../components/Table/CustomDataGrid';
import { GridRowModel } from '@mui/x-data-grid';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Định nghĩa kiểu dữ liệu cho một khoảng thời gian lịch sử
interface HistoryTimeSlot {
    id: string; // Dùng UUID hoặc một giá trị duy nhất
    startTime: Date | null;
    endTime: Date | null;
    isNew: boolean; // Đánh dấu là khoảng thời gian mới chưa lưu DB
}

const Models: React.FC = () => {

    const [expanded, setExpanded] = useState(false);
    // --- State Mới ---
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<HistoryTimeSlot | null>(null);
    const [timeSlots, setTimeSlots] = useState<HistoryTimeSlot[]>([]);
    const [isCreatingNewSlot, setIsCreatingNewSlot] = useState(false); // Trạng thái đang tạo slot mới
    // --- Kết thúc State Mới ---

    const { data: materials = [] } = useQuery({ queryKey: ['materials'], queryFn: () => api.get(`/materials`).then(res => res.data.data), });
    const { data: devicemodels = [] } = useQuery({ queryKey: ['devicemodels'], queryFn: () => api.get(`/devicemodels`).then(res => res.data.data), });

    // Lấy tất cả models để tạo các khoảng thời gian duy nhất
    const { data: models = [] } = useQuery({
        queryKey: ['models', selectedTimeSlot],
        queryFn: () => api.get(`/models?startTime=${selectedTimeSlot?.startTime ? selectedTimeSlot?.startTime.toISOString() : ''}&endTime=${selectedTimeSlot?.endTime ? selectedTimeSlot?.endTime.toISOString() : ''}`).then(res => res.data.data),
    });

    useEffect(() => {
        if (models.length > 0) {
            const allHistory: HistoryTimeSlot[] = [];
            const seen = new Set();

            models.forEach((model: any) => {
                model.valueHistory.forEach((h: any) => {
                    const key = `${h.startTime}-${h.endTime}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        allHistory.push({
                            id: key,
                            startTime: h.startTime ? new Date(h.startTime) : null,
                            endTime: h.endTime ? new Date(h.endTime) : null,
                            isNew: false,
                        });
                    }
                });
            });

            // sắp xếp giảm dần
            allHistory.sort((a, b) => {
                // b.startTime ?? 0: Nếu b.startTime là null/undefined, dùng 0.
                const timeB = new Date(b.startTime ?? 0).getTime();
                const timeA = new Date(a.startTime ?? 0).getTime();

                // Thực hiện phép trừ giữa hai timestamp (kiểu number)
                return timeB - timeA;
            });
            setTimeSlots(allHistory);
            if (!isCreatingNewSlot && allHistory.length > 0 && selectedTimeSlot === null) {
                setSelectedTimeSlot(allHistory[0]);
            }
        }
    }, [models, isCreatingNewSlot, selectedTimeSlot]);

    // Hàm xử lý khi chọn một slot lịch sử
    const handleSelectSlot = (slot: HistoryTimeSlot) => {
        setSelectedTimeSlot(slot);
        setIsCreatingNewSlot(false); // Đảm bảo tắt chế độ tạo mới
        setExpanded(false)
    };

    // Hàm xử lý khi tạo slot mới
    const handleCreateNewSlot = () => {
        const startOfMonth = dayjs().startOf('month').toDate();
        const endOfMonth = dayjs().endOf('month').toDate();
        const newSlot: HistoryTimeSlot = {
            id: Date.now().toString(), // ID tạm thời
            startTime: startOfMonth,
            endTime: endOfMonth, // Mặc định 1 giờ sau
            isNew: true,
        };
        setTimeSlots([newSlot, ...timeSlots.filter(s => !s.isNew)]); // Đặt slot mới lên đầu
        setSelectedTimeSlot(newSlot);
        setIsCreatingNewSlot(true);
        setExpanded(true)

        const emptyRows = materials.map((m: any) => {
            const row: any = {
                id: m._id,
                material: m.name,
                acceptedProduct: m.acceptedProduct,
                density: m.density,
                dryDensity: m.dryDensity,
            };
            devicemodels.forEach((d: any) => {
                row[d._id] = ''; // giá trị rỗng
            });
            return row;
        });

        setTableRows(emptyRows);
    };

    // Hàm xử lý thay đổi thời gian của slot đang tạo/chọn
    const handleTimeChange = (field: 'startTime' | 'endTime', value: Dayjs | null) => {
        if (selectedTimeSlot) {
            setSelectedTimeSlot(prev => prev ? ({ ...prev, [field]: value }) : null);
        }
    };


    const defaultColumns = useMemo(() => {
        const staticCols = [
            // Giữ nguyên các cột static
            // ...
            { id: "material", label: "Vật liệu", width: 100, headerAlign: "center", align: "left", sortable: true, filterable: true, sticky: true, resizable: false, },
            { id: "acceptedProduct", label: "Sản phẩm nghiệm thu", width: 100, headerAlign: "center", align: "center", sortable: true, filterable: true, sticky: true, resizable: false, },
            { id: "density", label: "Tỷ trọng quy ẩm", width: 100, headerAlign: "center", align: "center", sortable: true, filterable: false, sticky: true, resizable: false, },
            { id: "dryDensity", label: "Tỷ trọng không quy ẩm", width: 100, headerAlign: "center", align: "center", sortable: true, filterable: false, sticky: true, resizable: false, },
        ];

        const dynamicCols = devicemodels.map((d: any) => ({
            id: d._id,
            label: d.name,
            width: 150,
            headerAlign: "center",
            align: "center",
            sortable: false,
            filterable: false,
            renderCell: (params: any) => {
                return (
                    <input
                        type="number"
                        style={{
                            width: "100%",
                            border: "none",
                            textAlign: "center",
                            outline: "none",
                            background: "transparent",
                        }}
                        disabled={!selectedTimeSlot}
                        value={params.value ?? ""}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setTableRows((prev) =>
                                prev.map((r) =>
                                    r.id === params.row.id
                                        ? { ...r, [params.field]: newValue }
                                        : r
                                )
                            );
                        }}
                    />
                );
            },
        }));

        return [...staticCols, ...dynamicCols];
    }, [devicemodels, selectedTimeSlot]);


    // --- Logic Tạo Rows Dữ liệu theo Time Slot đã chọn ---
    const rows = useMemo(() => {
        if (!materials.length || !devicemodels.length) return [];
        return materials.map((m: any) => {
            const row: any = { id: m._id, material: m.name, acceptedProduct: m.acceptedProduct, density: m.density, dryDensity: m.dryDensity };
            devicemodels.forEach((d: any) => {
                const record = models.find(
                    (mdl: any) => mdl.material === m._id && mdl.deviceModel === d._id
                );
                row[d._id] = record ? record.value : '';
            });
            return row;
        });
    }, [materials, devicemodels, models]);


    const [tableRows, setTableRows] = useState<any[]>([]);

    useEffect(() => {
        if (!isCreatingNewSlot && !saveMutation.isPending) {
            setTableRows(rows);
        }
    }, [rows]);

    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const saveMutation = useMutation({
        mutationFn: async (rowsToSave: GridRowModel[]) => {
            if (!selectedTimeSlot) throw new Error("Vui lòng chọn hoặc tạo mới khoảng thời gian trước khi lưu!");

            // Gửi dữ liệu cùng với khoảng thời gian được chọn lên API
            await api.post('/models/bulk-upsert', {
                rows: rowsToSave,
                startTime: dayjs.utc(dayjs(selectedTimeSlot.startTime).format('YYYY-MM-DD')).toDate(),
                endTime: dayjs.utc(dayjs(selectedTimeSlot.endTime).format('YYYY-MM-DD')).toDate(),
                isNewSlot: selectedTimeSlot.isNew || isCreatingNewSlot,
            });
        },
        onMutate: () => {
            setIsUploading(true);
        },
        onSuccess: (data) => {
            showSuccessAlert("Lưu thành công");
            setIsUploading(false);
            setIsCreatingNewSlot(false); // Tắt chế độ tạo mới sau khi lưu thành công
            setExpanded(false)
            setSelectedTimeSlot(null)
            queryClient.invalidateQueries({ queryKey: ['models'] });
        },
        onError: (error: any) => {
            setIsUploading(false);
            showErrorAlert(error.response?.data?.message || "Lưu thất bại");
        }
    });


    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Mô hình xe</Typography>
            </Breadcrumbs>

            {/* Nút Lưu và Bảng Dữ liệu */}
            <Box sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h4">Mô hình xe</Typography>
                <Accordion sx={{ mb: 2 }} expanded={expanded}>
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
                        <Box display="flex" gap={2}>
                            <Button
                                variant="contained"
                                onClick={handleCreateNewSlot}
                                startIcon={<AddIcon />}
                                color="success"
                            >
                                Tạo mới
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={async () => {
                                    if (!selectedTimeSlot) {
                                        showErrorAlert("Vui lòng chọn hoặc tạo mới khoảng thời gian trước khi lưu!");
                                        return;
                                    }
                                    const result = await showConfirmAlert(`Bạn có chắc muốn lưu thay đổi cho khoảng thời gian ${dayjs(selectedTimeSlot.startTime).format('DD-MM-YYYY')} - ${dayjs(selectedTimeSlot.endTime).format('DD-MM-YYYY')} ?`);
                                    if (result.isConfirmed) {
                                        saveMutation.mutate(tableRows)
                                    }
                                }}
                                startIcon={<Save />}
                                disabled={saveMutation.isPending || !selectedTimeSlot}
                            >
                                Lưu thay đổi
                            </Button>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        {/* Input cho Start/End Time nếu đang ở chế độ tạo mới/chỉnh sửa */}
                        {(selectedTimeSlot && isCreatingNewSlot) && (
                            <Box display="flex" gap={2} mb={2}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Bắt đầu"
                                        inputFormat="DD/MM/YYYY" // v5 vẫn hỗ trợ
                                        value={selectedTimeSlot.startTime ? dayjs(selectedTimeSlot.startTime) : null}
                                        onChange={(value) => handleTimeChange('startTime', value)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                            />
                                        )}
                                    />
                                </LocalizationProvider>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Kết thúc"
                                        inputFormat="DD/MM/YYYY" // v5 vẫn hỗ trợ
                                        value={selectedTimeSlot.endTime ? dayjs(selectedTimeSlot.endTime) : null}
                                        onChange={(value) => handleTimeChange('endTime', value)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                            />
                                        )}
                                    />
                                </LocalizationProvider>
                            </Box>
                        )}
                    </AccordionDetails>
                    <AccordionActions>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setSelectedTimeSlot(null)
                                setExpanded(false)
                                setIsCreatingNewSlot(false)
                            }}
                            color="primary"
                        >
                            Hủy
                        </Button>
                    </AccordionActions>
                </Accordion>
                {isUploading && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" align="center">
                            Đang xử lý dữ liệu...
                        </Typography>
                        <LinearProgress />
                    </Box>
                )}
                <Box display="flex" flexWrap="wrap" gap={1}>
                    {timeSlots.filter(s => !s.isNew).map((slot) => (
                        <FormControlLabel
                            key={slot.id}
                            control={
                                <Checkbox
                                    checked={selectedTimeSlot?.id === slot.id}
                                    onChange={() => handleSelectSlot(slot)}
                                />
                            }
                            label={`Từ: ${dayjs(slot.startTime).format("DD-MM-YYYY")} Đến: ${dayjs(slot.endTime).format("DD-MM-YYYY")}`}
                        />
                    ))}
                </Box>
                <Box sx={{ height: '60vh' }}>
                    <CustomDataGrid
                        rows={tableRows}
                        defaultColumns={defaultColumns}
                        isLoading={false}
                        onSelectionChange={() => { }}
                        sx={{
                            '& .MuiDataGrid-columnHeader[data-field="material"]': {
                                position: 'sticky',
                                left: 0,
                                zIndex: 20,
                                backgroundColor: 'inherit',
                            },
                            '& .MuiDataGrid-cell[data-field="material"]': {
                                position: 'sticky',
                                left: 0,
                                zIndex: 19,
                                backgroundColor: "inherit !important",
                            },
                            '& .MuiDataGrid-columnHeader[data-field="acceptedProduct"]': {
                                position: 'sticky',
                                left: 100,
                                zIndex: 20,
                                backgroundColor: 'inherit',
                            },
                            '& .MuiDataGrid-cell[data-field="acceptedProduct"]': {
                                position: 'sticky',
                                left: 100,
                                zIndex: 19,
                                backgroundColor: "inherit !important",
                            },
                            '& .MuiDataGrid-columnHeader[data-field="density"]': {
                                position: 'sticky',
                                left: 200,
                                zIndex: 20,
                                backgroundColor: 'inherit',
                            },
                            '& .MuiDataGrid-cell[data-field="density"]': {
                                position: 'sticky',
                                left: 200,
                                zIndex: 19,
                                backgroundColor: "inherit !important",
                            },
                            '& .MuiDataGrid-columnHeader[data-field="dryDensity"]': {
                                position: 'sticky',
                                left: 300,
                                zIndex: 20,
                                backgroundColor: 'inherit',
                                boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                            },
                            '& .MuiDataGrid-cell[data-field="dryDensity"]': {
                                position: 'sticky',
                                left: 300,
                                zIndex: 19,
                                backgroundColor: "inherit !important",
                                boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                            },
                        }}
                    />
                </Box>
            </Box>

        </Box >
    );
};

export default Models;