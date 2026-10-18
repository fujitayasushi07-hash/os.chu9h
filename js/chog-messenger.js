/* CHOG Messenger - UI only. No network, API, or Supabase access. */
(function () {
    const TITLE = "CHOG Messenger";
    const ICON = "assets/images/icon-chog-message.png";
    const AVATAR_IMAGES = [1, 2, 3, 4, 5, 6].map((n) => "assets/images/avatar" + n + ".jpg");
    const MIN_NAME = 4;
    const MAX_NAME = 24;
    const MAX_MESSAGE = 500;
    const MAX_UPLOAD_BYTES = 1024 * 1024;

    const STORAGE_KEY = "chogmsg-profile";

    const profile = { name: "", avatarIndex: 0, avatarUrl: null };

    function loadProfile() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!saved || typeof saved.name !== "string") return false;
            const name = saved.name.trim();
            const length = Array.from(name).length;
            if (length < MIN_NAME || length > MAX_NAME) return false;
            const index = Number.isInteger(saved.avatarIndex) &&
                saved.avatarIndex >= 0 && saved.avatarIndex < AVATAR_IMAGES.length
                ? saved.avatarIndex : 0;
            const url = typeof saved.avatarUrl === "string" &&
                /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(saved.avatarUrl)
                ? saved.avatarUrl : null;
            Object.assign(profile, { name, avatarIndex: index, avatarUrl: url });
            return true;
        } catch {
            return false;
        }
    }

    function saveProfile() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
            return true;
        } catch {
            return false;
        }
    }

    // Downscales an uploaded image so the persisted data URL stays small.
    function readAvatarFile(file, callback) {
        const reader = new FileReader();
        reader.onerror = () => callback(null);
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => callback(null);
            img.onload = () => {
                const size = 96;
                const canvas = document.createElement("canvas");
                canvas.width = canvas.height = size;
                const scale = Math.max(size / img.width, size / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                canvas.getContext("2d").drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
                callback(canvas.toDataURL("image/png"));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function paintAvatar(node, p) {
        node.classList.add("chogmsg-av-" + p.avatarIndex);
        node.textContent = "";
        node.style.backgroundImage = 'url("' + (p.avatarUrl || AVATAR_IMAGES[p.avatarIndex]) + '")';
    }

    function makeAvatar(p, small) {
        const node = el("div", "chogmsg-avatar" + (small ? " chogmsg-avatar-sm" : ""));
        paintAvatar(node, p);
        return node;
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function buildHeader(subtitle) {
        const header = el("div", "chogmsg-header");
        const logo = document.createElement("img");
        logo.src = ICON;
        logo.alt = "";
        const titles = el("div");
        titles.append(el("div", "chogmsg-header-title", "CHOG Messenger"), el("div", "chogmsg-header-sub", subtitle));
        header.append(logo, titles);
        return header;
    }

    // Sizes the window per view, clamped to the viewport. Mobile sizing is left to openWindow().
    function sizeWindow(root, width, height) {
        const win = root.closest(".window");
        if (!win) return;
        if (window.innerWidth <= 768) {
            win.style.height = height ? "70vh" : "auto";
            return;
        }
        const left = parseInt(win.style.left, 10) || 0;
        const top = parseInt(win.style.top, 10) || 0;
        win.style.maxHeight = Math.max(300, window.innerHeight - top - 52) + "px";
        win.style.width = Math.max(300, Math.min(width, window.innerWidth - left - 12)) + "px";
        win.style.height = height
            ? Math.max(300, Math.min(height, window.innerHeight - top - 52)) + "px"
            : "auto";
    }

    // Shared form for first-time setup and Edit Profile. It edits a draft copy, which
    // intentionally shadows the module-level `profile` until onSubmit commits it.
    function buildProfileForm(opts) {
        const profile = Object.assign({}, opts.initial);
        const panel = el("div", "chogmsg-panel chogmsg-setup");
        panel.append(el("h3", null, opts.title));

        const nameField = el("div", "chogmsg-field");
        const nameLabel = el("label", null, "Username (" + MIN_NAME + "-" + MAX_NAME + " characters)");
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.maxLength = MAX_NAME;
        nameInput.autocomplete = "off";
        nameInput.value = profile.name;
        nameLabel.htmlFor = nameInput.id = "chogmsg-name-input";
        nameField.append(nameLabel, nameInput);

        const avatarField = el("div", "chogmsg-field");
        avatarField.append(el("div", null, "Avatar"));
        const grid = el("div", "chogmsg-avatar-grid");
        const optionButtons = [];

        function refreshSelection() {
            optionButtons.forEach((btn, i) => {
                btn.classList.toggle("chogmsg-selected", !profile.avatarUrl && i === profile.avatarIndex);
            });
        }

        AVATAR_IMAGES.forEach((src, i) => {
            const btn = el("button", "chogmsg-avatar-option");
            btn.type = "button";
            btn.title = "Avatar " + (i + 1);
            btn.append(makeAvatar({ avatarIndex: i, avatarUrl: null }, false));
            btn.addEventListener("click", () => {
                profile.avatarIndex = i;
                profile.avatarUrl = null;
                preview.replaceChildren(makeAvatar(profile, false));
                refreshSelection();
            });
            optionButtons.push(btn);
            grid.append(btn);
        });
        avatarField.append(grid);

        const uploadRow = el("div", "chogmsg-upload-row");
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/png,image/jpeg,image/gif,image/webp";
        const uploadBtn = el("button", null, "Upload image...");
        uploadBtn.type = "button";
        const preview = el("div");
        preview.append(makeAvatar(profile, false));
        uploadRow.append(uploadBtn, fileInput, el("span", null, "Preview:"), preview);
        avatarField.append(uploadRow);
        avatarField.append(el("div", "chogmsg-note", "Optional. PNG, JPEG, GIF or WebP up to 1 MB. Stays on this device only."));

        const error = el("div", "chogmsg-error");
        error.setAttribute("role", "alert");

        uploadBtn.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            fileInput.value = "";
            if (!file) return;
            if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
                error.textContent = "Please choose a PNG, JPEG, GIF or WebP image.";
                return;
            }
            if (file.size > MAX_UPLOAD_BYTES) {
                error.textContent = "Image is too large (max 1 MB).";
                return;
            }
            error.textContent = "";
            readAvatarFile(file, dataUrl => {
                if (!dataUrl) {
                    error.textContent = "Could not read that image.";
                    return;
                }
                profile.avatarUrl = dataUrl;
                preview.replaceChildren(makeAvatar(profile, false));
                refreshSelection();
            });
        });

        const actions = el("div", "chogmsg-actions");
        const joinBtn = el("button", null, opts.submitLabel);
        joinBtn.type = "button";
        if (opts.onCancel) {
            const cancelBtn = el("button", null, "Cancel");
            cancelBtn.type = "button";
            cancelBtn.addEventListener("click", opts.onCancel);
            actions.append(cancelBtn);
        }
        actions.append(joinBtn);

        function join() {
            const name = nameInput.value.trim();
            if (Array.from(name).length < MIN_NAME || Array.from(name).length > MAX_NAME) {
                            error.textContent = "Username must be " + MIN_NAME + " to " + MAX_NAME + " characters.";
                nameInput.focus();
                return;
            }
            profile.name = name;
            const failure = opts.onSubmit(profile);
            if (failure) error.textContent = failure;
        }

        joinBtn.addEventListener("click", join);
        let focusedOnce = false;
        nameInput.addEventListener("focus", () => {
            if (focusedOnce) return;
            focusedOnce = true;
            if (opts.onFirstNameFocus) opts.onFirstNameFocus(nameInput);
        });
        nameInput.addEventListener("keydown", e => {
            if (e.key === "Enter") join();
            if (e.key === "Escape" && opts.onCancel) opts.onCancel();
        });

        panel.append(nameField, avatarField, error, actions,
            el("div", "chogmsg-note", "Your profile is saved on this device only and is not a server account."));
        refreshSelection();
        return { panel, nameInput };
    }

    // Commits a draft to the shared profile and localStorage; returns an error message on failure.
    function commitProfile(draft) {
        const previous = Object.assign({}, profile);
        Object.assign(profile, draft);
        if (saveProfile()) return null;
        Object.assign(profile, previous);
        return "Could not save your profile in this browser (storage unavailable or full).";
    }

    function renderSetup(root) {
        sizeWindow(root, 400, 0);
        root.replaceChildren();
        root.append(buildHeader("Choose a username to join Global Chat"));
        const form = buildProfileForm({
            title: "Set up your profile",
            submitLabel: "Enter Global Chat",
            initial: profile,
            onSubmit: draft => commitProfile(draft) || renderChat(root, true),
            onFirstNameFocus: input => showUsernameWarning(root, input)
        });
        root.append(form.panel);
        form.nameInput.focus();
    }

    function openEditProfile(root, onSaved) {
        if (root.querySelector(".chogmsg-edit")) return;
        const overlay = el("div", "chogmsg-edit");
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-label", "Edit Profile");
        // Shrink the window to fit the form; the hidden chat keeps its DOM and messages.
        const chat = root.querySelector(".chogmsg-chat");
        const history = chat && chat.querySelector(".chogmsg-history");
        const scrollTop = history ? history.scrollTop : 0;
        root.classList.add("chogmsg-editing");
        sizeWindow(root, 400, 0);
        const close = () => {
            // Removing the overlay disconnects the input, which also makes the peeking CHOG retreat.
            overlay.remove();
            root.querySelectorAll(".chogmsg-bubble").forEach(b => b.remove());
            root.classList.remove("chogmsg-editing");
            sizeWindow(root, 640, 540);
            if (history) history.scrollTop = scrollTop;
        };
        const form = buildProfileForm({
            title: "Set up your profile",
            submitLabel: "Save",
            initial: profile,
            onCancel: close,
            onFirstNameFocus: input => showUsernameWarning(root, input),
            onSubmit: draft => {
                const failure = commitProfile(draft);
                if (failure) return failure;
                onSaved();
                close();
                return null;
            }
        });
        overlay.append(buildHeader("Choose a username to join Global Chat"), form.panel);
        root.append(overlay);
        form.nameInput.focus();
    }

    function renderChat(root, playIntro) {
        sizeWindow(root, 640, 540);
        root.replaceChildren();
        const header = buildHeader("Global Chat");
        const userBox = el("button", "chogmsg-header-user chogmsg-profile-btn");
        userBox.type = "button";
        userBox.title = "Edit Profile";
        const online = el("span", "chogmsg-online");
        online.append(el("span", "chogmsg-online-dot"), document.createTextNode("Online"));
        const nameLabel = el("span", "chogmsg-profile-name", profile.name);
        const avatarSlot = el("span", "chogmsg-profile-avatar");
        avatarSlot.append(makeAvatar(profile, true));
        userBox.append(avatarSlot, nameLabel, online);
        userBox.addEventListener("click", () => openEditProfile(root, () => {
            nameLabel.textContent = profile.name;
            avatarSlot.replaceChildren(makeAvatar(profile, true));
        }));
        header.append(userBox);

        const chat = el("div", "chogmsg-chat");
        const history = el("div", "chogmsg-history");
        history.setAttribute("aria-live", "polite");

        const compose = el("form", "chogmsg-compose");
        const input = document.createElement("textarea");
        input.maxLength = MAX_MESSAGE;
        input.placeholder = "Type a message...";
        input.setAttribute("aria-label", "Message");
        const send = el("button", null, "Send");
        send.type = "submit";
        compose.append(input, send);

        const status = el("div", "chogmsg-status");
        const IDLE_NOTE = "Messages you send are posted to Global Chat.";
        const note = el("span", null, IDLE_NOTE);
        note.setAttribute("role", "status");
        const counter = el("span", null, "0/" + MAX_MESSAGE);
        status.append(note, counter);

        function growInput() {
            input.style.height = "auto";
            input.style.height = Math.min(input.scrollHeight + 2, 96) + "px";
        }

        input.addEventListener("input", () => {
            counter.textContent = input.value.length + "/" + MAX_MESSAGE;
            growInput();
        });
        input.addEventListener("keydown", e => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                compose.requestSubmit();
            }
        });

        const seenIds = new Set();

        function avatarFor(name) {
            if (name === profile.name) return makeAvatar(profile, false);
            // The API stores no avatar, so other users get a stable default derived from their name.
            let hash = 0;
            for (const ch of name) hash = (hash + ch.codePointAt(0)) % AVATAR_IMAGES.length;
            return makeAvatar({ avatarIndex: hash, avatarUrl: null }, false);
        }

        function buildRow(name, text, when) {
            const row = el("div", "chogmsg-message");
            const main = el("div", "chogmsg-message-main");
            const meta = el("div", "chogmsg-message-meta");
            meta.append(el("span", "chogmsg-username", name), el("span", "chogmsg-time", formatTime(when)));
            main.append(meta, el("div", "chogmsg-text", text));
            row.append(avatarFor(name), main);
            return row;
        }

        function appendMessage(text, sentAt, id) {
            if (id) seenIds.add(id);
            history.append(buildRow(profile.name, text, sentAt));
            history.scrollTop = history.scrollHeight;
        }

        function showHistoryState(text, isError) {
            const state = el("div", "chogmsg-history-state", text);
            if (isError) {
                state.style.color = "#b00020";
                const retry = el("button", null, "Retry");
                retry.type = "button";
                retry.addEventListener("click", loadHistory);
                state.append(document.createElement("br"), retry);
            }
            history.prepend(state);
        }

        // Fetches existing messages. Rows sent while loading stay at the bottom; anything
        // the server already returned for them is skipped by id.
        async function loadHistory() {
            history.querySelectorAll(".chogmsg-history-state").forEach(n => n.remove());
            showHistoryState("Loading messages...", false);
            let messages = null;
            try {
                const res = await fetch("/api/messenger/messages", { headers: { "Accept": "application/json" } });
                const data = await res.json();
                if (res.ok && data && data.success === true && Array.isArray(data.messages)) messages = data.messages;
            } catch { /* handled below */ }
            if (!root.isConnected) return;

            history.querySelectorAll(".chogmsg-history-state").forEach(n => n.remove());
            if (!messages) {
                showHistoryState("Could not load earlier messages. Check your connection and try again.", true);
                return;
            }
            const fragment = document.createDocumentFragment();
            for (const m of messages) {
                if (!m || typeof m.display_name !== "string" || typeof m.body !== "string") continue;
                if (m.id && seenIds.has(m.id)) continue;
                if (m.id) seenIds.add(m.id);
                const when = new Date(m.created_at);
                fragment.append(buildRow(m.display_name, m.body, isNaN(when) ? new Date() : when));
            }
            history.prepend(fragment);
            if (!history.children.length) showHistoryState("No messages yet. Say hello to start the conversation!", false);
            history.scrollTop = history.scrollHeight;
        }

        function failureMessage(res, data) {
            if (res.status === 429) {
                const wait = parseInt(res.headers.get("Retry-After"), 10);
                return "You're sending messages too fast. Please wait" +
                    (wait > 0 ? " " + wait + " second" + (wait === 1 ? "" : "s") : " a moment") + " and try again.";
            }
            if (res.status === 400 && data && typeof data.error === "string") return data.error + ".";
            if (res.status >= 500) return "Chat is temporarily unavailable. Your message was not sent - please try again.";
            return "Your message could not be sent. Please try again.";
        }

        let sending = false;
        compose.addEventListener("submit", async e => {
            e.preventDefault();
            if (sending) return;
            const text = input.value.trim();
            if (!text || Array.from(text).length > MAX_MESSAGE) return;

            sending = true;
            send.disabled = true;
            input.readOnly = true;
            note.style.color = "";
            note.textContent = "Sending...";

            let ok = false;
            let sentAt = new Date();
            let sentId = null;
            let errorText = "";
            try {
                const res = await fetch("/api/messenger/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    body: JSON.stringify({ display_name: profile.name, body: text })
                });
                let data = null;
                try { data = await res.json(); } catch { /* non-JSON error body */ }
                if (res.ok && data && data.success === true) {
                    ok = true;
                    const created = data.message && new Date(data.message.created_at);
                    if (created && !isNaN(created)) sentAt = created;
                    if (data.message && typeof data.message.id === "string") sentId = data.message.id;
                } else {
                    errorText = failureMessage(res, data);
                }
            } catch {
                errorText = "Could not reach the server. Check your connection - your message was not sent.";
            }

            sending = false;
            send.disabled = false;
            input.readOnly = false;
            if (!root.isConnected) return;

            if (ok) {
                note.textContent = IDLE_NOTE;
                appendMessage(text, sentAt, sentId);
                input.value = "";
                counter.textContent = "0/" + MAX_MESSAGE;
                growInput();
            } else {
                note.textContent = errorText;
                note.style.color = "#b00020";
            }
            input.focus();
        });

        chat.append(history, compose, status);
        root.append(header, chat);
        input.focus();
        if (playIntro) playWelcomeIntro(root, chat, history);
        loadHistory();
    }

    const INTRO_SOUND = "assets/sounds/message-boot.MP3";
    const INTRO_FADE_LEAD = 2.5;  // seconds before the audio ends that the fade begins (fade completes ~2s before the end)
    const INTRO_FADE_MS = 500;
    const INTRO_FALLBACK_MS = 2200;

    // Retro welcome overlay above the chat history, timed to the real audio duration.
    // It never takes pointer events, so the input, scrolling and window controls stay usable.
    function playWelcomeIntro(root, chat, history) {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const overlay = el("div", "chogmsg-intro" + (reduceMotion ? " chogmsg-intro-static" : ""));
        overlay.setAttribute("aria-hidden", "true");
        overlay.style.top = history.offsetTop + "px";
        overlay.style.left = history.offsetLeft + "px";
        overlay.style.width = history.offsetWidth + "px";
        overlay.style.height = history.offsetHeight + "px";
        const img = document.createElement("img");
        img.src = "assets/images/say-hello.png";
        img.alt = "";
        overlay.append(img, el("div", "chogmsg-intro-title", "Welcome to CHOG Global Chat!"));
        chat.append(overlay);

        let audio = null;
        let fading = false;
        let finished = false;
        const timers = [];

        function finish() {
            if (finished) return;
            finished = true;
            timers.forEach(clearTimeout);
            overlay.remove();
        }

        // Stops the sound; only used when the window is closed, never when the overlay fades.
        function stopAudio() {
            if (!audio) return;
            audio.pause();
            audio.removeAttribute("src");
            audio = null;
        }

        function fade() {
            if (fading || finished) return;
            fading = true;
            overlay.classList.add("chogmsg-intro-out");
            timers.push(setTimeout(finish, reduceMotion ? 0 : INTRO_FADE_MS));
        }

        // Used when sound is unavailable (blocked, missing or unreadable).
        function silentFallback() {
            if (fading || finished) return;
            timers.push(setTimeout(fade, INTRO_FALLBACK_MS));
        }

        // Safety net so the overlay can never outlive a stalled audio file or a closed window.
        timers.push(setTimeout(() => { fade(); }, 15000));
        const watch = setInterval(() => {
            if (!root.isConnected) {
                finish();
                stopAudio();
            }
            if (!audio || audio.ended || audio.error) clearInterval(watch);
        }, 500);

        try {
            audio = new Audio(INTRO_SOUND);
            audio.preload = "auto";
            audio.addEventListener("timeupdate", () => {
                if (!audio) return;
                const d = audio.duration;
                if (isFinite(d) && d > 0 && audio.currentTime >= d - INTRO_FADE_LEAD) fade();
            });
            audio.addEventListener("ended", fade);
            audio.addEventListener("error", silentFallback);
            const played = audio.play();
            if (played && played.catch) played.catch(silentFallback);
        } catch {
            silentFallback();
        }
    }

    /* ===== message-peek.gif playback (frame-accurate so it can pause) ===== */
    const PEEK_GIF = "assets/images/message-peek.gif";
    const PEEK_PAUSE_FRAME = 12; // fully peeked out; frames 13+ lead into the retreat
    const PEEK_WALL_X = 262;     // x in the GIF where the brick wall begins (hidden behind the window)
    const PEEK_SIZE = 210;
    let peekGifPromise = null;

    function lzwDecode(bytes, minCode, pixelCount) {
        const out = new Uint8Array(pixelCount);
        const clear = 1 << minCode;
        const eoi = clear + 1;
        const prefix = new Uint16Array(4096);
        const suffix = new Uint8Array(4096);
        const stack = new Uint8Array(4097);
        for (let i = 0; i < clear; i++) suffix[i] = i;
        let size = minCode + 1, next = eoi + 1, prev = -1, first = 0;
        let bitBuf = 0, bitCnt = 0, pos = 0, op = 0;
        while (op < pixelCount) {
            while (bitCnt < size && pos < bytes.length) {
                bitBuf |= bytes[pos++] << bitCnt;
                bitCnt += 8;
            }
            if (bitCnt < size) break;
            const code = bitBuf & ((1 << size) - 1);
            bitBuf >>= size;
            bitCnt -= size;
            if (code === clear) { size = minCode + 1; next = eoi + 1; prev = -1; continue; }
            if (code === eoi) break;
            if (prev === -1) { out[op++] = suffix[code]; prev = code; first = code; continue; }
            let cur = code, sp = 0;
            if (code >= next) { stack[sp++] = first; cur = prev; }
            while (cur >= clear) { stack[sp++] = suffix[cur]; cur = prefix[cur]; }
            first = suffix[cur];
            stack[sp++] = first;
            if (next < 4096) {
                prefix[next] = prev;
                suffix[next] = first;
                next++;
                if (next === (1 << size) && size < 12) size++;
            }
            while (sp > 0 && op < pixelCount) out[op++] = stack[--sp];
            prev = code;
        }
        return out;
    }

    function decodeGif(buffer) {
        const data = new Uint8Array(buffer);
        let p = 6;
        const u16 = () => { const v = data[p] | (data[p + 1] << 8); p += 2; return v; };
        if (!/^GIF8[79]a$/.test(String.fromCharCode(...data.subarray(0, 6)))) throw new Error("Not a GIF");
        const width = u16(), height = u16();
        const flags = data[p]; p += 3;
        let globalPalette = null;
        if (flags & 0x80) {
            const n = 3 << ((flags & 7) + 1);
            globalPalette = data.subarray(p, p + n);
            p += n;
        }
        const frames = [];
        let gce = null;
        while (p < data.length) {
            const block = data[p++];
            if (block === 0x3b) break;
            if (block === 0x21) {
                const label = data[p++];
                if (label === 0xf9) {
                    const packed = data[p + 1];
                    gce = {
                        disposal: (packed >> 2) & 7,
                        delay: (data[p + 2] | (data[p + 3] << 8)) * 10,
                        transparent: (packed & 1) ? data[p + 4] : -1
                    };
                }
                while (data[p] !== 0) p += data[p] + 1;
                p++;
            } else if (block === 0x2c) {
                const x = u16(), y = u16(), w = u16(), h = u16();
                const fFlags = data[p++];
                let palette = globalPalette;
                if (fFlags & 0x80) {
                    const n = 3 << ((fFlags & 7) + 1);
                    palette = data.subarray(p, p + n);
                    p += n;
                }
                const minCode = data[p++];
                const chunks = [];
                let total = 0;
                while (data[p] !== 0) {
                    const len = data[p++];
                    chunks.push(data.subarray(p, p + len));
                    p += len;
                    total += len;
                }
                p++;
                const packedBytes = new Uint8Array(total);
                let o = 0;
                for (const chunk of chunks) { packedBytes.set(chunk, o); o += chunk.length; }
                const indices = lzwDecode(packedBytes, minCode, w * h);

                let rows = null;
                if (fFlags & 0x40) {
                    rows = [];
                    for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) {
                        for (let r = start; r < h; r += step) rows.push(r);
                    }
                }
                const pixels = new Uint8ClampedArray(w * h * 4);
                const transparent = gce ? gce.transparent : -1;
                for (let i = 0; i < w * h; i++) {
                    const row = rows ? rows[Math.floor(i / w)] : Math.floor(i / w);
                    const dest = (row * w + (i % w)) * 4;
                    const index = indices[i];
                    if (index === transparent || !palette) continue;
                    pixels[dest] = palette[index * 3];
                    pixels[dest + 1] = palette[index * 3 + 1];
                    pixels[dest + 2] = palette[index * 3 + 2];
                    pixels[dest + 3] = 255;
                }
                frames.push({
                    x, y, w, h, pixels,
                    delay: gce ? gce.delay : 100,
                    disposal: gce ? gce.disposal : 0
                });
                gce = null;
            } else {
                throw new Error("Unsupported GIF block");
            }
        }
        if (!frames.length) throw new Error("GIF has no frames");
        return { width, height, frames };
    }

    function loadPeekGif() {
        if (!peekGifPromise) {
            peekGifPromise = fetch(PEEK_GIF)
                .then(res => {
                    if (!res.ok) throw new Error("GIF request failed");
                    return res.arrayBuffer();
                })
                .then(decodeGif);
            peekGifPromise.catch(() => { peekGifPromise = null; });
        }
        return peekGifPromise;
    }

    // Draws message-peek.gif behind the Messenger window and plays it to the peeked-out frame.
    // Resolves to a controller, or null when the GIF can't be shown (no room, load failure).
    async function createPeek(win, anchor) {
        let gif;
        try {
            gif = await loadPeekGif();
        } catch {
            return null;
        }
        if (!anchor.isConnected || !win.isConnected) return null;

        const { width: W, height: H, frames } = gif;
        const size = Math.min(PEEK_SIZE, Math.max(160, window.innerHeight - 80));
        const visible = Math.round(PEEK_WALL_X * size / W);
        const rect = win.getBoundingClientRect();
        let side;
        if (rect.left >= visible + 4) side = "left";
        else if (window.innerWidth - rect.right >= visible + 4) side = "right";
        else return null;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const pauseFrame = Math.min(PEEK_PAUSE_FRAME, frames.length - 1);
        const canvas = el("canvas", "chogmsg-peek" + (side === "right" ? " chogmsg-peek-right" : ""));
        canvas.width = W;
        canvas.height = H;
        canvas.style.width = canvas.style.height = size + "px";
        canvas.setAttribute("aria-hidden", "true");
        const ctx = canvas.getContext("2d");
        const patch = document.createElement("canvas");
        const patchCtx = patch.getContext("2d");
        const anchorOffset = anchor.getBoundingClientRect().top + anchor.offsetHeight / 2 - rect.top;

        let prevFrame = null, saved = null, timer = null;
        let destroyed = false, paused = false, retreating = false, raf = 0;

        function drawFrame(i) {
            if (prevFrame) {
                if (prevFrame.disposal === 2) ctx.clearRect(prevFrame.x, prevFrame.y, prevFrame.w, prevFrame.h);
                else if (prevFrame.disposal === 3 && saved) ctx.putImageData(saved, 0, 0);
            }
            const f = frames[i];
            saved = f.disposal === 3 ? ctx.getImageData(0, 0, W, H) : null;
            patch.width = f.w;
            patch.height = f.h;
            patchCtx.putImageData(new ImageData(f.pixels, f.w, f.h), 0, 0);
            ctx.drawImage(patch, f.x, f.y);
            prevFrame = f;
        }

        function run(from, to) {
            return new Promise(resolve => {
                let i = from;
                (function step() {
                    if (destroyed) return resolve();
                    drawFrame(i);
                    if (i >= to) return resolve();
                    const delay = Math.max(20, frames[i].delay);
                    i++;
                    timer = setTimeout(step, delay);
                })();
            });
        }

        function place() {
            const r = win.getBoundingClientRect();
            const left = side === "left" ? r.left - visible : r.right - (size - visible);
            const top = Math.max(4, Math.min(window.innerHeight - size - 44,
                r.top + anchorOffset - size * -0.2548));
            canvas.style.left = left + "px";
            canvas.style.top = top + "px";
            canvas.style.zIndex = String((parseInt(win.style.zIndex, 10) || 100) - 1);
            canvas.style.visibility = win.style.display === "none" ? "hidden" : "visible";
        }

        function destroy() {
            destroyed = true;
            clearTimeout(timer);
            cancelAnimationFrame(raf);
            canvas.remove();
        }

        function retreat() {
            if (destroyed || retreating) return Promise.resolve();
            retreating = true;
            if (reduceMotion) { destroy(); return Promise.resolve(); }
            return run(pauseFrame + 1, frames.length - 1).then(() => new Promise(resolve => {
                if (destroyed) return resolve();
                timer = setTimeout(() => { destroy(); resolve(); }, Math.max(20, frames[frames.length - 1].delay));
            }));
        }

        // Follow the window while it is dragged, and clean up if it closes or setup is left.
        function sync() {
            if (destroyed) return;
            if (!win.isConnected) return destroy();
            if (paused && !retreating && !anchor.isConnected) retreat();
            place();
            raf = requestAnimationFrame(sync);
        }

        document.body.append(canvas);
        place();
        sync();

        if (reduceMotion) {
            for (let i = 0; i <= pauseFrame; i++) drawFrame(i);
        } else {
            await run(0, pauseFrame);
        }
        if (destroyed) return null;
        paused = true;
        return { retreat, destroy, side };
    }

    // Peek, pause on the fully peeked frame, show the warning, then retreat once it is dismissed.
    async function showUsernameWarning(root, anchor) {
        const win = root.closest(".window");
        const peek = win ? await createPeek(win, anchor) : null;
        if (!anchor.isConnected) {
            if (peek) peek.retreat();
            return;
        }
        showBubble(root, anchor, peek);
    }

    // Speech bubble inside the window, on the edge CHOG peeks from, with its tail pointing at him.
    function showBubble(root, anchor, peek) {
        if (root.querySelector(".chogmsg-bubble")) return;
        const side = peek ? peek.side : "left";
        const bubble = el("div", "chogmsg-bubble chogmsg-bubble-" + side + (peek ? "" : " chogmsg-bubble-notail"));
        bubble.setAttribute("role", "alertdialog");
        bubble.setAttribute("aria-label", "Choose your CHOG name");

        const text = el("div", "chogmsg-bubble-text");
        text.append(
            el("div", "chogmsg-bubble-title", "Psst... Hey, CHOG! 👀"),
            el("div", null, "Choose your CHOG name wisely! This is how everyone will know you in Global Chat. You can always change it later!")
        );
        const ok = el("button", "chogmsg-bubble-ok", "OK");
        ok.type = "button";
        bubble.append(text, ok);

        ok.addEventListener("click", () => {
            bubble.classList.add("chogmsg-bubble-out");
            setTimeout(() => bubble.remove(), 180);
            if (peek) peek.retreat();
        }, { once: true });

        root.append(bubble);
        const rootRect = root.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        // Prefer sitting above the input (over the header/title area); fall back to below it if there is no room.
        const above = anchorRect.top - rootRect.top - bubble.offsetHeight - 6;
        bubble.style.top = (above >= 4 ? above : anchorRect.bottom - rootRect.top + 6) + "px";
    }

    window.openChogMessenger = function () {
        const alreadyOpen = !!openWindows[TITLE];
        const win = openWindow(TITLE, '<div class="chogmsg-root"></div>', ICON);
        if (alreadyOpen || !win) return;

        const root = win.querySelector(".chogmsg-root");
        if (loadProfile()) renderChat(root, true);
        else renderSetup(root);
    };
})();
