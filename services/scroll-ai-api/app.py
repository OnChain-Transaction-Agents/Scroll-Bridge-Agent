import numpy as np
from flask import Flask, abort, jsonify, request
import _pickle as pickle
from geopy import distance
import airportsdata
import json
from flask_cors import CORS
import csv

airports = airportsdata.load('IATA')

# pickled multiple regression model
model = pickle.load(open('model.pkl','rb'))
  
app = Flask(__name__)
CORS(app)

@app.route('/api/<currentGas>/<one>/<two>/<three>/<four>/<five>/<six>/<timestamp>', methods=['GET']) 
def make_predict(currentGas, one, two, three, four, five, six, timestamp):
    print(currentGas, one, two, three, four, five, six, timestamp)
    # test_value = np.array([[timestamp, six, five, four, three, two, one, current]])
    predictItems = [int(timestamp), int(six), int(five), int(four), int(three), int(two), int(one), int(currentGas)]
    input = np.array([predictItems])
    prediction = model.predict(input)
    output = prediction    
    op = [round(float(output), 2)]
    print(op)
    response = jsonify(results=op)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/', methods=['GET']) 
def Hello():
    data = "hello"
    response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
    return response


if __name__ == '__main__':
    app.run(port = 9000, debug = True)
