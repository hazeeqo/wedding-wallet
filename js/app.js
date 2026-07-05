const state = {
    vendors: [],
    payments: [],
    events: [
        {
            name: "Engagement Day",
            icon: "💍",
            date: "2026-12-19",
            venue: "Aina's House",
            time: "8-11pm",
            startTime: "20:00"
        },
        {
            name: "Nikah Day",
            icon: "💍✨",
            date: "2027-04-02",
            venue: "Lantera Cahaya SPK",
            time: "7-11pm",
            startTime: "19:00"
        },
        {
            name: "Majlis Sanding",
            icon: "🤵‍♂️👰‍♀️",
            date: "2027-04-03",
            venue: "Grand Asiana Hall, PJ",
            time: "11am-4pm",
            startTime: "11:00"
        },
        {
            name: "Majlis Tandang",
            icon: "🤵‍♂️👰‍♀️✨",
            date: "2027-04-11",
            venue: "Magica Autumn, PICC",
            time: "11am-4pm",
            startTime: "11:00"
        }
    ],
    activeEventIndex: 0,
    savings: {
        goal: 0,
        current: 0,
        monthlyTarget: 0
    },
    search: "",
    category: "all"
};

let firebase = null;
let countdownTimer = null;

const money = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0
});

const els = {};

function initializeAppUi() {
    cacheElements();
    bindEvents();
    setToday();
    renderCountdown();
    startCountdownTimer();
    startSplash();
    subscribeToData();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAppUi);
} else {
    initializeAppUi();
}

function cacheElements() {
    [
        "app",
        "splash",
        "totalRemaining",
        "paidPercent",
        "overallProgress",
        "totalQuoted",
        "totalPaid",
        "savingsSaved",
        "eventWeekday",
        "eventName",
        "eventMeta",
        "daysLeft",
        "hoursLeft",
        "eventSlider",
        "eventDots",
        "editEventsButton",
        "vendorCount",
        "vendorSearch",
        "categoryFilter",
        "vendorList",
        "paymentList",
        "vendorModal",
        "vendorForm",
        "vendorId",
        "vendorName",
        "vendorCategory",
        "vendorQuote",
        "vendorDueDate",
        "invoiceFile",
        "hasSchedule",
        "scheduleBuilder",
        "addScheduleButton",
        "scheduleRows",
        "vendorNotes",
        "paymentModal",
        "paymentForm",
        "paymentVendor",
        "paymentAmount",
        "paymentDate",
        "paymentMethod",
        "receiptFile",
        "paymentPaidBy",
        "paymentNote",
        "savingsForm",
        "savingsGoal",
        "savingsCurrent",
        "monthlyTarget",
        "savingsRemaining",
        "savingsPercent",
        "savingsProgress",
        "savingsHint",
        "eventsModal",
        "eventsForm",
        "eventEditorList",
        "vendorPaymentsModal",
        "vendorPaymentsTitle",
        "vendorPaymentHistory",
        "toast"
    ].forEach((id) => {
        els[id] = document.getElementById(id);
    });

    ensureCountdownFallbackElements();

    [
        "eventWeekday",
        "daysLeft",
        "hoursLeft",
        "eventSlider",
        "eventDots",
        "editEventsButton",
        "eventsModal",
        "eventsForm",
        "eventEditorList"
    ].forEach((id) => {
        els[id] = document.getElementById(id);
    });

    els.daysLeft = els.daysLeft || document.getElementById("days");
    els.hoursLeft = els.hoursLeft || document.getElementById("hours");
}

