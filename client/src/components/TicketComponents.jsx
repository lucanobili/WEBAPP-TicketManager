import { Card, Button, Badge, Container, Row, Col, Collapse, Form } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../API';
import { propTypes } from 'react-bootstrap/esm/Image';

function TicketRoute(props) {
  const navigate = useNavigate();

  return (
    <Container className="mt-4">
      <Row>
        <Col xs={2} >
          <Row className="justify-content-center my-4">
            <Col xs="auto">
              <Button
                variant="success"
                size="lg"
                className="px-5 py-3"
                onClick={() => navigate('/add')}
                hidden={!props.loggedIn}>
                ADD Ticket
              </Button>
            </Col>
          </Row>
        </Col>
        <Col xs={8}>
          {props.tick.map((ticket, index) => (
            <TicketSingle key={ticket.id} ticket={ticket} loggedIn={props.loggedIn} isAdmin={props.isAdmin} User={props.user} setDirty={props.setDirty} categories={props.categories} authToken={props.authToken}
              renewToken={props.renewToken} handleError={props.handleError} />
          ))}
        </Col>
      </Row>
    </Container>
  );
}

function TicketSingle(props) {
  const { ticket, loggedIn, isAdmin, User, setDirty, categories, authToken, renewToken, handleError } = props;
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ text: '', blocks: [] });
  const [text, setText] = useState('');
  const [dirtyBlock, setDirtyBlock] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const text = await API.getText(ticket.id);
        const blocks = await API.getBlocks(ticket.id);
        setData({ text: text.text, blocks });
        setDirtyBlock(false);
      } catch (error) {
        return handleError(error);
      }
    };

    if (loggedIn && open) {
      fetchData();
    } else if (!loggedIn) {
      setOpen(false);
      setData({ text: '', blocks: [] });
    }

    setDirtyBlock(false);
  }, [open, dirtyBlock, loggedIn]);


  const handleSubmit = async (event) => {
    event.preventDefault();
    const block = { text, idticket: ticket.id };

    API.addBlock(block)
      .then(() => {
        setDirtyBlock(true);
        setText('');
      })
      .catch(err => {
        handleError(err);
      });

  };

  return (
    <Card className="mb-3 shadow-sm" key={ticket.id} style={{ whiteSpace: 'pre-wrap' }}>
      <Card.Header className="thead-dark">
        <strong>{ticket.title}</strong>
      </Card.Header>
      <Card.Body>
        <Row className="mb-2">
          <Col xs={6}><strong>Timestamp:</strong> {ticket.timestamp}</Col>
          <Col xs={6}><strong>Owner:</strong> {ticket.owner}</Col>
        </Row>
        <Row className="mb-2">

          {isAdmin ? <CategoryAndEstimation ticket={ticket} categories={categories} setDirty={setDirty} authToken={authToken} renewToken={renewToken} handleError={handleError} /> : (
            <Col xs={6}>
              <strong>Category:</strong> {ticket.category}
            </Col>
          )}

          <Col xs={6}>
            <strong>State:</strong>
            <Badge bg={ticket.state === 1 ? 'success' : 'danger'}>
              {ticket.state === 1 ? 'Open' : 'Closed'}
            </Badge>
          </Col>
        </Row>

        <TicketActions isAdmin={isAdmin} ticket={ticket} loggedIn={loggedIn} User={User} handleError={handleError} setDirty={setDirty} />

        <Row className="mb-2">
          <Col xs={11}>
            <TicketDetails ticket={ticket} open={open} data={data} text={text} setText={setText} handleSubmit={handleSubmit} />
          </Col>
          <Col xs={1} className="text-end">
            <Button variant="link" className="p-0" onClick={() => setOpen(!open)} hidden={!loggedIn}>
              <i className={`bi bi-arrow-${open ? 'up' : 'down'}`}></i>
            </Button>
          </Col>
        </Row>

      </Card.Body>
    </Card>
  );
}

