
// This is a placeholder file for the chatbot embed script.
// In a real application, this file would contain the logic to
// render the chatbot widget on the user's website.

console.log("Content Forge Chatbot Embed Loaded");

(function() {
    const scriptTag = document.getElementById('content-forge-chatbot');
    if (!scriptTag) {
        console.error('Chatbot script tag not found.');
        return;
    }

    const welcomeMessage = scriptTag.dataset.welcomeMessage || 'Hello! How can I help you?';
    const primaryColor = scriptTag.dataset.primaryColor || '#6D28D9';

    // Create a container for the chatbot
    const chatbotContainer = document.createElement('div');
    chatbotContainer.style.position = 'fixed';
    chatbotContainer.style.bottom = '20px';
    chatbotContainer.style.right = '20px';
    chatbotContainer.style.zIndex = '9999';

    // Create the chat button
    const chatButton = document.createElement('button');
    chatButton.style.width = '60px';
    chatButton.style.height = '60px';
    chatButton.style.borderRadius = '50%';
    chatButton.style.backgroundColor = primaryColor;
    chatButton.style.border = 'none';
    chatButton.style.color = 'white';
    chatButton.style.display = 'flex';
    chatButton.style.alignItems = 'center';
    chatButton.style.justifyContent = 'center';
    chatButton.style.cursor = 'pointer';
    chatButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    chatButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`;

    chatbotContainer.appendChild(chatButton);
    document.body.appendChild(chatbotContainer);

    chatButton.addEventListener('click', () => {
        alert(`Chatbot says: "${welcomeMessage}"`);
    });
})();

    