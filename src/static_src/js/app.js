import GraphEditor from "./components/graph-editor";
import React, { Component } from 'react'

class App extends Component {

    constructor(props) {
        super(props);

        this.testGraph = false;
        this.testFloorplans = false;
        this.remoteUrl = false;
        this.urlPrefix = this.remoteUrl ? 'https://ganplan.emptybox.io' : '';
        this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        this.nodes = this.buildNodes();
        this.links = this.buildLinks();
        
        this.state = {
            floorplanImageUrls: [],
            selectedIndex: -1,
            spinnerVisible: false,
            nodesLength: this.nodes.length
        }

        this.reset = this.reset.bind(this);
        this.setNodesLength = this.setNodesLength.bind(this);
        this.generateFloorplans = this.generateFloorplans.bind(this);
        this.selectFloorplan = this.selectFloorplan.bind(this);
    }

    buildNodes() {
        if (this.testGraph) {
            return [0, 1, 2, 3, 5, 5, 6, 7, 8, 9].map((node, index) => {return {id: index, reflexive: false, roomIndex: node}});
        } else {
            return [];
        }
    }

    buildLinks() {
        if (this.testGraph) {
            return [[0, 1], [1, 2], [0, 2]].map(link => {return {source: this.nodes[link[0]], target: this.nodes[link[1]], left: false, right: true}});
        } else {
            return []
        }
    }

    buildFloorplanUrls() {
        if (this.testFloorplans) {
            const urls = [];
            for (let i = 0; i < 4; i++) {
                urls.push(`/static/images/floorplan_${i}.png`);
            }
            return urls;
        } else {
            return [];
        }
    }

    reset() {
        fetch(`${this.urlPrefix}/api/floorplans`, {
            headers: this.headers,
            method: 'DELETE'
        }).then(response => {
            this.setState({floorplanImageUrls: []});
        });
    }

    componentDidMount() {
        this.reset();
    }

    generateFloorplans() {
        if (this.nodes.length < 10) {
            window.alert("10 rooms are required to generate floorplans.");
        } else {
            this.setState({spinnerVisible: true});
            const tNodes = this.nodes.map(node => node.roomIndex);
            const tLinks = this.links.map(link => [link.source.index, link.target.index]);
            fetch(`${this.urlPrefix}/api/floorplans`, {
                headers: this.headers,
                method: 'POST',
                body: JSON.stringify({nodes: tNodes, edges: tLinks})
            }).then(response => {
                this.setState({spinnerVisible: false});
                if (response.ok) {
                    response.json().then(data => {
                        this.setState({
                            selectedIndex: -1,
                            floorplanImageUrls: data['data'].map(url => `${this.urlPrefix}${url}`)
                        });
                    });
                } else {
                    window.alert(`Unable to get floorplans from server - status code:${response.status}`);
                }
            });
        }
    } 

    selectFloorplan(index) {
        fetch(`${this.urlPrefix}/api/floorplans/select`, {
            headers: this.headers,
            method: 'POST',
            body: JSON.stringify({iteration: index})
        }).then(response => {
            if (response.ok) {
                this.setState({
                    selectedIndex: index
                });
            } else {
                window.alert(`Unable to select floorplan - status code:${response.status}`);
            }
        });
    }

    setNodesLength(nodesLength) {
        this.setState({nodesLength: nodesLength});
    }

    render() {
        return (
            <div>
                <header>
                    <h1>Gan Plan</h1>
                    <h2>Generates floorplans from a room graph using a Generative Adversarial Network trained on real floorplans.</h2>
                    <p>Click on the circles to the left to add rooms and then drag from one circle to another to link them together. To remove a room or link, click on it and then press the Delete key.</p>
                    <p>Press 'g' to generate a random set of rooms.</p>
                    <p>A minimum of 10 rooms is required.</p>
                </header>
                <GraphEditor height="450" nodes={this.nodes} setNodesLength={this.setNodesLength} links={this.links} reset={this.reset}/>
                <div className="button-outer">
                    <button className="button" onClick={this.generateFloorplans} disabled={this.state.nodesLength < 10}>Generate Floorplans</button>
                </div>
                <ul className="floorplans">
                    {this.state.floorplanImageUrls.map(function(url, index) {
                        return <li key={url}><a className={index === this.state.selectedIndex ? 'selected' : ''} href="javascript:;" onClick={() => this.selectFloorplan(index)}><img src={url}/></a></li>
                    }, this)}
                </ul>
                <div id="spinner" style={{display: this.state.spinnerVisible ? 'block' : 'none'}}>
                    <img src="/static/imgs/spinner.gif"/>
                </div>
            </div>
        )
    }
}

export default App;