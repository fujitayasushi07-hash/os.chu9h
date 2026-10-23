(() => {
    "use strict";

    const TITLE = "CHOGWARE PFP Maker";
    const WINDOW_ICON = "assets/images/icon-pfp-maker.png";
    const ASSET_ROOT = "assets/PFP-Maker-Assets/";
    const OUTPUT_SIZE = 1000;
    const DEFAULT_BACKGROUND = "#ffffff";
    const categories = [
        { id: "headwear", label: "Headwear", folder: "Headware", prefix: "headwears", count: 36 },
        { id: "clothes", label: "Clothes", folder: "Clothes", prefix: "clothes", count: 33 },
        { id: "costume", label: "Costume", folder: "Costume", prefix: "costume", count: 11 },
        { id: "eyes", label: "Eyes", folder: "Eyes", prefix: "eyes", count: 20 },
        { id: "mouth", label: "Mouth", folder: "Mouth", prefix: "mouth", count: 17 },
        { id: "accessories", label: "Accessories", folder: "Accessories", prefix: "accessories", count: 17 },
        { id: "face", label: "Face", folder: "Face", prefix: "face-accessories", count: 18 }
    ];
    const imageCache = new Map();
    const selections = Object.fromEntries(categories.map(category => [category.id, 0]));
    let activeCategory = categories[0].id;
    let backgroundColor = DEFAULT_BACKGROUND;
    let canvas;
    let context;
    let status;
    let renderRevision = 0;
    let renderPromise = Promise.resolve();

    const COSTUME_CONFLICTS = ["headwear", "clothes", "accessories"];

    function clearCostumeConflicts() {
        if (selections.costume > 0) COSTUME_CONFLICTS.forEach(id => { selections[id] = 0; });
    }

    function assetUrl(path) {
        return ASSET_ROOT + path.split("/").map(encodeURIComponent).join("/");
    }

    function imagePath(category, index) {
        return `${category.folder}/${category.prefix}-${index}.webp`;
    }

    function loadImage(path) {
        if (imageCache.has(path)) return imageCache.get(path);

        const promise = new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Unable to load asset: ${path}`));
            image.src = assetUrl(path);
        });
        imageCache.set(path, promise);
        return promise;
    }

    function setStatus(message) {
        if (status) status.textContent = message;
    }

    function createMarkup() {
        const categoryButtons = categories.map(category =>
            `<button type="button" class="chog-pfp-category" data-category="${category.id}" aria-pressed="${category.id === activeCategory}">${category.label}</button>`
        ).join("");

        return `
            <div class="chog-pfp">
                <div class="chog-pfp-toolbar" role="toolbar" aria-label="PFP Maker controls">
                    <button type="button" data-action="randomize">
                        <img src="${assetUrl("Icons/union.svg")}" alt=""> Randomize
                    </button>
                    <button type="button" data-action="reset">
                        <img src="${assetUrl("Icons/reset.svg")}" alt=""> Reset
                    </button>
                    <button type="button" data-action="copy">
                        <img src="${assetUrl("Icons/copy.svg")}" alt=""> Copy Image
                    </button>
                    <button type="button" data-action="download">
                        <img src="${assetUrl("Icons/download.svg")}" alt=""> Download PNG
                    </button>
                    <button type="button" data-action="share">Share on X</button>
                    <label class="chog-pfp-background-control">
                        <img src="${assetUrl("Icons/fill.svg")}" alt="">
                        <span>Background</span>
                        <input type="color" data-background-picker value="${backgroundColor}" aria-label="Background colour">
                        <input class="chog-pfp-hex" type="text" data-background-hex value="${backgroundColor}" maxlength="7" spellcheck="false" aria-label="Background HEX colour">
                    </label>
                </div>
                <div class="chog-pfp-main">
                    <section class="chog-pfp-preview-panel" aria-label="PFP preview">
                        <div class="chog-pfp-panel-heading">
                            <span>Preview</span>
                            <span class="chog-pfp-output-size">1000 × 1000 px</span>
                        </div>
                        <div class="chog-pfp-preview-stage">
                            <canvas class="chog-pfp-canvas" width="${OUTPUT_SIZE}" height="${OUTPUT_SIZE}" aria-label="Composed PFP preview"></canvas>
                        </div>
                        <div class="chog-pfp-status" role="status" aria-live="polite">Loading base layers…</div>
                    </section>
                    <section class="chog-pfp-library-panel" aria-label="Trait library">
                        <div class="chog-pfp-panel-heading">
                            <span>Trait library</span>
                            <span class="chog-pfp-output-size" data-trait-count></span>
                        </div>
                        <div class="chog-pfp-categories" role="group" aria-label="Trait categories">${categoryButtons}</div>
                        <div class="chog-pfp-traits" data-traits></div>
                    </section>
                </div>
            </div>
        `;
    }

    function renderTraits(root) {
        const category = categories.find(item => item.id === activeCategory);
        const list = root.querySelector("[data-traits]");
        const count = root.querySelector("[data-trait-count]");
        count.textContent = `${category.count} traits`;
        root.querySelectorAll(".chog-pfp-category").forEach(button => {
            button.setAttribute("aria-pressed", String(button.dataset.category === activeCategory));
        });
        list.replaceChildren();

        const noneButton = document.createElement("button");
        noneButton.type = "button";
        noneButton.className = "chog-pfp-trait";
        noneButton.dataset.traitIndex = "0";
        noneButton.setAttribute("aria-pressed", String(selections[category.id] === 0));
        noneButton.setAttribute("aria-label", `${category.label}: no trait`);
        noneButton.innerHTML = '<span class="chog-pfp-none-preview">None</span>';
        list.append(noneButton);

        for (let index = 1; index <= category.count; index += 1) {
            const path = imagePath(category, index);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "chog-pfp-trait";
            button.dataset.traitIndex = String(index);
            button.setAttribute("aria-pressed", String(selections[category.id] === index));
            button.setAttribute("aria-label", `${category.label} ${index}`);

            const image = document.createElement("img");
            image.src = assetUrl(path);
            image.alt = "";
            image.loading = "lazy";
            image.addEventListener("error", () => setStatus(`Unable to load trait image: ${path}`), { once: true });

            button.append(image);
            list.append(button);
        }
    }

    function renderCanvas() {
        const revision = ++renderRevision;
        const selectedTraits = categories
            .map(category => ({ category, index: selections[category.id] }))
            .filter(item => item.index > 0);
        const paths = [
            "Base/body.webp",
            "Base/face.webp",
            ...selectedTraits.map(item => imagePath(item.category, item.index))
        ];

        renderPromise = Promise.all(paths.map(loadImage)).then(images => {
            if (revision !== renderRevision) return;
            context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

            const [body, face, ...traits] = images;
            context.drawImage(body, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

            const clothes = selectedTraits.findIndex(item => item.category.id === "clothes");
            const costume = selectedTraits.findIndex(item => item.category.id === "costume");
            const BEHIND_COSTUME = ["eyes", "mouth", "face"];
            if (costume !== -1) {
                // Costume sits above the face, eyes, mouth and face accessories.
                context.drawImage(face, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
                BEHIND_COSTUME.forEach(id => {
                    const behind = selectedTraits.findIndex(item => item.category.id === id);
                    if (behind !== -1) context.drawImage(traits[behind], 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
                });
                context.drawImage(traits[costume], 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
            } else {
                if (clothes !== -1) context.drawImage(traits[clothes], 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
                context.drawImage(face, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
            }
            selectedTraits.forEach((item, index) => {
                const behindCostume = costume !== -1 && BEHIND_COSTUME.includes(item.category.id);
                if (item.category.id !== "clothes" && item.category.id !== "costume" && !behindCostume) {
                    context.drawImage(traits[index], 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
                }
            });
            setStatus("Ready. Traits are normalized to a shared 1000 × 1000 canvas.");
        }).catch(error => {
            setStatus(error.message);
            throw error;
        });
        renderPromise.catch(() => {});
        return renderPromise;
    }

    function canvasToBlob() {
        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("The browser could not encode the PFP as a PNG."));
                }
            }, "image/png");
        });
    }

    async function downloadPng() {
        await renderPromise;
        const blob = await canvasToBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "chogware-pfp.png";
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus("PNG download started.");
    }

    async function copyImage() {
        await renderPromise;
        if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
            throw new Error("Copying images is not supported in this browser or context.");
        }
        const blob = await canvasToBlob();
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setStatus("PNG copied to the clipboard.");
    }

    function reportActionError(error) {
        setStatus(error instanceof Error ? error.message : "The requested action failed.");
    }

    function initWindow() {
        const win = window.openWindow(TITLE, createMarkup(), WINDOW_ICON, "CHOGMii");
        if (!win) return;
        win.classList.add("chog-pfp-window");
        if (win.dataset.pfpMakerInitialized === "true") return;

        win.style.resize = "none";
        win.dataset.pfpMakerInitialized = "true";
        if (window.innerWidth > 768) {
            const width = Math.min(774, Math.max(280, window.innerWidth - 24));
            const height = Math.min(496, Math.max(300, window.innerHeight - 64));
            win.style.width = `${width}px`;
            win.style.height = `${height}px`;
            win.style.left = `${Math.max(8, Math.round((window.innerWidth - width) / 2))}px`;
            const taskbarHeight = document.getElementById("taskbar")?.offsetHeight || 40;
            win.style.top = `${Math.max(8, Math.round((window.innerHeight - taskbarHeight - height) / 2))}px`;
        }

        const root = win.querySelector(".chog-pfp");
        canvas = root.querySelector(".chog-pfp-canvas");
        context = canvas.getContext("2d");
        status = root.querySelector(".chog-pfp-status");
        if (!context) {
            setStatus("Canvas rendering is unavailable in this browser.");
            return;
        }

        renderTraits(root);
        const traitList = root.querySelector("[data-traits]");
        const sizeTraitCells = () => {
            // Four equal columns; rows follow the measured column width so cards stay square.
            const style = getComputedStyle(traitList);
            const inner = traitList.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
            const gap = parseFloat(style.columnGap) || 0;
            if (inner > 0) traitList.style.setProperty("--chog-pfp-cell", `${(inner - gap * 3) / 4}px`);
        };
        sizeTraitCells();
        if (window.ResizeObserver) new ResizeObserver(sizeTraitCells).observe(traitList);
        root.querySelector(".chog-pfp-categories").addEventListener("click", event => {
            const button = event.target.closest("[data-category]");
            if (!button) return;
            activeCategory = button.dataset.category;
            renderTraits(root);
        });

        root.querySelector("[data-traits]").addEventListener("click", event => {
            const button = event.target.closest("[data-trait-index]");
            if (!button) return;
            const index = Number(button.dataset.traitIndex);
            selections[activeCategory] = index;
            if (index > 0) {
                if (activeCategory === "costume") {
                    clearCostumeConflicts();
                } else if (COSTUME_CONFLICTS.includes(activeCategory)) {
                    // Picking a conflicting trait replaces the costume.
                    selections.costume = 0;
                }
            }
            renderTraits(root);
            renderCanvas();
        });

        root.querySelector("[data-background-picker]").addEventListener("input", event => {
            backgroundColor = event.target.value.toLowerCase();
            root.querySelector("[data-background-hex]").value = backgroundColor;
            root.querySelector("[data-background-hex]").removeAttribute("aria-invalid");
            renderCanvas();
        });

        root.querySelector("[data-background-hex]").addEventListener("change", event => {
            const input = event.target;
            const value = input.value.trim();
            if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
                input.setAttribute("aria-invalid", "true");
                setStatus("Enter a valid six-digit HEX colour, such as #AABBCC.");
                return;
            }
            backgroundColor = value.toLowerCase();
            input.value = backgroundColor;
            input.removeAttribute("aria-invalid");
            root.querySelector("[data-background-picker]").value = backgroundColor;
            renderCanvas();
        });

        root.querySelector(".chog-pfp-toolbar").addEventListener("click", async event => {
            const button = event.target.closest("[data-action]");
            if (!button) return;

            if (button.dataset.action === "reset") {
                categories.forEach(category => { selections[category.id] = 0; });
                backgroundColor = DEFAULT_BACKGROUND;
                root.querySelector("[data-background-picker]").value = backgroundColor;
                root.querySelector("[data-background-hex]").value = backgroundColor;
                root.querySelector("[data-background-hex]").removeAttribute("aria-invalid");
                renderTraits(root);
                renderCanvas();
                return;
            }

            if (button.dataset.action === "randomize") {
                categories.forEach(category => {
                    selections[category.id] = Math.floor(Math.random() * (category.count + 1));
                });
                clearCostumeConflicts();
                renderTraits(root);
                renderCanvas();
                return;
            }

            try {
                if (button.dataset.action === "copy") {
                    await copyImage();
                } else if (button.dataset.action === "download") {
                    await downloadPng();
                } else if (button.dataset.action === "share") {
                    const url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent("I made a CHOGWARE PFP!");
                    window.open(url, "_blank", "noopener,noreferrer");
                    setStatus("X share link requested. Download the PNG separately to attach it to your post.");
                }
            } catch (error) {
                reportActionError(error);
            }
        });

        renderCanvas();
    }

    window.openChogPfpMaker = initWindow;
})();
