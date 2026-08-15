// ============================================================
// CODEFORCES ZEN MODE
// ============================================================


// ============================================================
// 0. EARLY CSS
// ============================================================

const zenStyle = document.createElement('style');

zenStyle.textContent = `
    /* Hide verdict until sanitized */
    table.status-frame-datatable
    tr[data-submission-id] > td:nth-child(6) {
        visibility: hidden !important;
    }

    table.status-frame-datatable
    tr[data-submission-id] > td:nth-child(6).zen-verdict-safe {
        visibility: visible !important;
    }
`;

document.documentElement.appendChild(zenStyle);


// ============================================================
// 1. VERDICT PRIVACY
//
// "Wrong answer on test 17" -> WA
// "Time limit exceeded on test 9" -> TLE
// etc.
// ============================================================

function getShortVerdict(text) {
    const t = text.trim().toLowerCase();

    // Already converted
    if (t === 'ac') return 'AC';
    if (t === 'wa') return 'WA';
    if (t === 'tle') return 'TLE';
    if (t === 'mle') return 'MLE';
    if (t === 're') return 'RE';
    if (t === 'ce') return 'CE';
    if (t === 'ile') return 'ILE';
    if (t === 'ole') return 'OLE';
    if (t === 'pe') return 'PE';
    if (t === 'jf') return 'JF';
    if (t === 'sv') return 'SV';

    // Accepted
    if (
        t === 'ok' ||
        t === 'accepted'
    ) {
        return 'AC';
    }

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

    if (t.includes('output limit exceeded')) {
        return 'OLE';
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

    if (
        t.includes('hacked') ||
        t.includes('challenged')
    ) {
        return 'HACKED';
    }

    if (t.includes('skipped')) {
        return 'SKIPPED';
    }

    if (
        t.includes('partial result') ||
        t.includes('partially correct')
    ) {
        return 'PARTIAL';
    }

    if (t.includes('running')) {
        return 'RUNNING';
    }

    if (t.includes('testing')) {
        return 'TESTING';
    }

    if (
        t.includes('in queue') ||
        t.includes('queued')
    ) {
        return 'QUEUED';
    }

    return null;
}


function cleanVerdicts() {
    const rows = document.querySelectorAll(
        'table.status-frame-datatable tr[data-submission-id]'
    );

    rows.forEach(row => {
        const cells = row.querySelectorAll(':scope > td');

        if (cells.length < 6) {
            return;
        }

        // #
        // When
        // Who
        // Problem
        // Lang
        // Verdict <-- 5
        // Time
        // Memory
        const cell = cells[5];

        // textContent works even when visibility:hidden
        const text = cell.textContent.trim();

        if (!text) {
            return;
        }

        const shortVerdict = getShortVerdict(text);

        if (shortVerdict) {
            const verdictElement =
                cell.querySelector('.verdict-accepted') ||
                cell.querySelector('.verdict-rejected') ||
                cell.querySelector('.verdict-waiting') ||
                cell.querySelector('[class*="verdict-"]');

            if (verdictElement) {
                if (
                    verdictElement.textContent.trim() !== shortVerdict
                ) {
                    verdictElement.textContent = shortVerdict;
                }

                verdictElement.removeAttribute('title');
            } else {
                if (
                    cell.textContent.trim() !== shortVerdict
                ) {
                    cell.textContent = shortVerdict;
                }
            }

            // Remove tooltip leaks
            cell.removeAttribute('title');

            cell.querySelectorAll('[title]').forEach(el => {
                el.removeAttribute('title');
            });

            // Reveal after sanitizing
            cell.classList.add('zen-verdict-safe');

            return;
        }

        // Unknown verdict containing a test number:
        // keep it hidden.
        const containsTestNumber =
            /\b(?:pre)?test\s*#?\s*\d+/i.test(text);

        if (containsTestNumber) {
            cell.classList.remove('zen-verdict-safe');
        } else {
            cell.classList.add('zen-verdict-safe');
        }
    });
}


// Watch AJAX verdict changes
const verdictObserver = new MutationObserver(() => {
    cleanVerdicts();
});

verdictObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
});

