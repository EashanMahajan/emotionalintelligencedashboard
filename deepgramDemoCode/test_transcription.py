import asyncio
import sys
from deepgramTranscriber import (
    validate_transcription_input,
    transcribe_audio,
    format_transcription_response,
    DEFAULT_MODEL,
)


async def main(mp3_path: str):
    # Load file
    with open(mp3_path, "rb") as f:
        audio_bytes = f.read()

    # Validate input
    input_data = validate_transcription_input(file=audio_bytes, url=None)
    if not input_data:
        raise ValueError("Invalid input provided")

    # Call Deepgram
    transcription_response = await transcribe_audio(input_data)

    # Format result
    formatted = format_transcription_response(transcription_response, DEFAULT_MODEL)

    # =========================
    # Transcript & Metadata
    # =========================
    print("\n=== Transcript ===\n")
    print(formatted.get("transcript", ""))

    print("\n=== Metadata ===\n")
    for k, v in formatted.get("metadata", {}).items():
        print(f"{k}: {v}")

    # =========================
    # Words
    # =========================
    words = formatted.get("words", [])
    if words:
        print(f"\n=== Word Timestamps (first 20) ===\n")
        for word in words[:]:
            print(word)

    # =========================
    # Utterances
    # =========================
    utterances = formatted.get("utterances", [])
    if utterances:
        print(f"\n=== Utterances ===\n")
        for u in utterances[:]:  # print first 5 for brevity
            print(u)

    # =========================
    # Sentiment
    # =========================
    sentiments = formatted.get("sentiment", [])
    if sentiments:
        print(f"\n=== Sentiment ===\n")
        for s in sentiments:
            print(s)

    # =========================
    # Topics
    # =========================
    topics = formatted.get("topics", [])
    if topics:
        print(f"\n=== Topics ===\n")
        for t in topics:
            print(t)

    # =========================
    # Keywords (if any)
    # =========================
    keyterms = formatted.get("keywords", [])
    if keyterms:
        print(f"\n=== Keyterms ===\n")
        for k in keyterms:
            print(k)

    # =========================
    # Entities
    # =========================
    entities = formatted.get("entities", [])
    if entities:
        print(f"\n=== Entities ===\n")
        for e in entities:
            print(e)

    # =========================
    # Summary
    # =========================
    summary = formatted.get("summary")
    if summary:
        print(f"\n=== Summary ===\n{summary}")

    # =========================
    # Paragraphs
    # =========================
    paragraphs = formatted.get("paragraphs", [])
    if paragraphs:
        print(f"\n=== Paragraphs ===\n")
        for p in paragraphs[:]:  # first 3 paragraphs
            print(p)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_transcription.py path/to/audio.mp3")
        sys.exit(1)

    asyncio.run(main(sys.argv[1]))
