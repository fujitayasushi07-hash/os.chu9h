(() => {
    "use strict";

    const TITLE = "DR. WATSON — 614_LOST.exe";
    const WINDOW_ICON = "assets/images/doctor_watson.ico";
    const TRANSACTION_URL = "https://relay.link/transaction/0x668ee5d00f7734f25ac018eb3aa766667fb5d7ddabf9e25d8944e3f3342cea5d";
    const SECTIONS = [
        { id: "summary", label: "CASE SUMMARY", status: "CASE FILE OPEN" },
        { id: "evidence", label: "ON-CHAIN EVIDENCE", status: "CHAIN DATA NOT VERIFIED HERE" },
        { id: "scene", label: "THE CRIME SCENE", status: "CLIPBOARD SUSPECT IDENTIFIED" },
        { id: "archive", label: "SUPPORT TICKET ARCHIVE", status: "ARCHIVE MOUNTED READ-ONLY" },
        { id: "recovery", label: "RECOVERY ATTEMPT", status: "RECOVERY STATUS UNRESOLVED" }
    ];

    const CHOG_ADDRESS = "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777";
    const RECOVERY_FUND_ADDRESS = "0x48a22f7683a8541292e1eED3c68110CD7e4B39Be";
    const RECOVERY_FUND_API = "/api/verify/recovery-fund";
    const RECOVERY_USD_GOAL_CENTS = 61400n;
    const RECOVERY_TOKEN_DECIMALS = 18n;
    const RELAY_IMAGE = "assets/images/incident-614-relay.png";
    const MONAD_IMAGE = "assets/images/incident-614-monadvision.png";
    const SCENE_STEPS = [
        { title: "THE MISSION" },
        { title: "THE CLIPBOARD" },
        { title: "THE REVEAL" },
        { title: "THE RECEIPT" },
        { title: "THE CONTRACT PAGE" },
        { title: "THE VERDICT" }
    ];
    const RECOVERY_FUND = {
        goalUsd: 614,
        contributedUsd: 0,
        contributedChog: 0,
        contributions: []
    };
    const RECOVERY_MILESTONES = [10, 25, 50, 75, 100];
    const RECOVERY_MILESTONE_IMAGES = [
        "assets/images/milestone1.png",
        "assets/images/milestone2.png",
        "assets/images/milestone3.png",
        "assets/images/milestone4png.png",
        "assets/images/milestonn5.png"
    ];

    function recoveryDashboardMarkup() {
        const { goalUsd, contributedUsd, contributedChog, contributions } = RECOVERY_FUND;
        const progress = Math.min(100, Math.max(0, contributedUsd / goalUsd * 100));
        const nextMilestone = RECOVERY_MILESTONES.find(milestone => milestone > progress);
        const nextMilestoneIndex = RECOVERY_MILESTONES.indexOf(nextMilestone);
        const nextMilestoneImage = RECOVERY_MILESTONE_IMAGES[
            nextMilestoneIndex < 0 ? RECOVERY_MILESTONE_IMAGES.length - 1 : nextMilestoneIndex
        ];
        const formatUsd = value => `$${value.toFixed(2)}`;
        const milestoneMarkup = RECOVERY_MILESTONES.map((milestone, index) => `
            <div class="chog-incident-milestone" data-recovery-milestone="${milestone}">
                <strong>${milestone}%</strong>
                <img class="chog-incident-milestone-art" src="${RECOVERY_MILESTONE_IMAGES[index]}" alt="" aria-hidden="true">
            </div>
        `).join("");
        const contributionRows = contributions.length
            ? contributions.map((contribution, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${contribution.wallet}</td>
                    <td>${contribution.amountChog.toLocaleString()} $CHOG</td>
                    <td>${formatUsd(contribution.usd)}</td>
                    <td>${contribution.time}</td>
                </tr>
            `).join("")
            : '<tr><td class="chog-incident-contribution-empty" colspan="5">No contributions recorded yet</td></tr>';

        return `
            <div class="chog-incident-recovery-intro">
                <h2>RECOVERY ATTEMPT</h2>
                <p>The original clipboard incident remains unresolved. Community assistance protocol initiated.</p>
                <p>This donation fund is part of the recovery attempt, supporting the CHOGWARE project and community.</p>
            </div>
            <div class="chog-incident-recovery-grid">
                <div class="chog-incident-recovery-main">
                    <section class="chog-incident-recovery-card chog-incident-recovery-fund" aria-labelledby="recovery-fund-title">
                        <h3 id="recovery-fund-title">$614 RECOVERY FUND</h3>
                        <div class="chog-incident-fund-totals">
                            <div><span>USD-EQUIVALENT GOAL</span><strong data-recovery-usd-total>${formatUsd(contributedUsd)} / ${formatUsd(goalUsd)}</strong></div>
                            <div><span>TOTAL $CHOG CONTRIBUTED</span><strong data-recovery-token-total>${contributedChog.toLocaleString()} $CHOG</strong><small data-recovery-usd-estimate>≈ ${formatUsd(contributedUsd)} USD (est.)</small></div>
                        </div>
                        <div class="chog-incident-recovery-progress">
                            <div><strong>RECOVERY PROGRESS</strong><strong data-recovery-progress-label>${progress.toFixed(0)}%</strong></div>
                            <div class="chog-incident-recovery-track" role="progressbar" aria-label="Recovery fund progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" data-recovery-progress>
                                <span style="width: ${progress}%"></span>
                            </div>
                            <p>Every contribution brings us closer to recovering from this emotional damage.</p>
                        </div>
                    </section>
                    <section class="chog-incident-recovery-card chog-incident-milestones" aria-labelledby="recovery-milestones-title">
                        <h3 id="recovery-milestones-title">MILESTONES</h3>
                        <div class="chog-incident-milestone-list">${milestoneMarkup}</div>
                    </section>
                    <section class="chog-incident-recovery-card chog-incident-contributions" aria-labelledby="recovery-contributions-title">
                        <h3 id="recovery-contributions-title">RECENT CONTRIBUTIONS</h3>
                        <div class="chog-incident-contributions-table-wrap">
                            <table>
                                <thead><tr><th>#</th><th>WALLET</th><th>AMOUNT</th><th>USD (est.)</th><th>TIME</th></tr></thead>
                                <tbody data-recovery-contributions>${contributionRows}</tbody>
                            </table>
                        </div>
                    </section>
                </div>
                <aside class="chog-incident-recovery-side">
                    <section class="chog-incident-recovery-card chog-incident-status-report" aria-labelledby="recovery-status-title">
                        <h3 id="recovery-status-title">DR. WATSON'S STATUS REPORT</h3>
                        <div class="chog-incident-status-report-body">
                            <img class="chog-incident-watson-image" src="assets/images/chog-dono.png" alt="CHOG donation artwork">
                        </div>
                    </section>
                    <div class="chog-incident-contribute-area">
                        <button type="button" class="chog-incident-contribute" data-recovery-contribute aria-expanded="false">DONATE</button>
                        <p class="chog-incident-donation-data-status" data-recovery-data-status role="status" aria-live="polite">Loading verified contributions…</p>
                    </div>
                    <p class="chog-incident-recovery-disclaimer">You're contributing to the CHOGWARE community Recovery Fund. This does not guarantee recovery of the original funds.</p>
                    <section class="chog-incident-recovery-card chog-incident-next-milestone" aria-labelledby="recovery-next-title">
                        <h3 id="recovery-next-title">NEXT MILESTONE</h3>
                        <div class="chog-incident-next-milestone-body">
                            <img class="chog-incident-next-art" src="${nextMilestoneImage}" alt="" aria-hidden="true" data-recovery-next-art>
                            ${nextMilestone
                                ? `<p data-recovery-next><strong>${nextMilestone}%</strong><span>${formatUsd(Math.max(0, goalUsd * nextMilestone / 100 - contributedUsd))} USD (est.) to reach</span></p>`
                                : '<p data-recovery-next>All recovery milestones reached.</p>'}
                        </div>
                    </section>
                </aside>
            </div>
        `;
    }

    // Only screenshots that exist in the project are listed. To archive more, save the file under assets/images/ and add it to `images`.
    const ARCHIVE = [
        {
            id: "team",
            name: "CHOG_TEAM.log",
            note: "CHOG team Discord screenshots",
            images: [1, 2, 3, 4, 5, 6, 7, 8, 16, 9, 10, 11, 12, 13, 14, 15].map((number, index) => ({
                src: `assets/images/chogteamchat/CHOGCHAT${number}.png`,
                label: `CHOG TEAM · CONVERSATION ${index + 1} OF 16`,
                alt: `CHOG team conversation screenshot ${index + 1} of 16`
            })).concat({
                videoSrc: "assets/videos/chogsion%20failed!.mp4",
                label: "CHOGSION FAILED",
                alt: "CHOGSION FAILED animation"
            })
        },
        {
            id: "nadfun",
            name: "NADFUN_SUPPORT.log",
            note: "Nad.fun support screenshots",
            images: [1, 2, 3, 4, 5, 6, 7].map((number, index) => ({
                src: `assets/images/chogteamchat/NADCHAT/NADCHAT${number}.png`,
                label: `NAD.FUN SUPPORT · SCREENSHOT ${index + 1} OF 7`,
                alt: `Nad.fun support screenshot ${index + 1} of 7`
            })).concat({
                videoSrc: "assets/videos/chogsion%20failed!.mp4",
                label: "CHOGSION FAILED",
                alt: "CHOGSION FAILED animation"
            })
        },
        {
            id: "relay",
            name: "RELAY_SUPPORT.log",
            note: "Relay support screenshots",
            images: [{
                src: "assets/images/chogteamchat/NADCHAT/Relay.png",
                label: "RELAY SUPPORT · SCREENSHOT 1 OF 1",
                alt: "Relay support screenshot"
            }].concat({
                videoSrc: "assets/videos/chogsion%20failed!.mp4",
                label: "CHOGSION FAILED",
                alt: "CHOGSION FAILED animation"
            })
        },
        {
            id: "original",
            name: "ORIGINAL_EVIDENCE",
            note: "Original transaction and token screenshots",
            images: [
                { src: "assets/images/chogteamchat/ORIGINAL_EVIDENCE1.png", label: "ORIGINAL EVIDENCE · SCREENSHOT 1 OF 2", alt: "Original evidence screenshot 1" },
                { src: "assets/images/chogteamchat/ORIGINAL_EVIDENCE2.png", label: "ORIGINAL EVIDENCE · SCREENSHOT 2 OF 2", alt: "Original evidence screenshot 2" }
            ].concat({
                videoSrc: "assets/videos/chogsion%20failed!.mp4",
                label: "CHOGSION FAILED",
                alt: "CHOGSION FAILED animation"
            })
        }
    ];

    function archiveListMarkup() {
        const rows = ARCHIVE.map(entry => `
            <button type="button" class="chog-incident-archive-entry" data-archive-open="${entry.id}">
                <span class="chog-incident-archive-icon" aria-hidden="true"></span>
                <span class="chog-incident-archive-name">${entry.name}</span>
                <span class="chog-incident-archive-note">${entry.note}</span>
                <span class="chog-incident-archive-count">${entry.images.length ? `${entry.images.length} file${entry.images.length === 1 ? "" : "s"}` : "empty"}</span>
            </button>
        `).join("");
        return `
            <h2>SUPPORT TICKET ARCHIVE</h2>
            <p class="chog-incident-muted">Select an entry to open it. Entries only contain screenshots that have actually been saved to this archive.</p>
            <div class="chog-incident-archive-list" role="list">${rows}</div>
        `;
    }

    function evidenceFrame(key, src, alt, caption) {
        return `
            <figure class="chog-incident-evidence">
                <div class="chog-incident-evidence-title"><span>${caption.title}</span></div>
                <button type="button" class="chog-incident-evidence-image" data-incident-zoom="${key}" aria-label="View ${caption.title} larger">
                    <img src="${src}" alt="${alt}" loading="lazy">
                </button>
                <figcaption>${caption.text}</figcaption>
            </figure>
        `;
    }

    function sceneStepMarkup(index, state) {
        switch (index) {
            case 0:
                return `
                    <p>Approximately <strong>614 USDC</strong> sits on Solana. The plan: bridge it to Monad and buy <strong>$CHOG on launch day</strong>.</p>
                    <p class="chog-incident-muted">Simple plan. What could possibly go wrong?</p>
                    <button type="button" class="chog-incident-action" data-scene-action="next">BEGIN INVESTIGATION</button>
                `;
            case 1:
                return `
                    <p>The CHOG contract address was sitting on the clipboard, waiting patiently to ruin someone's day.</p>
                    <div class="chog-incident-clipboard" aria-label="Clipboard contents">
                        <span>CLIPBOARD</span>
                        <code>${state.pasted ? CHOG_ADDRESS : "[ contents hidden ]"}</code>
                    </div>
                    <button type="button" class="chog-incident-action" data-scene-action="paste" ${state.pasted ? "disabled" : ""}>PASTE ADDRESS</button>
                    ${state.pasted ? '<p class="chog-incident-muted">Paste successful. Judgement not included.</p>' : ""}
                `;
            case 2:
                return `
                    <div class="chog-incident-callout chog-incident-callout-alert">
                        <code>${CHOG_ADDRESS}</code>
                        <p>That is the <strong>CHOG contract address</strong>.</p>
                    </div>
                    <p>It was accidentally pasted into Relay's <strong>recipient</strong> field instead of the intended destination. The bridge did not argue.</p>
                    <button type="button" class="chog-incident-action" data-scene-action="next">INSPECT THE DAMAGE</button>
                `;
            case 3:
                return `
                    <p>Exhibit A: the Relay transaction details, shown as saved in the screenshot below.</p>
                    ${evidenceFrame("relay", RELAY_IMAGE, "Screenshot of the Relay transaction details page showing a successful Solana to Monad USDC bridge", {
                        title: "EXHIBIT A — relay-receipt.png",
                        text: "Relay screenshot. Click to enlarge."
                    })}
                    <ul class="chog-incident-facts">
                        <li><b>Deposit (Solana)</b> 614.992161 USDC</li>
                        <li><b>Fill (Monad)</b> 614.581617 USDC</li>
                        <li><b>Deposit timestamp</b> 26 November 2025, 6:32 PM GMT+2</li>
                        <li><b>Displayed result</b> Success, completed in 2s</li>
                    </ul>
                    <p class="chog-incident-muted">Fast, efficient, and entirely pointed at the wrong place.</p>
                    <a class="chog-incident-link-button" href="${TRANSACTION_URL}" target="_blank" rel="noopener noreferrer">OPEN RELAY TRANSACTION</a>
                `;
            case 4:
                return `
                    <p>Exhibit B: a block explorer page for the destination address.</p>
                    ${evidenceFrame("monad", MONAD_IMAGE, "Screenshot of a MonadVision page titled Contract (Chog) showing a token portfolio", {
                        title: "EXHIBIT B — monadvision.png",
                        text: "The page identifies the address as the CHOG contract and shows its portfolio. Click to enlarge."
                    })}
                    <p class="chog-incident-muted">The portfolio shown is page context only. It is not proof that any displayed balance belongs to this incident, and it does not imply anything is recoverable.</p>
                `;
            default:
                return `
                    <div class="chog-incident-verdict" role="status">BRIDGE SUCCESSFUL.<br>MISSION FAILED.</div>
                    <p class="chog-incident-muted">Technically flawless. Spiritually a disaster.</p>
                    <button type="button" class="chog-incident-action" data-scene-action="undo">ATTEMPT UNDO</button>
                `;
        }
    }

    function createMarkup() {
        const tabs = SECTIONS.map((section, index) => `
            <button
                type="button"
                class="chog-incident-tab"
                id="incident-tab-${section.id}"
                role="tab"
                aria-controls="incident-panel-${section.id}"
                aria-selected="${index === 0}"
                tabindex="${index === 0 ? "0" : "-1"}"
                data-incident-tab="${section.id}"
            >${section.label}</button>
        `).join("");

        return `
            <main class="chog-incident">
                <header class="chog-incident-heading">
                    <div class="chog-incident-brand">
                        <img src="${WINDOW_ICON}" alt="">
                        <span>DR. WATSON / CHOGWARE DIAGNOSTICS</span>
                    </div>
                    <h1>CASE #0614 — The $614 Clipboard Incident</h1>
                    <div class="chog-incident-summary">
                        <span><b>AMOUNT</b> ≈ $614 USDC</span>
                        <span><b>MISSION</b> Solana → Monad → buy $CHOG on launch day</span>
                        <span><b>STATUS</b> Unresolved</span>
                    </div>
                </header>

                <div class="chog-incident-status" role="status" aria-live="polite">
                    <span class="chog-incident-status-light" aria-hidden="true"></span>
                    <span data-incident-status>DIAGNOSTIC STATUS: CASE FILE OPEN</span>
                    <span class="chog-incident-status-version">DRWATSON.EXE</span>
                </div>

                <div class="chog-incident-workspace">
                    <nav class="chog-incident-tabs" role="tablist" aria-label="Investigation sections" aria-orientation="horizontal">
                        ${tabs}
                    </nav>

                    <section class="chog-incident-panel" id="incident-panel-summary" role="tabpanel" aria-labelledby="incident-tab-summary" data-incident-panel="summary">
                        <h2>CASE SUMMARY</h2>
                        <p>Approximately <strong>$614 USDC</strong> was intended to be bridged from Solana to Monad so it could be used to buy <strong>$CHOG on launch day</strong>.</p>
                        <p>The case remains <strong>unresolved</strong>. This diagnostic display is a story-only report: it does not connect to a wallet or verify transaction state.</p>
                        <div class="chog-incident-callout">Working theory: the clipboard completed its task perfectly. The paste target was the problem.</div>
                    </section>

                    <section class="chog-incident-panel" id="incident-panel-evidence" role="tabpanel" aria-labelledby="incident-tab-evidence" data-incident-panel="evidence" hidden>
                        <h2>ON-CHAIN EVIDENCE</h2>
                        <p>A Relay transaction page was provided for this case. Dr. Watson has not independently inspected or verified its contents; the linked page is the <strong>source of truth</strong> for transaction details.</p>
                        <a class="chog-incident-link-button" href="${TRANSACTION_URL}" target="_blank" rel="noopener noreferrer">OPEN RELAY TRANSACTION</a>
                        <p class="chog-incident-footnote">Opens Relay in a new tab. This report does not initiate a transaction.</p>
                    </section>

                    <section class="chog-incident-panel" id="incident-panel-scene" role="tabpanel" aria-labelledby="incident-tab-scene" data-incident-panel="scene" hidden>
                        <h2>THE CRIME SCENE</h2>
                        <div class="chog-incident-progress">
                            <span data-scene-progress-label></span>
                            <div class="chog-incident-progress-track" role="progressbar" aria-label="Reconstruction progress" aria-valuemin="1" aria-valuemax="${SCENE_STEPS.length}" data-scene-progress>
                                <div class="chog-incident-progress-fill" data-scene-progress-fill></div>
                            </div>
                        </div>
                        <div class="chog-incident-scene" data-scene-content aria-live="polite"></div>
                        <div class="chog-incident-scene-nav">
                            <button type="button" data-scene-back>&lt; BACK</button>
                            <button type="button" data-scene-next>NEXT &gt;</button>
                        </div>
                    </section>

                    <section class="chog-incident-panel" id="incident-panel-archive" role="tabpanel" aria-labelledby="incident-tab-archive" data-incident-panel="archive" hidden>
                        <div class="chog-incident-archive-toolbar">
                            <span class="chog-incident-archive-path" data-archive-path>A:\\ARCHIVE</span>
                        </div>
                        <div class="chog-incident-archive-list-view" data-archive-list>${archiveListMarkup()}</div>
                        <div class="chog-incident-archive-viewer" data-archive-viewer hidden>
                            <div class="chog-incident-archive-stage">
                                <img alt="" data-archive-image>
                                <video class="chog-incident-archive-video" data-archive-video autoplay playsinline muted preload="metadata" hidden aria-label="CHOGSION FAILED animation"></video>
                                <p class="chog-incident-archive-empty" data-archive-empty hidden></p>
                            </div>
                            <div class="chog-incident-archive-caption" data-archive-caption aria-live="polite"></div>
                            <div class="chog-incident-scene-nav">
                                <button type="button" data-archive-back>&lt; BACK</button>
                                <button type="button" data-archive-prev>&lt; PREVIOUS</button>
                                <button type="button" data-archive-next>NEXT &gt;</button>
                            </div>
                        </div>
                    </section>

                    <section class="chog-incident-panel chog-incident-recovery-panel" id="incident-panel-recovery" role="tabpanel" aria-labelledby="incident-tab-recovery" data-incident-panel="recovery" hidden>
                        ${recoveryDashboardMarkup()}
                    </section>
                </div>

                <footer class="chog-incident-footer">
                    <span>DR. WATSON: WALLET ACTIONS REQUIRE YOUR CONFIRMATION</span>
                </footer>

                <div class="chog-incident-dialog-layer chog-incident-donation-layer" data-recovery-modal hidden>
                    <section class="chog-incident-dialog chog-incident-donation-dialog" role="dialog" aria-modal="true" aria-labelledby="recovery-donation-title">
                        <header class="chog-incident-dialog-titlebar">
                            <span id="recovery-donation-title">DR. WATSON — SUPPORT THE RECOVERY</span>
                            <button type="button" aria-label="Close donation dialog" data-recovery-close>×</button>
                        </header>
                        <div class="chog-incident-donation-dialog-body">
                            <section class="chog-incident-panel chog-incident-donation-panel" data-recovery-view hidden>
                                <div class="chog-incident-donation-form" data-recovery-form>
                                    <div class="chog-incident-donation-intro">
                                        <h2>EVERY CHOG COUNTS</h2>
                                        <p>Help a fellow CHOG bounce back from the 614 financial fumble.</p>
                                    </div>
                                    <section class="chog-incident-donation-total" aria-label="Donation amount">
                                        <span>YOUR DONATION</span>
                                        <strong data-recovery-display-amount>$0.50</strong>
                                        <p data-recovery-estimate>Estimated CHOG amount appears after your quote is refreshed.</p>
                                        <input type="number" min="0.50" max="614.00" step="0.01" value="0.50" inputmode="decimal" aria-label="Custom USD donation amount" data-recovery-custom hidden>
                                        <p class="chog-incident-donation-quote" data-recovery-quote role="status" hidden></p>
                                    </section>
                                    <label class="chog-incident-donation-amount-label">SELECT CONTRIBUTION</label>
                                    <div class="chog-incident-donation-amounts" role="group" aria-label="Select contribution amount">
                                        <button type="button" data-recovery-amount-option="50" aria-pressed="true">$0.50</button>
                                        <button type="button" data-recovery-amount-option="100" aria-pressed="false">$1</button>
                                        <button type="button" data-recovery-amount-option="500" aria-pressed="false">$5</button>
                                        <button type="button" data-recovery-amount-option="custom" aria-pressed="false">Custom</button>
                                    </div>
                                    <select id="recovery-usd-amount" data-recovery-amount hidden aria-hidden="true" tabindex="-1">
                                        <option value="50">$0.50</option>
                                        <option value="100">$1.00</option>
                                        <option value="500">$5.00</option>
                                        <option value="custom">Custom amount</option>
                                    </select>
                                    <div class="chog-incident-donation-disclaimer">
                                        <strong>BEFORE YOU PROCEED</strong>
                                        <p>Sure you want to donate? You're about to give some of your hard-earned CHOG away out of your own free will! Every contribution is voluntary and greatly appreciated.</p>
                                    </div>
                                    <button type="button" class="chog-incident-donation-prepare" data-recovery-prepare>CONNECT WALLET &amp; GET QUOTE</button>
                                    <button type="button" data-recovery-send hidden disabled>CONFIRM IN WALLET</button>
                                    <p class="chog-incident-donation-message" data-recovery-message role="status" aria-live="polite" hidden></p>
                                    <button type="button" class="chog-incident-donation-back" data-recovery-cancel>← BACK TO RECOVERY ATTEMPT</button>
                                    <p class="chog-incident-donation-network">Monad network · Transaction gas requires MON</p>
                                </div>
                            </section>
                        </div>
                    </section>
                </div>

                <div class="chog-incident-dialog-layer" data-incident-viewer hidden>
                    <section class="chog-incident-viewer" role="dialog" aria-modal="true" aria-labelledby="chog-incident-viewer-title">
                        <header class="chog-incident-dialog-titlebar">
                            <span id="chog-incident-viewer-title" data-viewer-title>Evidence Viewer</span>
                            <button type="button" aria-label="Close evidence viewer" data-viewer-close>×</button>
                        </header>
                        <div class="chog-incident-viewer-body"><img alt="" data-viewer-image></div>
                    </section>
                </div>

                <div class="chog-incident-dialog-layer" data-incident-dialog hidden>
                    <section class="chog-incident-dialog" role="alertdialog" aria-modal="true" aria-labelledby="chog-incident-dialog-title" aria-describedby="chog-incident-dialog-message">
                        <header class="chog-incident-dialog-titlebar">
                            <span id="chog-incident-dialog-title">Dr. Watson — System Error</span>
                            <button type="button" aria-label="Close error dialog" data-incident-dismiss>×</button>
                        </header>
                        <div class="chog-incident-dialog-body">
                            <div class="chog-incident-error-icon" aria-hidden="true">!</div>
                            <p id="chog-incident-dialog-message">
                                <strong>Undo unavailable.</strong> A blockchain transaction cannot be
                                undone with this button (or Ctrl+Z). Dr. Watson cannot reverse time;
                                he can barely find the Start menu.
                            </p>
                        </div>
                        <div class="chog-incident-dialog-actions">
                            <button type="button" data-incident-dismiss>OK</button>
                        </div>
                    </section>
                </div>
            </main>
        `;
    }

    function openIncidentReport() {
        const alreadyOpen = !!openWindows[TITLE];
        const win = window.openWindow(TITLE, createMarkup(), WINDOW_ICON);
        if (alreadyOpen || !win) return;

        win.classList.add("chog-incident-window");
        win.style.resize = "none";
        if (window.innerWidth > 768) {
            const width = Math.min(720, Math.max(320, window.innerWidth - 24));
            const height = Math.min(600, Math.max(340, window.innerHeight - 64));
            win.style.width = `${width}px`;
            win.style.height = `${height}px`;
            win.style.left = `${Math.max(8, Math.round((window.innerWidth - width) / 2))}px`;
            const taskbarHeight = document.getElementById("taskbar")?.offsetHeight || 40;
            win.style.top = `${Math.max(8, Math.round((window.innerHeight - taskbarHeight - height) / 2))}px`;
        } else {
            // openWindow() leaves mobile height as auto; a definite height lets the content regions scroll instead of overflowing.
            win.style.height = "min(640px, calc(100vh - 70px))";
        }
        const root = win.querySelector(".chog-incident");
        const status = root.querySelector("[data-incident-status]");
        const recoveryContributeButton = root.querySelector("[data-recovery-contribute]");
        const recoveryModal = root.querySelector("[data-recovery-modal]");
        const recoveryView = root.querySelector("[data-recovery-view]");
        const recoveryMessage = root.querySelector("[data-recovery-message]");
        const recoveryDataStatus = root.querySelector("[data-recovery-data-status]");
        const recoveryAmount = root.querySelector("[data-recovery-amount]");
        const recoveryAmountOptions = Array.from(root.querySelectorAll("[data-recovery-amount-option]"));
        const recoveryCustomAmount = root.querySelector("[data-recovery-custom]");
        const recoveryDisplayAmount = root.querySelector("[data-recovery-display-amount]");
        const recoveryEstimate = root.querySelector("[data-recovery-estimate]");
        const recoveryPrepareButton = root.querySelector("[data-recovery-prepare]");
        const recoverySendButton = root.querySelector("[data-recovery-send]");
        const recoveryQuote = root.querySelector("[data-recovery-quote]");
        let recoveryIntent = null;
        let pendingConfirmation = null;

        const setRecoveryMessage = (text, isError = false) => {
            recoveryMessage.textContent = text;
            recoveryMessage.hidden = !text;
            recoveryMessage.classList.toggle("is-error", isError);
        };

        const formatUsdCents = cents => {
            const value = BigInt(cents);
            return `$${value / 100n}.${(value % 100n).toString().padStart(2, "0")}`;
        };

        const formatTokenDisplay = amountRaw => {
            const raw = BigInt(amountRaw);
            const whole = raw / (10n ** RECOVERY_TOKEN_DECIMALS);
            const fraction = (raw % (10n ** RECOVERY_TOKEN_DECIMALS))
                .toString()
                .padStart(Number(RECOVERY_TOKEN_DECIMALS), "0")
                .slice(0, 6)
                .replace(/0+$/, "");
            return `${whole.toLocaleString()}${fraction ? `.${fraction}` : ""}`;
        };

        const requestRecoveryApi = async (method, body) => {
            let response;
            try {
                response = await fetch(RECOVERY_FUND_API, {
                    method,
                    headers: body ? { "Content-Type": "application/json" } : undefined,
                    body: body ? JSON.stringify(body) : undefined,
                    cache: "no-store"
                });
            } catch {
                throw new Error("Recovery Fund service could not be reached.");
            }

            let result;
            try {
                result = await response.json();
            } catch {
                throw new Error("Recovery Fund service returned an invalid response.");
            }
            if (!response.ok && response.status !== 202) {
                throw new Error(result.error || "Recovery Fund request failed.");
            }
            return { response, result };
        };

        const renderRecoverySummary = donations => {
            const totalUsdCents = BigInt(donations.totalUsdCents);
            const progressBasisPoints = totalUsdCents * 10000n / RECOVERY_USD_GOAL_CENTS;
            const progress = Number(progressBasisPoints > 10000n ? 10000n : progressBasisPoints) / 100;
            const usdTotal = root.querySelector("[data-recovery-usd-total]");
            const tokenTotal = root.querySelector("[data-recovery-token-total]");
            const usdEstimate = root.querySelector("[data-recovery-usd-estimate]");
            const progressLabel = root.querySelector("[data-recovery-progress-label]");
            const progressBar = root.querySelector("[data-recovery-progress]");

            usdTotal.textContent = `${formatUsdCents(totalUsdCents)} / $614.00`;
            tokenTotal.textContent = `${formatTokenDisplay(donations.totalAmountRaw)} $CHOG`;
            usdEstimate.textContent = `≈ ${formatUsdCents(totalUsdCents)} USD (est.)`;
            progressLabel.textContent = `${progress.toFixed(0)}%`;
            progressBar.setAttribute("aria-valuenow", String(progress));
            progressBar.querySelector("span").style.width = `${progress}%`;

            RECOVERY_MILESTONES.forEach(milestone => {
                const item = root.querySelector(`[data-recovery-milestone="${milestone}"]`);
                if (item) item.classList.toggle(
                    "is-reached",
                    totalUsdCents >= RECOVERY_USD_GOAL_CENTS * BigInt(milestone) / 100n
                );
            });

            const nextMilestone = RECOVERY_MILESTONES.find(milestone =>
                totalUsdCents < RECOVERY_USD_GOAL_CENTS * BigInt(milestone) / 100n
            );
            const nextMilestoneText = root.querySelector("[data-recovery-next]");
            const nextMilestoneImage = root.querySelector("[data-recovery-next-art]");
            if (nextMilestone) {
                const milestoneIndex = RECOVERY_MILESTONES.indexOf(nextMilestone);
                const targetCents = RECOVERY_USD_GOAL_CENTS * BigInt(nextMilestone) / 100n;
                nextMilestoneImage.src = RECOVERY_MILESTONE_IMAGES[milestoneIndex];
                const percentage = document.createElement("strong");
                percentage.textContent = `${nextMilestone}% progress`;
                const target = document.createElement("span");
                target.textContent = `${formatUsdCents(targetCents - totalUsdCents)} USD (est.) to reach`;
                nextMilestoneText.replaceChildren(percentage, target);
            } else {
                nextMilestoneImage.src = RECOVERY_MILESTONE_IMAGES[RECOVERY_MILESTONE_IMAGES.length - 1];
                nextMilestoneText.textContent = "All recovery milestones reached.";
            }

            const tbody = root.querySelector("[data-recovery-contributions]");
            tbody.replaceChildren();
            if (!donations.recentContributions.length) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");
                cell.className = "chog-incident-contribution-empty";
                cell.colSpan = 5;
                cell.textContent = "No contributions recorded yet";
                row.append(cell);
                tbody.append(row);
                return;
            }

            donations.recentContributions.forEach((contribution, index) => {
                const row = document.createElement("tr");
                const values = [
                    String(index + 1),
                    `${contribution.wallet.slice(0, 6)}…${contribution.wallet.slice(-4)}`,
                    `${formatTokenDisplay(contribution.amountRaw)} $CHOG`,
                    formatUsdCents(contribution.usdAmountCents),
                    new Date(contribution.timestamp).toLocaleString()
                ];
                values.forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value;
                    row.append(cell);
                });
                tbody.append(row);
            });
        };

        const refreshRecoverySummary = async () => {
            recoveryDataStatus.hidden = false;
            recoveryDataStatus.textContent = "Loading verified contributions…";
            try {
                const { result } = await requestRecoveryApi("GET");
                if (!result.success || !result.donations) {
                    throw new Error("Verified contribution data is unavailable.");
                }
                renderRecoverySummary(result.donations);
                recoveryDataStatus.hidden = true;
            } catch {
                recoveryDataStatus.textContent =
                    "Verified contribution data is unavailable; displayed totals may be stale.";
            }
        };

        const getSelectedUsdCents = () => {
            if (recoveryAmount.value !== "custom") {
                return Number(recoveryAmount.value);
            }
            const match = recoveryCustomAmount.value.trim()
                .match(/^(\d+)(?:\.(\d{1,2}))?$/);
            if (!match) throw new Error("Enter a USD amount using up to two decimal places.");
            const cents = Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"));
            if (!Number.isSafeInteger(cents) || cents < 50 || cents > 61400) {
                throw new Error("Custom donations must be between $0.50 and $614.00.");
            }
            return cents;
        };

        const ensureRecoveryWallet = async () => {
            const provider = window.ethereum;
            if (!provider || typeof provider.request !== "function") {
                throw new Error("No compatible injected wallet was found.");
            }
            const accounts = await provider.request({ method: "eth_requestAccounts" });
            if (!Array.isArray(accounts) || !accounts.length ||
                typeof accounts[0] !== "string" ||
                !/^0x[0-9a-f]{40}$/i.test(accounts[0])) {
                throw new Error("The wallet did not provide a valid account.");
            }

            const targetChainId = "0x8f";
            let chainId = await provider.request({ method: "eth_chainId" });
            if (typeof chainId !== "string" || chainId.toLowerCase() !== targetChainId) {
                try {
                    await provider.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: targetChainId }]
                    });
                } catch (error) {
                    if (!error || error.code !== 4902) throw error;
                    await provider.request({
                        method: "wallet_addEthereumChain",
                        params: [{
                            chainId: targetChainId,
                            chainName: "Monad Mainnet",
                            nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
                            rpcUrls: ["https://rpc.monad.xyz"],
                            blockExplorerUrls: ["https://monadscan.com"]
                        }]
                    });
                }
                chainId = await provider.request({ method: "eth_chainId" });
                if (typeof chainId !== "string" ||
                    chainId.toLowerCase() !== targetChainId) {
                    throw new Error("Switch your wallet to Monad Mainnet to continue.");
                }
            }
            return { provider, wallet: accounts[0].toLowerCase() };
        };

        const confirmRecoveryDonation = async () => {
            if (!pendingConfirmation) return;
            recoverySendButton.disabled = true;
            recoverySendButton.textContent = "VERIFYING…";
            setRecoveryMessage("Waiting for successful, finalized confirmation on Monad.");
            try {
                for (let attempt = 0; attempt < 45; attempt++) {
                    const { response, result } = await requestRecoveryApi("POST", {
                        action: "confirm",
                        intentId: pendingConfirmation.intentId,
                        transactionHash: pendingConfirmation.transactionHash
                    });
                    if (response.status !== 202 && !result.pending) {
                        if (!result.success) throw new Error(result.error || "Donation verification failed.");
                        pendingConfirmation = null;
                        recoverySendButton.hidden = true;
                        recoverySendButton.textContent = "CONFIRM IN WALLET";
                        setRecoveryMessage("Donation verified and added to the Recovery Fund.");
                        await refreshRecoverySummary();
                        return;
                    }
                    if (attempt < 44) {
                        await new Promise(resolve => setTimeout(resolve, 4000));
                    }
                }
                recoverySendButton.disabled = false;
                recoverySendButton.textContent = "CHECK CONFIRMATION";
                setRecoveryMessage("Still awaiting finality. Use CHECK CONFIRMATION to try again.");
            } catch (error) {
                recoverySendButton.disabled = false;
                recoverySendButton.textContent = "CHECK CONFIRMATION";
                setRecoveryMessage(error.message || "Donation verification failed.", true);
            }
        };

        const prepareRecoveryDonation = async () => {
            recoveryPrepareButton.disabled = true;
            recoverySendButton.hidden = true;
            recoverySendButton.disabled = true;
            recoveryIntent = null;
            recoveryQuote.hidden = true;
            setRecoveryMessage("");
            try {
                const usdAmountCents = getSelectedUsdCents();
                const { provider, wallet } = await ensureRecoveryWallet();
                const { result } = await requestRecoveryApi("POST", {
                    action: "create-intent",
                    wallet,
                    usdAmountCents
                });
                if (!result.success || !result.intent ||
                    result.intent.wallet !== wallet ||
                    !/^[0-9a-f]{1,78}$/.test(result.intent.amountRaw)) {
                    throw new Error("Could not prepare a verified donation quote.");
                }
                recoveryIntent = { ...result.intent, provider };
                recoveryQuote.textContent =
                    `${formatUsdCents(usdAmountCents)} target ≈ ${result.intent.amountChog} $CHOG at $${result.intent.quotePriceUsd} per CHOG. Quote from ${result.intent.quoteTimestamp}; expires ${new Date(result.intent.expiresAt).toLocaleTimeString()}. Network gas is separate.`;
                recoveryQuote.hidden = false;
                recoveryEstimate.hidden = true;
                recoverySendButton.textContent = "CONFIRM IN WALLET";
                recoverySendButton.hidden = false;
                recoverySendButton.disabled = false;
            } catch (error) {
                setRecoveryMessage(error.message || "Could not prepare a donation.", true);
            } finally {
                recoveryPrepareButton.disabled = false;
            }
        };

        const sendRecoveryDonation = async () => {
            if (pendingConfirmation) {
                await confirmRecoveryDonation();
                return;
            }
            if (!recoveryIntent) return;
            if (Date.parse(recoveryIntent.expiresAt) <= Date.now()) {
                recoveryIntent = null;
                recoverySendButton.hidden = true;
                setRecoveryMessage("This quote expired. Prepare a fresh quote before sending.", true);
                return;
            }

            recoverySendButton.disabled = true;
            setRecoveryMessage("Review and approve the direct $CHOG transfer in your wallet.");
            try {
                const provider = recoveryIntent.provider;
                const accounts = await provider.request({ method: "eth_accounts" });
                const chainId = await provider.request({ method: "eth_chainId" });
                if (!Array.isArray(accounts) ||
                    !accounts.some(account =>
                        typeof account === "string" &&
                        account.toLowerCase() === recoveryIntent.wallet
                    ) ||
                    typeof chainId !== "string" ||
                    chainId.toLowerCase() !== "0x8f") {
                    throw new Error("Wallet account or network changed. Connect and prepare the quote again.");
                }
                const amountWord = BigInt(recoveryIntent.amountRaw).toString(16).padStart(64, "0");
                const calldata = "0xa9059cbb" +
                    RECOVERY_FUND_ADDRESS.slice(2).toLowerCase().padStart(64, "0") +
                    amountWord;
                const transactionHash = await provider.request({
                    method: "eth_sendTransaction",
                    params: [{
                        from: recoveryIntent.wallet,
                        to: CHOG_ADDRESS,
                        value: "0x0",
                        data: calldata
                    }]
                });
                if (typeof transactionHash !== "string" ||
                    !/^0x[0-9a-f]{64}$/i.test(transactionHash)) {
                    throw new Error("Wallet returned an invalid transaction hash.");
                }
                pendingConfirmation = {
                    intentId: recoveryIntent.id,
                    transactionHash
                };
                recoverySendButton.textContent = "VERIFYING…";
                await confirmRecoveryDonation();
            } catch (error) {
                recoverySendButton.disabled = false;
                if (pendingConfirmation) recoverySendButton.textContent = "CHECK CONFIRMATION";
                setRecoveryMessage(error.message || "Wallet transfer was not completed.", true);
            }
        };

        const openRecoveryView = () => {
            recoveryModal.hidden = false;
            recoveryView.hidden = false;
            recoveryContributeButton.setAttribute("aria-expanded", "true");
            if (pendingConfirmation) {
                recoverySendButton.hidden = false;
                recoverySendButton.disabled = false;
                recoverySendButton.textContent = "CHECK CONFIRMATION";
            }
            recoveryAmountOptions[0].focus();
        };
        const closeRecoveryView = () => {
            recoveryView.hidden = true;
            recoveryModal.hidden = true;
            recoveryContributeButton.setAttribute("aria-expanded", "false");
            recoveryContributeButton.focus();
        };

        recoveryContributeButton.addEventListener("click", openRecoveryView);
        const updateRecoveryAmountDisplay = () => {
            const amount = recoveryAmount.value === "custom"
                ? Number(recoveryCustomAmount.value)
                : Number(recoveryAmount.value) / 100;
            recoveryDisplayAmount.textContent = Number.isFinite(amount)
                ? `$${amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`
                : "$0.50";
        };
        recoveryAmount.addEventListener("change", () => {
            recoveryCustomAmount.hidden = recoveryAmount.value !== "custom";
            recoveryAmountOptions.forEach(option => {
                const selected = option.dataset.recoveryAmountOption === recoveryAmount.value;
                option.setAttribute("aria-pressed", String(selected));
            });
            recoveryIntent = null;
            recoveryQuote.hidden = true;
            recoveryEstimate.hidden = recoveryAmount.value === "custom";
            recoverySendButton.hidden = true;
            updateRecoveryAmountDisplay();
            if (recoveryAmount.value === "custom") recoveryCustomAmount.focus();
        });
        recoveryAmountOptions.forEach(option => {
            option.addEventListener("click", () => {
                recoveryAmount.value = option.dataset.recoveryAmountOption;
                recoveryAmount.dispatchEvent(new Event("change", { bubbles: true }));
                if (recoveryAmount.value !== "custom") option.focus();
            });
        });
        recoveryCustomAmount.addEventListener("input", () => {
            recoveryIntent = null;
            recoveryQuote.hidden = true;
            recoveryEstimate.hidden = recoveryAmount.value === "custom";
            recoverySendButton.hidden = true;
            updateRecoveryAmountDisplay();
        });
        recoveryPrepareButton.addEventListener("click", prepareRecoveryDonation);
        recoverySendButton.addEventListener("click", sendRecoveryDonation);
        root.querySelector("[data-recovery-cancel]").addEventListener("click", closeRecoveryView);
        root.querySelector("[data-recovery-close]").addEventListener("click", closeRecoveryView);
        recoveryModal.addEventListener("click", event => {
            if (event.target === recoveryModal) closeRecoveryView();
        });
        root.addEventListener("keydown", event => {
            if (event.key === "Escape" && !recoveryModal.hidden) {
                event.preventDefault();
                closeRecoveryView();
            }
        });
        refreshRecoverySummary();
        const tabs = Array.from(root.querySelectorAll("[data-incident-tab]"));
        const panels = Array.from(root.querySelectorAll("[data-incident-panel]"));
        const activateTab = (tab, moveFocus) => {
            tabs.forEach(item => {
                const selected = item === tab;
                item.setAttribute("aria-selected", String(selected));
                item.tabIndex = selected ? 0 : -1;
            });
            panels.forEach(panel => {
                panel.hidden = panel.dataset.incidentPanel !== tab.dataset.incidentTab;
            });
            recoveryView.hidden = true;
            recoveryModal.hidden = true;
            recoveryContributeButton.setAttribute("aria-expanded", "false");
            root.classList.toggle("is-recovery-viewing", tab.dataset.incidentTab === "recovery");
            const section = SECTIONS.find(item => item.id === tab.dataset.incidentTab);
            syncArchiveLayout();
            status.textContent = `DIAGNOSTIC STATUS: ${section.status}`;
            if (moveFocus) tab.focus();
        };

        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => activateTab(tab, false));
            tab.addEventListener("keydown", event => {
                let nextIndex;
                if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
                else if (event.key === "Home") nextIndex = 0;
                else if (event.key === "End") nextIndex = tabs.length - 1;
                else return;

                event.preventDefault();
                activateTab(tabs[nextIndex], true);
            });
        });

        const dialog = root.querySelector("[data-incident-dialog]");
        const viewer = root.querySelector("[data-incident-viewer]");
        let returnFocus = null;

        // The window body no longer scrolls, so overlays can simply fill it.
        const showLayer = (layer, focusTarget, origin) => {
            returnFocus = origin;
            layer.hidden = false;
            focusTarget.focus();
        };
        const hideLayer = layer => {
            layer.hidden = true;
            if (returnFocus && returnFocus.isConnected) returnFocus.focus();
        };
        const openUndoDialog = origin => showLayer(dialog, dialog.querySelector("[data-incident-dismiss]"), origin);

        dialog.addEventListener("click", event => {
            if (event.target === dialog || event.target.closest("[data-incident-dismiss]")) hideLayer(dialog);
        });
        viewer.addEventListener("click", event => {
            if (event.target === viewer || event.target.closest("[data-viewer-close]")) hideLayer(viewer);
        });
        root.addEventListener("keydown", event => {
            if (event.key !== "Escape") return;
            if (!dialog.hidden) hideLayer(dialog);
            else if (!viewer.hidden) hideLayer(viewer);
        });

        const sceneContent = root.querySelector("[data-scene-content]");
        const sceneBack = root.querySelector("[data-scene-back]");
        const sceneNext = root.querySelector("[data-scene-next]");
        const progressLabel = root.querySelector("[data-scene-progress-label]");
        const progress = root.querySelector("[data-scene-progress]");
        const progressFill = root.querySelector("[data-scene-progress-fill]");
        const sceneState = { step: 0, pasted: false };
        const lastStep = SCENE_STEPS.length - 1;

        const renderScene = () => {
            const { step } = sceneState;
            sceneContent.innerHTML = `<h3>${SCENE_STEPS[step].title}</h3>${sceneStepMarkup(step, sceneState)}`;
            progressLabel.textContent = `STEP ${step + 1} OF ${SCENE_STEPS.length} — ${SCENE_STEPS[step].title}`;
            progress.setAttribute("aria-valuenow", String(step + 1));
            progress.setAttribute("aria-valuetext", progressLabel.textContent);
            progressFill.style.width = `${((step + 1) / SCENE_STEPS.length) * 100}%`;
            sceneBack.disabled = step === 0;
            // Steps 1 and 3 can only be advanced by their own action button, so visitors can't skip ahead.
            sceneNext.hidden = step === 0 || step === 2;
            sceneNext.disabled = step === lastStep || (step === 1 && !sceneState.pasted);
        };
        const goToScene = step => {
            sceneState.step = Math.min(lastStep, Math.max(0, step));
            renderScene();
            sceneContent.scrollTop = 0;
        };

        sceneBack.addEventListener("click", () => goToScene(sceneState.step - 1));
        sceneNext.addEventListener("click", () => goToScene(sceneState.step + 1));
        sceneContent.addEventListener("click", event => {
            const action = event.target.closest("[data-scene-action]");
            if (action) {
                if (action.dataset.sceneAction === "next") {
                    goToScene(sceneState.step + 1);
                } else if (action.dataset.sceneAction === "paste") {
                    sceneState.pasted = true;
                    renderScene();
                } else if (action.dataset.sceneAction === "undo") {
                    openUndoDialog(action);
                }
                return;
            }

            const zoom = event.target.closest("[data-incident-zoom]");
            if (!zoom) return;
            const isRelay = zoom.dataset.incidentZoom === "relay";
            const image = viewer.querySelector("[data-viewer-image]");
            image.src = isRelay ? RELAY_IMAGE : MONAD_IMAGE;
            image.alt = zoom.querySelector("img").alt;
            viewer.querySelector("[data-viewer-title]").textContent = isRelay ? "Evidence Viewer — relay-receipt.png" : "Evidence Viewer — monadvision.png";
            showLayer(viewer, viewer.querySelector("[data-viewer-close]"), zoom);
        });
        renderScene();

        // Non-team archive UI sounds are enabled by default and may be blocked by browser audio policy.
        let audioContext = null;
        const beep = (frequency, duration) => {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            audioContext = audioContext || new AudioContextClass();
            if (audioContext.state === "suspended") audioContext.resume();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = "square";
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.04, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
        };
        const archiveList = root.querySelector("[data-archive-list]");
        const archiveViewer = root.querySelector("[data-archive-viewer]");
        const archivePath = root.querySelector("[data-archive-path]");
        const archiveImage = root.querySelector("[data-archive-image]");
        const archiveVideo = root.querySelector("[data-archive-video]");
        const archiveEmpty = root.querySelector("[data-archive-empty]");
        const archiveCaption = root.querySelector("[data-archive-caption]");
        const archivePrev = root.querySelector("[data-archive-prev]");
        const archiveNext = root.querySelector("[data-archive-next]");
        const archiveStage = root.querySelector(".chog-incident-archive-stage");
        const archiveState = { entry: null, index: 0 };
        const usesTeamArchiveBehavior = entry => entry?.id === "team" || entry?.id === "nadfun" || entry?.id === "relay" || entry?.id === "original";
        const usesExpandedArchiveLayout = entry => usesTeamArchiveBehavior(entry) || entry?.id === "original";
        const hasSingleScreenshot = entry => entry?.id === "relay" && entry.images.length === 1 && !entry.images[0].videoSrc;
        const archiveSound = new Audio();
        archiveSound.preload = "auto";
        let archiveSwapTimer = 0;
        let archiveDisplayVersion = 0;

        const stopArchiveSound = () => {
            archiveSound.pause();
            archiveSound.currentTime = 0;
        };
        const playArchiveSound = item => {
            if (!usesTeamArchiveBehavior(archiveState.entry)) return;
            const soundSrc = item.videoSrc
                ? "assets/sounds/chogsion%20failed-%20Sound%20Effect%20(HD).mp3"
                : "assets/sounds/Discord%20Ping%20Sound%20Effect.mp3";
            stopArchiveSound();
            if (archiveSound.src !== new URL(soundSrc, document.baseURI).href) archiveSound.src = soundSrc;
            const playback = archiveSound.play();
            if (playback) {
                playback.catch(error => {
                    if (error.name !== "AbortError") console.warn("Could not play the CHOG team archive sound.", error);
                });
            }
        };

        // While a screenshot is open, the case header collapses so the black viewing area can use the space.
        function syncArchiveLayout() {
            const archiveTabSelected = root.querySelector("#incident-tab-archive").getAttribute("aria-selected") === "true";
            root.classList.toggle("is-team-archive-viewing", archiveTabSelected && !archiveViewer.hidden && usesExpandedArchiveLayout(archiveState.entry));
        }

        const renderArchiveImage = () => {
            const { entry, index } = archiveState;
            const count = entry.images.length;
            const displayVersion = ++archiveDisplayVersion;
            const singleScreenshot = hasSingleScreenshot(entry);
            archivePrev.disabled = index <= 0 || singleScreenshot;
            archiveNext.disabled = index >= count - 1 || singleScreenshot;
            archivePrev.hidden = archiveNext.hidden = count < 2 || singleScreenshot;
            archiveStage.classList.toggle("is-team-archive-stage", usesExpandedArchiveLayout(entry));
            if (!count) {
                archiveImage.onload = null;
                archiveVideo.pause();
                archiveVideo.hidden = true;
                archiveImage.hidden = true;
                archiveEmpty.hidden = false;
                archiveEmpty.textContent = `${entry.name} is empty. No screenshots have been archived for this entry yet, and nothing has been invented to fill the gap.`;
                archiveCaption.textContent = "0 files";
                return;
            }
            const item = entry.images[index];
            archiveEmpty.hidden = true;
            archiveImage.classList.remove("is-entering");
            archiveVideo.classList.remove("is-entering", "is-failure-entering");
            archiveImage.onload = null;
            archiveVideo.onloadeddata = null;
            archiveVideo.onended = null;
            archiveVideo.pause();
            archiveImage.style.transform = "";
            delete archiveImage.dataset.zoom;
            archiveStage.style.display = "";
            archiveStage.style.overflow = "";
            delete archiveStage.dataset.zoomFitScale;
            delete archiveStage.dataset.zoomMax;
            archiveImage.style.width = "";
            archiveImage.style.height = "";
            archiveImage.style.margin = "";
            archiveImage.style.maxWidth = "";
            archiveImage.style.maxHeight = "";
            archiveVideo.hidden = !item.videoSrc;
            archiveImage.hidden = !!item.videoSrc;
            if (item.videoSrc) {
                archiveVideo.onloadeddata = () => {
                    if (displayVersion !== archiveDisplayVersion) return;
                    archiveVideo.classList.remove("is-entering");
                    void archiveVideo.offsetWidth;
                    archiveVideo.classList.add("is-entering", "is-failure-entering");
                    const playback = archiveVideo.play();
                    if (playback) {
                        playback.catch(error => {
                            if (error.name !== "AbortError") console.warn("Could not play the CHOGSION FAILED video.", error);
                        });
                    }
                };
                archiveVideo.onended = () => {
                    if (displayVersion !== archiveDisplayVersion) return;
                    archiveVideo.pause();
                    archiveVideo.currentTime = Math.max(0, archiveVideo.duration - 1 / 30);
                };
                archiveVideo.src = item.videoSrc;
                archiveVideo.load();
            } else {
                archiveImage.onload = () => {
                    if (displayVersion !== archiveDisplayVersion || !usesTeamArchiveBehavior(entry)) return;
                    archiveImage.classList.remove("is-entering", "is-failure-entering");
                    void archiveImage.offsetWidth;
                    archiveImage.classList.add("is-entering");
                    playArchiveSound(item);
                };
                archiveImage.src = item.src;
                archiveImage.alt = item.alt;
            }
            archiveCaption.textContent = entry.id === "relay" && !item.videoSrc
                ? `${item.label} — CTRL+SCROLL TO ZOOM · SCROLL TO INSPECT`
                : usesTeamArchiveBehavior(entry) ? item.label : `${item.label} — ${index + 1} of ${count}`;
            if (usesTeamArchiveBehavior(entry) && !item.videoSrc && archiveImage.complete && archiveImage.naturalWidth > 0) {
                archiveImage.onload();
            }
        };
        const openArchiveEntry = id => {
            archiveState.entry = ARCHIVE.find(item => item.id === id);
            archiveState.index = 0;
            archiveList.hidden = true;
            archiveViewer.hidden = false;
            syncArchiveLayout();
            archivePath.textContent = `A:\\ARCHIVE\\${archiveState.entry.name}`;
            renderArchiveImage();
            archiveViewer.querySelector("[data-archive-back]").focus();
            if (!usesTeamArchiveBehavior(archiveState.entry)) beep(660, 0.08);
        };
        const closeArchiveEntry = () => {
            const id = archiveState.entry && archiveState.entry.id;
            const usesTeamBehavior = usesTeamArchiveBehavior(archiveState.entry);
            archiveViewer.hidden = true;
            archiveList.hidden = false;
            syncArchiveLayout();
            archivePath.textContent = "A:\\ARCHIVE";
            const entryButton = id && archiveList.querySelector(`[data-archive-open="${id}"]`);
            if (entryButton) entryButton.focus();
            if (usesTeamBehavior) {
                stopArchiveSound();
                archiveVideo.pause();
                archiveVideo.currentTime = 0;
            } else beep(440, 0.08);
        };
        // Debounce rapid navigation so only the last selected screenshot is animated and pinged.
        const stepArchive = delta => {
            if (hasSingleScreenshot(archiveState.entry)) return;
            const target = archiveState.index + delta;
            if (target < 0 || target >= archiveState.entry.images.length) return;
            archiveState.index = target;
            clearTimeout(archiveSwapTimer);
            if (usesTeamArchiveBehavior(archiveState.entry)) {
                stopArchiveSound();
                const item = archiveState.entry.images[target];
                if (item.videoSrc) playArchiveSound(item);
            }
            archiveSwapTimer = setTimeout(() => {
                renderArchiveImage();
            }, 140);
            if (!usesTeamArchiveBehavior(archiveState.entry)) beep(760, 0.06);
        };

        archiveList.addEventListener("click", event => {
            const entry = event.target.closest("[data-archive-open]");
            if (entry) openArchiveEntry(entry.dataset.archiveOpen);
        });
        root.querySelector("[data-archive-back]").addEventListener("click", closeArchiveEntry);
        archivePrev.addEventListener("click", () => stepArchive(-1));
        archiveNext.addEventListener("click", () => stepArchive(1));
        archiveViewer.addEventListener("keydown", event => {
            if (event.key === "ArrowLeft") stepArchive(-1);
            else if (event.key === "ArrowRight") stepArchive(1);
        });
        archiveStage.addEventListener("wheel", event => {
            if (archiveState.entry?.id !== "relay" || archiveImage.hidden || !archiveImage.naturalWidth) return;
            if (!event.ctrlKey) return;
            event.preventDefault();
            const fitScale = Number(archiveStage.dataset.zoomFitScale) || Math.min(
                archiveStage.clientWidth / archiveImage.naturalWidth,
                archiveStage.clientHeight / archiveImage.naturalHeight
            );
            if (!fitScale) return;
            const fillScale = Math.max(
                archiveStage.clientWidth / archiveImage.naturalWidth,
                archiveStage.clientHeight / archiveImage.naturalHeight
            );
            const maxZoom = Number(archiveStage.dataset.zoomMax) || fillScale / fitScale;
            archiveStage.dataset.zoomFitScale = String(fitScale);
            archiveStage.dataset.zoomMax = String(maxZoom);
            const currentZoom = Number(archiveImage.dataset.zoom) || 1;
            const nextZoom = Math.min(maxZoom, Math.max(1, currentZoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15)));
            const width = archiveImage.naturalWidth * fitScale * nextZoom;
            const height = archiveImage.naturalHeight * fitScale * nextZoom;
            archiveImage.dataset.zoom = String(nextZoom);
            if (nextZoom === 1) {
                archiveStage.style.display = "";
                archiveStage.style.overflow = "";
                delete archiveStage.dataset.zoomFitScale;
                delete archiveStage.dataset.zoomMax;
                archiveImage.style.width = "";
                archiveImage.style.height = "";
                archiveImage.style.margin = "";
                archiveImage.style.maxWidth = "";
                archiveImage.style.maxHeight = "";
                archiveImage.classList.remove("is-entering");
                archiveImage.style.transform = "";
                archiveStage.scrollTop = 0;
                archiveStage.scrollLeft = 0;
                return;
            }
            archiveStage.style.display = "block";
            archiveStage.style.overflow = "auto";
            archiveImage.style.maxWidth = "none";
            archiveImage.style.maxHeight = "none";
            archiveImage.style.width = `${width}px`;
            archiveImage.style.height = `${height}px`;
            archiveImage.style.margin = "0 auto";
            archiveImage.classList.remove("is-entering");
            archiveImage.style.transform = "";
            archiveStage.scrollLeft = Math.max(0, (width - archiveStage.clientWidth) / 2);
            archiveStage.scrollTop = Math.max(0, (height - archiveStage.clientHeight) / 2);
        }, { passive: false });
    }

    window.openChogIncidentReport = openIncidentReport;
})();
