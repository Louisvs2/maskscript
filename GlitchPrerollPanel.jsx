// GlitchPrerollPanel.jsx  –  Dockbares ScriptUI Panel für After Effects 2026
//
// Installation:
//   Mac:  /Applications/Adobe After Effects 2026/Scripts/ScriptUI Panels/
//   Win:  ...\Adobe After Effects 2026\Support Files\Scripts\ScriptUI Panels\
//   AE neu starten → Fenster → GlitchPrerollPanel

(function (thisObj) {
    "use strict";

    // ── Defaults ──────────────────────────────────────────────────────────────
    var DEF_NUM  = 3;
    var DEF_FR   = [10, 7, 4, 6, 3];
    var DEF_DIST = 6;
    var DEF_FREQ = 3;
    var DEF_SIZE = 10;

    // ── Palette (Apple Home Dark) ─────────────────────────────────────────────
    var C = {
        bg:      [0.055, 0.055, 0.078, 1],   // #0E0E14  space black
        card:    [0.102, 0.106, 0.149, 1],   // #1A1B26  dark glass card
        card2:   [0.122, 0.125, 0.173, 1],   // #1F202C  slightly lighter card
        orange:  [0.941, 0.459, 0.039, 1],   // #F0750A  warm active
        blue:    [0.310, 0.722, 0.961, 1],   // #4FB8F5  cool blue
        purple:  [0.482, 0.357, 0.910, 1],   // #7B5BE8  purple accent
        pink:    [0.784, 0.353, 0.784, 1],   // #C85AC8  pink
        white:   [1.000, 1.000, 1.000, 1],
        txtHi:   [0.937, 0.941, 0.965, 1],   // #EFF0F6
        txtMid:  [0.600, 0.612, 0.690, 1],   // #999CB0
        txtLo:   [0.353, 0.361, 0.427, 1],   // #5A5C6D
        btnText: [1.000, 1.000, 1.000, 1],
    };

    // ── Farb-Helfer ───────────────────────────────────────────────────────────
    function setBg(el, col) {
        el.graphics.backgroundColor =
            el.graphics.newBrush(el.graphics.BrushType.SOLID_COLOR, col);
    }
    function setFg(el, col) {
        el.graphics.foregroundColor =
            el.graphics.newPen(el.graphics.PenType.SOLID_COLOR, col, 1);
    }

    // ── Farbiger Akzent-Punkt (Leaf-Element, kein Kind) ───────────────────────
    function dot(parent, col, size) {
        size = size || 8;
        var d = parent.add("group");
        d.preferredSize = [size, size];
        d.onDraw = function () {
            var g = this.graphics, s = size;
            g.newPath(); g.rectPath(0, 0, s, s);
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, col));
        };
        return d;
    }

    // ── Dünne farbige Trennlinie ──────────────────────────────────────────────
    function colorLine(parent, col) {
        var ln = parent.add("group");
        ln.preferredSize.height = 2;
        ln.onDraw = function () {
            var g = this.graphics, W = this.size[0];
            g.newPath(); g.rectPath(0, 0, W, 2);
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, col));
        };
    }

    // ── Slider-Zeile mit Akzentfarbe ──────────────────────────────────────────
    function sliderRow(parent, label, val, lo, hi, unit, accentCol) {
        accentCol = accentCol || C.orange;

        var row = parent.add("group");
        row.orientation   = "row";
        row.alignChildren = ["left", "center"];
        row.spacing       = 6;
        row.margins       = [0, 3, 0, 3];
        setBg(row, C.card);

        // Farbiger Punkt links
        dot(row, accentCol, 7);

        var lbl = row.add("statictext", undefined, label);
        lbl.preferredSize.width = 155;
        setFg(lbl, C.txtHi);

        var sl = row.add("slider", undefined, val, lo, hi);
        sl.preferredSize.width = 96;

        var vl = row.add("statictext", undefined, val + unit);
        vl.preferredSize.width = 36;
        setFg(vl, accentCol);

        sl.onChanging = function () { vl.text = Math.round(sl.value) + unit; };

        return { row: row, slider: sl, valLabel: vl, unit: unit };
    }

    // ── Karten-Panel ─────────────────────────────────────────────────────────
    function card(parent, title, accentCol) {
        accentCol = accentCol || C.blue;

        var p = parent.add("panel", undefined, "");
        p.orientation   = "column";
        p.alignChildren = ["fill", "top"];
        p.spacing       = 6;
        p.margins       = [10, 14, 10, 10];
        setBg(p, C.card);

        // Header-Zeile
        var hdr = p.add("group");
        hdr.orientation   = "row";
        hdr.alignChildren = ["left", "center"];
        hdr.spacing       = 8;
        hdr.margins       = [0, 0, 0, 4];
        setBg(hdr, C.card);

        dot(hdr, accentCol, 10);

        var t = hdr.add("statictext", undefined, title);
        setFg(t, C.white);

        // Dünne Akzentlinie darunter
        colorLine(p, accentCol);

        return p;
    }

    // ── Haupt-UI ──────────────────────────────────────────────────────────────
    function buildUI(host) {
        var win = (host instanceof Panel)
            ? host
            : new Window("palette", "Glitch Preroll", undefined, { resizeable: true });

        win.orientation   = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing       = 8;
        win.margins       = 10;
        setBg(win, C.bg);

        // ── App-Header ────────────────────────────────────────────────────────
        var hdr = win.add("group");
        hdr.orientation   = "row";
        hdr.alignChildren = ["left", "center"];
        hdr.spacing       = 8;
        hdr.margins       = [4, 6, 4, 6];
        setBg(hdr, C.bg);

        dot(hdr, C.orange, 12);

        var appTitle = hdr.add("statictext", undefined, "Glitch Preroll");
        setFg(appTitle, C.white);

        var appSub = hdr.add("statictext", undefined, "After Effects 2026");
        setFg(appSub, C.txtLo);

        // ── Karte: Layer ──────────────────────────────────────────────────────
        var cardL = card(win, "Layer Settings", C.purple);

        var ctrlNum = sliderRow(cardL, "Number of Layers", DEF_NUM, 1, 5, "", C.orange);

        // Kleiner Abstand
        var sp1 = cardL.add("group"); sp1.preferredSize.height = 4; setBg(sp1, C.card);

        var frameRows = [], frameSliders = [], frameLabels = [];
        var layerColors = [C.orange, C.pink, C.purple, C.blue, C.blue];
        for (var fi = 0; fi < 5; fi++) {
            var fr = sliderRow(cardL, "Layer " + (fi + 1) + "  –  Frames",
                               DEF_FR[fi], 1, 60, " f", layerColors[fi]);
            frameRows.push(fr.row);
            frameSliders.push(fr.slider);
            frameLabels.push(fr.valLabel);
        }

        // ── Karte: Masken ─────────────────────────────────────────────────────
        var cardM = card(win, "Mask Settings", C.blue);

        var ctrlDist = sliderRow(cardM, "Jump Distance",       DEF_DIST, 1, 40, " %", C.orange);
        var ctrlFreq = sliderRow(cardM, "Jump Every N Frames", DEF_FREQ, 1, 15, " f", C.pink);
        var ctrlSize = sliderRow(cardM, "Mask Size",           DEF_SIZE, 1, 60, " %", C.purple);

        // ── Button ────────────────────────────────────────────────────────────
        var btnWrap = win.add("group");
        btnWrap.orientation   = "column";
        btnWrap.alignChildren = ["fill", "center"];
        btnWrap.margins       = [0, 2, 0, 2];
        setBg(btnWrap, C.bg);

        var btn = btnWrap.add("button", undefined, "");

        // Custom-Draw: orange Glas-Button (Leaf-Element – kein Kind)
        btn.preferredSize.height = 36;
        btn.onDraw = function () {
            var g = this.graphics, W = this.size[0], H = this.size[1];

            // Oranger Hintergrund
            g.newPath(); g.rectPath(0, 0, W, H);
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, C.orange));

            // Obere Glanz-Linie
            var shine = [0.980, 0.620, 0.200, 1];
            g.newPath(); g.rectPath(1, 1, W - 2, Math.floor(H * 0.45));
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, shine));

            // Untere Abgrenzung (etwas dunkler)
            var dark = [0.780, 0.330, 0.010, 1];
            g.newPath(); g.rectPath(0, H - 2, W, 2);
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, dark));

            // Label
            var txt = "Create Glitch Preroll";
            var pen = g.newPen(g.PenType.SOLID_COLOR, C.btnText, 1);
            var ms  = g.measureString(txt, g.font, W);
            g.drawString(txt, pen, (W - ms[0]) / 2, (H - ms[1]) / 2);
        };

        // ── Events ────────────────────────────────────────────────────────────
        function refreshRows() {
            var n = Math.round(ctrlNum.slider.value);
            ctrlNum.valLabel.text = n;
            for (var j = 0; j < 5; j++) {
                frameRows[j].enabled = (j < n);
                setFg(frameLabels[j], j < n ? layerColors[j] : C.txtLo);
            }
        }
        ctrlNum.slider.onChanging = refreshRows;
        ctrlNum.slider.onChange   = refreshRows;
        refreshRows();

        btn.onClick = function () {
            var n = Math.round(ctrlNum.slider.value);
            var frames = [];
            for (var j = 0; j < n; j++) frames.push(Math.round(frameSliders[j].value));
            runGlitchPreroll(
                n, frames,
                Math.round(ctrlDist.slider.value) / 100,
                Math.round(ctrlFreq.slider.value),
                Math.round(ctrlSize.slider.value) / 100
            );
        };

        win.layout.layout(true);
        win.layout.resize();
        return win;
    }

    // ── Glitch-Logik ─────────────────────────────────────────────────────────
    function runGlitchPreroll(numLayers, frames, jumpDist, jumpFreq, maskSizePct) {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Bitte eine Komposition oeffnen."); return; }
        if (comp.selectedLayers.length !== 1) { alert("Bitte genau EINEN Layer auswaehlen."); return; }

        var orig        = comp.selectedLayers[0];
        var fd          = 1 / comp.frameRate;
        var X           = orig.inPoint;
        var anchorLayer = (orig.index >= 3) ? comp.layer(orig.index - 2) : null;

        app.beginUndoGroup("Glitch Preroll");

        for (var i = 0; i < numLayers; i++) {
            var nF  = frames[i];
            var dup = orig.duplicate();
            if (anchorLayer) { dup.moveBefore(anchorLayer); } else { dup.moveToBeginning(); }
            dup.inPoint  = X - nF * fd;
            dup.outPoint = X;
            applyMask(dup, X - nF * fd, X, fd, jumpDist, jumpFreq, maskSizePct);
        }

        app.endUndoGroup();
    }

    function applyMask(layer, layerIn, layerOut, fd, jumpDist, jumpFreq, sizePct) {
        var w = layer.width, h = layer.height;
        var base  = Math.sqrt(sizePct);
        var maskW = w * base * (0.5 + Math.random() * 1.8);
        var maskH = h * base * (0.3 + Math.random() * 1.2);
        var baseCX = w / 2 + (Math.random() - 0.5) * 0.5 * w;
        var baseCY = h / 2 + (Math.random() - 0.5) * 0.5 * h;

        var mask = layer.Masks.addProperty("Mask");
        var pp   = mask.property("Mask Path");
        mask.property("Mask Feather").setValue([0, 0]);

        var t = layerIn;
        while (t <= layerOut + fd * 0.01) {
            var cx = baseCX + (Math.random() - 0.5) * w * jumpDist;
            var cy = baseCY + (Math.random() - 0.5) * h * jumpDist;
            var rs = 0.5 + Math.random();
            var rW = maskW * rs, rH = maskH * rs;

            var s = new Shape();
            s.closed      = true;
            s.vertices    = [[cx-rW/2,cy-rH/2],[cx+rW/2,cy-rH/2],
                              [cx+rW/2,cy+rH/2],[cx-rW/2,cy+rH/2]];
            s.inTangents  = [[0,0],[0,0],[0,0],[0,0]];
            s.outTangents = [[0,0],[0,0],[0,0],[0,0]];
            pp.setValueAtTime(t, s);

            t += (jumpFreq + Math.floor(Math.random() * 2)) * fd;
        }

        for (var k = 1; k <= pp.numKeys; k++) {
            pp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);
        }
    }

    // ── Start ─────────────────────────────────────────────────────────────────
    var panel = buildUI(thisObj);
    if (panel instanceof Window) { panel.center(); panel.show(); }

}(this));
