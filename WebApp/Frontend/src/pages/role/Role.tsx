import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Box,
    Button,
    DialogActions,
    DialogContent,
    IconButton,
    Typography,
    TextField,
    MenuItem,
    Menu,
    Switch,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Breadcrumbs,
    InputAdornment,
    LinearProgress,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Settings,
    Search,
    UploadFile,
    Download,
} from "@mui/icons-material";
import { useFormik } from "formik";
import { Position } from "../../types";
import {
    showConfirmAlert,
    showErrorAlert,
    showSuccessAlert,
} from "../../components/Alert";
import { useAtom } from "jotai";
import { userAtom } from "../../atoms/userAtoms";
import { positionValidationSchema } from "../../utils/validation";
import PositionService from "../../services/positionService";
import { RoleEnum } from "../../enums";
import CustomDataGrid from "../../components/Table/CustomDataGrid";
import { parseAxiosError } from "../../utils/handleApiError";
import api from "../../config/api.config";

const Roles: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(
        null
    );
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [value, setValue] = useState("");
    const [user] = useAtom(userAtom);
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: () => api.get(`/roles`).then(res => res.data.data), });
    const { data: permissions = [] } = useQuery({ queryKey: ['permissions'], queryFn: () => api.get(`/permissions`).then(res => res.data.data), });
    // const [rows, setRows] = useState<any[]>([]);

    const rows = useMemo(() => {
        return roles.map((role: any) => {
            const row: any = {
                id: role._id,
                role: role.value,
            };

            permissions.forEach((perm: any) => {
                row[perm._id] = role.permissions?.includes(perm._id) ?? false;
            });

            return row;
        });
    }, [roles, permissions]);


    const togglePermission = useMutation({
        mutationFn: ({ roleId, permissionId, allow }: any) =>
            api.patch(`/roles/${roleId}/permission`, { permissionId, allow }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            showSuccessAlert("Cập nhật quyền thành công");
        },
        onError: (err: any) => {
            showErrorAlert(err);
        },
    });

    const columns = useMemo(() => {
        return [
            {
                id: "role",
                label: "Chức vụ",
                width: 150,
                align: "left",
                sticky: true,
            },
            ...permissions.map((perm: any) => ({
                id: perm._id,
                label: perm.name,
                width: 120,
                filterable: false,
                renderCell: (params: any) => {
                    const role = roles.find((r: any) => r._id === params.row.id);
                    const isChecked = role?.permission?.includes(perm._id);

                    return (
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                                togglePermission.mutate({
                                    roleId: params.row.id,
                                    permissionId: perm._id,
                                    allow: e.target.checked,
                                })
                            }
                        />
                    );
                }
            })),
        ];
    }, [permissions]);


    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb">
                <Typography>Danh mục</Typography>
                <Typography>Chức vụ</Typography>
            </Breadcrumbs>
            <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 3, mt: 3 }}
            >
                <Typography variant="h3" color={"blue"}>
                    Chức vụ
                </Typography>
            </Box>
            {/* <Accordion expanded={expanded} ref={formRef}>
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
                            flexDirection: {
                                xs: "column",
                                md: "row",
                            },
                        }}
                    >
                        {user?.role === RoleEnum.ADMIN && (
                            <Box
                                display={"flex"}
                                gap={2}
                                sx={{
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
                        <Box
                            flex={2}
                            sx={{
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
                            <TextField
                                fullWidth
                                size="small"
                                value={value}
                                placeholder="Tìm kiếm theo tên chức danh, nghề nghiệp"
                                onChange={(e) => setValue(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Search sx={{ fontSize: 24 }} />
                                        </InputAdornment>
                                    ),
                                }}
                            ></TextField>
                        </Box>
                        {user?.role === RoleEnum.ADMIN && (
                            <Box
                                display="flex"
                                gap={2}
                                sx={{
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
                                <input
                                    id="upload-excel"
                                    type="file"
                                    accept=".xlsx, .xls"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const formData = new FormData();
                                            formData.append("file", file);
                                            importFile.mutate(formData);
                                        }
                                        e.target.value = "";
                                    }}
                                />

                                <label htmlFor="upload-excel">
                                    <Button
                                        fullWidth
                                        component="span"
                                        variant="contained"
                                        startIcon={<UploadFile />}
                                    >
                                        Tải lên excel
                                    </Button>
                                </label>
                                <Button
                                    component="span"
                                    variant="contained"
                                    startIcon={<Download />}
                                    onClick={() => exportExcel.mutate()}
                                >
                                    Tải xuống
                                </Button>
                            </Box>
                        )}
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <DialogContent>
                        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <TextField
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="Tên chức danh"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
                                />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    id="note"
                                    name="note"
                                    label="Mô tả"
                                    value={formik.values.note}
                                    onChange={formik.handleChange}
                                    error={formik.touched.note && Boolean(formik.errors.note)}
                                    helperText={formik.touched.note && formik.errors.note}
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Hủy</Button>
                        <Button onClick={() => formik.submitForm()} variant="contained">
                            {selectedPosition ? "Cập nhật" : "Thêm mới"}
                        </Button>
                    </DialogActions>
                </AccordionDetails>
            </Accordion>
            {isUploading && (
                <Box sx={{ mt: 2 }}>
                    {progress < 100 ? (
                        <>
                            <Typography variant="body2" align="center">
                                Đang tải lên... {progress}%
                            </Typography>
                            <LinearProgress variant="determinate" value={progress} />
                        </>
                    ) : (
                        <>
                            <Typography variant="body2" align="center">
                                Đang xử lý dữ liệu trên server...
                            </Typography>
                            <LinearProgress />
                        </>
                    )}
                </Box>
            )} */}
            <Box display="flex" alignItems="center" sx={{ mb: 2, mt: 2 }}>
                <Typography variant="h4">Bảng chức vụ</Typography>
                {/* <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <Settings sx={{ fontSize: 30 }} />
                </IconButton>
                <Menu
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
            <CustomDataGrid
                rows={rows}
                defaultColumns={columns}
                isAdmin={user?.role === RoleEnum.ADMIN}
                // onEdit={handleOpen}
                onSelectionChange={setSelectedPositions}
                // isLoading={isLoading}
                sx={{
                    '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
                        whiteSpace: 'nowrap',
                    },
                    '& .MuiDataGrid-virtualScroller': {
                        overflowX: 'auto !important',
                        overflowY: 'auto !important',
                    },
                    '& .MuiDataGrid-columnHeader[data-field="role"]': {
                        position: 'sticky',
                        left: 0,
                        zIndex: 20,
                        backgroundColor: 'inherit',
                        boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                    },
                    '& .MuiDataGrid-cell[data-field="role"]': {
                        position: 'sticky',
                        left: 0,
                        zIndex: 19,
                        backgroundColor: 'inherit',
                        boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                    },
                }}
            />

        </Box>
    );
};

export default Roles;