const state = {
    vendors: [],
    payments: [],
    events: [
        {
            name: "Engagement Day",
            icon: "💍",
            date: "2027-03-19",
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
    checklistItems: [],
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
        "vendorEvent",
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
        "checklistProgress",
        "checklistProgressBar",
        "checklistProgressText",
        "checklistSections",
        "statisticsContent",
        "checklistModal",
        "checklistForm",
        "checklistItemId",
        "checklistTask",
        "checklistSection",
        "checklistOwner",
        "checklistNote",
        "deleteChecklistItemButton",
        "celebrationLayer",
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
    document.getElementById("addChecklistItemButton").addEventListener("click", () => openChecklistModal());
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
    els.checklistForm.addEventListener("submit", saveChecklistItem);
    els.deleteChecklistItemButton.addEventListener("click", deleteChecklistItem);
    els.eventsForm.addEventListener("submit", saveEvents);
    els.hasSchedule?.addEventListener("change", toggleScheduleBuilder);
    els.addScheduleButton?.addEventListener("click", () => addScheduleRow());
    els.scheduleRows?.addEventListener("click", handleScheduleRowAction);

    els.vendorList.addEventListener("click", handleVendorAction);
    els.paymentList.addEventListener("click", handlePaymentAction);
    els.checklistSections.addEventListener("click", handleChecklistAction);

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

    firebase.onSnapshot(firebase.collection(firebase.db, "checklistItems"), (snapshot) => {
        state.checklistItems = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        state.checklistItems.sort((a, b) => Number(a.completed) - Number(b.completed) || String(a.task || "").localeCompare(String(b.task || "")));
        render();
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
    renderChecklist();
    renderStatistics();
    fillPaymentVendorOptions();
}

function renderStatistics() {
    if (!els.statisticsContent) return;

    if (!state.payments.length) {
        els.statisticsContent.innerHTML = `<div class="empty-state">Record payments to see your wedding spending trends.</div>`;
        return;
    }

    const people = getPersonTotals();
    const categories = getCategoryTotals();
        const events = getEventTotals();
    const months = getMonthlyTotals();
        const upcoming = getUpcomingPayments();
    const total = people.Haziq + people.Aina;
    const personSlices = [
        { label: "Haziq", value: people.Haziq, color: "#247c75" },
        { label: "Aina", value: people.Aina, color: "#c45478" }
    ];

    els.statisticsContent.innerHTML = `
        <article class="stats-card">
            <div class="stats-card-head"><div><h3>Who has paid</h3><p>Shared payments are split evenly.</p></div><strong>${formatMoney(total)}</strong></div>
            ${renderDonut(personSlices, total, "Total paid")}
        </article>
        <article class="stats-card">
            <div class="stats-card-head"><div><h3>Paid by category</h3><p>Based on each vendor's category.</p></div></div>
            ${renderBreakdown(categories, total)}
        </article>
        <article class="stats-card">
            <div class="stats-card-head"><div><h3>Paid by event</h3><p>Assign an event when editing a vendor.</p></div></div>
            ${renderBreakdown(events, total)}
        </article>
        <article class="stats-card">
            <div class="stats-card-head"><div><h3>Upcoming payments</h3><p>Scheduled balances and vendor due dates.</p></div></div>
            ${renderUpcomingPayments(upcoming)}
        </article>
        <article class="stats-card">
            <div class="stats-card-head"><div><h3>Monthly spending</h3><p>Your last six months with payments.</p></div></div>
            ${renderMonthlyBars(months)}
        </article>`;
}

function getPersonTotals() {
    return state.payments.reduce((totals, payment) => {
        const amount = Number(payment.amount || 0);
        if (payment.paidBy === "Aina") totals.Aina += amount;
        else if (payment.paidBy === "Both") {
            totals.Haziq += amount / 2;
            totals.Aina += amount / 2;
        } else totals.Haziq += amount;
        return totals;
    }, { Haziq: 0, Aina: 0 });
}

function getCategoryTotals() {
    const totals = state.payments.reduce((result, payment) => {
        const vendor = getVendorById(payment.vendorId);
        const category = vendor?.category || "Other";
        result[category] = (result[category] || 0) + Number(payment.amount || 0);
        return result;
    }, {});
    return Object.entries(totals)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
}

function getEventTotals() {
    const totals = state.payments.reduce((result, payment) => {
        const vendor = getVendorById(payment.vendorId);
        const event = vendor?.event || "Shared";
        result[event] = (result[event] || 0) + Number(payment.amount || 0);
        return result;
    }, {});
    return Object.entries(totals)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
}

function getUpcomingPayments() {
    const paidByVendor = getPaidByVendor();
    return state.vendors.flatMap((vendor) => {
        const quote = Number(vendor.quote || 0);
        const paid = Number(paidByVendor[vendor.id] || 0);
        const balance = Math.max(quote - paid, 0);
        if (!balance) return [];

        const schedule = Array.isArray(vendor.schedule) ? vendor.schedule : [];
        let covered = paid;
        const scheduled = schedule
            .map((item) => {
                const amount = Number(item.amount || 0);
                const remaining = Math.max(amount - Math.min(amount, covered), 0);
                covered = Math.max(covered - amount, 0);
                return { vendor: vendor.name || "Untitled vendor", event: vendor.event || "Shared", amount: remaining, date: item.dueDate || "", details: item.details || "" };
            })
            .filter((item) => item.amount > 0 && item.date);

        if (scheduled.length) return scheduled;
        return vendor.dueDate ? [{ vendor: vendor.name || "Untitled vendor", event: vendor.event || "Shared", amount: balance, date: vendor.dueDate, details: "Vendor balance" }] : [];
    }).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
}

function getMonthlyTotals() {
    const totals = state.payments.reduce((result, payment) => {
        const month = String(payment.date || "").slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(month)) return result;
        result[month] = (result[month] || 0) + Number(payment.amount || 0);
        return result;
    }, {});
    return Object.entries(totals)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, value]) => ({ month, value }));
}

