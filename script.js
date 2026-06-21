const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Keep track of the conversation history to send to the backend
const conversation = [];

function formatMarkdown(text) {
  if (!text) return '';

  // 1. Escape HTML to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // 2. Parse Headers
  html = html.replace(/^(?:###)\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^(?:##)\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^(?:#)\s+(.+)$/gm, '<h1>$1</h1>');

  // 3. Parse Bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>');

  // 4. Parse Italic: *text* -> <em>text</em>
  html = html.replace(/\*([^\*\n]+?)\*/g, '<em>$1</em>');

  // 5. Parse Inline Code: `code` -> <code>code</code>
  html = html.replace(/`([^`\n]+?)`/g, '<code>$1</code>');

  // 6. Parse bullet points: lines starting with *, - or • followed by space
  html = html.replace(/^[•\-\*]\s+(.+)$/gm, '• $1');

  return html;
}

// Helper function to append a message to the chat box
function appendMessage(role, text) {
  const messageElement = document.createElement('div');
  // Add classes for styling based on the role ('user' or 'model')
  messageElement.classList.add('message', role); 
  
  if (role === 'model') {
    messageElement.innerHTML = formatMarkdown(text);
  } else {
    messageElement.textContent = text;
  }
  
  chatBox.appendChild(messageElement);
  
  // Auto-scroll to the bottom of the chat box
  chatBox.scrollTop = chatBox.scrollHeight;
  
  return messageElement;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const text = userInput.value.trim();
  if (!text) return; // Prevent empty submissions
  
  // 1. Add user's message to the UI
  appendMessage('user', text);
  
  // Add to conversation history
  conversation.push({ role: 'user', text: text });
  
  // Clear the input field
  userInput.value = '';
  
  // 2. Show a temporary "Thinking..." message
  const thinkingMessageElement = appendMessage('model', 'Thinking...');
  
  try {
    // 3. Send the conversation history to the backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 4. Replace "Thinking..." with the AI's reply
    if (data && data.result) {
      thinkingMessageElement.innerHTML = formatMarkdown(data.result);
      // Add the model's reply to the conversation history
      conversation.push({ role: 'model', text: data.result });
    } else {
      thinkingMessageElement.textContent = 'Sorry, no response received.';
    }
    
  } catch (error) {
    console.error('Error fetching response:', error);
    // 5. If an error occurs, show the failure message
    thinkingMessageElement.textContent = 'Failed to get response from server.';
    
    // Optional: Remove the failed user message from the history 
    // so it doesn't get sent on the next successful request
    conversation.pop(); 
  }
});