function TicketActions(props) {
  const { isAdmin, ticket, loggedIn, User, setDirty, handleError } = props;

  const handleChangeUserState = async (event) => {
    event.preventDefault();
    try {
      await API.setStateUser(ticket.id);
      setDirty(true);
    } catch (error) {
      handleError(error);
      console.error('Errore nella modifica dello stato', error);
    }
  };

  const handleChangeAdminState = async (event) => {
    event.preventDefault();
    try {
      await API.setStateAdmin(ticket.id, !ticket.state);
      setDirty(true);
    } catch (error) {
      handleError(error);
      console.error('Errore nella modifica dello stato', error);
    }
  };
  return (
    <>
      {isAdmin ? (
        <Row className="mb-2">
          <Col xs={4}>
            <Button type="submit" variant={ticket.state === 0 ? 'success' : 'danger'} onClick={handleChangeAdminState}>
              {ticket.state === 0 ? 'Open' : 'Close'}
            </Button>
          </Col>
        </Row>
      ) : (
        loggedIn && Number(User.id) === Number(ticket.idOwner) && ticket.state === 1 && (
          <Row className="mb-2">
            <Col xs={4}>
              <Button type="submit" variant="danger" onClick={handleChangeUserState}>
                Close
              </Button>
            </Col>
          </Row>
        )
      )}
    </>
  );
}

function TicketDetails(props) {
  const { ticket, open, data, text, setText, handleSubmit } = props;

  const handleChange = (e) => {
    setText(e.target.value);
  };

  return (
    <Collapse in={open}>
      <div>
        <strong>Description:</strong> {data.text || 'Loading...'}
        <hr className="hr" />
        {data.blocks.map((block, index) => (
          <div key={index}>
            <Row className="mt-2">
              <Col xs={5}><strong>Timestamp :</strong> {block.timestamp}</Col>
              <Col xs={5}><strong>Author :</strong> {block.author}</Col>
            </Row>
            <Row className="mt-2">
              <Col><strong>Description:</strong> {block.text}</Col>
            </Row>
            <hr className="hr" />
          </div>
        ))}
        <Form onSubmit={handleSubmit}>
          <Form.Label>Add answer to Ticket :</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Enter text"
            value={text}
            onChange={handleChange}
            required
            disabled={ticket.state === 0}
          />
          <Row>
            <Button variant="primary" type="submit" className="mr-4" disabled={ticket.state === 0}>Submit</Button>
          </Row>
        </Form>
      </div>
    </Collapse>
  );
}

function CategoryAndEstimation(props) {
  const { ticket, categories, setDirty, authToken, renewToken, handleError } = props;

  const [newCat, setNewCat] = useState(ticket.category);
  const [estimate, setEstimate] = useState(null);

  const loadInfo = async (token) => {
    try {
      const res = await API.getEstimate(token, ticket.title, ticket.category);
      setEstimate(res.estimation);
    } catch {
      setEstimate(null);
      renewToken();
    }
  };

  useEffect(() => {
    if (authToken != null) {
      loadInfo(authToken);
    }
  }, [authToken, ticket.category]);

  const handleChange = async (event) => {
    event.preventDefault();
    const newCategory = event.target.value;
    setNewCat(newCategory);
    try {
      await API.setCategory(ticket.id, newCategory);
      setDirty(true);
    } catch (error) {
      handleError(error);
      console.error('Error setting category:', error);
    }
  };

  return (
    <div>
      <Row>
        <Col xs={6}>
          <Form.Group className="mb-3">
            <Form.Label><strong>Category:</strong></Form.Label>
            <Form.Control
              as="select"
              value={newCat}
              name='category'
              required
              onChange={handleChange}
            >
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
        <Col xs={6}>
          <strong>Estimation : {estimate !== null ? estimate : 'N/A'}</strong>
        </Col>
      </Row>
    </div>
  );
}




export { TicketRoute };