import os
from typing import Optional
from deepgram import DeepgramClient

DEFAULT_MODEL = "nova-3"


def load_api_key():
    api_key = os.environ.get("DEEPGRAM_API_KEY")
    if not api_key:
        raise ValueError("DEEPGRAM_API_KEY environment variable is required")
    return api_key


# =========================
# Initialize client
# =========================
deepgram = DeepgramClient(api_key=load_api_key())


# =========================
# Input validation
# =========================
def validate_transcription_input(file: Optional[bytes], url: Optional[str]):
    if url:
        return {"type": "url", "data": url}
    if file:
        return {"type": "file", "data": file}
    return None


# =========================
# Transcription request
# =========================
async def transcribe_audio(input_data, model=DEFAULT_MODEL):
    request_options = dict(
        model=model,
        smart_format=True,
        diarize=True,
        sentiment=True,
        summarize=True,
        utterances=True,
        paragraphs=True,
        detect_language=True,
    )

    if input_data["type"] == "url":
        return deepgram.listen.v1.media.transcribe_url(
            url=input_data["data"],
            **request_options
        )

    return deepgram.listen.v1.media.transcribe_file(
        request=input_data["data"],
        **request_options
    )


# =========================
# Response formatter
# =========================
def format_transcription_response(transcription_response, model_name):
    results = transcription_response.results
    metadata = transcription_response.metadata
    alt = results.channels[0].alternatives[0]

    response = {
        "transcript": alt.transcript or "",
        "confidence": getattr(alt, "confidence", None),
        "metadata": {
            "model_uuid": getattr(metadata, "model_uuid", None),
            "request_id": getattr(metadata, "request_id", None),
            "model_name": model_name,
            "duration": getattr(metadata, "duration", None),
            "language": getattr(metadata, "language", None),
        },
    }

    # =========================
    # Words (timestamps + speaker + confidence)
    # =========================
    if hasattr(alt, "words") and alt.words:
        response["words"] = [
            {
                "text": w.word,
                "start": w.start,
                "end": w.end,
                "confidence": getattr(w, "confidence", None),
                "speaker": getattr(w, "speaker", None),
            }
            for w in alt.words
        ]

    # =========================
    # Utterances (clean speaker segments)
    # =========================
    if hasattr(results, "utterances") and results.utterances:
        response["utterances"] = [
            {
                "speaker": u.speaker,
                "start": u.start,
                "end": u.end,
                "transcript": u.transcript,
                "confidence": getattr(u, "confidence", None),
            }
            for u in results.utterances
        ]

    # =========================
    # Sentiment
    # =========================
    if hasattr(alt, "sentiments") and alt.sentiments:
        response["sentiment"] = [
            {
                "sentiment": s.sentiment,
                "confidence": s.confidence,
                "start": s.start,
                "end": s.end,
            }
            for s in alt.sentiments
        ]

    # =========================
    # Topics
    # =========================
    if hasattr(results, "topics") and results.topics:
        response["topics"] = [
            {
                "topic": t.topic,
                "confidence": t.confidence,
            }
            for t in results.topics
        ]

    # =========================
    # Keywords
    # =========================
    if hasattr(results, "keywords") and results.keywords:
        response["keywords"] = [
            {
                "keyword": k.keyword,
                "confidence": k.confidence,
            }
            for k in results.keywords
        ]

    # =========================
    # Entities (NER)
    # =========================
    if hasattr(results, "entities") and results.entities:
        response["entities"] = [
            {
                "text": e.text,
                "type": e.label,
                "confidence": e.confidence,
                "start": getattr(e, "start", None),
                "end": getattr(e, "end", None),
            }
            for e in results.entities
        ]

    # =========================
    # Summary
    # =========================
    if hasattr(results, "summary") and results.summary:
        response["summary"] = results.summary

    # =========================
    # Paragraphs
    # =========================
    if hasattr(results, "paragraphs") and results.paragraphs:
        response["paragraphs"] = results.paragraphs

    return response
