import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const Register = () => {
  // --- State ---
  // Store what the user is typing, based on your backend fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Assuming phone is a string

  // Store UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Hooks ---
  // Get the 'navigate' function from react-router to redirect
  const navigate = useNavigate();

  // --- Handlers ---
  const handleSubmit = async (e) => {
    // 1. Prevent the form from refreshing the page
    e.preventDefault();

    // 2. Clear old messages and set loading state
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 3. Make the API call to our backend's register endpoint
      await apiClient.post('/auth/register', {
        firstName,
        lastName,
        email,
        phone,
      });

      // 4. On success:
      //    - Show a success message
      setSuccess('Registration successful! Redirecting to login...');
      
      //    - Wait 2 seconds, then redirect the user to the login page
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      // 5. On failure:
      //    - Grab the error message from the API response
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      // 6. Always stop loading, unless we're in a success state
      if (!success) {
        setLoading(false);
      }
    }
  };

  // --- JSX (The UI) ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Create your account
        </h2>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {/* Show error message */}
          {error && (
            <p className="p-3 text-sm text-center text-red-800 bg-red-100 rounded-md">
              {error}
            </p>
          )}

          {/* Show success message */}
          {success && (
            <p className="p-3 text-sm text-center text-green-800 bg-green-100 rounded-md">
              {success}
            </p>
          )}

          <div className="flex space-x-4">
            <div className="w-1/2">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel" // Use 'tel' type for phone numbers
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

