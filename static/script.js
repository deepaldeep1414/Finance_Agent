document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.getElementById('chat-history');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // Auto-resize textarea
    userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 120 ? this.scrollHeight : 120) + 'px';
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Reset input
        userInput.value = '';
        userInput.style.height = 'auto';

        // Add user message
        appendMessage('user', text);

        // Add typing indicator
        const typingId = showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();

            // Remove typing indicator
            removeElement(typingId);

            if (response.ok) {
                // Parse markdown to HTML
                const htmlContent = marked.parse(data.response);
                appendMessage('ai', htmlContent, true);
            } else {
                appendMessage('ai', `<p style="color: #ef4444;">Error: ${data.error || 'Something went wrong.'}</p>`, true);
            }

        } catch (error) {
            removeElement(typingId);
            appendMessage('ai', `<p style="color: #ef4444;">Network Error: Failed to connect to server.</p>`, true);
        }
    }

    function appendMessage(role, content, isHtml = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = role === 'ai' ? 'AI' : 'U';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';

        if (isHtml) {
            contentDiv.innerHTML = content;
        } else {
            contentDiv.textContent = content;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);

        chatHistory.appendChild(messageDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ai-message`;
        messageDiv.id = id;

        messageDiv.innerHTML = `
            <div class="avatar">AI</div>
            <div class="content">
                <div class="typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;

        chatHistory.appendChild(messageDiv);
        scrollToBottom();
        return id;
    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
});
