// ============================================================
// INSTANT VERDICT PRIVACY
// Hide verdict cells BEFORE Codeforces renders them.
// Requires "run_at": "document_start" in manifest.json.
// ============================================================

const verdictPrivacyStyle = document.createElement('style');

verdictPrivacyStyle.textContent = `
    .status-cell {
        visibility: hidden !important;
    }

    .status-cell.zen-verdict-safe {
        visibility: visible !important;
    }
`;

(document.head || document.documentElement).appendChild(verdictPrivacyStyle);


// ============================================================
// VERDICT SANITIZER
// ============================================================

function getShortVerdict(text) {
    const t = text.trim().toLowerCase();

    // Accepted
    if (t === 'ok' || t === 'accepted') {
        return 'AC';
    }

    // Failed submissions
    if (t.includes('wrong answer')) {
        return 'WA';
    }

    if (t.includes('time limit exceeded')) {
        return 'TLE';
    }

    if (t.includes('memory limit exceeded')) {
        return 'MLE';
    }

    if (t.includes('runtime error')) {
        return 'RE';
    }

    if (t.includes('compilation error')) {
        return 'CE';
    }

    if (t.includes('idleness limit exceeded')) {
        return 'ILE';
    }

    if (t.includes('presentation error')) {
        return 'PE';
    }

    if (t.includes('judgement failed')) {
        return 'JF';
    }

    if (t.includes('security violated')) {
        return 'SV';
    }

    if (t.includes('hacked')) {
        return 'HACKED';
    }

    if (t.includes('skipped')) {
        return 'SKIPPED';
    }

    // Currently judging.
    // This prevents things like "Running on test 17" from leaking.
    if (t.includes('running')) {
        return 'RUNNING';
    }

    if (t.includes('testing')) {
        return 'TESTING';
    }

    if (t.includes('in queue') || t.includes('queued')) {
        return 'QUEUED';
    }

    return null;
}


function cleanVerdicts() {
    const statusCells = document.querySelectorAll('.status-cell');

    statusCells.forEach(cell => {
        // If we've already cleaned it, no need to touch it again.
        if (cell.classList.contains('zen-verdict-safe')) {
            return;
        }

        const text = cell.innerText.trim();

        if (!text) {
            return;
        }

        const shortVerdict = getShortVerdict(text);

        if (shortVerdict) {
            // Preserve Codeforces coloring when possible.
            const verdictElement =
                cell.querySelector('.verdict-accepted') ||
                cell.querySelector('.verdict-rejected') ||
                cell.querySelector('span') ||
                cell.querySelector('a');

            if (verdictElement) {
                verdictElement.innerText = shortVerdict;
                verdictElement.removeAttribute('title');
            } else {
                cell.innerText = shortVerdict;
            }

            // Remove testcase information from tooltips anywhere in cell.
            cell.removeAttribute('title');

            cell.querySelectorAll('[title]').forEach(element => {
                element.removeAttribute('title');
            });

            // Now that it's sanitized, allow it to become visible.
            cell.classList.add('zen-verdict-safe');
        } else {
            // If Codeforces uses some verdict/state we don't recognize,
            // reveal it only if it doesn't appear to contain a test number.
            const lower = text.toLowerCase();

            const leaksTestNumber =
                /\btest\s*#?\s*\d+/i.test(text) ||
                /\bpretest\s*#?\s*\d+/i.test(text);

            if (!leaksTestNumber) {
                cell.classList.add('zen-verdict-safe');
            }
        }
    });
}


// Watch the page continuously.
// This is better than checking verdicts every 35ms because it reacts
// immediately when Codeforces inserts/changes one.
const verdictObserver = new MutationObserver(() => {
    cleanVerdicts();
});

verdictObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
});


// Run once as soon as DOM parsing begins.
cleanVerdicts();


// ============================================================
// EXISTING ZEN MODE
// ============================================================

const isGym = window.location.href.includes('/gym');

