# Game Lobby - Number Guessing Challenge

A real-time multiplayer number guessing game built with Next.js, featuring user authentication, game sessions, and leaderboards.

## 🎮 Features

### Core Functionality
- **User Authentication**: Simple username-based registration and login system
- **Real-time Game Sessions**: 20-second timed sessions with live countdown
- **Number Guessing Game**: Players pick numbers 1-10 to match the winning number
- **Leaderboard System**: Top 10 players ranked by wins and win rate
- **Game History**: Complete history of past games with performance analytics

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live session timers and instant result notifications
- **Performance Analytics**: Detailed stats including win rates, streaks, and number frequency
- **Intuitive Navigation**: Clean, modern interface with easy navigation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd game-lobby
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How to Play

1. **Register/Login**: Enter a username (3+ characters) to create an account or login
2. **Join a Session**: Click "Join Game" when a session is active (20-second window)
3. **Pick Your Number**: Select a number from 1-10 during the game
4. **Wait for Results**: See if your number matches the randomly drawn winning number
5. **Check Leaderboard**: View your ranking and compete with other players

## 🏗️ Technical Architecture

### Frontend Stack
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Modern UI component library
- **Lucide React**: Beautiful icons

### State Management
- **React Hooks**: useState, useEffect for local state
- **localStorage**: Persistent data storage for user sessions and game history
- **Mock Backend**: Simulated JWT authentication and game logic

### Key Components
- **Authentication System**: JWT-based auth with localStorage persistence
- **Game Session Manager**: Real-time countdown timers and session state
- **Leaderboard Engine**: Dynamic ranking system with win rate calculations
- **History Tracker**: Complete game history with performance analytics

## 📱 Pages Overview

### Authentication Page (`/auth`)
- Simple username input form
- Toggle between login and registration
- Mock JWT token generation
- Form validation and error handling

### Home Page (`/`)
- Real-time session countdown timer
- Join game functionality
- User statistics dashboard
- Quick navigation to other features

### Game Page (`/game`)
- Number selection interface (1-10)
- Live countdown timer
- Result modal with win/loss notification
- Automatic navigation back to lobby

### Leaderboard Page (`/leaderboard`)
- Top 10 players ranked by wins
- Current user ranking highlight
- Win rate and games played statistics
- Overall platform statistics

### History Page (`/history`)
- Complete game history for current user
- Performance analytics and insights
- Number frequency analysis
- Winning streak calculations

### Authentication
- JWT tokens stored in localStorage
- User data persisted locally
- Session validation on page load

### Game Sessions
- Timer-based session management
- Random number generation for winners
- Player participation tracking

## 🎨 Design Decisions

### User Experience
- **Gradient Backgrounds**: Modern purple-to-blue gradients for visual appeal
- **Real-time Feedback**: Instant updates and notifications
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Accessibility**: Proper ARIA labels and semantic HTML

### Performance
- **Optimistic Updates**: Immediate UI feedback
- **Efficient Re-renders**: Proper React hooks usage

### Scalability
- **Component Architecture**: Reusable UI components
- **Type Safety**: Full TypeScript implementation
- **Mock API Structure**: Easy transition to real backend

## 🚀 Deployment

The application can be deployed to any static hosting platform:

### Vercel (Recommended)
\`\`\`bash
npm run build
vercel --prod
\`\`\`

### Netlify
\`\`\`bash
npm run build
# Deploy the .next folder
\`\`\`

### Other Platforms
The app exports as a static site and can be hosted anywhere that serves static files.

## 🔮 Future Enhancements

### Backend Integration
- Real WebSocket connections for live multiplayer
- Database integration for persistent data
- Real JWT authentication with refresh tokens
- Server-side game logic validation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using Next.js and modern web technologies**
