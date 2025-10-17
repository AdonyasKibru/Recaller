    Recaller

This is Recaller, my personal test project. I started this project because I wanted to test my skills and
develop an application that is both useful and built entirely from my own idea.

    Project Idea

The main idea behind Recaller is to help students remember what they studied. When it is exam time or they need 
a quick review, the app gives them easy access to their own study material in a clear and organized way.

    Main Features

1. Upload Audio Files

Users can upload audio files from their device with a .wav extension.
The audio is then transcribed into text using the Google Speech-to-Text API.
Once the transcription is complete, the user can choose to summarize the text or delete it.

2. Summarization

If the user chooses to summarize, the transcript is sent to the OpenAI API.
The AI returns clean and organized notes written in bullet-point form that capture the main ideas from the transcript.
This helps students review key information quickly.

3. Flashcards and Quizzes

The app can also create quiz-style flashcards from the transcript.
Each flashcard shows one question and its choices at a time, allowing users to flip through and test themselves.
The generated quizzes are saved for future practice and can be viewed at any time.

4. User Management

Since the application uses api and I did not want to share my api keys. The application includes a user management 
system in the form of stting. In which users can create and save their own profile. The qould need to insert their
prefered username, open AI api key, and a google speach to text transcription api json key. This allows every user
to user thier own apis and manage thier own payments.


    Tools and Technologies

Frontend

    React Native

    Expo Go

    AsyncStorage for local data

Backend

    Node.js with Express

    File system for managing user data

APIs

    Google Speech-to-Text API for transcription

    OpenAI API for summaries and quiz generation


    How to Run This Project (For Developers)

If you'd like to clone this project and run it yourself, here’s how to get started:

1. Clone the Repository

    git clone https://github.com/AdonyasKibru/Recaller.git
    cd Recaller

2. Install Backend Dependencies
    npm install

3. Start the Backend Server

    node server.js

The backend will run at: http://localhost:5000

4. Run the Frontend (React Native with Expo)
Navigate to your React Native frontend directory (if separate).
If it's also in the root, skip this step.

Install frontend dependencies:

npm install
npx expo start

Open the Expo Go app on your phone and scan the QR code to run the app.

5. Test Features
    - fill out the settings to creat like a user profile.
    - Add some .wav files to the recordings/ folder.
    - Use the app to list and transcribe them.
    - Use the summarize feature to summarize it.
    - then use the summerized not to generate quizzes.

For more watch the Recaller_Demo.mp4

