const state = {
    vendors: [],
    payments: [],
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
        "vendorNotes",
        "paymentModal",
        "paymentForm",
        "paymentVendor",
        "paymentAmount",
        "paymentDate",
        "paymentMethod",
        "receiptFile",
        "paymentNote",
        "savingsForm",
        "savingsGoal",
        "savingsCurrent",
        "monthlyTarget",
        "savingsRemaining",
        "savingsPercent",
        "savingsProgress",
        "savingsHint",
        "toast",
        "checklistProgress",
        "checklistProgressBar",
        "checklistProgressText",
        "checklistSections",
        "checklistModal",
        "checklistForm",
        "checklistItemId",
        "checklistTask",
        "checklistSection",
        "checklistOwner",
        "checklistNote"
    ].forEach((id) => {
        els[id] = document.getElementById(id);
    });
}

function bindEvents() {
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.addEventListener("click", () => switchScreen(tab.dataset.screen));
    });

    document.getElementById("addVendorButton").addEventListener("click", () => openVendorModal());
    document.getElementById("addPaymentButton").addEventListener("click", () => openPaymentModal());
    document.getElementById("quickAddPayment").addEventListener("click", () => openPaymentModal());
    document.getElementById("addChecklistItemButton").addEventListener("click", () => openChecklistModal());

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
    els.paymentDate.value = new Date().toISOString().slice(0, 10);
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
    renderVendors();
    renderPayments();
    renderSavings();
    renderChecklist();
    fillPaymentVendorOptions();
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
        return `
            <section class="checklist-section">
                <div class="checklist-section-head">
                    <div><h3>${section}</h3><span>${done}/${items.length} completed</span></div>
                    <button type="button" class="section-add" data-action="add-checklist" data-section="${section}" aria-label="Add ${section} task">+</button>
                </div>
                <div class="task-list">
                    ${items.length ? items.map(renderChecklistItem).join("") : `<div class="checklist-empty">No tasks yet — add the first one.</div>`}
                </div>
            </section>`;
    }).join("");
}

function renderChecklistItem(item) {
    const ownerClass = item.owner === "Haziq" ? "haziq" : item.owner === "Aina" ? "aina" : "together";
    return `
        <article class="task-item ${item.completed ? "is-complete" : ""}">
            <button class="task-check" type="button" data-action="toggle-checklist" data-id="${item.id}" aria-label="Mark ${escapeAttr(item.task || "task")} as ${item.completed ? "incomplete" : "complete"}" aria-pressed="${Boolean(item.completed)}">${item.completed ? "✓" : ""}</button>
            <div class="task-content">
                <h4>${escapeHtml(item.task || "Untitled task")}</h4>
                <div class="task-meta"><span class="owner-tag ${ownerClass}">${escapeHtml(item.owner || "Haziq & Aina")}</span>${item.note ? `<span class="task-note">${escapeHtml(item.note)}</span>` : ""}</div>
            </div>
            <button class="task-edit" type="button" data-action="edit-checklist" data-id="${item.id}" aria-label="Edit ${escapeAttr(item.task || "task")}">•••</button>
        </article>`;
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
                ${vendor.dueDate ? `<span class="meta">Due ${formatDate(vendor.dueDate)}</span>` : ""}
                ${vendor.notes ? `<p class="notes">${escapeHtml(vendor.notes)}</p>` : ""}
                <div class="action-row">
                    <button type="button" data-action="pay" data-id="${vendor.id}">Pay</button>
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
            date: els.paymentDate.value || new Date().toISOString().slice(0, 10),
            method: els.paymentMethod.value,
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

async function saveChecklistItem(event) {
    event.preventDefault();
    if (!ensureFirebaseReady()) return;

    const id = els.checklistItemId.value;
    const data = {
        task: els.checklistTask.value.trim(),
        section: els.checklistSection.value,
        owner: els.checklistOwner.value,
        note: els.checklistNote.value.trim(),
        updatedAt: firebase.serverTimestamp()
    };

    setBusy(els.checklistForm, true);
    try {
        if (id) {
            await firebase.updateDoc(firebase.doc(firebase.db, "checklistItems", id), data);
            showToast("Checklist task updated");
        } else {
            await firebase.addDoc(firebase.collection(firebase.db, "checklistItems"), {
                ...data,
                completed: false,
                createdAt: firebase.serverTimestamp()
            });
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
    document.getElementById("checklistModalTitle").textContent = item ? "Edit checklist task" : "Add checklist task";
    openModal("checklistModal");
}

function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
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
            await firebase.updateDoc(firebase.doc(firebase.db, "checklistItems", item.id), {
                completed: !item.completed,
                updatedAt: firebase.serverTimestamp()
            });
            showToast(item.completed ? "Task marked as to do" : "Task completed");
        } catch (error) {
            showToast(error.message || "Could not update checklist task");
        }
    }

    if (button.dataset.action === "edit-checklist") {
        openChecklistModal(item);
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

function formatDate(value) {
    if (!value) return "No date";
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
