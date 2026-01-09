document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Floating Button
    const btn = document.createElement('div');
    btn.id = 'ai-assistant-btn';
    btn.innerHTML = '🛡️';
    btn.title = 'Civic Shield Assistant';
    document.body.appendChild(btn);

    // 2. Inject Helper Panel
    const panel = document.createElement('div');
    panel.id = 'ai-helper-panel';
    panel.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-800 text-lg">Civic Shield Helper</h3>
            <button id="close-ai-helper" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <p class="text-sm text-slate-600">I am your AI companion. How can I help you today?</p>
        
        <div id="ai-tips-container">
            <div class="tip-card">
                <strong>💡 Tip:</strong> Never share your OTP or Aadhaar PIN with anyone, even if they claim to be from a bank.
            </div>
        </div>
        
        <div class="mt-6">
            <button class="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                Talk to Support
            </button>
        </div>
    `;
    document.body.appendChild(panel);

    // 3. Toggle Logic
    btn.addEventListener('click', () => {
        panel.classList.toggle('open');
    });

    document.getElementById('close-ai-helper').addEventListener('click', () => {
        panel.classList.remove('open');
    });

    // 4. Contextual Tips
    const path = window.location.pathname;
    const tipsContainer = document.getElementById('ai-tips-container');

    if (path.includes('dashboard')) {
        addTip('Use the "Output Language" dropdown to get the analysis in your mother tongue.');
        addTip('If the Risk verdict is HIGH, immediately stop sharing any information.');
    } else if (path.includes('signup')) {
        addTip('Make sure to use a strong password to protect your citizen profile.');
    } else if (path.includes('index') || path === '/') {
        addTip('Civic Shield is free to use for all Indian citizens.');
    }

    function addTip(text) {
        const tip = document.createElement('div');
        tip.className = 'tip-card';
        tip.innerHTML = `<strong>💡 Tip:</strong> ${text}`;
        tipsContainer.appendChild(tip);
    }

    // 5. Entrance Animation
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(20px)';
    setTimeout(() => {
        btn.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
    }, 500);
});
