import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';

function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    team: '',
    assignedTo: [],
    priority: 'medium',
    dueDate: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchTeams();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/tasks');
      setTasks(response.data.tasks || []);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.log('Error fetching tasks:', error);
      setTasks([]);
      // Don't show error for fetch failures
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/teams');
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchTeamMembers = async (teamId) => {
    try {
      const response = await axios.get(`/teams/${teamId}`);
      setUsers(response.data.team.members);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('team', formData.team);
      formDataToSend.append('assignedTo', JSON.stringify(formData.assignedTo));
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('dueDate', formData.dueDate);

      if (editingId) {
        await axios.put(`/tasks/${editingId}`, formData);
      } else {
        await axios.post('/tasks', formDataToSend);
      }
      setShowModal(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving task');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`/tasks/${id}`);
        fetchTasks();
      } catch (error) {
        setError('Error deleting task');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      team: '',
      assignedTo: [],
      priority: 'medium',
      dueDate: ''
    });
    setEditingId(null);
    setUsers([]);
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      urgent: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'secondary'
    };
    return <Badge bg={variants[priority]}>{priority}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      'in-progress': 'primary',
      review: 'info',
      completed: 'success',
      cancelled: 'danger'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
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
        <h2>Task Management</h2>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          Create New Task
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Title</th>
                <th>Team</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id}>
                  <td><strong>{task.title}</strong></td>
                  <td>{task.team?.name}</td>
                  <td>
                    <Badge bg="info">{task.assignedTo?.length || 0} members</Badge>
                  </td>
                  <td>{getPriorityBadge(task.priority)}</td>
                  <td>{getStatusBadge(task.status)}</td>
                  <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(task._id)}
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
          <Modal.Title>Create New Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Task Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Team</Form.Label>
                  <Form.Select
                    value={formData.team}
                    onChange={(e) => {
                      setFormData({ ...formData, team: e.target.value, assignedTo: [] });
                      fetchTeamMembers(e.target.value);
                    }}
                    required
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Assign To (Hold Ctrl/Cmd to select multiple)</Form.Label>
              <Form.Control
                as="select"
                multiple
                value={formData.assignedTo}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData({ ...formData, assignedTo: selected });
                }}
                style={{ height: '120px' }}
                disabled={!formData.team}
              >
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Create Task
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default TaskManagement;
