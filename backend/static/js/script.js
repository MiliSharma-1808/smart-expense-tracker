// script.js

// ================= STORAGE =================
let users = JSON.parse(localStorage.getItem("users")) || [];
let budget = Number(localStorage.getItem("budget")) || 0;
let expenses = [];

// ================= HELPERS =================
function safeGet(id) {
    return document.getElementById(id);
}

function has(el) {
    return el !== null && el !== undefined;
}

// ================= AUTH =================
function register() {

    let user = safeGet("regUser")?.value.trim();
    let email = safeGet("regEmail")?.value.trim();
    let pass = safeGet("regPass")?.value.trim();

    if (!user || !email || !pass) {
        return alert("Fill all fields");
    }

    if (users.find(u => u.email === email)) {
        return alert("User already exists!");
    }

    users.push({ user, email, pass });

    localStorage.setItem(
        "users",
        JSON.stringify(users)
    );

    alert("Registered Successfully!");

    window.location.href = "/";
}

function login() {

    let email = safeGet("loginEmail")?.value;
    let pass = safeGet("loginPass")?.value;

    let user = users.find(
        u => u.email === email && u.pass === pass
    );

    if (!user) {
        return alert("Invalid credentials");
    }

    localStorage.setItem(
        "currentUser",
        JSON.stringify(user)
    );

    window.location.href = "/dashboard";
}

function logout() {

    localStorage.removeItem("currentUser");

    window.location.href = "/";
}

function checkLogin() {

    let user = localStorage.getItem("currentUser");

    let publicPages = [
        "/",
        "/login",
        "/register"
    ];

    if (!user &&
        !publicPages.includes(window.location.pathname)) {

        window.location.href = "/";
    }
}

// ================= DATE =================
function setTodayDate() {

    let dateInput = safeGet("date");

    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }
}

// ================= ADD EXPENSE =================
async function addExpense() {

    let amount =
        Number(safeGet("amount")?.value);

    let category =
        safeGet("category")?.value;

    if (!amount || !category) {
        return alert("Fill all fields");
    }

    try {

        let res = await fetch("/add_expense", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                amount,
                category
            })

        });

        let data = await res.json();

        alert(data.message);

        safeGet("amount").value = "";
        safeGet("category").value = "";

        await loadExpenses();

    } catch (err) {

        console.error(
            "Add expense error:",
            err
        );
    }
}

// ================= LOAD EXPENSES =================
async function loadExpenses() {

    try {

        let res = await fetch("/get_expenses");

        expenses = await res.json();

        if (!Array.isArray(expenses)) {
            expenses = [];
        }

        setTimeout(() => {

            if (safeGet("totalExpense")) {
                updateDashboard();
            }

            if (safeGet("totalSummary")) {
                loadAnalytics();
            }

            if (safeGet("pieChart")) {
                loadCharts();
            }

            if (safeGet("barChart")) {
                loadBarChart();
            }

            if (safeGet("insightText")) {
                generateInsights();
            }

            if (safeGet("expenseList")) {
                loadHistory();
            }

        }, 100);

    } catch (err) {

        console.error(
            "Load expenses failed:",
            err
        );

        expenses = [];
    }
}

