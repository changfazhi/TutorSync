# TutorSync

TutorSync is an offline-capable, desktop-first dashboard designed specifically for 1-to-1 private freelance tutors. Manage your student profiles, log lessons, track curriculum progress, analyze performance, and handle billing—all in one place, securely on your machine.

## 🎯 What Problem It Solves

Freelance tutors often juggle multiple spreadsheets, calendar apps, and disjointed notes to keep track of their students, schedules, and payments. Relying on cloud subscriptions can be costly and raises privacy concerns regarding student data.

TutorSync solves this by providing a comprehensive, **all-in-one local dashboard**. It offers the organizational power of a premium SaaS product with the privacy, zero-latency, and offline capabilities of a local desktop application. No monthly fees, no internet connection required to check your schedule or log a lesson.

## 💻 Tech Stack

TutorSync is built with modern, performant technologies tailored for local desktop applications:

*   **[Electron](https://www.electronjs.org/)** - Desktop Application Framework
*   **[React](https://react.dev/) 19** - UI Library
*   **[TypeScript](https://www.typescriptlang.org/)** - Static Type Checking
*   **[Vite](https://vitejs.dev/)** - Next Generation Frontend Tooling
*   **[Dexie.js](https://dexie.org/)** - IndexedDB wrapper for offline-capable Local Storage
*   **[Chart.js](https://www.chartjs.org/) & react-chartjs-2** - Data Analytics and Visualizations
*   **[Lucide React](https://lucide.dev/)** - Beautiful, consistent icons
*   **[React Router](https://reactrouter.com/)** - Application Routing

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository
2. Navigate to the project directory
   ```bash
   cd tutorsync
   ```
3. Install dependencies
   ```bash
   npm install
   ```
4. Start the development server and Electron app
   ```bash
   npm run start
   ```

## 🛠️ Build

To build the application for production:

```bash
npm run build
```

## 📝 License

This project is licensed under the MIT License.
