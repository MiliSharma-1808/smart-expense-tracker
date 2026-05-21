import mysql.connector
import pandas as pd
import numpy as np

def predict_expense():

    try:
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="Mil!1808",
            database="expense_tracker"
        )

        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT amount, date 
            FROM expenses
        """)

        data = cursor.fetchall()

        if not data:
            return 0

        df = pd.DataFrame(data)

        # ensure datetime format
        df["date"] = pd.to_datetime(df["date"])

        # create month column
        df["month"] = df["date"].dt.to_period("M")

        # group by month
        monthly = df.groupby("month")["amount"].sum().reset_index()

        # convert month to numeric index
        monthly["month_index"] = np.arange(len(monthly))

        # if only 1 month data → fallback
        if len(monthly) == 1:
            return float(monthly["amount"].iloc[0])

        # linear trend (simple ML logic)
        x = monthly["month_index"]
        y = monthly["amount"]

        # slope calculation
        slope = np.polyfit(x, y, 1)[0]

        # last value
        last_value = y.iloc[-1]

        # predict next month
        prediction = last_value + slope

        # safety check (no negative prediction)
        if prediction < 0:
            prediction = y.mean()

        return float(prediction)

    except Exception as e:
        print("ML ERROR:", e)
        return 0