// ================= HISTORY =================
function loadHistory() {

    let list = safeGet("expenseList");

    if (!list) return;

    list.innerHTML = "";

    if (!expenses.length) {

        list.innerHTML =
            "<p>No expenses found</p>";

        return;
    }

    expenses.forEach(e => {

        let card =
            document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <h4>${e.category}</h4>
            <p>₹ ${Number(e.amount || 0).toFixed(2)}</p>
            <small>${e.date || "No date"}</small>
            <button onclick="deleteExpense(${e.id})">
                Delete
            </button>
        `;

        list.appendChild(card);
    });
}

// ================= DELETE =================
async function deleteExpense(id) {

    try {

        await fetch(
            `/delete_expense/${id}`,
            { method: "DELETE" }
        );

        await loadExpenses();

    } catch (err) {

        console.error(err);
    }
}

// ================= DASHBOARD =================
function updateDashboard() {

    let total = expenses.reduce(
        (s, e) => s + Number(e.amount || 0),
        0
    );

    let totalEl = safeGet("totalExpense");

    if (totalEl) {
        totalEl.innerText = "₹" + total;
    }

    let status = safeGet("budgetStatus");

    if (!status) return;

    if (!budget || budget === 0) {

        status.innerText = "Not Set";
        status.style.color = "black";

    } else if (total > budget) {

        status.innerText =
            "⚠ Budget Exceeded!";

        status.style.color = "red";

    } else {

        status.innerText =
            "Within Budget";

        status.style.color = "green";
    }
}

// ================= SET BUDGET =================
function setBudget() {

    let input = safeGet("budgetInput");

    if (!input || !input.value) {

        alert("Enter budget");

        return;
    }

    budget = Number(input.value);

    localStorage.setItem(
        "budget",
        budget
    );

    let el = safeGet("currentBudget");

    if (el) {
        el.innerText = "₹ " + budget;
    }

    loadExpenses();
}

// ================= ANALYTICS =================
function loadAnalytics() {

    if (!expenses.length) return;

    let total = expenses.reduce(
        (s, e) => s + Number(e.amount || 0),
        0
    );

    let month =
        new Date().getMonth();

    let monthly = expenses
        .filter(e =>
            e.date &&
            new Date(e.date).getMonth() === month
        )
        .reduce(
            (s, e) => s + Number(e.amount || 0),
            0
        );

    let cat = {};

    expenses.forEach(e => {

        cat[e.category] =
            (cat[e.category] || 0) +
            Number(e.amount || 0);
    });

    let keys = Object.keys(cat);

    let top = keys.length
        ? keys.reduce((a, b) =>
            cat[a] > cat[b] ? a : b
        )
        : "-";

    safeGet("totalSummary").innerText =
        "₹" + total;

    safeGet("monthlySummary").innerText =
        "₹" + monthly;

    safeGet("topCategory").innerText =
        top;
}

// ================= PIE CHART =================
function loadCharts() {

    let canvas = safeGet("pieChart");

    if (!canvas || typeof Chart === "undefined") {
        console.log("Pie chart canvas not found");
        return;
    }

    if (!expenses.length) {
        console.log("No expenses available");
        return;
    }

    let data = {};

    expenses.forEach(e => {

        let category = e.category || "Other";
        let amt = Number(e.amount || 0);

        if (isNaN(amt)) return;

        data[category] =
            (data[category] || 0) + amt;
    });

    let labels = Object.keys(data);
    let values = Object.values(data);

    if (!labels.length) {
        console.log("No chart data");
        return;
    }

    if (window.pieChart instanceof Chart) {
        window.pieChart.destroy();
    }

    const ctx = canvas.getContext("2d");

    window.pieChart = new Chart(ctx, {

        type: "pie",

        data: {

            labels: labels,

            datasets: [{
                label: "Expenses",
                data: values
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false
        }
    });

    console.log("Pie chart loaded");
}
// ================= BAR CHART =================
function loadBarChart() {

    let canvas = safeGet("barChart");

    if (!canvas || typeof Chart === "undefined") {
        console.log("Bar chart canvas not found");
        return;
    }

    if (!expenses.length) {
        console.log("No expenses available");
        return;
    }

    let monthly = {};

    expenses.forEach(e => {

        let amt = Number(e.amount || 0);

        if (isNaN(amt)) return;

        // fallback if no date exists
        let month = "Current";

        if (e.date) {

            month = new Date(e.date)
                .toLocaleString("default", {
                    month: "short"
                });
        }

        monthly[month] =
            (monthly[month] || 0) + amt;
    });

    let labels = Object.keys(monthly);
    let values = Object.values(monthly);

    if (!labels.length) {
        console.log("No monthly data");
        return;
    }

    if (window.barChartInstance instanceof Chart) {
        window.barChartInstance.destroy();
    }

    const ctx = canvas.getContext("2d");

    window.barChartInstance = new Chart(ctx, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [{
                label: "Monthly Expenses",
                data: values
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false
        }
    });

    console.log("Bar chart loaded");
}
// ================= INSIGHTS =================
function generateInsights() {

    let el = safeGet("insightText");

    if (!el || !expenses.length) return;

    let cat = {};

    expenses.forEach(e => {

        cat[e.category] =
            (cat[e.category] || 0) +
            Number(e.amount || 0);
    });

    let keys = Object.keys(cat);

    if (!keys.length) {

        el.innerText =
            "No data available";

        return;
    }

    let top = keys.reduce((a, b) =>
        cat[a] > cat[b] ? a : b
    );

    el.innerText =
        `💡 You spend most on ${top}`;
}

// ================= PREDICTION =================
function getPrediction() {

    let result =
        safeGet("predictionResult");

    if (!expenses.length) {

        result.innerText =
            "No expense data available";

        return;
    }

    let total = expenses.reduce(
        (s, e) => s + Number(e.amount || 0),
        0
    );

    let avg =
        total / expenses.length;

    let prediction =
        avg * 30;

    result.innerText =
        "Predicted monthly spending: ₹" +
        prediction.toFixed(2);
}

// ================= INIT =================
document.addEventListener(
    "DOMContentLoaded",
    async () => {

        checkLogin();

        setTodayDate();

        await loadExpenses();
    }
);