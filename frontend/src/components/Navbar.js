import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          TMS
        </Link>
        
        {isAuthenticated ? (
          <>
            <div className="nav-links">
              <Link to="/complaints/new" className="nav-link">Raise Complaint</Link>
              {user?.role !== 'SuperAdmin' && <Link to="/my-complaints" className="nav-link">My Complaints</Link>}
              {user?.role === 'SuperAdmin' && (
                <>
                  <Link to="/departments" className="nav-link">Departments</Link>
                  <Link to="/programmes" className="nav-link">Programmes</Link>
                  <Link to="/blocks" className="nav-link">Blocks</Link>
                  <Link to="/rooms" className="nav-link">Rooms</Link>
                  <Link to="/roles" className="nav-link">Roles</Link>
                  <Link to="/users" className="nav-link">Users</Link>
                </>
              )}
              {user?.role === 'SuperAdmin' && <Link to="/complaints" className="nav-link">All Complaints</Link>}
            </div>

            <div className="nav-actions">
              <span className="nav-user">Hello, {user?.username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </>
        ) : (
          <div className="nav-links">
            <Link to="/login" className="nav-link">Login</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
