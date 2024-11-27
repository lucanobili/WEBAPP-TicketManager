'use strict';

const sqlite = require('sqlite3');

const dayjs = require('dayjs');
const db = new sqlite.Database('./ticket.db', (err) => {
    if(err) throw err;
});

const convertTicketRecord  = (dbRecord) =>{
    const ticket = {};
    ticket.id = dbRecord.id;
    ticket.title = dbRecord.title;
    ticket.timestamp = dayjs(dbRecord.timestamp).format('YYYY-MM-DD HH:mm:ss');
    ticket.owner = dbRecord.owner_name;
    ticket.category = dbRecord.category;
    ticket.state = dbRecord.state;
    ticket.idOwner = dbRecord.idOwner;

    return ticket;
}

const convertBlockRecord  = (dbRecord) =>{
  const block = {};
  block.text = dbRecord.text;
  block.timestamp = dayjs(dbRecord.timestamp).format('YYYY-MM-DD HH:mm:ss');
  block.author = dbRecord.name;
  return block;
}


//obtain the list of ticket as a normal view (not logged in)
exports.DefView  = () =>{
    return new Promise((resolve, reject) => {
        const sql = 'SELECT   t.id AS id, t.title, t.timestamp, t.category, t.state, t.idOwner, u.name AS owner_name FROM  Tickets t JOIN  Users u ON  t.idOwner = u.id ORDER BY t.timestamp DESC;'
        db.all(sql, (err, rows) =>{
            if(err) {reject(err);}
            const tickets = rows.map((e) =>{
                return convertTicketRecord(e);
            })
            resolve(tickets);
        })
    })
}


exports.getText = (id) =>{
  return new Promise((resolve, reject) =>{
    const sql = 'SELECT text FROM Tickets where id = ?'
    db.all(sql, [id], (err,row) =>{
      if(err){
        reject(err);
        return;
      }
      if(row == undefined){
        resolve({error: 'Text not found'});
      }else{
        console.log(row);
        const text = row[0];
        resolve(text);
      }
    });
  });
};


//get a specific ticket and so the related blocks
exports.getBlocks = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT b.text, u.name, b.timestamp FROM Blocks b JOIN Users u ON b.authorId = u.id WHERE idticket = ? ORDER BY timestamp';
    db.all(sql, [id], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      if (rows == undefined) {
        resolve({error: 'Question not found.'});
      } else {
        const question = rows.map((e) => {
          return convertBlockRecord(e);
        });
        resolve(question);
      }
    });
  });
};


//get Categories
exports.getCategories = () =>{
  return new Promise((resolve, reject) =>{
    const sql = 'SELECT * FROM Categories';
    db.all(sql,(err, rows)=>{
      if(err){
        reject(err);
        return;
      }
      if( rows == undefined || rows.length === 0){
        resolve({error: 'Categories not found.'});
      }else{
        const categories = rows.map((e) => {
          return {'Category': e.name};
        });
        resolve(categories)
      }
    })
  })
}



//Create a tiket
exports.createTicket = (answer) => {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO Tickets( state, category, idOwner, title, timestamp, text) VALUES(?, ?, ?, ?, ?, ?)';
      db.run(sql, [answer.state, answer.category, answer.idOwner, answer.title, answer.timestamp, answer.text], function (err) {
        if (err) {
          reject(err);
          return;
        }
        const lastID = this.lastID;
        resolve({id: lastID});
      });
    });
  };


//Create a block
exports.createBlock = (answer) => {
  return new Promise((resolve, reject) => {
    // Query per verificare se l'idticket esiste
    const checkTicketQuery = 'SELECT COUNT(*) AS ticket_count FROM Tickets WHERE id = ? AND state = 1';
    db.get(checkTicketQuery, [answer.idticket], (err, row) => {
      if (err) {
        reject(err); 
        return;
      }
      const ticketCount = row.ticket_count;
      
      if (ticketCount === 0) {
        reject(new Error(`Ticket with id ${answer.idticket} does not exist.`));
        return;
      }
      // Se l'idticket esiste
      const insertQuery = 'INSERT INTO Blocks (text, authorId, timestamp, idticket) VALUES (?, ?, ?, ?)';
            db.run(insertQuery, [answer.text, answer.authorId, answer.timestamp, answer.idticket], function (err) {
        if (err) {
          reject(err);
          return;
        }
        const lastID = this.lastID;
        resolve({ id: lastID });
      });
    });
  });
}

//modify state by not admin
exports.setStateUser = (idOwner, id) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE Tickets SET state = 0 WHERE id = ? AND idOwner = ?';

    db.run(sql, [id, idOwner], function (err) {
      if (err) {
        reject(err);
        return;
      }

      const rowsAffected = this.changes; 
    if (rowsAffected === 0) {
        reject(new Error(`Nessun ticket trovato con id ${id} per l'utente con idOwner ${idOwner}`));
        return;
      }

      resolve( {"state" : 'success', 'id' : id});
    });
  });
};


exports.setStateAdmin = (userId, id, value) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE Tickets SET state = ? WHERE id = ? AND ? IN (SELECT id FROM Users WHERE admin = 1);';

    db.run(sql, [value, id, userId], function (err) {
      if (err) {
        reject(err);
        return;
      }
      const rowsAffected = this.changes; 
      if (rowsAffected === 0) {
        reject(new Error(`Nessun ticket trovato con id ${id} per l'utente con idOwner ${userId}`));
        return;
      }
      resolve( {"state" : 'success', 'id' : id});
    });
  });
};


exports.setCategory = (userId, id, cat) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE Tickets
      SET category = ?
      WHERE id = ?
      AND EXISTS (SELECT 1 FROM Categories WHERE name = ?)
      AND EXISTS (SELECT 1 FROM Users WHERE id = ? AND admin = 1);
    `;

    db.run(sql, [cat, id, cat, userId], function (err) {
      if (err) {
        reject(err);
        return;
      }
      const rowsAffected = this.changes; 
      if (rowsAffected === 0) {
        reject(new Error(`Nessun ticket trovato con id ${id} per l'utente con idOwner ${userId}`));
        return;
      }
      resolve({"state" : 'success', 'category' : cat});
    });
  });
};