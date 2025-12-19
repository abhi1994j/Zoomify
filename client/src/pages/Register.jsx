import React, { useContext, useState } from 'react';
import '../styles/LoginRegister.css';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);

  // Form validation
  const validate = () => {
    if (!username.trim()) {
      toast.error('Username is required');
      return false;
    } else if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return false;
    }

    if (!email.trim()) {
      toast.error('Email is required');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!password) {
      toast.error('Password is required');
      return false;
    } else if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      const inputs = { username, email, password };
      await register(inputs);
      toast.success('Registration successful!');
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="formContainer">
      <div className="smart-header">
        <div className="smart-logo">
          <h2>
            <Link id="smart-logo-h2" to={'/'}>
              Zoomify
            </Link>
          </h2>
        </div>
      </div>

      <div className="formWrapper">
        <span className="title">Register</span>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-3">
          Already registered? <Link to={'/login'}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
