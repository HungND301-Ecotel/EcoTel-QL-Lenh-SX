import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  IconButton,
  InputAdornment,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { VisibilityOff, Visibility } from "@mui/icons-material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import api from "../../config/api.config";
import { useAtom } from "jotai";
import { userAtom } from "../../atoms/userAtoms";
import { showErrorAlert } from "../../components/Alert";
import { RoleEnum } from "../../enums";
import { decodeJwt } from "../../utils/auth";
import { tokenService } from "../../auth/tokenService";

const loginValidationSchema = yup.object({
  username: yup.string().required("Vui lòng nhập tên đăng nhập"),
  password: yup.string().required("Vui lòng nhập mật khẩu"),
});

const Login = () => {
  const navigate = useNavigate();
  const [, setUser] = useAtom(userAtom);
  const [showPassword, setShowPassword] = useState(false);
  const [exchanging, setExchanging] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      if (tokenService.isValid()) {
        navigate("/");
      }
      return;
    }

    setExchanging(true);

    params.delete("code");
    const cleanSearch = params.toString();
    const cleanPath =
      window.location.pathname +
      (cleanSearch ? `?${cleanSearch}` : "") +
      window.location.hash;
    window.history.replaceState({}, document.title, cleanPath);

    api
      .post("/auth/exchange-code", { code })
      .then((res) => {
        const { appToken, refreshToken } = res.data;
        const payload = decodeJwt(appToken);
        if (payload) {
          tokenService.saveTokens(appToken, refreshToken);
          const userData = {
            _id: payload.userId || payload.sub,
            username: payload.username || payload.sub,
            email: payload.email || "",
            fullName: payload.fullName || payload.sub,
            role: payload.role || "manager",
            isPortal: true,
          };
          setUser(userData);
          navigate("/");
        } else {
          throw new Error("Token từ portal không hợp lệ");
        }
      })
      .catch((err) => {
        console.error("Lỗi exchange code:", err);
        showErrorAlert(
          err.response?.data?.message ||
            "Xác thực qua Portal thất bại hoặc mã code đã hết hạn.",
        );
      })
      .finally(() => {
        setExchanging(false);
      });
  }, [setUser, navigate]);

  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      api.post("/auth/login", credentials).then((res) => res.data),
    onSuccess: (data) => {
      const user = data.data.user;
      const role = user?.role?.toString().toLowerCase();
      if (role === RoleEnum.EMPLOYEE) {
        showErrorAlert("Bạn không có quyền truy cập hệ thống.");
        return;
      }
      tokenService.save(data.data.token, data.data.refreshToken || "", "local");
      setUser(user);
      navigate("/");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response.data.message || error.message || "Đăng nhập thất bại",
      );
    },
  });

  const loginFormik = useFormik({
    initialValues: {
      username: "",
      password: "",
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
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column", // Ensures children stack vertically (title then content)
        // alignItems: 'center', // This is still good for overall horizontal centering
        justifyContent: "flex-start", // Start content from the top
        minHeight: "100vh",
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
        <Box
          display="flex"
          justifyContent="center"
          alignItems={"center"}
          gap={2}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                fontSize: {
                  xl: 48,
                  lg: 28,
                  md: 24,
                  sm: 20,
                  xs: 14,
                },
              }}
              textAlign={"center"}
            >
              HỆ THỐNG QUẢN LÝ ĐIỀU PHỐI VÀ SỬ DỤNG MÁY MÓC THIẾT BỊ
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* New wrapper Box for vertical centering the login form */}
      <Box
        sx={{
          flexGrow: 1, // Allows this Box to consume the remaining vertical space
          display: "flex",
          alignItems: "center", // Centers the child (Container maxWidth="xs") vertically
          justifyContent: "center", // Centers the child (Container maxWidth="xs") horizontally
          p: 2, // Optional: padding for a little space around the login form
        }}
      >
        {/* The login form container (maxWidth="xs") is now the element being centered */}
        <Container component="main" maxWidth="xs">
          <Box
            sx={{
              // Removed marginTop: 4 (no longer needed for vertical centering)
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <img src="/image/logo.png" style={{ width: 150, height: 150 }} />
              <Typography
                component="h1"
                variant="h5"
                align="center"
                gutterBottom
              >
                Đăng nhập
              </Typography>
              <Box
                component="form"
                onSubmit={loginFormik.handleSubmit}
                sx={{ mt: 1 }}
              >
                <TextField
                  margin="normal"
                  fullWidth
                  id="username"
                  name="username"
                  label="Tên đăng nhập"
                  value={loginFormik.values.username}
                  onChange={loginFormik.handleChange}
                  error={
                    loginFormik.touched.username &&
                    Boolean(loginFormik.errors.username)
                  }
                  helperText={
                    loginFormik.touched.username && loginFormik.errors.username
                  }
                />
                <TextField
                  margin="normal"
                  fullWidth
                  id="password"
                  name="password"
                  label="Mật khẩu"
                  type={showPassword ? "text" : "password"}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleTogglePassword} edge="end">
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  value={loginFormik.values.password}
                  onChange={loginFormik.handleChange}
                  error={
                    loginFormik.touched.password &&
                    Boolean(loginFormik.errors.password)
                  }
                  helperText={
                    loginFormik.touched.password && loginFormik.errors.password
                  }
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 1.5 }}
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
                <Box
                  display="flex"
                  alignItems="center"
                  width="100%"
                  sx={{ my: 1 }}
                >
                  <Box flex={1} height="1px" bgcolor="#e0e0e0" />
                  <Typography
                    variant="body2"
                    sx={{ mx: 2, color: "text.secondary" }}
                  >
                    Hoặc
                  </Typography>
                  <Box flex={1} height="1px" bgcolor="#e0e0e0" />
                </Box>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    py: 1,
                    borderColor: "#035bb4ff",
                    color: "#035bb4ff",
                    fontWeight: "bold",
                    "&:hover": {
                      borderColor: "#024282ff",
                      background: "rgba(3, 91, 180, 0.04)",
                    },
                  }}
                  onClick={() => {
                    const portalUrl =
                      import.meta.env.VITE_PORTAL_URL ||
                      "http://localhost:8080";
                    window.location.href = `${portalUrl}?redirect=sx`;
                  }}
                >
                  Đăng nhập qua Portal
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>
      <Typography alignSelf={"flex-start"} padding={2} color="white">
        quanlyvadieuphoimaymocthietbi-Version: release_2.0.2
      </Typography>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={exchanging}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ color: "#fff" }}>
            Đang xác thực thông tin với Portal...
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default Login;
