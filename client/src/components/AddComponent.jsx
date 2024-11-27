import { Card, Button, Form, Container, Row, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../API';

function FormAdd(props) {
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        props.setAddData({ ...props.addData, [name]: value });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        navigate('/add/confirm');
    };

    const handleCancel = () => {
        props.setAddData({
            title: '',
            text: '',
            category: 'inquiry' 
        });
        navigate('/');
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col xs={12} md={8}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h3 className="text-center mb-4">Add New Ticket</h3>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        placeholder="Enter ticket title"
                                        value={props.addData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Text</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        placeholder="Enter ticket text"
                                        name="text"
                                        value={props.addData.text}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={props.addData.category}
                                        name='category'
                                        onChange={handleChange}
                                        required
                                    >
                                        {props.categories.map((cat, index) => (
                                            <option key={index} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                                <div className="d-grid gap-2">
                                    <Button variant="primary" type="submit">
                                        Submit
                                    </Button>
                                    <Button variant='danger' onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

function ConfirmAdd(props) {
    const navigate = useNavigate();

    const [estimate, setEstimate] = useState(null);

    const loadInfo = async (token) => {
        try {
        const res = await API.getEstimate(token, props.addData.title, props.addData.category);
        setEstimate(res.estimation);
        } catch  {
        setEstimate(null);
        props.renewToken(); 
        }
    };

    useEffect(() => {
        if (props.authToken != null) {
          loadInfo(props.authToken);
        }
      }, [props.authToken]);

    const handleConfirm = () => {
        // Logic to send data to the server
        console.log('Form data confirmed:', props.addData);
        API.addTicket(props.addData).then( () => {
            props.setDirty(true)
            props.setAddData({
                title: '',
                text: '',
                category: props.categories[2] 
            })
        }).catch( err => props.handleError(err))
        navigate('/');
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col xs={12} md={8}>
                    <Card className="shadow-sm" style={{ whiteSpace: 'pre-wrap' }}>
                        <Card.Body>
                            <h3 className="text-center mb-4">Confirm Ticket</h3>
                            <p><strong>Title:</strong> {props.addData.title}</p>
                            <p><strong>Text:</strong> {props.addData.text}</p>
                            <p><strong>Category:</strong> {props.addData.category}</p>
                            <p><strong>Estimation Time: </strong> {estimate}</p>
                            <div className="d-grid gap-2">
                                <Button variant="primary" onClick={handleConfirm}>
                                    Confirm
                                </Button>
                                <Button variant="warning" onClick={() => navigate('/add')}>
                                    Back to Edit
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export { FormAdd, ConfirmAdd };