import os
import json
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY not found in .env file")

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Gemini client
client = genai.Client(api_key=API_KEY)

# Global chat session (for memory)
chat_session = None

def get_chat_session():
    """Create or return existing chat session with search tool"""
    global chat_session
    if chat_session is None:
        try:
            # Try to create chat with search tool
            search_tool = types.Tool(google_search=types.GoogleSearch())
            chat_session = client.chats.create(
                model="gemini-2.5-flash",
                config=types.GenerateContentConfig(tools=[search_tool])
            )
            print("✅ Chat session created with Google Search enabled")
        except Exception as e:
            # Fallback: Create chat without search tool
            print(f"⚠️ Could not enable search: {e}")
            chat_session = client.chats.create(model="gemini-2.5-flash")
            print("✅ Chat session created without search tool")
    return chat_session

@app.route('/')
def index():
    """Serve the main chat interface"""
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages from the frontend"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get or create chat session
        chat = get_chat_session()
        
        # Send message to Gemini
        response = chat.send_message(user_message)
        
        # Return response
        return jsonify({
            'response': response.text,
            'success': True
        })
        
    except Exception as e:
        print(f"❌ Error in /chat: {e}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/reset', methods=['POST'])
def reset_chat():
    """Reset the chat session (clear memory)"""
    global chat_session
    chat_session = None
    return jsonify({'message': 'Chat session reset successfully', 'success': True})

if __name__ == '__main__':
    print("🚀 Starting Gemini Chatbot Server...")
    print("📍 Open http://127.0.0.1:5050 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5050)