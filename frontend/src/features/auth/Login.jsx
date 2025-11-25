import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const Login = () => {
  // --- State ---
  // Store what the user is typing
  const [email, setEmail] = useState('');
  
  // Store any error messages from the backend
  const [error, setError] = useState('');
  
  // Store loading state to disable button
  const [loading, setLoading] = useState(false);

  // --- Hooks ---
  // Get the 'login' function from our global AuthContext
  const { login } = useAuth();
  
  // Get the 'navigate' function from react-router to redirect
  const navigate = useNavigate();

  // --- Handlers ---
  const handleSubmit = async (e) => {
    // 1. Prevent the form from refreshing the page
    e.preventDefault();

    // 2. Clear old errors and set loading state
    setError('');
    setLoading(true);

    try {
      // 3. Make the API call to our backend's login endpoint
      //    **MODIFIED:** Only sending 'email' as requested
      const response = await apiClient.post('/auth/login', {
        email,
      });

      // 4. On success:
      //    - Get the 'token' from the response data
        // Try common locations for a token in different API shapes
        const data = response.data || {};
        const token = data.token || data.accessToken || data?.data?.token || data?.data?.accessToken;

        // Debug: log the full response to help diagnose backend issues (can remove later)
        console.log('Login response data:', data);

        if (!token) {
          // Provide backend response in error to make debugging easier
          const debugMsg = JSON.stringify(data).slice(0, 200);
          throw new Error('No token returned from login API. Response: ' + debugMsg);
        }

        //    - Call our global 'login' function with the new token
        login(token);

        //    - Redirect the user to the homepage
        navigate('/');

    } catch (err) {
      // 5. On failure:
      //    - Grab the error message from the API response
      //    - Fallback to a generic message if one isn't provided
      //    **MODIFIED:** Changed error message
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your email and try again.';
      setError(errorMessage);
    } finally {
      // 6. Always stop loading, whether success or failure
      setLoading(false);
    }
  };

  // --- JSX (The UI) ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Log in to your account
        </h2>
        
        {/* We use 'onSubmit' on the <form> element */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Show error message if 'error' state is not empty */}
          {error && (
            <p className="p-3 text-sm text-center text-red-800 bg-red-100 rounded-md">
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
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
          
          {/* **REMOVED:** Password field is no longer here */}
          
          <button
            type="submit"
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;