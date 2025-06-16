# Setting up MongoDB Locally

## For Windows:

1. Download MongoDB Community Server:
   - Go to https://www.mongodb.com/try/download/community
   - Select "Windows" and download the MSI package

2. Run the installer:
   - Complete the installation wizard
   - Choose "Complete" setup type
   - You can opt to install MongoDB Compass (a GUI for MongoDB) when prompted

3. Start MongoDB service:
   - MongoDB should be installed as a Windows service and start automatically
   - If not, you can start it from Services (services.msc)

4. Verify installation:
   - Open Command Prompt
   - Run `mongosh` to connect to the local MongoDB instance

## For MongoDB Compass (GUI):

1. If you didn't install MongoDB Compass during the MongoDB installation:
   - Download from https://www.mongodb.com/try/download/compass
   - Install the application

2. Connect to your local MongoDB:
   - Open MongoDB Compass
   - Use the connection string: `mongodb://localhost:27017`

## Alternative: Use Docker

If you prefer Docker, you can run MongoDB in a container:

```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Testing Your Connection

After setting up MongoDB locally, try running your seeder script:

```powershell
npm run seed
```

Your updated database.js file will now try to connect to the local MongoDB instance if the Atlas connection fails.
