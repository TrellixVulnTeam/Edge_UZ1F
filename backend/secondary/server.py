from flask import Flask, request, send_from_directory, json, make_response
from flask_cors import CORS
import os
import shutil
import training_model
import prediction_model
import test
import sys

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

@app.route('/api/predict-model')
def predict_model():
    return prediction_model.model()

@app.route('/api/train-model', methods=['POST'])
def train_model():
    body = request.form

    print(body, sys.stdout)
    
    results = make_response(training_model.model(body))
    results.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    results.headers.add('Access-Control-Allow-Credentials', 'true')

    try:
        return results
    except Exception:  
        return "Error", 400

@app.route('/api/test', methods=['POST'])
def test_model():

    return test.model()

@app.route('/api/predict-model', methods=['POST'])
def prediction_model():
    body = request.form
    
    results = make_response(prediction_model.model(body))
    results.headers.add('Access-Control-Allow-Origin', '*')
    return results

@app.route('/api/file/upload-image', methods = ['POST'])
def upload_image():
    images = request.files.getlist("data[]")
    assignedLabels = request.form.getlist("labels[]")
    os.makedirs('files/' + request.form['id'])
    os.makedirs('files/' + request.form['id'] + '/images')
    os.makedirs('files/' + request.form['id'] + '/no-label')
    labels = []

    for label in assignedLabels:
        os.makedirs('files/' + request.form['id'] + '/images/' + label)

    for i in range(len(images)):
        labels.append({
            'filename': i,
            'label': assignedLabels[i]
        }) 
        images[i].save('files/{}/images/{}/{}.jpg'.format(request.form['id'], assignedLabels[i], i))
    
    with open('files/{}/labels.json'.format(request.form['id']), 'w') as outfile:
        json.dump(labels, outfile)

    return "OK"

@app.route('/api/file/delete-image', methods = ['POST'])
def delete_image():
    if request.form['label'] == "No label":
        os.remove('files/{}/no-label/{}.jpg'.format(request.form['id'], request.form['filename']))
    else:
        os.remove('files/{}/images/{}/{}.jpg'.format(request.form['id'], request.form['label'], request.form['filename']))

    with open('files/{}/labels.json'.format(request.form['id'])) as infile:
        labels = json.load(infile)

    labels.pop(int(request.form['index']))

    with open('files/{}/labels.json'.format(request.form['id']), 'w') as outfile:
        json.dump(labels, outfile)

    return "OK"

@app.route('/api/file/replace-image', methods = ['POST'])
def replace_image():
    images = request.files.getlist("data[]")
    assignedLabels = request.form.getlist("labels[]")
    os.remove('files/{}'.format(request.form['id']))
    os.makedirs('files/' + request.form['id'])
    os.makedirs('files/' + request.form['id'] + '/images')
    labels = []

    for label in assignedLabels:
        os.makedirs('files/' + request.form['id'] + '/images/' + label)

    for i in range(len(images)):
        labels.append({
            'filename': i,
            'label': assignedLabels[i]
        }) 
        images[i].save('files/{}/images/{}/{}.jpg'.format(request.form['id'], assignedLabels[i], i))
    
    with open('files/{}/labels.json'.format(request.form['id']), 'w') as outfile:
        json.dump(labels, outfile)

    return "OK"

@app.route('/api/file/append-image', methods = ['POST'])
def append_image():
    images = request.files.getlist("data[]")
    filenames = request.form.getlist("filenames[]")
    assignedLabels = request.form.getlist("labels[]")
    labels = []

    with open('files/{}/labels.json'.format(request.form['id'])) as infile:
        previous = json.load(infile)
    
    for i in range(len(filenames)):
        labels.append({
            'filename': filenames[i],
            'label': assignedLabels[i]
        })
        images[i].save('files/{}/images/{}/{}.jpg'.format(request.form['id'], assignedLabels[i], filenames[i]))

    previous.extend(labels)
    
    with open('files/{}/labels.json'.format(request.form['id']), 'w') as outfile:
        json.dump(previous, outfile)

    return "OK"

@app.route('/api/file/update-image', methods = ['POST'])
def update_image():
    if request.form['oldLabel'] == "No label":
        os.rename('files/{}/no-label/{}.jpg'.format(request.form['id'], request.form['filename']),
            'files/{}/images/{}/{}.jpg'.format(request.form['id'], request.form['newLabel'], request.form['filename']))
    elif request.form['newLabel'] == "No label":
        os.rename('files/{}/images/{}/{}.jpg'.format(request.form['id'], request.form['oldLabel'], request.form['filename']),
            'files/{}/no-label/{}.jpg'.format(request.form['id'], request.form['filename']))
    else:
        os.rename('files/{}/images/{}/{}.jpg'.format(request.form['id'], request.form['oldLabel'], request.form['filename']),
            'files/{}/images/{}/{}.jpg'.format(request.form['id'], request.form['newLabel'], request.form['filename']))

    with open('files/{}/labels.json'.format(request.form['id'])) as infile:
        previous = json.load(infile)

    previous[int(request.form['index'])]['label'] = request.form['newLabel']
    
    with open('files/{}/labels.json'.format(request.form['id']), 'w') as outfile:
        json.dump(previous, outfile)

    return "OK"

@app.route('/api/file/add-label', methods = ['POST'])
def add_label():
    os.makedirs('files/{}/images/{}'.format(request.form['id'], request.form['label']))

    return "OK"

@app.route('/api/file/delete-label', methods = ['POST'])
def delete_label():
    with open('files/{}/labels.json'.format(request.form['id'])) as infile:
        previous = json.load(infile)
    
    for image in previous:
        if image['label'] == request.form['label']:
            os.rename('files/{}/images/{}/{}.jpg'.format(request.form['id'], request.form['label'], image['filename']),
                'files/{}/no-label/{}.jpg'.format(request.form['id'], image['filename']))

            image['label'] = "No label"

    with open('files/{}/labels.json'.format(request.form['id']), 'w') as outfile:
        json.dump(previous, outfile)

    os.rmdir('files/{}/images/{}'.format(request.form['id'], request.form['label']))
            
    return "OK"

@app.route('/api/file/remove-dataset', methods = ['POST'])
def remove_file():
    shutil.rmtree('files/{}'.format(request.form['id']))
    
    return "OK"

@app.route('/api/file/remove-workspace', methods = ['POST'])
def remove_model():
    shutil.rmtree('models/{}'.format(request.form['id']))
    
    return "OK"

@app.route('/files/<path:path>')
def get_data(path):
    file = send_from_directory('files', path)
    file.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')

    return file

if __name__ == "__main__":
    app.run(debug=True)