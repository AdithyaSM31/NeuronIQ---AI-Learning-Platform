<p align="center">
  <img src="logo.png" alt="NeuronIQ Logo" width="140" />
</p>

<h1 align="center">NeuronIQ — AI Learning Platform</h1>

<p align="center">
  <strong>Transform your study materials into AI-powered learning tools</strong><br/>
  Upload PDFs & PowerPoints → Get instant summaries, notes, flashcards, quizzes & AI tutoring
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Groq-API-f55036?logo=groq&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/KaTeX-Math-green" alt="KaTeX" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Document Parsing** | Upload PDFs and PowerPoint files — text and images are extracted client-side |
| 🧠 **AI Summary** | Generates detailed, structured academic summaries with tables, formulas, and key takeaways |
| 📝 **AI Notes** | Creates exam-ready study notes with definitions, examples, and memory aids |
| 🃏 **AI Flashcards** | Auto-generates interactive flashcards with 3D flip animations |
| ❓ **AI Quizzes** | Multiple-choice quizzes with explanations and score tracking |
| 💬 **AI Tutor Chat** | Context-aware chatbot that answers questions about your uploaded material |
| 🔢 **Math Rendering** | LaTeX formulas rendered beautifully with KaTeX |
| 🖼️ **Vision Pipeline** | Two-pass system: images are analyzed via vision model, then merged with text for richer AI output |
| 📁 **Folders** | Organize modules into collapsible folders |
| 🌑 **Cosmic Dark UI** | Premium editorial-style interface inspired by Dora AI |

## 🖥️ Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/placeholder-home.png" alt="Home Page" width="800" />
</p>

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A free [Groq API Key](https://console.groq.com/keys)

### Installation

```bash
# Clone the repository
git clone https://github.com/AdithyaSM31/NeuronIQ---AI-Learning-Platform.git
cd NeuronIQ---AI-Learning-Platform

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and enter your Groq API key in **Settings**.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AdithyaSM31/NeuronIQ---AI-Learning-Platform)

The project includes `vercel.json` for SPA routing — just click deploy, no config needed.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + Vite 8 |
| **AI Backend** | Groq API (Llama 3.1 8B for text, Llama 4 Scout for vision) |
| **Math** | KaTeX via remark-math + rehype-katex |
| **PDF Parsing** | pdf.js (pdfjs-dist) |
| **PPTX Parsing** | JSZip + custom XML parser |
| **Markdown** | react-markdown + remark-gfm |
| **Styling** | Vanilla CSS with custom design system |
| **Icons** | Lucide React |
| **Routing** | React Router v7 |

## 📂 Project Structure

```
src/
├── components/
│   ├── ChatPanel.jsx          # AI Tutor sidebar chat
│   ├── Layout.jsx             # App shell with sidebar
│   ├── NewSessionModal.jsx    # Upload & create module
│   ├── SettingsModal.jsx      # API key & preferences
│   └── tabs/
│       ├── AISummary.jsx      # Summary generation & display
│       ├── AINotes.jsx        # Notes generation & display
│       ├── AIFlashcards.jsx   # Interactive flashcards
│       ├── AIQuizzes.jsx      # Quiz with scoring
│       └── OriginalContent.jsx # Raw extracted content
├── context/
│   └── AppContext.jsx         # Global state management
├── pages/
│   ├── HomePage.jsx           # Module list, folders, search
│   └── ModulePage.jsx         # Tabs + chat for a module
├── services/
│   └── geminiService.js       # Groq API calls, vision pipeline
├── utils/
│   ├── pdfParser.js           # PDF text & image extraction
│   └── pptxParser.js          # PPTX slide parsing
├── index.css                  # Complete design system
└── main.jsx                   # App entry point
```

## 🔑 API Key Setup

NeuronIQ uses the **Groq API** (free tier available):

1. Create an account at [console.groq.com](https://console.groq.com)
2. Generate an API key under **API Keys**
3. In NeuronIQ, click **Settings** (bottom of sidebar) and paste your key
4. Your key is stored locally in your browser — never sent to any server except Groq

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/AdithyaSM31">Adithya SM</a>
</p>
