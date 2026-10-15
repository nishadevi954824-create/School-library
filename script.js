"use strict";

/* =========================================================
   SCHOOL BOOKS LIBRARY - MAIN SCRIPT
   Works with the current index.html structure and also
   supports the earlier custom-ID structure.
========================================================= */

const STORAGE_KEY = "schoolPdfLibraryData";
const THEME_KEY = "schoolPdfLibraryTheme";

/* PIN values are stored as encoded tokens, not displayed
   as readable PIN text in the interface. */
const ADD_PIN_TOKEN = "ODI3Mw==";
const DELETE_PIN_TOKEN = "OTU0OA==";

const DEFAULT_DATA = {
    "UP Board": {
        "9": [],
        "10": [],
        "11": [],
        "12": []
    },
    "CBSE Board": {
        "9": [],
        "10": [],
        "11": [],
        "12": []
    }
};

const $ = (id) => document.getElementById(id);

/* =========================================================
   CURRENT INDEX.HTML IDs
========================================================= */

const menuButton = $("menuButton");
const sideMenu = $("sideMenu");
const menuOverlay = $("menuOverlay");
const themeToggle = $("themeToggle");

const boardSelect = $("boardSelect");
const classSelect = $("classSelect");
const subjectSelect = $("subjectSelect");
const bookSelect = $("bookSelect");

const openPdfButton = $("openPdfButton");
const addSubjectButton = $("addSubjectButton");

/* =========================================================
   LEGACY IDs - KEPT FOR COMPATIBILITY
========================================================= */

const legacyMenuButton = $("menuBtn");
const legacyCloseMenu = $("closeMenu");
const legacyThemeButton = $("themeBtn");
const legacyDownloadedPDFs = $("downloadedPDFs");
const legacyAddSubjectButton = $("addSubjectBtn");
const legacyOpenPdfButton = $("openPDFBtn");

let libraryData = loadData();
let activeModal = null;

/* =========================================================
   DATA FUNCTIONS
========================================================= */

const API_URL = "https://school-library-3yz6.onrender.com/api/library";

async function loadData() {
    try {
        let response = await fetch(API_URL);
        let items = await response.json();
        
        let result = cloneDefaultData();
        items.forEach(item => {
            if (result[item.board] && result[item.board][item.className]) {
                result[item.board][item.className].push({
                    subject: item.subject,
                    book: item.book
                });
            }
        });
        return result;
    } catch (err) {
        return cloneDefaultData();
    }
}

async function saveData() {
    try {
        let board = getCurrentBoard();
        let className = getCurrentClass();
        let items = libraryData[board][className];
        
        if(items.length > 0) {
            let latestItem = items[items.length - 1];
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    board: board,
                    className: className,
                    subject: latestItem.subject,
                    book: latestItem.book
                })
            });
        }
        return true;
    } catch (error) {
        showMessage("सर्वर पर डेटा सेव नहीं हो पाया।", "error");
        return false;
    }
}


/* =========================================================
   SELECT BOXES
========================================================= */

function classLabel(value) {

    const labels = {
        "9": "9th",
        "10": "10th",
        "11": "11th",
        "12": "12th"
    };

    return labels[value] || value;
}

function setSelectLabel(select, placeholder) {

    if (!select) {
        return;
    }

    const card = select.closest(".select-card");
    const label = card?.querySelector("label");

    if (!label) {
        return;
    }

    if (!select.value) {

        label.textContent = placeholder;
        return;
    }

    if (select === classSelect) {

        label.textContent =
            classLabel(select.value).toUpperCase();

        return;
    }

    const option =
        select.options[select.selectedIndex];

    label.textContent =
        (option?.textContent || select.value)
            .trim()
            .toUpperCase();
}

function setDefaultOption(select, text) {

    if (!select) {
        return;
    }

    select.innerHTML = "";

    const option =
        document.createElement("option");

    option.value = "";
    option.textContent = text;
    option.disabled = true;
    option.selected = true;

    select.appendChild(option);
}

function populateSubjects(preserveSubject = "") {

    if (!subjectSelect) {
        return;
    }

    const oldValue =
        preserveSubject || subjectSelect.value;

    const subjects = getSubjects();

    setDefaultOption(
        subjectSelect,
        "Select Subject"
    );

    subjects.forEach((subject) => {

        const option =
            document.createElement("option");

        option.value = subject;
        option.textContent = subject;

        subjectSelect.appendChild(option);
    });

    if (subjects.includes(oldValue)) {

        subjectSelect.value = oldValue;

    } else {

        subjectSelect.value = "";
    }

    setSelectLabel(
        subjectSelect,
        "SELECT SUBJECT"
    );

    populateBooks(subjectSelect.value);
}

function populateBooks(subject, preserveBook = "") {

    if (!bookSelect) {
        return;
    }

    const oldValue =
        preserveBook || bookSelect.value;

    const books =
        subject
            ? getBooksForSubject(subject)
            : [];

    setDefaultOption(
        bookSelect,
        "Select Book"
    );

    books.forEach((book) => {

        const option =
            document.createElement("option");

        option.value = book;
        option.textContent = book;

        bookSelect.appendChild(option);
    });

    if (books.includes(oldValue)) {

        bookSelect.value = oldValue;

    } else {

        bookSelect.value = "";
    }

    setSelectLabel(
        bookSelect,
        "SELECT BOOK"
    );
}