function ensureCountdownFallbackElements() {
    const countdownPanel = document.querySelector(".countdown-panel");
    if (!countdownPanel) return;

    if (!document.getElementById("eventWeekday")) {
        const eventWeekday = document.createElement("span");
        eventWeekday.id = "eventWeekday";
        eventWeekday.className = "event-weekday";
        const eventName = document.getElementById("eventName");
        eventName?.parentElement?.insertBefore(eventWeekday, eventName);
    }

    if (!document.getElementById("editEventsButton")) {
        const button = document.createElement("button");
        button.id = "editEventsButton";
        button.className = "ghost-on-dark";
        button.type = "button";
        button.textContent = "Edit";
        countdownPanel.querySelector(".section-head, .countdown-top")?.appendChild(button);
    }

    if (!document.getElementById("eventSlider")) {
        const slider = document.createElement("input");
        slider.id = "eventSlider";
        slider.className = "event-slider";
        slider.type = "range";
        slider.min = "0";
        slider.max = "3";
        slider.value = "0";
        slider.step = "1";
        (document.getElementById("eventMeta") || countdownPanel).after(slider);
    }

    if (!document.getElementById("eventDots")) {
        const dots = document.createElement("div");
        dots.id = "eventDots";
        dots.className = "event-dots";
        document.getElementById("eventSlider")?.after(dots);
    }

    if (!document.getElementById("eventsModal")) {
        const modal = document.createElement("div");
        modal.id = "eventsModal";
        modal.className = "modal hidden";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "eventsModalTitle");
        modal.innerHTML = `
            <form id="eventsForm" class="modal-sheet">
                <div class="modal-head">
                    <h2 id="eventsModalTitle">Edit events</h2>
                    <button class="ghost-button" type="button" data-close="eventsModal">Close</button>
                </div>
                <div id="eventEditorList" class="event-editor-list"></div>
                <button class="primary-button full" type="submit">Save events</button>
            </form>
        `;
        document.body.appendChild(modal);
    }
}

function bindEvents() {
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.addEventListener("click", () => switchScreen(tab.dataset.screen));
    });

    document.getElementById("addVendorButton").addEventListener("click", () => openVendorModal());
    document.getElementById("addPaymentButton").addEventListener("click", () => openPaymentModal());
    document.getElementById("quickAddPayment").addEventListener("click", () => openPaymentModal());
    els.editEventsButton.addEventListener("click", openEventsModal);
    els.eventSlider.addEventListener("input", () => {
        state.activeEventIndex = Number(els.eventSlider.value);
        renderCountdown();
    });
    els.eventDots.addEventListener("click", (event) => {
        const button = event.target.closest("[data-event-index]");
        if (!button) return;

        state.activeEventIndex = Number(button.dataset.eventIndex);
        renderCountdown();
    });

    document.querySelectorAll("[data-close]").forEach((button) => {
        button.addEventListener("click", () => closeModal(button.dataset.close));
    });

    els.vendorSearch.addEventListener("input", () => {
        state.search = els.vendorSearch.value.trim().toLowerCase();
        render();
    });

    els.categoryFilter.addEventListener("change", () => {
        state.category = els.categoryFilter.value;
        render();
    });

    els.vendorForm.addEventListener("submit", saveVendor);
    els.paymentForm.addEventListener("submit", savePayment);
    els.savingsForm.addEventListener("submit", saveSavings);
    els.eventsForm.addEventListener("submit", saveEvents);
    els.hasSchedule?.addEventListener("change", toggleScheduleBuilder);
    els.addScheduleButton?.addEventListener("click", () => addScheduleRow());
    els.scheduleRows?.addEventListener("click", handleScheduleRowAction);

    els.vendorList.addEventListener("click", handleVendorAction);
    els.paymentList.addEventListener("click", handlePaymentAction);

    document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModal(modal.id);
        });
    });
}

function setToday() {
    els.paymentDate.value = getLocalDateValue(new Date());
}

function startSplash() {
    window.setTimeout(() => {
        els.splash.classList.add("hide");
        window.setTimeout(() => {
            els.splash.remove();
            els.app.classList.remove("hidden");
        }, 300);
    }, 700);
}

