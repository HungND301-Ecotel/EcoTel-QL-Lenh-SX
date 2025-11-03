import { useQuery } from '@tanstack/react-query';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import api from '../config/api.config';

interface Props {
    type: 'avatar' | 'signature';
    currentKey: string;
    onClear: () => void;
    onUpload: (file: File, type: 'avatar' | 'signature') => void;
}

const ImageUploadBox = ({ type, currentKey, onClear, onUpload }: Props) => {
    const { data: signedUrl } = useQuery({
        queryKey: ['signedUrl', currentKey],
        queryFn: async () => {
            const res = await api.get(`/uploads/get?key=${currentKey}`);
            return res.data.data as string;
        },
        enabled: !!currentKey, // chỉ fetch khi có key
    });

    return (
        <Box sx={{ position: 'relative', width: 200, height: 200 }}>
            {currentKey && (
                <IconButton
                    onClick={onClear}
                    sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1000 }}
                >
                    <Close />
                </IconButton>
            )}
            <Button
                component="label"
                sx={{
                    width: '100%',
                    height: '100%',
                    border: '1px solid grey',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}
            >
                {!currentKey && (
                    <Typography>Thêm {type === 'avatar' ? 'ảnh' : 'chữ ký'}</Typography>
                )}
                <img
                    src={currentKey ? signedUrl ?? '/image/loading.gif' : '/image/camera.png'}
                    width={currentKey ? 200 : 30}
                    alt={type}
                />
                <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUpload(file, type);
                        e.target.value = '';
                    }}
                />
            </Button>
        </Box>
    );
};

export default ImageUploadBox;
