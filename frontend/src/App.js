import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

// Components
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Attendance from './components/attendance/Attendance';
import Tasks from './components/tasks/Tasks';
import Users from './components/users/Users';
import Reports from './components/reports/Reports';
import Profile from './components/profile/Profile';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return ( <
            div className = "min-h-screen flex items-center justify-center" >
            <
            div className = "animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600" > < /div> <
            /div>
        );
    }

    if (!user) {
        return ( <
            Routes >
            <
            Route path = "/login"
            element = { < Login / > }
            /> <
            Route path = "*"
            element = { < Navigate to = "/login"
                replace / > }
            /> <
            /Routes>
        );
    }

    return ( <
            Layout >
            <
            Routes >
            <
            Route path = "/"
            element = { < Navigate to = "/dashboard"
                replace / > }
            /> <
            Route path = "/dashboard"
            element = { < ProtectedRoute > < Dashboard / > < /ProtectedRoute>} / >
                <
                Route path = "/attendance"
                element = { < ProtectedRoute > < Attendance / > < /ProtectedRoute>} / >
                    <
                    Route path = "/tasks"
                    element = { < ProtectedRoute > < Tasks / > < /ProtectedRoute>} / >
                        <
                        Route path = "/users"
                        element = { < ProtectedRoute roles = {
                                ['admin', 'manager'] } > < Users / > < /ProtectedRoute>} / >
                            <
                            Route path = "/reports"
                            element = { < ProtectedRoute roles = {
                                    ['admin', 'manager'] } > < Reports / > < /ProtectedRoute>} / >
                                <
                                Route path = "/profile"
                                element = { < ProtectedRoute > < Profile / > < /ProtectedRoute>} / >
                                    <
                                    Route path = "/login"
                                    element = { < Navigate to = "/dashboard"
                                        replace / > }
                                    /> <
                                    Route path = "*"
                                    element = { < Navigate to = "/dashboard"
                                        replace / > }
                                    /> <
                                    /Routes> <
                                    /Layout>
                                );
                            }

                            function App() {
                                return ( <
                                    QueryClientProvider client = { queryClient } >
                                    <
                                    AuthProvider >
                                    <
                                    Router >
                                    <
                                    div className = "App" >
                                    <
                                    AppRoutes / >
                                    <
                                    Toaster position = "top-right"
                                    toastOptions = {
                                        {
                                            duration: 4000,
                                            style: {
                                                background: '#363636',
                                                color: '#fff',
                                            },
                                            success: {
                                                duration: 3000,
                                                iconTheme: {
                                                    primary: '#10B981',
                                                    secondary: '#fff',
                                                },
                                            },
                                            error: {
                                                duration: 5000,
                                                iconTheme: {
                                                    primary: '#EF4444',
                                                    secondary: '#fff',
                                                },
                                            },
                                        }
                                    }
                                    /> <
                                    /div> <
                                    /Router> <
                                    /AuthProvider> <
                                    /QueryClientProvider>
                                );
                            }

                            export default App;