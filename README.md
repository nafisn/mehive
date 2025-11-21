# MeHive ⬡🐝⬡

**MeHive** is an interactive, visual way to capture and share your yearly superlatives. Built with React and Vite, it lets you create a personalized honeycomb grid of your favorite memories, media, and moments.

## ✨ Features

-   **Interactive Honeycomb Grid:** Drag and drop hexagons to arrange your year exactly how you want. Swap positions by dragging one hexagon onto another!
-   **Mobile Responsive:** Optimized for all devices with auto-scaling grid and touch-friendly controls.
-   **Customizable Content:** Double-tap any hexagon to edit its title, subtitle, and background image.
-   **Dynamic Layout:** Add new categories or remove ones you don't need. The grid auto-arranges itself!
-   **Personalization:**
    -   Edit the center node to reflect your name and year.
    -   Customize text colors for titles and subtitles.
    -   Add images via upload or direct URL (with CORS validation).
    -   Automatic image optimization (resized to 800px max, 80% JPEG compression).
-   **Export & Share:**
    -   **One-Click Export:** Instantly capture your entire hive layout as a high-quality PNG with transparent background.
    -   **Reliable Export:** Uses native Canvas API for consistent results across all devices, including iOS.
-   **Robust Persistence:** Your progress is automatically saved to localStorage, with positions preserved across sessions.
-   **Smart Reset:** One-click reset to clear all customizations and restore default layout.

## 🛠️ Tech Stack

-   **Framework:** React + Vite
-   **Styling:** CSS Modules (Vanilla CSS)
-   **Libraries:**
    -   `react-draggable`: For the interactive grid layout.
-   **Storage:** localStorage for data persistence and layout positions.

## 🚀 Getting Started

### Prerequisites

-   Node.js (v14+ recommended)
-   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/nafisn/mehive.git
    cd mehive
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:5173` (or the port shown in your terminal).

## 🐳 Docker Support

You can also run MeHive using Docker:

```bash
docker-compose up --build
```

## 📦 Deployment

This project is ready to be deployed on platforms like **Vercel** or **Netlify**. Currently deployed via Vercel.

1.  Push your code to GitHub.
2.  Import the repository into Vercel/Netlify.
3.  The build settings should be automatically detected:
    -   **Build Command:** `npm run build`
    -   **Output Directory:** `dist`

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
