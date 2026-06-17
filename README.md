# Word Game Frontend

A real-time multiplayer word-guessing game built with React 18, TypeScript, and WebSocket support.

## Features

- Real-time multiplayer gameplay via WebSocket
- User authentication with Microsoft Entra External ID (MSAL)
- Dynamic category management
- Live leaderboards (daily and all-time)
- Responsive, accessible UI (WCAG 2.1 AA)
- Production-ready Docker image with nginx

## Tech Stack

- **Frontend**: React 18, TypeScript, React Router
- **Build**: Vite
- **Testing**: Vitest
- **Linting**: ESLint, Prettier
- **Auth**: @azure/msal-browser, @azure/msal-react
- **HTTP**: Axios
- **Deployment**: Docker with multi-stage build

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

1. Clone the repository
2. Copy `.env.template` to `.env` and fill in your configuration:
   ```bash
   cp .env.template .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Required environment variables (see `.env.template`):

- `VITE_MSAL_CLIENT_ID` - Microsoft Entra application ID
- `VITE_MSAL_AUTHORITY` - Microsoft Entra External ID tenant authority URL
- `VITE_MSAL_REDIRECT_URI` - Redirect URI after authentication
- `VITE_API_BASE_URL` - Backend API base URL
- `VITE_WS_BASE_URL` - WebSocket server URL

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building

Build for production:
```bash
npm run build
```

Output will be in the `dist/` directory.

### Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Linting

Check code quality:
```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # Reusable components
├── pages/              # Route pages
├── hooks/              # Custom React hooks
├── services/           # API client and services
├── context/            # React Context providers
├── types/              # TypeScript type definitions
├── styles/             # Global styles
├── __tests__/          # Test files
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

## API Integration

The frontend communicates with the backend via:

1. **REST API** - For user management, leaderboards, and game setup
2. **WebSocket** - For real-time gameplay events

See `.contracts/game-api.yml` and `.contracts/websocket-api.yml` for API specifications.

## Security

- MSAL with PKCE auth flow
- Token stored in sessionStorage (not localStorage)
- CSP meta tag to prevent inline scripts
- X-Frame-Options: DENY
- No `dangerouslySetInnerHTML` usage
- Text-only rendering for user input (prevents XSS)

## Docker Deployment

Build the Docker image:
```bash
docker build -t word-game-web:latest .
```

Run the container:
```bash
docker run -p 8080:8080 word-game-web:latest
```

The application will be available at `http://localhost:8080`

## CI/CD

GitHub Actions workflows:
- **CI** (`.github/workflows/ci.yml`) - Runs linting, tests, and build on push/PR
- **CD** (`.github/workflows/cd.yml`) - Builds Docker image and deploys to Azure Container App on successful CI

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint` and `npm test`
4. Submit a pull request

## License

Proprietary - Word Game
