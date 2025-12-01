import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    Container,
    Paper,
    IconButton,
    InputAdornment,
    Tabs,
    Tab,
} from '@mui/material';

import ResetPassword from './ResetPassword';
import FormLogin from './FormLogin';



const Login = () => {

    const [tab, setTab] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

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
                                xl: 48,
                                lg: 28,
                                md: 24,
                                sm: 20,
                                xs: 14
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
                            <Box sx={{ width: '100%', typography: 'body1' }}>
                                <Tabs
                                    value={tab}
                                    onChange={handleChange}
                                    aria-label="wrapped label tabs example"
                                    variant="fullWidth"
                                >
                                    <Tab value={0} label={<b style={{ fontSize: 17 }}>Đăng nhập</b>} />
                                    <Tab value={1} label={<b style={{ fontSize: 17 }}>Quên mật khẩu</b>} />
                                </Tabs>
                            </Box>
                            {tab === 0 && <FormLogin />}
                            {tab === 1 && <ResetPassword />}
                        </Paper>
                    </Box>
                </Container >
            </Box >
            <Typography alignSelf={"flex-start"} padding={2} color="white">quanlyvadieuphoimaymocthietbi-Version: release_2.0.2</Typography>
        </Box >
    );
};

export default Login; 