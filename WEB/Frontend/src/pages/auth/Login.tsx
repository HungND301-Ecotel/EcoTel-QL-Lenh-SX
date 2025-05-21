import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    Container,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';

const loginValidationSchema = yup.object({
    username: yup.string().required('Vui lòng nhập tên đăng nhập'),
    password: yup.string().required('Vui lòng nhập mật khẩu'),
});

const registerValidationSchema = yup.object({
    username: yup.string().required('Vui lòng nhập tên đăng nhập'),
    password: yup.string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .required('Vui lòng nhập mật khẩu'),
    email: yup.string()
        .email('Email không hợp lệ')
        .required('Vui lòng nhập email'),
    fullName: yup.string().required('Vui lòng nhập họ tên'),
    role: yup.string().required('Vui lòng chọn vai trò'),
});

const userRoles = [
    { value: 'admin', label: 'Quản trị viên' },
    { value: 'manager', label: 'Quản lý' },
    { value: 'employee', label: 'Nhân viên' },
];

const departmentValidationSchema = yup.object({
    name: yup.string().required('Vui lòng nhập tên phòng ban'),
    code: yup.string().required('Vui lòng nhập mã phòng ban'),
    description: yup.string(),
    manager: yup.string(),
});

const Login = () => {
    const navigate = useNavigate();
    const [openRegister, setOpenRegister] = useState(false);
    const queryClient = useQueryClient();

    const loginMutation = useMutation({
        mutationFn: (credentials: { username: string; password: string }) =>
            api.post('/auth/login', credentials).then(res => res.data),
        onSuccess: (data) => {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            navigate('/dashboard');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Đăng nhập thất bại');
        },
    });

    const registerMutation = useMutation({
        mutationFn: (userData: any) =>
            api.post('/auth/register', userData).then(res => res.data),
        onSuccess: () => {
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            setOpenRegister(false);
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Đăng ký thất bại');
        },
    });

    const loginFormik = useFormik({
        initialValues: {
            username: '',
            password: '',
        },
        validationSchema: loginValidationSchema,
        onSubmit: (values) => {
            loginMutation.mutate(values);
        },
    });

    const registerFormik = useFormik({
        initialValues: {
            username: '',
            password: '',
            email: '',
            fullName: '',
            role: '',
        },
        validationSchema: registerValidationSchema,
        onSubmit: (values) => {
            registerMutation.mutate(values);
        },
    });

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        Đăng nhập
                    </Typography>
                    <Box component="form" onSubmit={loginFormik.handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            fullWidth
                            id="username"
                            name="username"
                            label="Tên đăng nhập"
                            value={loginFormik.values.username}
                            onChange={loginFormik.handleChange}
                            error={loginFormik.touched.username && Boolean(loginFormik.errors.username)}
                            helperText={loginFormik.touched.username && loginFormik.errors.username}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="password"
                            name="password"
                            label="Mật khẩu"
                            type="password"
                            value={loginFormik.values.password}
                            onChange={loginFormik.handleChange}
                            error={loginFormik.touched.password && Boolean(loginFormik.errors.password)}
                            helperText={loginFormik.touched.password && loginFormik.errors.password}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setOpenRegister(true)}
                        >
                            Đăng ký tài khoản mới
                        </Button>
                    </Box>
                </Paper>
            </Box>

            <Dialog open={openRegister} onClose={() => setOpenRegister(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Đăng ký tài khoản</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={registerFormik.handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            id="username"
                            name="username"
                            label="Tên đăng nhập"
                            value={registerFormik.values.username}
                            onChange={registerFormik.handleChange}
                            error={registerFormik.touched.username && Boolean(registerFormik.errors.username)}
                            helperText={registerFormik.touched.username && registerFormik.errors.username}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            id="password"
                            name="password"
                            label="Mật khẩu"
                            type="password"
                            value={registerFormik.values.password}
                            onChange={registerFormik.handleChange}
                            error={registerFormik.touched.password && Boolean(registerFormik.errors.password)}
                            helperText={registerFormik.touched.password && registerFormik.errors.password}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            id="email"
                            name="email"
                            label="Email"
                            type="email"
                            value={registerFormik.values.email}
                            onChange={registerFormik.handleChange}
                            error={registerFormik.touched.email && Boolean(registerFormik.errors.email)}
                            helperText={registerFormik.touched.email && registerFormik.errors.email}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            id="fullName"
                            name="fullName"
                            label="Họ tên"
                            value={registerFormik.values.fullName}
                            onChange={registerFormik.handleChange}
                            error={registerFormik.touched.fullName && Boolean(registerFormik.errors.fullName)}
                            helperText={registerFormik.touched.fullName && registerFormik.errors.fullName}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            select
                            id="role"
                            name="role"
                            label="Vai trò"
                            value={registerFormik.values.role}
                            onChange={registerFormik.handleChange}
                            error={registerFormik.touched.role && Boolean(registerFormik.errors.role)}
                            helperText={registerFormik.touched.role && registerFormik.errors.role}
                        >
                            {userRoles.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRegister(false)}>Hủy</Button>
                    <Button onClick={() => registerFormik.handleSubmit()} variant="contained">
                        {registerMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Login; 