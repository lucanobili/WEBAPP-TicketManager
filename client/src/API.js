import dayjs from "dayjs";

const URL = 'http://localhost:3001/api';

const URL2 = 'http://localhost:3002/api';

const convertTicketRecord = (dbRecord) => {
  const ticket = {};
  ticket.id = dbRecord.id;
  ticket.title = dbRecord.title;
  ticket.timestamp = (dbRecord.timestamp);
  ticket.owner = dbRecord.owner;
  ticket.category = dbRecord.category;
  ticket.state = dbRecord.state;
  ticket.idOwner = dbRecord.idOwner;

  return ticket;
}

async function getTicketsList() {
  // call  /api/questions
  const response = await fetch('http://localhost:3001/api/def');
  const tickets = await response.json();
  if (response.ok) {
    return tickets.map((e) => { return convertTicketRecord(e); })
  } else {
    throw tickets;  // expected to be a json object (coming from the server) with info about the error
  }
}

async function addTicket(addData) {
  return fetch('http://localhost:3001/api/newTickets', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: addData.title,
      text: addData.text,
      category: addData.category,
    }),
  })
    .then(response => {
      if (response.ok) {
        return response.json(); // Ritorna la promessa risolta con i dati JSON
      } else {
        return response.json().then(err => {
          throw new Error(err.message || 'Errore durante l\'aggiunta del ticket'); // Gestisce l'errore con un messaggio personalizzato
        });
      }
    })
    .catch(error => {
      console.error('Errore durante il fetch del ticket:', error);
      throw error; // Rilancia l'errore per gestirlo nel chiamante
    });
}

async function addBlock(addData) {
  return fetch('http://localhost:3001/api/newBlock', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: addData.text,
      idticket: addData.idticket,
    }),
  })
    .then(response => {
      if (response.ok) {
        return response.json(); 
      } else {
        return response.json().then(err => {
          throw new Error(err.message || 'Errore durante l\'aggiunta del block'); 
        });
      }
    })
    .catch(error => {
      throw error; 
    });
}



async function getText(id) {
  return fetch('http://localhost:3001/api/ticket/text/' + id, {
    method: 'GET',
    credentials: 'include',
  })
    .then(response => {
      return response.json().then(text => {
        if (response.ok) {
          return text;
        } else {
          throw new Error(text);  // throws an error with the response text
        }
      });
    })
    .catch(error => {
      throw error;  // rethrow the error so it can be handled by the caller
    });
}

async function getCategories() {
  const response = await fetch('http://localhost:3001/api/categories');
  const categories = await response.json();
  if (response.ok) {
    return categories.map((e) => { return e.Category; })
  } else {
    throw categories;
  }
}

async function getBlocks(id){
  let response = await fetch('http://localhost:3001/api/ticket/'+ id, {
    method: 'GET',
    credentials: 'include',
  });
  if(response.ok) {
    const block = await response.json();
    return block;
  }else{
    const errDetail = await response.json();
    throw errDetail.message
  }
}


async function logIn(credentials) {
  let response = await fetch(URL + '/sessions', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    const errDetail = await response.json();
    throw errDetail.message;
  }
}

async function logOut() {
  await fetch(URL + '/sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  });
}

async function getUserInfo() {
  const response = await fetch(URL + '/sessions/current', {
    credentials: 'include'
  });
  const userInfo = await response.json();
  if (response.ok) {
    return userInfo;
  } else {
    throw userInfo;  // an object with the error coming from the server
  }
}

async function setStateUser(id){
  const response = await fetch(URL + '/state/user/' + id, {
    method: 'PUT',
    credentials: 'include'
  });
  const res = await response.json();
  if(response.ok){
    return;
  }else{
    throw res;
  }
}

async function setStateAdmin(id, value){
  const response = await fetch(URL + '/state/admin/' + id, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      value: value,
    })
  });
  const res = await response.json();
  if(response.ok){
    return;
  }else{
    throw res;
  }
}

async function setCategory(id, value){
  const response = await fetch(URL + '/category/' + id, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      value: value,
    })
  });
  const res = await response.json();
  if(response.ok){
    return;
  }else{
    throw res;
  }
}

async function getAuthToken() {
  const response = await fetch(URL+'/auth-token', {
    credentials: 'include'
  });
  const token = await response.json();
  if (response.ok) {
    return token;
  } else {
    throw token;  // an object with the error coming from the server
  }
}


async function getEstimate(authToken, title, category) {
  const response = await fetch(URL2 + '/estimation', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({title: title, category: category}),
  });
  const info = await response.json();
  if (response.ok) {
    return info;
  } else {
    throw info;  // expected to be a json object (coming from the server) with info about the error
  }
}



const API = {
  getTicketsList, getCategories, getText, getUserInfo, logOut, logIn, addTicket, getBlocks, addBlock, setStateUser, setStateAdmin,
  getAuthToken, getEstimate, setCategory
};

export default API;