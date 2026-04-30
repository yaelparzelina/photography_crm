# Photography CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Hebrew RTL CRM web app for a photography business owner, hosted on GitHub Pages with Firebase Auth + Firestore backend.

**Architecture:** React 18 SPA with HashRouter (required for GitHub Pages static hosting). Firebase Firestore for real-time data with `react-firebase-hooks`. Firebase Auth for single-owner login. Public client routes (`/client/:id`, `/sign/:id`) are unauthenticated; all `/dashboard/*` routes are auth-guarded. Link documents use the generated linkId as the Firestore document ID so the URL maps directly to `db.links/{linkId}`.

**Tech Stack:** React 18, Vite 5, Tailwind CSS v3, React Router v6 (HashRouter), Firebase v10 (Auth + Firestore), react-firebase-hooks, lucide-react, Vitest, @testing-library/react

> **All shell commands run from `c:\Users\yaelp\dev\photography_crm\`** unless noted.  
> **Git commands** (`git add .`, `git commit`) also run from that directory — git finds the repo root automatically.

---

## File Structure

```
photography_crm/
├── .github/workflows/deploy.yml       # GitHub Actions CI/CD
├── public/
├── src/
│   ├── main.jsx                       # Entry: HashRouter + AuthProvider
│   ├── App.jsx                        # All route definitions
│   ├── firebase.js                    # Firebase init (auth + db exports)
│   ├── test/setup.js                  # Vitest global setup
│   ├── context/
│   │   └── AuthContext.jsx            # useAuthState wrapper + useAuth hook
│   ├── components/
│   │   ├── ProtectedRoute.jsx         # Redirects to /login if no auth
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx    # Nav bar + <Outlet />
│   │   │   └── PublicLayout.jsx       # Centered wrapper for client pages
│   │   └── ui/
│   │       ├── Button.jsx             # Variants: primary / secondary / destructive
│   │       ├── StatusBadge.jsx        # Colorful pill from STATUS_CONFIG
│   │       ├── ConfirmDialog.jsx      # Backdrop modal with cancel + confirm
│   │       └── Modal.jsx              # Generic modal wrapper
│   ├── pages/
│   │   ├── Login.jsx                  # Firebase signInWithEmailAndPassword
│   │   ├── Dashboard.jsx              # Client list: search, sort, filter, badges
│   │   ├── ClientTicket.jsx           # Full client record, links, sign status
│   │   ├── Settings.jsx               # Two tabs: types + packages CRUD
│   │   ├── ClientProposal.jsx         # Public: read-only proposal by linkId
│   │   └── ClientSigning.jsx          # Public: agreement + email submit
│   ├── hooks/
│   │   ├── useClients.js              # useCollectionData on clients + CRUD
│   │   ├── usePhotoshootTypes.js      # types CRUD + cascade delete packages
│   │   ├── usePackages.js             # packages by typeId CRUD
│   │   └── useLinks.js                # createProposalLink / createAgreementLink / deactivate
│   ├── templates/
│   │   ├── ProposalTemplate.jsx       # Styled read-only proposal HTML
│   │   └── AgreementTemplate.jsx      # Styled agreement HTML from link snapshot
│   └── utils/
│       ├── statusConfig.js            # STATUS_CONFIG map + STATUS_OPTIONS array
│       ├── dateUtils.js               # formatDate / toInputDate / fromInputDate
│       └── linkGenerator.js           # generateLinkId (crypto.getRandomValues)
├── firestore.rules
├── index.html                         # lang="he" dir="rtl" + Heebo font
├── vite.config.js                     # base: '/photography_crm/' + vitest config
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── package.json
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`
- Create: `index.html`, `src/main.jsx`, `src/index.css`, `src/test/setup.js`
- Create: `.gitignore`, `.env.example`

- [ ] **Step 1: Scaffold Vite React project**

```bash
npm create vite@latest . -- --template react
```
When prompted about non-empty directory — select **Yes, remove existing files**. The `docs/` folder is tracked by git so it won't be deleted by npm.

- [ ] **Step 2: Install all dependencies**

```bash
npm install firebase react-firebase-hooks react-router-dom lucide-react
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npx tailwindcss init -p
```

- [ ] **Step 3: Replace `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/photography_crm/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 4: Replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Heebo', 'sans-serif'] },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Replace `index.html`**

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <title>Photography CRM</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `src/test/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 8: Create `.env.example`**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

- [ ] **Step 9: Create `.gitignore`**

```
node_modules
dist
.env
.env.local
*.local
```

- [ ] **Step 10: Update `package.json` scripts section**

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 11: Verify dev server starts**

```bash
npm run dev
```
Expected: server at `http://localhost:5173/photography_crm/`. Press Ctrl+C.

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "feat: scaffold Vite React project with Tailwind and Vitest"
```

---

## Task 2: Firebase Setup

**Files:**
- Create: `src/firebase.js`
- Create: `.env.local` (gitignored)
- Create: `firestore.rules`

- [ ] **Step 1: Create Firebase project**

Go to [https://console.firebase.google.com](https://console.firebase.google.com):
1. Create new project (e.g. `photography-crm`)
2. Enable **Firestore Database** → Start in production mode → choose region `europe-west3`
3. Enable **Authentication** → Sign-in method → Email/Password → Enable
4. Add a user (your email + a strong password) under Authentication → Users
5. Go to Project Settings → Your apps → Add web app → Copy the config object

- [ ] **Step 2: Create `.env.local`** (never commit this file)

```
VITE_FIREBASE_API_KEY=paste_value_here
VITE_FIREBASE_AUTH_DOMAIN=paste_value_here
VITE_FIREBASE_PROJECT_ID=paste_value_here
VITE_FIREBASE_STORAGE_BUCKET=paste_value_here
VITE_FIREBASE_MESSAGING_SENDER_ID=paste_value_here
VITE_FIREBASE_APP_ID=paste_value_here
```

- [ ] **Step 3: Create `src/firebase.js`**

```js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

- [ ] **Step 4: Create `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Authenticated owner: full access to everything
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // Public: read a single link document by exact ID
    match /links/{linkId} {
      allow read: if request.auth == null;
    }

    // Public: read photoshoot types and packages (non-sensitive pricing data)
    match /photoshootTypes/{typeId} {
      allow read: if request.auth == null;
    }
    match /packages/{packageId} {
      allow read: if request.auth == null;
    }

    // Public: update only signing fields on a client document
    match /clients/{clientId} {
      allow update: if request.auth == null
        && request.resource.data.diff(resource.data).affectedKeys()
             .hasOnly(['email', 'agreementSigned', 'agreementSignedAt', 'status']);
    }
  }
}
```

- [ ] **Step 5: Deploy Firestore rules**

In Firebase Console → Firestore → Rules tab → paste the content of `firestore.rules` → Publish.

- [ ] **Step 6: Commit**

```bash
git add src/firebase.js firestore.rules .env.example
git commit -m "feat: add Firebase initialization and Firestore security rules"
```

---

## Task 3: Utility Functions

**Files:**
- Create: `src/utils/statusConfig.js`
- Create: `src/utils/dateUtils.js`
- Create: `src/utils/linkGenerator.js`
- Create: `src/utils/__tests__/statusConfig.test.js`
- Create: `src/utils/__tests__/dateUtils.test.js`
- Create: `src/utils/__tests__/linkGenerator.test.js`