async function subscribeToData() {
    try {
        firebase = await import("./firebase.js");
    } catch (error) {
        showToast("Firebase could not load. Check your connection.");
        return;
    }

    firebase.onSnapshot(firebase.collection(firebase.db, "vendors"), (snapshot) => {
        state.vendors = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
        }));
        state.vendors.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        render();
    });

    firebase.onSnapshot(firebase.collection(firebase.db, "payments"), (snapshot) => {
        state.payments = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
        }));
        state.payments.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
        render();
    });

    firebase.onSnapshot(firebase.doc(firebase.db, "settings", "savings"), (snapshot) => {
        if (snapshot.exists()) {
            state.savings = {
                goal: Number(snapshot.data().goal || 0),
                current: Number(snapshot.data().current || 0),
                monthlyTarget: Number(snapshot.data().monthlyTarget || 0)
            };
            fillSavingsForm();
            render();
        }
    });

    firebase.onSnapshot(firebase.doc(firebase.db, "settings", "events"), (snapshot) => {
        if (snapshot.exists() && Array.isArray(snapshot.data().items)) {
            state.events = normalizeEvents(snapshot.data().items);
            state.activeEventIndex = Math.min(state.activeEventIndex, state.events.length - 1);
            render();
        }
    });
}

function switchScreen(id) {
    document.querySelectorAll(".screen").forEach((screen) => {
        screen.classList.toggle("active", screen.id === id);
    });
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.screen === id);
    });
}

function render() {
    renderSummary();
    renderCountdown();
    renderVendors();
    renderPayments();
    renderSavings();
    fillPaymentVendorOptions();
}

function getPaidByVendor() {
    return state.payments.reduce((totals, payment) => {
        const vendorId = payment.vendorId;
        totals[vendorId] = (totals[vendorId] || 0) + Number(payment.amount || 0);
        return totals;
    }, {});
}

function getVendorById(id) {
    return state.vendors.find((vendor) => vendor.id === id);
}

function getEventDateTime(event) {
    const date = event?.date || getLocalDateValue(new Date());
    const time = event?.startTime || "00:00";
    const target = new Date(`${date}T${time}:00`);
    return Number.isNaN(target.getTime()) ? new Date() : target;
}

function startCountdownTimer() {
    window.clearInterval(countdownTimer);
    countdownTimer = window.setInterval(renderCountdown, 60000);
}

function renderCountdown() {
    if (!els.eventName) return;

    state.events = normalizeEvents(state.events);
    const event = state.events[state.activeEventIndex] || state.events[0];
    const target = getEventDateTime(event);
    const now = new Date();
    const isEventDay = isSameDate(event.date, now);
    const diffMs = Math.max(target.getTime() - now.getTime(), 0);
    const totalHours = Math.floor(diffMs / 36e5);
    const days = isEventDay ? 0 : Math.floor(totalHours / 24);
    const hours = isEventDay ? 0 : totalHours % 24;

    els.eventSlider.max = String(state.events.length - 1);
    els.eventSlider.value = String(state.activeEventIndex);
    document.querySelector(".countdown-panel")?.classList.toggle("d-day", isEventDay);
    els.eventWeekday.textContent = isEventDay ? "D-Day - Today is the day" : `${formatWeekday(event.date)} - ${formatDate(event.date)}`;
    els.eventName.textContent = `${event.icon || getEventIcon(event.name)} ${event.name || "Wedding event"}`;
    els.eventMeta.textContent = isEventDay
        ? `Today is the day. ${[event.venue, event.time].filter(Boolean).join(" - ")}`
        : [event.venue, event.time].filter(Boolean).join(" - ") || "Details coming soon";
    els.daysLeft.textContent = String(days);
    els.hoursLeft.textContent = String(hours);
    els.eventDots.innerHTML = state.events.map((item, index) => (
        `<button class="event-dot ${index === state.activeEventIndex ? "active" : ""}" type="button" data-event-index="${index}">${escapeHtml(`${item.icon || getEventIcon(item.name)} ${item.name}`)}</button>`
    )).join("");
}

function getNextScheduledPayment(vendor, paid) {
    const schedule = Array.isArray(vendor.schedule) ? vendor.schedule : [];
    let remainingPaid = Number(paid || 0);

    return schedule
        .map((item) => ({
            amount: Number(item.amount || 0),
            dueDate: item.dueDate || "",
            details: item.details || ""
        }))
        .filter((item) => item.amount > 0)
        .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
        .map((item) => {
            const covered = Math.min(item.amount, remainingPaid);
            remainingPaid = Math.max(remainingPaid - item.amount, 0);
            return {
                ...item,
                remaining: item.amount - covered
            };
        })
        .find((item) => item.remaining > 0);
}

