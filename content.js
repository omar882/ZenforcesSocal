const isGym = window.location.href.includes('/gym');

// Fetch your toggle setting from Chrome storage
chrome.storage.local.get(['zenInGyms'], (result) => {
    const zenInGyms = result.zenInGyms || false;
    
    // Hide standings if we are NOT in a gym, OR if you turned Zen Mode ON for gyms
    const shouldHideContestData = !isGym || zenInGyms;

    // --- BEAUTIFUL NATIVE TOGGLE BUTTON ---
    const topMenu = document.querySelector('.menu-list-container ul');
    if (topMenu) {
        const toggleLi = document.createElement('li');
        const toggleLink = document.createElement('a');
        
        toggleLink.href = "#";
        
        // Add icons and text based on the state
        toggleLink.innerHTML = zenInGyms 
            ? '<span style="font-size: 13px;">🧘</span> Gym Zen: <b>ON</b>' 
            : '<span style="font-size: 13px;">⚡</span> Gym Zen: <b>OFF</b>';
        
        // Sleek, pill-shaped button styling
        toggleLink.style.display = 'inline-block';
        toggleLink.style.padding = '2px 12px';
        toggleLink.style.marginLeft = '15px';
        toggleLink.style.borderRadius = '20px'; // Makes it a pill shape
        toggleLink.style.backgroundColor = zenInGyms ? '#2c3e50' : '#e0e0e0';
        toggleLink.style.color = zenInGyms ? '#ffffff' : '#666666';
        toggleLink.style.textDecoration = 'none';
        toggleLink.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        toggleLink.style.transition = 'all 0.2s ease-in-out';
        
        // Smooth hover animations
        toggleLink.addEventListener('mouseenter', () => {
            toggleLink.style.transform = 'translateY(-1px)';
            toggleLink.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        });
        toggleLink.addEventListener('mouseleave', () => {
            toggleLink.style.transform = 'translateY(0)';
            toggleLink.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        // Click action
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault(); 
            chrome.storage.local.set({ zenInGyms: !zenInGyms }, () => {
                window.location.reload();
            });
        });

        toggleLi.appendChild(toggleLink);
        topMenu.appendChild(toggleLi); 
    }
    // -----------------------------------------------------------

    // 1. Hide the tabs in the main and secondary menus
    const menuLinks = document.querySelectorAll('.menu-list-container ul li a, .second-level-menu-list li a');
    menuLinks.forEach(link => {
        const tabText = link.innerText.trim().toUpperCase();
        
        let tabsToHide = ['RATING', 'RATING CHANGES', 'FRIENDS RATING CHANGES', 'ROOM'];
        
        // Ensure our new button doesn't accidentally get hidden
        if (!tabText.includes('GYM ZEN')) {
            if (shouldHideContestData) {
                tabsToHide.push('STANDINGS', 'COMMON STANDINGS', 'FRIENDS STANDINGS', 'STATUS');
            }
            
            if (tabsToHide.includes(tabText)) {
                link.parentElement.style.setProperty('display', 'none', 'important');
            }
        }
    });

    // 2. Hide "Final standings" and "Current standings" links in the contest tables
    if (shouldHideContestData) {
        const allLinks = document.querySelectorAll('a');
        allLinks.forEach(link => {
            const linkText = link.innerText.trim().toUpperCase();
            if (linkText === 'FINAL STANDINGS' || linkText === 'CURRENT STANDINGS') {
                link.style.setProperty('display', 'none', 'important');
            }
        });
    }

    // 3. Hide the number of people who solved the problem
    if (shouldHideContestData) {
        const solvedIconsAndText = document.querySelectorAll('a[title="Participants solved the problem"], td[title="Participants solved the problem"]');
        solvedIconsAndText.forEach(element => {
            element.style.setProperty('display', 'none', 'important');
        });

        const problemTableLinks = document.querySelectorAll('.problems a');
        problemTableLinks.forEach(link => {
            if (/^x\d+$/i.test(link.innerText.trim())) {
                link.style.setProperty('display', 'none', 'important');
            }
        });
    }
});

// --- EVERYTHING BELOW IS GLOBAL AND RUNS IMMEDIATELY ---

