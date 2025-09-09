import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Building,
    Calendar,
    Key,
    Save,
    Edit,
    X
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        defaultValues: {
            first_name: user ?.first_name || '',
            last_name: user ?.last_name || '',
            email: user ?.email || '',
            phone: user ?.phone || '',
            address: user ?.address || '',
            department: user ?.department || '',
            position: user ?.position || ''
        }
    });

    // Update profile mutation
    const updateProfileMutation = useMutation(
        (data) => authAPI.updateProfile(data), {
            onSuccess: (response) => {
                updateUser(response.data.user);
                setIsEditing(false);
                toast.success('Profile updated successfully!');
            },
            onError: (error) => {
                toast.error(error.response ?.data ?.message || 'Failed to update profile');
            }
        }
    );

    // Change password mutation
    const changePasswordMutation = useMutation(
        (data) => authAPI.changePassword(data.currentPassword, data.newPassword), {
            onSuccess: () => {
                setShowPasswordModal(false);
                toast.success('Password changed successfully!');
            },
            onError: (error) => {
                toast.error(error.response ?.data ?.message || 'Failed to change password');
            }
        }
    );

    const onSubmit = (data) => {
        updateProfileMutation.mutate(data);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    const getRoleColor = (role) => {
        const colors = {
            admin: 'bg-red-100 text-red-800',
            manager: 'bg-blue-100 text-blue-800',
            employee: 'bg-green-100 text-green-800'
        };
        return colors[role] || colors.employee;
    };

    return ( <
            div className = "space-y-6" > { /* Header */ } <
            div className = "flex justify-between items-center" >
            <
            div >
            <
            h1 className = "text-2xl font-bold text-gray-900" > Profile < /h1> <
            p className = "text-gray-600" > Manage your personal information and account settings < /p> < /
            div > {!isEditing && ( <
                    button onClick = { handleEdit }
                    className = "btn btn-primary flex items-center" >
                    <
                    Edit className = "w-4 h-4 mr-2" / >
                    Edit Profile <
                    /button>
                )
            } <
            /div>

            { /* Profile Information */ } <
            div className = "grid grid-cols-1 lg:grid-cols-3 gap-6" > { /* Profile Card */ } <
            div className = "lg:col-span-1" >
            <
            div className = "card text-center" >
            <
            div className = "flex justify-center mb-4" >
            <
            div className = "h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center" >
            <
            User className = "h-12 w-12 text-primary-600" / >
            <
            /div> < /
            div > <
            h2 className = "text-xl font-bold text-gray-900 mb-2" > { user ?.first_name } { user ?.last_name } <
            /h2> <
            p className = "text-gray-600 mb-2" > { user ?.position || 'Employee' } < /p> <
            span className = { `badge ${getRoleColor(user?.role)}` } > { user ?.role ?.toUpperCase() } <
            /span> <
            div className = "mt-4 text-sm text-gray-500" >
            <
            p > Employee ID: { user ?.employee_id } < /p> <
            p > Member since { user ?.created_at ? format(parseISO(user.created_at), 'MMM yyyy') : 'N/A' } < /p> < /
            div > <
            /div>

            { /* Quick Actions */ } <
            div className = "card mt-6" >
            <
            h3 className = "text-lg font-medium text-gray-900 mb-4" > Quick Actions < /h3> <
            div className = "space-y-3" >
            <
            button onClick = {
                () => setShowPasswordModal(true)
            }
            className = "w-full btn btn-secondary flex items-center justify-center" >
            <
            Key className = "w-4 h-4 mr-2" / >
            Change Password <
            /button> < /
            div > <
            /div> < /
            div >

            { /* Profile Details */ } <
            div className = "lg:col-span-2" >
            <
            div className = "card" >
            <
            h3 className = "text-lg font-medium text-gray-900 mb-6" > Personal Information < /h3>

            {
                isEditing ? ( <
                        form onSubmit = { handleSubmit(onSubmit) }
                        className = "space-y-6" >
                        <
                        div className = "grid grid-cols-1 md:grid-cols-2 gap-6" >
                        <
                        div >
                        <
                        label className = "block text-sm font-medium text-gray-700 mb-1" >
                        First Name *
                        <
                        /label> <
                        input {...register('first_name', { required: 'First name is required' }) }
                        type = "text"
                        className = { `input ${errors.first_name ? 'border-red-300' : ''}` }
                        /> {
                        errors.first_name && ( <
                            p className = "mt-1 text-sm text-red-600" > { errors.first_name.message } < /p>
                        )
                    } <
                    /div>

                <
                div >
                    <
                    label className = "block text-sm font-medium text-gray-700 mb-1" >
                    Last Name *
                    <
                    /label> <
                input {...register('last_name', { required: 'Last name is required' }) }
                type = "text"
                className = { `input ${errors.last_name ? 'border-red-300' : ''}` }
                /> {
                errors.last_name && ( <
                    p className = "mt-1 text-sm text-red-600" > { errors.last_name.message } < /p>
                )
            } <
            /div> < /
            div >

            <
            div >
            <
            label className = "block text-sm font-medium text-gray-700 mb-1" >
            Email Address *
            <
            /label> <
            input {...register('email', {
                    required: 'Email is required',
                    pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                    }
                })
            }
            type = "email"
            className = { `input ${errors.email ? 'border-red-300' : ''}` }
            /> {
            errors.email && ( <
                p className = "mt-1 text-sm text-red-600" > { errors.email.message } < /p>
            )
        } <
        /div>

    <
    div className = "grid grid-cols-1 md:grid-cols-2 gap-6" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Phone Number <
        /label> <
    input {...register('phone') }
    type = "tel"
    className = "input" /
        >
        <
        /div>

    <
    div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Department <
        /label> <
    input {...register('department') }
    type = "text"
    className = "input" /
        >
        <
        /div> < /
    div >

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Position <
        /label> <
    input {...register('position') }
    type = "text"
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
    textarea {...register('address') }
    rows = { 3 }
    className = "input" /
        >
        <
        /div>

    <
    div className = "flex justify-end space-x-3 pt-4 border-t" >
        <
        button type = "button"
    onClick = { handleCancel }
    className = "btn btn-secondary" >
        Cancel <
        /button> <
    button type = "submit"
    disabled = { updateProfileMutation.isLoading }
    className = "btn btn-primary flex items-center" >
        <
        Save className = "w-4 h-4 mr-2" / > { updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes' } <
        /button> < /
    div > <
        /form>
): ( <
    div className = "space-y-6" >
    <
    div className = "grid grid-cols-1 md:grid-cols-2 gap-6" >
    <
    div className = "flex items-center" >
    <
    Mail className = "h-5 w-5 text-gray-400 mr-3" / >
    <
    div >
    <
    p className = "text-sm font-medium text-gray-500" > Email < /p> <
    p className = "text-sm text-gray-900" > { user ?.email } < /p> < /
    div > <
    /div>

    <
    div className = "flex items-center" >
    <
    Phone className = "h-5 w-5 text-gray-400 mr-3" / >
    <
    div >
    <
    p className = "text-sm font-medium text-gray-500" > Phone < /p> <
    p className = "text-sm text-gray-900" > { user ?.phone || 'Not provided' } < /p> < /
    div > <
    /div>

    <
    div className = "flex items-center" >
    <
    Building className = "h-5 w-5 text-gray-400 mr-3" / >
    <
    div >
    <
    p className = "text-sm font-medium text-gray-500" > Department < /p> <
    p className = "text-sm text-gray-900" > { user ?.department || 'Not specified' } < /p> < /
    div > <
    /div>

    <
    div className = "flex items-center" >
    <
    User className = "h-5 w-5 text-gray-400 mr-3" / >
    <
    div >
    <
    p className = "text-sm font-medium text-gray-500" > Position < /p> <
    p className = "text-sm text-gray-900" > { user ?.position || 'Not specified' } < /p> < /
    div > <
    /div>

    <
    div className = "flex items-center" >
    <
    Calendar className = "h-5 w-5 text-gray-400 mr-3" / >
    <
    div >
    <
    p className = "text-sm font-medium text-gray-500" > Hire Date < /p> <
    p className = "text-sm text-gray-900" > { user ?.hire_date ? format(parseISO(user.hire_date), 'MMM dd, yyyy') : 'Not specified' } <
    /p> < /
    div > <
    /div>

    <
    div className = "flex items-center" >
    <
    MapPin className = "h-5 w-5 text-gray-400 mr-3" / >
    <
    div >
    <
    p className = "text-sm font-medium text-gray-500" > Address < /p> <
    p className = "text-sm text-gray-900" > { user ?.address || 'Not provided' } < /p> < /
    div > <
    /div> < /
    div > <
    /div>
)
} <
/div> < /
div > <
    /div>

{ /* Change Password Modal */ } {
    showPasswordModal && ( <
        ChangePasswordModal onClose = {
            () => setShowPasswordModal(false)
        }
        onSubmit = {
            (data) => changePasswordMutation.mutate(data)
        }
        isLoading = { changePasswordMutation.isLoading }
        />
    )
} <
/div>
);
};