function renderSummary() {
    const paidByVendor = getPaidByVendor();
    const quoted = state.vendors.reduce((sum, vendor) => sum + Number(vendor.quote || 0), 0);
    const paid = Object.values(paidByVendor).reduce((sum, value) => sum + value, 0);
    const remaining = Math.max(quoted - paid, 0);
    const percent = quoted > 0 ? Math.min((paid / quoted) * 100, 100) : 0;

    els.totalQuoted.textContent = formatMoney(quoted);
    els.totalPaid.textContent = formatMoney(paid);
    els.totalRemaining.textContent = formatMoney(remaining);
    els.savingsSaved.textContent = formatMoney(state.savings.current);
    els.paidPercent.textContent = `${Math.round(percent)}% paid`;
    els.overallProgress.style.width = `${percent}%`;
}

function renderVendors() {
    const paidByVendor = getPaidByVendor();
    const filtered = state.vendors.filter((vendor) => {
        const matchesCategory = state.category === "all" || vendor.category === state.category;
        const haystack = `${vendor.name || ""} ${vendor.category || ""} ${vendor.notes || ""}`.toLowerCase();
        return matchesCategory && haystack.includes(state.search);
    });

    els.vendorCount.textContent = `${filtered.length} vendor${filtered.length === 1 ? "" : "s"}`;

    if (!filtered.length) {
        els.vendorList.innerHTML = `<div class="empty-state">Add your first vendor quote to start tracking balances.</div>`;
        return;
    }

    els.vendorList.innerHTML = filtered.map((vendor) => {
        const quote = Number(vendor.quote || 0);
        const paid = Number(paidByVendor[vendor.id] || 0);
        const remaining = Math.max(quote - paid, 0);
        const percent = quote > 0 ? Math.min((paid / quote) * 100, 100) : 0;
        const nextPayment = getNextScheduledPayment(vendor, paid);
        const invoiceLink = vendor.invoiceUrl
            ? `<a href="${escapeAttr(vendor.invoiceUrl)}" target="_blank" rel="noopener">Invoice</a>`
            : "";

        return `
            <article class="vendor-card">
                <div class="card-head">
                    <div>
                        <h3 class="vendor-name">${escapeHtml(vendor.name || "Untitled vendor")}</h3>
                        <span class="category">${escapeHtml(vendor.category || "Other")}</span>
                    </div>
                    <div class="balance">
                        <span>Balance</span>
                        <strong>${formatMoney(remaining)}</strong>
                    </div>
                </div>
                <div class="money-row">
                    <div><span>Quote</span><strong>${formatMoney(quote)}</strong></div>
                    <div><span>Paid</span><strong>${formatMoney(paid)}</strong></div>
                    <div><span>Progress</span><strong>${Math.round(percent)}%</strong></div>
                </div>
                <div class="progress-track vendor-progress">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                ${nextPayment ? `<p class="schedule-due">Next due: ${formatMoney(nextPayment.remaining)} on ${formatDate(nextPayment.dueDate)}${nextPayment.details ? ` - ${escapeHtml(nextPayment.details)}` : ""}</p>` : ""}
                ${!nextPayment && vendor.dueDate ? `<span class="meta">Due ${formatDate(vendor.dueDate)}</span>` : ""}
                ${vendor.notes ? `<p class="notes">${escapeHtml(vendor.notes)}</p>` : ""}
                <div class="action-row">
                    <button type="button" data-action="pay" data-id="${vendor.id}">Pay</button>
                    <button type="button" data-action="history" data-id="${vendor.id}">Track</button>
                    <button type="button" data-action="edit" data-id="${vendor.id}">Edit</button>
                    ${invoiceLink}
                    <button type="button" data-action="delete" data-id="${vendor.id}">Delete</button>
                </div>
            </article>
        `;
    }).join("");
}

