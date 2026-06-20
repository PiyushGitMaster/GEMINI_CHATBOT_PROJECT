// ===== DOM Elements =====
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// ===== State =====
let isSending = false;

// ===== Utility Functions =====
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(content, type) {
    // Remove welcome message if exists
    const welcome = chatMessages.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const textSpan = document.createElement('span');
    textSpan.textContent = content;
    messageDiv.appendChild(textSpan);

    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = getCurrentTime();
    messageDiv.appendChild(timeSpan);

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function showLoading() {
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

function setSending(state) {
    isSending = state;
    sendBtn.disabled = state;
    userInput.disabled = state;
    if (state) {
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    } else {
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

// ===== Send Message =====
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || isSending) return;

    // Clear input and reset height
    userInput.value = '';
    userInput.style.height = 'auto';

    // Add user message to UI
    addMessage(message, 'user');

    // Show loading
    showLoading();
    setSending(true);

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        });

        const data = await response.json();

        if (data.success) {
            addMessage(data.response, 'bot');
        } else {
            addMessage('❌ Error: ' + (data.error || 'Something went wrong'), 'bot');
        }
    } catch (error) {
        console.error('Error:', error);
        addMessage('❌ Network error. Please check your connection.', 'bot');
    } finally {
        hideLoading();
        setSending(false);
        userInput.focus();
    }
}

// ===== Reset Chat =====
async function resetChat() {
    if (isSending) return;

    try {
        const response = await fetch('/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        // Clear all messages except welcome
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-comment-dots"></i>
                <p>Hello! I'm your Gemini AI assistant.<br />Ask me anything! 😊</p>
            </div>
        `;

        if (data.success) {
            console.log('Chat reset successfully');
        }
    } catch (error) {
        console.error('Error resetting chat:', error);
    }
}

// ===== Event Listeners =====
// Send button click
sendBtn.addEventListener('click', sendMessage);

// Enter key to send (Shift+Enter for new line)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});

// Reset button
resetBtn.addEventListener('click', resetChat);

// Focus input on load
userInput.focus();

// ===== Handle Enter key globally (prevent form submission) =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target === userInput && !e.shiftKey) {
        e.preventDefault();
    }
});