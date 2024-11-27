BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "Users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "admin" BOOLEAN
);

CREATE TABLE IF NOT EXISTS "Tickets" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "state" BOOLEAN,
    "category" TEXT NOT NULL,
    "idOwner" INTEGER NOT NULL REFERENCES Users(id),
    "title" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "text" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Blocks" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL REFERENCES Users(id),
    "timestamp" TEXT NOT NULL,
    "idticket" INTEGER REFERENCES Tickets(id)
);

CREATE TABLE IF NOT EXISTS "Categories" (
    "name" TEXT NOT NULL PRIMARY KEY
);

INSERT INTO "Users" (email, name, password, salt, admin) VALUES 
    ('pippo@email.it', 'Pippo', 'feafa7671bfdcf7e5537ae62bd69ab57c12c7492ca09bb3c572641e7119af667', '123t321312dcwq', 1),
    ('pluto@email.it', 'Pluto', '83f9d0f5f95ed4e5847fc1f1bec9d420e697e5c1d220b7eeb94aefddbef4f8fe', 'lsasdaa2131212', 0),
    ('cosimino@email.it', 'Cosimino', 'a4293f4493f2cf389c0f13621da1345efa460fda0204fc30310896cf33f08a97', '1213r2435fsfsfg', 0),
    ('luca@email.it', 'Luca', '6c01bb9a521d75311beaf8f56d20356293ad41f06fe033f81f25f4918f77db21', 'vhjsdcaaef123da', 1),
    ('nicola@email.it', 'Nicola', '470b03b09d0b5d594146e60faa4533c001398d2e6078521b78ec36571b3c2463', '1eqasfregadwqq', 0);
    
    


-- Aggiornamento per ottenere l'id dell'utente corrispondente
INSERT INTO "Tickets" (state, category, idOwner, title, timestamp, text) 
VALUES 
    (1, 'payment', 1, 'How to write a program in C?', '2023-03-10 15:30:00', 'How to run a C program?'),
    (1, 'payment', 1, 'How to write a program in Python?', '2023-03-10 15:30:00', 'How to run a  python program?'),
    (0, 'administrative', 2, 'What are the ingredients for lasagna?', '2023-03-10 17:30:00', 'Lasagna??');

INSERT INTO "Blocks" (text,  authorId, timestamp, idticket) VALUES 
    ('Clion', 2, '2023-03-10 17:30:00', 1),

INSERT INTO "Categories" (name) VALUES 
    ('inquiry'),
    ('maintenance'),
    ('new feature'),
    ('administrative'),
    ('payment');

COMMIT;