function clearSubjectAndBook() {

    if (subjectSelect) {

        setDefaultOption(
            subjectSelect,
            "Select Subject"
        );

        setSelectLabel(
            subjectSelect,
            "SELECT SUBJECT"
        );
    }

    if (bookSelect) {

        setDefaultOption(
            bookSelect,
            "Select Book"
        );

        setSelectLabel(
            bookSelect,
            "SELECT BOOK"
        );
    }
}

function initializeClassLabels() {

    if (!classSelect) {
        return;
    }

    Array.from(classSelect.options).forEach(
        (option) => {

            if (
                ["9", "10", "11", "12"]
                    .includes(option.value)
            ) {

                option.textContent =
                    classLabel(option.value);
            }
        }
    );
}

function initializeSelections() {

    initializeClassLabels();

    if (boardSelect) {

        setSelectLabel(
            boardSelect,
            "SELECT BOARD"
        );
    }

    if (classSelect) {

        setSelectLabel(
            classSelect,
            "SELECT CLASS"
        );
    }

    populateSubjects();

    createDeleteControls();
}

/* =========================================================
   SELECT EVENTS
========================================================= */

boardSelect?.addEventListener(
    "change",
    () => {

        setSelectLabel(
            boardSelect,
            "SELECT BOARD"
        );

        if (classSelect) {

            classSelect.value = "";

            setSelectLabel(
                classSelect,
                "SELECT CLASS"
            );
        }

        clearSubjectAndBook();
    }
);

classSelect?.addEventListener(
    "change",
    () => {

        setSelectLabel(
            classSelect,
            "SELECT CLASS"
        );

        populateSubjects();
    }
);

subjectSelect?.addEventListener(
    "change",
    () => {

        setSelectLabel(
            subjectSelect,
            "SELECT SUBJECT"
        );

        populateBooks(
            subjectSelect.value
        );
    }
);

bookSelect?.addEventListener(
    "change",
    () => {

        setSelectLabel(
            bookSelect,
            "SELECT BOOK"
        );
    }
);

/* =========================================================
   MENU
========================================================= */

function openMenu() {

    if (!sideMenu) {
        return;
    }

    sideMenu.classList.add("open");

    menuOverlay?.classList.add(
        "open",
        "active"
    );

    menuOverlay?.setAttribute(
        "aria-hidden",
        "false"
    );

    menuButton?.classList.add("open");

    menuButton?.setAttribute(
        "aria-expanded",
        "true"
    );

    document.body.style.overflow = "hidden";
}

function closeMenu() {

    if (!sideMenu) {
        return;
    }

    sideMenu.classList.remove("open");

    menuOverlay?.classList.remove(
        "open",
        "active"
    );

    menuOverlay?.setAttribute(
        "aria-hidden",
        "true"
    );

    menuButton?.classList.remove("open");

    menuButton?.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.style.overflow = "";
}

function toggleMenu() {

    if (
        sideMenu?.classList.contains("open")
    ) {

        closeMenu();

    } else {

        openMenu();
    }
}

menuButton?.addEventListener(
    "click",
    toggleMenu
);

legacyMenuButton?.addEventListener(
    "click",
    toggleMenu
);

menuOverlay?.addEventListener(
    "click",
    closeMenu
);

legacyCloseMenu?.addEventListener(
    "click",
    closeMenu
);

document
    .querySelectorAll(".side-menu a")
    .forEach((link) => {

        link.addEventListener(
            "click",
            closeMenu
        );
    });

/* =========================================================
   DOWNLOADED PDFs - PLACEHOLDER
   Keep the menu button visible, but do not let it open
   PDF.html until the real Downloaded PDFs feature is added.
========================================================= */

function disableDownloadedPDFsNavigation() {

    const links = [];

    if (legacyDownloadedPDFs) {

        links.push(
            legacyDownloadedPDFs
        );
    }

    document
        .querySelectorAll(
            '.side-menu a[href="PDF.html"],' +
            '.side-menu a[href="pdf.html"],' +
            '.side-menu a[data-page="downloaded-pdfs"]'
        )
        .forEach((link) => {

            if (!links.includes(link)) {

                links.push(link);
            }
        });

    links.forEach((link) => {

        link.addEventListener(
            "click",
            (event) => {

                event.preventDefault();
                event.stopPropagation();

                closeMenu();

                showMessage(
                    "Downloaded PDFs will be available soon.",
                    "info"
                );
            }
        );
    });
}

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {

            closeMenu();
            removeExistingModal();
        }
    }
);

/* =========================================================
   DARK MODE
========================================================= */

function applyTheme(theme) {

    const dark = theme === "dark";

    document.body.classList.toggle(
        "dark-mode",
        dark
    );

    const toggle =
        themeToggle ||
        legacyThemeButton;

    toggle?.classList.toggle(
        "active",
        dark
    );

    toggle?.setAttribute(
        "aria-pressed",
        String(dark)
    );
}

