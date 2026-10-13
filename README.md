# Task API

A CRUD API built with Node.js, Express, and MySQL.

## Installation
1. Make sure Node.js and MySQL (via Docker) are installed and running.
2. Navigate to the project folder `cd task-api`
3. Install the required dependencies `npm install`

## Environment Variables
Create a `.env` file in the project root with your own database credentials. Don't commit it.

PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=rootpasword
DB_NAME=ojt_store

(Change DB_PORT if your Docker container publishes MySQL on a different port, ex. 3307.)

## Running the Application
`npm run dev` starts the server in dev mode, restarting automatically when you edit files.


## Why the in-memory version loses data and the MySQL version does not
    The in-memory version keeps tasks in a plain JavaScript array, which lives in the Node.js process's RAM. Reset the process, and that array will be deleted.

    MySQL dont have that problem because it is not part of the Node process. It is a separate database server writing to disk, so restarting the API does not delete it. The data is still there even if you restart.