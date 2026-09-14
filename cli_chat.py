import sys
import json
import base64
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

API_URL = "http://127.0.0.1:8000/api/chat"

PRESET_QUERIES = {
    "1": (
        "Gold & Silver Hallmarking & HUID (English)",
        "How do I check if my gold jewellery is hallmarked using HUID and what are the 3 mandatory marks?",
        False
    ),
    "2": (
        "Hindi Voice: Gold Hallmarking (सोने की हॉलमार्किंग एवं एचयूआईडी)",
        "सोने के आभूषणों पर 3 अनिवार्य चिह्न कौन से हैं और एचयूआईडी की जांच कैसे करें?",
        True
    ),
    "3": (
        "Gujarati: Pressure Cooker Standards (પ્રેશર કૂકર માટે ભારતીય સ્ટાન્ડર્ડ)",
        "પ્રેશર કૂકર માટે કયો ભારતીય સ્ટાન્ડર્ડ લાગુ પડે છે અને શું આ ફરજિયાત છે?",
        False
    ),
    "4": (
        "Tamil Voice: Helmet ISI Certification (ஹெல்மெட் பிஐஎஸ் சான்றிதழ்)",
        "இருசக்கர வாகன ஹெல்மெட்டுகளுக்கு பிஐஎஸ் சான்றிதழ் கட்டாயமா?",
        True
    ),
    "5": (
        "Factory Batch Calculator & SIT Routine Testing",
        "I produce 50,000 pressure cookers per month under IS 2347. How many batches and what SIT routine tests are required?",
        False
    ),
    "6": (
        "Licence Lifecycle & Form-VI Renewal",
        "How do I renew my BIS licence under Form-VI for pressure cookers IS 2347 and what is the minimum marking fee?",
        False
    ),
    "7": (
        "HSN Customs Port Clearance & ICEGATE",
        "What is the DGFT import policy and ICEGATE clearance status for HSN 7615.10?",
        False
    ),
    "8": (
        "Mandatory Lab Testing & Accredited Facilities",
        "What are the mandatory testing parameters and accredited laboratories for toilet soap IS 2888?",
        False
    ),
}


def query_chatbot(message: str, enable_voice: bool = False, speaker: str = "priya"):
    print("\n" + "=" * 75)
    print(f" USER QUERY: {message}")
    if enable_voice:
        print(f" [VOICE ENABLED] Synthesizing speech with Sarvam AI Bulbul v3 (Speaker: {speaker})...")
    print("=" * 75)
    print(" Contacting BIS Assistant Backend (http://127.0.0.1:8000/api/chat)...")

    payload = json.dumps({
        "message": message,
        "enable_voice": enable_voice,
        "voice_speaker": speaker
    }).encode("utf-8")

    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=40) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"\n Error connecting to backend: {e}")
        print("Please ensure the backend is running: uvicorn app.main:app --port 8000\n")
        return

    # Display Metadata & Timings
    timings = data.get("timings", {})
    qa = data.get("query_analysis", {})
    detected_lang = data.get("detected_language") or data.get("language")
    print(f"\n [ROUTING & MULTILINGUAL METADATA]")
    print(f"  • Language: {detected_lang} | Intent: {qa.get('intent')} | Needs RAG: {qa.get('needs_rag')} | Grounded: {data.get('grounded')}")
    print(f"  • Latencies: Total: {timings.get('total_ms')}ms | Groq: {timings.get('groq_ms')}ms | Gemini: {timings.get('gemini_ms')}ms")

    # Audio file output
    audio_b64 = data.get("audio_base64")
    if audio_b64:
        audio_filename = "response_voice.wav"
        try:
            with open(audio_filename, "wb") as f:
                f.write(base64.b64decode(audio_b64))
            print(f"  •  Voice Audio Generated: Saved to '{audio_filename}' ({len(audio_b64)} bytes base64)")
        except Exception as fe:
            print(f"  • Warning: Could not save audio file: {fe}")

    # Active Intelligence Cards
    active_cards = []
    if data.get("hallmarking_info"):
        active_cards.append("Hallmarking & HUID Card")
    if data.get("batch_info"):
        active_cards.append("Factory Batch SIT Card")
    if data.get("renewal_info"):
        active_cards.append("Licence Renewal Card")
    if data.get("customs_info"):
        active_cards.append("HSN Port Clearance Card")
    if data.get("testing_info"):
        active_cards.append("Testing & Labs Card")
    if data.get("compliance_info"):
        active_cards.append("Statutory QCO Compliance Card")

    print(f"  • Active Structured Cards: {', '.join(active_cards) if active_cards else 'None'}")

    # Display Natural Language Answer
    print(f"\n [CHATBOT RESPONSE ({detected_lang})]")
    print("-" * 75)
    answer_text = data.get("answer", data.get("message", "No answer provided."))
    # Safe terminal print for Windows consoles
    try:
        print(answer_text)
    except UnicodeEncodeError:
        print(answer_text.encode("utf-8", errors="replace").decode("utf-8"))
    print("-" * 75)

    # Next steps
    next_steps = data.get("next_steps", [])
    if next_steps:
        print(f"\n [RECOMMENDED NEXT STEPS]")
        for i, step in enumerate(next_steps, 1):
            try:
                print(f"  {i}. {step}")
            except UnicodeEncodeError:
                print(f"  {i}. {step.encode('utf-8', errors='replace').decode('utf-8')}")
    print("\n" + "=" * 75 + "\n")


def main():
    if len(sys.argv) > 1:
        first_arg = sys.argv[1].strip()
        if first_arg in PRESET_QUERIES:
            _, query, voice_req = PRESET_QUERIES[first_arg]
            query_chatbot(query, enable_voice=voice_req)
            return
        enable_voice = "--voice" in sys.argv
        filtered_args = [a for a in sys.argv[1:] if a != "--voice"]
        query = " ".join(filtered_args)
        query_chatbot(query, enable_voice=enable_voice)
        return

    print("\n" + "=" * 75)
    print(" BIS MULTILINGUAL & VOICE CONVERSATIONAL ASSISTANT (Sarvam AI)")
    print("=" * 75)
    print("Select a test case or type your own question in any Indian language:\n")
    for key, (title, q, is_voice) in PRESET_QUERIES.items():
        voice_tag = " [VOICE]" if is_voice else ""
        print(f" [{key}]{voice_tag} {title}")
        print(f"     Query: \"{q}\"\n")
    print(" [C] Custom Query (type your own question)")
    print(" [V] Custom Voice Query (type question + get spoken audio)")
    print(" [Q] Quit\n")

    choice = input("Enter choice (1-8, C, V, Q): ").strip()

    if choice in PRESET_QUERIES:
        _, query, voice_req = PRESET_QUERIES[choice]
        query_chatbot(query, enable_voice=voice_req)
    elif choice.upper() == "C":
        custom = input("\nEnter your question in any language: ").strip()
        if custom:
            query_chatbot(custom, enable_voice=False)
    elif choice.upper() == "V":
        custom = input("\nEnter question for spoken voice response: ").strip()
        if custom:
            query_chatbot(custom, enable_voice=True)
    elif choice.upper() == "Q":
        print("Exiting.")
    else:
        print("Invalid choice.")


if __name__ == "__main__":
    main()
