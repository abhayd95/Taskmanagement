import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tasksAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO, isAfter, isToday } from 'date-fns';
import {
    Plus,
    Filter,
    Search,
    Calendar,
    User,
    AlertCircle,
    CheckCircle,
    Clock,
    X,
    Edit,
    Trash2,
    Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const Tasks = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        search: ''
    });

    // Get tasks
    const { data: tasksData, isLoading } = useQuery(
        ['tasks', filters],
        () => tasksAPI.getTasks(filters), {
            refetchInterval: 30000,
        }
    );

    // Get task stats
    const { data: taskStats } = useQuery(
        'task-stats',
        () => tasksAPI.getTaskStats(), {
            enabled: user ?.role === 'employee'
        }
    );

    // Update task mutation
    const updateTaskMutation = useMutation(
        ({ id, data }) => tasksAPI.updateTask(id, data), {
            onSuccess: () => {
                queryClient.invalidateQueries('tasks');
                queryClient.invalidateQueries('task-stats');
                toast.success('Task updated successfully!');
            },
            onError: (error) => {
                toast.error(error.response ?.data ?.message || 'Update failed');
            }
        }
    );

    // Delete task mutation
    const deleteTaskMutation = useMutation(
        (id) => tasksAPI.deleteTask(id), {
            onSuccess: () => {
                queryClient.invalidateQueries('tasks');
                toast.success('Task deleted successfully!');
            },
            onError: (error) => {
                toast.error(error.response ?.data ?.message || 'Delete failed');
            }
        }
    );

    const handleStatusChange = (taskId, newStatus) => {
        updateTaskMutation.mutate({
            id: taskId,
            data: { status: newStatus }
        });
    };

    const handleDelete = (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            deleteTaskMutation.mutate(taskId);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-blue-100 text-blue-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800'
        };
        return colors[priority] || colors.medium;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-gray-100 text-gray-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || colors.pending;
    };

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return isAfter(new Date(), parseISO(dueDate)) && !isToday(parseISO(dueDate));
    };

    const tasks = tasksData ?.data ?.tasks || [];

    return ( <
            div className = "space-y-6" > { /* Header */ } <
            div className = "flex justify-between items-center" >
            <
            div >
            <
            h1 className = "text-2xl font-bold text-gray-900" > Tasks < /h1> <
            p className = "text-gray-600" > Manage and track your tasks < /p> < /
            div > {
                (user ?.role === 'admin' || user ?.role === 'manager') && ( <
                    button onClick = {
                        () => setShowCreateModal(true)
                    }
                    className = "btn btn-primary flex items-center" >
                    <
                    Plus className = "w-4 h-4 mr-2" / >
                    Create Task <
                    /button>
                )
            } <
            /div>

            { /* Task Stats for Employees */ } {
                user ?.role === 'employee' && taskStats ?.data ?.stats && ( <
                    div className = "grid grid-cols-2 gap-4 sm:grid-cols-4" > {
                        taskStats.data.stats.byStatus ?.map((stat) => ( <
                            div key = { stat.status }
                            className = "card text-center" >
                            <
                            div className = "text-2xl font-bold text-gray-900" > { stat.count } < /div> <
                            div className = "text-sm text-gray-500 capitalize" > { stat.status.replace('_', ' ') } < /div> < /
                            div >
                        ))
                    } <
                    div className = "card text-center" >
                    <
                    div className = "text-2xl font-bold text-red-600" > { taskStats.data.stats.overdue } < /div> <
                    div className = "text-sm text-gray-500" > Overdue < /div> < /
                    div > <
                    div className = "card text-center" >
                    <
                    div className = "text-2xl font-bold text-yellow-600" > { taskStats.data.stats.dueToday } < /div> <
                    div className = "text-sm text-gray-500" > Due Today < /div> < /
                    div > <
                    /div>
                )
            }

            { /* Filters */ } <
            div className = "card" >
            <
            div className = "flex flex-wrap gap-4" >
            <
            div className = "flex-1 min-w-0" >
            <
            div className = "relative" >
            <
            Search className = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" / >
            <
            input type = "text"
            placeholder = "Search tasks..."
            value = { filters.search }
            onChange = {
                (e) => setFilters({...filters, search: e.target.value })
            }
            className = "input pl-10" /
            >
            <
            /div> < /
            div > <
            select value = { filters.status }
            onChange = {
                (e) => setFilters({...filters, status: e.target.value })
            }
            className = "input w-auto" >
            <
            option value = "" > All Status < /option> <
            option value = "pending" > Pending < /option> <
            option value = "in_progress" > In Progress < /option> <
            option value = "completed" > Completed < /option> <
            option value = "cancelled" > Cancelled < /option> < /
            select > <
            select value = { filters.priority }
            onChange = {
                (e) => setFilters({...filters, priority: e.target.value })
            }
            className = "input w-auto" >
            <
            option value = "" > All Priority < /option> <
            option value = "low" > Low < /option> <
            option value = "medium" > Medium < /option> <
            option value = "high" > High < /option> <
            option value = "urgent" > Urgent < /option> < /
            select > <
            /div> < /
            div >

            { /* Tasks List */ } <
            div className = "card" > {
                isLoading ? ( <
                    div className = "flex items-center justify-center py-8" >
                    <
                    div className = "animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" > < /div> < /
                    div >
                ) : ( <
                    div className = "space-y-4" > {
                        tasks.length > 0 ? (
                            tasks.map((task) => ( <
                                    div key = { task.id }
                                    className = { `border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    isOverdue(task.due_date) ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }` } >
                                    <
                                    div className = "flex items-start justify-between" >
                                    <
                                    div className = "flex-1 min-w-0" >
                                    <
                                    div className = "flex items-center space-x-2 mb-2" >
                                    <
                                    h3 className = "text-lg font-medium text-gray-900 truncate" > { task.title } <
                                    /h3> {
                                    isOverdue(task.due_date) && ( <
                                        AlertCircle className = "w-5 h-5 text-red-500 flex-shrink-0" / >
                                    )
                                } <
                                /div>

                                {
                                    task.description && ( <
                                        p className = "text-sm text-gray-600 mb-3 line-clamp-2" > { task.description } <
                                        /p>
                                    )
                                }

                                <
                                div className = "flex flex-wrap items-center gap-2 text-sm text-gray-500" >
                                <
                                span className = { `badge ${getPriorityColor(task.priority)}` } > { task.priority.toUpperCase() } <
                                /span> <
                                span className = { `badge ${getStatusColor(task.status)}` } > { task.status.replace('_', ' ').toUpperCase() } <
                                /span> {
                                task.due_date && ( <
                                    div className = "flex items-center" >
                                    <
                                    Calendar className = "w-4 h-4 mr-1" / > { format(parseISO(task.due_date), 'MMM dd, yyyy') } <
                                    /div>
                                )
                            } <
                            div className = "flex items-center" >
                            <
                            User className = "w-4 h-4 mr-1" / > { task.assigned_to_first_name } { task.assigned_to_last_name } <
                            /div> {
                            (user ?.role === 'admin' || user ?.role === 'manager') && ( <
                                div className = "flex items-center" >
                                <
                                span className = "text-xs" > Assigned by: { task.assigned_by_first_name } { task.assigned_by_last_name } < /span> < /
                                div >
                            )
                        } <
                        /div> < /
                        div >

                        <
                        div className = "flex items-center space-x-2 ml-4" > {
                            user ?.role === 'employee' && task.status !== 'completed' && task.status !== 'cancelled' && ( <
                                select value = { task.status }
                                onChange = {
                                    (e) => handleStatusChange(task.id, e.target.value)
                                }
                                className = "text-sm border border-gray-300 rounded px-2 py-1" >
                                <
                                option value = "pending" > Pending < /option> <
                                option value = "in_progress" > In Progress < /option> <
                                option value = "completed" > Completed < /option> < /
                                select >
                            )
                        }

                        {
                            (user ?.role === 'admin' || user ?.role === 'manager') && ( <
                                >
                                <
                                button onClick = {
                                    () => {
                                        setSelectedTask(task);
                                        setShowEditModal(true);
                                    }
                                }
                                className = "p-1 text-gray-400 hover:text-gray-600"
                                title = "Edit task" >
                                <
                                Edit className = "w-4 h-4" / >
                                <
                                /button> <
                                button onClick = {
                                    () => handleDelete(task.id)
                                }
                                className = "p-1 text-gray-400 hover:text-red-600"
                                title = "Delete task" >
                                <
                                Trash2 className = "w-4 h-4" / >
                                <
                                /button> < / >
                            )
                        } <
                        /div> < /
                        div >

                        {
                            task.completed_at && ( <
                                div className = "mt-3 pt-3 border-t border-gray-200" >
                                <
                                div className = "flex items-center text-sm text-green-600" >
                                <
                                CheckCircle className = "w-4 h-4 mr-1" / >
                                Completed on { format(parseISO(task.completed_at), 'MMM dd, yyyy HH:mm') } <
                                /div> < /
                                div >
                            )
                        } <
                        /div>
                    ))
            ): ( <
                div className = "text-center py-12" >
                <
                Clock className = "mx-auto h-12 w-12 text-gray-400" / >
                <
                h3 className = "mt-2 text-sm font-medium text-gray-900" > No tasks found < /h3> <
                p className = "mt-1 text-sm text-gray-500" > {
                    filters.search || filters.status || filters.priority ?
                    'Try adjusting your filters' : 'Get started by creating a new task'
                } <
                /p> < /
                div >
            )
        } <
        /div>
)
} <
/div>

{ /* Create Task Modal */ } {
    showCreateModal && ( <
        CreateTaskModal onClose = {
            () => setShowCreateModal(false)
        }
        onSuccess = {
            () => {
                setShowCreateModal(false);
                queryClient.invalidateQueries('tasks');
            }
        }
        />
    )
}

{ /* Edit Task Modal */ } {
    showEditModal && selectedTask && ( <
        EditTaskModal task = { selectedTask }
        onClose = {
            () => {
                setShowEditModal(false);
                setSelectedTask(null);
            }
        }
        onSuccess = {
            () => {
                setShowEditModal(false);
                setSelectedTask(null);
                queryClient.invalidateQueries('tasks');
            }
        }
        />
    )
} <
/div>
);
};

