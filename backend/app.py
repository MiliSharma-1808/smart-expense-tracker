from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import os
from model import predict_expense

app = Flask(__name__)
CORS(app)

# ================= DATABASE =================
def get_db():
    conn = sqlite3.connect("expense_tracker.db")
    conn.row_factory = sqlite3.Row
    return conn

# ================= CREATE TABLE =================
def create_table():
    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL,
            category TEXT,
            date TEXT
        )
    """)

    db.commit()
    cursor.close()
    db.close()

create_table()

# ================= PAGE ROUTES =================
@app.route('/')
def home():
    return render_template("login.html")

@app.route('/login')
def login_page():
    return render_template("login.html")

@app.route('/register')
def register_page():
    return render_template("register.html")

@app.route('/dashboard')
def dashboard_page():
    return render_template("dashboard.html")

@app.route('/analytics')
def analytics_page():
    return render_template("analytics.html")

@app.route('/budget')
def budget_page():
    return render_template("budget.html")

@app.route('/history')
def history_page():
    return render_template("history.html")

@app.route('/add_expense_page')
def add_expense_page():
    return render_template("add_expense.html")

# ================= ADD EXPENSE =================
@app.route('/add_expense', methods=['POST'])
def add_expense():

    data = request.json

    amount = data.get('amount')
    category = data.get('category')

    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO expenses (amount, category, date)
        VALUES (?, ?, DATE('now'))
    """, (amount, category))

    db.commit()

    cursor.close()
    db.close()

    return jsonify({"message": "Expense added successfully"})

# ================= GET EXPENSES =================
@app.route('/get_expenses', methods=['GET'])
def get_expenses():

    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        SELECT id, amount, category, date
        FROM expenses
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    data = []

    for row in rows:
        data.append({
            "id": row[0],
            "amount": row[1],
            "category": row[2],
            "date": row[3]
        })

    cursor.close()
    db.close()

    return jsonify(data)

# ================= DELETE EXPENSE =================
@app.route('/delete_expense/<int:id>', methods=['DELETE'])
def delete_expense(id):

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        "DELETE FROM expenses WHERE id = ?",
        (id,)
    )

    db.commit()

    cursor.close()
    db.close()

    return jsonify({"message": "Deleted successfully"})

# ================= PREDICTION =================
@app.route('/predict', methods=['GET'])
def predict():

    result = predict_expense()

    return jsonify({"prediction": result})

# ================= RUN =================
if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port
    )