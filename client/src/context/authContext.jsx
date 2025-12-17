import axios from 'axios';
import { createContext, useState } from 'react';
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

    navigate('/');
  };
  console.log(`${process.env.REACT_APP_API_BASE_URL}/auth/register`);
  const register = async (inputs) => {
    const res = await axios.post(
      `${process.env.REACT_APP_API_BASE_URL}/auth/register`,
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

    navigate('/');
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
