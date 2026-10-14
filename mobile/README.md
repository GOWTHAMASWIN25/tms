# GoExpo Mobile

Expo and React Native companion app for the existing TMS/GoExpo backend.

## Run locally

1. Start MongoDB and the backend on port 5000.
2. Copy `.env.example` to `.env` and replace `YOUR_COMPUTER_LAN_IP` with the computer's LAN IP, for example `http://192.168.1.25:5000/api`. A physical phone cannot use `localhost` to reach the computer running the API; put both devices on the same network and allow the backend port through the firewall. For an Android emulator, use `http://10.0.2.2:5000/api`.
3. Install and start the app:

   ```bash
   npm install
   npm start
   ```

4. Scan the Expo QR code with Expo Go. For an installed emulator/simulator, use `npm run android` or `npm run ios`.

The app includes secure token storage, role-aware ticket access, ticket creation with optional attachments, status updates, SuperAdmin staff assignment, native master-data management, and CSV report export/share.

## Build installable apps

1. Deploy the backend to a publicly reachable **HTTPS** URL and configure `EXPO_PUBLIC_API_URL` to its `/api` endpoint. Do not ship a store build pointed at localhost or an HTTP development server.
2. Sign in or create an Expo account, then initialize this app's EAS project from this directory:
   ```bash
   npx eas-cli login
   npx eas-cli init
   ```
   Commit the generated `extra.eas.projectId` in `app.json` so the project is linked reproducibly.
3. Create an internal Android APK for device testing:
   ```bash
   npm run build:preview
   ```
4. Create store-distribution binaries (Android AAB and iOS archive):
   ```bash
   npm run build:production
   ```
5. Configure iOS signing and store credentials in EAS, test the resulting binaries on physical devices, and submit them through App Store Connect / Google Play Console.

The EAS project link, production API host, developer accounts, signing credentials, and store metadata are deployment-specific and must be supplied by the app owner before signed production builds or store submission can complete.
