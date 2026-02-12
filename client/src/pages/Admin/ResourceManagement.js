import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    url: '',
    team: '',
    tags: '',
    isPublic: false,
    file: null
  });

  useEffect(() => {
    fetchResources();
    fetchTeams();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await axios.get('/resources');
      setResources(response.data.resources || []);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.log('Error fetching resources:', error);
      setResources([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('url', formData.url);
      formDataToSend.append('team', formData.team);
      formDataToSend.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim())));
      formDataToSend.append('isPublic', formData.isPublic);
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      await axios.post('/resources', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowModal(false);
      resetForm();
      fetchResources();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving resource');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await axios.delete(`/resources/${id}`);
        fetchResources();
      } catch (error) {
        setError('Error deleting resource');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'document',
      url: '',
      team: '',
      tags: '',
      isPublic: false,
      file: null
    });
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
        <h2>Resource Management</h2>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          Add New Resource
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Team</th>
                <th>Visibility</th>
                <th>Uploaded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(resource => (
                <tr key={resource._id}>
                  <td><strong>{resource.title}</strong></td>
                  <td><Badge bg="primary">{resource.type}</Badge></td>
                  <td>{resource.team?.name || 'All'}</td>
                  <td>
                    <Badge bg={resource.isPublic ? 'success' : 'secondary'}>
                      {resource.isPublic ? 'Public' : 'Team Only'}
                    </Badge>
                  </td>
                  <td>{resource.uploadedBy?.name}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(resource._id)}
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
          <Modal.Title>Add New Resource</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
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
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="document">Document</option>
                <option value="video">Video</option>
                <option value="link">Link</option>
                <option value="code">Code</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>URL (Optional)</Form.Label>
              <Form.Control
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Upload File (Optional)</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Team</Form.Label>
              <Form.Select
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tags (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="react, javascript, tutorial"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Make this resource public"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Add Resource
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default ResourceManagement;