function renderPayments() {
    if (!state.payments.length) {
        els.paymentList.innerHTML = `<div class="empty-state">Payments and receipts will appear here.</div>`;
        return;
    }

    els.paymentList.innerHTML = state.payments.map((payment) => {
        const vendor = getVendorById(payment.vendorId);
        const receiptLink = payment.receiptUrl
            ? `<a href="${escapeAttr(payment.receiptUrl)}" target="_blank" rel="noopener">Receipt</a>`
            : "";

        return `
            <article class="payment-card">
                <div class="card-head">
                    <div>
                        <h3>${escapeHtml(vendor?.name || "Vendor removed")}</h3>
                        <span class="meta">${formatDate(payment.date)} - ${escapeHtml(payment.method || "Payment")}</span>
                        ${payment.paidBy ? `<span class="meta">Paid by ${escapeHtml(payment.paidBy)}</span>` : ""}
                    </div>
                    <div class="amount">${formatMoney(payment.amount || 0)}</div>
                </div>
                ${payment.note ? `<p class="notes">${escapeHtml(payment.note)}</p>` : ""}
                <div class="action-row">
                    ${receiptLink}
                    <button type="button" data-action="delete-payment" data-id="${payment.id}">Delete</button>
                </div>
            </article>
        `;
    }).join("");
}

function renderSavings() {
    const goal = Number(state.savings.goal || 0);
    const current = Number(state.savings.current || 0);
    const monthly = Number(state.savings.monthlyTarget || 0);
    const remaining = Math.max(goal - current, 0);
    const percent = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

    els.savingsRemaining.textContent = formatMoney(remaining);
    els.savingsPercent.textContent = `${Math.round(percent)}%`;
    els.savingsProgress.style.width = `${percent}%`;

    if (!goal) {
        els.savingsHint.textContent = "Set a savings goal to start tracking.";
    } else if (remaining === 0) {
        els.savingsHint.textContent = "Savings goal completed.";
    } else if (monthly > 0) {
        const months = Math.ceil(remaining / monthly);
        els.savingsHint.textContent = `${months} month${months === 1 ? "" : "s"} left at ${formatMoney(monthly)} per month.`;
    } else {
        els.savingsHint.textContent = "Add a monthly target to estimate your timeline.";
    }
}

function fillSavingsForm() {
    els.savingsGoal.value = state.savings.goal || "";
    els.savingsCurrent.value = state.savings.current || "";
    els.monthlyTarget.value = state.savings.monthlyTarget || "";
}

function fillPaymentVendorOptions(selectedId = "") {
    const current = selectedId || els.paymentVendor.value;
    els.paymentVendor.innerHTML = state.vendors.map((vendor) => (
        `<option value="${vendor.id}">${escapeHtml(vendor.name || "Untitled vendor")}</option>`
    )).join("");

    if (current && state.vendors.some((vendor) => vendor.id === current)) {
        els.paymentVendor.value = current;
    }
}

async function saveVendor(event) {
    event.preventDefault();
    if (!ensureFirebaseReady()) return;

    const id = els.vendorId.value;
    const file = els.invoiceFile.files[0];

    setBusy(els.vendorForm, true);

    try {
        const data = {
            name: els.vendorName.value.trim(),
            category: els.vendorCategory.value,
            quote: Number(els.vendorQuote.value || 0),
            dueDate: els.vendorDueDate.value,
            schedule: collectScheduleRows(),
            notes: els.vendorNotes.value.trim(),
            updatedAt: firebase.serverTimestamp()
        };

        if (file) {
            const upload = await uploadFile(file, `invoices/${Date.now()}-${cleanFileName(file.name)}`);
            data.invoiceUrl = upload.url;
            data.invoiceName = file.name;
        }

        if (id) {
            await firebase.updateDoc(firebase.doc(firebase.db, "vendors", id), data);
            showToast("Vendor updated");
        } else {
            await firebase.addDoc(firebase.collection(firebase.db, "vendors"), {
                ...data,
                createdAt: firebase.serverTimestamp()
            });
            showToast("Vendor added");
        }

        closeModal("vendorModal");
        els.vendorForm.reset();
        els.vendorId.value = "";
    } catch (error) {
        showToast(error.message || "Could not save vendor");
    } finally {
        setBusy(els.vendorForm, false);
    }
}

