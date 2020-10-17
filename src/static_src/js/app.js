import GraphEditor from "./components/graph-editor";
import React, { useState } from 'react';

export default () => {
    const testGraph = false;
    const testFloorplans = false;
    const remoteUrl = false;

    const [nodes] = useState(buildNodes());
    const [links] = useState(buildLinks());
    const [floorplanImageUrls, setFloorplanImageUrls] = useState(buildFloorplanUrls());
    const [selectedIndex, setSelectedIndex] = useState(-1);
    
    const urlPrefix = remoteUrl ? 'https://optimus.emptybox.io' : '';
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    function buildNodes() {
        if (testGraph) {
            return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((node, index) => {return {id: index, reflexive: false, roomIndex: node}});
        } else {
            return [];
        }
        
    }

    function buildLinks() {
        if (testGraph) {
            return [[0, 1], [1, 2], [0, 2]].map(link => {return {source: nodes[link[0]], target: nodes[link[1]], left: false, right: true}});
        } else {
            return []
        }
    }

    function buildFloorplanUrls() {
        if (testFloorplans) {
            const urls = [];
            for (let i = 0; i < 4; i++) {
                urls.push(`/static/images/floorplan_${i}.png`);
            }
            return urls;
        } else {
            return [];
        }
    }

    deleteFloorplans();
    
    function deleteFloorplans() {
        fetch(`${urlPrefix}/api/floorplans`, {
            headers: headers,
            method: 'DELETE'
        });
    }

    function generateFloorplans() {
        const tNodes = nodes.map(node => node.roomIndex);
        const tLinks = links.map(link => [link.source.index, link.target.index]);
        fetch(`${urlPrefix}/api/floorplans`, {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({nodes: tNodes, edges: tLinks})
        }).then(response => {
            if (response.ok) {
                response.json().then(data => {
                    setFloorplanImageUrls(data['data'].map(url => `${urlPrefix}${url}`));
                });
            } else {
                window.alert(`Unable to get floorplans from server - status code:${response.status}`);
            }
        });
    } 

    function selectFloorplan(index) {
        fetch(`${urlPrefix}/api/floorplans/select`, {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({iteration: index})
        }).then(response => {
            if (response.ok) {
                setSelectedIndex(index);
            } else {
                window.alert(`Unable to select floorplan - status code:${response.status}`);
            }
        });
    }

    return (
        <div>
            <GraphEditor height="500" nodes={nodes} links={links}/>
            <div className="button-outer">
                <button className="button" onClick={generateFloorplans}>Generate Floorplans</button>
            </div>
            <ul className="floorplans">
                {floorplanImageUrls.map(function(url, index) {
                    return <li key={url}><a className={index === selectedIndex ? 'selected' : ''} href="javascript:;" onClick={() => selectFloorplan(index)}><img src={url}/></a></li>
                })}
            </ul>
        </div>
    )
}