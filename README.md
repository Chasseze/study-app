# Study App 📚

A powerful, feature-rich note-taking application built with React. Perfect for students, professionals, and anyone who wants to organize their thoughts with markdown support.

🌐 **Live Demo**: [https://study-app-71ce4.web.app](https://study-app-71ce4.web.app)

## ✨ Features

### 📝 Rich Text Editing
- **Markdown Support**: Write notes using markdown syntax
- **Live Preview**: See rendered markdown as you type
- **Formatting Toolbar**: Bold, italic, underline, headings, lists, code blocks, and more
- **Custom Syntax**: 
  - Underline: `++underlined text++`
  - Colored text: `{{color:emerald|green text}}` or `{{color:#ff0000|red text}}`

### 📌 Pin & Organize
- **Pin Notes**: Pin important notes to the top of your list
- **Categories**: Organize notes by category
- **Tags**: Add multiple tags to notes for better organization
- **Archive**: Archive old notes to keep your list clean (with restore option)

### 🔗 Note Linking
Link between notes using wiki-style syntax:
```markdown
Check out my [[Getting Started]] guide for more info.
```
- Links to existing notes appear as clickable purple badges
- Broken links (non-existent notes) show as strikethrough

### 📋 Templates
Quickly start notes with pre-made templates:
- **Blank Note** - Start fresh
- **Meeting Notes** - Agenda, discussion, action items
- **Study Guide** - Key concepts, definitions, practice questions
- **Project Plan** - Goals, timeline, tasks
- **Daily Journal** - Gratitude, learnings, tomorrow's goals
- **Book/Article Review** - Summary, takeaways, quotes

### 🔍 Search & Filter
- **Full-text Search**: Search by title AND content
- **Category Filter**: Filter notes by category
- **Real-time Results**: Results update as you type

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + B` | Bold |
| `Cmd/Ctrl + I` | Italic |
| `Cmd/Ctrl + U` | Underline |
| `Cmd/Ctrl + K` | Insert link |
| `Cmd/Ctrl + S` | Save |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Arrow Keys` | Navigate topics (in sidebar) |

### ↩️ Undo/Redo
- Full history support with debounced snapshots
- Works with keyboard shortcuts

### 📤 Export Options
- **Markdown (.md)**: Download note as markdown file
- **PDF**: Export with styling preserved
- **Word (.docx)**: Export as Word document
- **JSON**: Export all notes as backup
- **Share**: Native share or copy to clipboard

### 🌓 Dark Mode
- Toggle between light and dark themes
- Remembers your preference
- Respects system preference on first visit

### ☁️ Cloud Sync (Optional)
- **Firebase Integration**: Sync notes across devices
- **Google Sign-in**: Easy authentication
- **Email/Password**: Traditional auth option
- **Offline Support**: Works without internet (IndexedDB fallback)

### 🔒 Security
- XSS protection with DOMPurify
- Sanitized HTML rendering
- Secure iframe previews for links

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/chasseze/study-app.git
cd study-app

# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables (Optional - for Firebase)

Create a `.env.local` file:

```env
REACT_APP_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
REACT_APP_FIREBASE_DB_URL=https://your-project.firebaseio.com
```

## 📁 Project Structure

```
src/
├── App.js                 # Main application component
├── components/            # Reusable UI components
│   ├── Editor.js          # Markdown editor with toolbar
│   ├── Header.js          # App header with controls
│   ├── Modal.js           # Accessible modal dialog
│   ├── Preview.js         # Markdown preview
│   ├── Sidebar.js         # Topic list with search/filter
│   └── icons.js           # SVG icon components
├── hooks/                 # Custom React hooks
│   ├── useTopics.js       # Topic CRUD operations
│   ├── useStorage.js      # Storage adapter management
│   ├── useSearch.js       # Search and filtering
│   ├── useTheme.js        # Dark/light theme
│   ├── useUndoRedo.js     # Undo/redo history
│   └── useKeyboardShortcuts.js
└── lib/                   # Utility libraries
    ├── markdown.js        # Markdown rendering with custom syntax
    ├── export.js          # Export to MD/PDF/Word/JSON
    ├── sanitize.js        # XSS protection
    ├── storage.js         # Storage abstraction
    └── firebaseClient.js  # Firebase SDK wrapper
```

## 🧪 Testing

```bash
# Run tests once
CI=true npm test

# Run tests in watch mode
npm test

# Current: 87 tests across 15 test suites
```

## 📦 Build

```bash
# Production build
npm run build

# Deploy to Firebase Hosting
npx firebase-tools deploy --only hosting
```

### Bundle Size (with code splitting)
- **Initial load**: ~180 KB (gzipped)
- **Export functions**: ~174 KB (lazy loaded)
- **Firebase SDK**: ~43 KB (chunked)

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Marked** - Markdown parsing
- **DOMPurify** - XSS sanitization
- **jsPDF** - PDF generation
- **docx** - Word document generation
- **Firebase** - Authentication & Realtime Database
- **IndexedDB** - Offline storage

## 📄 License

MIT

---

Made with ❤️ for learners everywhere
