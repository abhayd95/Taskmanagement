import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { reportsAPI } from '../../services/api';
import { format, parseISO, subDays } from 'date-fns';
import {
    Download,
    Calendar,
    Users,
    Clock,
    CheckSquare,
    BarChart3,
    Filter
} from 'lucide-react';

const Reports = () => {
    const [filters, setFilters] = useState({
        start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        user_id: '',
        department: ''
    });

    const [reportType, setReportType] = useState('attendance');

    // Get attendance report
    const { data: attendanceReport, isLoading: attendanceLoading } = useQuery(
        ['attendance-report', filters],
        () => reportsAPI.getAttendanceReport(filters), {
            enabled: reportType === 'attendance'
        }
    );

    // Get task report
    const { data: taskReport, isLoading: taskLoading } = useQuery(
        ['task-report', filters],
        () => reportsAPI.getTaskReport(filters), {
            enabled: reportType === 'tasks'
        }
    );

    const handleExport = async(type) => {
        try {
            const params = {...filters, format: 'excel' };
            const response = await reportsAPI[`get${type === 'attendance' ? 'Attendance' : 'Task'}Report`](params);

            // Create download link
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${type}_report_${filters.start_date}_to_${filters.end_date}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const isLoading = reportType === 'attendance' ? attendanceLoading : taskLoading;
    const reportData = reportType === 'attendance' ? attendanceReport ?.data : taskReport ?.data;

    return ( <
        div className = "space-y-6" > { /* Header */ } <
        div className = "flex justify-between items-center" >
        <
        div >
        <
        h1 className = "text-2xl font-bold text-gray-900" > Reports < /h1> <
        p className = "text-gray-600" > Generate and
        export attendance and task reports < /p> < /
        div > <
        /div>

        { /* Report Type Selector */ } <
        div className = "card" >
        <
        div className = "flex space-x-4" >
        <
        button onClick = {
            () => setReportType('attendance')
        }
        className = { `px-4 py-2 rounded-lg font-medium transition-colors ${
              reportType === 'attendance'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }` } >
        <
        Clock className = "w-4 h-4 inline mr-2" / >
        Attendance Report <
        /button> <
        button onClick = {
            () => setReportType('tasks')
        }
        className = { `px-4 py-2 rounded-lg font-medium transition-colors ${
              reportType === 'tasks'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }` } >
        <
        CheckSquare className = "w-4 h-4 inline mr-2" / >
        Task Report <
        /button> < /
        div > <
        /div>

        { /* Filters */ } <
        div className = "card" >
        <
        div className = "flex items-center justify-between mb-4" >
        <
        h3 className = "text-lg font-medium text-gray-900" > Filters < /h3> <
        button onClick = {
            () => handleExport(reportType)
        }
        className = "btn btn-primary flex items-center" >
        <
        Download className = "w-4 h-4 mr-2" / >
        Export Excel <
        /button> < /
        div >

        <
        div className = "grid grid-cols-1 md:grid-cols-4 gap-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Start Date <
        /label> <
        input type = "date"
        value = { filters.start_date }
        onChange = {
            (e) => setFilters({...filters, start_date: e.target.value })
        }
        className = "input" /
        >
        <
        /div> <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        End Date <
        /label> <
        input type = "date"
        value = { filters.end_date }
        onChange = {
            (e) => setFilters({...filters, end_date: e.target.value })
        }
        className = "input" /
        >
        <
        /div> <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Department <
        /label> <
        input type = "text"
        value = { filters.department }
        onChange = {
            (e) => setFilters({...filters, department: e.target.value })
        }
        className = "input"
        placeholder = "Filter by department" /
        >
        <
        /div> <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        User ID <
        /label> <
        input type = "text"
        value = { filters.user_id }
        onChange = {
            (e) => setFilters({...filters, user_id: e.target.value })
        }
        className = "input"
        placeholder = "Filter by user ID" /
        >
        <
        /div> < /
        div > <
        /div>

        { /* Report Summary */ } {
            reportData ?.summary && ( <
                div className = "grid grid-cols-1 md:grid-cols-4 gap-4" > {
                    reportType === 'attendance' ? ( <
                        >
                        <
                        div className = "card text-center" >
                        <
                        div className = "text-2xl font-bold text-blue-600" > { reportData.summary.totalRecords } <
                        /div> <
                        div className = "text-sm text-gray-500" > Total Records < /div> < /
                        div > <
                        div className = "card text-center" >
                        <
                        div className = "text-2xl font-bold text-green-600" > { reportData.summary.totalWorkHours ?.toFixed(2) || 0 } <
                        /div> <
                        div className = "text-sm text-gray-500" > Total Work Hours < /div> < /
                        div > <
                        div className = "card text-center" >
                        <
                        div className = "text-2xl font-bold text-orange-600" > { reportData.summary.totalOvertimeHours ?.toFixed(2) || 0 } <
                        /div> <
                        div className = "text-sm text-gray-500" > Overtime Hours < /div> < /
                        div > <
                        div className = "card text-center" >
                        <
                        div className = "text-2xl font-bold text-purple-600" > { reportData.summary.averageWorkHours ?.toFixed(2) || 0 } <
                        /div> <
                        div className = "text-sm text-gray-500" > Avg Work Hours < /div> < /
                        div > <
                        />
                    ) : ( <
                        >
                        <
                        div className = "card text-center" >
                        <
                        div className = "text-2xl font-bold text-blue-600" > { reportData.summary.totalTasks } <
                        /div> <
                        div className = "text-sm text-gray-500" > Total Tasks < /div> < /
                        div > <
                        div className = "card text-center" >
                        <
                        div className = "text-2xl font-bold text-green-600" > { reportData.summary.completedTasks } <
                        /div> <
                        div className = "text-sm text-gray-500" > Completed < /div> < /
                        div > <
                        div className = "card text-center" >
                        <
                        div className = "text-2xl font-bold text-yellow-600" > { reportData.summary.pendingTasks } <
                        /div> <
                        div className = "text-sm text-gray-500" > Pending < /div> < /
                        div > <
                        div className = "card text-center" >
                        <
                        div className = "text-2xl font-bold text-red-600" > { reportData.summary.overdueTasks } <
                        /div> <
                        div className = "text-sm text-gray-500" > Overdue < /div> < /
                        div > <
                        />
                    )
                } <
                /div>
            )
        }

        { /* Report Data */ } <
        div className = "card" >
        <
        h3 className = "text-lg font-medium text-gray-900 mb-4" > { reportType === 'attendance' ? 'Attendance Records' : 'Task Records' } <
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
                tr > {
                    reportType === 'attendance' ? ( <
                        >
                        <
                        th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                        Employee <
                        /th> <
                        th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                        Date <
                        /th> <
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
                        /th> < / >
                    ) : ( <
                        >
                        <
                        th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                        Task <
                        /th> <
                        th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                        Assigned To <
                        /th> <
                        th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                        Priority <
                        /th> <
                        th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                        Status <
                        /th> <
                        th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                        Due Date <
                        /th> <
                        th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                        Created <
                        /th> < / >
                    )
                } <
                /tr> < /
                thead > <
                tbody className = "bg-white divide-y divide-gray-200" > {
                    reportData ?.records ?.length > 0 ? (
                        reportData.records.map((record, index) => ( <
                            tr key = { index }
                            className = "hover:bg-gray-50" > {
                                reportType === 'attendance' ? ( <
                                    >
                                    <
                                    td className = "px-6 py-4 whitespace-nowrap" >
                                    <
                                    div >
                                    <
                                    div className = "text-sm font-medium text-gray-900" > { record.first_name } { record.last_name } <
                                    /div> <
                                    div className = "text-sm text-gray-500" > { record.employee_id } < /div> < /
                                    div > <
                                    /td> <
                                    td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { format(parseISO(record.date), 'MMM dd, yyyy') } <
                                    /td> <
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
                                    td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { record.work_hours ? `${record.work_hours.toFixed(2)}h` : '0h' } <
                                    /td> <
                                    td className = "px-6 py-4 whitespace-nowrap" >
                                    <
                                    span className = { `badge ${
                              record.status === 'present' ? 'badge-success' :
                              record.status === 'late' ? 'badge-warning' :
                              record.status === 'absent' ? 'badge-danger' : 'badge-info'
                            }` } > { record.status.toUpperCase() } <
                                    /span> < /
                                    td > <
                                    />
                                ) : ( <
                                    >
                                    <
                                    td className = "px-6 py-4 whitespace-nowrap" >
                                    <
                                    div >
                                    <
                                    div className = "text-sm font-medium text-gray-900" > { record.title } <
                                    /div> <
                                    div className = "text-sm text-gray-500 truncate max-w-xs" > { record.description } <
                                    /div> < /
                                    div > <
                                    /td> <
                                    td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { record.assigned_to_first_name } { record.assigned_to_last_name } <
                                    /td> <
                                    td className = "px-6 py-4 whitespace-nowrap" >
                                    <
                                    span className = { `badge ${
                              record.priority === 'urgent' ? 'badge-danger' :
                              record.priority === 'high' ? 'badge-warning' :
                              record.priority === 'medium' ? 'badge-info' : 'badge-success'
                            }` } > { record.priority.toUpperCase() } <
                                    /span> < /
                                    td > <
                                    td className = "px-6 py-4 whitespace-nowrap" >
                                    <
                                    span className = { `badge ${
                              record.status === 'completed' ? 'badge-success' :
                              record.status === 'in_progress' ? 'badge-info' :
                              record.status === 'pending' ? 'badge-warning' : 'badge-danger'
                            }` } > { record.status.replace('_', ' ').toUpperCase() } <
                                    /span> < /
                                    td > <
                                    td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > {
                                        record.due_date ?
                                        format(parseISO(record.due_date), 'MMM dd, yyyy') : 'No due date'
                                    } <
                                    /td> <
                                    td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { format(parseISO(record.created_at), 'MMM dd, yyyy') } <
                                    /td> < / >
                                )
                            } <
                            /tr>
                        ))
                    ) : ( <
                        tr >
                        <
                        td colSpan = { 6 }
                        className = "px-6 py-12 text-center text-gray-500" >
                        No records found
                        for the selected filters <
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

export default Reports;