// 4. Hide Rating, Contest Rating, and Contribution lines in the sidebar and profile
const profileItems = document.querySelectorAll('.personal-sidebar li, .info ul li');
profileItems.forEach(item => {
    const text = item.innerText.trim();
    if (text.includes('Rating:') || text.includes('Contest rating:') || text.includes('Contribution:')) {
        item.style.setProperty('display', 'none', 'important');
    }
});

// 5. Hide the "Top rated" sidebar widget entirely
const roundboxes = document.querySelectorAll('.roundbox, .sidebox');
roundboxes.forEach(box => {
    if (box.innerText.includes('Top rated')) {
        box.style.setProperty('display', 'none', 'important');
    }
});

// 6. Neutralize any sneaky links to rating pages
const ratingLinks = document.querySelectorAll('a[href*="/rating"]');
ratingLinks.forEach(link => {
    link.removeAttribute('href');
    link.style.color = 'inherit';
    link.style.textDecoration = 'none';
    link.style.cursor = 'default';
});

// 7. Clean up the user's "Contests" history table
const dataTables = document.querySelectorAll('.datatable table, .tablesorter');
dataTables.forEach(table => {
    const headers = Array.from(table.querySelectorAll('th'));
    const colsToHide = [];
    headers.forEach((th, index) => {
        const text = th.innerText.trim().toUpperCase();
        if (['RANK', 'RATING CHANGE', 'NEW RATING'].includes(text) || (index > 4 && text === '')) {
            colsToHide.push(index);
            th.style.setProperty('display', 'none', 'important');
        }
    });
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        cells.forEach((cell, index) => {
            if (colsToHide.includes(index)) {
                cell.style.setProperty('display', 'none', 'important');
            }
        });
    });
});

// 8 & 9. THE ULTIMATE ACTIVE SECURITY GUARD (Runs every 500ms)
setInterval(() => {
    // A. Destroy the Rating Graph
    const graphPlaceholder = document.getElementById('placeholder');
    if (graphPlaceholder) {
        graphPlaceholder.style.setProperty('display', 'none', 'important');
        const parentBox = graphPlaceholder.parentElement;
        if (parentBox) {
            parentBox.style.setProperty('display', 'none', 'important');
        }
    }

    // B. Destroy the "Only rated" dropdown
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        if (select.innerText.includes('Only rated')) {
            const container = select.closest('form') ? select.closest('form').parentElement : select.parentElement;
            if (container) {
                container.style.setProperty('display', 'none', 'important');
            }
        }
    });

    // C. Catch dynamic pop-up toasts and system alerts instantly
    const notifications = document.querySelectorAll('.macMessage-container, .alert, .notice, .info');
    notifications.forEach(notification => {
        if (notification.innerText.toLowerCase().includes('rating')) {
            notification.style.setProperty('display', 'none', 'important');
        }
    });

    // D. Hide system messages in Talks
    if (window.location.href.includes('/messages') || window.location.href.includes('/talks')) {
        const messageRows = document.querySelectorAll('tr');
        messageRows.forEach(row => {
            if (row.innerText.toLowerCase().includes('rating change')) {
                row.style.setProperty('display', 'none', 'important');
            }
        });
    }

    // E. Hide testcase numbers from submission verdicts
    const verdictElements = document.querySelectorAll(
        '.status-cell span, .status-cell a, .verdict-accepted, .verdict-rejected'
    );

    verdictElements.forEach(element => {
        const text = element.innerText.trim().toLowerCase();

        let shortVerdict = null;

        if (text === 'ok' || text === 'accepted') shortVerdict = 'AC';
        else if (text.includes('wrong answer')) shortVerdict = 'WA';
        else if (text.includes('time limit exceeded')) shortVerdict = 'TLE';
        else if (text.includes('memory limit exceeded')) shortVerdict = 'MLE';
        else if (text.includes('runtime error')) shortVerdict = 'RE';
        else if (text.includes('compilation error')) shortVerdict = 'CE';
        else if (text.includes('idleness limit exceeded')) shortVerdict = 'ILE';
        else if (text.includes('presentation error')) shortVerdict = 'PE';
        else if (text.includes('judgement failed')) shortVerdict = 'JF';
        else if (text.includes('security violated')) shortVerdict = 'SV';
        else if (text.includes('hacked')) shortVerdict = 'HACKED';
        else if (text.includes('skipped')) shortVerdict = 'SKIPPED';

        if (shortVerdict) {
            element.innerText = shortVerdict;
            element.removeAttribute('title');
        }
    });
}, 50);
