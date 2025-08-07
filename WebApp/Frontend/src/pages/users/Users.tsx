import React, { useState } from 'react';
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
    Chip,
    Autocomplete,
    styled,
    Popper,
    InputAdornment,
    Grid,
    Checkbox,
    Tooltip,
    AccordionDetails,
    AccordionSummary,
    Accordion,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility,
    VisibilityOff,
    ImportExport,
    UploadFile,
    Close,
    InfoOutlined,
    ExpandMore,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { Department, User } from '../../types';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import imageCompression from 'browser-image-compression';
import UserHistories from '../../components/UserHistory/UserHistories';


const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '200px', // Đặt chiều cao tối đa mong muốn
        overflowY: 'auto', // Thêm thanh cuộn khi nội dung vượt quá chiều cao
    },
});
const validationSchema = yup.object({
    username: yup.string().required('Vui lòng nhập tên đăng nhập'),
    password: yup.string().when('_id', {
        is: (id: string) => !id,
        then: () => yup.string().required('Vui lòng nhập mật khẩu'),
        otherwise: () => yup.string(),
    }),
    fullName: yup.string().required('Vui lòng nhập họ tên'),
    salaryCode: yup.string().required('Vui lòng nhập mã thẻ lương'),
    position: yup.string().required('Vui lòng chọn chức vụ'),
    role: yup.string().required('Vui lòng chọn quyền hạn'),
});

