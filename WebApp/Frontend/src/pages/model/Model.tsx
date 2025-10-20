import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TextField,
    MenuItem,
    Alert,
    Switch,
    ListItemText,
    Menu,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    TablePagination,
    InputAdornment,
    Breadcrumbs,
    LinearProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Settings,
    ExpandMore,
    Search,
    Download,
    UploadFile,
    Save,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Job } from '../../types';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../components/Alert';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import { jobValidationSchema } from '../../utils/validation';
import { JOB_TYPE_OPTIONS } from '../../utils/const';
import { DataGrid, GridRowModel } from '@mui/x-data-grid';
import CustomDataGrid from '../../components/Table/CustomDataGrid';


const Models: React.FC = () => {

    const { data: materials = [] } = useQuery({
        queryKey: ['materials'],
        queryFn: () => api.get(`/materials`).then(res => res.data.data),
    });

    const { data: devicemodels = [] } = useQuery({
        queryKey: ['devicemodels'],
        queryFn: () => api.get(`/devicemodels`).then(res => res.data.data),
    });

    const { data: models = [] } = useQuery({
        queryKey: ['models'],
        queryFn: () => api.get(`/models`).then(res => res.data.data),
    });

    const defaultColumns = useMemo(() => {
        const staticCols = [
            {
                id: "material",
                label: "Vật liệu",
                width: 100,
                headerAlign: "center",
                align: "left",
                sortable: true,
                filterable: true,
                sticky: true,
                resizable: false,
            },
            {
                id: "acceptedProduct",
                label: "Sản phẩm nghiệm thu",
                width: 100,
                headerAlign: "center",
                align: "center",
                sortable: true,
                filterable: true,
                sticky: true,
                resizable: false,
            },
            {
                id: "density",
                label: "Tỷ trọng quy ẩm",
                width: 100,
                headerAlign: "center",
                align: "center",
                sortable: true,
                filterable: false,
                sticky: true,
                resizable: false,
            },
            {
                id: "dryDensity",
                label: "Tỷ trọng không quy ẩm",
                width: 100,
                headerAlign: "center",
                align: "center",
                sortable: true,
                filterable: false,
                sticky: true,
                resizable: false,
            },
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
    }, [devicemodels]);

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
        // Chỉ cập nhật nếu rows mới khác rows hiện tại
        const isSame = JSON.stringify(rows) === JSON.stringify(tableRows);
        if (!isSame) setTableRows(rows);
    }, [rows]);

    const processRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
        setTableRows((prev: any) =>
            prev.map((r: any) => (r.id === newRow.id ? newRow : r))
        );
        return newRow;
    };

    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const saveMutation = useMutation({
        mutationFn: async (rowsToSave: GridRowModel[]) => {
            // gửi tất cả rows lên API 1 lần
            await api.post('/models/bulk-upsert', { rows: rowsToSave },
            );
        },
        onMutate: () => {
            setIsUploading(true);
        },
        onSuccess: (data) => {
            showSuccessAlert("Lưu thành công");
            setIsUploading(false);
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
            <Box sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h4">Mô hình xe</Typography>
                <Box display="flex" justifyContent={"flex-end"}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                            const result = await showConfirmAlert('Bạn có chắc muốn lưu thay đổi?');
                            if (result.isConfirmed) {
                                saveMutation.mutate(tableRows)
                            }
                        }
                        }
                        startIcon={<Save />}
                    >
                        Lưu thay đổi
                    </Button>
                </Box>
                {isUploading && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" align="center">
                            Đang xử lý dữ liệu...
                        </Typography>
                        <LinearProgress />
                    </Box>
                )}
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
                        }} />
                </Box>
            </Box>

        </Box >
    );
};

export default Models;
