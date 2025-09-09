import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { attendanceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import {
    Clock,
    LogIn as ClockInIcon,
    LogOut as ClockOutIcon,
    Calendar,
    CheckCircle,
    AlertCircle,
    Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const Attendance = () => {
        const { user } = useAuth();
        const queryClient = useQueryClient();
        const [checkInNotes, setCheckInNotes] = useState('');
        const [checkOutNotes, setCheckOutNotes] = useState('');

        // Get today's status
        const { data: todayStatus, isLoading: statusLoading } = useQuery(
            'today-status',
            () => attendanceAPI.getTodayStatus(), {
                refetchInterval: 30000, // Refetch every 30 seconds
            }
        );

        // Get attendance records
        const { data: recordsData, isLoading: recordsLoading } = useQuery(
            'my-attendance-records',
            () => attendanceAPI.getMyRecords({ limit: 30 }), {
                enabled: user ?.role === 'employee'
            }
        );

        // Get all records for managers/admins
        const { data: allRecordsData, isLoading: allRecordsLoading } = useQuery(
            'all-attendance-records',
            () => attendanceAPI.getRecords({ limit: 50 }), {
                enabled: user ?.role === 'admin' || user ?.role === 'manager'
            }
        );

        // Check in mutation
        const checkInMutation = useMutation(
            (notes) => attendanceAPI.checkIn(notes), {
                onSuccess: () => {
                    queryClient.invalidateQueries('today-status');
                    queryClient.invalidateQueries('my-attendance-records');
                    queryClient.invalidateQueries('all-attendance-records');
                    setCheckInNotes('');
                    toast.success('Checked in successfully!');
                },
                onError: (error) => {
                    toast.error(error.response ?.data ?.message || 'Check-in failed');
                }
            }
        );

        // Check out mutation
        const checkOutMutation = useMutation(
            (notes) => attendanceAPI.checkOut(notes), {
                onSuccess: () => {
                    queryClient.invalidateQueries('today-status');
                    queryClient.invalidateQueries('my-attendance-records');
                    queryClient.invalidateQueries('all-attendance-records');
                    setCheckOutNotes('');
                    toast.success('Checked out successfully!');
                },
                onError: (error) => {
                    toast.error(error.response ?.data ?.message || 'Check-out failed');
                }
            }
        );

        const handleCheckIn = () => {
            checkInMutation.mutate(checkInNotes);
        };

        const handleCheckOut = () => {
            checkOutMutation.mutate(checkOutNotes);
        };

        const getStatusBadge = (status) => {
            const statusConfig = {
                present: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
                late: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
                absent: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
                half_day: { color: 'bg-blue-100 text-blue-800', icon: Clock }
            };

            const config = statusConfig[status] || statusConfig.present;
            const Icon = config.icon;

            return ( <
                span className = { `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}` } >
                <
                Icon className = "w-3 h-3 mr-1" / > { status.replace('_', ' ').toUpperCase() } <
                /span>
            );
        };

        const records = user ?.role === 'employee' ? recordsData ?.data ?.records : allRecordsData ?.data ?.records;
        const isLoading = user ?.role === 'employee' ? recordsLoading : allRecordsLoading;

        return ( <
            div className = "space-y-6" > { /* Header */ } <
            div className = "flex justify-between items-center" >
            <
            div >
            <
            h1 className = "text-2xl font-bold text-gray-900" > Attendance < /h1> <
            p className = "text-gray-600" > Manage your daily attendance and view records < /p> < /
            div > {
                (user ?.role === 'admin' || user ?.role === 'manager') && ( <
                    button className = "btn btn-primary flex items-center" >
                    <
                    Download className = "w-4 h-4 mr-2" / >
                    Export Report <
                    /button>
                )
            } <
            /div>

            { /* Today's Status Card */ } <
            div className = "card" >
            <
            div className = "flex items-center justify-between mb-4" >
            <
            h3 className = "text-lg font-medium text-gray-900" > Today 's Status</h3> <
            div className = "flex items-center text-sm text-gray-500" >
            <
            Calendar className = "w-4 h-4 mr-1" / > { format(new Date(), 'EEEE, MMMM do, yyyy') } <
            /div> < /
            div >

            {
                statusLoading ? ( <
                    div className = "flex items-center justify-center py-8" >
                    <
                    div className = "animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" > < /div> < /
                    div >
                ) : ( <
                    div className = "space-y-4" >
                    <
                    div className = "flex items-center justify-between" >
                    <
                    div className = "flex items-center" >
                    <
                    Clock className = "w-5 h-5 text-gray-400 mr-3" / >
                    <
                    span className = "text-sm font-medium text-gray-700" > Status: < /span> <
                    div className = "ml-2" > {
                        todayStatus ?.data ?.record ? (
                            getStatusBadge(todayStatus.data.record.status)
                        ) : ( <
                            span className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800" >
                            Not checked in
                            <
                            /span>
                        )
                    } <
                    /div> < /
                    div > <
                    /div>

                    {
                        todayStatus ?.data ?.record && ( <
                            div className = "grid grid-cols-1 md:grid-cols-3 gap-4" >
                            <
                            div className = "text-center p-3 bg-gray-50 rounded-lg" >
                            <
                            div className = "text-sm text-gray-500" > Check In < /div> <
                            div className = "font-medium" > {
                                todayStatus.data.record.checkInTime ?
                                format(parseISO(todayStatus.data.record.checkInTime), 'HH:mm:ss') : '--:--:--'
                            } <
                            /div> < /
                            div > <
                            div className = "text-center p-3 bg-gray-50 rounded-lg" >
                            <
                            div className = "text-sm text-gray-500" > Check Out < /div> <
                            div className = "font-medium" > {
                                todayStatus.data.record.checkOutTime ?
                                format(parseISO(todayStatus.data.record.checkOutTime), 'HH:mm:ss') : '--:--:--'
                            } <
                            /div> < /
                            div > <
                            div className = "text-center p-3 bg-gray-50 rounded-lg" >
                            <
                            div className = "text-sm text-gray-500" > Work Hours < /div> <
                            div className = "font-medium" > {
                                todayStatus.data.record.workHours ?
                                `${todayStatus.data.record.workHours.toFixed(2)}h` : '0h'
                            } <
                            /div> < /
                            div > <
                            /div>
                        )
                    }

                    { /* Check In/Out Actions */ } {
                        user ?.role === 'employee' && ( <
                            div className = "border-t pt-4" > {
                                todayStatus ?.data ?.status === 'not_checked_in' && ( <
                                    div className = "space-y-3" >
                                    <
                                    div >
                                    <
                                    label className = "block text-sm font-medium text-gray-700 mb-1" >
                                    Check In Notes(Optional) <
                                    /label> <
                                    textarea value = { checkInNotes }
                                    onChange = {
                                        (e) => setCheckInNotes(e.target.value)
                                    }
                                    rows = { 2 }
                                    className = "input"
                                    placeholder = "Add any notes for check-in..." /
                                    >
                                    <
                                    /div> <
                                    button onClick = { handleCheckIn }
                                    disabled = { checkInMutation.isLoading }
                                    className = "btn btn-success flex items-center" >
                                    <
                                    ClockInIcon className = "w-4 h-4 mr-2" / > { checkInMutation.isLoading ? 'Checking In...' : 'Check In' } <
                                    /button> < /
                                    div >
                                )
                            }

                            {
                                todayStatus ?.data ?.status === 'checked_in' && ( <
                                    div className = "space-y-3" >
                                    <
                                    div >
                                    <
                                    label className = "block text-sm font-medium text-gray-700 mb-1" >
                                    Check Out Notes(Optional) <
                                    /label> <
                                    textarea value = { checkOutNotes }
                                    onChange = {
                                        (e) => setCheckOutNotes(e.target.value)
                                    }
                                    rows = { 2 }
                                    className = "input"
                                    placeholder = "Add any notes for check-out..." /
                                    >
                                    <
                                    /div> <
                                    button onClick = { handleCheckOut }
                                    disabled = { checkOutMutation.isLoading }
                                    className = "btn btn-primary flex items-center" >
                                    <
                                    ClockOutIcon className = "w-4 h-4 mr-2" / > { checkOutMutation.isLoading ? 'Checking Out...' : 'Check Out' } <
                                    /button> < /
                                    div >
                                )
                            }

                            {
                                todayStatus ?.data ?.status === 'checked_out' && ( <
                                    div className = "text-center py-4 text-gray-500" >
                                    <
                                    CheckCircle className = "w-8 h-8 mx-auto mb-2 text-green-500" / >
                                    <
                                    p > You have completed your work
                                    for today! < /p> < /
                                    div >
                                )
                            } <
                            /div>
                        )
                    } <
                    /div>
                )
            } <
            /div>

            { /* Attendance Records */ } <
            div className = "card" >
            <
            h3 className = "text-lg font-medium text-gray-900 mb-4" > { user ?.role === 'employee' ? 'Your Attendance Records' : 'All Attendance Records' } <
            /h3>

            {
                isLoading ? ( <
                        div className = "flex items-center justify-center py-8" >
                        <
                        div className = "animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" > < /div> < /
                        div >
                    ) : ( <
                        div className = "overflow-x-auto" >
                        <
                        table className = "min-w-full divide-y divide-gray-200" >
                        <
                        thead className = "bg-gray-50" >
                        <
                        tr >
                        <
                        th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                        Date <
                        /th> {
                        (user ?.role === 'admin' || user ?.role === 'manager') && ( <
                            th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                            Employee <
                            /th>
                        )
                    } <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                    Check In <
                    /th> <
                th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                    Check Out <
                    /th> <
                th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                    Work Hours <
                    /th> <
                th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                    Status <
                    /th> <
                th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                    Notes <
                    /th> < /
                tr > <
                    /thead> <
                tbody className = "bg-white divide-y divide-gray-200" > {
                    records ?.length > 0 ? (
                        records.map((record) => ( <
                                tr key = { record.id }
                                className = "hover:bg-gray-50" >
                                <
                                td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { format(parseISO(record.date), 'MMM dd, yyyy') } <
                                /td> {
                                (user ?.role === 'admin' || user ?.role === 'manager') && ( <
                                    td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { record.first_name } { record.last_name } <
                                    div className = "text-xs text-gray-500" > { record.employee_id } < /div> < /
                                    td >
                                )
                            } <
                            td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > {
                                record.check_in_time ?
                                format(parseISO(record.check_in_time), 'HH:mm:ss') : '--:--:--'
                            } <
                            /td> <
                            td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > {
                                record.check_out_time ?
                                format(parseISO(record.check_out_time), 'HH:mm:ss') : '--:--:--'
                            } <
                            /td> <
                            td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { record.work_hours ? `${record.work_hours.toFixed(2)}h` : '0h' } {
                                record.overtime_hours > 0 && ( <
                                    div className = "text-xs text-orange-600" >
                                    +{ record.overtime_hours.toFixed(2) }
                                    h OT <
                                    /div>
                                )
                            } <
                            /td> <
                            td className = "px-6 py-4 whitespace-nowrap" > { getStatusBadge(record.status) } <
                            /td> <
                            td className = "px-6 py-4 text-sm text-gray-500 max-w-xs truncate" > { record.notes || '-' } <
                            /td> < /
                            tr >
                        ))
                ): ( <
                    tr >
                    <
                    td colSpan = { user ?.role === 'employee' ? 6 : 7 }
                    className = "px-6 py-12 text-center text-gray-500" >
                    No attendance records found <
                    /td> < /
                    tr >
                )
            } <
            /tbody> < /
            table > <
            /div>
        )
    } <
    /div> < /
div >
);
};

export default Attendance;