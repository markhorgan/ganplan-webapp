#!/usr/bin/env python

from flask import Flask,render_template,request,jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')

def index():
    return render_template('index.html')

@app.route('/api/floorplans/reset', methods=['GET'])
        
def resetSelectedFloorplan():

    import json

    with open('./static/selected/selected.json', 'w') as outfile:
        json.dump({}, outfile)

    return {
        "status":"OK"
    }

@app.route('/api/floorplans', methods=['POST'])

def getFloorplans():

    from house_gan.house_gan import generate_floorplan_files
    import json

    request_data = request.get_json()

    nodes = request_data['nodes']
    edges = request_data['edges']

    response = generate_floorplan_files(nodes, edges)
    
    # write results to temp folder
    with open('./temp/data.json', 'w') as outfile:
        json.dump(response, outfile)

    imgURLS = []

    for i,d in enumerate(response):
        index = d['iteration']
        url = f'/static/imgs/floorplan_{index}.png'
        imgURLS.append(url)

    # return png urls
    return {
        "status": "OK",
        "data": imgURLS
    }

@app.route('/api/floorplans/select', methods=['POST'])

def getFloorplan():

    import json

    request_data = request.get_json()

    iteration = request_data['iteration']

    # JSON file 
    f = open ('./temp/data.json', "r") 
    
    # Reading from file 
    data = json.loads(f.read()) 
    
    def updateSelected(selectedFloorplan):
        with open('./static/selected/selected.json', 'w') as outfile:
            json.dump(selectedFloorplan, outfile)

    # Iterating through the json 
    for i,d in enumerate(data):
        if d['iteration'] == iteration:
            print(d)
            updateSelected(d)

            return {
                "status": "OK",
                "iteration": iteration
            }

@app.route('/api/floorplans/selected', methods=['GET'])

def getSelectedFloorplan():
    import json

    # JSON file 
    f = open ('./static/selected/selected.json', "r") 
    
    # Reading from file 
    data = json.loads(f.read())

    return {
        "status": "OK",
        "data": data
    }

if __name__ == '__main__':
    app.run(host="0.0.0.0",debug=True)