// Fetch your toggle setting from Chrome storage
chrome.storage.local.get(['zenInGyms'], (result) => {
    const zenInGyms = result.zenInGyms || false;

    // Hide standings if we are NOT in a gym,
    // OR if you turned Zen Mode ON for gyms
    const shouldHideContestData = !isGym || zenInGyms;


    // ========================================================
    // BEAUTIFUL NATIVE TOGGLE BUTTON
    // ========================================================

    const topMenu = document.querySelector('.menu-list-container ul');

    if (topMenu) {
        const toggleLi = document.createElement('li');
        const toggleLink = document.createElement('a');

        toggleLink.href = '#';

        toggleLink.innerHTML = zenInGyms
            ? '<span style="font-size: 13px;">🧘</span> Gym Zen: <b>ON</b>'
            : '<span style="font-size: 13px;">⚡</span> Gym Zen: <b>OFF</b>';

        toggleLink.style.display = 'inline-block';
        toggleLink.style.padding = '2px 12px';
        toggleLink.style.marginLeft = '15px';
        toggleLink.style.borderRadius = '20px';
        toggleLink.style.backgroundColor = zenInGyms
            ? '#2c3e50'
            : '#e0e0e0';

        toggleLink.style.color = zenInGyms
            ? '#ffffff'
            : '#666666';

        toggleLink.style.textDecoration = 'none';
        toggleLink.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        toggleLink.style.transition = 'all 0.2s ease-in-out';

        // Smooth hover animations
        toggleLink.addEventListener('mouseenter', () => {
            toggleLink.style.transform = 'translateY(-1px)';
            toggleLink.style.boxShadow =
                '0 4px 8px rgba(0,0,0,0.15)';
        });

        toggleLink.addEventListener('mouseleave', () => {
            toggleLink.style.transform = 'translateY(0)';
            toggleLink.style.boxShadow =
                '0 2px 4px rgba(0,0,0,0.1)';
        });

        // Click action
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();

            chrome.storage.local.set(
                { zenInGyms: !zenInGyms },
                () => {
                    window.location.reload();
                }
            );
        });

        toggleLi.appendChild(toggleLink);
        topMenu.appendChild(toggleLi);
    }


    // ========================================================
    // 1. Hide tabs in main and secondary menus
    // ========================================================

    const menuLinks = document.querySelectorAll(
        '.menu-list-container ul li a, .second-level-menu-list li a'
    );

    menuLinks.forEach(link => {
        const tabText = link.innerText.trim().toUpperCase();

        let tabsToHide = [
            'RATING',
            'RATING CHANGES',
            'FRIENDS RATING CHANGES',
            'ROOM'
        ];

        // Ensure our new button doesn't accidentally get hidden
        if (!tabText.includes('GYM ZEN')) {
            if (shouldHideContestData) {
                tabsToHide.push(
                    'STANDINGS',
                    'COMMON STANDINGS',
                    'FRIENDS STANDINGS',
                    'STATUS'
                );
            }

            if (tabsToHide.includes(tabText)) {
                link.parentElement.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        }
    });


    // ========================================================
    // 2. Hide Final standings / Current standings links
    // ========================================================

    if (shouldHideContestData) {
        const allLinks = document.querySelectorAll('a');

        allLinks.forEach(link => {
            const linkText =
                link.innerText.trim().toUpperCase();

            if (
                linkText === 'FINAL STANDINGS' ||
                linkText === 'CURRENT STANDINGS'
            ) {
                link.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        });
    }


    // ========================================================
    // 3. Hide number of people who solved each problem
    // ========================================================

    if (shouldHideContestData) {
        const solvedIconsAndText = document.querySelectorAll(
            'a[title="Participants solved the problem"], ' +
            'td[title="Participants solved the problem"]'
        );

        solvedIconsAndText.forEach(element => {
            element.style.setProperty(
                'display',
                'none',
                'important'
            );
        });

        const problemTableLinks =
            document.querySelectorAll('.problems a');

        problemTableLinks.forEach(link => {
            if (/^x\d+$/i.test(link.innerText.trim())) {
                link.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        });
    }
});


// ============================================================
// EVERYTHING BELOW IS GLOBAL
// ============================================================


// ============================================================
// 4. Hide Rating / Contest Rating / Contribution
// ============================================================

const profileItems = document.querySelectorAll(
    '.personal-sidebar li, .info ul li'
);

profileItems.forEach(item => {
    const text = item.innerText.trim();

    if (
        text.includes('Rating:') ||
        text.includes('Contest rating:') ||
        text.includes('Contribution:')
    ) {
        item.style.setProperty(
            'display',
            'none',
            'important'
        );
    }
});


// ============================================================
// 5. Hide Top rated sidebar widget
// ============================================================

const roundboxes =
    document.querySelectorAll('.roundbox, .sidebox');

roundboxes.forEach(box => {
    if (box.innerText.includes('Top rated')) {
        box.style.setProperty(
            'display',
            'none',
            'important'
        );
    }
});


// ============================================================
// 6. Neutralize links to rating pages
// ============================================================

const ratingLinks =
    document.querySelectorAll('a[href*="/rating"]');

ratingLinks.forEach(link => {
    link.removeAttribute('href');
    link.style.color = 'inherit';
    link.style.textDecoration = 'none';
    link.style.cursor = 'default';
});


// ============================================================
// 7. Clean up Contests history table
// ============================================================

const dataTables =
    document.querySelectorAll('.datatable table, .tablesorter');

dataTables.forEach(table => {
    const headers =
        Array.from(table.querySelectorAll('th'));

    const colsToHide = [];

    headers.forEach((th, index) => {
        const text =
            th.innerText.trim().toUpperCase();

        if (
            ['RANK', 'RATING CHANGE', 'NEW RATING'].includes(text) ||
            (index > 4 && text === '')
        ) {
            colsToHide.push(index);

            th.style.setProperty(
                'display',
                'none',
                'important'
            );
        }
    });

    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        const cells =
            Array.from(row.querySelectorAll('td'));

        cells.forEach((cell, index) => {
            if (colsToHide.includes(index)) {
                cell.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        });
    });
});


