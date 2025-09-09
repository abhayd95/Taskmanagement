import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    Clock,
    CheckSquare,
    Users,
    BarChart3,
    User,
    LogOut,
    Menu,
    X,
    Bell
} from 'lucide-react';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
        { name: 'Attendance', href: '/attendance', icon: Clock, roles: ['admin', 'manager', 'employee'] },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['admin', 'manager', 'employee'] },
        { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'manager'] },
        { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    ];

    const filteredNavigation = navigation.filter(item =>
        item.roles.includes(user ?.role)
    );

    const handleLogout = async() => {
        await logout();
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return ( <
        div className = "h-screen flex overflow-hidden bg-gray-100" > { /* Mobile sidebar */ } <
        div className = { `fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}` } >
        <
        div className = "fixed inset-0 bg-gray-600 bg-opacity-75"
        onClick = {
            () => setSidebarOpen(false)
        }
        /> <
        div className = "relative flex-1 flex flex-col max-w-xs w-full bg-white" >
        <
        div className = "absolute top-0 right-0 -mr-12 pt-2" >
        <
        button type = "button"
        className = "ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
        onClick = {
            () => setSidebarOpen(false)
        } >
        <
        X className = "h-6 w-6 text-white" / >
        <
        /button> < /
        div > <
        SidebarContent navigation = { filteredNavigation }
        isActive = { isActive }
        /> < /
        div > <
        /div>

        { /* Desktop sidebar */ } <
        div className = "hidden md:flex md:flex-shrink-0" >
        <
        div className = "flex flex-col w-64" >
        <
        SidebarContent navigation = { filteredNavigation }
        isActive = { isActive }
        /> < /
        div > <
        /div>

        { /* Main content */ } <
        div className = "flex flex-col w-0 flex-1 overflow-hidden" > { /* Top navigation */ } <
        div className = "relative z-10 flex-shrink-0 flex h-16 bg-white shadow" >
        <
        button type = "button"
        className = "px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick = {
            () => setSidebarOpen(true)
        } >
        <
        Menu className = "h-6 w-6" / >
        <
        /button>

        <
        div className = "flex-1 px-4 flex justify-between" >
        <
        div className = "flex-1 flex" >
        <
        div className = "w-full flex md:ml-0" >
        <
        div className = "relative w-full text-gray-400 focus-within:text-gray-600" >
        <
        div className = "absolute inset-y-0 left-0 flex items-center pointer-events-none" >
        <
        span className = "text-sm font-medium text-gray-900" >
        Welcome back, { user ?.first_name }!
        <
        /span> < /
        div > <
        /div> < /
        div > <
        /div>

        <
        div className = "ml-4 flex items-center md:ml-6" >
        <
        button type = "button"
        className = "bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" >
        <
        Bell className = "h-6 w-6" / >
        <
        /button>

        <
        div className = "ml-3 relative" >
        <
        div className = "flex items-center space-x-3" >
        <
        div className = "flex-shrink-0" >
        <
        div className = "h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center" >
        <
        User className = "h-5 w-5 text-primary-600" / >
        <
        /div> < /
        div > <
        div className = "hidden md:block" >
        <
        div className = "text-sm font-medium text-gray-700" > { user ?.first_name } { user ?.last_name } <
        /div> <
        div className = "text-xs text-gray-500 capitalize" > { user ?.role } <
        /div> < /
        div > <
        /div> < /
        div > <
        /div> < /
        div > <
        /div>

        { /* Page content */ } <
        main className = "flex-1 relative overflow-y-auto focus:outline-none" >
        <
        div className = "py-6" >
        <
        div className = "max-w-7xl mx-auto px-4 sm:px-6 md:px-8" > { children } <
        /div> < /
        div > <
        /main> < /
        div > <
        /div>
    );
};

const SidebarContent = ({ navigation, isActive }) => {
    const { user, logout } = useAuth();

    const handleLogout = async() => {
        await logout();
    };

    return ( <
        div className = "flex flex-col h-0 flex-1 border-r border-gray-200 bg-white" >
        <
        div className = "flex-1 flex flex-col pt-5 pb-4 overflow-y-auto" >
        <
        div className = "flex items-center flex-shrink-0 px-4" >
        <
        h1 className = "text-xl font-bold text-primary-600" > OrbAi < /h1> < /
        div > <
        nav className = "mt-5 flex-1 px-2 space-y-1" > {
            navigation.map((item) => {
                const Icon = item.icon;
                return ( <
                    Link key = { item.name }
                    to = { item.href }
                    className = { `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }` } >
                    <
                    Icon className = { `mr-3 flex-shrink-0 h-6 w-6 ${
                    isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }` }
                    /> { item.name } < /
                    Link >
                );
            })
        } <
        /nav> < /
        div >

        <
        div className = "flex-shrink-0 flex border-t border-gray-200 p-4" >
        <
        div className = "flex items-center" >
        <
        div className = "flex-shrink-0" >
        <
        div className = "h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center" >
        <
        User className = "h-5 w-5 text-primary-600" / >
        <
        /div> < /
        div > <
        div className = "ml-3 flex-1" >
        <
        p className = "text-sm font-medium text-gray-700" > { user ?.first_name } { user ?.last_name } <
        /p> <
        p className = "text-xs text-gray-500 capitalize" > { user ?.role } <
        /p> < /
        div > <
        button onClick = { handleLogout }
        className = "ml-3 flex-shrink-0 text-gray-400 hover:text-gray-500"
        title = "Logout" >
        <
        LogOut className = "h-5 w-5" / >
        <
        /button> < /
        div > <
        /div> < /
        div >
    );
};

export default Layout;