from flask import Flask,render_template,request,jsonify
from flask_cors import CORS
import time
import json
import os
import glob
from house_gan.house_gan import generate_floorplan_files

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/floorplans', methods=['DELETE'])
def resetSelectedFloorplan():
    with open('static/selected/selected.json', 'w') as outfile:
        json.dump({}, outfile)

    return {
        "status":"OK"
    }

@app.route('/api/floorplans', methods=['POST'])
def getFloorplans():
    files = glob.glob('static/imgs/generated/*.png')
    print("files", files)

    for f in files:
        os.remove(f)

    files = glob.glob('static/imgs/generated/*.png')
    print("files-2", files)
    request_data = request.get_json()

    nodes = request_data['nodes']
    edges = request_data['edges']

    response = generate_floorplan_files(nodes, edges)
    
    # write results to temp folder
    with open('temp/data.json', 'w') as outfile:
        json.dump(response, outfile)

    imgURLS = []

    # adding parameter for cache busting
    t = int(round(time.time() * 1000))
    for i,d in enumerate(response):
        index = d['iteration']
        url = f'/static/imgs/generated/floorplan_{index}.png?t={t}'
        imgURLS.append(url)

    # return png urls
    return {
        "status": "OK",
        "data": imgURLS
    }

@app.route('/api/floorplans/select', methods=['POST'])
def getFloorplan():
    request_data = request.get_json()

    iteration = request_data['iteration']

    # JSON file 
    f = open ('temp/data.json', "r")
    
    # Reading from file 
    data = json.loads(f.read()) 
    
    def updateSelected(selectedFloorplan):
        with open('static/selected/selected.json', 'w') as outfile:
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
    # JSON file
    f = open ('static/selected/selected.json', "r")
    
    # Reading from file 
    data = json.loads(f.read())

    return {
        "status": "OK",
        "data": data
    }

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)