import React, { Component } from 'react'

class GraphEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {width: window.innerWidth};
        this.svgRef = React.createRef();
    }

    componentDidMount() {
        this.createEditor();
    }

    componentDidUpdate() {
        //this.createEditor();
    }

    createEditor() {
        // http://bl.ocks.org/rkirsling/5001347

        const nodeRadius = 12;
        const roomData = [
            {name: 'Living room', roomIndex: 0},
            {name: 'Kitchen', roomIndex: 1},
            {name: 'Bedroom', roomIndex: 2},
            {name: 'Bathroom', roomIndex: 3},
            {name: 'Closet', roomIndex: 5},
            {name: 'Balcony', roomIndex: 6},
            {name: 'Corridor', roomIndex: 7},
            {name: 'Dining room', roomIndex: 8},
            {name: 'Laundry room', roomIndex: 9}
        ];
        const roomNames = [];
        roomData.forEach(room => {
            roomNames[room.roomIndex] = room.name;
        });
        const colors = ['#E32929', '#A4BC26', '#2B9C8D', '#4D99D6', '#A3A3A3', '#6C34BC', '#DD5498', '#38CC6E', '#D67827', '#FFDC2B'];

        // only respond once per keydown
        let lastKeyDown = -1;

        const props = this.props;
        const nodes = this.props.nodes;
        const links = this.props.links;

        const svg = d3.select(this.svgRef.current)
            .on('contextmenu', () => { 
                d3.event.preventDefault(); 
            });

        svg.append('rect')
            .attr('width', this.state.width)
            .attr('height', this.props.height)
            .attr('fill', '#ffffff')
            .on('mouseup', mouseup);

        // set up initial nodes and links
        //  - nodes are known by 'id', not by index in array.
        //  - reflexive edges are indicated on the node (as a bold black circle).
        //  - links are always source < target; edge directions are set by 'left' and 'right'.
        
        let lastNodeId = 2;

        // init D3 force layout
        const force = d3.forceSimulation()
            .force('link', d3.forceLink().id((d) => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('x', d3.forceX(this.state.width / 2))
            .force('y', d3.forceY(this.props.height / 2))
            .on('tick', tick);

        // init D3 drag support
        const drag = d3.drag()
            .filter(() => d3.event.button === 0 || d3.event.button === 2)
            .on('start', (d) => {
                if (!d3.event.active) force.alphaTarget(0.3).restart();

                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (d) => {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            })
            .on('end', (d) => {
                if (!d3.event.active) force.alphaTarget(0);

                d.fx = null;
                d.fy = null;
            });

        const menu = svg.append('g')
            .attr('id', 'room-menu')
            .attr('transform', `translate(${20} ${10})`);

        const roomMenuItemRadius = 15;
        const menuItemSpacing = 10;

        const menuItem = menu.selectAll('g')
            .data(roomData)
            .enter()
            .append('g')
            .attr('class', 'room-menu-item')
            .attr('transform', (d, i) => `translate(0 ${i * (roomMenuItemRadius * 2 + menuItemSpacing)})`);

        menuItem.append('circle')
            .attr('cx', roomMenuItemRadius / 2)
            .attr('cy', roomMenuItemRadius / 2)
            .attr('r', roomMenuItemRadius)
            .attr('fill', d => colors[d.roomIndex])
            .attr('stroke', d => d3.rgb(colors[d.roomIndex]).darker().toString())
            .on('click', function (d) {
                const node = { id: ++lastNodeId, reflexive: false, x: d3.event.pageX, y: d3.event.pageY, roomIndex:d.roomIndex};
                nodes.push(node);
                props.setNodesLength(nodes.length);
        
                restart();
                updateNumRoomsText();
            });

        menuItem.append('text')
            .attr('x', roomMenuItemRadius * 2 + 3)
            .attr('y', roomMenuItemRadius / 2 + 2) 
            .text(d => d.name);   

        const x = 54;

        svg.append('text')
            .attr('id', 'num-rooms')
            .attr('x', x)
            .attr('y', this.props.height-15)
            .text(getNumRoomsText())

        const buttonWidth = 100;
        const buttonHeight = 30;

        const g = svg.append('g')
            .attr('id', 'reset-button')
            .attr('transform', `translate(${x} ${this.props.height-70})`);

        g.append('rect')
            .attr('width', buttonWidth)
            .attr('height', buttonHeight)
            .attr('rx', '4')
            .on('click', function() {
                nodes.splice(0, nodes.length);
                props.setNodesLength(nodes.length);
                links.splice(0, links.length);
                updateNumRoomsText();
                restart();
                props.reset();
            });

        g.append('text')
            .attr('x', buttonWidth / 2)
            .attr('y', buttonHeight / 2 + 4)
            .text('Reset')

        // line displayed when dragging new nodes
        const dragLine = svg.append('svg:path')
            .attr('class', 'link dragline hidden')
            .attr('d', 'M0,0L0,0');

        let path = svg.append('svg:g').selectAll('path');
        let circle = svg.append('svg:g').selectAll('g');

        let selectedNode = null;
        let selectedLink = null;
        let mousedownLink = null;
        let mousedownNode = null;
        let mouseupNode = null;

        /*svg.on('mousedown', mousedown)
            .on('mousemove', mousemove)
            .on('mouseup', mouseup);*/

        svg.on('mousemove', mousemove);

        d3.select(window)
            .on('keydown', keydown)
            .on('keyup', keyup);
            
        restart();

        function getNumRoomsText() {
            let text = `${nodes.length} room`;
            if (nodes.length != 1) {
                text += 's';
            }
            if (nodes.length < 10) {
                text += ' (requires at least 10 rooms)' 
            }
            return text;
        }

        function updateNumRoomsText() {
            svg.select('#num-rooms')
                .text(getNumRoomsText());
        }

        function resetMouseVars() {
            mousedownNode = null;
            mouseupNode = null;
            mousedownLink = null;
        }
    
        // update force layout (called automatically each iteration)
        function tick() {
            // draw directed edges with proper padding from node centers
            path.attr('d', (d) => {
                const deltaX = d.target.x - d.source.x;
                const deltaY = d.target.y - d.source.y;
                const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const normX = deltaX / dist;
                const normY = deltaY / dist;
                const sourcePadding = nodeRadius;
                const targetPadding = nodeRadius;
                const sourceX = d.source.x + (sourcePadding * normX);
                const sourceY = d.source.y + (sourcePadding * normY);
                const targetX = d.target.x - (targetPadding * normX);
                const targetY = d.target.y - (targetPadding * normY);
    
                return `M${sourceX},${sourceY}L${targetX},${targetY}`;
            });
    
            circle.attr('transform', (d) => `translate(${d.x},${d.y})`);
        }
    
        // update graph (called when needed)
        function restart() {
            // path (link) group
            path = path.data(links);
    
            // update existing links
            path.classed('selected', (d) => d === selectedLink)
    
            // remove old links
            path.exit().remove();
    
            // add new links
            path = path.enter().append('svg:path')
                .attr('class', 'link')
                .classed('selected', (d) => d === selectedLink)
                .on('mousedown', (d) => {
                    if (d3.event.ctrlKey) return;
    
                    // select link
                    mousedownLink = d;
                    selectedLink = (mousedownLink === selectedLink) ? null : mousedownLink;
                    selectedNode = null;
                    restart();
                })
                .merge(path);
    
            // circle (node) group
            // NB: the function arg is crucial here! nodes are known by id, not by index!
            circle = circle.data(nodes, (d) => d.id);
    
            // update existing nodes (reflexive & selected visual states)
            circle.selectAll('circle')
                .style('fill', (d) => d === selectedNode ? d3.rgb(colors[d.roomIndex]).brighter().toString() : colors[d.roomIndex])
                .classed('reflexive', (d) => d.reflexive);
    
            // remove old nodes
            circle.exit().remove();
    
            // add new nodes
            const g = circle.enter().append('svg:g');
    
            g.append('svg:circle')
                .attr('class', 'node')
                .attr('r', 12)
                .style('fill', (d) => d === selectedNode ? d3.rgb(colors[d.roomIndex]).brighter().toString() : colors[d.roomIndex])
                .style('stroke', (d) => d3.rgb(colors[d.roomIndex]).darker().toString())
                .classed('reflexive', (d) => d.reflexive)
                .on('mouseover', function (d) {
                    if (!mousedownNode || d === mousedownNode) return;
                    // enlarge target node
                    d3.select(this).attr('transform', 'scale(1.1)');
                })
                .on('mouseout', function (d) {
                    if (!mousedownNode || d === mousedownNode) return;
                    // unenlarge target node
                    d3.select(this).attr('transform', '');
                })
                .on('mousedown', (d) => {
                    if (d3.event.ctrlKey) return;
    
                    // select node
                    mousedownNode = d;
                    selectedNode = (mousedownNode === selectedNode) ? null : mousedownNode;
                    selectedLink = null;
    
                    // reposition drag line
                    dragLine
                        .classed('hidden', false)
                        .attr('d', `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`);
    
                    restart();
                })
                .on('mouseup', function (d) {
                    if (!mousedownNode) return;
    
                    // needed by FF
                    dragLine
                        .classed('hidden', true)
                        .style('marker-end', '');
    
                    // check for drag-to-self
                    mouseupNode = d;
                    if (mouseupNode === mousedownNode) {
                        resetMouseVars();
                        return;
                    }
    
                    // unenlarge target node
                    d3.select(this).attr('transform', '');
    
                    // add link to graph (update if exists)
                    // NB: links are strictly source < target; arrows separately specified by booleans
                    const isRight = mousedownNode.id < mouseupNode.id;
                    const source = isRight ? mousedownNode : mouseupNode;
                    const target = isRight ? mouseupNode : mousedownNode;
    
                    const link = links.filter((l) => l.source === source && l.target === target)[0];
                    if (link) {
                        link[isRight ? 'right' : 'left'] = true;
                    } else {
                        links.push({ source, target, left: !isRight, right: isRight });
                    }
    
                    // select new link
                    selectedLink = link;
                    selectedNode = null;
                    restart();
                });
    
            // show node IDs
            g.append('svg:text')
                .attr('x', 15)
                .attr('y', 3)
                .attr('class', 'id')
                .text((d) => roomNames[d.roomIndex]);
    
            circle = g.merge(circle);
    
            // set the graph in motion
            force
                .nodes(nodes)
                .force('link').links(links);
    
            force.alphaTarget(0.3).restart();
        }
    
        /*function mousedown() {
            // because :active only works in WebKit?
            svg.classed('active', true);
          
            if (d3.event.ctrlKey || mousedownNode || mousedownLink) return;
          
            // insert new node at point
            /*const point = d3.mouse(this);
            const node = { id: ++lastNodeId, reflexive: false, x: point[0], y: point[1] };
            nodes.push(node);
          
            restart();
        }*/
    
        function mousemove() {
            if (!mousedownNode) return;
            
            // update drag line
            dragLine.attr('d', `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${d3.mouse(this)[1]}`);
        }
    
        function mouseup() {
            if (mousedownNode) {
              // hide drag line
              dragLine
                .classed('hidden', true)
                .style('marker-end', '');
            }
          
            // because :active only works in WebKit?
            svg.classed('active', false);
          
            // clear mouse event vars
            resetMouseVars();
        }
    
        function spliceLinksForNode(node) {
            const toSplice = links.filter((l) => l.source === node || l.target === node);
            for (const l of toSplice) {
                links.splice(links.indexOf(l), 1);
            }
        }

        function keydown() {
            d3.event.preventDefault();
          
            if (lastKeyDown !== -1) return;
            lastKeyDown = d3.event.keyCode;
          
            // ctrl
            if (d3.event.keyCode === 17) {
              circle.call(drag);
              svg.classed('ctrl', true);
              return;
            }

            switch (d3.event.keyCode) {
                case 71: // G
                    let tNodes = [];
                    for (let i = 0; i < 10; i++) {
                        let room = null;
                        do {
                            room = Math.floor(Math.random() * 10);
                        } while (room == 4);
                        tNodes.push(room);
                    }
                    tNodes = tNodes.map((node, index) => {return {id: index, reflexive: false, roomIndex: node}});
                    nodes.splice(0, nodes.length, ...tNodes);
                    props.setNodesLength(nodes.length);
                    updateNumRoomsText();

                    let tLinks = [];
                    for (let i = 0; i < 10; i++) {
                        const b = i + 1 < 10 ? i + 1 : 0;
                        tLinks.push([i, b]);
                    }                    
                    tLinks = tLinks.map(link => {return {source: nodes[link[0]], target: nodes[link[1]], left: false, right: true}});
                    links.splice(0, links.length, ...tLinks);

                    restart();
                    break;
            }
          
            if (!selectedNode && !selectedLink) return;
          
            switch (d3.event.keyCode) {
              case 8: // backspace
              case 46: // delete
                if (selectedNode) {
                  nodes.splice(nodes.indexOf(selectedNode), 1);
                  props.setNodesLength(nodes.length);
                  spliceLinksForNode(selectedNode);
                  updateNumRoomsText();
                } else if (selectedLink) {
                  links.splice(links.indexOf(selectedLink), 1);
                }
                selectedLink = null;
                selectedNode = null;
                restart();
                break;
    
              case 66: // B
                if (selectedLink) {
                  // set link direction to both left and right
                  selectedLink.left = true;
                  selectedLink.right = true;
                }
                restart();
                break;
    
              case 76: // L
                if (selectedLink) {
                  // set link direction to left only
                  selectedLink.left = true;
                  selectedLink.right = false;
                }
                restart();
                break;
    
              case 82: // R
                if (selectedNode) {
                  // toggle node reflexivity
                  selectedNode.reflexive = !selectedNode.reflexive;
                } else if (selectedLink) {
                  // set link direction to right only
                  selectedLink.left = false;
                  selectedLink.right = true;
                }
                restart();
                break;
            }
        }
    
        function keyup() {
            lastKeyDown = -1;
          
            // ctrl
            if (d3.event.keyCode === 17) {
              circle.on('.drag', null);
              svg.classed('ctrl', false);
            }
        }
    }

    render() {
        return <svg ref={this.svgRef} width={this.state.width} height={this.props.height}/>
    }
}

export default GraphEditor;