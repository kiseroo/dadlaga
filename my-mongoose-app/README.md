# My Mongoose App

This is a Node.js application that uses Mongoose to define and apply a schema for the users collection in MongoDB.

## Features

- User registration and login
- User data management (CRUD operations)
- Schema validation using Mongoose

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd my-mongoose-app
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory and add your MongoDB connection string:
   ```
   MONGODB_URI=<your-mongodb-connection-string>
   ```

## Usage

To start the application, run:
```bash
npm start
```

The server will run on `http://localhost:3001`.

## API Endpoints

- `POST /api/users` - Create a new user
- `GET /api/users` - Retrieve all users
- `GET /api/users/:id` - Retrieve a user by ID
- `PUT /api/users/:id` - Update a user by ID
- `DELETE /api/users/:id` - Delete a user by ID

## License

This project is licensed under the MIT License.