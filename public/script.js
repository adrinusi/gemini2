const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add user message to chat
  appendMessage('user', userMessage);
  input.value = '';

  // Add thinking message
  const thinkingId = appendMessage('bot', 'Thinking...');

  try {
    // Send request to backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Replace thinking message with AI response
    if (data.result) {
      updateMessage(thinkingId, data.result);
    } else {
      updateMessage(thinkingId, 'Sorry, no response received.');
    }

  } catch (error) {
    console.error('Error:', error);
    updateMessage(thinkingId, 'Failed to get response from server.');
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  msg.id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg.id;
}

function updateMessage(messageId, newText) {
  const msg = document.getElementById(messageId);
  if (msg) {
    msg.textContent = newText;
  }
}
