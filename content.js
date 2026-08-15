// ============================================================
// CODEFORCES ZEN
// ============================================================

const isGym = window.location.pathname.includes('/gym');
const isStandings = window.location.pathname.includes('/standings');

let zenInGyms = false;
let zenSettingLoaded = false;


// ============================================================
// 0. MARK STANDINGS PAGE AS EARLY AS POSSIBLE
// ============================================================

if (isStandings) {
    // body may not exist yet at document_start, so we'll also
    // apply this again later.
    if (document.body) {
        document.body.classList.add('zen-standings');
    }
}


// ============================================================
// 1. LOAD GYM ZEN SETTING
// ============================================================

chrome.storage.local.get(['zenInGyms'], (result) => {
    zenInGyms = result.zenInGyms || false;
    zenSettingLoaded = true;

    updateGymPrivacyClass();

    setupGymZenButton();
    applyGymZen();
});


// ============================================================
// GYM PRIVACY CLASS
//
// Solve counts are hidden by CSS by default.
//
// Only reveal them if:
//     we are in /gym/
//     AND Gym Zen is OFF.
// ============================================================

function updateGymPrivacyClass() {
    if (!zenSettingLoaded) return;

    if (isGym && !zenInGyms) {
        document.documentElement.classList.add('gym-zen-off');
    } else {
        document.documentElement.classList.remove('gym-zen-off');
    }
}


// ============================================================
// 2. VERDICT SHORTENING
// ============================================================

function getShortVerdict(text) {
    const t = text.trim().toLowerCase();

    // Already sanitized
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


// ============================================================
// CLEAN VERDICTS
// ============================================================

function cleanVerdicts() {
    const rows = document.querySelectorAll(
        'table.status-frame-datatable tr[data-submission-id]'
    );

    rows.forEach(row => {
        const cells = row.querySelectorAll(':scope > td');

        if (cells.length < 6) return;

        const cell = cells[5];

        // textContent works even while CSS has hidden the cell.
        const text = cell.textContent.trim();

        if (!text) return;

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

            cell.removeAttribute('title');

            cell.querySelectorAll('[title]').forEach(el => {
                el.removeAttribute('title');
            });

            // Reveal only after sanitizing.
            cell.classList.add('zen-verdict-safe');

            return;
        }

        // Unknown status containing "test 17" etc:
        // do NOT reveal.
        const containsTestNumber =
            /\b(?:pre)?test\s*#?\s*\d+/i.test(text);

        if (containsTestNumber) {
            cell.classList.remove('zen-verdict-safe');
        } else {
            cell.classList.add('zen-verdict-safe');
        }
    });
}


// ============================================================
// 3. STANDINGS PRIVACY
//
// Keep:
//     #
//     Who
//     Solved
//     Penalty
//
// Hide:
//     A B C D ...
// ============================================================

