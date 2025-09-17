import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import Login from './pages/auth/Login';
import Orders from './pages/orders/Orders';
import Devices from './pages/vehicles/Vehicles';
import Departments from './pages/departments/Departments';
import Reports from './pages/reports/Reports';
import Notifications from './pages/notifications/Notifications';
import Users from './pages/users/Users';
import Materials from './pages/materials/Materials';
import Locations from './pages/locations/Locations';
import Jobs from './pages/job/Job';
import Positions from './pages/positions/Positions';
import socketService from './services/socketService';
import api from './config/api.config';
import { userAtom } from './atoms/userAtoms';
import { useAtom } from 'jotai'
import DeviceTypes from './pages/deviceTypes/DeviceTypes';
import ManagerDashboard from './pages/dashboard/ManagerDashboard';
import DispatcherOrders from './pages/dispatcherOrder/DispatcherOrders';
import SafetyMeasures from './pages/safetyMeasures/SafetyMeasures';
import Machines from './pages/machine/Machine';
import Shifts from './pages/shift/Shifts';
import OrderByUsers from './pages/orders/OrderByUser';
import './index.css'
import { useSocket } from './hooks/useSocket';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import TravelLogs from './pages/TravelLog/TravelLog';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import MainLayout from './components/layout/MainLayout';


interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const token = localStorage.getItem('token');
    const [user] = useAtom(userAtom);
    if (!token) {
        return <Navigate to="/login" />;
    }
    return <MainLayout>{children}</MainLayout>;
};

const App = () => {
    const token = localStorage.getItem('token');
    const [user, setUser] = useAtom(userAtom)
    const queryClient = useQueryClient();
    const socket = useSocket();

    const { data, isLoading } = useQuery({
        queryKey: ['user', token],
        queryFn: () => api.get(`/auth/me`).then(res => res.data.data.user),
        enabled: !!token,
    })

    useEffect(() => {
        if (data) {
            setUser(data)
        }
    }, [data])

    useEffect(() => {
        // Lắng nghe notification từ socket
        socketService.onNotification((data) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orderByUser'] });
            queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['machines'] });
        });

        // Cleanup khi component unmount
        return () => {
            socketService.offNotification();
        };
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/privacy_policy" element={<PrivacyPolicy />} />
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            {user?.role === "admin" ? <AdminDashboard /> : <ManagerDashboard />}
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/orders"
                    element={
                        <PrivateRoute>
                            {user?.role === "dispatcher" ? <DispatcherOrders /> : <Orders />}
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/orderByUsers"
                    element={
                        <PrivateRoute>
                            <OrderByUsers />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/safetyMeasures"
                    element={
                        <PrivateRoute>
                            <SafetyMeasures />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/deviceTypes"
                    element={
                        <PrivateRoute>
                            <DeviceTypes />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/vehicles"
                    element={
                        <PrivateRoute>
                            <Devices />
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
                    path="/machines"
                    element={
                        <PrivateRoute>
                            <Machines />
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
                    path="/jobs"
                    element={
                        <PrivateRoute>
                            <Jobs />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/positions"
                    element={
                        <PrivateRoute>
                            <Positions />
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
                <Route
                    path="/travelLog"
                    element={
                        <PrivateRoute>
                            <TravelLogs />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

export default App; 