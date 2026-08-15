// ============================================================
// VERDICT PRIVACY — NO TESTCASE NUMBERS
// ============================================================

// Hide verdict cells immediately, before they can paint.
// The cell becomes visible only after we sanitize its text.
const verdictPrivacyStyle = document.createElement('style');

verdictPrivacyStyle.textContent = `
    table.status-frame-datatable
    tr[data-submission-id] > td:nth-child(6) {
        visibility: hidden !important;
    }

    table.status-frame-datatable
    tr[data-submission-id] > td:nth-child(6).zen-verdict-safe {
        visibility: visible !important;
    }
`;

document.documentElement.appendChild(verdictPrivacyStyle);


// Convert Codeforces verdict text to short form
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
    if (t === 'pe') return 'PE';
    if (t === 'jf') return 'JF';
    if (t === 'sv') return 'SV';

    // Accepted
    if (t === 'ok' || t === 'accepted') {
        return 'AC';
    }

    // Rejected verdicts
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

    if (t.includes('hacked') || t.includes('challenged')) {
        return 'HACKED';
    }

    if (t.includes('skipped')) {
        return 'SKIPPED';
    }

    // Currently judging
    if (
        t.includes('running') ||
        t.includes('testing')
    ) {
        return 'RUNNING';
    }

    if (
        t.includes('in queue') ||
        t.includes('queued')
    ) {
        return 'QUEUED';
    }

    // Scoring problems
    if (t.includes('partial result')) {
        return 'PARTIAL';
    }

    return null;
}


function cleanVerdicts() {
    const rows = document.querySelectorAll(
        'table.status-frame-datatable tr[data-submission-id]'
    );

    rows.forEach(row => {
        const cells = row.querySelectorAll(':scope > td');

        // Current CF table:
        // # | When | Who | Problem | Lang | Verdict | Time | Memory
        if (cells.length < 6) return;

        const cell = cells[5];
        const text = cell.innerText.trim();

        if (!text) return;

        const shortVerdict = getShortVerdict(text);

        if (shortVerdict) {
            // IMPORTANT:
            // Modify the existing verdict element instead of replacing
            // the whole TD. This preserves CF's green/red/blue classes.
            const verdictElement =
                cell.querySelector('[class*="verdict-"]') ||
                cell.querySelector('span');

            if (verdictElement) {
                if (verdictElement.textContent.trim() !== shortVerdict) {
                    verdictElement.textContent = shortVerdict;
                }

                verdictElement.removeAttribute('title');
            } else {
                // Fallback if Codeforces changes its markup
                cell.textContent = shortVerdict;
            }

            // Remove testcase leaks from tooltips
            cell.removeAttribute('title');

            cell.querySelectorAll('[title]').forEach(el => {
                el.removeAttribute('title');
            });

            // Reveal only after sanitized
            cell.classList.add('zen-verdict-safe');
        } else {
            // Unknown verdict.
            //
            // If it contains a testcase number, DON'T reveal it.
            // Otherwise it is safe to show normally.
            const hasTestNumber =
                /\b(?:pre)?test\s*#?\s*\d+/i.test(text);

            if (!hasTestNumber) {
                cell.classList.add('zen-verdict-safe');
            }
        }
    });
}


// ============================================================
// OBSERVE DYNAMIC VERDICT CHANGES
// ============================================================

const verdictObserver = new MutationObserver(() => {
    cleanVerdicts();
});

verdictObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
});

cleanVerdicts();
