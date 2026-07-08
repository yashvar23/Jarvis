# Release Notes: Jarvis v0.0.1

This is the initial release of the rebranded and self-hosted **Jarvis** daemon and desktop sidecar binaries under the `@yashvar23` namespace.

## 🧠 Central Brain (Daemon)
The central orchestrator is published to npm and can be installed globally:

```bash
bun install -g @yashvar23/brain
jarvis start
```

Or run via Docker:

```bash
docker run -d --name jarvis \
  -p 3142:3142 \
  -v jarvis-data:/data \
  yashvarking/jarvis:latest
```

---

## 🖥️ Standalone Sidecars (Desktop Clients)
Download the client for the desktop machines you want Jarvis to observe and control:

* **macOS:** Download `Jarvis-Mac.dmg` (packaged app with custom Jarvis icon).
* **Windows:** Download `Jarvis-Windows.exe` (standalone binary with custom embedded icon).
* **Linux:** Download `jarvis-linux` (standalone executable).

## 🚀 Connection Instructions
1. Start the Jarvis daemon using **Bun** or **Docker**.
2. Open the dashboard at `http://localhost:3142`.
3. Go to **Settings -> Sidecar** to generate an enrollment token.
4. Run the downloaded sidecar binary on your machine and paste the token to connect them securely!
