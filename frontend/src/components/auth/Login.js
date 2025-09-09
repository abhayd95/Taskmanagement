import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const onSubmit = async(data) => {
        setIsLoading(true);
        try {
            const result = await login(data.email, data.password);
            if (result.success) {
                toast.success('Login successful!');
            } else {
                toast.error(result.message || 'Login failed');
            }
        } catch (error) {
            toast.error('An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return ( <
        div className = "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" >
        <
        div className = "max-w-md w-full space-y-8" >
        <
        div >
        <
        div className = "mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100" >
        <
        LogIn className = "h-6 w-6 text-primary-600" / >
        <
        /div> <
        h2 className = "mt-6 text-center text-3xl font-extrabold text-gray-900" >
        Sign in to your account <
        /h2> <
        p className = "mt-2 text-center text-sm text-gray-600" >
        OrbAi Attendance & Task Management System <
        /p> <
        /div>

        <
        form className = "mt-8 space-y-6"
        onSubmit = { handleSubmit(onSubmit) } >
        <
        div className = "space-y-4" >
        <
        div >
        <
        label htmlFor = "email"
        className = "block text-sm font-medium text-gray-700" >
        Email address <
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
        autoComplete = "email"
        className = { `mt-1 input ${errors.email ? 'border-red-300' : ''}` }
        placeholder = "Enter your email" /
        > {
            errors.email && ( <
                p className = "mt-1 text-sm text-red-600" > { errors.email.message } < /p>
            )
        } <
        /div>

        <
        div >
        <
        label htmlFor = "password"
        className = "block text-sm font-medium text-gray-700" >
        Password <
        /label> <
        div className = "mt-1 relative" >
        <
        input {...register('password', {
                required: 'Password is required',
                minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                }
            })
        }
        type = { showPassword ? 'text' : 'password' }
        autoComplete = "current-password"
        className = { `input pr-10 ${errors.password ? 'border-red-300' : ''}` }
        placeholder = "Enter your password" /
        >
        <
        button type = "button"
        className = "absolute inset-y-0 right-0 pr-3 flex items-center"
        onClick = {
            () => setShowPassword(!showPassword) } >
        {
            showPassword ? ( <
                EyeOff className = "h-5 w-5 text-gray-400" / >
            ) : ( <
                Eye className = "h-5 w-5 text-gray-400" / >
            )
        } <
        /button> <
        /div> {
            errors.password && ( <
                p className = "mt-1 text-sm text-red-600" > { errors.password.message } < /p>
            )
        } <
        /div> <
        /div>

        <
        div >
        <
        button type = "submit"
        disabled = { isLoading }
        className = "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed" >
        {
            isLoading ? ( <
                div className = "animate-spin rounded-full h-5 w-5 border-b-2 border-white" > < /div>
            ) : (
                'Sign in'
            )
        } <
        /button> <
        /div>

        <
        div className = "mt-6 p-4 bg-blue-50 rounded-lg" >
        <
        h3 className = "text-sm font-medium text-blue-800 mb-2" > Demo Credentials: < /h3> <
        div className = "text-xs text-blue-700 space-y-1" >
        <
        p > < strong > Admin: < /strong> admin@orbai.com /
        admin123 < /p> <
        p > < strong > Manager: < /strong> manager@orbai.com /
        admin123 < /p> <
        p > < strong > Employee: < /strong> alice.johnson@orbai.com /
        admin123 < /p> <
        /div> <
        /div> <
        /form> <
        /div> <
        /div>
    );
};

export default Login;