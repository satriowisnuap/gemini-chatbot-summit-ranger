const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Simpan riwayat percakapan untuk dikirim ke backend
const conversation = [];

// Quick prompt buttons
document.querySelectorAll('.quick-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        if (prompt) {
            input.value = prompt;
            form.dispatchEvent(new Event('submit'));
        }
    });
});

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const userMessage = input.value.trim();
    if (!userMessage) return;

    // 1. Tampilkan pesan user ke UI
    appendMessage('user', userMessage);

    // Tambahkan pesan user ke riwayat
    conversation.push({ role: 'user', text: userMessage });

    // Kosongkan input form
    input.value = '';

    // 2. Tampilkan pesan sementara "Thinking..." sebagai typing indicator
    const thinkingMessageElement = appendTypingIndicator();

    try {
        // 3. Kirim request ke backend API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conversation }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 4. Timpa typing indicator dengan balasan dari AI
        if (data && data.result) {
            replaceTypingWithMessage(thinkingMessageElement, data.result);
            // Tambahkan balasan model ke riwayat percakapan
            conversation.push({ role: 'model', text: data.result });
        } else {
            replaceTypingWithMessage(thinkingMessageElement, 'Maaf, tidak ada balasan dari server.');
        }
    } catch (error) {
        console.error('Error fetching response:', error);
        // 5. Tampilkan error jika request gagal
        replaceTypingWithMessage(thinkingMessageElement, 'Gagal mendapatkan balasan dari server. Coba lagi.');

        // Hapus pesan user terakhir dari riwayat agar tidak merusak konteks di request selanjutnya
        conversation.pop();
    }
});

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

function appendMessage(sender, text) {
    const row = document.createElement('div');
    row.classList.add('message-row', sender);

    if (sender === 'bot') {
        const avatarEl = document.createElement('div');
        avatarEl.classList.add('bot-avatar-mini');
        avatarEl.textContent = '🏔️';
        row.appendChild(avatarEl);
    }

    const msg = document.createElement('div');
    msg.classList.add('message', sender);
    
    if (sender === 'bot') {
        msg.innerHTML = formatMarkdown(text);
    } else {
        msg.textContent = text;
    }
    
    row.appendChild(msg);

    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;

    return row;
}

function appendTypingIndicator() {
    const row = document.createElement('div');
    row.classList.add('message-row', 'bot');

    const avatarEl = document.createElement('div');
    avatarEl.classList.add('bot-avatar-mini');
    avatarEl.textContent = '🏔️';
    row.appendChild(avatarEl);

    const msg = document.createElement('div');
    msg.classList.add('message', 'bot');

    const indicator = document.createElement('div');
    indicator.classList.add('typing-indicator');
    indicator.innerHTML = '<span></span><span></span><span></span>';
    msg.appendChild(indicator);

    row.appendChild(msg);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;

    return row;
}

function replaceTypingWithMessage(rowElement, text) {
    const msgEl = rowElement.querySelector('.message.bot');
    if (msgEl) {
        msgEl.innerHTML = formatMarkdown(text);
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}
