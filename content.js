// ============================================================
// CODEFORCES ZEN
// ============================================================

const isGym =
    window.location.pathname.includes('/gym');

const isStandings =
    window.location.pathname.includes('/standings');


let zenInGyms = false;
let zenSettingLoaded = false;


// ============================================================
// 0. LOAD GYM ZEN SETTING
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
// ============================================================

function updateGymPrivacyClass() {
    if (!zenSettingLoaded) return;

    if (isGym && !zenInGyms) {
        document.documentElement.classList.add(
            'gym-zen-off'
        );
    } else {
        document.documentElement.classList.remove(
            'gym-zen-off'
        );
    }
}


// ============================================================
// 1. VERDICT CONVERSION
// ============================================================

function getShortVerdict(text) {
    const t =
        text.trim().toLowerCase();


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
        t === 'accepted' ||
        t.includes('accepted')
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
// 2. CLEAN SUBMISSION TABLE VERDICTS
// ============================================================

function cleanVerdicts() {
    const rows =
        document.querySelectorAll(
            'table.status-frame-datatable tr[data-submission-id]'
        );


    rows.forEach(row => {
        const cells =
            row.querySelectorAll(
                ':scope > td'
            );


        if (cells.length < 6) {
            return;
        }


        // #
        // When
        // Who
        // Problem
        // Lang
        // Verdict <-- index 5
        // Time
        // Memory
        const cell =
            cells[5];


        // Works even while hidden
        const text =
            cell.textContent.trim();


        if (!text) {
            return;
        }


        const shortVerdict =
            getShortVerdict(text);


        if (shortVerdict) {
            const verdictElement =
                cell.querySelector('.verdict-accepted') ||
                cell.querySelector('.verdict-rejected') ||
                cell.querySelector('.verdict-waiting') ||
                cell.querySelector('[class*="verdict-"]');


            if (verdictElement) {
                if (
                    verdictElement.textContent.trim()
                    !==
                    shortVerdict
                ) {
                    verdictElement.textContent =
                        shortVerdict;
                }

                verdictElement.removeAttribute(
                    'title'
                );

            } else {

                if (
                    cell.textContent.trim()
                    !==
                    shortVerdict
                ) {
                    cell.textContent =
                        shortVerdict;
                }
            }


            // Remove possible tooltip leak
            cell.removeAttribute(
                'title'
            );


            cell
                .querySelectorAll('[title]')
                .forEach(el => {
                    el.removeAttribute(
                        'title'
                    );
                });


            // Reveal only after sanitizing
            cell.classList.add(
                'zen-verdict-safe'
            );

            return;
        }


        // Unknown verdict with testcase information:
        // keep hidden.
        const containsTestNumber =
            /\b(?:pre)?test\s*#?\s*\d+/i.test(
                text
            );


        if (containsTestNumber) {
            cell.classList.remove(
                'zen-verdict-safe'
            );
        } else {
            cell.classList.add(
                'zen-verdict-safe'
            );
        }
    });
}


// ============================================================
// 3. BOTTOM-RIGHT POPUP VERDICTS
//
// Examples:
//
// Wrong answer on test 2
// -> WA
//
// Time limit exceeded on test 13
// -> TLE
//
// This preserves unrelated notifications such as:
// "Solution to the problem D has been submitted successfully"
// ============================================================

function cleanVerdictPopups() {

    const notifications =
        document.querySelectorAll(
            '.jGrowl-notification, ' +
            '.macMessage-container'
        );


    notifications.forEach(notification => {

        const entireText =
            notification.textContent.trim();


        if (!entireText) {
            notification.classList.add(
                'zen-toast-safe'
            );

            return;
        }


        const shortVerdict =
            getShortVerdict(entireText);


        // ====================================================
        // THIS POPUP CONTAINS A VERDICT
        // ====================================================

        if (shortVerdict) {

            let replaced = false;


            // ------------------------------------------------
            // Walk only TEXT NODES.
            //
            // This is important because we don't want to
            // destroy Codeforces' X close button or popup HTML.
            // ------------------------------------------------

            const walker =
                document.createTreeWalker(
                    notification,
                    NodeFilter.SHOW_TEXT
                );


            const textNodes = [];

            let node;

            while (
                node = walker.nextNode()
            ) {
                textNodes.push(node);
            }


            for (
                const textNode of textNodes
            ) {
                const nodeText =
                    textNode.nodeValue.trim();


                if (!nodeText) {
                    continue;
                }


                const nodeVerdict =
                    getShortVerdict(
                        nodeText
                    );


                if (nodeVerdict) {
                    textNode.nodeValue =
                        nodeVerdict;

                    replaced = true;

                    break;
                }
            }


            // ------------------------------------------------
            // Fallback for Codeforces markup where the whole
            // message is inside a known message element.
            // ------------------------------------------------

            if (!replaced) {

                const messageElement =
                    notification.querySelector(
                        '.jGrowl-message, ' +
                        '.macMessage-content, ' +
                        '.macMessage-text'
                    );


                if (messageElement) {
                    messageElement.textContent =
                        shortVerdict;

                    replaced = true;
                }
            }


            // Remove testcase-related tooltip leaks
            notification.removeAttribute(
                'title'
            );


            notification
                .querySelectorAll('[title]')
                .forEach(el => {
                    el.removeAttribute(
                        'title'
                    );
                });


            // Now safe to show
            notification.classList.add(
                'zen-toast-safe'
            );

            return;
        }


        // ====================================================
        // UNKNOWN TEXT WITH "TEST 123"
        //
        // Fail closed: don't show it.
        // ====================================================

        const containsTestNumber =
            /\b(?:pre)?test\s*#?\s*\d+/i.test(
                entireText
            );


        if (containsTestNumber) {

            notification.classList.remove(
                'zen-toast-safe'
            );

            return;
        }


        // ====================================================
        // NORMAL NON-VERDICT MESSAGE
        //
        // Example:
        // "Solution has been submitted successfully"
        //
        // Show unchanged.
        // ====================================================

        notification.classList.add(
            'zen-toast-safe'
        );
    });
}


