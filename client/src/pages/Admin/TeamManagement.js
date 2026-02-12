import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: [],
    startDate: '',
    endDate: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/teams');
      setTeams(response.data.teams || []);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.log('Error fetching teams:', error);
      setTeams([]);
      // Don't show error for fetch failures
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users?role=intern');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await axios.put(`/teams/${editingId}`, formData);
      } else {
        await axios.post('/teams', formData);
      }
      setShowModal(false);
      resetForm();
      fetchTeams();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving team');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await axios.delete(`/teams/${id}`);
        fetchTeams();
      } catch (error) {
        setError('Error deleting team');
      }
    }
  };

  const handleEdit = (team) => {
    setEditingId(team._id);
    setFormData({
      name: team.name,
      description: team.description,
      members: team.members.map(m => m._id),
      startDate: team.startDate ? new Date(team.startDate).toISOString().split('T')[0] : '',
      endDate: team.endDate ? new Date(team.endDate).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      members: [],
      startDate: '',
      endDate: ''
    });
    setEditingId(null);
  };

  const handleMemberSelect = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData({ ...formData, members: selected });
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Team Management</h2>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          Create New Team
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Members</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team._id}>
                  <td><strong>{team.name}</strong></td>
                  <td>{team.description}</td>
                  <td>
                    <Badge bg="info">{team.members?.length || 0} members</Badge>
                  </td>
                  <td>
                    <Badge bg={team.status === 'active' ? 'success' : 'secondary'}>
                      {team.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-2"
                      onClick={() => handleEdit(team)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(team._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Edit Team' : 'Create New Team'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Team Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Select Members (Hold Ctrl/Cmd to select multiple)</Form.Label>
              <Form.Control
                as="select"
                multiple
                value={formData.members}
                onChange={handleMemberSelect}
                style={{ height: '150px' }}
              >
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingId ? 'Update Team' : 'Create Team'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default TeamManagement;
