import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BSNavbar bg="primary" variant="dark" expand="lg" className="mb-0">
      <Container fluid>
        <BSNavbar.Brand href={user?.role === 'admin' ? '/admin' : '/intern'}>
          Internship Management System
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <NavDropdown title={user?.name || 'User'} id="basic-nav-dropdown">
              <NavDropdown.Item href={`/${user?.role}/profile`}>
                Profile
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}

export default Navbar;