function loadTheme() {

    let theme = "light";

    try {

        const saved =
            localStorage.getItem(
                THEME_KEY
            );

        if (
            saved === "dark" ||
            saved === "light"
        ) {

            theme = saved;
        }

    } catch (_) {}

    applyTheme(theme);
}

function toggleTheme() {

    const next =
        document.body.classList.contains(
            "dark-mode"
        )
            ? "light"
            : "dark";

    try {

        localStorage.setItem(
            THEME_KEY,
            next
        );

    } catch (_) {}

    applyTheme(next);
}

themeToggle?.addEventListener(
    "click",
    toggleTheme
);

legacyThemeButton?.addEventListener(
    "click",
    toggleTheme
);

/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showMessage(
    message,
    type = "info"
) {

    document
        .querySelector(".sbl-message")
        ?.remove();

    const box =
        document.createElement("div");

    box.className =
        `sbl-message ${type}`;

    box.innerHTML = `
        <span class="sbl-message-icon">
            ${
                type === "success"
                    ? "✓"
                    : type === "error"
                        ? "!"
                        : "i"
            }
        </span>

        <span class="sbl-message-text">
            ${escapeHtml(message)}
        </span>

        <button
            type="button"
            class="sbl-message-close"
            aria-label="Close"
        >×</button>
    `;

    injectDynamicStyles();

    document.body.appendChild(box);

    box
        .querySelector(
            ".sbl-message-close"
        )
        ?.addEventListener(
            "click",
            () => box.remove()
        );

    setTimeout(() => {

        if (box.isConnected) {

            box.remove();
        }

    }, 5000);
}

/* =========================================================
   PIN SYSTEM
========================================================= */

function verifyPin(
    input,
    expectedToken
) {

    try {

        return btoa(input) ===
            expectedToken;

    } catch (_) {

        return false;
    }
}

function showPinModal(
    title,
    expectedToken,
    onSuccess
) {

    removeExistingModal();

    injectDynamicStyles();

    const modal =
        document.createElement("div");

    modal.className =
        "sbl-modal sbl-pin-modal";

    modal.innerHTML = `
        <div
            class="sbl-pin-box"
            role="dialog"
            aria-modal="true"
            aria-label="Teacher Access"
        >

            <button
                type="button"
                class="sbl-modal-close"
                aria-label="Close"
            >×</button>

            <div class="sbl-access-badge">
                TEACHER ACCESS
            </div>

            <h2>
                ${escapeHtml(title)}
            </h2>

            <p>
                Enter PIN to continue
            </p>

            <div
                class="sbl-pin-display"
                aria-label="PIN entry"
            >
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>

            <div class="sbl-keypad">

                ${[
                    1,2,3,
                    4,5,6,
                    7,8,9
                ]
                    .map(
                        (n) =>
                            `<button
                                type="button"
                                data-pin-key="${n}"
                            >${n}</button>`
                    )
                    .join("")}

                <span></span>

                <button
                    type="button"
                    data-pin-key="0"
                >0</button>

                <button
                    type="button"
                    data-pin-delete="true"
                    aria-label="Delete last digit"
                >⌫</button>

            </div>

            <div class="sbl-pin-actions">

                <button
                    type="button"
                    class="sbl-pin-enter"
                >ENTER</button>

                <button
                    type="button"
                    class="sbl-pin-back"
                >BACK</button>

            </div>

            <div
                class="sbl-pin-error"
                aria-live="polite"
            ></div>

        </div>
    `;

    document.body.appendChild(modal);

    activeModal = modal;

    let entered = "";

    const dots =
        modal.querySelectorAll(
            ".sbl-pin-display span"
        );

    const error =
        modal.querySelector(
            ".sbl-pin-error"
        );

    const render = () => {

        dots.forEach(
            (dot, index) => {

                dot.textContent =
                    index < entered.length
                        ? "●"
                        : "";

                dot.classList.toggle(
                    "filled",
                    index < entered.length
                );
            }
        );
    };

    const fail = () => {

        error.textContent =
            "Incorrect PIN";

        error.classList.add(
            "show"
        );

        entered = "";

        render();

        setTimeout(
            () =>
                error.classList.remove(
                    "show"
                ),
            1800
        );
    };

    const submit = () => {

        if (
            !verifyPin(
                entered,
                expectedToken
            )
        ) {

            fail();
            return;
        }

        modal.remove();

        if (
            activeModal === modal
        ) {

            activeModal = null;
        }

        if (
            typeof onSuccess ===
            "function"
        ) {

            onSuccess();
        }
    };

    modal
        .querySelectorAll(
            "[data-pin-key]"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        entered.length >= 4
                    ) {

                        return;
                    }

                    entered +=
                        button.dataset.pinKey;

                    render();
                }
            );
        });

    modal
        .querySelector(
            "[data-pin-delete]"
        )
        ?.addEventListener(
            "click",
            () => {

                entered =
                    entered.slice(0, -1);

                render();
            }
        );

    modal
        .querySelector(
            ".sbl-pin-enter"
        )
        ?.addEventListener(
            "click",
            submit
        );

    modal
        .querySelector(
            ".sbl-pin-back"
        )
        ?.addEventListener(
            "click",
            () => modal.remove()
        );

    modal
        .querySelector(
            ".sbl-modal-close"
        )
        ?.addEventListener(
            "click",
            () => modal.remove()
        );

    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === modal
            ) {

                modal.remove();
            }
        }
    );

    const keyboardHandler =
        (event) => {

            if (
                !modal.isConnected
            ) {

                document.removeEventListener(
                    "keydown",
                    keyboardHandler
                );

                return;
            }

            if (
                /^[0-9]$/.test(
                    event.key
                )
            ) {

                if (
                    entered.length < 4
                ) {

                    entered +=
                        event.key;
                }

                render();

            } else if (
                event.key ===
                "Backspace"
            ) {

                entered =
                    entered.slice(0, -1);

                render();

            } else if (
                event.key ===
                "Enter"
            ) {

                submit();
            }
        };

    document.addEventListener(
        "keydown",
        keyboardHandler
    );

    render();
}

