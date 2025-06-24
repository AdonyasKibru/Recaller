This is Recaller my personal test project. I started this project because I wanted to test my skills
and develop some application that is useful and also something that was of my own idea.

Idea : The main idea behind Recaller is to help students remember what they studied. 
       When it's exam time or they need a quick review, the app gives them easy access to their
       own study material in a clear and organized way.

The idea I had when I started was the app would have three main features:

    1. Start New Session: 
        - Users can press a “Start” button to begin a new session.
        - The app records their voice while they read out loud (limited to 10 minutes).
        - The audio is then turned into text using Google's Speech-to-Text API.
        - After that, the user can either summarize the text or delete it.

    2. Summarization:
        - If they choose to summarize, the app sends the text to ChatGPT (OpenAI API).
        - It returns clean, short bullet-point notes based on what was said.

    3. Flashcards / Quizzes:
        - The app can also create flashcard-style quiz questions from the same transcript.
        - This helps students test themselves on what they just studied.

What I’ve Done:

    - I built a simple and clean user interface using React Native and Expo Go.
    - I was able to transcribe sample audio and show the text in the app.
    - I also created sample flashcard quizzes, which could be reused in a future quiz app.

Things That Didn’t Work:

    1. Expo Audio Issue: Expo records audio in .m4a format, but Google’s API only works with .wav. 
       So I had to manually add .wav files into the app’s storage to test it. Not ideal.
    
    2. OpenAI API Limits: I couldn’t test the ChatGPT feature fully because I ran out of free API credits
       and didn’t want to pay just for this test.

    3. Recording Directly in App: Right now, it's not easy to save .wav recordings directly from the app
       without changing how Expo works.

Tools I Used:
    - React Native (frontend)
    - Expo Go (for testing)
    - Node.js + Express (backend)
    - Google Speech-to-Text API
    - OpenAI API (ChatGPT – only tested with samples)

Final Thoughts:

This is one of my first self-made, self-paced projects, and I’m really proud of it. Even though it’s not fully done,
it taught me a lot, and I’m excited to take on more challenging projects in the future.



        How to Run This Project (For Developers)

If you'd like to clone this project and run it yourself, here’s how to get started:

1. Clone the Repository

    git clone https://github.com/AdonyasKibru/Recaller.git
    cd Recaller

2. Install Backend Dependencies
    npm install

3. Add Required API Keys
 Google Cloud Speech-to-Text
    Add your speech-key.json file (downloaded from Google Cloud Console). Place it in the root of the project.

 OpenAI API Key
    Create a .env file in the root of the project. 
    Add your OpenAI key:
        OPENAI_API_KEY=your_openai_api_key_here


4. Start the Backend Server

    node server.js

The backend will run at: http://localhost:5000

5. Run the Frontend (React Native with Expo)
Navigate to your React Native frontend directory (if separate).
If it's also in the root, skip this step.

Install frontend dependencies:

npm install
npx expo start

Open the Expo Go app on your phone and scan the QR code to run the app.

6. Test Features
    - Add some .wav files to the recordings/ folder.
    - Use the app to list and transcribe them.
    - Use the summarize feature if your OpenAI key is working.
    - View or save the summaries and quizzes.