- [ ] **Step 1: Write failing tests for statusConfig**

Create `src/utils/__tests__/statusConfig.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { STATUS_CONFIG, STATUS_OPTIONS } from '../statusConfig'

describe('STATUS_CONFIG', () => {
  const allStatuses = [
    'new_lead', 'proposal_sent', 'agreement_sent', 'agreement_signed',
    'shoot_scheduled', 'editing_in_progress', 'done', 'didnt_book',
  ]

  it.each(allStatuses)('%s has a label and color', (status) => {
    expect(STATUS_CONFIG[status]).toBeDefined()
    expect(STATUS_CONFIG[status].label).toBeTruthy()
    expect(STATUS_CONFIG[status].color).toBeTruthy()
  })
})

describe('STATUS_OPTIONS', () => {
  it('has 8 entries', () => expect(STATUS_OPTIONS).toHaveLength(8))
  it('each entry has value and label', () => {
    STATUS_OPTIONS.forEach((opt) => {
      expect(opt.value).toBeTruthy()
      expect(opt.label).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test -- --run src/utils/__tests__/statusConfig.test.js
```
Expected: `Cannot find module '../statusConfig'`

- [ ] **Step 3: Create `src/utils/statusConfig.js`**

```js
export const STATUS_CONFIG = {
  new_lead:            { label: 'ליד חדש',              color: 'bg-blue-100 text-blue-800' },
  proposal_sent:       { label: 'הצעת מחיר נשלחה',      color: 'bg-purple-100 text-purple-800' },
  agreement_sent:      { label: 'חוזה נשלח',             color: 'bg-amber-100 text-amber-800' },
  agreement_signed:    { label: 'חוזה נחתם',             color: 'bg-teal-100 text-teal-800' },
  shoot_scheduled:     { label: 'צילום מתוכנן',          color: 'bg-indigo-100 text-indigo-800' },
  editing_in_progress: { label: 'עריכה בתהליך',          color: 'bg-orange-100 text-orange-800' },
  done:                { label: 'הסתיים',                 color: 'bg-green-100 text-green-800' },
  didnt_book:          { label: 'לא סגר',                color: 'bg-red-100 text-red-800' },
}

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}))
```

- [ ] **Step 4: Write failing tests for dateUtils**

Create `src/utils/__tests__/dateUtils.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { formatDate, toInputDate, fromInputDate } from '../dateUtils'

describe('formatDate', () => {
  it('formats a Date as DD/MM/YYYY', () => {
    expect(formatDate(new Date('2026-03-05'))).toBe('05/03/2026')
  })
  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })
  it('handles Firestore timestamp with toDate()', () => {
    const ts = { toDate: () => new Date('2026-01-15') }
    expect(formatDate(ts)).toBe('15/01/2026')
  })
})

describe('toInputDate', () => {
  it('formats date for input[type=date]', () => {
    expect(toInputDate(new Date('2026-06-20'))).toBe('2026-06-20')
  })
  it('returns empty string for null', () => {
    expect(toInputDate(null)).toBe('')
  })
})

describe('fromInputDate', () => {
  it('converts YYYY-MM-DD string to Date', () => {
    const result = fromInputDate('2026-08-10')
    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2026)
  })
  it('returns null for empty string', () => {
    expect(fromInputDate('')).toBeNull()
  })
})
```

- [ ] **Step 5: Create `src/utils/dateUtils.js`**

```js
export function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}/${m}/${date.getFullYear()}`
}

export function toInputDate(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toISOString().split('T')[0]
}

export function fromInputDate(str) {
  if (!str) return null
  return new Date(str)
}
```

- [ ] **Step 6: Write failing tests for linkGenerator**

Create `src/utils/__tests__/linkGenerator.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { generateLinkId } from '../linkGenerator'

describe('generateLinkId', () => {
  it('generates a 12-character string', () => {
    expect(generateLinkId()).toHaveLength(12)
  })
  it('only contains alphanumeric characters', () => {
    expect(generateLinkId()).toMatch(/^[A-Za-z0-9]{12}$/)
  })
  it('generates unique IDs across 100 calls', () => {
    const ids = new Set(Array.from({ length: 100 }, generateLinkId))
    expect(ids.size).toBe(100)
  })
})
```

- [ ] **Step 7: Create `src/utils/linkGenerator.js`**

```js
export function generateLinkId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(12)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}
```

- [ ] **Step 8: Run all utility tests — expect pass**

```bash
npm run test -- --run src/utils/__tests__/
```
Expected: all 12 tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/utils/
git commit -m "feat: add statusConfig, dateUtils, linkGenerator utilities with tests"
```

---

## Task 4: Reusable UI Components

**Files:**
- Create: `src/components/ui/Button.jsx`
- Create: `src/components/ui/StatusBadge.jsx`
- Create: `src/components/ui/ConfirmDialog.jsx`
- Create: `src/components/ui/Modal.jsx`
- Create: `src/components/ui/__tests__/Button.test.jsx`
- Create: `src/components/ui/__tests__/StatusBadge.test.jsx`
- Create: `src/components/ui/__tests__/ConfirmDialog.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/ui/__tests__/Button.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>שמור</Button>)
    expect(screen.getByText('שמור')).toBeInTheDocument()
  })
  it('calls onClick', () => {
    const fn = vi.fn()
    render(<Button onClick={fn}>לחץ</Button>)
    fireEvent.click(screen.getByText('לחץ'))
    expect(fn).toHaveBeenCalledOnce()
  })
  it('does not call onClick when disabled', () => {
    const fn = vi.fn()
    render(<Button onClick={fn} disabled>לחץ</Button>)
    fireEvent.click(screen.getByText('לחץ'))
    expect(fn).not.toHaveBeenCalled()
  })
})
```

Create `src/components/ui/__tests__/StatusBadge.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import StatusBadge from '../StatusBadge'

describe('StatusBadge', () => {
  it('shows Hebrew label for new_lead', () => {
    render(<StatusBadge status="new_lead" />)
    expect(screen.getByText('ליד חדש')).toBeInTheDocument()
  })
  it('shows Hebrew label for done', () => {
    render(<StatusBadge status="done" />)
    expect(screen.getByText('הסתיים')).toBeInTheDocument()
  })
  it('renders nothing for unknown status', () => {
    const { container } = render(<StatusBadge status="unknown" />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

Create `src/components/ui/__tests__/ConfirmDialog.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmDialog from '../ConfirmDialog'

