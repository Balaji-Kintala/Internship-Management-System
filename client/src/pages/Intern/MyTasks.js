import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    content: '',
    files: []
  });

  useEffect(() => {
    fetchTasks();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', submissionForm.content);
      
      if (submissionForm.files.length > 0) {
        Array.from(submissionForm.files).forEach(file => {
          formData.append('files', file);
        });
      }

      await axios.post(`/tasks/${selectedTask._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowModal(false);
      setSubmissionForm({ content: '', files: [] });
      fetchTasks();
    } catch (error) {
      setError(error.response?.data?.message || 'Error submitting task');
    }
  };

  const openSubmitModal = (task) => {
    setSelectedTask(task);
    setShowModal(true);
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

  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
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
      <h2 className="mb-4">My Tasks</h2>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Row>
        {tasks.map(task => (
          <Col md={6} lg={4} key={task._id}>
            <Card className={`task-card ${getPriorityClass(task.priority)} mb-4`}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="mb-0">{task.title}</h5>
                  {getStatusBadge(task.status)}
                </div>
                
                <p className="text-muted">{task.description}</p>
                
                <div className="mb-3">
                  <small className="text-muted">
                    <strong>Priority:</strong>{' '}
                    <Badge bg={
                      task.priority === 'urgent' ? 'danger' :
                      task.priority === 'high' ? 'warning' :
                      task.priority === 'medium' ? 'info' : 'secondary'
                    }>
                      {task.priority}
                    </Badge>
                  </small>
                </div>

                {task.dueDate && (
                  <div className="mb-3">
                    <small className="text-muted">
                      <strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}
                    </small>
                  </div>
                )}

                {task.submissions && task.submissions.length > 0 ? (
                  <div className="mb-3">
                    <Badge bg="success">Submitted</Badge>
                    {task.submissions[0].feedback && (
                      <div className="mt-2">
                        <small className="text-muted">
                          <strong>Feedback:</strong> {task.submissions[0].feedback}
                        </small>
                      </div>
                    )}
                    {task.submissions[0].score !== undefined && (
                      <div className="mt-1">
                        <small className="text-muted">
                          <strong>Score:</strong> {task.submissions[0].score}
                        </small>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openSubmitModal(task)}
                    disabled={task.status === 'completed'}
                  >
                    Submit Task
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {tasks.length === 0 && (
        <Card>
          <Card.Body className="text-center py-5">
            <h5 className="text-muted">No tasks assigned yet</h5>
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Submit Task: {selectedTask?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Submission Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={submissionForm.content}
                onChange={(e) => setSubmissionForm({ ...submissionForm, content: e.target.value })}
                placeholder="Describe your work, findings, or solution..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Attach Files (Optional)</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={(e) => setSubmissionForm({ ...submissionForm, files: e.target.files })}
              />
              <Form.Text className="text-muted">
                You can upload multiple files (max 5)
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Submit Task
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default MyTasks;
