import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Shield } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/login', { email, password });
            login(data.token, data.user);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-lg w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center">
                        <Shield className="text-neon-pink" size={32} />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-1">Welcome Back</h2>
                <p className="text-gray-500 text-center mb-8">Sign in to access your CRM</p>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
                            placeholder="admin@elite24.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition transform active:scale-95"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    Protected by Amarillo Security
                </div>
            </div>
        </div>
    );
}
