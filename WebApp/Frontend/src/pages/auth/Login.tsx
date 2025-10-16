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
    Avatar,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, VisibilityOff, Visibility } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/api.config';
import { useAtom } from 'jotai';
import { userAtom } from '../../atoms/userAtoms';
import { showErrorAlert } from '../../components/Alert';

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
            if (data.data.user?.role.toLowerCase() === 'employee') {
                showErrorAlert('Bạn không có quyền truy cập hệ thống.');
                return;
            }
            localStorage.setItem('token', data.data.token);
            setUser(data.data.user)
            navigate('/');
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Đăng nhập thất bại')
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
        <Box
            sx={{
                backgroundImage: 'url("/image/background.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                flexDirection: 'column', // Ensures children stack vertically (title then content)
                // alignItems: 'center', // This is still good for overall horizontal centering
                justifyContent: 'flex-start', // Start content from the top
                minHeight: '100vh',
            }}
        >
            <Box
                sx={{
                    background: "#035bb4ff", // màu xanh giống ảnh
                    color: "white",
                    py: 2,
                    px: 3,
                }}
            >
                <Box display="flex" justifyContent='center' alignItems={'center'} gap={2}>
                    <Box>
                        <Typography variant="h6" sx={{
                            fontWeight: "bold",
                            fontSize: {
                                xl: 66,
                                lg: 48,
                                md: 30,
                                xs: 18
                            },
                        }} textAlign={'center'}>HỆ THỐNG QUẢN LÝ ĐIỀU PHỐI VÀ SỬ DỤNG MÁY MÓC THIẾT BỊ</Typography>
                    </Box>
                </Box>
            </Box>

            {/* New wrapper Box for vertical centering the login form */}
            < Box
                sx={{
                    flexGrow: 1, // Allows this Box to consume the remaining vertical space
                    display: 'flex',
                    alignItems: 'center', // Centers the child (Container maxWidth="xs") vertically
                    justifyContent: 'center', // Centers the child (Container maxWidth="xs") horizontally
                    p: 2, // Optional: padding for a little space around the login form
                }}
            >
                {/* The login form container (maxWidth="xs") is now the element being centered */}
                < Container component="main" maxWidth="xs" >
                    <Box
                        sx={{
                            // Removed marginTop: 4 (no longer needed for vertical centering)
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Paper elevation={3} sx={{ p: 4, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <img src="/image/logo.png" style={{ width: 150, height: 150, }} />
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
                </Container >
            </Box >
            <Typography alignSelf={"flex-start"} padding={2} color="white">quanlyvadieuphoimaymocthietbi-Version: release_1.0.10</Typography>
        </Box >
    );
};

export default Login; 