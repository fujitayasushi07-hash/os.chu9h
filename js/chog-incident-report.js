(() => {
    "use strict";

    const TITLE = "DR. WATSON — 614_LOST.exe";
    const WINDOW_ICON = "assets/images/doctor_watson.ico";
    const TRANSACTION_URL = "https://relay.link/transaction/0x668ee5d00f7734f25ac018eb3aa766667fb5d7ddabf9e25d8944e3f3342cea5d";
    const SECTIONS = [
        { id: "summary", label: "CASE SUMMARY", status: "CASE FILE OPEN" },
        { id: "evidence", label: "ON-CHAIN EVIDENCE", status: "CHAIN DATA NOT VERIFIED HERE" },
        { id: "scene", label: "THE CRIME SCENE", status: "CLIPBOARD SUSPECT IDENTIFIED" },
        { id: "recovery", label: "RECOVERY ATTEMPT", status: "RECOVERY STATUS UNRESOLVED" }
    ];

    const CHOG_ADDRESS = "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777";
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

                    <section class="chog-incident-panel" id="incident-panel-recovery" role="tabpanel" aria-labelledby="incident-tab-recovery" data-incident-panel="recovery" hidden>
                        <h2>RECOVERY ATTEMPT</h2>
                        <p>According to the user's account, they contacted <strong>Relay</strong>, <strong>nad.fun</strong>, and the <strong>CHOG founders</strong> seeking help with the incident.</p>
                        <p>This summary does not quote private conversations or imply a response or recovery outcome. The case is still marked unresolved.</p>
                        <div class="chog-incident-callout">Status: waiting on humans. The blockchain does not have a help-desk extension.</div>
                    </section>
                </div>

                <footer class="chog-incident-footer">
                    <span>DR. WATSON: NO WALLET CONNECTED • NO TRANSACTION ACTIONS ENABLED</span>
                </footer>

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
            const section = SECTIONS.find(item => item.id === tab.dataset.incidentTab);
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
    }

    window.openChogIncidentReport = openIncidentReport;
})();
