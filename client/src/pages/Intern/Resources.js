import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import axios from 'axios';

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchResources();
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

  const getTypeIcon = (type) => {
    const icons = {
      document: '📄',
      video: '🎥',
      link: '🔗',
      code: '💻',
      other: '📦'
    };
    return icons[type] || '📄';
  };

  const getTypeBadge = (type) => {
    const variants = {
      document: 'primary',
      video: 'danger',
      link: 'info',
      code: 'success',
      other: 'secondary'
    };
    return <Badge bg={variants[type]}>{type}</Badge>;
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(filter.toLowerCase()) ||
    resource.description?.toLowerCase().includes(filter.toLowerCase()) ||
    resource.tags?.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Learning Resources</h2>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Search resources by title, description, or tags..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Row>
        {filteredResources.map(resource => (
          <Col md={6} lg={4} key={resource._id}>
            <Card className="mb-4 h-100">
              <Card.Body>
                <div className="text-center resource-icon">
                  {getTypeIcon(resource.type)}
                </div>
                
                <h5 className="text-center mb-3">{resource.title}</h5>
                
                <div className="text-center mb-3">
                  {getTypeBadge(resource.type)}
                </div>

                {resource.description && (
                  <p className="text-muted small">{resource.description}</p>
                )}

                {resource.tags && resource.tags.length > 0 && (
                  <div className="mb-3">
                    {resource.tags.map((tag, index) => (
                      <Badge key={index} bg="light" text="dark" className="me-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    By {resource.uploadedBy?.name}
                  </small>
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary"
                    >
                      View
                    </a>
                  )}
                  {resource.file && (
                    <a
                      href={`http://localhost:5000/${resource.file.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary"
                    >
                      Download
                    </a>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {filteredResources.length === 0 && (
        <Card>
          <Card.Body className="text-center py-5">
            <h5 className="text-muted">
              {filter ? 'No resources found matching your search' : 'No resources available yet'}
            </h5>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

export default Resources;