// ============================================================
// 4. STANDINGS PRIVACY
//
// KEEP:
//
// #
// Who
// solve count
// Penalty
//
// HIDE:
//
// A B C D ...
// ============================================================

function cleanStandings() {
    if (!isStandings) {
        return;
    }


    if (document.body) {
        document.body.classList.add(
            'zen-standings'
        );
    }


    const tables =
        document.querySelectorAll(
            'table'
        );


    tables.forEach(table => {
        const rows =
            Array.from(
                table.querySelectorAll(
                    'tr'
                )
            );


        if (!rows.length) {
            return;
        }


        let penaltyIndex =
            -1;


        // Find actual standings table
        for (const row of rows) {

            const cells =
                Array.from(
                    row.querySelectorAll(
                        ':scope > th, :scope > td'
                    )
                );


            const texts =
                cells.map(cell =>
                    cell.textContent
                        .trim()
                        .toUpperCase()
                );


            const whoIndex =
                texts.indexOf(
                    'WHO'
                );


            const currentPenaltyIndex =
                texts.indexOf(
                    'PENALTY'
                );


            if (
                whoIndex !== -1 &&
                currentPenaltyIndex !== -1
            ) {
                penaltyIndex =
                    currentPenaltyIndex;

                break;
            }
        }


        // Not standings table
        if (penaltyIndex === -1) {
            return;
        }


        // Mark actual standings table
        table.classList.add(
            'standings'
        );


        // Hide every column after Penalty
        rows.forEach(row => {

            const cells =
                Array.from(
                    row.querySelectorAll(
                        ':scope > th, :scope > td'
                    )
                );


            cells.forEach(
                (cell, index) => {

                    if (
                        index > penaltyIndex
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
// 5. GYM ZEN BUTTON
// ============================================================

function setupGymZenButton() {
    if (!zenSettingLoaded) {
        return;
    }


    const topMenu =
        document.querySelector(
            '.menu-list-container ul'
        );


    if (!topMenu) {
        return;
    }


    // Already added
    if (
        document.getElementById(
            'gym-zen-toggle'
        )
    ) {
        return;
    }


    const toggleLi =
        document.createElement(
            'li'
        );


    const toggleLink =
        document.createElement(
            'a'
        );


    toggleLink.id =
        'gym-zen-toggle';


    toggleLink.href =
        '#';


    toggleLink.innerHTML =
        zenInGyms

            ? '<span style="font-size: 13px;">🧘</span> Gym Zen: <b>ON</b>'

            : '<span style="font-size: 13px;">⚡</span> Gym Zen: <b>OFF</b>';


    // ========================================================
    // STYLE
    // ========================================================

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


    // ========================================================
    // HOVER
    // ========================================================

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


    // ========================================================
    // CLICK
    // ========================================================

    toggleLink.addEventListener(
        'click',
        (e) => {

            e.preventDefault();


            chrome.storage.local.set(
                {
                    zenInGyms:
                        !zenInGyms
                },

                () => {
                    window.location.reload();
                }
            );
        }
    );


    toggleLi.appendChild(
        toggleLink
    );


    topMenu.appendChild(
        toggleLi
    );
}


// ============================================================
// 6. APPLY GYM ZEN
// ============================================================

function applyGymZen() {
    if (!zenSettingLoaded) {
        return;
    }


    updateGymPrivacyClass();


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


        // Standings intentionally allowed.
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
            !tabText.includes(
                'GYM ZEN'
            ) &&
            tabsToHide.includes(
                tabText
            )
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


        document
            .querySelectorAll(
                '.problems a'
            )
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

        // Gym Zen OFF.
        // Restore solve counts inside gyms.

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
            .querySelectorAll(
                '.problems a'
            )
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
// 7. GLOBAL ZEN
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
            text.includes(
                'Rating:'
            ) ||
            text.includes(
                'Contest rating:'
            ) ||
            text.includes(
                'Contribution:'
            )
        ) {
            item.style.setProperty(
                'display',
                'none',
                'important'
            );
        }
    });


    // ========================================================
    // TOP RATED
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

            link.removeAttribute(
                'href'
            );


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

            // Don't modify status table
            if (
                table.classList.contains(
                    'status-frame-datatable'
                )
            ) {
                return;
            }


            // Standings handled separately
            if (isStandings) {
                return;
            }


            const headers =
                Array.from(
                    table.querySelectorAll(
                        'th'
                    )
                );


            const colsToHide =
                [];


            headers.forEach(
                (th, index) => {

                    const text =
                        th.textContent
                            .trim()
                            .toUpperCase();


                    if (
                        [
                            'RANK',
                            'RATING CHANGE',
                            'NEW RATING'
                        ].includes(text)

                        ||

                        (
                            index > 4 &&
                            text === ''
                        )
                    ) {
                        colsToHide.push(
                            index
                        );


                        th.style.setProperty(
                            'display',
                            'none',
                            'important'
                        );
                    }
                }
            );


            table
                .querySelectorAll(
                    'tr'
                )
                .forEach(row => {

                    const cells =
                        Array.from(
                            row.querySelectorAll(
                                'td'
                            )
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
// 8. HIDE RATING GRAPH
// ============================================================

function hideRatingGraph() {

    const graphPlaceholder =
        document.getElementById(
            'placeholder'
        );


    if (!graphPlaceholder) {
        return;
    }


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
// 9. HIDE "ONLY RATED"
// ============================================================

function hideOnlyRated() {

    document
        .querySelectorAll(
            'select'
        )
        .forEach(select => {

            if (
                select.textContent.includes(
                    'Only rated'
                )
            ) {
                const form =
                    select.closest(
                        'form'
                    );


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
// 10. HIDE RATING-RELATED NOTIFICATIONS
//
// IMPORTANT:
//
// Don't hide verdict popups here.
// Those are handled by cleanVerdictPopups().
// ============================================================

function hideRatingNotifications() {

    const notifications =
        document.querySelectorAll(
            '.jGrowl-notification, ' +
            '.macMessage-container, ' +
            '.alert, ' +
            '.notice'
        );


    notifications.forEach(
        notification => {

            const text =
                notification.textContent
                    .toLowerCase();


            if (
                text.includes(
                    'rating'
                )
            ) {
                notification.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        }
    );
}


// ============================================================
// 11. TALKS / MESSAGES
// ============================================================

function hideRatingMessages() {

    if (
        !window.location.href.includes(
            '/messages'
        ) &&
        !window.location.href.includes(
            '/talks'
        )
    ) {
        return;
    }


    document
        .querySelectorAll(
            'tr'
        )
        .forEach(row => {

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


// ============================================================
// 12. RUN ALL CLEANUP
// ============================================================

function runZenCleanup() {

    setupGymZenButton();

    applyGymZen();

    cleanStandings();

    cleanVerdicts();

    cleanVerdictPopups();

    applyGlobalZen();

    hideRatingGraph();

    hideOnlyRated();

    hideRatingNotifications();

    hideRatingMessages();
}


// ============================================================
// 13. INITIALIZE
// ============================================================

function initializeZenMode() {

    if (
        isStandings &&
        document.body
    ) {
        document.body.classList.add(
            'zen-standings'
        );
    }


    runZenCleanup();
}


if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initializeZenMode
    );

} else {

    initializeZenMode();
}


// ============================================================
// 14. MUTATION OBSERVER
//
// This is what reacts essentially immediately to:
//
// - new verdicts
// - bottom-right verdict popups
// - AJAX table updates
// - dynamically loaded menus
// ============================================================

let observerScheduled =
    false;


const observer =
    new MutationObserver(() => {

        if (observerScheduled) {
            return;
        }


        observerScheduled =
            true;


        queueMicrotask(() => {

            observerScheduled =
                false;


            runZenCleanup();
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
// 15. BACKUP SECURITY GUARD
//
// MutationObserver should handle almost everything.
// Keep your 35ms check as backup.
// ============================================================

setInterval(() => {

    runZenCleanup();

}, 35);
