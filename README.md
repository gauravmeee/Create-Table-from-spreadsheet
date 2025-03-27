# Revoe Table Fetch

A web application that allows users to fetch and display data from Google Sheets in a table format. Built with Next.js, Express, and MongoDB.

## Features

- User authentication (signup/login)
- Google Sheets integration
- Table creation and management
- Responsive design
- Real-time data updates

## Tech Stack

### Frontend
- Next.js 14
- Tailwind CSS
- Shadcn UI Components
- Lucide Icons

### Backend
- Express.js
- MongoDB
- JWT Authentication
- Google Sheets API

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Google Cloud Project with Google Sheets API enabled
- Google Service Account credentials

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/revoeai-sheets-table
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Production Environment Variables

#### Vercel (Frontend)
```env
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
```

#### Render (Backend)
```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
PORT=10000
FRONTEND_URL=https://your-vercel-frontend-url.vercel.app
```

## Setup Instructions

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/revoe-table-fetch.git
cd revoe-table-fetch
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Set up Google Sheets API:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the Google Sheets API
   - Create a service account
   - Download the service account key file
   - Place the key file in `credentials/google-sheets-credentials.json`

5. Start the backend server:
```bash
# From the root directory
npm start
```

6. Start the frontend development server:
```bash
# From the frontend directory
npm run dev
```

7. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Deployment

#### Backend (Render)

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Configure the service:
   - Name: `revoe-table-fetch-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add the required environment variables
6. Deploy the service

#### Frontend (Vercel)

1. Push your code to GitHub
2. Create a new project on Vercel
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add the required environment variables
6. Deploy the project

## Google Sheets Setup

1. Create a Google Sheet
2. Share the sheet with the service account email address
3. Make sure the sheet has headers in the first row
4. The sheet should be publicly accessible or accessible to the service account

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tables
- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create a new table
- `DELETE /api/tables/:id` - Delete a table

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@example.com or create an issue in the repository. 