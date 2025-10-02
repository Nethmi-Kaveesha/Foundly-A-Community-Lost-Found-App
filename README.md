FindIt – Community Lost & Found App

FindIt is a mobile application that helps users report, browse, and recover lost or found items within their community. It provides a centralized platform to connect individuals who have lost items with those who have found them, making the recovery process faster and more reliable.

🚀 Features

Lost & Found Listings: Post items with photos, descriptions, location, and date.

Search & Filters: Filter by category, status (Lost/Found), and keywords.

Nearby Items: Discover items near your current location.

Match Suggestions: Automatically suggest possible matches between lost and found items.

Direct Contact: Communicate securely between owners and finders.

User Authentication: Firebase Authentication for login/signup.

Edit/Delete Listings: Users can manage their own posts.

Responsive UI: Optimized for mobile devices using React Native & Expo.

📸 Screenshots

Add your app screenshots here.






🛠 Tech Stack

Frontend: React Native, Expo

Backend / Database: Firebase Firestore, Firebase Authentication

Location Services: Expo Location API, Google Maps API

Notifications & UI: Toast messages, React Native components

💻 Installation

Clone the repository:

git clone https://github.com/Nethmi-Kaveesha/Foundly-A-Community-Lost-Found-App.git
cd findit-app


Install dependencies:

npm install


Set up Firebase:

Create a Firebase project: Firebase Console

Enable Firestore Database & Authentication (Email/Password)

Add your firebaseConfig in /services/firebaseConfig.ts:

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MSG_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);


Run the app:

npm start


Use Expo Go on your mobile device or an emulator.

📂 Folder Structure
/services          # Firebase and API services
/context           # Context providers (e.g., Loader)
/screens           # App screens (Home, Item, Add/Edit)
/components        # Reusable UI components
/types             # TypeScript types
/App.tsx           # App entry point

📝 Usage

Sign up or log in using Firebase Authentication.

Post a Lost or Found item.

Search for items using keywords or filters.

View Nearby items or Match suggestions.

Edit or delete your own posts.

📦 Build / APK

Android APK: [Link to APK]

iOS Build (Optional): [Link if available]

Make sure the APK is tested on a physical device before submission.

🎥 Demo Video

YouTube Link: [[Your Demo Video Link](https://youtu.be/hP0NQ8p5gyI?si=Rcdj9j2pcEScAa-n)]

Show login, posting, searching, filters, nearby items, match suggestions, and CRUD operations.

✨ Future Enhancements

Push notifications for matches.

In-app chat between users.

Multi-language support.

Web version using ReactJS.

📄 License

MIT License © [NETHMI KAVEESHA FERNANDO]
