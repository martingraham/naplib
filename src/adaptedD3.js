/**
 * Created with JetBrains WebStorm.
 * User: cs22
 * Date: 12/06/13
 * Time: 11:38
 * To change this template use File | Settings | File Templates.
 */
var MGNapier = MGNapier || {};

MGNapier.AdaptedD3 = new function () {

    // I copied the hierarchy block out of d3 as I needed to make changes to make it more memory-efficient
    // mainly by putting in 'horizons' on the layouts, i.e. stop recursing layout calculations when the nodes were going to be
    // too small to see, and to stop the general hierarchy function copying children arrays all over the shop.
    this.adaptedHierarchy = function() {
        var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren, value = d3_layout_hierarchyValue;
        function recurse(node, depth, nodes) {
            //if (depth == 0) console.log ("recursing...");
            var childs = children.call(hierarchy, node, depth);
            node.depth = depth;
            nodes.push(node);
            var n;
            if (childs && (n = childs.length)) {
                var i = -1, /*c = node.children = [],*/ v = 0, j = depth + 1, d; //mjg
                while (++i < n) {
                    d = recurse(childs[i], j, nodes);
                    d.parent = node;
                    v += (d.value || (value && value.call(hierarchy, d, d.depth)) || 0);
                }
                if (sort) { childs.sort(sort); }
                if (value) { node.value = v; }
            } //else if (value) { // set values for leaves
            // node.value = +value.call(hierarchy, node, depth) || 0;
            // }
            return node;
        }
        function revalue(node, depth) {
            //if (depth == 0) console.log ("revaluing");
            var childs = children.call(hierarchy, node, depth), v= 0;
            //var childs = node.children, v = 0;
            if (childs && (n = childs.length)) {
                var i = -1, n, j = depth + 1;
                while (++i < n) { v += revalue(childs[i], j); }
            } else if (value) {
                v = +value.call(hierarchy, node, depth) || 0;
            }
            if (value) { node.value = v; }
            return v;
        }
        function hierarchy(d) {
            var nodes = [];
            //console.log ("children, ", children);
            recurse(d, 0, nodes);
            return nodes;
        }
        hierarchy.sort = function(x) {
            if (!arguments.length) { return sort; }
            sort = x;
            return hierarchy;
        };
        hierarchy.children = function(x) {
            if (!arguments.length) { return children; }
            children = x;
            return hierarchy;
        };
        hierarchy.value = function(x) {
            if (!arguments.length) { return value; }
            value = x;
            return hierarchy;
        };
        hierarchy.revalue = function(root) {
            revalue(root, 0);
            return root;
        };
        return hierarchy;
    };

    this.taxonomicHierarchy = function() {
        var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren,
            value = d3_layout_hierarchyValue, filter = d3_layout_filter;
        function recurse(node, depth, nodes) {
            var childs = children.call(hierarchy, node, depth);
            node.depth = depth;
            nodes.push(node);
            var n;
            if (childs && (n = childs.length)) {
                //console.log ("NODE", node, filter(node));
                //console.log ("VAL", filter(node));
                var i = -1, /*c = node.children = [],*/ v = 0, j = depth + (filter(node) ? 1 : 0), d; //mjg
                while (++i < n) {
                    d = recurse(childs[i], j, nodes);
                    d.parent = node;
                    v += (d.value || (value && value.call(hierarchy, d, d.depth)) || 0);
                }
                if (sort) { childs.sort(sort); }
                if (value) { node.value = v; }
            } //else if (value) {
            // node.value = +value.call(hierarchy, node, depth) || 0;
            // }
            return node;
        }
        function revalue(node, depth) {
            //if (depth == 0) console.log ("revaluing");
            var childs = children.call(hierarchy, node, depth), v= 0;
            //var childs = node.children, v = 0;
            if (childs && (n = childs.length)) {
                var i = -1, n, j = depth + 1;
                while (++i < n) { v += revalue(childs[i], j); }
            } else if (value) {
                v = +value.call(hierarchy, node, depth) || 0;
            }
            if (value) { node.value = v; }
            return v;
        }
        /*
        function getDepth (node) {

        }
        */
        function hierarchy(d) {
            var nodes = [];
            recurse(d, 0, nodes);
            return nodes;
        }
        hierarchy.sort = function(x) {
            if (!arguments.length) { return sort; }
            sort = x;
            return hierarchy;
        };
        hierarchy.children = function(x) {
            if (!arguments.length) { return children; }
            children = x;
            return hierarchy;
        };
        hierarchy.value = function(x) {
            if (!arguments.length) { return value; }
            value = x;
            return hierarchy;
        };
        hierarchy.filter = function (x) {
            //console.log ("HFILTER", arguments.length);
            if (!arguments.length) { return filter; }
            filter = x;
            return hierarchy;
        };
        hierarchy.revalue = function(root) {
            revalue(root, 0);
            return root;
        };
        return hierarchy;
    };


    function d3_layout_hierarchyChildren(d) {
        return d.children;
    }
    function d3_layout_hierarchyValue(d) {
        return d.value;
    }
    function d3_layout_hierarchySort(a, b) {
        return b.value - a.value;
    }
    function d3_layout_filter() {
        return true;
    }


    function v_d3_layout_hierarchyRebind(object, hierarchy) {
        d3.rebind(object, hierarchy, "sort", "children", "value", "filter");
        object.nodes = object;
        object.links = d3_layout_hierarchyLinks;
        return object;
    }

    function d3_layout_hierarchyLinks(nodes) {
        return d3.merge(nodes.map(function(parent) {
            return (parent.children || []).map(function(child) {
                return {
                    source: parent,
                    target: child
                };
            });
        }));
    }


    this.bottomUp = function() {
        var hierarchy = this.taxonomicHierarchy(), size = [ 1, 1 ], nodeId, cutoff = 1;
        function position(coords,node, x, dx, dy) {
            var children = hierarchy.children()(node);
            if (dx > cutoff) {
                var id = nodeId (node);
                coords.push ({"id":id, x:x, y:node.depth * dy, dx:dx, dy:dy});
                var n;
                var toGrid = [];
                var ax = 0;
                if (children && (n = children.length)) {
                    var i = -1, c, d;
                    //dx = node.value ? dx / node.value : /*0*/ dx / 1;
                    var nVal = (node.value ? node.value : hierarchy.value().call(hierarchy, node, node.depth));
                    dx /= nVal;
                    while (++i < n) {
                        c = children[i];
                        d = (c.value || hierarchy.value().call(hierarchy, c, c.depth)) * dx;
                        //console.log ("child", d);
                        if (d <= cutoff) {
                            toGrid.push (c);
                            ax += d;
                        } else {
                            position(coords, c, x, d, dy);
                            x += d;
                        }
                    }

                    if (toGrid.length > 0) {
                        //console.log ("chil", children, children.length, n, i);
                        griddle (coords, nodeId, x, ax, dy, toGrid, cutoff, node);
                    }
                }
            }
        }
        function depth(node, extent) {
            var children = hierarchy.children()(node), d = 0;
            if (children && (n = children.length)) {
                var i = -1, n;
                var prop = extent / (node.value || 1);
                var tooSmall = false;

                while (++i < n) {
                    var val = children[i].value || (hierarchy.value() && hierarchy.value().call(hierarchy, children[i], children[i].depth)) || 0;
                    if (prop * val > cutoff) {
                        d = Math.max(d, depth(children[i], prop * val));
                    } else {
                        tooSmall = true;
                    }
                }

                if (tooSmall && d === 0) { d = 1; }
            }

            return 1 + d;
        }
        function partition(d, i) {
            hierarchy.call(this, d, i);
            var coords = [];
            position(coords, d, 0, size[0], size[1] / depth(d, size[0]));
            return coords;
        }
        partition.size = function(x) {
            if (!arguments.length) { return size; }
            size = x;
            return partition;
        };
        partition.nodeId = function (x) {
            if (!arguments.length) { return nodeId; }
            nodeId = x;
            return partition;
        };
        partition.cutoff = function (x) {
            if (!arguments.length) { return cutoff; }
            cutoff = x;
            return partition;
        };
        return v_d3_layout_hierarchyRebind(partition, hierarchy);
    };



    function griddle (coords, nodeId, x, xspace, yspace, nodes, cutoff, pnode) {

        var pdepth = pnode.depth;

        // show as many nodes as we reasonably can if they're immediately below the root
        // can use ordering to see 'important' taxa i.e. selected taxa
        if (pdepth === 0) {
            nodes.length = Math.min (nodes.length, Math.max (4, Math.min (nodes.length, Math.floor ((xspace / cutoff) * (xspace / cutoff)))));
            //VESPER.log ("PDEPT", pdepth, nodes.length);
        }

        if (xspace / Math.sqrt (nodes.length) < cutoff && nodes.length > 4) {
            VESPER.log ("GRIDFAIL", xspace, nodes.length, Math.sqrt (nodes.length), cutoff, pdepth);
            // what we do now is make a block with an adpated id of the parent
            // when pressed this will make the parent the root and display the children in more detail
            var firstChild = nodes[0];
            coords.push ({"id":"*"+nodeId(pnode), x:x, y:firstChild.depth * yspace, dx: xspace, dy: yspace});
            return;
        }
        VESPER.log ("GRIDGOOD", xspace, nodes.length, Math.sqrt (nodes.length), cutoff, pdepth);

        var prop = 1; //xspace / yspace;
        var sqxx = nodes.length / prop;
        var sqlen = Math.ceil (Math.sqrt (sqxx));
        var maxy = sqlen;
        var maxx = Math.max (1, Math.floor (sqlen * prop));
        var cx = 0, cy = 0;
        var unitx = xspace / maxx;
        var unity = yspace / Math.max (1, Math.floor (sqlen));

        for (var n = 0; n < nodes.length; n++) {
            var node = nodes[n];
            var id = nodeId (node);
            coords.push ({"id":id, x:x + (cx * unitx), y:(node.depth + (cy/sqlen)) * yspace, dx: unitx, dy: unity});
            cy++;
            if (cy >= maxy) {
                cy = 0;
                cx++;
            }
        }
    }

    this.logPartition = function() {
        var hierarchy = this.taxonomicHierarchy(), size = [ 1, 1 ], nodeId, cutoff = 1;
        //var toGrid = [];

        function getVal (node) {
            return node.value || (hierarchy.value() && hierarchy.value().call(hierarchy, node, node.depth)) || 0;
        }
        function position (coords, node, x, dx, dy) {
            var children = hierarchy.children()(node);
            if (dx > cutoff) {
                var id = nodeId (node);
                coords.push ({"id":id, x:x, y:node.depth * dy, dx:dx, dy:dy});
                var n;
                var toGrid = [];
                var ax = 0;
                if (children && (n = children.length)) {
                    var i = -1;
                    var logTot = 0;
                    while (++i < n) {
                        logTot += Math.log (getVal (children[i]) + 1);
                    }
                    i = -1;
                    var c, d;
                    dx /= logTot;
                    while (++i < n) {
                        c = children[i];
                        d = Math.log (getVal (c) + 1) * dx;
                        if (d <= cutoff) {
                            toGrid.push (c);
                            ax += d;
                        } else {
                            position(coords, c, x, d, dy);
                            x += d;
                        }
                    }

                    if (toGrid.length > 0) {
                        //console.log ("chil", children, children.length, n, i);
                        griddle (coords, nodeId, x, ax, dy, toGrid, cutoff, node);
                    }
                }
            }
        }
        function depth(node, extent) {
            var children = hierarchy.children()(node), d = 0;
            //console.log ("depth children, ", children);
            if (children && (n = children.length)) {
                var i = -1, n;
                var logTot = 0;
                while (++i < n) {
                    logTot += Math.log (getVal (children[i]) + 1);
                }
                i = -1;
                var prop = extent / logTot;
				var tooSmall= false;
                while (++i < n) {
                    var c = children[i];
                    var val = Math.log (getVal (c) + 1) * prop;
                    if (val > cutoff) {
                        d = Math.max (d, depth(c, val));
                    } else {
						tooSmall = true;
					}
                }
				
				if (tooSmall && d === 0) { d = 1; }
            }
            return 1 + d;
        }
        function partition(d, i) {
            hierarchy.call(this, d, i);
            var coords = [];
            position(coords, d, 0, size[0], size[1] / depth(d, size[0]));
            return coords;
        }
        partition.size = function(x) {
            if (!arguments.length) { return size; }
            size = x;
            return partition;
        };
        partition.nodeId = function (x) {
            if (!arguments.length) { return nodeId; }
            nodeId = x;
            return partition;
        };
        partition.cutoff = function (x) {
            if (!arguments.length) { return cutoff; }
            cutoff = x;
            return partition;
        };
        return v_d3_layout_hierarchyRebind(partition, hierarchy);
    };


    this.topDown = function() {
        var hierarchy = this.taxonomicHierarchy(), size = [ 1, 1 ], nodeId, cutoff = 1;
        function position(coords,node, x, dx, dy) {
            //var children = node.children;
            var children = hierarchy.children()(node);
            if (dx > cutoff) {
                var id = nodeId (node);
                if (hierarchy.filter()(node)) {
                    coords.push ({"id":id, x:x, y:node.depth * dy, dx:dx, dy:dy});
                }
                var n;
                var toGrid = [];    // mjg
                var ax = 0;         // mjg
                if (children && (n = children.length)) {
                    var i = -1, c, d;
                    dx /= n;
                    while (++i < n) {
                        c = children[i];
                        d = dx;
                        if (d <= cutoff) {
                            toGrid.push (c);
                            ax += d;
                        } else {
                            position(coords, c, x, d, dy);
                            x += d;
                        }
                    }

                    if (toGrid.length > 0) {
                        //console.log ("chil", children, children.length, n, i);
                        griddle (coords, nodeId, x, ax, dy, toGrid, cutoff, node);
                    }

                }
            }
        }
        function depth(node, extent) {
            //var children = node.children, d = 0;
            var children = hierarchy.children()(node), d = 0;
            var i = -1, n;
            if (children && (n = children.length) && (extent / n > cutoff)) {
                while (++i < n) { d = Math.max(d, depth(children[i], extent / n)); }
            }
            if (extent / n <= cutoff && d === 0) { d = 1; }
            return (hierarchy.filter()(node) ? 1 : 0) + d;
        }
        function partition(d, i) {
            /*var nodes =*/ hierarchy.call(this, d, i);
            var coords = [];

            position(coords, d, 0, size[0], size[1] / depth(d, size[0]));
            return coords;
        }
        partition.size = function(x) {
            if (!arguments.length) { return size; }
            size = x;
            return partition;
        };
        partition.nodeId = function (x) {
            if (!arguments.length) { return nodeId; }
            nodeId = x;
            return partition;
        };
        partition.cutoff = function (x) {
            if (!arguments.length) { return cutoff; }
            cutoff = x;
            return partition;
        };
        return v_d3_layout_hierarchyRebind(partition, hierarchy);
    };
};