// Create Task Modal Component
const CreateTaskModal = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: ''
    });
    const [users, setUsers] = useState([]);

    const createTaskMutation = useMutation(
        (data) => tasksAPI.createTask(data), {
            onSuccess: () => {
                onSuccess();
                toast.success('Task created successfully!');
            },
            onError: (error) => {
                toast.error(error.response ?.data ?.message || 'Failed to create task');
            }
        }
    );

    // Fetch users for assignment
    React.useEffect(() => {
        const fetchUsers = async() => {
            try {
                const response = await tasksAPI.getUsers();
                setUsers(response.data.users);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        createTaskMutation.mutate(formData);
    };

    return ( <
            div className = "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" >
            <
            div className = "relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" >
            <
            div className = "mt-3" >
            <
            div className = "flex items-center justify-between mb-4" >
            <
            h3 className = "text-lg font-medium text-gray-900" > Create New Task < /h3> <
            button onClick = { onClose }
            className = "text-gray-400 hover:text-gray-600" >
            <
            X className = "w-6 h-6" / >
            <
            /button> < /
            div >

            <
            form onSubmit = { handleSubmit }
            className = "space-y-4" >
            <
            div >
            <
            label className = "block text-sm font-medium text-gray-700 mb-1" >
            Title *
            <
            /label> <
            input type = "text"
            required value = { formData.title }
            onChange = {
                (e) => setFormData({...formData, title: e.target.value })
            }
            className = "input"
            placeholder = "Enter task title" /
            >
            <
            /div>

            <
            div >
            <
            label className = "block text-sm font-medium text-gray-700 mb-1" >
            Description <
            /label> <
            textarea value = { formData.description }
            onChange = {
                (e) => setFormData({...formData, description: e.target.value })
            }
            rows = { 3 }
            className = "input"
            placeholder = "Enter task description" /
            >
            <
            /div>

            <
            div >
            <
            label className = "block text-sm font-medium text-gray-700 mb-1" >
            Assign To *
            <
            /label> <
            select required value = { formData.assigned_to }
            onChange = {
                (e) => setFormData({...formData, assigned_to: e.target.value })
            }
            className = "input" >
            <
            option value = "" > Select employee < /option> {
            users.map((user) => ( <
                option key = { user.id }
                value = { user.id } > { user.first_name } { user.last_name }({ user.employee_id }) <
                /option>
            ))
        } <
        /select> < /
    div >

        <
        div className = "grid grid-cols-2 gap-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Priority <
        /label> <
    select value = { formData.priority }
    onChange = {
        (e) => setFormData({...formData, priority: e.target.value })
    }
    className = "input" >
        <
        option value = "low" > Low < /option> <
    option value = "medium" > Medium < /option> <
    option value = "high" > High < /option> <
    option value = "urgent" > Urgent < /option> < /
    select > <
        /div>

    <
    div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Due Date <
        /label> <
    input type = "date"
    value = { formData.due_date }
    onChange = {
        (e) => setFormData({...formData, due_date: e.target.value })
    }
    className = "input" /
        >
        <
        /div> < /
    div >

        <
        div className = "flex justify-end space-x-3 pt-4" >
        <
        button type = "button"
    onClick = { onClose }
    className = "btn btn-secondary" >
        Cancel <
        /button> <
    button type = "submit"
    disabled = { createTaskMutation.isLoading }
    className = "btn btn-primary" > { createTaskMutation.isLoading ? 'Creating...' : 'Create Task' } <
        /button> < /
    div > <
        /form> < /
    div > <
        /div> < /
    div >
);
};

// Edit Task Modal Component
const EditTaskModal = ({ task, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        due_date: task.due_date || ''
    });

    const updateTaskMutation = useMutation(
        (data) => tasksAPI.updateTask(task.id, data), {
            onSuccess: () => {
                onSuccess();
                toast.success('Task updated successfully!');
            },
            onError: (error) => {
                toast.error(error.response ?.data ?.message || 'Failed to update task');
            }
        }
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        updateTaskMutation.mutate(formData);
    };

    return ( <
        div className = "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" >
        <
        div className = "relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" >
        <
        div className = "mt-3" >
        <
        div className = "flex items-center justify-between mb-4" >
        <
        h3 className = "text-lg font-medium text-gray-900" > Edit Task < /h3> <
        button onClick = { onClose }
        className = "text-gray-400 hover:text-gray-600" >
        <
        X className = "w-6 h-6" / >
        <
        /button> < /
        div >

        <
        form onSubmit = { handleSubmit }
        className = "space-y-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Title *
        <
        /label> <
        input type = "text"
        required value = { formData.title }
        onChange = {
            (e) => setFormData({...formData, title: e.target.value })
        }
        className = "input" /
        >
        <
        /div>

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Description <
        /label> <
        textarea value = { formData.description }
        onChange = {
            (e) => setFormData({...formData, description: e.target.value })
        }
        rows = { 3 }
        className = "input" /
        >
        <
        /div>

        <
        div className = "grid grid-cols-2 gap-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Priority <
        /label> <
        select value = { formData.priority }
        onChange = {
            (e) => setFormData({...formData, priority: e.target.value })
        }
        className = "input" >
        <
        option value = "low" > Low < /option> <
        option value = "medium" > Medium < /option> <
        option value = "high" > High < /option> <
        option value = "urgent" > Urgent < /option> < /
        select > <
        /div>

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Status <
        /label> <
        select value = { formData.status }
        onChange = {
            (e) => setFormData({...formData, status: e.target.value })
        }
        className = "input" >
        <
        option value = "pending" > Pending < /option> <
        option value = "in_progress" > In Progress < /option> <
        option value = "completed" > Completed < /option> <
        option value = "cancelled" > Cancelled < /option> < /
        select > <
        /div> < /
        div >

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Due Date <
        /label> <
        input type = "date"
        value = { formData.due_date }
        onChange = {
            (e) => setFormData({...formData, due_date: e.target.value })
        }
        className = "input" /
        >
        <
        /div>

        <
        div className = "flex justify-end space-x-3 pt-4" >
        <
        button type = "button"
        onClick = { onClose }
        className = "btn btn-secondary" >
        Cancel <
        /button> <
        button type = "submit"
        disabled = { updateTaskMutation.isLoading }
        className = "btn btn-primary" > { updateTaskMutation.isLoading ? 'Updating...' : 'Update Task' } <
        /button> < /
        div > <
        /form> < /
        div > <
        /div> < /
        div >
    );
};

export default Tasks;