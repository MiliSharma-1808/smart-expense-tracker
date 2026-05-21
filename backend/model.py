import sqlite3
import pandas as pd
import numpy as np

# ================= DATABASE =================
def get_db():
    conn = sqlite3.connect("expense_tracker.db")
    return conn

# ================= PREDICTION =================
def predict_expense():

    try:

        db = get_db()

        query = """
            SELECT amount, date
            FROM expenses
        """

        df = pd.read_sql_query(query, db)

        db.close()

        # No data
        if df.empty:
            return 0

        # Ensure datetime format
        df["date"] = pd.to_datetime(df["date"])

        # Create month column
        df["month"] = df["date"].dt.to_period("M")

        # Group monthly expenses
        monthly = df.groupby("month")["amount"].sum().reset_index()

        # Create numeric month index
        monthly["month_index"] = np.arange(len(monthly))

        # If only one month data
        if len(monthly) == 1:
            return float(monthly["amount"].iloc[0])

        # Linear trend prediction
        x = monthly["month_index"]
        y = monthly["amount"]

        # Slope calculation
        slope = np.polyfit(x, y, 1)[0]

        # Last month value
        last_value = y.iloc[-1]

        # Predict next month
        prediction = last_value + slope

        # Prevent negative prediction
        if prediction < 0:
            prediction = y.mean()

        return round(float(prediction), 2)

    except Exception as e:

        print("ML ERROR:", e)

        return 0
