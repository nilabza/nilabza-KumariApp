
import React, { useState } from 'react';
import { HeartIcon } from './icons';

interface AuthProps {
  onAuthSuccess: (phoneNumber: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const getUsers = () => {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : {};
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (phoneNumber.length < 10 || password.length < 6) {
      setError('Phone number must be at least 10 digits and password at least 6 characters.');
      return;
    }

    const users = getUsers();
    if (users[phoneNumber]) {
      setError('This phone number is already registered. Please log in.');
      return;
    }

    // NOTE: In a real application, the password should be hashed before storage.
    users[phoneNumber] = password; 
    localStorage.setItem('users', JSON.stringify(users));
    onAuthSuccess(phoneNumber);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }
    const users = getUsers();
    if (!users[phoneNumber]) {
      setError('No account found for this number. Please sign up.');
      return;
    }
    onAuthSuccess(phoneNumber);
  };
  
  const toggleMode = () => {
    setError('');
    setPassword('');
    setPhoneNumber('');
    setMode(prevMode => (prevMode === 'login' ? 'signup' : 'login'));
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-100 p-4 sm:p-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-pink-500 flex items-center justify-center mb-4">
                <HeartIcon className="w-10 h-10 text-white"/>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome to KUMARI</h1>
            <p className="text-slate-500">{mode === 'login' ? 'Log in to continue' : 'Create an account'}</p>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleSignUp} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="phoneNumber">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="Your 10-digit phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              minLength={10}
            />
          </div>
          {mode === 'signup' && (
            <div className="mb-6">
              <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="******************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-slate-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                minLength={6}
              />
               <p className="text-xs text-slate-500">Must be at least 6 characters long.</p>
            </div>
          )}
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors w-full"
            >
              {mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </div>
          <p className="text-center text-sm text-slate-600 mt-4">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button type="button" onClick={toggleMode} className="font-bold text-blue-500 hover:text-blue-700 ml-1 focus:outline-none">
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Auth;
