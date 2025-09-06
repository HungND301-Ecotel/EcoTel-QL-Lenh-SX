import React, { Dispatch, SetStateAction, useState } from 'react';
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
    InputAdornment,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    VisibilityOff,
    Visibility,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../../config/api.config';
import { showErrorAlert, showSuccessAlert } from '../Alert';
const validationSchema = yup.object({
    old_pass: yup.string().required('Vui lòng nhập mật khẩu cũ'),
    newpass: yup.string().required('Vui lòng nhập mật khẩu mới'),
    repass: yup.string().required('Vui lòng nhập lại mật khẩu'),

});

const ChangePassword: React.FC<{ open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }> = ({ open, setOpen }) => {

    const queryClient = useQueryClient();
    const [showPassword, setShowPassword] = useState(false);

    const handleTogglePassword = () => {
        setShowPassword((prev) => !prev);
    };


    const updateMutation = useMutation({
        mutationFn: (changepass: Partial<any>) =>
            api.put(`/users/changepass`, changepass).then(res => res.data),
        onSuccess: () => {
            showSuccessAlert('Đổi mật khẩu thành công. Vui lòng đăng nhập lại!');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            handleClose();
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'Lỗi')
        }
    });

    const formik = useFormik({
        initialValues: {
            old_pass: '',
            newpass: '',
            repass: ''
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            updateMutation.mutate(values);
        },
    });

    const handleClose = () => {
        setOpen(false)
        formik.resetForm();
    };

    return (
        <Box>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>Đổi mật khẩu</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                id="old_pass"
                                name="old_pass"
                                label="Mật khẩu cũ"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleTogglePassword} edge="end">
                                                {showPassword ? <Visibility /> : <VisibilityOff />}                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                value={formik.values.old_pass}
                                onChange={formik.handleChange}
                                error={formik.touched.old_pass && Boolean(formik.errors.old_pass)}
                                helperText={formik.touched.old_pass && formik.errors.old_pass}
                            />
                            <TextField
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                id="newpass"
                                name="newpass"
                                label="Mật khẩu mới"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleTogglePassword} edge="end">
                                                {showPassword ? <Visibility /> : <VisibilityOff />}                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                value={formik.values.newpass}
                                onChange={formik.handleChange}
                                error={formik.touched.newpass && Boolean(formik.errors.newpass)}
                                helperText={formik.touched.newpass && formik.errors.newpass}
                            />
                            <TextField
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                id="repass"
                                name="repass"
                                label="Nhập lại mật khẩu"
                                value={formik.values.repass}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleTogglePassword} edge="end">
                                                {showPassword ? <Visibility /> : <VisibilityOff />}                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                onChange={formik.handleChange}
                                error={formik.touched.repass && Boolean(formik.errors.repass)}
                                helperText={formik.touched.repass && formik.errors.repass}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={() => formik.submitForm()} variant="contained">
                        Cập nhật
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ChangePassword;
