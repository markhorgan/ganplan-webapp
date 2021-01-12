# Gan Plan

This is a web implmentation of [HouseGan](https://github.com/ennauata/housegan) where you can create a graph of rooms that describes what rooms are connected. It will then generate a variation of floor plans based on plans it has been trained with. It is designed to be used with this [Rhino plugin](https://github.com/demidimi/ganplanrhino) so you can modify the plan in Rhino. This project was developed during the [AEC Tech 2020 Hackathon](https://www.aectech.us/) by [Brandom Pachua](https://github.com/EmptyBox-Design), [Demi Chang](https://github.com/demidimi), [Mark Horgan](https://github.com/markhorgan), [Matthew Breau](https://github.com/anddoyoueverfeel) and [Leland Curtis](https://github.com/LelandCurtis).  

![Screenshot of Gan Plan](https://github.com/markhorgan/ganplan-webapp/raw/master/refs/screenshot.png)

## Setup

Requires Python 3.8 or greater and Node to be installed.

### Setting up a virtual environment in Python

    python3 -m venv env
    source env/scripts/activate
    pip install -r requirements.txt

### Install node modules

    npm install
    
### Download the dataset

Download the dataset from [here](https://www.dropbox.com/sh/p707nojabzf0nhi/AAB4UPwW0EgHhbQuHyq60tCKa?dl=0) and place `exp_demo_D_500000.pth` (the pre-trainined model) in the root of the project.

## Start Server

    cd src
    python3 app.py

