# Backlog Odyssey

Backlog Odyssey is a modern, AI-powered application designed to help gamers manage their video game libraries, track their progress, and discover new games to play. It intelligently analyzes a user's library and preferences to provide personalized recommendations and goals.

## Key Features

- **Comprehensive Library Management**: Manually add games or perform batch additions. Move games between lists like 'Now Playing', 'Backlog', 'Wishlist', and 'Recently Played'.
- **Steam Integration**: Import your entire Steam library with a single click. Choose between a 'Full Import' to start fresh or an 'Incremental Import' to add only new games.
- **AI-Powered Recommendations**:
  - **Mood-Based Suggestions**: Describe your current gaming mood (e.g., "a short, relaxing puzzle game") to get tailored recommendations from your own library.
  - **"Up Next" Queue**: An automatically generated, ranked list of games from your backlog that you're most likely to enjoy next.
  - **Hidden Gem Finder**: Discovers a game you don't own, based on your play history, ratings, and active challenges.
  - **Challenge Generation**: Creates fun, trackable gaming challenges (e.g., "Beat 3 RPGs from your backlog") to help you tackle your collection.
- **Data-Rich Insights**:
  - **Dashboard Analytics**: Visualize your gaming habits with charts for platform and genre distribution, completion rates, and total playtime.
  - **Playtime Tracking**: Automatically fetches "How Long to Beat" data from IGDB for both main story and completionist playthroughs.
  - **Steam Deck Compatibility**: If you're a Steam Deck user, the app fetches and displays ProtonDB compatibility ratings for your PC games.
- **Automated Deal Tracking**: Get notified when PC games on your wishlist go on sale on Steam.

## Tech Stack

This project is built with a modern, server-centric web stack, it was developed using the following technologies in a [Firebase Studio environment](https://studio.firebase.google.com/):

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI & Generative Features**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication, Firestore)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) for validation
- **Data Visualization**: [Recharts](https://recharts.org/)

## Setup & Configuration

To run this project locally, you will need to set up a Firebase project and obtain API keys for several services.

### Environment Variables

Create a `.env` file in the root of the project and add the following variables:

```plaintext
# Firebase Configuration (replace with your project's credentials)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (for server-side operations like Steam import)
# This is a Base64-encoded service account JSON key
FIREBASE_SERVICE_ACCOUNT_KEY=

# Google AI (for Genkit features)
GEMINI_API_KEY=

# External Game Data APIs
NEXT_PUBLIC_RAWG_API_KEY=
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
STEAM_API_KEY=
```

### Obtaining API Keys

1.  **Firebase**: Create a project on the [Firebase Console](https://console.firebase.google.com/). You can find the public credentials in your project settings. For the `FIREBASE_SERVICE_ACCOUNT_KEY`, generate a new private key (as a JSON file) from Project Settings > Service accounts, and then Base64-encode the contents of the JSON file.
2.  **Google AI**: Get your `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/app/apikey).
3.  **RAWG.io**: Sign up for a free account at [RAWG.io](https://rawg.io/apidocs) to get an API key for game metadata and images.
4.  **IGDB & Steam**:
    - You need a [Twitch Developer](https://dev.twitch.tv/) account to get an `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET`.
    - You need a `STEAM_API_KEY` from the [Steam Web API](https://steamcommunity.com/dev/apikey).

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
```