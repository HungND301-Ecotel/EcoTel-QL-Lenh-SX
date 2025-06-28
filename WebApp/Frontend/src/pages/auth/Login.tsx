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
    InputAdornment,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, VisibilityOff, Visibility } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';

const loginValidationSchema = yup.object({
    username: yup.string().required('Vui lòng nhập tên đăng nhập'),
    password: yup.string().required('Vui lòng nhập mật khẩu'),
});


const Login = () => {
    const navigate = useNavigate();
    const [openRegister, setOpenRegister] = useState(false);
    const [, setUser] = useAtom(userAtom)
    const queryClient = useQueryClient();
    const [showPassword, setShowPassword] = useState(false);

    const handleTogglePassword = () => {
        setShowPassword((prev) => !prev);
    };
    const loginMutation = useMutation({
        mutationFn: (credentials: { username: string; password: string }) =>
            api.post('/auth/login', credentials).then(res => res.data),
        onSuccess: (data) => {
            localStorage.setItem('token', data.data.token);
            setUser(data.data.user)
            if (data.data.user?.role === 'staff') {
                alert('Bạn không có quyền truy cập hệ thống.');
                return;
            }
            navigate('/');
        },
        onError: (error: any) => {
            alert(error.response.data.message || error.response || 'Đăng nhập thất bại')
        }
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
                            type={showPassword ? 'text' : 'password'}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleTogglePassword} edge="end">
                                            {showPassword ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
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
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login; 