/* =========================================================
   ADD SUBJECT & BOOK
========================================================= */

function handleAddSubjectButton() {

    showPinModal(
        "ADD SUBJECT & BOOK",
        ADD_PIN_TOKEN,
        openAddSubjectForm
    );
}

addSubjectButton?.addEventListener(
    "click",
    handleAddSubjectButton
);

legacyAddSubjectButton?.addEventListener(
    "click",
    handleAddSubjectButton
);

function openAddSubjectForm() {

    removeExistingModal();

    injectDynamicStyles();

    const modal =
        document.createElement("div");

    modal.className =
        "sbl-modal sbl-add-modal";

    modal.innerHTML = `
        <div
            class="sbl-add-box"
            role="dialog"
            aria-modal="true"
            aria-label="Add Subject and Book"
        >

            <button
                type="button"
                class="sbl-modal-close"
                aria-label="Close"
            >×</button>

            <div class="sbl-access-badge">
                TEACHER ACCESS
            </div>

            <h2>
                ADD SUBJECT &amp; BOOK
            </h2>

            <p>
                Add a subject and its book
                for the selected board and class.
            </p>

            <label>
                BOARD
            </label>

            <select id="addBoard">

                <option
                    value=""
                    selected
                    disabled
                >
                    Select Board
                </option>

                <option value="CBSE Board">
                    CBSE Board
                </option>

                <option value="UP Board">
                    UP Board
                </option>

            </select>

            <label>
                CLASS
            </label>

            <select id="addClass">

                <option
                    value=""
                    selected
                    disabled
                >
                    Select Class
                </option>

                <option value="9">
                    9th
                </option>

                <option value="10">
                    10th
                </option>

                <option value="11">
                    11th
                </option>

                <option value="12">
                    12th
                </option>

            </select>

            <label>
                SUBJECT NAME
            </label>

            <input
                id="addSubjectName"
                type="text"
                autocomplete="off"
                placeholder="Enter subject name"
            >

            <label>
                BOOK NAME
            </label>

            <input
                id="addBookName"
                type="text"
                autocomplete="off"
                placeholder="Enter book name"
            >

            <button
                type="button"
                id="submitAddButton"
                class="sbl-submit-add"
            >
                SUBMIT
            </button>

            <button
                type="button"
                id="backAddButton"
                class="sbl-back-add"
            >
                BACK
            </button>

            <div
                id="addFormError"
                class="sbl-form-error"
                aria-live="polite"
            ></div>

        </div>
    `;

    document.body.appendChild(modal);

    activeModal = modal;

    const addBoard =
        $("addBoard");

    const addClass =
        $("addClass");

    const addSubject =
        $("addSubjectName");

    const addBook =
        $("addBookName");

    const errorBox =
        $("addFormError");

    if (getCurrentBoard()) {

        addBoard.value =
            getCurrentBoard();
    }

    if (getCurrentClass()) {

        addClass.value =
            getCurrentClass();
    }

    const showError =
        (message) => {

            errorBox.textContent =
                message;

            errorBox.classList.add(
                "show"
            );
        };

    const submit = () => {

        const board =
            cleanText(addBoard.value);

        const className =
            cleanText(addClass.value);

        const subject =
            cleanText(addSubject.value);

        const book =
            cleanText(addBook.value);

        if (!board) {

            return showError(
                "Please select a board."
            );
        }

        if (!className) {

            return showError(
                "Please select a class."
            );
        }

        if (!subject) {

            showError(
                "Please enter subject name."
            );

            addSubject.focus();

            return;
        }

        if (!book) {

            showError(
                "Please enter book name."
            );

            addBook.focus();

            return;
        }

        if (!libraryData[board]) {

            libraryData[board] = {};
        }

        if (
            !Array.isArray(
                libraryData[board][className]
            )
        ) {

            libraryData[board][className] =
                [];
        }

        const exists =
            libraryData[board][className]
                .some(
                    (item) =>
                        cleanText(
                            item.subject
                        ).toLowerCase() ===
                        subject.toLowerCase() &&

                        cleanText(
                            item.book
                        ).toLowerCase() ===
                        book.toLowerCase()
                );

        if (exists) {

            showError(
                "This subject and book already exist."
            );

            return;
        }

        libraryData[board][className]
            .push({
                subject,
                book
            });

        if (!saveData()) {

            return;
        }

        /* Immediately update homepage */

        if (boardSelect) {

            boardSelect.value =
                board;
        }

        if (classSelect) {

            classSelect.value =
                className;
        }

        populateSubjects(
            subject
        );

        if (subjectSelect) {

            subjectSelect.value =
                subject;

            setSelectLabel(
                subjectSelect,
                "SELECT SUBJECT"
            );
        }

        populateBooks(
            subject,
            book
        );

        if (bookSelect) {

            bookSelect.value =
                book;

            setSelectLabel(
                bookSelect,
                "SELECT BOOK"
            );
        }

        modal.remove();

        activeModal = null;

        showMessage(
            "Subject and book added successfully.",
            "success"
        );
    };

    $("submitAddButton")
        ?.addEventListener(
            "click",
            submit
        );

    $("backAddButton")
        ?.addEventListener(
            "click",
            () => modal.remove()
        );

    modal
        .querySelector(
            ".sbl-modal-close"
        )
        ?.addEventListener(
            "click",
            () => modal.remove()
        );

    [addSubject, addBook]
        .forEach((input) => {

            input.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        submit();
                    }
                }
            );
        });

    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === modal
            ) {

                modal.remove();
            }
        }
    );

    setTimeout(
        () => addBoard.focus(),
        80
    );
}