async function savePayment(event) {
    event.preventDefault();
    if (!ensureFirebaseReady()) return;

    if (!state.vendors.length) {
        showToast("Add a vendor first");
        return;
    }

    const file = els.receiptFile.files[0];
    setBusy(els.paymentForm, true);

    try {
        const data = {
            vendorId: els.paymentVendor.value,
            amount: Number(els.paymentAmount.value || 0),
            date: els.paymentDate.value || getLocalDateValue(new Date()),
            method: els.paymentMethod.value,
            paidBy: els.paymentPaidBy?.value || "Haziq",
            note: els.paymentNote.value.trim(),
            createdAt: firebase.serverTimestamp()
        };

        if (file) {
            const upload = await uploadFile(file, `receipts/${Date.now()}-${cleanFileName(file.name)}`);
            data.receiptUrl = upload.url;
            data.receiptName = file.name;
        }

        await firebase.addDoc(firebase.collection(firebase.db, "payments"), data);
        closeModal("paymentModal");
        els.paymentForm.reset();
        setToday();
        showToast("Payment saved");
    } catch (error) {
        showToast(error.message || "Could not save payment");
    } finally {
        setBusy(els.paymentForm, false);
    }
}

async function saveSavings(event) {
    event.preventDefault();
    if (!ensureFirebaseReady()) return;

    const data = {
        goal: Number(els.savingsGoal.value || 0),
        current: Number(els.savingsCurrent.value || 0),
        monthlyTarget: Number(els.monthlyTarget.value || 0),
        updatedAt: firebase.serverTimestamp()
    };

    await firebase.setDoc(firebase.doc(firebase.db, "settings", "savings"), data, { merge: true });
    showToast("Savings updated");
}

async function saveEvents(event) {
    event.preventDefault();
    if (!ensureFirebaseReady()) return;

    const items = Array.from(els.eventEditorList.querySelectorAll(".event-editor-card")).map((card, index) => ({
        name: card.querySelector(`[name="eventName${index}"]`).value.trim(),
        icon: card.querySelector(`[name="eventIcon${index}"]`).value.trim(),
        date: card.querySelector(`[name="eventDate${index}"]`).value,
        venue: card.querySelector(`[name="eventVenue${index}"]`).value.trim(),
        time: card.querySelector(`[name="eventTime${index}"]`).value.trim(),
        startTime: card.querySelector(`[name="eventStartTime${index}"]`).value
    }));

    state.events = normalizeEvents(items);
    state.activeEventIndex = Math.min(state.activeEventIndex, state.events.length - 1);
    renderCountdown();

    await firebase.setDoc(firebase.doc(firebase.db, "settings", "events"), {
        items: state.events,
        updatedAt: firebase.serverTimestamp()
    }, { merge: true });

    closeModal("eventsModal");
    showToast("Events updated");
}

async function uploadFile(file, path) {
    const fileRef = firebase.ref(firebase.storage, path);
    await firebase.uploadBytes(fileRef, file);
    return {
        url: await firebase.getDownloadURL(fileRef)
    };
}

function openVendorModal(vendor = null) {
    els.vendorForm.reset();
    els.vendorId.value = vendor?.id || "";
    els.vendorName.value = vendor?.name || "";
    els.vendorCategory.value = vendor?.category || "Venue";
    els.vendorQuote.value = vendor?.quote || "";
    els.vendorDueDate.value = vendor?.dueDate || "";
    els.vendorNotes.value = vendor?.notes || "";
    if (els.scheduleRows && els.hasSchedule) {
        els.scheduleRows.innerHTML = "";
        (Array.isArray(vendor?.schedule) ? vendor.schedule : []).forEach((item) => addScheduleRow(item));
        els.hasSchedule.checked = Boolean(vendor?.schedule?.length);
        toggleScheduleBuilder();
    }
    document.getElementById("vendorModalTitle").textContent = vendor ? "Edit vendor" : "Add vendor";
    openModal("vendorModal");
}

function openPaymentModal(vendorId = "") {
    els.paymentForm.reset();
    setToday();
    fillPaymentVendorOptions(vendorId);
    openModal("paymentModal");
}

