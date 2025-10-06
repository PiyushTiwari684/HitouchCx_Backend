# 🧭 Git Collaboration Guide — HiTouchCx Backend

## 🧩 1️⃣ Prerequisites

Before contributing, ensure you have:

- Git installed (`git --version`)
- Node.js + npm installed
- A GitHub account with collaborator access to the private repo
- Basic understanding of Git and branches

## ⚙️ 2️⃣ Clone the Repository

Once added as a collaborator and invited → accept the invite via GitHub.
Then clone the project:

```bash
git clone https://github.com/Ash-HTcx/HitouchCx_Backend.git
cd HitouchCx_Backend
```

## 🔐 3️⃣ Configure Git Identity

Set your developer identity (used for commits):

```bash
git config user.name "Your Full Name"
git config user.email "your.email@example.com"
```

(Use the same email linked to your GitHub account)

## 🧰 4️⃣ Create Your Own Branch

Never commit directly to main.
Instead, create a branch for your task or feature:

```bash
git checkout -b feature/your-feature-name
```

Example:

```bash
git checkout -b feature/add-error-handler
```

## 🧠 5️⃣ Keep Your Branch Updated

Before you start work or push new commits, sync with the latest main:

```bash
git pull --rebase origin main
```

## 💾 6️⃣ Commit Your Changes

Stage and commit with clear, meaningful messages:

```bash
git add .
git commit -m "feat: add new API route for user onboarding"
```

✅ Follow Conventional Commit style:

- `feat:` → new feature
- `fix:` → bug fix
- `chore:` → internal task
- `refactor:` → code refactor
- `docs:` → documentation changes

## 🚀 7️⃣ Push Your Branch

Push your branch to GitHub:

```bash
git push -u origin feature/your-feature-name
```

## 🔍 8️⃣ Open a Pull Request (PR)

Go to the GitHub repo → Pull Requests tab →
Click "New pull request" → select your branch → submit for review.

The team will review, comment, and merge into main after approval.

## 🧹 9️⃣ After Merge

Once your PR is merged:

```bash
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

(delete your old feature branch locally)

## 🧠 10️⃣ Do's and Don'ts

### ✅ Do:

- Always pull before pushing
- Use feature branches
- Write clean commit messages
- Follow project linting/prettier rules

### ❌ Don't:

- Push directly to main
- Commit large files, secrets, or .env files
- Force-push without confirming with the team

## 🔒 11️⃣ Environment Variables

Each developer must create a local .env file (not pushed to GitHub).
Use the provided .env.example to set up your local environment.

```bash
cp .env.example .env
```

## ✅ 12️⃣ Common Commands Reference

| Task                    | Command                         |
| ----------------------- | ------------------------------- |
| Check current branch    | `git branch`                    |
| Switch branch           | `git checkout branch-name`      |
| Create new branch       | `git checkout -b feature/xyz`   |
| See file changes        | `git status`                    |
| Undo last commit (safe) | `git reset --soft HEAD~1`       |
| Pull latest code        | `git pull --rebase origin main` |
| Push to remote          | `git push`                      |

## 🏁 Summary

In short:
1. Clone the repo
2. Create a new branch
3. Work → Commit → Push
4. Open a Pull Request
5. Keep your branch updated via rebase
6. Don't push directly to main


## 🔧 Utils & Middlewares Guide

### 📁 Project Structure for Utils & Middleware
```
src/
├── utils/
│   ├── errorHandler.js
│   ├── validation.js
│   ├── logger.js
│   └── helpers.js
├── middleware/
│   ├── auth.js
│   ├── errorMiddleware.js
│   ├── validate.js
│   └── rateLimiter.js
```

### 🔌 Using Utility Functions

1. **Import Utils**
```javascript
const { handleError } = require('../utils/errorHandler');
const { validateInput } = require('../utils/validation');
const logger = require('../utils/logger');
```

2. **Error Handling Example**
```javascript
try {
    // Your code
} catch (error) {
    handleError(error, 'UserService');
}
```

3. **Validation Example**
```javascript
const validateUser = (data) => {
    const result = validateInput(data, 'user');
    if (!result.success) {
        throw new Error(result.message);
    }
    return result.data;
};
```

### 🔗 Using Middlewares

1. **Auth Middleware**
```javascript
const { authGuard } = require('../middleware/auth');

router.get('/protected-route', authGuard, (req, res) => {
    // Only authenticated requests reach here
});
```

2. **Validation Middleware**
```javascript
const { validateBody } = require('../middleware/validate');

router.post('/users', 
    validateBody('createUser'), 
    userController.createUser
);
```

3. **Error Handling Middleware**
Place at the end of your Express app:
```javascript
const { errorHandler } = require('../middleware/errorMiddleware');
app.use(errorHandler);
```

### 🎯 Best Practices

1. **Centralized Error Handling**
- Use the `handleError` utility for consistent error management
- Always include a service/component name for better tracking
- Never expose internal errors to clients

2. **Validation**
- Validate all incoming data using validation middleware
- Create reusable validation schemas in `utils/validation`
- Return standardized error responses

3. **Logging**
- Use the logger utility instead of console.log
- Include appropriate log levels (info, error, debug)
- Add context to log messages

4. **Middleware Chain**
Recommended order for middleware:
```javascript
app.use(express.json());
app.use(rateLimiter);
app.use(requestLogger);
app.use(cors());
app.use(authGuard);
// Route handlers
app.use(errorHandler);
```

### 📝 Example Implementation

```javascript
// Controller with Utils & Middleware
const createUser = async (req, res, next) => {
    try {
        logger.info('Creating new user');
        
        const validatedData = validateUser(req.body);
        const user = await userService.create(validatedData);
        
        logger.info(`User created: ${user.id}`);
        res.status(201).json(user);
    } catch (error) {
        handleError(error, 'UserController');
        next(error);
    }
};
```

### 🚫 Common Pitfalls to Avoid

- Don't bypass validation middleware
- Don't handle errors differently across services
- Don't mix business logic in middleware
- Don't forget to call `next()` in middleware chains
- Don't expose sensitive info in error responses