const Users: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [history, setHistory] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [value, setValue] = useState("")
    const [department, setDepartment] = useState("")
    const [avatar, setAvatar] = useState("")
    const queryClient = useQueryClient();
    const [user, setUser] = useAtom(userAtom)

    const [showPassword, setShowPassword] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleChangeAction = (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded);
    };
    const handleTogglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users', value, department],
        queryFn: () => api.get(`/users?q=${value}&&department=${department}`).then(res => res.data.data),
    });

    const { data: positions = [] } = useQuery({
        queryKey: ['positions'],
        queryFn: () => api.get('/positions').then(res => res.data.data),
    });
    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data.data),
    });

    const createMutation = useMutation({
        mutationFn: (newUser: Partial<User>) =>
            api.post('/auth/register', newUser).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const importFile = useMutation({
        mutationFn: (formData: FormData) =>
            api.post('/users/importFile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            alert("Import thành công!");
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Lỗi khi import');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (updatedUser: Partial<User>) =>
            api.put(`/users/update/${updatedUser._id}`, updatedUser).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            handleClose();
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/users/${id}`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            username: '',
            password: '',
            fullName: '',
            gender: '',
            email: '',
            phone: '',
            avatar: avatar,
            salaryCode: '',
            department: user?.role === "manager" ? user?.department?._id : '',
            position: undefined,
            role: '',
            ...selectedUser,
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            const submitValues: Partial<User> = {
                ...values,
                // phone: values.phone ?? '',
            };
            if (!values.password) {
                delete submitValues.password;
            }
            if (selectedUser) {
                updateMutation.mutate({ ...submitValues, _id: selectedUser._id });
            } else {
                createMutation.mutate(submitValues);
            }
        },
    });

    const handleOpen = (user?: any) => {
        if (user) {
            setSelectedUser(user);
            formik.setValues({
                ...user,
                password: '',
                position: user.position !== null && typeof user.position === 'object'
                    ? user.position._id
                    : user.position || '',
                department: user.department !== null && typeof user.department === 'object'
                    ? user.department._id
                    : user.department || undefined,
            });
            setAvatar(user.avatar)
        } else {
            setSelectedUser(null);
            formik.resetForm();
        }
        setExpanded(true);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedUser(null);
        setAvatar('');
        setExpanded(false);
        formik.resetForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleImageUpload = async (file: File, type: 'avatar') => {
        const resizedFile = await imageCompression(file, { maxWidthOrHeight: 300, maxSizeMB: 1, initialQuality: 0.8, useWebWorker: true });
        const ext = 'webp';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const res = await api.get(`/uploads`, { params: { fileName, type } });
        const url = res.data?.data;
        await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'image/webp' }, body: resizedFile });
        const publicUrl = url.split('?')[0];
        setAvatar(publicUrl);
        formik.setFieldValue('avatar', publicUrl);
    };

    const renderImageUploadBox = (type: 'avatar', currentUrl: string) => (
        <Box sx={{ position: 'relative', width: 200, height: 200 }}>
            {currentUrl && (
                <IconButton onClick={() => {
                    setAvatar('')
                    formik.setFieldValue('avatar', null);
                }}
                    sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1000 }}>
                    <Close />
                </IconButton>
            )}
            <Button component="label" sx={{ width: '100%', height: '100%', border: '1px solid grey', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {!currentUrl && <Typography>Thêm ảnh</Typography>}
                <img src={currentUrl || '/image/camera.png'} width={currentUrl ? 200 : 30} />
                <input type="file" accept="image/*" hidden onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, type);
                    e.target.value = '';
                }} />
            </Button>
        </Box>
    );

    const userColumns: GridColDef[] = [
        { field: 'fullName', headerName: 'Họ tên', minWidth: 250, flex: 1, headerAlign: 'center' },
        {
            field: 'salaryCode',
            headerName: 'Thẻ lương',
            width: 120,
            headerAlign: 'center'
        },
        { field: 'gender', headerName: 'Giới tính', width: 120, headerAlign: 'center' },
        { field: 'phone', headerName: 'Số điện thoại', width: 150, headerAlign: 'center' },
        { field: 'email', headerName: 'Email', width: 150, headerAlign: 'center' },
        {
            field: 'position',
            headerName: 'Chức danh, nghề nghiệp',
            valueGetter: (params) => params.row.position?.name || '',
            width: 250,
            headerAlign: 'center'
        },
        {
            field: 'department',
            headerName: 'Đơn vị',
            valueGetter: (params) => {
                const dept = params.row.department;
                return typeof dept === 'object' && dept !== null
                    ? dept.name
                    : 'Chưa có';
            },
            minWidth: 250,
            flex: 1,
            headerAlign: 'center'
        },
        {
            field: 'role', headerName: 'Phân quyền', width: 150, headerAlign: 'center',
            renderCell: (params) => (
                <Typography>
                    {params.row.role === "admin" ? "Quản trị hệ thống" : params.row.role === "dispatcher" ? "Điều hành sản xuất" : params.row.role === "manager" ? "Quản lý" : "Nhân viên"}
                </Typography>
            )
        },
        {
            field: 'active', headerName: 'Trạng thái', width: 100, headerAlign: 'center', align: 'center',
            renderCell: (params) => (
                <Checkbox checked={params.row.active} onChange={(e) => updateMutation.mutate({ _id: params.row._id, active: e.target.checked })} />
            )
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 130,
            headerAlign: 'center',
            renderCell: (params) => (
                <>
                    <IconButton
                        color="info"
                        onClick={() => {
                            setSelectedUser(params.row)
                            setHistory(true)
                        }}
                    >
                        <InfoOutlined />
                    </IconButton>
                    <IconButton color="primary" onClick={() => handleOpen(params.row)}>
                        <EditIcon />
                    </IconButton>
                    {user._id !== params.row._id && <IconButton color="error" onClick={() => handleDelete(params.row._id)}>
                        <DeleteIcon />
                    </IconButton>}
                </>
            ),
            sortable: false,
            filterable: false,
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Quản lý người dùng</Typography>
                <Box>
                    <input
                        id="upload-excel"
                        type="file"
                        accept=".xlsx, .xls"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const formData = new FormData();
                                formData.append('file', file);
                                importFile.mutate(formData);
                            }
                            e.target.value = "";
                        }}
                    />

                    <label htmlFor="upload-excel">
                        <Button
                            component="span"
                            variant="contained"
                            startIcon={<UploadFile />}
                        >
                            Import Excel
                        </Button>
                    </label>
                </Box>
            </Box>
            <Box sx={{ flex: 1, flexDirection: 'column', mb: 2 }}>
                <Typography><h3>Tìm kiếm</h3></Typography>
                <Box sx={{ display: 'flex', gap: 4 }}>
                    <TextField fullWidth size="small" value={value}
                        placeholder='Tìm kiếm theo tên, mã thẻ lương cán bộ, nhân viên'
                        onChange={(e) => setValue(e.target.value)}>
                    </TextField>
                    {user?.role !== 'manager' && <Autocomplete
                        fullWidth
                        size='small'
                        options={departments}
                        getOptionLabel={(option: Department) =>
                            option.code || ''
                        }
                        onChange={(event, newValue) => {
                            setDepartment(newValue?._id || '')
                        }}
                        PopperComponent={StyledPopper}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Tìm kiếm theo đơn vị"
                            />
                        )}
                    />}
                </Box>
            </Box>
            <Accordion expanded={expanded} onChange={handleChangeAction}>
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                    >
                        Thêm người dùng
                    </Button>
                </AccordionSummary>
                <AccordionDetails>
                    <DialogTitle>
                        {selectedUser ? 'Sửa người dùng' : 'Thêm người dùng'}
                    </DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    id="username"
                                    name="username"
                                    label="Tên đăng nhập"
                                    value={formik.values.username}
                                    onChange={formik.handleChange}
                                    error={formik.touched.username && Boolean(formik.errors.username)}
                                    helperText={formik.touched.username && formik.errors.username}
                                />
                                {!selectedUser && <TextField
                                    fullWidth
                                    id="password"
                                    name="password"
                                    label="Mật khẩu"
                                    type={showPassword ? 'text' : 'password'}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={handleTogglePassword} edge="end">
                                                    {showPassword ? <Visibility /> : <VisibilityOff />}                                            </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    error={formik.touched.password && Boolean(formik.errors.password)}
                                    helperText={formik.touched.password && formik.errors.password}
                                />}
                                <TextField
                                    fullWidth
                                    id="fullName"
                                    name="fullName"
                                    label="Họ tên"
                                    value={formik.values.fullName}
                                    onChange={formik.handleChange}
                                    error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                                    helperText={formik.touched.fullName && formik.errors.fullName}
                                />
                                <TextField
                                    fullWidth
                                    select
                                    id="gender"
                                    name="gender"
                                    label="Giới tính"
                                    value={formik.values.gender}
                                    onChange={formik.handleChange}
                                    error={formik.touched.gender && Boolean(formik.errors.gender)}
                                    helperText={formik.touched.gender && formik.errors.gender}
                                >
                                    <MenuItem value="Nam">Nam</MenuItem>
                                    <MenuItem value="Nữ">Nữ</MenuItem>
                                </TextField>
                                <TextField
                                    fullWidth
                                    id="salaryCode"
                                    name="salaryCode"
                                    label="Mã thẻ lương"
                                    value={formik.values.salaryCode}
                                    onChange={formik.handleChange}
                                    error={formik.touched.salaryCode && Boolean(formik.errors.salaryCode)}
                                    helperText={formik.touched.salaryCode && formik.errors.salaryCode}
                                />
                                <TextField
                                    fullWidth
                                    id="email"
                                    name="email"
                                    label="Email"
                                    value={formik.values.email || ''}
                                    onChange={formik.handleChange}
                                    error={formik.touched.email && Boolean(formik.errors.email)}
                                    helperText={formik.touched.email && formik.errors.email}
                                />
                                <TextField
                                    fullWidth
                                    id="phone"
                                    name="phone"
                                    label="Số điện thoại"
                                    value={formik.values.phone || ''}
                                    onChange={formik.handleChange}
                                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                                    helperText={formik.touched.phone && formik.errors.phone}
                                />
                                <TextField
                                    fullWidth
                                    select
                                    id="position"
                                    name="position"
                                    label="Chức danh, nghề nghiệp"
                                    SelectProps={{
                                        displayEmpty: true,
                                        MenuProps: {
                                            style: {
                                                maxHeight: 300
                                            }
                                        }
                                    }}
                                    value={formik.values.position || ''}
                                    onChange={formik.handleChange}
                                    error={formik.touched.position && Boolean(formik.errors.position)}
                                    helperText={formik.touched.position && formik.errors.position}
                                >
                                    {positions.map((position: any) => (
                                        <MenuItem key={position._id} value={position._id}>{position.name}</MenuItem>
                                    ))}
                                </TextField>
                                <Autocomplete
                                    fullWidth
                                    options={departments}
                                    getOptionLabel={(option: Department) =>
                                        option.name || ''
                                    }
                                    value={departments.find((p: any) => p._id === (user?.role === 'manager?' ? user?.department?._id : formik.values.department)) || null}
                                    onChange={(event, newValue) => {
                                        formik.setFieldValue('department', newValue?._id || '');
                                    }}
                                    readOnly={user?.role === 'manager'}
                                    PopperComponent={StyledPopper}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Đơn vị"
                                        />
                                    )}
                                />
                                <TextField
                                    fullWidth
                                    select
                                    id="role"
                                    name="role"
                                    label="Phân quyền"
                                    SelectProps={{
                                        displayEmpty: true,
                                        MenuProps: {
                                            style: {
                                                maxHeight: 300
                                            }
                                        }
                                    }}
                                    value={formik.values.role || ''}
                                    onChange={formik.handleChange}
                                    error={formik.touched.role && Boolean(formik.errors.role)}
                                    helperText={formik.touched.role && formik.errors.role}
                                >
                                    <MenuItem value="admin">Quản trị hệ thống</MenuItem>
                                    <MenuItem value="dispatcher">Điều hành sản xuất</MenuItem>
                                    <MenuItem value="manager">Quản lý</MenuItem>
                                    <MenuItem value="employee">Nhân viên</MenuItem>
                                </TextField>

                                <Grid container spacing={2}>
                                    <Grid item>{renderImageUploadBox('avatar', avatar)}</Grid>
                                </Grid>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Hủy</Button>
                        <Button onClick={() => formik.handleSubmit()} variant="contained">
                            {selectedUser ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </AccordionDetails>
            </Accordion>
            <Paper sx={{ width: '100%', overflowX: 'auto' }}>
                <Typography variant="h3" sx={{ p: 2 }}>
                    Bảng người dùng
                </Typography>
                <DataGrid
                    rows={users}
                    columns={userColumns}
                    getRowId={(row) => row._id}
                    rowsPerPageOptions={[10, 20, 50]}
                    autoHeight
                    initialState={{
                        pagination: {
                            pageSize: 10,
                        },
                    }}
                    loading={isLoading}
                    sx={{
                        '& .MuiDataGrid-cell': {
                            border: '1px solid black',

                        },
                        '& .MuiDataGrid-columnHeader': {
                            border: '1px solid black',
                            backgroundColor: '#f5f5f5',

                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                            width: '100%',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                    }}
                />
            </Paper>

            <UserHistories open={history} setOpen={setHistory} initialValues={selectedUser} />
        </Box>
    );
};

export default Users; 