// GlitchPrerollPanel.jsx  –  Dockbares ScriptUI Panel, After Effects 2026
//
// Mac:  /Applications/Adobe After Effects 2026/Scripts/ScriptUI Panels/
// Win:  ...\Adobe After Effects 2026\Support Files\Scripts\ScriptUI Panels\
// AE neu starten → Fenster → GlitchPrerollPanel

(function (thisObj) {
    "use strict";

    // ── Defaults ──────────────────────────────────────────────────────────────
    var DEF_NUM  = 3;
    var DEF_FR   = [10, 7, 4, 6, 3];
    var DEF_DIST = 6;
    var DEF_FREQ = 3;
    var DEF_SIZE = 10;

    // ── Farben  (R,G,B,A  je 0–1) ─────────────────────────────────────────────
    var C = {
        bg:     [0.067, 0.067, 0.094, 1],   // #111118
        card:   [0.110, 0.114, 0.157, 1],   // #1C1D28
        orange: [0.941, 0.459, 0.039, 1],   // #F0750A
        blue:   [0.310, 0.722, 0.961, 1],   // #4FB8F5
        purple: [0.482, 0.357, 0.910, 1],   // #7B5BE8
        pink:   [0.784, 0.353, 0.784, 1],   // #C85AC8
        white:  [1.000, 1.000, 1.000, 1],
        hi:     [0.918, 0.925, 0.957, 1],   // #EAEcF4
        mid:    [0.557, 0.569, 0.651, 1],   // #8E91A6
        lo:     [0.329, 0.337, 0.408, 1],   // #545568
    };

    // ── Farb-Helfer ───────────────────────────────────────────────────────────
    function bg(el, col) {
        el.graphics.backgroundColor =
            el.graphics.newBrush(el.graphics.BrushType.SOLID_COLOR, col);
    }
    function fg(el, col) {
        el.graphics.foregroundColor =
            el.graphics.newPen(el.graphics.PenType.SOLID_COLOR, col, 1);
    }

    // ── Kleiner farbiger Dot (Leaf – kein Kind) ───────────────────────────────
    function dot(parent, col) {
        var d = parent.add("group");
        d.preferredSize = [9, 9];
        d.alignment     = ["left", "center"];
        d.onDraw = function () {
            var g = this.graphics;
            g.newPath(); g.rectPath(1, 1, 7, 7);
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, col));
        };
    }

    // ── Karte (group, KEIN panel → respektiert bg auf macOS) ─────────────────
    function card(parent) {
        var c = parent.add("group");
        c.orientation   = "column";
        c.alignChildren = ["fill", "top"];
        c.alignment     = ["fill", "top"];
        c.spacing       = 5;
        c.margins       = [10, 10, 10, 10];
        bg(c, C.card);
        return c;
    }

    // ── Abschnitts-Header ─────────────────────────────────────────────────────
    function sectionTitle(parent, title, col) {
        var row = parent.add("group");
        row.orientation   = "row";
        row.alignChildren = ["left", "center"];
        row.alignment     = ["fill", "top"];
        row.spacing       = 7;
        row.margins       = [0, 0, 0, 4];
        bg(row, C.card);

        dot(row, col);

        var lbl = row.add("statictext", undefined, title);
        lbl.alignment = ["fill", "center"];
        fg(lbl, C.white);

        // dünne Linie
        var sep = parent.add("group");
        sep.alignment       = ["fill", "top"];
        sep.preferredSize.height = 1;
        sep.onDraw = function () {
            var g = this.graphics, W = this.size[0];
            g.newPath(); g.rectPath(0, 0, W, 1);
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, col));
        };

        // Abstand nach Linie
        var pad = parent.add("group");
        pad.alignment = ["fill", "top"];
        pad.preferredSize.height = 4;
        bg(pad, C.card);
    }

    // ── Slider-Zeile ─────────────────────────────────────────────────────────
    function sliderRow(parent, label, val, lo, hi, unit, col) {
        var row = parent.add("group");
        row.orientation   = "row";
        row.alignChildren = ["left", "center"];
        row.alignment     = ["fill", "top"];
        row.spacing       = 6;
        row.margins       = [0, 1, 0, 1];
        bg(row, C.card);

        dot(row, col);

        var lbl = row.add("statictext", undefined, label);
        lbl.preferredSize.width = 148;
        lbl.alignment = ["left", "center"];
        fg(lbl, C.hi);

        var sl = row.add("slider", undefined, val, lo, hi);
        sl.alignment = ["fill", "center"];   // ← füllt verfügbaren Platz

        var vl = row.add("statictext", undefined, val + unit);
        vl.preferredSize.width = 36;
        vl.alignment = ["right", "center"];
        fg(vl, col);

        sl.onChanging = function () { vl.text = Math.round(sl.value) + unit; };

        return { row: row, slider: sl, valLabel: vl };
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
        bg(win, C.bg);

        // ── Header ────────────────────────────────────────────────────────────
        var hdrRow = win.add("group");
        hdrRow.orientation   = "row";
        hdrRow.alignChildren = ["left", "center"];
        hdrRow.alignment     = ["fill", "top"];
        hdrRow.spacing       = 8;
        hdrRow.margins       = [2, 4, 2, 6];
        bg(hdrRow, C.bg);

        dot(hdrRow, C.orange);

        var title = hdrRow.add("statictext", undefined, "Glitch Preroll");
        title.alignment = ["left", "center"];
        fg(title, C.white);

        var sub = hdrRow.add("statictext", undefined, "AE 2026");
        sub.alignment = ["right", "center"];
        fg(sub, C.lo);

        // ── Karte: Layer ──────────────────────────────────────────────────────
        var cL = card(win);
        sectionTitle(cL, "LAYER SETTINGS", C.purple);

        var ctrlNum = sliderRow(cL, "Number of Layers", DEF_NUM, 1, 5, "", C.orange);

        var sp = cL.add("group"); sp.preferredSize.height = 4; sp.alignment = ["fill","top"]; bg(sp, C.card);

        var layerColors  = [C.orange, C.pink, C.purple, C.blue, C.blue];
        var frameRows    = [], frameSliders = [], frameLabels = [];
        for (var fi = 0; fi < 5; fi++) {
            var fr = sliderRow(cL, "Layer " + (fi + 1) + "  Frames",
                               DEF_FR[fi], 1, 60, " f", layerColors[fi]);
            frameRows.push(fr.row);
            frameSliders.push(fr.slider);
            frameLabels.push(fr.valLabel);
        }

        // ── Karte: Masken ─────────────────────────────────────────────────────
        var cM = card(win);
        sectionTitle(cM, "MASK SETTINGS", C.blue);

        var ctrlDist = sliderRow(cM, "Jump Distance",       DEF_DIST, 1, 40, " %", C.orange);
        var ctrlFreq = sliderRow(cM, "Jump Every N Frames", DEF_FREQ, 1, 15, " f", C.pink);
        var ctrlSize = sliderRow(cM, "Mask Size",           DEF_SIZE, 1, 60, " %", C.purple);

        // ── Button (Leaf → onDraw funktioniert) ───────────────────────────────
        var btn = win.add("button", undefined, "");
        btn.alignment       = ["fill", "top"];
        btn.preferredSize.height = 34;

        btn.onDraw = function () {
            var g = this.graphics, W = this.size[0], H = this.size[1];

            g.newPath(); g.rectPath(0, 0, W, H);
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, C.orange));

            // Shimmer oben
            g.newPath(); g.rectPath(1, 1, W - 2, Math.floor(H * 0.42));
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [0.980, 0.620, 0.200, 1]));

            // Rim unten
            g.newPath(); g.rectPath(0, H - 2, W, 2);
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [0.760, 0.310, 0.005, 1]));

            var txt = "Create Glitch Preroll";
            var pen = g.newPen(g.PenType.SOLID_COLOR, C.white, 1);
            var ms  = g.measureString(txt, g.font, W);
            g.drawString(txt, pen, (W - ms[0]) / 2, (H - ms[1]) / 2);
        };

        // ── Layer-Zeilen ein-/ausblenden ──────────────────────────────────────
        function refreshRows() {
            var n = Math.round(ctrlNum.slider.value);
            ctrlNum.valLabel.text = n;
            for (var j = 0; j < 5; j++) {
                frameRows[j].enabled = (j < n);
                fg(frameLabels[j], j < n ? layerColors[j] : C.lo);
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

        // ── Resize ────────────────────────────────────────────────────────────
        win.onResize = win.onResizeContent = function () {
            win.layout.resize();
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
        var maskW = w * Math.sqrt(sizePct) * (0.5 + Math.random() * 1.8);
        var maskH = h * Math.sqrt(sizePct) * (0.3 + Math.random() * 1.2);
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
            var s  = new Shape();
            s.closed      = true;
            s.vertices    = [[cx - maskW*rs/2, cy - maskH*rs/2],
                              [cx + maskW*rs/2, cy - maskH*rs/2],
                              [cx + maskW*rs/2, cy + maskH*rs/2],
                              [cx - maskW*rs/2, cy + maskH*rs/2]];
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
