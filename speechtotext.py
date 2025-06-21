from google.cloud import speech_v1 as speech
import os
from pydub import AudioSegment
import wave

with wave.open("ample_audio.wav", "rb") as wav_file:
    sample_rate = wav_file.getframerate()
    print(f"Sample rate: {sample_rate}")

client = speech.SpeechClient.from_service_account_file('speech-key.json')

def convert_to_mono(input_file, output_file):
    audio = AudioSegment.from_file(input_file)
    audo = audio.set_channels(1)
    audio.export(output_file, format="wav")
    print('converted to mono')

def transcribe_audio(input_file):
    with open(input_file, 'rb') as audio_file:
        content = audio.file.read();
        audio = speech.RecognitionAudio(content=content)
        config = speech.RecognitionConfig(
            encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz = sample_rate,
            language_code = 'en-us'
        )
        response = client.recognize(config=config, audio=audio)
        for result in response.results:
            print(f'Transcript: {result.alternatives[0].transcript}')
            print(f'Confidence: { result.alternatives[0].confidence}')
        return response
    
    convert_to_mono("sample_audio.wav", "sample_audio_mono.wav")
    transcribe_audio("sample_audio_mono.wav")