const props = {
  isOpen: true,
  title: 'מחיקת לקוח',
  message: 'האם אתה בטוח?',
  confirmLabel: 'מחק',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('ConfirmDialog', () => {
  it('renders when open', () => {
    render(<ConfirmDialog {...props} />)
    expect(screen.getByText('מחיקת לקוח')).toBeInTheDocument()
    expect(screen.getByText('האם אתה בטוח?')).toBeInTheDocument()
  })
  it('does not render when closed', () => {
    render(<ConfirmDialog {...props} isOpen={false} />)
    expect(screen.queryByText('מחיקת לקוח')).not.toBeInTheDocument()
  })
  it('calls onConfirm on confirm click', () => {
    render(<ConfirmDialog {...props} />)
    fireEvent.click(screen.getByText('מחק'))
    expect(props.onConfirm).toHaveBeenCalled()
  })
  it('calls onCancel on cancel click', () => {
    render(<ConfirmDialog {...props} />)
    fireEvent.click(screen.getByText('בטל'))
    expect(props.onCancel).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run — expect failures**

```bash
npm run test -- --run src/components/ui/__tests__/
```
Expected: `Cannot find module '../Button'` etc.

- [ ] **Step 3: Create `src/components/ui/Button.jsx`**

```jsx
export default function Button({ children, variant = 'primary', size = 'md', disabled, onClick, type = 'button', className = '' }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 focus:outline-none'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }
  const variants = {
    primary:     'bg-gray-900 text-white hover:bg-gray-700',
    secondary:   'border border-gray-200 text-gray-700 hover:bg-gray-50',
    destructive: 'border border-red-300 text-red-600 hover:bg-red-50',
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Create `src/components/ui/StatusBadge.jsx`**

```jsx
import { STATUS_CONFIG } from '../../utils/statusConfig'

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status]
  if (!config) return null
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
```

- [ ] **Step 5: Create `src/components/ui/ConfirmDialog.jsx`**

```jsx
export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'אישור', onConfirm, onCancel, destructive = false }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-start">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            בטל
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              destructive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `src/components/ui/Modal.jsx`**

```jsx
export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Run tests — expect pass**

```bash
npm run test -- --run src/components/ui/__tests__/
```
Expected: all 10 tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add Button, StatusBadge, ConfirmDialog, Modal components with tests"
```

---

## Task 5: Auth, Routing & Layouts

**Files:**
- Create: `src/context/AuthContext.jsx`
- Create: `src/components/ProtectedRoute.jsx`
- Create: `src/components/layout/DashboardLayout.jsx`
- Create: `src/components/layout/PublicLayout.jsx`
- Create: `src/App.jsx`
- Modify: `src/main.jsx`

- [ ] **Step 1: Create `src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, loading] = useAuthState(auth)
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 2: Create `src/components/ProtectedRoute.jsx`**

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">טוען...</div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}
```

- [ ] **Step 3: Create `src/components/layout/DashboardLayout.jsx`**

```jsx
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { Camera, Users, Settings, LogOut } from 'lucide-react'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  const linkClass = (path) =>
    `flex items-center gap-1.5 text-sm transition-colors ${
      location.pathname.startsWith(path) ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-gray-700" />
          <span className="font-semibold text-gray-900">Photography CRM</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/dashboard" className={linkClass('/dashboard')}>
            <Users className="w-4 h-4" /> לקוחות
          </Link>
          <Link to="/dashboard/settings" className={linkClass('/dashboard/settings')}>
            <Settings className="w-4 h-4" /> הגדרות
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> התנתקות
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/layout/PublicLayout.jsx`**

```jsx
export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/App.jsx`**

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClientTicket from './pages/ClientTicket'
import Settings from './pages/Settings'
import ClientProposal from './pages/ClientProposal'
import ClientSigning from './pages/ClientSigning'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/client/:linkId" element={<ClientProposal />} />
      <Route path="/sign/:linkId" element={<ClientSigning />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
      >
        <Route index element={<Dashboard />} />
        <Route path="clients/:id" element={<ClientTicket />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
```

- [ ] **Step 6: Replace `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
)
```

- [ ] **Step 7: Create stub page files** so imports in App.jsx resolve

Create each of these with a placeholder `export default function X() { return <div>X</div> }`:
- `src/pages/Login.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/ClientTicket.jsx`
- `src/pages/Settings.jsx`
- `src/pages/ClientProposal.jsx`
- `src/pages/ClientSigning.jsx`

- [ ] **Step 8: Verify app compiles**

```bash
npm run dev
```
Expected: app loads at `http://localhost:5173/photography_crm/#/login` (redirected because not authenticated). Press Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add src/
git commit -m "feat: add auth context, protected route, layouts, and routing"
```

---

## Task 6: Login Page

**Files:**
- Modify: `src/pages/Login.jsx`

- [ ] **Step 1: Replace `src/pages/Login.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Camera } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch {
      setError('שם משתמש או סיסמה שגויים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col items-center mb-8">
            <Camera className="w-10 h-10 text-gray-700 mb-3" />
            <h1 className="text-2xl font-semibold text-gray-900">Photography CRM</h1>
            <p className="text-gray-400 text-sm mt-1">כניסה לממשק ניהול</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {loading ? 'נכנס...' : 'כניסה'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test manually**

```bash
npm run dev
```
Navigate to `http://localhost:5173/photography_crm/`. Should redirect to `/#/login`. Enter wrong credentials — Hebrew error appears. Enter correct credentials — redirects to `/#/dashboard`. Press Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Login.jsx
git commit -m "feat: implement login page with Firebase Auth"
```

---

## Task 7: Firestore Data Hooks

**Files:**
- Create: `src/hooks/useClients.js`
- Create: `src/hooks/usePhotoshootTypes.js`
- Create: `src/hooks/usePackages.js`
- Create: `src/hooks/useLinks.js`

- [ ] **Step 1: Create `src/hooks/useClients.js`**

```js
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { useCollectionData } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'

const ref = collection(db, 'clients')

export function useClients() {
  const q = query(ref, orderBy('createdAt', 'desc'))
  const [clients, loading] = useCollectionData(q, { idField: 'id' })

  async function createClient(data) {
    const docRef = await addDoc(ref, {
      name: '', email: '', phone: '', photoshootTypeId: '', packageId: '',
      price: null, paidAdvance: false, status: 'new_lead',
      agreementSigned: false, notes: '',
      ...data,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }

  async function updateClient(id, data) {
    await updateDoc(doc(db, 'clients', id), data)
  }

  async function deleteClient(id) {
    await deleteDoc(doc(db, 'clients', id))
  }

  return { clients: clients ?? [], loading, createClient, updateClient, deleteClient }
}
```

- [ ] **Step 2: Create `src/hooks/usePhotoshootTypes.js`**

```js
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where, getDocs } from 'firebase/firestore'
import { useCollectionData } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'

const ref = collection(db, 'photoshootTypes')

export function usePhotoshootTypes() {
  const q = query(ref, orderBy('order', 'asc'))
  const [types, loading] = useCollectionData(q, { idField: 'id' })

  async function createType(name) {
    const order = (types ?? []).length
    await addDoc(ref, { name, order, createdAt: serverTimestamp() })
  }

  async function updateType(id, data) {
    await updateDoc(doc(db, 'photoshootTypes', id), data)
  }

  async function deleteType(id) {
    const pkgSnap = await getDocs(query(collection(db, 'packages'), where('photoshootTypeId', '==', id)))
    await Promise.all(pkgSnap.docs.map((d) => deleteDoc(d.ref)))
    await deleteDoc(doc(db, 'photoshootTypes', id))
  }

  return { types: types ?? [], loading, createType, updateType, deleteType }
}
```

- [ ] **Step 3: Create `src/hooks/usePackages.js`**

```js
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore'
import { useCollectionData } from 'react-firebase-hooks/firestore'
import { db } from '../firebase'

export function usePackagesByType(typeId) {
  const q = typeId
    ? query(collection(db, 'packages'), where('photoshootTypeId', '==', typeId), orderBy('order', 'asc'))
    : null
  const [packages, loading] = useCollectionData(q, { idField: 'id' })

  async function createPackage(data) {
    const order = (packages ?? []).length
    await addDoc(collection(db, 'packages'), { ...data, order, createdAt: serverTimestamp() })
  }

  async function updatePackage(id, data) {
    await updateDoc(doc(db, 'packages', id), data)
  }

  async function deletePackage(id) {
    await deleteDoc(doc(db, 'packages', id))
  }

  return { packages: packages ?? [], loading, createPackage, updatePackage, deletePackage }
}
```

- [ ] **Step 4: Create `src/hooks/useLinks.js`**

```js
import { collection, doc, setDoc, updateDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { generateLinkId } from '../utils/linkGenerator'

async function deactivateExisting(clientId, type) {
  const snap = await getDocs(
    query(collection(db, 'links'), where('clientId', '==', clientId), where('type', '==', type), where('active', '==', true))
  )
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { active: false, deactivatedAt: serverTimestamp() })))
}

export function useLinks() {
  async function createProposalLink(clientId, photoshootTypeId) {
    await deactivateExisting(clientId, 'proposal')
    const linkId = generateLinkId()
    await setDoc(doc(db, 'links', linkId), {
      clientId, photoshootTypeId, type: 'proposal', active: true, createdAt: serverTimestamp(),
    })
    return linkId
  }

  async function createAgreementLink(clientId, snapshot) {
    await deactivateExisting(clientId, 'agreement')
    const linkId = generateLinkId()
    await setDoc(doc(db, 'links', linkId), {
      clientId, type: 'agreement', active: true, ...snapshot, createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'clients', clientId), {
      agreementSigned: false, agreementSignedAt: null, status: 'agreement_sent',
    })
    return linkId
  }

  async function deactivateLink(linkId) {
    await updateDoc(doc(db, 'links', linkId), { active: false, deactivatedAt: serverTimestamp() })
  }

  return { createProposalLink, createAgreementLink, deactivateLink }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add Firestore hooks for clients, types, packages, and links"
```

---

## Task 8: Client List Dashboard

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Create: `src/components/NewClientModal.jsx`

- [ ] **Step 1: Create `src/components/NewClientModal.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './ui/Modal'
import { useClients } from '../hooks/useClients'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'

export default function NewClientModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { createClient } = useClients()
  const { types } = usePhotoshootTypes()
  const [form, setForm] = useState({ name: '', phone: '', photoshootTypeId: '' })
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const id = await createClient(form)
    onClose()
    navigate(`/dashboard/clients/${id}`)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="לקוח חדש">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא *</label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סוג צילום</label>
          <select value={form.photoshootTypeId} onChange={(e) => set('photoshootTypeId', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
            <option value="">בחר סוג צילום</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="flex justify-start gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">בטל</button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'יוצר...' : 'צור לקוח'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Replace `src/pages/Dashboard.jsx`**

```jsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'
import StatusBadge from '../components/ui/StatusBadge'
import NewClientModal from '../components/NewClientModal'
import { formatDate } from '../utils/dateUtils'
import { STATUS_OPTIONS } from '../utils/statusConfig'

export default function Dashboard() {
  const navigate = useNavigate()
  const { clients, loading } = useClients()
  const { types } = usePhotoshootTypes()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [showNew, setShowNew] = useState(false)

  const typeMap = useMemo(
    () => Object.fromEntries(types.map((t) => [t.id, t.name])),
    [types]
  )

  const rows = useMemo(() => {
    let list = [...clients]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      )
    }
    if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter)
    list.sort((a, b) => {
      let av = a[sortField], bv = b[sortField]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av?.toDate) av = av.toDate()
      if (bv?.toDate) bv = bv.toDate()
      return sortDir === 'asc'
        ? av < bv ? -1 : av > bv ? 1 : 0
        : av > bv ? -1 : av < bv ? 1 : 0
    })
    return list
  }, [clients, search, statusFilter, sortField, sortDir])

  function handleSort(field) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return null
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />
  }

  const thClass = 'px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-900 select-none'

  if (loading) return <div className="text-center py-20 text-gray-400">טוען...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">לקוחות</h1>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          <Plus className="w-4 h-4" /> לקוח חדש
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, טלפון, מייל..."
            className="w-full border border-gray-200 rounded-lg ps-4 pe-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300">
          <option value="all">כל הסטטוסים</option>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className={thClass} onClick={() => handleSort('name')}>שם <SortIcon field="name" /></th>
              <th className={thClass}>סטטוס</th>
              <th className={thClass}>סוג צילום</th>
              <th className={thClass} onClick={() => handleSort('shootDate')}>תאריך צילום <SortIcon field="shootDate" /></th>
              <th className={thClass}>שילם מקדמה</th>
              <th className={thClass}>חוזה נחתם</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">לא נמצאו לקוחות</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} onClick={() => navigate(`/dashboard/clients/${c.id}`)}
                className="cursor-pointer hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-gray-600">{typeMap[c.photoshootTypeId] || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.shootDate ? formatDate(c.shootDate) : '—'}</td>
                <td className="px-4 py-3 text-center">{c.paidAdvance ? '✓' : '—'}</td>
                <td className="px-4 py-3 text-center">{c.agreementSigned ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewClientModal isOpen={showNew} onClose={() => setShowNew(false)} />
    </div>
  )
}
```

- [ ] **Step 3: Test in browser**

```bash
npm run dev
```
Log in → should see the client list table. Click "+ לקוח חדש" → modal opens → fill name → creates client and navigates to ticket. Press Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.jsx src/components/NewClientModal.jsx
git commit -m "feat: implement client list dashboard with search, sort, filter, and new client modal"
```

---

## Task 9: Client Ticket Page

**Files:**
- Modify: `src/pages/ClientTicket.jsx`

- [ ] **Step 1: Replace `src/pages/ClientTicket.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useClients } from '../hooks/useClients'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'
import { usePackagesByType } from '../hooks/usePackages'
import { useLinks } from '../hooks/useLinks'
import StatusBadge from '../components/ui/StatusBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import AgreementEditorModal from '../components/AgreementEditorModal'
import { STATUS_OPTIONS } from '../utils/statusConfig'
import { formatDate, toInputDate, fromInputDate } from '../utils/dateUtils'
import { ArrowRight, Copy, Check, Trash2 } from 'lucide-react'

export default function ClientTicket() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { deleteClient } = useClients()
  const { types } = usePhotoshootTypes()

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showAgreementEditor, setShowAgreementEditor] = useState(false)
  const [proposalLinkId, setProposalLinkId] = useState(null)
  const [copiedProposal, setCopiedProposal] = useState(false)
  const [copiedAgreement, setCopiedAgreement] = useState(false)
  const [activeLinkId, setActiveLinkId] = useState(null)

  const { packages } = usePackagesByType(form.photoshootTypeId)
  const { createProposalLink } = useLinks()

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'clients', id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setClient(data)
        setForm(data)
      }
      setLoading(false)
    })
    return unsub
  }, [id])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const { id: _id, createdAt, agreementSigned, agreementSignedAt, ...rest } = form
    await updateDoc(doc(db, 'clients', id), {
      ...rest,
      shootDate: form.shootDate || null,
      dateOfBirth: form.dateOfBirth || null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete() {
    await deleteClient(id)
    navigate('/dashboard')
  }

  async function handleGenerateProposal() {
    const linkId = await createProposalLink(id, form.photoshootTypeId)
    setProposalLinkId(linkId)
  }

  function copyToClipboard(linkId, setter) {
    const url = `${window.location.origin}${window.location.pathname}#/${linkId.startsWith('sign') ? '' : 'client/'}${linkId}`
    navigator.clipboard.writeText(url)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  function proposalUrl(linkId) {
    return `${window.location.origin}${import.meta.env.BASE_URL}#/client/${linkId}`
  }
  function agreementUrl(linkId) {
    return `${window.location.origin}${import.meta.env.BASE_URL}#/sign/${linkId}`
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  if (loading) return <div className="text-center py-20 text-gray-400">טוען...</div>
  if (!client) return <div className="text-center py-20 text-gray-500">לקוח לא נמצא</div>

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowRight className="w-4 h-4" /> חזרה לרשימה
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{client.name || 'לקוח חדש'}</h1>
        <StatusBadge status={form.status} />
      </div>

      {/* Section: Client Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">פרטי לקוח</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>שם מלא</label>
            <input className={inputClass} value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>טלפון</label>
            <input className={inputClass} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>אימייל</label>
            <input type="email" className={inputClass} value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>תאריך לידה</label>
            <input type="date" className={inputClass}
              value={form.dateOfBirth ? toInputDate(form.dateOfBirth) : ''}
              onChange={(e) => set('dateOfBirth', fromInputDate(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Section: Shoot Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">פרטי הצילום</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>סוג צילום</label>
            <select className={inputClass} value={form.photoshootTypeId || ''}
              onChange={(e) => { set('photoshootTypeId', e.target.value); set('packageId', '') }}>
              <option value="">בחר סוג</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>חבילה</label>
            <select className={inputClass} value={form.packageId || ''}
              onChange={(e) => set('packageId', e.target.value)} disabled={!form.photoshootTypeId}>
              <option value="">בחר חבילה</option>
              {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>תאריך צילום</label>
            <input type="date" className={inputClass}
              value={form.shootDate ? toInputDate(form.shootDate) : ''}
              onChange={(e) => set('shootDate', fromInputDate(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>מחיר (₪)</label>
            <input type="number" className={inputClass} value={form.price ?? ''}
              onChange={(e) => set('price', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <label className="text-sm font-medium text-gray-700">שילם מקדמה</label>
            <button type="button" onClick={() => set('paidAdvance', !form.paidAdvance)}
              className={`w-10 h-6 rounded-full transition-colors ${form.paidAdvance ? 'bg-green-500' : 'bg-gray-200'}`}>
              <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.paidAdvance ? '-translate-x-4 rtl:translate-x-4' : ''}`} />
            </button>
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass}>הערות</label>
          <textarea rows={3} className={inputClass} value={form.notes || ''}
            onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>

      {/* Section: Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">סטטוס</h2>
        <select className={inputClass} value={form.status || 'new_lead'} onChange={(e) => set('status', e.target.value)}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Section: Documents */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">מסמכים</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Proposal */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-800 mb-3">הצעת מחיר</p>
            {proposalLinkId ? (
              <div className="space-y-2">
                <input readOnly value={proposalUrl(proposalLinkId)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600" />
                <button onClick={() => { navigator.clipboard.writeText(proposalUrl(proposalLinkId)); setCopiedProposal(true); setTimeout(() => setCopiedProposal(false), 2000) }}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                  {copiedProposal ? <><Check className="w-3 h-3 text-green-600" /> הועתק!</> : <><Copy className="w-3 h-3" /> העתק קישור</>}
                </button>
              </div>
            ) : (
              <button onClick={handleGenerateProposal} disabled={!form.photoshootTypeId}
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors">
                צור קישור
              </button>
            )}
          </div>
          {/* Agreement */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-800 mb-3">הסכם עבודה</p>
            {activeLinkId ? (
              <div className="space-y-2">
                <input readOnly value={agreementUrl(activeLinkId)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600" />
                <button onClick={() => { navigator.clipboard.writeText(agreementUrl(activeLinkId)); setCopiedAgreement(true); setTimeout(() => setCopiedAgreement(false), 2000) }}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                  {copiedAgreement ? <><Check className="w-3 h-3 text-green-600" /> הועתק!</> : <><Copy className="w-3 h-3" /> העתק קישור</>}
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAgreementEditor(true)} disabled={!form.packageId}
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors">
                צור / ערוך הסכם
              </button>
            )}
          </div>
        </div>
        {/* Signing status */}
        <div className="mt-4 pt-4 border-t border-gray-50">
          {client.agreementSigned ? (
            <p className="text-sm text-green-700">
              ✓ חוזה נחתם ב-{formatDate(client.agreementSignedAt)}
              {client.email && ` על ידי ${client.email}`}
            </p>
          ) : (
            <p className="text-sm text-gray-400">ממתין לחתימת לקוח</p>
          )}
        </div>
      </div>

      {/* Save + Delete */}
      <div className="flex items-center justify-between mt-4">
        <button onClick={() => setShowDelete(true)}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-4 py-2 transition-colors">
          <Trash2 className="w-4 h-4" /> מחק לקוח
        </button>
        <button onClick={handleSave} disabled={saving}
          className="bg-gray-900 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {saved ? '✓ נשמר' : saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="מחיקת לקוח"
        message={`האם אתה בטוח שברצונך למחוק את הלקוח ${client.name}? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק לצמיתות"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <AgreementEditorModal
        isOpen={showAgreementEditor}
        onClose={() => setShowAgreementEditor(false)}
        client={client}
        packages={packages}
        types={types}
        onLinkCreated={(linkId) => { setActiveLinkId(linkId); setShowAgreementEditor(false) }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ClientTicket.jsx
git commit -m "feat: implement client ticket page with editing, document links, and delete"
```

---

## Task 10: Agreement Editor Modal

**Files:**
- Create: `src/components/AgreementEditorModal.jsx`

- [ ] **Step 1: Create `src/components/AgreementEditorModal.jsx`**

```jsx
import { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import ConfirmDialog from './ui/ConfirmDialog'
import { useLinks } from '../hooks/useLinks'
import { Copy, Check } from 'lucide-react'

export default function AgreementEditorModal({ isOpen, onClose, client, packages, types, onLinkCreated }) {
  const { createAgreementLink } = useLinks()
  const [overrides, setOverrides] = useState({})
  const [generatedLinkId, setGeneratedLinkId] = useState(null)
  const [showRegenWarning, setShowRegenWarning] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const pkg = packages.find((p) => p.id === client?.packageId)
  const type = types.find((t) => t.id === client?.photoshootTypeId)

  useEffect(() => {
    if (isOpen && pkg) {
      setOverrides({
        photoCount: pkg.photoCount,
        includesAlbum: pkg.includesAlbum,
        albumSize: pkg.albumSize || '',
        albumPages: pkg.albumPages || '',
      })
      setGeneratedLinkId(null)
    }
  }, [isOpen, pkg])

  function set(field, value) {
    setOverrides((o) => ({ ...o, [field]: value }))
  }

  function handleGenerate() {
    if (client.agreementSigned) {
      setShowRegenWarning(true)
      return
    }
    doGenerate()
  }

  async function doGenerate() {
    setGenerating(true)
    const snapshot = {
      clientName: client.name,
      photoshootTypeName: type?.name || '',
      packageName: pkg?.name || '',
      shootDate: client.shootDate || null,
      price: client.price || null,
      photoCount: overrides.photoCount,
      includesAlbum: overrides.includesAlbum,
      albumSize: overrides.includesAlbum ? overrides.albumSize : null,
      albumPages: overrides.includesAlbum ? overrides.albumPages : null,
    }
    const linkId = await createAgreementLink(client.id, snapshot)
    setGeneratedLinkId(linkId)
    onLinkCreated(linkId)
    setGenerating(false)
  }

  const agreementUrl = (linkId) =>
    `${window.location.origin}${import.meta.env.BASE_URL}#/sign/${linkId}`

  const inputClass = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300'

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="עריכת הסכם עבודה">
        {!pkg ? (
          <p className="text-gray-500 text-sm">יש לבחור חבילה בכרטיס הלקוח תחילה.</p>
        ) : generatedLinkId ? (
          <div className="space-y-3">
            <p className="text-sm text-green-700 font-medium">✓ הקישור נוצר בהצלחה</p>
            <input readOnly value={agreementUrl(generatedLinkId)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600" />
            <button onClick={() => { navigator.clipboard.writeText(agreementUrl(generatedLinkId)); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="flex items-center gap-1.5 text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50">
              {copied ? <><Check className="w-4 h-4 text-green-600" /> הועתק!</> : <><Copy className="w-4 h-4" /> העתק קישור</>}
            </button>
            <button onClick={onClose} className="w-full text-sm text-gray-500 hover:text-gray-700 pt-1">סגור</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 text-gray-600">
              <p><span className="font-medium">לקוח:</span> {client.name}</p>
              <p><span className="font-medium">סוג:</span> {type?.name}</p>
              <p><span className="font-medium">חבילה:</span> {pkg.name}</p>
              <p><span className="font-medium">מחיר:</span> ₪{client.price?.toLocaleString() || '—'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מספר תמונות ערוכות</label>
              <input type="number" className={inputClass} value={overrides.photoCount ?? ''}
                onChange={(e) => set('photoCount', Number(e.target.value))} />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">כולל אלבום מודפס</label>
              <button type="button" onClick={() => set('includesAlbum', !overrides.includesAlbum)}
                className={`w-10 h-6 rounded-full transition-colors ${overrides.includesAlbum ? 'bg-green-500' : 'bg-gray-200'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow mx-1 transition-transform ${overrides.includesAlbum ? '-translate-x-4 rtl:translate-x-4' : ''}`} />
              </button>
            </div>

            {overrides.includesAlbum && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">גודל אלבום</label>
                  <input className={inputClass} value={overrides.albumSize || ''}
                    onChange={(e) => set('albumSize', e.target.value)} placeholder="30x30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מספר עמודים</label>
                  <input type="number" className={inputClass} value={overrides.albumPages || ''}
                    onChange={(e) => set('albumPages', Number(e.target.value))} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2 justify-start">
              <button onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">בטל</button>
              <button onClick={handleGenerate} disabled={generating}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
                {generating ? 'יוצר...' : 'צור קישור'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showRegenWarning}
        title="יצירת הסכם חדש"
        message="יצירת קישור חדש תבטל את החתימה הקיימת של הלקוח. הלקוח יצטרך לחתום מחדש על ההסכם המעודכן. להמשיך?"
        confirmLabel="המשך"
        onConfirm={() => { setShowRegenWarning(false); doGenerate() }}
        onCancel={() => setShowRegenWarning(false)}
      />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AgreementEditorModal.jsx
git commit -m "feat: implement agreement editor modal with regeneration warning"
```

---

## Task 11: Settings Page

**Files:**
- Modify: `src/pages/Settings.jsx`

- [ ] **Step 1: Replace `src/pages/Settings.jsx`**

```jsx
import { useState } from 'react'
import { usePhotoshootTypes } from '../hooks/usePhotoshootTypes'
import { usePackagesByType } from '../hooks/usePackages'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Plus, Edit2, Trash2, Check, X, ChevronUp, ChevronDown } from 'lucide-react'

const inputClass = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 w-full bg-white'

function TypesTab() {
  const { types, createType, updateType, deleteType } = usePhotoshootTypes()
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    await createType(newName.trim())
    setNewName('')
  }

  async function handleUpdate() {
    await updateType(editId, { name: editName })
    setEditId(null)
  }

  async function handleDelete() {
    await deleteType(deleteTarget.id)
    setDeleteTarget(null)
  }

  async function move(index, dir) {
    const t1 = types[index], t2 = types[index + dir]
    if (!t2) return
    await updateType(t1.id, { order: t2.order })
    await updateType(t2.id, { order: t1.order })
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input className={inputClass} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="שם סוג צילום חדש" />
        <button type="submit" className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 whitespace-nowrap">
          <Plus className="w-4 h-4" /> הוסף
        </button>
      </form>

      <div className="space-y-2">
        {types.map((t, i) => (
          <div key={t.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-0">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === types.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-0">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            {editId === t.id ? (
              <>
                <input className={`${inputClass} flex-1`} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                <button onClick={handleUpdate} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-800">{t.name}</span>
                <button onClick={() => { setEditId(t.id); setEditName(t.name) }} className="text-gray-400 hover:text-gray-700">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(t)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="מחיקת סוג צילום"
        message={`מחיקת "${deleteTarget?.name}" תמחק גם את כל החבילות המשויכות אליו. האם אתה בטוח?`}
        confirmLabel="מחק"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function PackagesTab() {
  const { types } = usePhotoshootTypes()
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const { packages, createPackage, updatePackage, deletePackage } = usePackagesByType(selectedTypeId)
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [showNew, setShowNew] = useState(false)
  const [newPkg, setNewPkg] = useState({ name: '', price: '', photoCount: '', locationCount: 1, includesAlbum: false, albumSize: '', albumPages: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  function setE(field, value) { setEditData((d) => ({ ...d, [field]: value })) }
  function setN(field, value) { setNewPkg((d) => ({ ...d, [field]: value })) }

  async function handleCreate() {
    await createPackage({
      photoshootTypeId: selectedTypeId,
      name: newPkg.name,
      price: Number(newPkg.price),
      photoCount: Number(newPkg.photoCount),
      locationCount: Number(newPkg.locationCount),
      includesAlbum: newPkg.includesAlbum,
      albumSize: newPkg.includesAlbum ? newPkg.albumSize : null,
      albumPages: newPkg.includesAlbum ? Number(newPkg.albumPages) : null,
    })
    setShowNew(false)
    setNewPkg({ name: '', price: '', photoCount: '', locationCount: 1, includesAlbum: false, albumSize: '', albumPages: '' })
  }

  async function handleUpdate() {
    await updatePackage(editId, {
      name: editData.name, price: Number(editData.price),
      photoCount: Number(editData.photoCount), locationCount: Number(editData.locationCount),
      includesAlbum: editData.includesAlbum,
      albumSize: editData.includesAlbum ? editData.albumSize : null,
      albumPages: editData.includesAlbum ? Number(editData.albumPages) : null,
    })
    setEditId(null)
  }

  function PkgFields({ data, setter }) {
    return (
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div><label className="text-xs text-gray-500 mb-1 block">שם חבילה</label>
          <input className={inputClass} value={data.name || ''} onChange={(e) => setter('name', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500 mb-1 block">מחיר (₪)</label>
          <input type="number" className={inputClass} value={data.price || ''} onChange={(e) => setter('price', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500 mb-1 block">מספר תמונות</label>
          <input type="number" className={inputClass} value={data.photoCount || ''} onChange={(e) => setter('photoCount', e.target.value)} /></div>
        <div><label className="text-xs text-gray-500 mb-1 block">מספר לוקיישנים</label>
          <input type="number" className={inputClass} value={data.locationCount || ''} onChange={(e) => setter('locationCount', e.target.value)} /></div>
        <div className="col-span-2 flex items-center gap-2">
          <label className="text-xs text-gray-500">כולל אלבום</label>
          <button type="button" onClick={() => setter('includesAlbum', !data.includesAlbum)}
            className={`w-8 h-5 rounded-full transition-colors ${data.includesAlbum ? 'bg-green-500' : 'bg-gray-200'}`}>
            <span className={`block w-3 h-3 bg-white rounded-full shadow mx-1 transition-transform ${data.includesAlbum ? '-translate-x-3 rtl:translate-x-3' : ''}`} />
          </button>
        </div>
        {data.includesAlbum && (
          <>
            <div><label className="text-xs text-gray-500 mb-1 block">גודל אלבום</label>
              <input className={inputClass} value={data.albumSize || ''} onChange={(e) => setter('albumSize', e.target.value)} placeholder="30x30" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">עמודים</label>
              <input type="number" className={inputClass} value={data.albumPages || ''} onChange={(e) => setter('albumPages', e.target.value)} /></div>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">בחר סוג צילום</label>
        <select className={inputClass} value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)}>
          <option value="">בחר...</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {selectedTypeId && (
        <>
          <div className="space-y-3 mb-4">
            {packages.map((p) => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4">
                {editId === p.id ? (
                  <>
                    <PkgFields data={editData} setter={setE} />
                    <div className="flex gap-2 mt-3 justify-start">
                      <button onClick={() => setEditId(null)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">בטל</button>
                      <button onClick={handleUpdate} className="text-sm bg-gray-900 text-white rounded-lg px-3 py-1.5 hover:bg-gray-700">שמור</button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        ₪{p.price?.toLocaleString()} · {p.photoCount} תמונות · {p.locationCount} לוקיישן
                        {p.includesAlbum && ` · אלבום ${p.albumSize}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditId(p.id); setEditData({ ...p }) }} className="text-gray-400 hover:text-gray-700"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(p)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showNew ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-800 mb-1">חבילה חדשה</p>
              <PkgFields data={newPkg} setter={setN} />
              <div className="flex gap-2 mt-3 justify-start">
                <button onClick={() => setShowNew(false)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">בטל</button>
                <button onClick={handleCreate} className="text-sm bg-gray-900 text-white rounded-lg px-3 py-1.5 hover:bg-gray-700">הוסף חבילה</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 text-sm border border-dashed border-gray-300 text-gray-500 rounded-xl px-4 py-3 hover:border-gray-400 hover:text-gray-700 w-full justify-center">
              <Plus className="w-4 h-4" /> הוסף חבילה
            </button>
          )}

          <ConfirmDialog
            isOpen={!!deleteTarget}
            title="מחיקת חבילה"
            message={`האם למחוק את החבילה "${deleteTarget?.name}"?`}
            confirmLabel="מחק"
            destructive
            onConfirm={async () => { await deletePackage(deleteTarget.id); setDeleteTarget(null) }}
            onCancel={() => setDeleteTarget(null)}
          />
        </>
      )}
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState('types')
  const tabClass = (t) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">הגדרות</h1>
      <div className="flex gap-2 mb-6">
        <button className={tabClass('types')} onClick={() => setTab('types')}>סוגי צילום</button>
        <button className={tabClass('packages')} onClick={() => setTab('packages')}>חבילות</button>
      </div>
      {tab === 'types' ? <TypesTab /> : <PackagesTab />}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Settings.jsx
git commit -m "feat: implement settings page with photoshoot types and packages management"
```

---

## Task 12: Document Templates

**Files:**
- Create: `src/templates/ProposalTemplate.jsx`
- Create: `src/templates/AgreementTemplate.jsx`

- [ ] **Step 1: Create `src/templates/ProposalTemplate.jsx`**

```jsx
import { formatDate } from '../utils/dateUtils'

export default function ProposalTemplate({ photoshootTypeName, packages }) {
  const today = formatDate(new Date())
  return (
    <div className="p-8 font-sans">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-light text-gray-900 tracking-wide mb-1">Photography Studio</h1>
        <div className="w-12 h-px bg-gray-300 mx-auto my-4" />
        <p className="text-sm text-gray-500">הצעת מחיר</p>
        <p className="text-xs text-gray-400 mt-1">{today}</p>
        <h2 className="text-xl font-semibold text-gray-800 mt-6">צילומי {photoshootTypeName}</h2>
      </div>

      <div className="space-y-5">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border border-gray-100 rounded-2xl p-6 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
              <span className="text-2xl font-light text-gray-900">₪{pkg.price?.toLocaleString()}</span>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li>• {pkg.photoCount} תמונות ערוכות</li>
              <li>• {pkg.locationCount} {pkg.locationCount === 1 ? 'לוקיישן' : 'לוקיישנים'}</li>
              {pkg.includesAlbum && (
                <li>• אלבום מודפס בגודל {pkg.albumSize}, {pkg.albumPages} עמודים</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
        לפרטים נוספים ולתיאום — נשמח לשמוע מכם
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/templates/AgreementTemplate.jsx`**

```jsx
import { formatDate } from '../utils/dateUtils'

export default function AgreementTemplate({ link }) {
  const today = formatDate(new Date())
  const shootDate = link.shootDate
    ? formatDate(link.shootDate.toDate ? link.shootDate.toDate() : new Date(link.shootDate))
    : '___________'

  return (
    <div className="p-8 font-sans leading-relaxed">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">הסכם עבודה</h1>
        <p className="text-sm text-gray-400 mt-1">תאריך: {today}</p>
      </div>

      <p className="text-sm text-gray-700 mb-6">
        הסכם זה נערך ונחתם בתאריך <strong>{today}</strong> בין הצלמת לבין הלקוח/ה <strong>{link.clientName}</strong>.
      </p>

      <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-2 text-sm">
        <h3 className="font-semibold text-gray-800 mb-3">פרטי הצילום</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-gray-600">
          <span className="text-gray-400">סוג הצילום</span><span>{link.photoshootTypeName}</span>
          <span className="text-gray-400">חבילה</span><span>{link.packageName}</span>
          <span className="text-gray-400">תאריך הצילום</span><span>{shootDate}</span>
          <span className="text-gray-400">מספר תמונות</span><span>{link.photoCount} תמונות ערוכות</span>
          {link.includesAlbum && (
            <>
              <span className="text-gray-400">אלבום מודפס</span>
              <span>גודל {link.albumSize}, {link.albumPages} עמודים</span>
            </>
          )}
          <span className="text-gray-400">מחיר כולל</span><span>₪{link.price?.toLocaleString()}</span>
        </div>
      </div>

      <div className="text-sm text-gray-700 space-y-2">
        <p className="font-medium text-gray-800 mb-3">תנאים כלליים:</p>
        <p>1. מקדמה בסך 30% מהמחיר הכולל תשולם עם חתימת הסכם זה.</p>
        <p>2. יתרת התשלום תשולם לא יאוחר ממועד הצילום.</p>
        <p>3. התמונות הערוכות יסופקו תוך 30 ימי עסקים מתאריך הצילום.</p>
        <p>4. ביטול פחות מ-48 שעות לפני מועד הצילום יגרור אובדן המקדמה.</p>
        <p>5. הצלמת שומרת על זכות השימוש בתמונות לצורכי תיק עבודות, אלא אם סוכם אחרת בכתב.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/templates/
git commit -m "feat: add ProposalTemplate and AgreementTemplate HTML components"
```

---

## Task 13: Public Client Pages

**Files:**
- Modify: `src/pages/ClientProposal.jsx`
- Modify: `src/pages/ClientSigning.jsx`

- [ ] **Step 1: Replace `src/pages/ClientProposal.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import ProposalTemplate from '../templates/ProposalTemplate'
import PublicLayout from '../components/layout/PublicLayout'

export default function ClientProposal() {
  const { linkId } = useParams()
  const [state, setState] = useState({ loading: true, link: null, typeName: '', packages: [] })

  useEffect(() => {
    async function load() {
      const linkSnap = await getDoc(doc(db, 'links', linkId))
      if (!linkSnap.exists() || !linkSnap.data().active) {
        setState({ loading: false, link: null, typeName: '', packages: [] })
        return
      }
      const linkData = { id: linkSnap.id, ...linkSnap.data() }

      const typeSnap = await getDoc(doc(db, 'photoshootTypes', linkData.photoshootTypeId))
      const typeName = typeSnap.exists() ? typeSnap.data().name : ''

      const pkgSnap = await getDocs(
        query(collection(db, 'packages'), where('photoshootTypeId', '==', linkData.photoshootTypeId), orderBy('order', 'asc'))
      )
      const packages = pkgSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

      setState({ loading: false, link: linkData, typeName, packages })
    }
    load()
  }, [linkId])

  if (state.loading) return <PublicLayout><div className="text-center py-20 text-gray-400">טוען...</div></PublicLayout>
  if (!state.link) return (
    <PublicLayout>
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-gray-600 text-sm">קישור זה אינו פעיל יותר.</p>
        <p className="text-gray-400 text-xs mt-1">אנא צור קשר עם הצלמת.</p>
      </div>
    </PublicLayout>
  )

  return (
    <PublicLayout>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <ProposalTemplate photoshootTypeName={state.typeName} packages={state.packages} />
      </div>
    </PublicLayout>
  )
}
```

- [ ] **Step 2: Replace `src/pages/ClientSigning.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import AgreementTemplate from '../templates/AgreementTemplate'
import PublicLayout from '../components/layout/PublicLayout'

export default function ClientSigning() {
  const { linkId } = useParams()
  const [link, setLink] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'links', linkId)).then((snap) => {
      setLink(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    })
  }, [linkId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('כתובת מייל לא תקינה')
      return
    }
    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'clients', link.clientId), {
        email,
        agreementSigned: true,
        agreementSignedAt: serverTimestamp(),
        status: 'agreement_signed',
      })
      setSuccess(true)
    } catch {
      setEmailError('אירעה שגיאה, אנא נסה שוב')
      setSubmitting(false)
    }
  }

  if (loading) return <PublicLayout><div className="text-center py-20 text-gray-400">טוען...</div></PublicLayout>
  if (!link || !link.active) return (
    <PublicLayout>
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-gray-600 text-sm">קישור זה אינו פעיל יותר.</p>
        <p className="text-gray-400 text-xs mt-1">אנא צור קשר עם הצלמת.</p>
      </div>
    </PublicLayout>
  )
  if (success) return (
    <PublicLayout>
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">תודה!</h2>
        <p className="text-gray-500 text-sm">ההסכם אושר בהצלחה. נהיה בקשר.</p>
      </div>
    </PublicLayout>
  )

  return (
    <PublicLayout>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <AgreementTemplate link={link} />
        <div className="px-8 pb-8 pt-4 border-t border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 text-base">אישור ההסכם</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כתובת המייל שלך — לאישור ההסכם ולמשלוח עדכונים
              </label>
              <input type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                required />
              {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {submitting ? 'שולח...' : 'אני מאשר/ת את ההסכם'}
            </button>
          </form>
        </div>
      </div>
    </PublicLayout>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/ClientProposal.jsx src/pages/ClientSigning.jsx
git commit -m "feat: implement public proposal and signing pages"
```

---

## Task 14: GitHub Actions CI/CD Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add GitHub Secrets**

In GitHub → repository → Settings → Secrets and variables → Actions → New repository secret.
Add each of these with values from your `.env.local`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

- [ ] **Step 2: Enable GitHub Pages**

In GitHub → repository → Settings → Pages → Source → select **GitHub Actions**.

- [ ] **Step 3: Create `.github/workflows/deploy.yml`**

Note: create the `.github` directory at the git root (`c:\Users\yaelp\dev\`), not inside `photography_crm/`.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: photography_crm/package-lock.json

      - name: Install dependencies
        working-directory: photography_crm
        run: npm ci

      - name: Build
        working-directory: photography_crm
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
        run: npm run build

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: photography_crm/dist
```

- [ ] **Step 4: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions deployment to GitHub Pages"
git push origin master
```

- [ ] **Step 5: Verify deployment**

Go to GitHub → repository → Actions tab. The "Deploy to GitHub Pages" workflow should run automatically. After it completes (2-3 minutes), the app will be live at `https://yaelparzelina.github.io/photography_crm/`.

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Hebrew RTL throughout (`lang="he" dir="rtl"`, Heebo font)
- ✅ Firebase Auth login with redirect
- ✅ Client CRUD (create, read, edit, delete with confirmation)
- ✅ All client fields per spec (name, email, phone, DOB, type, date, package, price, advance, status, notes)
- ✅ 8 photoshoot types, 8 statuses with Hebrew labels and colors
- ✅ Status defaults to `new_lead` on creation
- ✅ Sortable/searchable client list with status filter
- ✅ Settings: photoshoot type CRUD with ordering
- ✅ Settings: package CRUD per type (variable count, album specs)
- ✅ Proposal links: deactivates old, creates new, view-only public page
- ✅ Agreement links: editor modal with photo count and album overrides
- ✅ Regeneration warning + reset of signed status
- ✅ Client signing page: email collection, auto-updates dashboard in real-time
- ✅ Confirmation popups for all destructive actions
- ✅ Public pages show expired message for inactive links
- ✅ Firestore security rules: owner full access; public limited reads + signing write
- ✅ Hash-based routing for GitHub Pages
- ✅ GitHub Actions CI/CD deployment
- ✅ Fully responsive layout (mobile + desktop)

**Type consistency:** `photoshootTypeId`, `packageId`, `clientId`, `linkId` used consistently across hooks, pages, and Firestore documents.
