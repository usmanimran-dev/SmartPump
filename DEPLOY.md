# Deploying Smart Pump to Vercel

This guide outlines the steps to deploy the Smart Pump Angular application to Vercel.

## Prerequisites

- **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
- **Vercel CLI**: Installed globally on your machine.
  ```bash
  npm install -g vercel
  ```

## Deployment Steps

1.  **Login to Vercel**
    Open a terminal in the project root and run:
    ```bash
    vercel login
    ```
    Follow the prompts to authorize via your email or GitHub/GitLab/Bitbucket.

2.  **Deploy**
    Run the following command to start the deployment:
    ```bash
    vercel
    ```
    - **Set up and deploy?**: `y`
    - **Which scope?**: Select your account.
    - **Link to existing project?**: `n` (unless you already have one).
    - **Project Name**: `smart-pump` (or hit enter).
    - **In which directory is your code located?**: `./` (hit enter).
    - **Auto-detected settings**: It should detect `Angular`. Hit enter.
      - If it asks for build command: `ng build`
      - If it asks for output directory: `dist/SmartPump/browser` (Vercel usually detects this).

3.  **Production Deployment**
    Once you have tested the preview deployment, deploy to production:
    ```bash
    vercel --prod
    ```

## Environment Variables
If your application uses environment variables (e.g., for Firebase), you need to set them in Vercel:
1.  Go to your Vercel Project Dashboard.
2.  Navigate to **Settings** > **Environment Variables**.
3.  Add your variables (e.g., `FIREBASE_API_KEY`, etc.).
    *Note: Since your current `app.config.ts` has the config hardcoded, this step is optional for now but recommended for security refactoring later.*

## Troubleshooting
- **Build Fails**: Run `npm run build` locally to ensure there are no errors.
- **Rewrites**: If you see 404s on refresh, ensure `vercel.json` is present.
