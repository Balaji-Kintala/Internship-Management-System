import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Alert, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filters, setFilters] = useState({
    role: '',
    status: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filters, users]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data.users || []);
      setFilteredUsers(response.data.users || []);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.log('Error fetching users:', error);
      setUsers([]);
      setFilteredUsers([]);
      // Don't show error for fetch failures
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;
    
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }
    
    if (filters.status) {
      filtered = filtered.filter(user => user.status === filters.status);
    }
    
    setFilteredUsers(filtered);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      active: 'success',
      qualified: 'success',
      disqualified: 'danger',
      completed: 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">User Management</h2>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Role</Form.Label>
                <Form.Select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="intern">Intern</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="qualified">Qualified</option>
                  <option value="disqualified">Disqualified</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Team</th>
                <th>Status</th>
                <th>Exam Score</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td>
                    <Badge bg={user.role === 'admin' ? 'primary' : 'info'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td>{user.team?.name || 'Not Assigned'}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>
                    {user.examTaken ? (
                      <Badge bg="success">{user.examScore}</Badge>
                    ) : (
                      <Badge bg="secondary">Not Taken</Badge>
                    )}
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

export default UserManagement;
