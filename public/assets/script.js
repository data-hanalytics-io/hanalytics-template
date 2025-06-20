// Navigation between pages
        document.querySelectorAll('.nav-page').forEach(page => {
            page.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all nav items and pages
                document.querySelectorAll('.nav-page').forEach(p => p.classList.remove('active'));
                document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked nav item
                page.classList.add('active');
                
                // Show corresponding page
                const targetPage = page.getAttribute('data-page');
                document.getElementById(targetPage).classList.add('active');
            });
        });

        // Live counter animation
        let counter = 200707;
        setInterval(() => {
            counter += Math.floor(Math.random() * 50) + 1;
            const liveCounter = document.getElementById('live-counter');
            if (liveCounter) {
                liveCounter.textContent = counter.toLocaleString();
            }
        }, 2000);

        // Event stream simulation
        const events = [
            'page_view error detected',
            'purchase event failed',
            'view_item_list timeout',
            'add_to_cart missing params',
            'login validation error',
            'checkout process failed',
            'search query malformed'
        ];

        setInterval(() => {
            const eventStream = document.querySelector('.event-stream');
            if (eventStream) {
                const newEvent = document.createElement('div');
                newEvent.className = 'event-item';
                newEvent.innerHTML = `
                    <div class="event-dot"></div>
                    <span>${events[Math.floor(Math.random() * events.length)]}</span>
                `;
                eventStream.insertBefore(newEvent, eventStream.firstChild);
                
                // Remove old events
                if (eventStream.children.length > 5) {
                    eventStream.removeChild(eventStream.lastChild);
                }
            }
        }, 3000);

        // Orbital data points animation
        document.querySelectorAll('.data-point').forEach((point, index) => {
            point.style.animationDelay = `${index * 0.5}s`;
        });

        // Control buttons functionality
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.style.background = 'rgba(192, 121, 224, 0.5)';
                setTimeout(() => {
                    btn.style.background = 'rgba(255, 255, 255, 0.1)';
                }, 200);
            });
        });


// Language toggle button
document.getElementById('lang-toggle').addEventListener('click', () => {
    const html = document.documentElement;
    html.lang = html.lang === 'fr' ? 'en' : 'fr';
    document.getElementById('lang-toggle').textContent = html.lang === 'fr' ? 'EN' : 'FR';
});
// Set active nav link
document.querySelectorAll('nav a').forEach(a => {
    if (location.pathname.endsWith(a.getAttribute('href'))) {
        a.classList.add('active');
    }
});