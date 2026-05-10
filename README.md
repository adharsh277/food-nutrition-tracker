# Food Nutrition Tracker

A full-stack, cross-platform nutrition tracking app built for Android, iOS, and Web.
The app combines camera-based food analysis, personalized goal tracking, and backend-powered nutrition analytics.

## Project Summary


Food Nutrition Tracker helps users:

- Scan food using camera or gallery images
- Estimate nutrition values with AI
- Track meals, calories, macros, water intake, and steps
- Set personalized goals based on profile and activity level
- Get food recommendations aligned with user goals
- Export progress reports as PDF

## Architecture Overview


- Frontend: Expo + React Native app for mobile and web
- Backend: Express.js REST API for auth, profile, logs, and recommendations
- Database: MongoDB with Mongoose models
- AI Layer: Gemini API for food recognition and nutrition estimation
- Cloud/Delivery: Vercel configuration for backend deployment, Expo EAS for app builds and updates
- DevOps: GitHub Actions backend CI workflow

## Tech Stack

### Frontend

- React Native
- Expo SDK 54
- React Navigation (Drawer + Stack)
- React Native Paper
- React Native Web
- AsyncStorage for local app data
- Expo Secure Store for auth token storage

### Backend

- Node.js
- Express.js
- CORS
- Dotenv
- JWT (jsonwebtoken)
- bcryptjs
- Passport + Google OAuth libraries

### Database

- MongoDB
- Mongoose ODM
- Models: User, DailyLog, FoodItem

### Cloud and External Services

- Gemini API (food image understanding)
- Vercel deployment configuration (serverless rewrite entry)
- Expo Updates (OTA updates)
- Expo EAS Build profiles (development, preview, production, apk)

### DevOps and CI/CD

- GitHub Actions workflow for backend checks on push and pull requests
- Node 18 CI environment
- Automated dependency install and backend load/syntax validation

## How The System Works

1. User signs in and completes onboarding details.
2. Frontend sends secure API requests to backend using JWT.
3. Scanner captures image and sends it to AI recognition service.
4. Nutrition output is shown to user and can be added to meal logs.
5. Daily stats are saved locally and synced with backend daily logs.
6. Backend stores structured user and nutrition data in MongoDB.
7. Recommendation engine suggests foods based on goal and meal time.

## Core Features

- User authentication (email/password, backend Google route support)
- Personalized onboarding with calorie and macro target calculation
- AI-assisted food recognition from images
- Meal-wise nutrition tracking (breakfast, lunch, snacks, dinner)
- Daily steps tracking via pedometer integration
- Smart reminders and notifications
- Nutrition history and analytics
- PDF report export and sharing

## Repository Structure

```text
food-nutrition-tracker/
├── src/                    # React Native app source
├── backend/                # Express API + Mongoose models/routes
├── assets/                 # App assets
├── App.js                  # Root app navigation/providers
├── app.config.js           # Expo app config + env passthrough
├── eas.json                # EAS build profiles
└── .github/workflows/      # CI workflows
```

## Environment Variables

Create environment variables for frontend and backend configuration.

Frontend (Expo):

- EXPO_PUBLIC_API_BASE_URL
- EXPO_PUBLIC_GEMINI_API_KEY
- EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
- EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID

Backend:

- PORT
- MONGO_URI
- JWT_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_ANDROID_CLIENT_ID

## Local Development

### 1) Install frontend dependencies

```bash
npm install
```

### 2) Install backend dependencies

```bash
cd backend
npm install
```

### 3) Run backend

```bash
cd backend
npm run dev
```

### 4) Run frontend (mobile/web)

```bash
npm start
```

For web:

```bash
npm run web
```

## Build and Deployment Notes

- Mobile builds are managed through EAS profiles in eas.json.
- OTA update configuration is enabled via Expo Updates.
- Backend serverless routing is prepared via backend/vercel.json.

## Presentation One-Liners

- Frontend: Cross-platform React Native app delivering scanner, tracking, and analytics flows.
- Backend: Express API handling authentication, profile logic, daily logging, and recommendations.
- Database: MongoDB stores users, food items, and daily nutrition history with Mongoose schemas.
- Cloud: AI food analysis uses Gemini API, with deployment-ready cloud configuration.
- DevOps: GitHub Actions provides backend CI checks, while EAS supports release builds and updates.

