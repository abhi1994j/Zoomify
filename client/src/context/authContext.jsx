import axios from 'axios';
import { createContext, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const id = localStorage.getItem('userId');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');

    return id ? { id, name, email } : null;
  });

  const login = async (inputs) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/auth/login`,
        inputs
      );

      localStorage.setItem('userToken', res.data.token);
      localStorage.setItem('userId', res.data.user._id);
      localStorage.setItem('userName', res.data.user.username);
      localStorage.setItem('userEmail', res.data.user.email);

      setUser({
        id: res.data.user._id,
        name: res.data.user.username,
        email: res.data.user.email,
      });

      toast.success('Login successful');
      navigate('/');
    } catch (error) {
      // ❗ Do not rethrow
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Invalid email or password';

      toast.error(message);
    }
  };

  console.log(`${process.env.REACT_APP_API_BASE_URL}/auth/register`);
  const register = async (inputs) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/auth/register`,
        inputs
      );

      // Save user data in localStorage
      localStorage.setItem('userToken', res.data.token);
      localStorage.setItem('userId', res.data.user._id);
      localStorage.setItem('userName', res.data.user.username);
      localStorage.setItem('userEmail', res.data.user.email);

      // Set user context
      setUser({
        id: res.data.user._id,
        name: res.data.user.username,
        email: res.data.user.email,
      });

      toast.success('Registration successful!');
      navigate('/'); // Redirect to homepage or dashboard
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    }
  };
  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
