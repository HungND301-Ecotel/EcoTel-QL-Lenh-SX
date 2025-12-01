import { Box, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import { useFormik } from 'formik';
import { useAtom } from 'jotai';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { userAtom } from '../../atoms/userAtoms';
import { showErrorAlert } from '../../components/Alert';
import { useMutation } from '@tanstack/react-query';
import api from '../../config/api.config';
import { RoleEnum } from '../../enums';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const loginValidationSchema = yup.object({
    username: yup.string().required('Vui lòng nhập tên đăng nhập'),
    password: yup.string().required('Vui lòng nhập mật khẩu'),
});
export default function FormLogin() {
    const navigate = useNavigate();
    const [, setUser] = useAtom(userAtom)
    const [showPassword, setShowPassword] = useState(false);

    const handleTogglePassword = () => {
        setShowPassword((prev) => !prev);
    };
    const loginMutation = useMutation({
        mutationFn: (credentials: { username: string; password: string }) =>
            api.post('/auth/login', credentials).then(res => res.data),
        onSuccess: (data) => {
            if (data.data.user?.role.toLowerCase() === RoleEnum.EMPLOYEE) {
                showErrorAlert('Bạn không có quyền truy cập hệ thống.');
                return;
            }
            localStorage.setItem('token', data.data.token);
            setUser(data.data.user)
            console.log(data.data.user)
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
        <Box component="form" onSubmit={loginFormik.handleSubmit} sx={{ mt: 1 }}>
            <TextField
                margin="normal"
                fullWidth
                id="username"
                name="username"
                label="Tên đăng nhập"
                size='small'
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
                size='small'
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
    )
}
