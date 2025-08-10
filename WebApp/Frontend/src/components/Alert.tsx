import Swal from 'sweetalert2';

export const showSuccessAlert = (message = 'Bạn đã lưu thành công.') => {
    return Swal.fire({
        title: 'Thành công!',
        text: message,
        icon: 'success',
        confirmButtonText: 'Đồng ý',
        timer: 2000,
        timerProgressBar: true, 
        showConfirmButton: false,
    });
};

export const showErrorAlert = (message = 'Đã xảy ra lỗi.') => {
    return Swal.fire({
        title: 'Lỗi!',
        text: message,
        icon: 'error',
        confirmButtonText: 'Đóng',
        timer: 2000,
        timerProgressBar: true, 
        showConfirmButton: false,
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