// Change Password Modal Component
const ChangePasswordModal = ({ onClose, onSubmit, isLoading }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm();

    const newPassword = watch('newPassword');

    const handleFormSubmit = (data) => {
        onSubmit(data);
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
        h3 className = "text-lg font-medium text-gray-900" > Change Password < /h3> <
        button onClick = { onClose }
        className = "text-gray-400 hover:text-gray-600" >
        <
        X className = "w-6 h-6" / >
        <
        /button> < /
        div >

        <
        form onSubmit = { handleSubmit(handleFormSubmit) }
        className = "space-y-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Current Password *
        <
        /label> <
        input {...register('currentPassword', { required: 'Current password is required' }) }
        type = "password"
        className = { `input ${errors.currentPassword ? 'border-red-300' : ''}` }
        placeholder = "Enter current password" /
        >
        {
            errors.currentPassword && ( <
                p className = "mt-1 text-sm text-red-600" > { errors.currentPassword.message } < /p>
            )
        } <
        /div>

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        New Password *
        <
        /label> <
        input {...register('newPassword', {
                required: 'New password is required',
                minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                }
            })
        }
        type = "password"
        className = { `input ${errors.newPassword ? 'border-red-300' : ''}` }
        placeholder = "Enter new password" /
        >
        {
            errors.newPassword && ( <
                p className = "mt-1 text-sm text-red-600" > { errors.newPassword.message } < /p>
            )
        } <
        /div>

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Confirm New Password *
        <
        /label> <
        input {...register('confirmPassword', {
                required: 'Please confirm your new password',
                validate: value => value === newPassword || 'Passwords do not match'
            })
        }
        type = "password"
        className = { `input ${errors.confirmPassword ? 'border-red-300' : ''}` }
        placeholder = "Confirm new password" /
        >
        {
            errors.confirmPassword && ( <
                p className = "mt-1 text-sm text-red-600" > { errors.confirmPassword.message } < /p>
            )
        } <
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
        disabled = { isLoading }
        className = "btn btn-primary" > { isLoading ? 'Changing...' : 'Change Password' } <
        /button> < /
        div > <
        /form> < /
        div > <
        /div> < /
        div >
    );
};

export default Profile;