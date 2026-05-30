# FinWise - Financial Literacy Platform for Students

## 1. Project Overview
FinWise is a comprehensive, full-stack web application designed to empower students with financial literacy. By combining interactive learning modules, practical financial tools, gamification, and AI-driven guidance, the platform helps users manage their money effectively and build long-term financial health.

## 2. Architecture & Tech Stack
The project follows a decoupled client-server architecture.
- **Frontend**: Next.js 15+ (React), Tailwind CSS, Framer Motion, Recharts, Material UI. It also utilizes `react-markdown` and `remark-gfm` for rendering rich text responses from the AI.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **AI Integration**: Google Gemini API (for financial advice, budget analysis, and learning paths).

## 3. Core Features & Functional Requirements

### 3.1 Authentication & User Management
- JWT-based authentication.
- Secure password hashing (bcrypt).
- User profiles storing gamification stats, financial goals, and preferences.

### 3.2 Learning Management System (Modules)
- Interactive learning modules covering topics like Budgeting, Investing, Debt, and Taxes.
- Modules have difficulty levels (beginner, intermediate, advanced) and are sequential.
- Progress tracking: Not Started, In Progress, Completed.
- Quizzes embedded in modules; completion grants XP and updates user progress.

### 3.3 Budgeting & Financial Tracking
- Monthly budget creation and management.
- Tracking of total income, expenses by category (e.g., food, travel, rent), and savings.
- Auto-calculation of budget health metrics.
- Gamification tie-in: Creating and maintaining budgets contributes to badges and streaks.

### 3.4 Goal Setting
- Users can define specific financial goals (e.g., "Emergency Fund", "Buy a Laptop").
- Track target amounts, saved amounts, and deadlines.
- Milestone tracking within goals.

### 3.5 Gamification Engine
A centralized, highly robust gamification system (`gamification.js`).
- **XP & Leveling**: Users earn XP through module completion, budget tracking, and daily logins. Levels increase automatically as XP thresholds are met.
- **Streaks & Weekly Challenges**: Tracking daily activity. Consecutive logins/actions build a streak, which yields bonus XP. Users also receive Weekly Challenges (e.g., "Track expenses for 7 days") on their dashboard.
- **Badges**: Dynamic badge awarding system evaluating criteria across collections (e.g., completing 5 modules, creating 3 budgets).
- **Leaderboards**: Competitive ranking of users based on XP.

### 3.6 AI Mentor (Google Gemini Integration)
- Context-aware chatbot providing personalized financial advice.
- Specialized "Experts" (e.g., Credit, Investment, Savings).
- Quick Actions: One-click buttons to generate a "Quick Tip", "Analyze Budget", or "Generate Learning Path".
- Voice input support (SpeechRecognition API) for conversational interactions.

### 3.7 Community Q&A
- StackOverflow-style Q&A forum.
- Users can post questions (anonymously if desired) and answer others.
- Upvote/Downvote system for questions and answers.
- Original poster can mark answers as "Resolved/Accepted" and "Helpful".
- Includes view counts, answer counts, and categorization.

### 3.8 Financial Calculators & Tools
- Compound Interest Calculator.
- EMI (Equated Monthly Installment) Calculator.
- SIP (Systematic Investment Plan) Calculator.
- Investment Advisor Tool.

### 3.9 Accessibility & Theming
- Universal Light/Dark mode toggling managed via `ThemeContext` and persisted in `localStorage`.

## 4. Backend Technical Details

### 4.1 Data Models (Mongoose Schemas)
- `User`: Profile info, financial profile, gamification state (XP, level, streak, lastActiveDate).
- `Budget`: Monthly budgets, itemized expenses, virtual properties for total calculation.
- `Goal`: Financial goals with milestones.
- `Module`: Educational content structure, interactive sections, and quizzes.
- `Progress`: Tracks a user's progress through modules (time spent, status, quiz scores).
- `Chat`: Stores conversational history with the AI mentor.
- `Badge` & `UserBadge`: Badge definitions and tracking which user earned what badge.
- `Question` & `Answer`: Community Q&A data with voting metrics.

### 4.2 Key Controllers & Services
- `authController.js` & `userController.js`: Handles registration, login, and profile management.
- `gamificationController.js` & `badgeController.js`: Manages streaks, leaderboards, progress retrieval, and badge awarding.
- `budgetController.js`: CRUD for budgets, automatically triggers gamification updates.
- `goalController.js`: CRUD for financial goals and milestones.
- `chatController.js`: Manages the flow between the user and the Google Gemini API (`utils/aiHelper.js`).
- `moduleController.js`: Handles progress updates, quiz submissions, and XP rewards.
- `questionController.js` & `answerController.js`: Manages community Q&A forums, upvoting, and resolutions.
- `toolsController.js`: Contains logic for financial calculators and the investment advisor tool.

### 4.3 Security, Middleware & Utilities
- `helmet` for secure HTTP headers.
- `express-rate-limit` to prevent abuse.
- Custom `auth` middleware for JWT verification.
- `Joi` schema validation (`utils/validation.js`) to strictly validate incoming API payload data.
- **Other Utilities**: Includes `usernameGenerator.js` (for anonymous Q&A) and `calculations.js` (for SIP/EMI math).

## 5. Frontend Technical Details

### 5.1 Routing & Pages (Next.js App Router)
- `/home`: The public landing page showcasing the platform's features.
- `/auth/login` & `/auth/register`: User authentication flows.
- `/dashboard`: Main hub showing XP, level, recent lessons, badges, and weekly challenges.
- `/budget-planner`: Interface for tracking income and expenses.
- `/goals`: Interface for setting and managing financial targets.
- `/lessons`: Module catalog with filtering by category, difficulty, and status.
- `/lessons/[id]`: Interactive lesson viewer and quiz interface.
- `/mentor`: AI Chat interface with voice input and expert selection.
- `/qna` & `/qna/[id]`: Community forum lists and detailed discussion views.

### 5.2 Contexts & State
- `ThemeContext`: Handles light/dark mode toggling, persisting preference to `localStorage`.
- `useAuth`: Custom hook to protect routes and manage authentication state.

### 5.3 Services (Axios Interceptors)
- Standardized API calls through configured Axios instances attaching JWT tokens to headers.
- Modularized service files (`api.js`, `authServices.js`, `chatServices.js`, `qnaServices.js`, `lessonServices.js`, `budgetServices.js`, `goalServices.js`, `userServices.js`).

## 6. Environment & Setup

### Environment Variables
**Backend (`.env`)**:
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY` (Required for AI features)
- `FRONTEND_URL` (For CORS)

**Frontend (`.env`)**:
- `BACKEND_API_URL`

### Scripts
- `npm run dev`: Starts the respective development servers.
- Backend includes a `seedDatabase.js` utility for populating initial modules and badges.

## 7. Notes for AI SRS Generation
When using this document to generate a Software Requirements Specification (SRS), please ensure to extract and formalize:
- **Use Cases**: Based on the features listed in Section 3 (e.g., "User tracks daily streak", "User completes module quiz").
- **Non-Functional Requirements**: Derived from the Security & Architecture sections (e.g., JWT Auth, Rate limiting).
- **Data Dictionary / Entity-Relationships**: Mapped from the models in Section 4.1.
- **State Diagrams**: For User Progress (Not Started -> In Progress -> Completed) and Goal Tracking.