// ============================================================
// ACTIVE SECURITY GUARD
// ============================================================

setInterval(() => {

    // ========================================================
    // A. Destroy Rating Graph
    // ========================================================

    const graphPlaceholder =
        document.getElementById('placeholder');

    if (graphPlaceholder) {
        graphPlaceholder.style.setProperty(
            'display',
            'none',
            'important'
        );

        const parentBox =
            graphPlaceholder.parentElement;

        if (parentBox) {
            parentBox.style.setProperty(
                'display',
                'none',
                'important'
            );
        }
    }


    // ========================================================
    // B. Destroy Only rated dropdown
    // ========================================================

    const selects =
        document.querySelectorAll('select');

    selects.forEach(select => {
        if (select.innerText.includes('Only rated')) {
            const form = select.closest('form');

            const container = form
                ? form.parentElement
                : select.parentElement;

            if (container) {
                container.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        }
    });


    // ========================================================
    // C. Catch dynamic rating notifications
    // ========================================================

    const notifications = document.querySelectorAll(
        '.macMessage-container, .alert, .notice, .info'
    );

    notifications.forEach(notification => {
        if (
            notification.innerText
                .toLowerCase()
                .includes('rating')
        ) {
            notification.style.setProperty(
                'display',
                'none',
                'important'
            );
        }
    });


    // ========================================================
    // D. Hide rating-change messages in Talks
    // ========================================================

    if (
        window.location.href.includes('/messages') ||
        window.location.href.includes('/talks')
    ) {
        const messageRows =
            document.querySelectorAll('tr');

        messageRows.forEach(row => {
            if (
                row.innerText
                    .toLowerCase()
                    .includes('rating change')
            ) {
                row.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        });
    }


    // Backup verdict cleaning.
    // MutationObserver normally catches these immediately.
    cleanVerdicts();

}, 35);
