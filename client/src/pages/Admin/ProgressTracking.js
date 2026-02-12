import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Alert, Form, Button, Modal, Row, Col } from 'react-bootstrap';
import axios from 'axios';

function ProgressTracking() {
  const [progressData, setProgressData] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchProgress();
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/teams');
      setTeams(response.data.teams);
      if (response.data.teams.length > 0) {
        setSelectedTeam(response.data.teams[0]._id);
      }
    } catch (error) {
      setError('Error fetching teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/progress/team/${selectedTeam}`);
      setProgressData(response.data.progress || []);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.log('Error fetching progress data:', error);
      setProgressData([]);
      // Don't show error for fetch failures
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/progress/${selectedUser}/review`, reviewForm);
      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
      fetchProgress();
    } catch (error) {
      setError('Error adding review');
    }
  };

  const openReviewModal = (userId) => {
    setSelectedUser(userId);
    setShowReviewModal(true);
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
      <h2 className="mb-4">Progress Tracking</h2>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Select Team</Form.Label>
            <Form.Select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              {teams.map(team => (
                <option key={team._id} value={team._id}>{team.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Tasks Completed</th>
                <th>Average Score</th>
                <th>Overall Rating</th>
                <th>Reviews</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {progressData.map(progress => (
                <tr key={progress._id}>
                  <td><strong>{progress.user?.name}</strong></td>
                  <td>{progress.user?.email}</td>
                  <td>
                    <Badge bg="info">
                      {progress.tasksCompleted} / {progress.tasksAssigned}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg="success">
                      {progress.averageScore.toFixed(1)}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <span className="me-2">⭐</span>
                      <strong>{progress.overallRating.toFixed(1)}</strong>
                    </div>
                  </td>
                  <td>
                    <Badge bg="primary">{progress.reviews?.length || 0}</Badge>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => openReviewModal(progress.user._id)}
                    >
                      Add Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Review</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddReview}>
            <Form.Group className="mb-3">
              <Form.Label>Rating (1-5)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="5"
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowReviewModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Submit Review
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default ProgressTracking;
