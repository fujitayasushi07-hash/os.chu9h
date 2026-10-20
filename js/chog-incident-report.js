(() => {
    "use strict";

    const TITLE = "DR. WATSON — 614_LOST.exe";
    const WINDOW_ICON = "assets/images/doctor_watson.ico";
    const TRANSACTION_URL = "https://relay.link/transaction/0x668ee5d00f7734f25ac018eb3aa766667fb5d7ddabf9e25d8944e3f3342cea5d";
    const SECTIONS = [
        { id: "summary", label: "CASE SUMMARY", status: "CASE FILE OPEN" },
        { id: "evidence", label: "ON-CHAIN EVIDENCE", status: "CHAIN DATA NOT VERIFIED HERE" },
        { id: "scene", label: "THE CRIME SCENE", status: "CLIPBOARD SUSPECT IDENTIFIED" },
        { id: "recovery", label: "RECOVERY ATTEMPT", status: "RECOVERY STATUS UNRESOLVED" },
        { id: "archive", label: "SUPPORT TICKET ARCHIVE", status: "ARCHIVE MOUNTED READ-ONLY" }
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
        { id: "nadfun", name: "NADFUN_SUPPORT.log", note: "Nad.fun support screenshots", images: [] },
        { id: "relay", name: "RELAY_SUPPORT.log", note: "Relay support screenshots", images: [] },
        {
            id: "original",
            name: "ORIGINAL_EVIDENCE",
            note: "Original transaction and token screenshots",
            images: [
                { src: RELAY_IMAGE, label: "relay-receipt.png", alt: "Screenshot of the Relay transaction details page showing a successful Solana to Monad USDC bridge" },
                { src: MONAD_IMAGE, label: "monadvision.png", alt: "Screenshot of a MonadVision page titled Contract (Chog) showing a token portfolio" }
            ]
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

                    <section class="chog-incident-panel" id="incident-panel-recovery" role="tabpanel" aria-labelledby="incident-tab-recovery" data-incident-panel="recovery" hidden>
                        <h2>RECOVERY ATTEMPT</h2>
                        <p>According to the user's account, they contacted <strong>Relay</strong>, <strong>nad.fun</strong>, and the <strong>CHOG founders</strong> seeking help with the incident.</p>
                        <p>This summary does not quote private conversations or imply a response or recovery outcome. The case is still marked unresolved.</p>
                        <div class="chog-incident-callout">Status: waiting on humans. The blockchain does not have a help-desk extension.</div>
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
        const archiveSound = new Audio();
        archiveSound.preload = "auto";
        let archiveSwapTimer = 0;
        let archiveDisplayVersion = 0;

        const stopArchiveSound = () => {
            archiveSound.pause();
            archiveSound.currentTime = 0;
        };
        const playArchiveSound = item => {
            if (archiveState.entry?.id !== "team") return;
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
            root.classList.toggle("is-team-archive-viewing", archiveTabSelected && !archiveViewer.hidden && archiveState.entry?.id === "team");
        }

        const renderArchiveImage = () => {
            const { entry, index } = archiveState;
            const count = entry.images.length;
            const displayVersion = ++archiveDisplayVersion;
            archivePrev.disabled = index <= 0;
            archiveNext.disabled = index >= count - 1;
            archivePrev.hidden = archiveNext.hidden = count < 2;
            archiveStage.classList.toggle("is-team-archive-stage", entry.id === "team");
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
                    if (displayVersion !== archiveDisplayVersion || entry.id !== "team") return;
                    archiveImage.classList.remove("is-entering", "is-failure-entering");
                    void archiveImage.offsetWidth;
                    archiveImage.classList.add("is-entering");
                    playArchiveSound(item);
                };
                archiveImage.src = item.src;
                archiveImage.alt = item.alt;
            }
            archiveCaption.textContent = entry.id === "team" ? item.label : `${item.label} — ${index + 1} of ${count}`;
            if (entry.id === "team" && !item.videoSrc && archiveImage.complete && archiveImage.naturalWidth > 0) {
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
            if (archiveState.entry.id !== "team") beep(660, 0.08);
        };
        const closeArchiveEntry = () => {
            const id = archiveState.entry && archiveState.entry.id;
            const wasTeamEntry = archiveState.entry?.id === "team";
            archiveViewer.hidden = true;
            archiveList.hidden = false;
            syncArchiveLayout();
            archivePath.textContent = "A:\\ARCHIVE";
            const entryButton = id && archiveList.querySelector(`[data-archive-open="${id}"]`);
            if (entryButton) entryButton.focus();
            if (wasTeamEntry) {
                stopArchiveSound();
                archiveVideo.pause();
                archiveVideo.currentTime = 0;
            } else beep(440, 0.08);
        };
        // Debounce rapid navigation so only the last selected screenshot is animated and pinged.
        const stepArchive = delta => {
            const target = archiveState.index + delta;
            if (target < 0 || target >= archiveState.entry.images.length) return;
            archiveState.index = target;
            clearTimeout(archiveSwapTimer);
            if (archiveState.entry.id === "team") {
                stopArchiveSound();
                const item = archiveState.entry.images[target];
                if (item.videoSrc) playArchiveSound(item);
            }
            archiveSwapTimer = setTimeout(() => {
                renderArchiveImage();
            }, 140);
            if (archiveState.entry.id !== "team") beep(760, 0.06);
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
    }

    window.openChogIncidentReport = openIncidentReport;
})();
