   ![License](https://img.shields.io/badge/license-MIT-blue.svg)
   ![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

# Character Crafter AI

## 👋 Welcome to My First GitHub Project!

Hey there! Welcome to my very first GitHub project! 🎉

I have to be honest with you - I don't know any programming languages at all! This entire project, from concept brainstorming to development documentation, coding, and debugging, was all created using Google Build and Cursor. It's been quite a journey! 😅

I've tried my best to squash all the bugs I could find, but I can't guarantee there aren't any lurking issues still waiting to be discovered. So any feedback you have would be incredibly valuable to me - it's like having a conversation with fellow enthusiasts! 💬

The inspiration for this project came from my role-playing adventures with SillyTavern. I thought it would be fun to use AI's random generation capabilities to create more diverse characters and just have some good old-fashioned fun with it! 🎭

If you're into similar hobbies, give this project a try! Who knows, you might discover your next favorite character! ✨

**Please note**: This project is for personal use only - no commercial purposes, please! And if you decide to share it with others, please give credit where it's due. 🙏

Go ahead, give it a shot, and most importantly - have fun! I hope you enjoy playing around with it! 🚀

---

## Overview

Character Crafter AI is an AI-assisted single-page application for novelists to create and develop characters through a seamless, vertically-scrolling workflow. It allows users to generate character profiles, cards, and images, with options to save and load their projects locally.

## Features

-   **Step-by-Step Workflow**: A guided, non-linear process that takes you from a basic idea to a fully visualized character.
-   **AI-Powered Content Generation**: Utilizes Large Language Models (LLMs) to generate detailed character profiles, structured W++ character cards, and descriptive image prompts.
-   **AI Image Generation**: Creates a visual representation of your character based on the generated prompt using Google Imagen or Black Forest Labs (BFL) FLUX models.
-   **Flexible API Support**: Comes pre-configured for Google Gemini but allows switching to third-party providers for both text and image generation (e.g., any OpenAI-compatible API).
-   **Local Project Persistence**: Save your entire character project, including the generated image, to a local file and load it back later to continue your work.
-   **Highly Configurable**: An in-app settings panel allows you to customize system prompts, API providers, model names, and API credentials.
-   **No Backend Needed**: The entire application runs directly in your browser, making API calls from the client-side.

## Tech Stack

-   **React**: For building the user interface.
-   **TypeScript**: For type-safe code.
-   **Vite**: For fast development server and build tooling.
-   **Tailwind CSS**: For styling.
-   **@google/genai**: The official Google Gemini API client library.

## Getting Started

### Prerequisites

-   A modern web browser (e.g., Chrome, Firefox, Safari, Edge).
-   **Node.js**: Required to run the development server. You can download it from [nodejs.org](https://nodejs.org/).
-   API Keys for the AI services you intend to use:
    -   **Google AI API Key**: Required for the default Google Gemini models.
    -   **(Optional) Third-Party LLM API Key**: For using an OpenAI-compatible text generation service.
    -   **(Optional) BFL API Key**: For using Black Forest Labs FLUX models for image generation.

### Installation

This project uses Vite as the build tool and development server for a modern React + TypeScript development experience.

**Step 1: Install Dependencies**

Open your terminal or command prompt, navigate to the project directory, and run:

```bash
npm install
```

This will install all required dependencies including React, TypeScript, Vite, and the Google Gemini AI library.

**Step 2: Start the Development Server**

You have several options to start the application:

**Option A: Using Startup Scripts (Recommended)**

**For Windows:**
- Double-click `start.bat` for full setup and start
- Double-click `quick-start.bat` for simple start
- See `STARTUP_GUIDE.txt` for detailed instructions

**For Linux/macOS:**
- Run `./start.sh` in terminal (may need `chmod +x start.sh` first)
- See `STARTUP_GUIDE.txt` for detailed instructions

These scripts will:
- Check if Node.js is installed
- Install dependencies if needed
- Start the development server
- Provide helpful error messages

**Option B: Using Command Line**
Run the following command in your terminal:

```bash
npm run dev
```

The application will be available at **`http://localhost:3000`**. Open this URL in your web browser to use the application.

### Configuration

**IMPORTANT SECURITY NOTICE**: This application stores third-party API keys in your browser's `localStorage` for session persistence. This is convenient but means the keys are accessible in plain text within your browser. Never expose your keys in public code repositories or share project files containing sensitive settings.

**1. Google Gemini API Key**

The application is built to use the Google AI API Key from an environment variable named `GEMINI_API_KEY`.

-   **Get API Key**:
    1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
    2. Sign in with your Google account
    3. Click "Create API Key" to create a new API key
    4. Copy the generated API key

-   **For Local Development**: 
    1. Copy the `.env.example` file in the project root to `.env`
    2. Edit the `.env` file and replace `your_google_gemini_api_key_here` with your actual API key:
    ```
    GEMINI_API_KEY=your_actual_api_key_here
    ```
    
    The Vite development server will automatically load this environment variable.

-   **For Deployment**: In your hosting provider's settings (e.g., Vercel, Netlify), set an environment variable with the name `GEMINI_API_KEY` and your Google AI key as the value.

**2. Third-Party APIs**

Third-party services are configured entirely through the application's UI.

**BFL (Black Forest Labs) API Configuration**:
1. Visit [BFL API](https://api.bfl.ml/) to get your API key
2. After starting the app, click the **Settings** (gear) icon in the top-right corner
3. In the settings panel, select **"Third-Party"** as the image generation provider
4. Enter your BFL API key
5. Choose your desired model (flux-pro-1.1-ultra, flux-pro-1.1, flux-pro, flux-dev)
6. Click **Save & Close** to save your settings

**Other Third-Party LLM API Configuration**:
1. In the settings panel, select **"Third-Party"** as the text generation provider
2. Enter your service's **API URL** and **API Key**
3. Click **Test Connection** to test the connection. If successful, it will fetch available models and populate them in a dropdown for you to select
4. Choose your desired model
5. Click **Save & Close** to save your settings

## Usage

### Basic Workflow

1. **Idea**: Start with a basic character concept or idea
2. **Profile**: Generate a detailed character profile using AI
3. **Card**: Create a structured W++ character card
4. **Prompt**: Generate an image prompt for AI art generation
5. **Image**: Generate a visual representation of your character

### Project Management

- **Save Project**: Click the "Save" button to download your entire project as a JSON file
- **Load Project**: Click the "Load" button to upload and continue working on a previously saved project
- **Settings**: Click the gear icon to configure API providers, models, and prompts

## Deployment

This application is a static site, meaning it contains no server-side logic and can be hosted on any static hosting platform. However, because it relies on in-browser transpilation (`Babel`), it is **not recommended for production use** due to performance reasons. It is primarily designed as a local-first tool.

If you wish to deploy it, follow your hosting provider's instructions for static sites (e.g., **Vercel**, **Netlify**, **Cloudflare Pages**).

1.  Push your project files to a Git repository (e.g., on GitHub, GitLab).
2.  Connect your Git repository to the hosting provider.
3.  **Configure the Environment Variable.** This is the most important step for the default Google AI provider to work. In your hosting provider's project settings, create a new environment variable:
    -   **Name:** `GEMINI_API_KEY`
    -   **Value:** `Your_Google_AI_API_Key_Goes_Here`
4.  Deploy the project.

## Security Considerations

**Important Security Reminders**:

1. **API Key Security**:
   - Never commit `.env` files containing real API keys to version control
   - Ensure `.env` files are added to `.gitignore`
   - Use system environment variables in production instead of files

2. **Local Storage Security**:
   - The app stores API keys in your browser's `localStorage`
   - These keys are stored in plain text, so ensure your device is secure
   - Do not use this app on public or shared devices

3. **Network Security**:
   - Use the app in secure network environments
   - Avoid entering sensitive information on public WiFi

4. **Regular Updates**:
   - Regularly rotate your API keys
   - Keep the app updated to get the latest security fixes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the maintainers.

---

**Happy Character Crafting!** 🎭✨
