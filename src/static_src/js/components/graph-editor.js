import React, { Component } from 'react'

class GraphEditor extends Component {
    constructor(props) {
        super(props);

        this.svgRef = React.createRef();

        this.nodes = [
            { id: 0, reflexive: false },
            { id: 1, reflexive: true },
            { id: 2, reflexive: false }
        ];

        this.links = [
            { source: this.nodes[0], target: this.nodes[1], left: false, right: true },
            { source: this.nodes[1], target: this.nodes[2], left: false, right: true }
        ];
    }

    componentDidMount() {
        this.createEditor();
    }

    componentDidUpdate() {
        this.createEditor();
    }

    createEditor() {
        // http://bl.ocks.org/rkirsling/5001347

        // only respond once per keydown
        let lastKeyDown = -1;

        const nodes = this.nodes;
        const links = this.links;
        const colors = d3.scaleOrdinal(d3.schemeCategory10);
        
        const svg = d3.select(this.svgRef.current)
            .on('contextmenu', () => { 
                d3.event.preventDefault(); 
            });

        // set up initial nodes and links
        //  - nodes are known by 'id', not by index in array.
        //  - reflexive edges are indicated on the node (as a bold black circle).
        //  - links are always source < target; edge directions are set by 'left' and 'right'.
        
        let lastNodeId = 2;

        // init D3 force layout
        const force = d3.forceSimulation()
            .force('link', d3.forceLink().id((d) => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('x', d3.forceX(this.props.width / 2))
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

        svg.on('mousedown', mousedown)
            .on('mousemove', mousemove)
            .on('mouseup', mouseup);

        d3.select(window)
            .on('keydown', keydown)
            .on('keyup', keyup);
            
        restart();

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
                const sourcePadding = 12;
                const targetPadding = 12;
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
                .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
                .classed('reflexive', (d) => d.reflexive);
    
            // remove old nodes
            circle.exit().remove();
    
            // add new nodes
            const g = circle.enter().append('svg:g');
    
            g.append('svg:circle')
                .attr('class', 'node')
                .attr('r', 12)
                .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
                .style('stroke', (d) => d3.rgb(colors(d.id)).darker().toString())
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
                .attr('x', 0)
                .attr('y', 4)
                .attr('class', 'id')
                .text((d) => d.id);
    
            circle = g.merge(circle);
    
            // set the graph in motion
            force
                .nodes(nodes)
                .force('link').links(links);
    
            force.alphaTarget(0.3).restart();
        }
    
        function mousedown() {
            // because :active only works in WebKit?
            svg.classed('active', true);
          
            if (d3.event.ctrlKey || mousedownNode || mousedownLink) return;
          
            // insert new node at point
            const point = d3.mouse(this);
            const node = { id: ++lastNodeId, reflexive: false, x: point[0], y: point[1] };
            nodes.push(node);
          
            restart();
        }
    
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
          
            if (!selectedNode && !selectedLink) return;
          
            switch (d3.event.keyCode) {
              case 8: // backspace
    
              case 46: // delete
                if (selectedNode) {
                  nodes.splice(nodes.indexOf(selectedNode), 1);
                  spliceLinksForNode(selectedNode);
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
        return <svg ref={this.svgRef} width={this.props.width} height={this.props.height}/>
    }
}

export default GraphEditor;