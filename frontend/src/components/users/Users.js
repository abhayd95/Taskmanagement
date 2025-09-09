import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Calendar,
    Building,
    X
} from 'lucide-react';
import toast from 'react-hot-toast';

const Users = () => {
        const { user } = useAuth();
        const queryClient = useQueryClient();
        const [showCreateModal, setShowCreateModal] = useState(false);
        const [showEditModal, setShowEditModal] = useState(false);
        const [selectedUser, setSelectedUser] = useState(null);
        const [filters, setFilters] = useState({
            search: '',
            department: '',
            role: ''
        });

        // Get users
        const { data: usersData, isLoading } = useQuery(
            ['users', filters],
            () => usersAPI.getUsers(filters), {
                refetchInterval: 30000,
            }
        );

        // Get departments
        const { data: departmentsData } = useQuery(
            'departments',
            () => usersAPI.getDepartments()
        );

        // Delete user mutation
        const deleteUserMutation = useMutation(
            (id) => usersAPI.deleteUser(id), {
                onSuccess: () => {
                    queryClient.invalidateQueries('users');
                    toast.success('User deactivated successfully!');
                },
                onError: (error) => {
                    toast.error(error.response ?.data ?.message || 'Failed to deactivate user');
                }
            }
        );

        // Activate user mutation
        const activateUserMutation = useMutation(
            (id) => usersAPI.activateUser(id), {
                onSuccess: () => {
                    queryClient.invalidateQueries('users');
                    toast.success('User activated successfully!');
                },
                onError: (error) => {
                    toast.error(error.response ?.data ?.message || 'Failed to activate user');
                }
            }
        );

        const handleDelete = (userId) => {
            if (window.confirm('Are you sure you want to deactivate this user?')) {
                deleteUserMutation.mutate(userId);
            }
        };

        const handleActivate = (userId) => {
            activateUserMutation.mutate(userId);
        };

        const getRoleColor = (role) => {
            const colors = {
                admin: 'bg-red-100 text-red-800',
                manager: 'bg-blue-100 text-blue-800',
                employee: 'bg-green-100 text-green-800'
            };
            return colors[role] || colors.employee;
        };

        const users = usersData ?.data ?.users || [];
        const departments = departmentsData ?.data ?.departments || [];

        return ( <
                div className = "space-y-6" > { /* Header */ } <
                div className = "flex justify-between items-center" >
                <
                div >
                <
                h1 className = "text-2xl font-bold text-gray-900" > Users < /h1> <
                p className = "text-gray-600" > Manage system users and their permissions < /p> < /
                div > <
                button onClick = {
                    () => setShowCreateModal(true)
                }
                className = "btn btn-primary flex items-center" >
                <
                Plus className = "w-4 h-4 mr-2" / >
                Add User <
                /button> < /
                div >

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
                placeholder = "Search users..."
                value = { filters.search }
                onChange = {
                    (e) => setFilters({...filters, search: e.target.value })
                }
                className = "input pl-10" /
                >
                <
                /div> < /
                div > <
                select value = { filters.department }
                onChange = {
                    (e) => setFilters({...filters, department: e.target.value })
                }
                className = "input w-auto" >
                <
                option value = "" > All Departments < /option> {
                departments.map((dept) => ( <
                    option key = { dept }
                    value = { dept } > { dept } <
                    /option>
                ))
            } <
            /select> <
        select value = { filters.role }
        onChange = {
            (e) => setFilters({...filters, role: e.target.value })
        }
        className = "input w-auto" >
            <
            option value = "" > All Roles < /option> <
        option value = "admin" > Admin < /option> <
        option value = "manager" > Manager < /option> <
        option value = "employee" > Employee < /option> < /
        select > <
            /div> < /
        div >

            { /* Users Table */ } <
            div className = "card" > {
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
                    User <
                    /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                    Role <
                    /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                    Department <
                    /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                    Contact <
                    /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                    Status <
                    /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                    Joined <
                    /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" >
                    Actions <
                    /th> < /
                    tr > <
                    /thead> <
                    tbody className = "bg-white divide-y divide-gray-200" > {
                        users.length > 0 ? (
                            users.map((userData) => ( <
                                    tr key = { userData.id }
                                    className = "hover:bg-gray-50" >
                                    <
                                    td className = "px-6 py-4 whitespace-nowrap" >
                                    <
                                    div className = "flex items-center" >
                                    <
                                    div className = "flex-shrink-0 h-10 w-10" >
                                    <
                                    div className = "h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center" >
                                    <
                                    span className = "text-sm font-medium text-primary-600" > { userData.first_name[0] } { userData.last_name[0] } <
                                    /span> < /
                                    div > <
                                    /div> <
                                    div className = "ml-4" >
                                    <
                                    div className = "text-sm font-medium text-gray-900" > { userData.first_name } { userData.last_name } <
                                    /div> <
                                    div className = "text-sm text-gray-500" > { userData.employee_id } <
                                    /div> < /
                                    div > <
                                    /div> < /
                                    td > <
                                    td className = "px-6 py-4 whitespace-nowrap" >
                                    <
                                    span className = { `badge ${getRoleColor(userData.role)}` } > { userData.role.toUpperCase() } <
                                    /span> < /
                                    td > <
                                    td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" >
                                    <
                                    div className = "flex items-center" >
                                    <
                                    Building className = "w-4 h-4 mr-1 text-gray-400" / > { userData.department || 'N/A' } <
                                    /div> {
                                    userData.position && ( <
                                        div className = "text-xs text-gray-500" > { userData.position } <
                                        /div>
                                    )
                                } <
                                /td> <
                                td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-500" >
                                <
                                div className = "space-y-1" >
                                <
                                div className = "flex items-center" >
                                <
                                Mail className = "w-4 h-4 mr-1" / > { userData.email } <
                                /div> {
                                userData.phone && ( <
                                    div className = "flex items-center" >
                                    <
                                    Phone className = "w-4 h-4 mr-1" / > { userData.phone } <
                                    /div>
                                )
                            } <
                            /div> < /
                            td > <
                            td className = "px-6 py-4 whitespace-nowrap" > {
                                userData.is_active ? ( <
                                    span className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" >
                                    <
                                    UserCheck className = "w-3 h-3 mr-1" / >
                                    Active <
                                    /span>
                                ) : ( <
                                    span className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" >
                                    <
                                    UserX className = "w-3 h-3 mr-1" / >
                                    Inactive <
                                    /span>
                                )
                            } <
                            /td> <
                            td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-500" >
                            <
                            div className = "flex items-center" >
                            <
                            Calendar className = "w-4 h-4 mr-1" / > { userData.hire_date ? format(parseISO(userData.hire_date), 'MMM dd, yyyy') : 'N/A' } <
                            /div> < /
                            td > <
                            td className = "px-6 py-4 whitespace-nowrap text-sm font-medium" >
                            <
                            div className = "flex items-center space-x-2" >
                            <
                            button onClick = {
                                () => {
                                    setSelectedUser(userData);
                                    setShowEditModal(true);
                                }
                            }
                            className = "text-primary-600 hover:text-primary-900"
                            title = "Edit user" >
                            <
                            Edit className = "w-4 h-4" / >
                            <
                            /button> {
                            userData.is_active ? ( <
                                button onClick = {
                                    () => handleDelete(userData.id)
                                }
                                className = "text-red-600 hover:text-red-900"
                                title = "Deactivate user" >
                                <
                                Trash2 className = "w-4 h-4" / >
                                <
                                /button>
                            ) : ( <
                                button onClick = {
                                    () => handleActivate(userData.id)
                                }
                                className = "text-green-600 hover:text-green-900"
                                title = "Activate user" >
                                <
                                UserCheck className = "w-4 h-4" / >
                                <
                                /button>
                            )
                        } <
                        /div> < /
                        td > <
                        /tr>
                    ))
            ): ( <
                tr >
                <
                td colSpan = { 7 }
                className = "px-6 py-12 text-center text-gray-500" >
                No users found <
                /td> < /
                tr >
            )
    } <
    /tbody> < /
table > <
    /div>
)
}

{ /* Pagination */ } {
    usersData ?.data ?.pagination && ( <
        div className = "bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6" >
        <
        div className = "flex-1 flex justify-between sm:hidden" >
        <
        button disabled = {!usersData.data.pagination.hasPrev }
        className = "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" >
        Previous <
        /button> <
        button disabled = {!usersData.data.pagination.hasNext }
        className = "ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" >
        Next <
        /button> < /
        div > <
        div className = "hidden sm:flex-1 sm:flex sm:items-center sm:justify-between" >
        <
        div >
        <
        p className = "text-sm text-gray-700" >
        Showing { ' ' } <
        span className = "font-medium" > {
            ((usersData.data.pagination.currentPage - 1) * 10) + 1
        } <
        /span>{' '}
        to { ' ' } <
        span className = "font-medium" > { Math.min(usersData.data.pagination.currentPage * 10, usersData.data.pagination.totalUsers) } <
        /span>{' '}
        of { ' ' } <
        span className = "font-medium" > { usersData.data.pagination.totalUsers } < /span>{' '}
        results <
        /p> < /
        div > <
        div >
        <
        nav className = "relative z-0 inline-flex rounded-md shadow-sm -space-x-px" >
        <
        button disabled = {!usersData.data.pagination.hasPrev }
        className = "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" >
        Previous <
        /button> <
        button disabled = {!usersData.data.pagination.hasNext }
        className = "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" >
        Next <
        /button> < /
        nav > <
        /div> < /
        div > <
        /div>
    )
} <
/div>

{ /* Create User Modal */ } {
    showCreateModal && ( <
        CreateUserModal onClose = {
            () => setShowCreateModal(false)
        }
        onSuccess = {
            () => {
                setShowCreateModal(false);
                queryClient.invalidateQueries('users');
            }
        }
        />
    )
}

{ /* Edit User Modal */ } {
    showEditModal && selectedUser && ( <
        EditUserModal user = { selectedUser }
        onClose = {
            () => {
                setShowEditModal(false);
                setSelectedUser(null);
            }
        }
        onSuccess = {
            () => {
                setShowEditModal(false);
                setSelectedUser(null);
                queryClient.invalidateQueries('users');
            }
        }
        />
    )
} <
/div>
);
};