/* =========================================================
   OPEN PDF
========================================================= */

function handleOpenPdf() {

    const board =
        getCurrentBoard();

    const className =
        getCurrentClass();

    const subject =
        subjectSelect?.value || "";

    const book =
        bookSelect?.value || "";

    if (
        !board ||
        !className ||
        !subject ||
        !book
    ) {

        showMessage(
            "Fill all entries before opening the book PDF.",
            "error"
        );

        return;
    }

    const params =
        new URLSearchParams({
            board,
            class: className,
            subject,
            book
        });

    /*
       Capital-letter filename exactly as requested.
    */

    window.location.href =
        `PDF.html?${params.toString()}`;
}

openPdfButton?.addEventListener(
    "click",
    handleOpenPdf
);

legacyOpenPdfButton?.addEventListener(
    "click",
    handleOpenPdf
);

/* =========================================================
   DELETE CONTROLS
========================================================= */

function createDeleteControls() {

    if (
        !subjectSelect ||
        !bookSelect
    ) {

        return;
    }

    const subjectCard =
        subjectSelect.closest(
            ".select-card"
        );

    const bookCard =
        bookSelect.closest(
            ".select-card"
        );

    /* Subject three-dot */

    if (
        subjectCard &&
        !subjectCard.querySelector(
            ".sbl-three-dot"
        )
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.type = "button";

        button.className =
            "sbl-three-dot";

        button.textContent =
            "⋮";

        button.title =
            "Manage subjects";

        button.setAttribute(
            "aria-label",
            "Manage subjects"
        );

        subjectCard.appendChild(
            button
        );

        button.addEventListener(
            "click",
            (event) => {

                event.preventDefault();
                event.stopPropagation();

                showSubjectDeleteList();
            }
        );
    }

    /* Book three-dot */

    if (
        bookCard &&
        !bookCard.querySelector(
            ".sbl-three-dot"
        )
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.type = "button";

        button.className =
            "sbl-three-dot";

        button.textContent =
            "⋮";

        button.title =
            "Manage books";

        button.setAttribute(
            "aria-label",
            "Manage books"
        );

        bookCard.appendChild(
            button
        );

        button.addEventListener(
            "click",
            (event) => {

                event.preventDefault();
                event.stopPropagation();

                showBookDeleteList();
            }
        );
    }

    injectDynamicStyles();
}

function showSubjectDeleteList() {

    const subjects =
        getSubjects();

    if (
        !getCurrentBoard() ||
        !getCurrentClass()
    ) {

        showMessage(
            "Select a board and class first.",
            "error"
        );

        return;
    }

    if (!subjects.length) {

        showMessage(
            "No subjects are available to delete.",
            "info"
        );

        return;
    }

    showDeleteList(
        "DELETE SUBJECT",
        subjects,
        (subject) => {

            requestDelete(
                "SUBJECT",
                subject,
                () =>
                    deleteSubject(
                        subject
                    )
            );
        }
    );
}

function showBookDeleteList() {

    const subject =
        subjectSelect?.value || "";

    if (
        !getCurrentBoard() ||
        !getCurrentClass()
    ) {

        showMessage(
            "Select a board and class first.",
            "error"
        );

        return;
    }

    if (!subject) {

        showMessage(
            "Select a subject first.",
            "error"
        );

        return;
    }

    const books =
        getBooksForSubject(
            subject
        );

    if (!books.length) {

        showMessage(
            "No books are available to delete.",
            "info"
        );

        return;
    }

    showDeleteList(
        "DELETE BOOK",
        books,
        (book) => {

            requestDelete(
                "BOOK",
                book,
                () =>
                    deleteBook(book)
            );
        }
    );
}

