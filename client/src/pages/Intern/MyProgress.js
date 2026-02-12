import React, { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Badge, Table, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

function MyProgress() {
  const { user } = useContext(AuthContext);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`/progress/user/${user.id}`);
      setProgress(response.data.progress);
    } catch (error) {
      setError('Error fetching progress data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const completionPercentage = progress?.tasksAssigned > 0
    ? (progress.tasksCompleted / progress.tasksAssigned) * 100
    : 0;

  return (
    <div>
      <h2 className="mb-4">My Progress</h2>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Row className="mb-4">
        <Col md={3}>
          <Card className="dashboard-card">
            <Card.Body>
              <h6 className="text-muted mb-2">Tasks Assigned</h6>
              <h2 className="mb-0">{progress?.tasksAssigned || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card success">
            <Card.Body>
              <h6 className="text-muted mb-2">Tasks Completed</h6>
              <h2 className="mb-0">{progress?.tasksCompleted || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card warning">
            <Card.Body>
              <h6 className="text-muted mb-2">Average Score</h6>
              <h2 className="mb-0">{progress?.averageScore?.toFixed(1) || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card danger">
            <Card.Body>
              <h6 className="text-muted mb-2">Overall Rating</h6>
              <h2 className="mb-0">⭐ {progress?.overallRating?.toFixed(1) || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Task Completion Progress</h5>
              <ProgressBar
                now={completionPercentage}
                label={`${completionPercentage.toFixed(0)}%`}
                variant="success"
                style={{ height: '30px' }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Reviews & Feedback</h5>
            </Card.Header>
            <Card.Body>
              {progress?.reviews && progress.reviews.length > 0 ? (
                <div>
                  {progress.reviews.map((review, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong>{review.reviewedBy?.name}</strong>
                          <Badge bg="warning">
                            {review.rating} ⭐
                          </Badge>
                        </div>
                        <p className="mb-1">{review.comment}</p>
                        <small className="text-muted">
                          {new Date(review.date).toLocaleDateString()}
                        </small>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No reviews yet</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Milestones Achieved</h5>
            </Card.Header>
            <Card.Body>
              {progress?.milestones && progress.milestones.length > 0 ? (
                <div>
                  {progress.milestones.map((milestone, index) => (
                    <Card key={index} className="mb-3 border-success">
                      <Card.Body>
                        <h6 className="text-success">🏆 {milestone.title}</h6>
                        <p className="mb-1 small">{milestone.description}</p>
                        <small className="text-muted">
                          {new Date(milestone.achievedAt).toLocaleDateString()}
                        </small>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No milestones achieved yet</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {progress?.attendance && progress.attendance.length > 0 && (
        <Row className="mt-4">
          <Col md={12}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Attendance Record</h5>
              </Card.Header>
              <Card.Body>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.attendance.slice(-10).reverse().map((record, index) => (
                      <tr key={index}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>
                          <Badge bg={
                            record.status === 'present' ? 'success' :
                            record.status === 'late' ? 'warning' : 'danger'
                          }>
                            {record.status}
                          </Badge>
                        </td>
                        <td>{record.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default MyProgress;
