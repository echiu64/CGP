var CGP = (function() {
    'use strict';

    var mouse_move = function(e) {
        if (this.rrdgraph.mousedown) {
            var factor = (this.rrdgraph.end - this.rrdgraph.start) / this.rrdgraph.xsize;
            var x = e.pageX; // - this.offsetLeft;
            var diff = x - this.rrdgraph.mousex;
            var difffactor = Math.abs(Math.round(diff * factor));
            if (diff > 0) {
                this.rrdgraph.end -= difffactor;
                this.rrdgraph.start -= difffactor;
            } else {
                this.rrdgraph.end += difffactor;
                this.rrdgraph.start += difffactor;
            }
            this.rrdgraph.mousex = x;
            try {
                this.rrdgraph.graph_paint();
            } catch (ex) {
                console.error('mouse_move:', ex, ex.stack);
            }
        }
    };
    var mouse_up = function(e) {
        this.rrdgraph.mousedown = false;
        this.style.cursor = 'default';
    };
    var mouse_down = function(e) {
        var x = e.pageX; // - this.offsetLeft;
        this.rrdgraph.mousedown = true;
        this.rrdgraph.mousex = x;
        this.style.cursor = 'move';
    };
    var mouse_scroll = function(e) {
        e = e ? e : window.event;
        var wheel = e.detail ? e.detail * -1 : e.wheelDelta / 40;
        var cstime = this.stime[this.stidx];
        if (wheel < 0) {
            this.stidx++;
            if (this.stidx >= this.stlen) this.stidx = this.stlen - 1;
        } else {
            this.stidx--;
            if (this.stidx < 0) this.stidx = 0;
        }
        if (cstime !== this.stime[this.stidx]) {
            //var posx = e.clientX - e.target.getBoundingClientRect().left - this.rrdgraph.xorigin;
            //var relx = this.rrdgraph.xsize / Math.min(Math.max(posx, 0), this.rrdgraph.xsize);
            //var cntr = this.rrdgraph.start + Math.abs(Math.round((this.rrdgraph.end - this.rrdgraph.start) / relx));
            var middle = this.rrdgraph.start + Math.abs(Math.round((this.rrdgraph.end - this.rrdgraph.start)/2));
            this.rrdgraph.start = Math.round(middle - this.stime[this.stidx]/2);
            this.rrdgraph.end = this.rrdgraph.start + this.stime[this.stidx];
            //this.rrdgraph.start = Math.round(cntr - this.stime[this.stidx] / relx);
            //this.rrdgraph.end = this.rrdgraph.start + this.stime[this.stidx];

            try {
                this.rrdgraph.graph_paint();
            } catch (ex) {
                console.error('mouse_scroll:', ex, ex.stack);
            }
        }

        if (e.stopPropagation)
            e.stopPropagation();
        if (e.preventDefault)
            e.preventDefault();
        e.cancelBubble = true;
        e.cancel = true;
        e.returnValue = false;
        return false;
    };

    function prepare_draw(id) {
        RrdGraph.prototype.mousex = 0;
        RrdGraph.prototype.mousedown = false;

        var cmdline = document.getElementById(id).textContent;
        var gfx = new RrdGfxSvg(id);
        var fetch = new RrdDataFile();
        var rrdcmdline = null;

        try {
            rrdcmdline = new RrdCmdLine(gfx, fetch, cmdline);
        } catch (e) {
            console.error('prepare_draw:', e, e.stack);
        }

        var rrdgraph = rrdcmdline.graph;

        gfx.svg.stime = [300, 600, 900, 1200, 1800, 3600, 7200, 14400, 21600, 28800, 43200, 86400, 100800, 172800, 302400, 604800, 2592000, 5184000, 1296000, 15768000, 31536000];
        gfx.svg.stlen = gfx.svg.stime.length;
        gfx.svg.stidx = 0;

        gfx.svg.rrdgraph = rrdgraph;
        gfx.svg.removeEventListener('mousemove', mouse_move, false);
        gfx.svg.addEventListener('mousemove', mouse_move, false);
        gfx.svg.removeEventListener('mouseup', mouse_up, false);
        gfx.svg.addEventListener('mouseup', mouse_up, false);
        gfx.svg.removeEventListener('mousedown', mouse_down, false);
        gfx.svg.addEventListener('mousedown', mouse_down, false);
        gfx.svg.removeEventListener('mouseout', mouse_up, false);
        gfx.svg.addEventListener('mouseout', mouse_up, false);
        gfx.svg.removeEventListener('DOMMouseScroll', mouse_scroll, false);
        gfx.svg.addEventListener('DOMMouseScroll', mouse_scroll, false);
        gfx.svg.removeEventListener('mousewheel', mouse_scroll, false);
        gfx.svg.addEventListener('mousewheel', mouse_scroll, false);

        var diff = rrdgraph.end - rrdgraph.start;
        for (var i = 0; i < gfx.svg.stlen; i++) {
            if (gfx.svg.stime[i] >= diff) break;
        }
        if (i === gfx.svg.stlen) gfx.svg.stidx = gfx.svg.stlen - 1;
        else gfx.svg.stidx = i;

        return rrdgraph;
    }

    function draw(id, async) {
        var rrdgraph = prepare_draw(id);
        try {
            if (async) {
                rrdgraph.graph_paint_async();
            } else {
                rrdgraph.graph_paint();
            }
        } catch (e) {
            console.error('draw(' + id + '):', e, e.stack);
        }
    }

    /**
     * For each canvas.rrd element, initialize a draggable graph.
     */
    function drawAll(async) {
        var canvases = document.getElementsByClassName('rrd');
        for (var i = 0; i < canvases.length; i++) {
            draw(canvases[i].id, async);
        }
    }

    return {
        drawAll: drawAll
    };
}());
