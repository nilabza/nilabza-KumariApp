# KUMARI AI Backend Server

This directory contains the Python backend server for the KUMARI AI assistant. It provides two main functionalities:
1.  **Conversation Storage:** An API to save chat histories to a database for analysis and improvement.
2.  **Telephony Integration:** Connects the AI to the public telephone network using Twilio for voice-based interaction.

---

## 🚀 Setup Instructions

### 1. Prerequisites

*   Python 3.9+
*   A MySQL-compatible database server.
*   A [Twilio account](https://www.twilio.com/try-twilio) with a phone number (for telephony feature).
*   A Google AI Studio [API Key](https://aistudio.google.com/app/apikey).
*   [ngrok](https://ngrok.com/download) for creating a public URL for your local server (for telephony feature).

### 2. Installation

```bash
# Navigate into the backend directory
cd backend

# Create and activate a virtual environment (highly recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install the required Python packages
pip install -r requirements.txt
```

### 3. Database Setup

1.  Make sure your MySQL server is running.
2.  Create a new, empty database for this application (e.g., `kumari_db`).
3.  This application will automatically create the necessary tables (`conversations`, `messages`) when it starts for the first time.

### 4. Environment Variables

Create a file named `.env` in this `backend` directory by copying `.env.example`. This is for your secret keys and database connection string.

**File: `.env`**
```ini
# Get this from Google AI Studio (https://aistudio.google.com/app/apikey)
API_KEY="YOUR_GEMINI_API_KEY"

# Your MySQL database connection string.
# Replace <USER>, <PASSWORD>, <HOST>, <PORT>, and <DATABASE_NAME>
# with your actual MySQL credentials.
# Example for a local MySQL server:
DATABASE_URL="mysql+mysqlconnector://root:mysecretpassword@localhost:3306/kumari_db"
```

---

## 🖥️ Running the Server

1.  Make sure you are in the `backend` directory.
2.  Make sure your virtual environment is active.
3.  Run the server:
    ```bash
    uvicorn main:app --reload
    ```
4.  The server is now running on `http://127.0.0.1:8000`. The frontend can now connect to it to save conversations.
5.  **Leave this terminal running.**

---

## 📞 (Optional) Telephony Setup with Twilio & ngrok

If you want to use the live phone call feature, follow these additional steps.

### Get the Public URL with ngrok

1.  Open a **new, separate terminal window.**
2.  Run this command to expose your private server to the internet:
    ```bash
    ngrok http 8000
    ```
3.  ngrok will start and show you a screen like this:

    ```
    Session Status                online
    Forwarding                    https://9b1a-12-34-56-78.ngrok-free.app -> http://localhost:8000
    ```
4.  **COPY the `https://...` URL.** This is your public backend address.

### Connecting Twilio for Real Calls

1.  Go to your Twilio phone number's configuration page.
2.  Under "Voice" -> "A CALL COMES IN", select "Webhook".
3.  **PASTE your ngrok URL** and add the endpoint path: `https://...ngrok-free.app/api/call/incoming`.
4.  Set the HTTP method to `HTTP POST`.
5.  Save. Now, when you call your Twilio number, it will connect to your local Python server!