// Create User Modal Component
const CreateUserModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        position: '',
        phone: '',
        address: '',
        hire_date: ''
    });

    const createUserMutation = useMutation(
        (data) => usersAPI.createUser(data), {
            onSuccess: () => {
                onSuccess();
                toast.success('User created successfully!');
            },
            onError: (error) => {
                toast.error(error.response ?.data ?.message || 'Failed to create user');
            }
        }
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        createUserMutation.mutate(formData);
    };

    return ( <
        div className = "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" >
        <
        div className = "relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white" >
        <
        div className = "mt-3" >
        <
        div className = "flex items-center justify-between mb-4" >
        <
        h3 className = "text-lg font-medium text-gray-900" > Create New User < /h3> <
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
        div className = "grid grid-cols-2 gap-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Employee ID *
        <
        /label> <
        input type = "text"
        required value = { formData.employee_id }
        onChange = {
            (e) => setFormData({...formData, employee_id: e.target.value })
        }
        className = "input"
        placeholder = "e.g., EMP001" /
        >
        <
        /div> <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Role *
        <
        /label> <
        select required value = { formData.role }
        onChange = {
            (e) => setFormData({...formData, role: e.target.value })
        }
        className = "input" >
        <
        option value = "employee" > Employee < /option> <
        option value = "manager" > Manager < /option> <
        option value = "admin" > Admin < /option> < /
        select > <
        /div> < /
        div >

        <
        div className = "grid grid-cols-2 gap-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        First Name *
        <
        /label> <
        input type = "text"
        required value = { formData.first_name }
        onChange = {
            (e) => setFormData({...formData, first_name: e.target.value })
        }
        className = "input" /
        >
        <
        /div> <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Last Name *
        <
        /label> <
        input type = "text"
        required value = { formData.last_name }
        onChange = {
            (e) => setFormData({...formData, last_name: e.target.value })
        }
        className = "input" /
        >
        <
        /div> < /
        div >

        <
        div className = "grid grid-cols-2 gap-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Email *
        <
        /label> <
        input type = "email"
        required value = { formData.email }
        onChange = {
            (e) => setFormData({...formData, email: e.target.value })
        }
        className = "input" /
        >
        <
        /div> <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Password *
        <
        /label> <
        input type = "password"
        required value = { formData.password }
        onChange = {
            (e) => setFormData({...formData, password: e.target.value })
        }
        className = "input" /
        >
        <
        /div> < /
        div >

        <
        div className = "grid grid-cols-2 gap-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Department <
        /label> <
        input type = "text"
        value = { formData.department }
        onChange = {
            (e) => setFormData({...formData, department: e.target.value })
        }
        className = "input" /
        >
        <
        /div> <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Position <
        /label> <
        input type = "text"
        value = { formData.position }
        onChange = {
            (e) => setFormData({...formData, position: e.target.value })
        }
        className = "input" /
        >
        <
        /div> < /
        div >

        <
        div className = "grid grid-cols-2 gap-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Phone <
        /label> <
        input type = "tel"
        value = { formData.phone }
        onChange = {
            (e) => setFormData({...formData, phone: e.target.value })
        }
        className = "input" /
        >
        <
        /div> <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Hire Date <
        /label> <
        input type = "date"
        value = { formData.hire_date }
        onChange = {
            (e) => setFormData({...formData, hire_date: e.target.value })
        }
        className = "input" /
        >
        <
        /div> < /
        div >

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Address <
        /label> <
        textarea value = { formData.address }
        onChange = {
            (e) => setFormData({...formData, address: e.target.value })
        }
        rows = { 2 }
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
        disabled = { createUserMutation.isLoading }
        className = "btn btn-primary" > { createUserMutation.isLoading ? 'Creating...' : 'Create User' } <
        /button> < /
        div > <
        /form> < /
        div > <
        /div> < /
        div >
    );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        position: user.position || '',
        phone: user.phone || '',
        address: user.address || ''
    });

    const updateUserMutation = useMutation(
        (data) => usersAPI.updateUser(user.id, data), {
            onSuccess: () => {
                onSuccess();
                toast.success('User updated successfully!');
            },
            onError: (error) => {
                toast.error(error.response ?.data ?.message || 'Failed to update user');
            }
        }
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        updateUserMutation.mutate(formData);
    };

    return ( <
        div className = "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" >
        <
        div className = "relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white" >
        <
        div className = "mt-3" >
        <
        div className = "flex items-center justify-between mb-4" >
        <
        h3 className = "text-lg font-medium text-gray-900" > Edit User < /h3> <
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
        div className = "grid grid-cols-2 gap-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        First Name *
        <
        /label> <
        input type = "text"
        required value = { formData.first_name }
        onChange = {
            (e) => setFormData({...formData, first_name: e.target.value })
        }
        className = "input" /
        >
        <
        /div> <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Last Name *
        <
        /label> <
        input type = "text"
        required value = { formData.last_name }
        onChange = {
            (e) => setFormData({...formData, last_name: e.target.value })
        }
        className = "input" /
        >
        <
        /div> < /
        div >

        <
        div className = "grid grid-cols-2 gap-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Email *
        <
        /label> <
        input type = "email"
        required value = { formData.email }
        onChange = {
            (e) => setFormData({...formData, email: e.target.value })
        }
        className = "input" /
        >
        <
        /div> <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Role *
        <
        /label> <
        select required value = { formData.role }
        onChange = {
            (e) => setFormData({...formData, role: e.target.value })
        }
        className = "input" >
        <
        option value = "employee" > Employee < /option> <
        option value = "manager" > Manager < /option> <
        option value = "admin" > Admin < /option> < /
        select > <
        /div> < /
        div >

        <
        div className = "grid grid-cols-2 gap-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Department <
        /label> <
        input type = "text"
        value = { formData.department }
        onChange = {
            (e) => setFormData({...formData, department: e.target.value })
        }
        className = "input" /
        >
        <
        /div> <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Position <
        /label> <
        input type = "text"
        value = { formData.position }
        onChange = {
            (e) => setFormData({...formData, position: e.target.value })
        }
        className = "input" /
        >
        <
        /div> < /
        div >

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Phone <
        /label> <
        input type = "tel"
        value = { formData.phone }
        onChange = {
            (e) => setFormData({...formData, phone: e.target.value })
        }
        className = "input" /
        >
        <
        /div>

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Address <
        /label> <
        textarea value = { formData.address }
        onChange = {
            (e) => setFormData({...formData, address: e.target.value })
        }
        rows = { 2 }
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
        disabled = { updateUserMutation.isLoading }
        className = "btn btn-primary" > { updateUserMutation.isLoading ? 'Updating...' : 'Update User' } <
        /button> < /
        div > <
        /form> < /
        div > <
        /div> < /
        div >
    );
};

export default Users;