function openEventsModal() {
    state.events = normalizeEvents(state.events);
    els.eventEditorList.innerHTML = state.events.map((event, index) => `
        <section class="event-editor-card">
            <label>
                Event name
                <input name="eventName${index}" value="${escapeAttr(event.name)}" required>
            </label>
            <label>
                Icon
                <input name="eventIcon${index}" value="${escapeAttr(event.icon || getEventIcon(event.name))}">
            </label>
            <label>
                Date
                <input name="eventDate${index}" type="date" value="${escapeAttr(event.date)}" required>
            </label>
            <label>
                Venue
                <input name="eventVenue${index}" value="${escapeAttr(event.venue)}">
            </label>
            <div class="schedule-row-grid">
                <label>
                    Display time
                    <input name="eventTime${index}" value="${escapeAttr(event.time)}" placeholder="11am-4pm">
                </label>
                <label>
                    Start time
                    <input name="eventStartTime${index}" type="time" value="${escapeAttr(event.startTime)}">
                </label>
            </div>
        </section>
    `).join("");
    openModal("eventsModal");
}

function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
}

function toggleScheduleBuilder() {
    if (!els.scheduleBuilder || !els.hasSchedule || !els.scheduleRows) return;

    els.scheduleBuilder.classList.toggle("hidden", !els.hasSchedule.checked);
    if (els.hasSchedule.checked && !els.scheduleRows.children.length) {
        addScheduleRow();
    }
}

function addScheduleRow(item = {}) {
    if (!els.scheduleRows) return;

    const row = document.createElement("div");
    row.className = "schedule-row";
    row.innerHTML = `
        <div class="schedule-row-grid">
            <label>
                Amount
                <input name="scheduleAmount" type="number" min="0" step="0.01" value="${escapeAttr(item.amount || "")}">
            </label>
            <label>
                Due date
                <input name="scheduleDueDate" type="date" value="${escapeAttr(item.dueDate || "")}">
            </label>
        </div>
        <label>
            Details
            <input name="scheduleDetails" value="${escapeAttr(item.details || "")}" placeholder="Deposit, balance, etc.">
        </label>
        <button class="ghost-button small" type="button" data-schedule-action="remove">Remove</button>
    `;
    els.scheduleRows.appendChild(row);
}

function handleScheduleRowAction(event) {
    const button = event.target.closest("[data-schedule-action='remove']");
    if (!button) return;

    button.closest(".schedule-row").remove();
    if (!els.scheduleRows.children.length) {
        els.hasSchedule.checked = false;
        toggleScheduleBuilder();
    }
}

function collectScheduleRows() {
    if (!els.hasSchedule?.checked || !els.scheduleRows) return [];

    return Array.from(els.scheduleRows.querySelectorAll(".schedule-row"))
        .map((row) => ({
            amount: Number(row.querySelector("[name='scheduleAmount']").value || 0),
            dueDate: row.querySelector("[name='scheduleDueDate']").value,
            details: row.querySelector("[name='scheduleDetails']").value.trim()
        }))
        .filter((item) => item.amount > 0 || item.dueDate || item.details);
}

function openVendorPayments(vendor) {
    const payments = state.payments.filter((payment) => payment.vendorId === vendor.id);
    els.vendorPaymentsTitle.textContent = `${vendor.name || "Vendor"} payments`;
    els.vendorPaymentHistory.innerHTML = payments.length ? payments.map((payment) => `
        <article class="payment-card">
            <div class="card-head">
                <div>
                    <h3>${formatDate(payment.date)}</h3>
                    <span class="meta">${escapeHtml(payment.method || "Payment")}</span>
                    ${payment.paidBy ? `<span class="meta">Paid by ${escapeHtml(payment.paidBy)}</span>` : ""}
                </div>
                <div class="amount">${formatMoney(payment.amount || 0)}</div>
            </div>
            ${payment.note ? `<p class="notes">${escapeHtml(payment.note)}</p>` : ""}
        </article>
    `).join("") : `<div class="empty-state">No payments recorded for this vendor yet.</div>`;
    openModal("vendorPaymentsModal");
}

