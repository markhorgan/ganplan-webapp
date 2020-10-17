## Setup

Requires Python 3 and Node to be installed.

### Setting up a virtual environment in Python

#### Using Venv

    python3 -m venv env
    source env/scripts/activate
    pip install -r requirements.txt

#### Using Pipenv

    pipenv shell
    pipenv install

### Install node modules

    npm install

## Running House GAN Test

    python src/house_gan/house_gan.py

Floorplan images will be outputting to the output folder.

## Start Server

    python src/app.py