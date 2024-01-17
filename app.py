"""
Back-end for communicating with yfinance api to collect real time data. 
"""
import yfinance as yf
from flask import request, render_template, jsonify, Flask
import pandas as pd

app = Flask(__name__, template_folder='templates')

#default route
@app.route('/')
def index():
    return render_template('index.html')

#get stock ticker from this function 
@app.route('/retrieve_stock_data', methods=['POST'])
def retrieve_stock_data():
    ticker = request.get_json()['ticker']
    data = yf.Ticker(ticker).history(period='1mo')

    #Create data that will be used in the chart. 
    df = []

    dates = data.index.tolist()

    for i in range(len(dates)):
        n = data.iloc[i]
        d = {'date':dates[i], 'price':n.Open}
        h = {'date':dates[i], 'price':n.Close}
        df.append(d)
        df.append(h)
    

    #return the data as a dictionary object
    #Going to use this to compare the opening price to the current price. 
    return jsonify({'currentPrice': data.iloc[-1].Close, 
                    'openPrice':data.iloc[-1].Open, 
                    'df': df})

if __name__=='__main__':
    app.run(debug=True)