async function handleVendorAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const vendor = getVendorById(button.dataset.id);
    if (!vendor) return;

    if (button.dataset.action === "pay") {
        openPaymentModal(vendor.id);
    }

    if (button.dataset.action === "edit") {
        openVendorModal(vendor);
    }

    if (button.dataset.action === "history") {
        openVendorPayments(vendor);
    }

    if (button.dataset.action === "delete") {
        if (!ensureFirebaseReady()) return;

        const confirmed = window.confirm(`Delete ${vendor.name}? Payments will stay in history.`);
        if (confirmed) {
            await firebase.deleteDoc(firebase.doc(firebase.db, "vendors", vendor.id));
            showToast("Vendor deleted");
        }
    }
}

async function handlePaymentAction(event) {
    const button = event.target.closest("[data-action='delete-payment']");
    if (!button) return;

    const confirmed = window.confirm("Delete this payment record?");
    if (confirmed) {
        if (!ensureFirebaseReady()) return;

        await firebase.deleteDoc(firebase.doc(firebase.db, "payments", button.dataset.id));
        showToast("Payment deleted");
    }
}

function ensureFirebaseReady() {
    if (firebase) return true;
    showToast("Firebase is still loading. Try again in a moment.");
    return false;
}

function setBusy(form, busy) {
    form.querySelectorAll("button, input, select, textarea").forEach((field) => {
        field.disabled = busy;
    });
}

function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.remove("hidden");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => els.toast.classList.add("hidden"), 2600);
}

function formatMoney(value) {
    return money.format(Number(value || 0)).replace("MYR", "RM");
}

function normalizeEvents(items) {
    const fallbackEvents = [
        {
            name: "Engagement Day",
            icon: "💍",
            date: "2026-12-19",
            venue: "Aina's House",
            time: "8-11pm",
            startTime: "20:00"
        },
        {
            name: "Nikah Day",
            icon: "💍✨",
            date: "2027-04-02",
            venue: "Lantera Cahaya SPK",
            time: "7-11pm",
            startTime: "19:00"
        },
        {
            name: "Majlis Sanding",
            icon: "🤵‍♂️👰‍♀️",
            date: "2027-04-03",
            venue: "Grand Asiana Hall, PJ",
            time: "11am-4pm",
            startTime: "11:00"
        },
        {
            name: "Majlis Tandang",
            icon: "🤵‍♂️👰‍♀️✨",
            date: "2027-04-11",
            venue: "Magica Autumn, PICC",
            time: "11am-4pm",
            startTime: "11:00"
        }
    ];
    const defaults = state.events.length >= 4 ? state.events : fallbackEvents;
    const source = Array.isArray(items) ? items : [];

    return Array.from({ length: 4 }, (_, index) => {
        const event = source[index] || {};
        const fallback = defaults[index] || defaults[0];
        return {
            name: event?.name || fallback.name || `Event ${index + 1}`,
            icon: event?.icon || fallback.icon || getEventIcon(event?.name || fallback.name),
            date: isValidDateValue(event?.date) ? event.date : fallback.date,
            venue: event?.venue || fallback.venue || "",
            time: event?.time || fallback.time || "",
            startTime: event?.startTime || fallback.startTime || "00:00"
        };
    });
}

function isValidDateValue(value) {
    return Boolean(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function isSameDate(value, date) {
    if (!isValidDateValue(value)) return false;
    return value === getLocalDateValue(date);
}

function getLocalDateValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getEventIcon(name = "") {
    const normalized = String(name).toLowerCase();
    if (normalized.includes("engagement")) return "💍";
    if (normalized.includes("nikah")) return "💍✨";
    if (normalized.includes("tandang")) return "🤵‍♂️👰‍♀️✨";
    if (normalized.includes("sanding") || normalized.includes("wedding")) return "🤵‍♂️👰‍♀️";
    return "✨";
}

function formatWeekday(value) {
    if (!isValidDateValue(value)) return "Next event";
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-MY", {
        weekday: "long"
    });
}

function formatDate(value) {
    if (!isValidDateValue(value)) return "No date";
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function cleanFileName(name) {
    return name.replace(/[^a-z0-9._-]/gi, "_").toLowerCase();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
    return escapeHtml(value);
}
