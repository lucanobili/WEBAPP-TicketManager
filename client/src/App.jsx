import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useEffect, useState } from 'react';
import { Col, Container, Row, Navbar, Button, Spinner } from 'react-bootstrap';
import { BrowserRouter, Routes, Route, Outlet, Link, Navigate, useNavigate } from 'react-router-dom';
import API from './API.js';
import { LoginForm } from './components/AuthComponents.jsx';
import { TicketRoute } from './components/TicketComponents.jsx';
import { FormAdd, ConfirmAdd } from './components/AddComponent.jsx';


function MyHeader(props) {
  const name = props.user && props.user.name;
  const navigate = useNavigate();

  return (
    <Navbar bg="primary" variant="dark" className="d-flex justify-content-between">
      <Navbar.Brand className="mx-2">
        {props.appName || "Ticket"}
      </Navbar.Brand>
      {name ? <div>
        <Navbar.Text className='fs-5'>
          {"Signed in as: " + name}
        </Navbar.Text>
        <Button className='mx-2' variant='danger' onClick={() => { props.logout(), navigate('/') }}>Logout</Button>
      </div> :
        <Link to='/login'>
          <Button className='mx-2' variant='warning'>Login</Button>
        </Link>}
    </Navbar>
  );
}



function App() {

  const [dirty, setDirty] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(undefined);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setAdmin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [authToken, setAuthToken] = useState(null);


  const [loading, setLoading] = useState(true);

  const [addData, setAddData] = useState({
    title: '',
    text: '',
    category: '',
  });

  useEffect(() => {
    if (dirty) {
      API.getTicketsList()
        .then((tickestList) => {
          setTickets(tickestList);
          setDirty(false);
          setLoading(false);
        })
        .catch((err) => handleError(err));
    }
  }, [dirty]);

  useEffect(() => {
    API.getCategories()
      .then((cat) => {
        setCategories(cat);
        setAddData({
          title: '',
          text: '',
          category: categories[2]
        });
      })
      .catch();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
        user.admin ? setAdmin(true) : setAdmin(false)
      } catch (err) {
        // NO need to do anything: user is simply not yet authenticated
        //handleError(err);
      }
    };
    checkAuth();
  }, []);

  const renewToken = () => {
    API.getAuthToken()
      .then((resp) => setAuthToken(resp.token))
      .catch(() => { });
  };

  const loginSuccessful = (user) => {
    setUser(user);
    setLoggedIn(true);
    API.getAuthToken().then((response) => {
      setAuthToken(response.token);
      setAdmin(response.authLevel === 'admin' ? true : false);
    }).catch(() => { });
  }

  const doLogOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(undefined);
    setAdmin(false);
    setDirty(true);
    setAuthToken(null);
    setAddData({
      title: '',
      text: '',
      category: categories[2]
    });
  }

  function handleError(err) {
    console.log('handleError: ', err);
    let errMsg = 'Unkwnown error';
    if (err.errors) {
      if (err.errors[0].msg) {
        errMsg = err.errors[0].msg;
      }
    } else {
      if (err.error) {
        errMsg = err.error;
      }
    }
    setErrorMsg(errMsg);

    if (errMsg === 'Not authenticated')
      setTimeout(() => {  // do logout in the app state
        setLoggedIn(false);
        setUser(undefined);
        setAdmin(false);
        setDirty(true); //to check if required
        setAuthToken(null);
        setAddData({
          title: '',
          text: '',
          category: categories[2]
        });
      }, 2000);
    else
      setTimeout(() => setDirty(true), 2000);  // Fetch the current version from server, after a while
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Layout loggedIn={loggedIn} user={user} logout={doLogOut} />}>
          <Route index element={loading ? <LoadingSpinner /> : <TicketRoute tick={tickets} loggedIn={loggedIn} setDirty={setDirty} dirty={dirty} isAdmin={isAdmin}
            handleError={handleError} user={user} categories={categories} authToken={authToken} renewToken={renewToken} />} />
          <Route path='/add' element={<FormAdd dirtySet={setDirty} categories={categories} addData={addData} setAddData={setAddData} />} />
          <Route path='/add/confirm' element={<ConfirmAdd setDirty={setDirty} addData={addData} categories={categories} handleError={handleError} setAddData={setAddData} authToken={authToken} renewToken={renewToken} />} />
        </Route>
        <Route path='/login' element={<LoginForm loginSuccessful={loginSuccessful} />}></Route>
      </Routes>
    </BrowserRouter>
  )
}



function Layout(props) {
  return (
    <Container fluid>
      <Row>
        <MyHeader loggedIn={props.loggedIn} user={props.user} logout={props.logout} />
      </Row>
      <Row>
        <Outlet />
      </Row>
    </Container>
  )
}


function LoadingSpinner() {
  return (
    <div className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
}

export default App
