import { Alert, AlertColor, Snackbar } from '@mui/material';
import Swal from 'sweetalert2';

export const showSuccessAlert = (message = 'Bạn đã lưu thành công.') => {
    return Swal.fire({
        title: 'Thành công!',
        text: message,
        icon: 'success',
        confirmButtonText: 'Đồng ý',
        timer: 5000,
        timerProgressBar: true,
        showConfirmButton: true,
    });
};

export const showErrorAlert = (message = 'Đã xảy ra lỗi.') => {
    return Swal.fire({
        title: 'Lỗi!',
        text: message,
        icon: 'error',
        confirmButtonText: 'Đóng',
        timer: 5000,
        timerProgressBar: true,
        showConfirmButton: true,
    });
};

export const showConfirmAlert = (message = 'Bạn có chắc chắn không?') => {
    return Swal.fire({
        title: 'Xác nhận',
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
    });
};

export const AlertSnackbar = ({
    alert,
    setAlert,
}: {
    alert: { open: boolean; message: string; severity?: AlertColor };
    setAlert: React.Dispatch<React.SetStateAction<{ open: boolean; message: string; severity?: AlertColor }>>;
}) => {
    const handleClose = (_: any, reason?: string) => {
        if (reason === 'clickaway') return;
        setAlert((a) => ({ ...a, open: false }));
    };

    return (
        <Snackbar
            open={alert.open}
            onClose={handleClose}
            autoHideDuration={4000}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
            <Alert severity={alert.severity ?? 'success'} variant="filled" onClose={handleClose}>
                {alert.message}
            </Alert>
        </Snackbar>
    );
}