function cleanStandings() {
    if (!isStandings) return;

    if (document.body) {
        document.body.classList.add('zen-standings');
    }

    const tables = document.querySelectorAll('table');

    tables.forEach(table => {
        const rows = Array.from(
            table.querySelectorAll('tr')
        );

        if (!rows.length) return;

        let penaltyIndex = -1;


        // ----------------------------------------------------
        // Find the real standings table via its header.
        // ----------------------------------------------------

        for (const row of rows) {
            const cells = Array.from(
                row.querySelectorAll(
                    ':scope > th, :scope > td'
                )
            );

            const texts = cells.map(cell =>
                cell.textContent
                    .trim()
                    .toUpperCase()
            );

            const whoIndex =
                texts.indexOf('WHO');

            const currentPenaltyIndex =
                texts.indexOf('PENALTY');

            if (
                whoIndex !== -1 &&
                currentPenaltyIndex !== -1
            ) {
                penaltyIndex =
                    currentPenaltyIndex;

                break;
            }
        }


        // Not a standings table.
        if (penaltyIndex === -1) return;


        // ----------------------------------------------------
        // Mark it for immediate CSS handling on subsequent
        // dynamic updates.
        // ----------------------------------------------------

        table.classList.add('standings');


        // ----------------------------------------------------
        // Hide every problem column.
        // ----------------------------------------------------

        rows.forEach(row => {
            const cells = Array.from(
                row.querySelectorAll(
                    ':scope > th, :scope > td'
                )
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
// 4. GYM ZEN BUTTON
// ============================================================

function setupGymZenButton() {
    if (!zenSettingLoaded) return;

    const topMenu =
        document.querySelector(
            '.menu-list-container ul'
        );

    if (!topMenu) return;


    // Already added.
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


    // --------------------------------------------------------
    // Hover
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Click
    // --------------------------------------------------------

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
    if (!zenSettingLoaded) return;

    updateGymPrivacyClass();


    // Outside gyms:
    // always Zen.
    //
    // Inside gyms:
    // depends on toggle.
    const shouldHideContestData =
        !isGym || zenInGyms;


    // ========================================================
    // MENU ITEMS
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


        // Standings are intentionally NOT hidden anymore.
        const tabsToHide = [
            'RATING',
            'RATING CHANGES',
            'FRIENDS RATING CHANGES',
            'ROOM'
        ];


        if (shouldHideContestData) {
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
    // PROBLEM SOLVE COUNTS
    //
    // CSS already hides these BEFORE rendering.
    //
    // This JS is only a backup for weird Codeforces markup.
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


        // Backup for x123-style links.
        document
            .querySelectorAll('.problems a')
            .forEach(link => {

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

    } else {

        // Gym Zen OFF:
        // undo inline hiding if this script had previously
        // applied it.
        const solvedElements =
            document.querySelectorAll(
                'a[title="Participants solved the problem"], ' +
                'td[title="Participants solved the problem"]'
            );


        solvedElements.forEach(element => {
            element.style.removeProperty(
                'display'
            );
        });


        document
            .querySelectorAll('.problems a')
            .forEach(link => {

                if (
                    /^x\d+$/i.test(
                        link.textContent.trim()
                    )
                ) {
                    link.style.removeProperty(
                        'display'
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
    // RATING / CONTEST RATING / CONTRIBUTION
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
    // TOP RATED WIDGET
    // ========================================================

    document
        .querySelectorAll(
            '.roundbox, .sidebox'
        )
        .forEach(box => {

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
    // RATING LINKS
    // ========================================================

    document
        .querySelectorAll(
            'a[href*="/rating"]'
        )
        .forEach(link => {

            link.removeAttribute('href');

            link.style.color =
                'inherit';

            link.style.textDecoration =
                'none';

            link.style.cursor =
                'default';
        });


    // ========================================================
    // PROFILE CONTEST HISTORY
    // ========================================================

    document
        .querySelectorAll(
            '.datatable table, .tablesorter'
        )
        .forEach(table => {

            // Don't touch submission table.
            if (
                table.classList.contains(
                    'status-frame-datatable'
                )
            ) {
                return;
            }


            // Standings are handled separately.
            if (isStandings) {
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


            table
                .querySelectorAll('tr')
                .forEach(row => {

                    const cells =
                        Array.from(
                            row.querySelectorAll('td')
                        );


                    cells.forEach(
                        (cell, index) => {

                            if (
                                colsToHide.includes(
                                    index
                                )
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
// 7. RATING GRAPH
// ============================================================

function hideRatingGraph() {
    const graphPlaceholder =
        document.getElementById(
            'placeholder'
        );

    if (!graphPlaceholder) return;


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


// ============================================================
// 8. "ONLY RATED" DROPDOWN
// ============================================================

function hideOnlyRated() {
    document
        .querySelectorAll('select')
        .forEach(select => {

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
}


// ============================================================
// 9. RATING NOTIFICATIONS
// ============================================================

function hideRatingNotifications() {
    document
        .querySelectorAll(
            '.macMessage-container, ' +
            '.alert, ' +
            '.notice, ' +
            '.info'
        )
        .forEach(notification => {

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
        });
}


// ============================================================
// 10. TALKS / MESSAGES
// ============================================================

function hideRatingMessages() {
    if (
        !window.location.href.includes('/messages') &&
        !window.location.href.includes('/talks')
    ) {
        return;
    }


    document
        .querySelectorAll('tr')
        .forEach(row => {

            if (
                row.textContent
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


// ============================================================
// INITIALIZE
// ============================================================

function initializeZenMode() {
    if (isStandings && document.body) {
        document.body.classList.add(
            'zen-standings'
        );
    }

    setupGymZenButton();

    applyGymZen();

    applyGlobalZen();

    cleanStandings();

    cleanVerdicts();

    hideRatingGraph();

    hideOnlyRated();

    hideRatingNotifications();

    hideRatingMessages();
}


if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initializeZenMode
    );
} else {
    initializeZenMode();
}


// ============================================================
// MUTATION OBSERVER
//
// React immediately when Codeforces dynamically inserts:
// - verdicts
// - standings
// - menus
// - solve counts
// ============================================================

let observerScheduled = false;

const observer =
    new MutationObserver(() => {

        if (observerScheduled) return;

        observerScheduled = true;


        requestAnimationFrame(() => {
            observerScheduled = false;

            setupGymZenButton();

            applyGymZen();

            cleanStandings();

            cleanVerdicts();

            applyGlobalZen();

            hideRatingGraph();

            hideOnlyRated();

            hideRatingNotifications();

            hideRatingMessages();
        });
    });


observer.observe(
    document.documentElement,
    {
        childList: true,
        subtree: true,
        characterData: true
    }
);


// ============================================================
// BACKUP GUARD
//
// MutationObserver should normally catch everything.
// 35ms remains as a backup.
// ============================================================

setInterval(() => {
    setupGymZenButton();

    applyGymZen();

    cleanStandings();

    cleanVerdicts();

    applyGlobalZen();

    hideRatingGraph();

    hideOnlyRated();

    hideRatingNotifications();

    hideRatingMessages();

}, 35);