function renderDonut(items, total, label) {
    const activeItems = items.filter((item) => item.value > 0);
    if (!total || !activeItems.length) return `<div class="stats-empty">No paid amounts to chart yet.</div>`;
    let current = 0;
    const slices = activeItems.map((item) => {
        const start = current;
        current += (item.value / total) * 100;
        return `${item.color} ${start}% ${current}%`;
    });
    return `<div class="donut-layout"><div class="donut" style="--chart:conic-gradient(${slices.join(",")})"><div><strong>${formatMoney(total)}</strong><span>${label}</span></div></div>${renderLegend(items, total)}</div>`;
}

function renderLegend(items, total) {
    return `<div class="stats-legend">${items.map((item) => {
        const percent = total ? Math.round((item.value / total) * 100) : 0;
        return `<div><span class="legend-dot" style="--dot:${item.color || "#247c75"}"></span><span>${escapeHtml(item.label)}</span><strong>${formatMoney(item.value)} · ${percent}%</strong></div>`;
    }).join("")}</div>`;
}

function renderBreakdown(items, total) {
    const colors = ["#247c75", "#c45478", "#7d68b1", "#d28a38", "#4d84b5", "#7c9967", "#a75d91", "#6b7784"];
    if (!items.length) return `<div class="stats-empty">No category data yet.</div>`;
    return `<div class="category-breakdown">${items.map((item, index) => {
        const percent = total ? (item.value / total) * 100 : 0;
        return `<div class="category-row"><div><span class="legend-dot" style="--dot:${colors[index % colors.length]}"></span><strong>${escapeHtml(item.label)}</strong><span>${formatMoney(item.value)} · ${Math.round(percent)}%</span></div><div class="category-track"><div style="width:${percent}%;background:${colors[index % colors.length]}"></div></div></div>`;
    }).join("")}</div>`;
}

function renderMonthlyBars(items) {
    if (!items.length) return `<div class="stats-empty">No dated payments to chart yet.</div>`;
    const maximum = Math.max(...items.map((item) => item.value), 1);
    return `<div class="monthly-bars">${items.map((item) => {
        const height = Math.max((item.value / maximum) * 100, 5);
        const label = new Date(`${item.month}-01T00:00:00`).toLocaleDateString("en-MY", { month: "short" });
        return `<div class="month-bar"><strong>${formatMoney(item.value)}</strong><div class="month-bar-column"><div style="height:${height}%"></div></div><span>${label}</span></div>`;
    }).join("")}</div>`;
}

function renderUpcomingPayments(items) {
    if (!items.length) return `<div class="stats-empty">Add due dates or a payment schedule to see what is coming up.</div>`;
    const today = getLocalDateValue(new Date());
    return `<div class="upcoming-list">${items.map((item) => {
        const isOverdue = item.date < today;
        return `<div class="upcoming-item ${isOverdue ? "is-overdue" : ""}"><div class="upcoming-date"><strong>${formatDate(item.date)}</strong><span>${isOverdue ? "Overdue" : item.event}</span></div><div><strong>${escapeHtml(item.vendor)}</strong><span>${escapeHtml(item.details || "Payment due")}</span></div><b>${formatMoney(item.amount)}</b></div>`;
    }).join("")}</div>`;
}

function renderChecklist() {
    const sections = ["Nikah", "Sanding", "Tandang"];
    const total = state.checklistItems.length;
    const completed = state.checklistItems.filter((item) => item.completed).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    els.checklistProgress.textContent = `${completed} of ${total} complete`;
    els.checklistProgressBar.style.width = `${percent}%`;
    els.checklistProgressText.textContent = total ? `${percent}% ready for the big day` : "Add your first task whenever you're ready.";
    els.checklistSections.innerHTML = sections.map((section) => {
        const items = state.checklistItems.filter((item) => item.section === section);
        const done = items.filter((item) => item.completed).length;
        const sectionPercent = items.length ? Math.round((done / items.length) * 100) : 0;
        return `<section class="checklist-section section-${section.toLowerCase()}"><div class="checklist-section-head"><div class="section-label"><h3>${section}</h3><span>${done}/${items.length} completed</span><div class="section-progress" aria-label="${section} ${sectionPercent}% complete"><div style="width:${sectionPercent}%"></div></div></div><button type="button" class="section-add" data-action="add-checklist" data-section="${section}" aria-label="Add ${section} task">+</button></div><div class="task-list">${items.length ? items.map(renderChecklistItem).join("") : `<div class="checklist-empty">No tasks yet — add the first one.</div>`}</div></section>`;
    }).join("");
}

function renderChecklistItem(item) {
    const ownerClass = item.owner === "Haziq" ? "haziq" : item.owner === "Aina" ? "aina" : "together";
    return `<article class="task-item ${item.completed ? "is-complete" : ""}"><button class="task-check" type="button" data-action="toggle-checklist" data-id="${item.id}" aria-label="Toggle task" aria-pressed="${Boolean(item.completed)}">${item.completed ? "✓" : ""}</button><div class="task-content"><h4>${escapeHtml(item.task || "Untitled task")}</h4><div class="task-meta"><span class="owner-tag ${ownerClass}">${escapeHtml(item.owner || "Haziq & Aina")}</span>${item.note ? `<span class="task-note">${escapeHtml(item.note)}</span>` : ""}</div></div><button class="task-edit" type="button" data-action="edit-checklist" data-id="${item.id}" aria-label="Edit task">•••</button></article>`;
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

function categoryClass(category) {
    return String(category || "Other").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "other";
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
            <article class="vendor-card vendor-category-${categoryClass(vendor.category)}">
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
            event: els.vendorEvent.value,
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
        launchPaymentCelebration();
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

async function saveChecklistItem(event) {
    event.preventDefault();
    if (!ensureFirebaseReady()) return;
    const id = els.checklistItemId.value;
    const data = { task: els.checklistTask.value.trim(), section: els.checklistSection.value, owner: els.checklistOwner.value, note: els.checklistNote.value.trim(), updatedAt: firebase.serverTimestamp() };
    setBusy(els.checklistForm, true);
    try {
        if (id) {
            await firebase.updateDoc(firebase.doc(firebase.db, "checklistItems", id), data);
            showToast("Checklist task updated");
        } else {
            await firebase.addDoc(firebase.collection(firebase.db, "checklistItems"), { ...data, completed: false, createdAt: firebase.serverTimestamp() });
            showToast("Checklist task added");
        }
        closeModal("checklistModal");
        els.checklistForm.reset();
        els.checklistItemId.value = "";
    } catch (error) {
        showToast(error.message || "Could not save checklist task");
    } finally {
        setBusy(els.checklistForm, false);
    }
}

async function deleteChecklistItem() {
    const id = els.checklistItemId.value;
    if (!id || !ensureFirebaseReady()) return;
    if (!window.confirm("Delete this checklist task?")) return;
    try {
        await firebase.deleteDoc(firebase.doc(firebase.db, "checklistItems", id));
        closeModal("checklistModal");
        els.checklistForm.reset();
        els.checklistItemId.value = "";
        showToast("Checklist task deleted");
    } catch (error) {
        showToast(error.message || "Could not delete checklist task");
    }
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
    els.vendorEvent.value = vendor?.event || "Shared";
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

function openChecklistModal(item = null, section = "Nikah") {
    els.checklistForm.reset();
    els.checklistItemId.value = item?.id || "";
    els.checklistTask.value = item?.task || "";
    els.checklistSection.value = item?.section || section;
    els.checklistOwner.value = item?.owner || "Haziq & Aina";
    els.checklistNote.value = item?.note || "";
    els.deleteChecklistItemButton.classList.toggle("hidden", !item);
    document.getElementById("checklistModalTitle").textContent = item ? "Edit checklist task" : "Add checklist task";
    openModal("checklistModal");
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

async function handleChecklistAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    if (button.dataset.action === "add-checklist") {
        openChecklistModal(null, button.dataset.section);
        return;
    }
    const item = state.checklistItems.find((entry) => entry.id === button.dataset.id);
    if (!item) return;
    if (button.dataset.action === "toggle-checklist") {
        if (!ensureFirebaseReady()) return;
        try {
            await firebase.updateDoc(firebase.doc(firebase.db, "checklistItems", item.id), { completed: !item.completed, updatedAt: firebase.serverTimestamp() });
            showToast(item.completed ? "Task marked as to do" : "Task completed");
        } catch (error) { showToast(error.message || "Could not update checklist task"); }
    }
    if (button.dataset.action === "edit-checklist") openChecklistModal(item);
}

function launchPaymentCelebration() {
    if (!els.celebrationLayer) return;
    els.celebrationLayer.replaceChildren();
    const colors = ["#f4c95d", "#ee7f97", "#70c7bd", "#fff", "#c9435c"];
    for (let index = 0; index < 22; index += 1) {
        const spark = document.createElement("span");
        spark.className = "celebration-spark";
        spark.style.setProperty("--x", `${(Math.random() - .5) * 280}px`);
        spark.style.setProperty("--y", `${-80 - Math.random() * 180}px`);
        spark.style.setProperty("--delay", `${Math.random() * .22}s`);
        spark.style.setProperty("--color", colors[index % colors.length]);
        els.celebrationLayer.appendChild(spark);
    }
    window.setTimeout(() => els.celebrationLayer.replaceChildren(), 1300);
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
