import React from 'react';
import { useQuery } from 'react-query';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    Users,
    Clock,
    CheckSquare,
    TrendingUp,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
    const { user } = useAuth();

    const { data: dashboardData, isLoading } = useQuery(
        'dashboard-stats',
        () => reportsAPI.getDashboardStats(), {
            refetchInterval: 30000, // Refetch every 30 seconds
        }
    );

    const { data: taskStats } = useQuery(
        'task-stats',
        () => reportsAPI.getTaskStats(), {
            enabled: user?.role === 'employee'
        }
    );

    if (isLoading) {
        return ( <
            div className = "flex items-center justify-center h-64" >
            <
            div className = "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" > < /div> < /
            div >
        );
    }

    const stats = dashboardData?.data?.stats || {};
    const recentActivities = stats.recentActivities || [];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present':
                return 'text-green-600 bg-green-100';
            case 'late':
                return 'text-yellow-600 bg-yellow-100';
            case 'absent':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    return ( <
        div className = "space-y-6" > { /* Header */ } <
        div >
        <
        h1 className = "text-2xl font-bold text-gray-900" > { getGreeting() }, { user?.first_name }!
        <
        /h1> <
        p className = "text-gray-600" >
        Here 's what'
        s happening in your workspace today. <
        /p> < /
        div >

        { /* Stats Grid */ } <
        div className = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" >
        <
        div className = "card" >
        <
        div className = "flex items-center" >
        <
        div className = "flex-shrink-0" >
        <
        Users className = "h-8 w-8 text-blue-600" / >
        <
        /div> <
        div className = "ml-5 w-0 flex-1" >
        <
        dl >
        <
        dt className = "text-sm font-medium text-gray-500 truncate" >
        Total Users <
        /dt> <
        dd className = "text-lg font-medium text-gray-900" > { stats.totalUsers || 0 } <
        /dd> < /
        dl > <
        /div> < /
        div > <
        /div>

        <
        div className = "card" >
        <
        div className = "flex items-center" >
        <
        div className = "flex-shrink-0" >
        <
        Clock className = "h-8 w-8 text-green-600" / >
        <
        /div> <
        div className = "ml-5 w-0 flex-1" >
        <
        dl >
        <
        dt className = "text-sm font-medium text-gray-500 truncate" >
        Checked In Today <
        /dt> <
        dd className = "text-lg font-medium text-gray-900" > { stats.checkedInToday || 0 } <
        /dd> < /
        dl > <
        /div> < /
        div > <
        /div>

        <
        div className = "card" >
        <
        div className = "flex items-center" >
        <
        div className = "flex-shrink-0" >
        <
        CheckSquare className = "h-8 w-8 text-purple-600" / >
        <
        /div> <
        div className = "ml-5 w-0 flex-1" >
        <
        dl >
        <
        dt className = "text-sm font-medium text-gray-500 truncate" >
        Total Tasks <
        /dt> <
        dd className = "text-lg font-medium text-gray-900" > { stats.totalTasks || 0 } <
        /dd> < /
        dl > <
        /div> < /
        div > <
        /div>

        <
        div className = "card" >
        <
        div className = "flex items-center" >
        <
        div className = "flex-shrink-0" >
        <
        TrendingUp className = "h-8 w-8 text-orange-600" / >
        <
        /div> <
        div className = "ml-5 w-0 flex-1" >
        <
        dl >
        <
        dt className = "text-sm font-medium text-gray-500 truncate" >
        Active Today <
        /dt> <
        dd className = "text-lg font-medium text-gray-900" > { stats.checkedInToday || 0 } <
        /dd> < /
        dl > <
        /div> < /
        div > <
        /div> < /
        div >

        { /* Employee Task Stats */ } {
            user?.role === 'employee' && taskStats?.data?.stats && ( <
                div className = "card" >
                <
                h3 className = "text-lg font-medium text-gray-900 mb-4" > Your Task Overview < /h3> <
                div className = "grid grid-cols-2 gap-4 sm:grid-cols-4" > {
                    taskStats.data.stats.byStatus?.map((stat) => ( <
                        div key = { stat.status }
                        className = "text-center" >
                        <
                        div className = "text-2xl font-bold text-gray-900" > { stat.count } < /div> <
                        div className = "text-sm text-gray-500 capitalize" > { stat.status.replace('_', ' ') } < /div> < /
                        div >
                    ))
                } <
                div className = "text-center" >
                <
                div className = "text-2xl font-bold text-red-600" > { taskStats.data.stats.overdue } < /div> <
                div className = "text-sm text-gray-500" > Overdue < /div> < /
                div > <
                div className = "text-center" >
                <
                div className = "text-2xl font-bold text-yellow-600" > { taskStats.data.stats.dueToday } < /div> <
                div className = "text-sm text-gray-500" > Due Today < /div> < /
                div > <
                /div> < /
                div >
            )
        }

        { /* Department Stats for Managers/Admins */ } {
            (user?.role === 'admin' || user?.role === 'manager') && stats.departmentStats && ( <
                div className = "card" >
                <
                h3 className = "text-lg font-medium text-gray-900 mb-4" > Department Attendance Today < /h3> <
                div className = "overflow-hidden" >
                <
                table className = "min-w-full divide-y divide-gray-200" >
                <
                thead className = "bg-gray-50" >
                <
                tr >
                <
                th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                Department <
                /th> <
                th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                Total Employees <
                /th> <
                th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                Present Today <
                /th> <
                th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                Attendance Rate <
                /th> < /
                tr > <
                /thead> <
                tbody className = "bg-white divide-y divide-gray-200" > {
                    stats.departmentStats.map((dept) => ( <
                        tr key = { dept.department } >
                        <
                        td className = "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" > { dept.department } <
                        /td> <
                        td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-500" > { dept.total_employees } <
                        /td> <
                        td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-500" > { dept.present_today } <
                        /td> <
                        td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-500" > {
                            dept.total_employees > 0 ?
                            `${Math.round((dept.present_today / dept.total_employees) * 100)}%` : '0%'
                        } <
                        /td> < /
                        tr >
                    ))
                } <
                /tbody> < /
                table > <
                /div> < /
                div >
            )
        }

        { /* Recent Activities */ } <
        div className = "card" >
        <
        h3 className = "text-lg font-medium text-gray-900 mb-4" > Recent Activities < /h3> <
        div className = "flow-root" >
        <
        ul className = "-mb-8" > {
            recentActivities.length > 0 ? (
                recentActivities.map((activity, activityIdx) => ( <
                    li key = { activityIdx } >
                    <
                    div className = "relative pb-8" > {
                        activityIdx !== recentActivities.length - 1 ? ( <
                            span className = "absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden = "true" /
                            >
                        ) : null
                    } <
                    div className = "relative flex space-x-3" >
                    <
                    div >
                    <
                    span className = { `h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                                        activity.type === 'attendance' ? 'bg-green-500' : 'bg-blue-500'
                                                    }` } > {
                        activity.type === 'attendance' ? ( <
                            Clock className = "h-5 w-5 text-white" / >
                        ) : ( <
                            CheckSquare className = "h-5 w-5 text-white" / >
                        )
                    } <
                    /span> < /
                    div > <
                    div className = "min-w-0 flex-1 pt-1.5 flex justify-between space-x-4" >
                    <
                    div >
                    <
                    p className = "text-sm text-gray-500" >
                    <
                    span className = "font-medium text-gray-900" > { activity.first_name } { activity.last_name } <
                    /span>{' '} { activity.description } < /
                    p > <
                    /div> <
                    div className = "text-right text-sm whitespace-nowrap text-gray-500" > { format(new Date(activity.created_at), 'HH:mm') } <
                    /div> < /
                    div > <
                    /div> < /
                    div > <
                    /li>
                ))
            ) : ( <
                li className = "text-center py-8 text-gray-500" >
                <
                AlertCircle className = "mx-auto h-12 w-12 text-gray-400" / >
                <
                h3 className = "mt-2 text-sm font-medium text-gray-900" > No recent activities < /h3> <
                p className = "mt-1 text-sm text-gray-500" >
                Activities will appear here as they happen. <
                /p> < /
                li >
            )
        } <
        /ul> < /
        div > <
        /div> < /
        div >
    );
};

export default Dashboard;