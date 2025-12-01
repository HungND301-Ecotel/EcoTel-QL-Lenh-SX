import { Box, Button, Container, Grid, Paper, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import * as yup from 'yup';
import { showErrorAlert, showSuccessAlert } from '../../components/Alert';
import { useMutation } from '@tanstack/react-query';
import api from '../../config/api.config';


export default function ResetPassword() {
    const [isCheck, setIsCheck] = useState(false)
    const [email, setEmail] = useState('')

    const forgotPasswordMutation = useMutation({
        mutationFn: () =>
            api.post('/users/forgot_password', { email: email }).then(res => res.data),
        onMutate: () => {
            setIsCheck(true)
        },
        onSuccess: (data) => {
            showSuccessAlert(`Đã nhận yêu cầu cấp mật khẩu mới tới ${email}. Vui lòng kiểm tra hòm thư.`)
            setIsCheck(false)
        },
        onError: (error: any) => {
            showErrorAlert(error.response.data.message || error.message || 'VUi lòng thử lại')
            setIsCheck(false)
        }
    });
    return (
        <Box component="form" sx={{ mt: 1 }}>
            <TextField
                margin="normal"
                fullWidth
                id="email"
                name="email"
                label="Nhập email"
                size='small'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isCheck}
                onClick={() => forgotPasswordMutation.mutate()}
            >
                {isCheck ? 'Đang gửi...' : 'Gửi mật khẩu mới'}
            </Button>
        </Box>
    )
}
