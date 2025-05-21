import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Orders from './pages/orders/Orders';
import Devices from './pages/devices/Devices';
import Shifts from './pages/shifts/Shifts';
import Departments from './pages/departments/Departments';
import Reports from './pages/reports/Reports';
import Notifications from './pages/notifications/Notifications';
import Users from './pages/users/Users';
import Materials from './pages/materials/Materials';
import Locations from './pages/locations/Locations';

const queryClient = new QueryClient();

interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" />;
    }
    return <MainLayout>{children}</MainLayout>;
};

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/orders"
                        element={
                            <PrivateRoute>
                                <Orders />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/devices"
                        element={
                            <PrivateRoute>
                                <Devices />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/materials"
                        element={
                            <PrivateRoute>
                                <Materials />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/locations"
                        element={
                            <PrivateRoute>
                                <Locations />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/shifts"
                        element={
                            <PrivateRoute>
                                <Shifts />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/departments"
                        element={
                            <PrivateRoute>
                                <Departments />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/reports"
                        element={
                            <PrivateRoute>
                                <Reports />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/notifications"
                        element={
                            <PrivateRoute>
                                <Notifications />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/users"
                        element={
                            <PrivateRoute>
                                <Users />
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
};

export default App; 