cleanVerdicts();


// ============================================================
// 2. STANDINGS PRIVACY
//
// KEEP:
// #
// Who
// solve count
// Penalty
//
// HIDE:
// A B C D E F ...
// ============================================================

function cleanStandings() {
    // Only relevant on standings pages
    if (!window.location.pathname.includes('/standings')) {
        return;
    }

    const tables = document.querySelectorAll('table');

    tables.forEach(table => {
        const rows = Array.from(table.querySelectorAll('tr'));

        if (rows.length === 0) {
            return;
        }

        let headerRow = null;
        let penaltyIndex = -1;

        // Find actual standings header row
        for (const row of rows) {
            const cells = Array.from(
                row.querySelectorAll(':scope > th, :scope > td')
            );

            const texts = cells.map(cell =>
                cell.textContent.trim().toUpperCase()
            );

            const whoIndex = texts.indexOf('WHO');
            const pIndex = texts.indexOf('PENALTY');

            if (
                whoIndex !== -1 &&
                pIndex !== -1
            ) {
                headerRow = row;
                penaltyIndex = pIndex;
                break;
            }
        }

        // Not a standings table
        if (!headerRow || penaltyIndex === -1) {
            return;
        }

        // Hide EVERYTHING after Penalty.
        //
        // Screenshot layout:
        //
        // 0 = #
        // 1 = Who
        // 2 = =
        // 3 = Penalty
        // 4 = A
        // 5 = B
        // ...
        //
        // Therefore this keeps:
        // # | Who | = | Penalty
        //
        // and hides all individual problems.
        rows.forEach(row => {
            const cells = Array.from(
                row.querySelectorAll(':scope > th, :scope > td')
            );

            cells.forEach((cell, index) => {
                if (index > penaltyIndex) {
                    cell.style.setProperty(
                        'display',
                        'none',
                        'important'
                    );
                }
            });
        });
    });
}


// ============================================================
// 3. GYM ZEN
// ============================================================

const isGym =
    window.location.href.includes('/gym');

let zenInGyms = false;
let zenSettingLoaded = false;


chrome.storage.local.get(
    ['zenInGyms'],
    (result) => {
        zenInGyms =
            result.zenInGyms || false;

        zenSettingLoaded = true;

        setupGymZenButton();
        applyGymZen();
    }
);


// ============================================================
// 4. GYM ZEN BUTTON
// ============================================================

function setupGymZenButton() {
    if (!zenSettingLoaded) {
        return;
    }

    const topMenu =
        document.querySelector(
            '.menu-list-container ul'
        );

    // Codeforces hasn't created menu yet
    if (!topMenu) {
        return;
    }

    // Already exists
    if (
        document.getElementById(
            'gym-zen-toggle'
        )
    ) {
        return;
    }


    const toggleLi =
        document.createElement('li');

    const toggleLink =
        document.createElement('a');


    toggleLink.id =
        'gym-zen-toggle';

    toggleLink.href =
        '#';


    toggleLink.innerHTML =
        zenInGyms

            ? '<span style="font-size: 13px;">🧘</span> Gym Zen: <b>ON</b>'

            : '<span style="font-size: 13px;">⚡</span> Gym Zen: <b>OFF</b>';


    // Button styling
    toggleLink.style.display =
        'inline-block';

    toggleLink.style.padding =
        '2px 12px';

    toggleLink.style.marginLeft =
        '15px';

    toggleLink.style.borderRadius =
        '20px';

    toggleLink.style.backgroundColor =
        zenInGyms
            ? '#2c3e50'
            : '#e0e0e0';

    toggleLink.style.color =
        zenInGyms
            ? '#ffffff'
            : '#666666';

    toggleLink.style.textDecoration =
        'none';

    toggleLink.style.boxShadow =
        '0 2px 4px rgba(0,0,0,0.1)';

    toggleLink.style.transition =
        'all 0.2s ease-in-out';


    // Hover
    toggleLink.addEventListener(
        'mouseenter',
        () => {
            toggleLink.style.transform =
                'translateY(-1px)';

            toggleLink.style.boxShadow =
                '0 4px 8px rgba(0,0,0,0.15)';
        }
    );


    toggleLink.addEventListener(
        'mouseleave',
        () => {
            toggleLink.style.transform =
                'translateY(0)';

            toggleLink.style.boxShadow =
                '0 2px 4px rgba(0,0,0,0.1)';
        }
    );


    // Toggle
    toggleLink.addEventListener(
        'click',
        (e) => {
            e.preventDefault();

            chrome.storage.local.set(
                {
                    zenInGyms: !zenInGyms
                },
                () => {
                    window.location.reload();
                }
            );
        }
    );


    toggleLi.appendChild(toggleLink);
    topMenu.appendChild(toggleLi);
}