function showDeleteList(
    title,
    items,
    onDelete
) {

    removeExistingModal();

    injectDynamicStyles();

    const modal =
        document.createElement(
            "div"
        );

    modal.className =
        "sbl-modal sbl-delete-list-modal";

    modal.innerHTML = `
        <div
            class="sbl-delete-list-box"
            role="dialog"
            aria-modal="true"
        >

            <button
                type="button"
                class="sbl-modal-close"
                aria-label="Close"
            >×</button>

            <div class="sbl-access-badge">
                TEACHER ACCESS
            </div>

            <h2>
                ${escapeHtml(title)}
            </h2>

            <div
                class="sbl-delete-items"
            ></div>

            <button
                type="button"
                class="sbl-list-back"
            >
                BACK
            </button>

        </div>
    `;

    const list =
        modal.querySelector(
            ".sbl-delete-items"
        );

    items.forEach((item) => {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "sbl-delete-row";

        row.innerHTML = `
            <span>
                ${escapeHtml(item)}
            </span>

            <button
                type="button"
                aria-label="Delete ${escapeHtml(item)}"
            >
                DELETE
            </button>
        `;

        row
            .querySelector("button")
            ?.addEventListener(
                "click",
                () => {

                    modal.remove();

                    onDelete(item);
                }
            );

        list.appendChild(row);
    });

    modal
        .querySelector(
            ".sbl-list-back"
        )
        ?.addEventListener(
            "click",
            () => modal.remove()
        );

    modal
        .querySelector(
            ".sbl-modal-close"
        )
        ?.addEventListener(
            "click",
            () => modal.remove()
        );

    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === modal
            ) {

                modal.remove();
            }
        }
    );

    document.body.appendChild(
        modal
    );

    activeModal = modal;
}

function requestDelete(
    type,
    name,
    callback
) {

    showPinModal(
        `DELETE ${type}`,
        DELETE_PIN_TOKEN,
        callback
    );
}

function deleteSubject(
    subject
) {

    const board =
        getCurrentBoard();

    const className =
        getCurrentClass();

    if (
        !board ||
        !className
    ) {

        return;
    }

    libraryData[board][className] =
        libraryData[board][className]
            .filter(
                (item) =>
                    cleanText(
                        item.subject
                    ).toLowerCase() !==
                    cleanText(
                        subject
                    ).toLowerCase()
            );

    saveData();

    clearSubjectAndBook();

    populateSubjects();

    showMessage(
        "Subject deleted successfully.",
        "success"
    );
}

function deleteBook(
    book
) {

    const board =
        getCurrentBoard();

    const className =
        getCurrentClass();

    const subject =
        subjectSelect?.value || "";

    if (
        !board ||
        !className ||
        !subject
    ) {

        return;
    }

    libraryData[board][className] =
        libraryData[board][className]
            .filter(
                (item) =>
                    !(
                        cleanText(
                            item.subject
                        ).toLowerCase() ===
                        cleanText(
                            subject
                        ).toLowerCase() &&

                        cleanText(
                            item.book
                        ).toLowerCase() ===
                        cleanText(
                            book
                        ).toLowerCase()
                    )
            );

    saveData();

    const currentSubject =
        subject;

    populateSubjects(
        currentSubject
    );

    if (subjectSelect) {

        subjectSelect.value =
            currentSubject;
    }

    setSelectLabel(
        subjectSelect,
        "SELECT SUBJECT"
    );

    populateBooks(
        currentSubject
    );

    showMessage(
        "Book deleted successfully.",
        "success"
    );
}

/* =========================================================
   CLEANUP
========================================================= */

function removeExistingModal() {

    document
        .querySelectorAll(
            ".sbl-modal, " +
            ".pin-modal, " +
            ".add-form-modal, " +
            ".delete-menu-modal"
        )
        .forEach(
            (element) =>
                element.remove()
        );

    activeModal = null;
}

/* =========================================================
   DYNAMIC UI STYLES
========================================================= */

