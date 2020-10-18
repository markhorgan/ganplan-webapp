# Gan Plan

This is a web implmentation of [HouseGan](https://github.com/ennauata/housegan) where you can create a graph of rooms that describes what rooms are connected. It will then generate a variation of floor plans based on plans it has been trained with. It is designed to be used with this [Rhino plugin](https://github.com/demidimi/ganplanrhino) so you can modify the plan in Rhino. This project was developed during the [AEC Tech 2020 Hackathon](https://www.aectech.us/) by [Brandom Pachua](https://github.com/EmptyBox-Design), [Demi Chang](https://github.com/demidimi), [Mark Horgan](https://github.com/markhorgan), [Matthew Breau](https://github.com/anddoyoueverfeel) and [Leland Curtis](https://github.com/LelandCurtis).  

![Screenshot of Gan Plan][https://github.com/markhorgan/ganplan-webapp/raw/master/refs/screenshot.png]

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

## Start Server

    cd src
    python app.py

## To build JS and CSS

    gulp build

While developing run the following and the browser should update when you edit JS or SCSS:

    gulp watch