// ============================================================
// 5. APPLY GYM ZEN
// ============================================================

function applyGymZen() {
    if (!zenSettingLoaded) {
        return;
    }


    // Outside gyms:
    // Zen protections always enabled.
    //
    // Inside gyms:
    // depends on Gym Zen toggle.
    const shouldHideContestData =
        !isGym || zenInGyms;


    // ========================================================
    // MENU
    // ========================================================

    const menuLinks =
        document.querySelectorAll(
            '.menu-list-container ul li a, ' +
            '.second-level-menu-list li a'
        );


    menuLinks.forEach(link => {
        const tabText =
            link.textContent
                .trim()
                .toUpperCase();


        // IMPORTANT:
        //
        // STANDINGS ARE NO LONGER HIDDEN.
        //
        // COMMON STANDINGS and FRIENDS STANDINGS
        // are also visible.
        const tabsToHide = [
            'RATING',
            'RATING CHANGES',
            'FRIENDS RATING CHANGES',
            'ROOM'
        ];


        if (shouldHideContestData) {
            // Status still exposes submissions,
            // so keep hiding it.
            tabsToHide.push(
                'STATUS'
            );
        }


        if (
            !tabText.includes('GYM ZEN') &&
            tabsToHide.includes(tabText)
        ) {
            link.parentElement.style.setProperty(
                'display',
                'none',
                'important'
            );
        }
    });


    // ========================================================
    // IMPORTANT:
    //
    // We intentionally DO NOT hide:
    //
    // STANDINGS
    // COMMON STANDINGS
    // FRIENDS STANDINGS
    // FINAL STANDINGS
    // CURRENT STANDINGS
    //
    // The standings page itself is sanitized instead.
    // ========================================================


    // ========================================================
    // HIDE NUMBER OF PEOPLE WHO SOLVED EACH PROBLEM
    // ========================================================

    if (shouldHideContestData) {
        const solvedElements =
            document.querySelectorAll(
                'a[title="Participants solved the problem"], ' +
                'td[title="Participants solved the problem"]'
            );


        solvedElements.forEach(element => {
            element.style.setProperty(
                'display',
                'none',
                'important'
            );
        });


        const problemTableLinks =
            document.querySelectorAll(
                '.problems a'
            );


        problemTableLinks.forEach(link => {
            if (
                /^x\d+$/i.test(
                    link.textContent.trim()
                )
            ) {
                link.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        });
    }
}


// ============================================================
// 6. GLOBAL ZEN
// ============================================================

function applyGlobalZen() {

    // ========================================================
    // HIDE RATING / CONTEST RATING / CONTRIBUTION
    // ========================================================

    const profileItems =
        document.querySelectorAll(
            '.personal-sidebar li, ' +
            '.info ul li'
        );


    profileItems.forEach(item => {
        const text =
            item.textContent.trim();


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


    // ========================================================
    // HIDE TOP RATED
    // ========================================================

    const roundboxes =
        document.querySelectorAll(
            '.roundbox, .sidebox'
        );


    roundboxes.forEach(box => {
        if (
            box.textContent.includes(
                'Top rated'
            )
        ) {
            box.style.setProperty(
                'display',
                'none',
                'important'
            );
        }
    });


    // ========================================================
    // DISABLE RATING LINKS
    // ========================================================

    const ratingLinks =
        document.querySelectorAll(
            'a[href*="/rating"]'
        );


    ratingLinks.forEach(link => {
        link.removeAttribute('href');

        link.style.color =
            'inherit';

        link.style.textDecoration =
            'none';

        link.style.cursor =
            'default';
    });


    // ========================================================
    // CLEAN PROFILE CONTEST HISTORY TABLE
    // ========================================================

    const dataTables =
        document.querySelectorAll(
            '.datatable table, .tablesorter'
        );


    dataTables.forEach(table => {

        // Don't touch submission/status table
        if (
            table.classList.contains(
                'status-frame-datatable'
            )
        ) {
            return;
        }


        // Don't run this logic on standings.
        // cleanStandings() handles those.
        if (
            window.location.pathname.includes(
                '/standings'
            )
        ) {
            return;
        }


        const headers =
            Array.from(
                table.querySelectorAll('th')
            );


        const colsToHide = [];


        headers.forEach((th, index) => {
            const text =
                th.textContent
                    .trim()
                    .toUpperCase();


            if (
                [
                    'RANK',
                    'RATING CHANGE',
                    'NEW RATING'
                ].includes(text) ||

                (
                    index > 4 &&
                    text === ''
                )
            ) {
                colsToHide.push(index);

                th.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        });


        const rows =
            table.querySelectorAll('tr');


        rows.forEach(row => {
            const cells =
                Array.from(
                    row.querySelectorAll('td')
                );


            cells.forEach(
                (cell, index) => {
                    if (
                        colsToHide.includes(index)
                    ) {
                        cell.style.setProperty(
                            'display',
                            'none',
                            'important'
                        );
                    }
                }
            );
        });
    });
}


// ============================================================
// 7. INITIALIZE
// ============================================================

function initializeZenMode() {
    setupGymZenButton();

    applyGymZen();

    applyGlobalZen();

    cleanVerdicts();

    cleanStandings();
}


if (
    document.readyState === 'loading'
) {
    document.addEventListener(
        'DOMContentLoaded',
        initializeZenMode
    );
} else {
    initializeZenMode();
}


// ============================================================
// 8. ACTIVE SECURITY GUARD
//
// Runs every 35ms.
// ============================================================

setInterval(() => {

    // ========================================================
    // GYM ZEN
    // ========================================================

    setupGymZenButton();

    applyGymZen();


    // ========================================================
    // GLOBAL
    // ========================================================

    applyGlobalZen();


    // ========================================================
    // STANDINGS
    // ========================================================

    cleanStandings();


    // ========================================================
    // VERDICTS
    // ========================================================

    cleanVerdicts();


    // ========================================================
    // A. RATING GRAPH
    // ========================================================

    const graphPlaceholder =
        document.getElementById(
            'placeholder'
        );


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
    // B. "ONLY RATED" DROPDOWN
    // ========================================================

    const selects =
        document.querySelectorAll(
            'select'
        );


    selects.forEach(select => {
        if (
            select.textContent.includes(
                'Only rated'
            )
        ) {
            const form =
                select.closest('form');


            const container =
                form
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
    // C. RATING NOTIFICATIONS
    // ========================================================

    const notifications =
        document.querySelectorAll(
            '.macMessage-container, ' +
            '.alert, ' +
            '.notice, ' +
            '.info'
        );


    notifications.forEach(
        notification => {
            if (
                notification.textContent
                    .toLowerCase()
                    .includes('rating')
            ) {
                notification.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        }
    );


    // ========================================================
    // D. RATING CHANGE MESSAGES
    // ========================================================

    if (
        window.location.href.includes(
            '/messages'
        ) ||
        window.location.href.includes(
            '/talks'
        )
    ) {
        const messageRows =
            document.querySelectorAll(
                'tr'
            );


        messageRows.forEach(row => {
            if (
                row.textContent
                    .toLowerCase()
                    .includes(
                        'rating change'
                    )
            ) {
                row.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        });
    }

}, 35);
