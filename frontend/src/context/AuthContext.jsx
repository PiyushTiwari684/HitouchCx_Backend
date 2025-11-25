import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the Context
// This creates the "box" that will hold our data (token, login function, etc.)
// We initialize it with 'null' because there's no data at the start.
const AuthContext = createContext(null);

// 2. Create the Provider Component
// This component will wrap our entire app. Its job is to manage
// the 'token' state and "provide" it to all children components.
export const AuthProvider = ({ children }) => {
  // We use 'useState' to hold the token in component state.
  // 'null' means the user is not logged in.
  const [token, setToken] = useState(null);

  // This 'loading' state is important. We need to check localStorage
  // for an *existing* token when the app first loads.
  // We don't want to render the app until this check is done.
  const [loading, setLoading] = useState(true);

  // 3. useEffect: Runs once when the AuthProvider first loads
  useEffect(() => {
    // Check if a token was saved from a previous session
    const storedToken = localStorage.getItem('authToken');

    // Ignore invalid values like the string 'undefined' or 'null'
    if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
      // If we find a token, update our state
      setToken(storedToken);
      // **LATER**: We will also add the token to apiClient headers here
    }
    
    // We are done checking, so set loading to false.
    setLoading(false);
  }, []); // The empty array [] means "run this only once on mount"

  // 4. Login Function
  // This function will be given to our Login page.
  const login = (newToken) => {
    // Only persist and set truthy tokens
    if (newToken) {
      // Save the token to localStorage to persist across page reloads
      localStorage.setItem('authToken', newToken);
      // Update the token in our state, which will re-render components
      setToken(newToken);
    } else {
      // Avoid storing invalid tokens like undefined/null
      console.warn('AuthProvider.login called with empty token:', newToken);
    }
    // **LATER**: We will also add the token to apiClient headers here
  };

  // 5. Logout Function
  // This function can be called from a "Logout" button anywhere in the app.
  const logout = () => {
    // Remove the token from localStorage
    localStorage.removeItem('authToken');
    // Set the token state back to 'null'
    setToken(null);
    // **LATER**: We will also *remove* the token from apiClient headers here
  };

  // 6. The 'value' object
  // This is the actual data we are "providing" to all our children.
  // Any component will be able to access these.
  const value = {
    token,
    isAuthenticated: !!token, // A simple boolean: true if token exists, false if null
    login,
    logout,
  };

  // 7. Render the children
  // We wait until 'loading' is false before rendering the rest of the app.
  // This prevents a "flash" where the app briefly shows the login page
  // even if the user is already authenticated.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 8. Create a Custom Hook
// This is a simple shortcut for our components.
// Instead of importing 'useContext' and 'AuthContext' every time,
// they can just call 'useAuth()' to get the data.
export const useAuth = () => {
  const context = useContext(AuthContext);

  // This is a safety check. If we try to use useAuth() outside
  // of the AuthProvider, we'll get a clear error message.
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