function injectDynamicStyles() {

    if ($("sblDynamicStyles")) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "sblDynamicStyles";

    style.textContent = `

        .sbl-message {

            position: fixed;

            top: 88px;
            left: 50%;

            transform:
                translateX(-50%);

            z-index: 5000;

            width:
                min(
                    430px,
                    calc(100% - 28px)
                );

            display: flex;

            align-items: center;

            gap: 11px;

            padding:
                14px 15px;

            border-radius:
                14px;

            background:
                #ffffff;

            color:
                #172033;

            border:
                1px solid
                rgba(
                    15,
                    23,
                    42,
                    .12
                );

            box-shadow:
                0 12px 35px
                rgba(
                    15,
                    23,
                    42,
                    .20
                );

            font-size:
                14px;

            font-weight:
                700;
        }

        .sbl-message-icon {

            width:
                28px;

            height:
                28px;

            flex:
                0 0 28px;

            display:
                grid;

            place-items:
                center;

            border-radius:
                50%;

            background:
                #2563eb;

            color:
                #fff;
        }

        .sbl-message.success
        .sbl-message-icon {

            background:
                #16a34a;
        }

        .sbl-message.error
        .sbl-message-icon {

            background:
                #dc2626;
        }

        .sbl-message-text {

            flex:
                1;

            line-height:
                1.35;
        }

        .sbl-message-close {

            border:
                0;

            background:
                transparent;

            color:
                #475569;

            font-size:
                23px;

            line-height:
                1;

            padding:
                2px 4px;
        }

        .sbl-modal {

            position:
                fixed;

            inset:
                0;

            z-index:
                4500;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            padding:
                18px;

            background:
                rgba(
                    15,
                    23,
                    42,
                    .58
                );

            overflow-y:
                auto;

            -webkit-overflow-scrolling:
                touch;
        }

        .sbl-pin-box,
        .sbl-add-box,
        .sbl-delete-list-box {

            width:
                min(
                    430px,
                    100%
                );

            max-height:
                calc(
                    100vh - 36px
                );

            overflow-y:
                auto;

            padding:
                24px 20px 20px;

            border-radius:
                20px;

            background:
                #fff;

            box-shadow:
                0 25px 70px
                rgba(
                    0,
                    0,
                    0,
                    .30
                );

            text-align:
                center;

            position:
                relative;
        }

        .sbl-modal-close {

            position:
                absolute;

            top:
                10px;

            right:
                12px;

            width:
                34px;

            height:
                34px;

            border:
                0;

            border-radius:
                50%;

            background:
                #eef2f7;

            color:
                #334155;

            font-size:
                23px;
        }

        .sbl-access-badge {

            display:
                inline-block;

            padding:
                7px 11px;

            border-radius:
                8px;

            background:
                #eef2f7;

            color:
                #475569;

            font-size:
                11px;

            font-weight:
                900;

            letter-spacing:
                1px;
        }

        .sbl-pin-box h2,
        .sbl-add-box h2,
        .sbl-delete-list-box h2 {

            margin:
                13px 0 7px;

            color:
                #172033;

            font-size:
                21px;

            font-weight:
                900;
        }

        .sbl-pin-box > p,
        .sbl-add-box > p {

            margin-bottom:
                16px;

            color:
                #64748b;

            font-size:
                13px;

            line-height:
                1.45;
        }

        .sbl-pin-display {

            display:
                flex;

            justify-content:
                center;

            gap:
                13px;

            margin:
                18px 0;
        }

        .sbl-pin-display span {

            width:
                15px;

            height:
                15px;

            display:
                grid;

            place-items:
                center;

            border:
                1px solid
                #94a3b8;

            border-radius:
                50%;

            color:
                #172033;

            font-size:
                10px;
        }

        .sbl-pin-display
        span.filled {

            background:
                #2563eb;

            border-color:
                #2563eb;

            color:
                #fff;
        }

        .sbl-keypad {

            display:
                grid;

            grid-template-columns:
                repeat(
                    3,
                    1fr
                );

            gap:
                9px;
        }

        .sbl-keypad button {

            min-height:
                48px;

            border:
                1px solid
                #dbe3ec;

            border-radius:
                12px;

            background:
                #f8fafc;

            color:
                #172033;

            font-size:
                17px;

            font-weight:
                800;
        }

        .sbl-keypad button:active,
        .sbl-pin-actions button:active,
        .sbl-add-box button:active,
        .sbl-delete-row button:active {

            transform:
                scale(.97);
        }

        .sbl-pin-actions {

            display:
                grid;

            grid-template-columns:
                1fr 1fr;

            gap:
                10px;

            margin-top:
                15px;
        }

        .sbl-pin-actions button,
        .sbl-submit-add,
        .sbl-back-add,
        .sbl-list-back {

            min-height:
                46px;

            border:
                0;

            border-radius:
                11px;

            font-size:
                13px;

            font-weight:
                900;
        }

        .sbl-pin-enter,
        .sbl-submit-add {

            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #1d4ed8
                );

            color:
                #fff;
        }

        .sbl-pin-back,
        .sbl-back-add,
        .sbl-list-back {

            background:
                #e8edf3;

            color:
                #334155;
        }

        .sbl-pin-error,
        .sbl-form-error {

            min-height:
                18px;

            margin-top:
                9px;

            color:
                #dc2626;

            font-size:
                12px;

            font-weight:
                800;

            opacity:
                0;
        }

        .sbl-pin-error.show,
        .sbl-form-error.show {

            opacity:
                1;
        }

        .sbl-add-box {

            text-align:
                left;
        }

        .sbl-add-box h2,
        .sbl-add-box > p {

            text-align:
                center;
        }

        .sbl-add-box label {

            display:
                block;

            margin:
                12px 0 6px;

            color:
                #334155;

            font-size:
                11px;

            font-weight:
                900;

            letter-spacing:
                .5px;
        }

        .sbl-add-box select,
        .sbl-add-box input {

            width:
                100%;

            height:
                46px;

            padding:
                0 12px;

            border:
                1px solid
                #cbd5e1;

            border-radius:
                11px;

            outline:
                none;

            background:
                #f8fafc;

            color:
                #172033;

            font-size:
                14px;
        }

        .sbl-add-box select:focus,
        .sbl-add-box input:focus {

            border-color:
                #2563eb;

            box-shadow:
                0 0 0 3px
                rgba(
                    37,
                    99,
                    235,
                    .12
                );
        }

        .sbl-submit-add,
        .sbl-back-add {

            width:
                100%;

            margin-top:
                14px;
        }

        .sbl-back-add {

            margin-top:
                9px;
        }

        .sbl-delete-items {

            max-height:
                48vh;

            overflow-y:
                auto;

            margin:
                14px 0;
        }

        .sbl-delete-row {

            display:
                flex;

            align-items:
                center;

            gap:
                10px;

            padding:
                10px;

            margin-bottom:
                8px;

            border:
                1px solid
                #e2e8f0;

            border-radius:
                12px;

            background:
                #f8fafc;
        }

        .sbl-delete-row span {

            flex:
                1;

            text-align:
                left;

            color:
                #172033;

            font-size:
                13px;

            font-weight:
                700;

            overflow-wrap:
                anywhere;
        }

        .sbl-delete-row button {

            min-height:
                36px;

            padding:
                0 10px;

            border:
                0;

            border-radius:
                9px;

            background:
                #dc2626;

            color:
                #fff;

            font-size:
                11px;

            font-weight:
                900;
        }

        .sbl-three-dot {

            position:
                absolute !important;

            top:
                8px !important;

            right:
                8px !important;

            z-index:
                10 !important;

            width:
                30px !important;

            height:
                32px !important;

            padding:
                0 !important;

            border:
                0 !important;

            border-radius:
                8px !important;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .94
                ) !important;

            color:
                #334155 !important;

            font-size:
                20px !important;

            line-height:
                1 !important;

            box-shadow:
                0 3px 9px
                rgba(
                    15,
                    23,
                    42,
                    .16
                ) !important;
        }

        .sbl-three-dot:active {

            transform:
                scale(.94);
        }

        body.dark-mode
        .sbl-message,
        body.dark-mode
        .sbl-pin-box,
        body.dark-mode
        .sbl-add-box,
        body.dark-mode
        .sbl-delete-list-box {

            background:
                #111827;

            color:
                #fff;
        }

        body.dark-mode
        .sbl-pin-box h2,
        body.dark-mode
        .sbl-add-box h2,
        body.dark-mode
        .sbl-delete-list-box h2,
        body.dark-mode
        .sbl-delete-row span {

            color:
                #fff;
        }

        body.dark-mode
        .sbl-pin-box > p,
        body.dark-mode
        .sbl-add-box > p {

            color:
                #94a3b8;
        }

        body.dark-mode
        .sbl-access-badge,
        body.dark-mode
        .sbl-modal-close,
        body.dark-mode
        .sbl-pin-back,
        body.dark-mode
        .sbl-back-add,
        body.dark-mode
        .sbl-list-back {

            background:
                #1e293b;

            color:
                #e2e8f0;
        }

        body.dark-mode
        .sbl-keypad button,
        body.dark-mode
        .sbl-add-box select,
        body.dark-mode
        .sbl-add-box input,
        body.dark-mode
        .sbl-delete-row {

            background:
                #1e293b;

            color:
                #fff;

            border-color:
                #334155;
        }

        @media (
            max-width: 480px
        ) {

            .sbl-modal {

                padding:
                    12px;
            }

            .sbl-pin-box,
            .sbl-add-box,
            .sbl-delete-list-box {

                padding:
                    21px 15px 17px;

                border-radius:
                    17px;
            }

            .sbl-keypad button {

                min-height:
                    45px;
            }
        }
    `;

    document.head.appendChild(
        style
    );
}

/* =========================================================
   SMOOTH TOUCH BEHAVIOUR
========================================================= */

document.addEventListener(
    "touchstart",
    () => {},
    {
        passive: true
    }
);

/*
   Prevent accidental double-tap zoom on interactive
   controls without blocking normal scrolling.
*/

document
    .querySelectorAll(
        "button, a, select"
    )
    .forEach((element) => {

        element.style.touchAction =
            "manipulation";
    });

/* =========================================================
   INITIALISE
========================================================= */

injectDynamicStyles();

loadTheme();

initializeSelections();

disableDownloadedPDFsNavigation();

/* =========================================================
   GLOBAL HELPER
   PDF.html can use this later if needed.
========================================================= */

window.SchoolBooksLibrary = {

    getData: () =>
        JSON.parse(
            JSON.stringify(
                libraryData
            )
        ),

    getCurrentSelection: () => ({

        board:
            getCurrentBoard(),

        className:
            getCurrentClass(),

        subject:
            subjectSelect?.value || "",

        book:
            bookSelect?.value || ""
    })
};
