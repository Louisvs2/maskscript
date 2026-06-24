// GlitchPrerollPanel.jsx  –  Dockbares ScriptUI Panel für After Effects 2026
//
// Installation:
//   Datei kopieren nach:
//   Win:  ...\Adobe After Effects 2026\Support Files\Scripts\ScriptUI Panels\
//   Mac:  .../Adobe After Effects 2026/Scripts/ScriptUI Panels/
//   AE neu starten → Fenster-Menü → GlitchPrerollPanel

(function (thisObj) {
    "use strict";

    // ── Defaults ──────────────────────────────────────────────────────────────
    var DEF_NUM   = 3;
    var DEF_FR    = [10, 7, 4, 6, 3];
    var DEF_DIST  = 6;
    var DEF_FREQ  = 3;
    var DEF_SIZE  = 10;

    // ── Farbpalette  (0 – 1) ─────────────────────────────────────────────────
    var C = {
        bg:       [0.051, 0.055, 0.075, 1],   // #0D0E13  deep space
        card:     [0.110, 0.118, 0.165, 1],   // #1C1E2A  glass card
        cardEdge: [0.220, 0.231, 0.318, 1],   // #383B51  card rim
        shine:    [0.200, 0.212, 0.290, 1],   // #333549  top-edge shine
        accent:   [0.224, 0.502, 0.957, 1],   // #3980F4  Apple blue
        accentLo: [0.118, 0.373, 0.878, 1],   // #1E5FE0  darker blue
        white:    [1.000, 1.000, 1.000, 1],
        txtHi:    [0.918, 0.929, 0.961, 1],   // #EAEdf5  primary text
        txtMid:   [0.580, 0.600, 0.690, 1],   // #9499B0  secondary text
        txtLo:    [0.345, 0.361, 0.447, 1],   // #585C72  dim text
        sep:      [0.180, 0.192, 0.263, 1],   // #2E3143  separator
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

    // ── Glas-Karte (custom onDraw) ────────────────────────────────────────────
    function glassCard(parent) {
        var g2 = parent.add("group");
        g2.orientation   = "column";
        g2.alignChildren = ["fill", "top"];
        g2.spacing       = 0;
        g2.margins       = 0;

        g2.onDraw = function () {
            var gr = this.graphics;
            var W  = this.size[0], H = this.size[1];

            // Hintergrund
            gr.newPath(); gr.rectPath(0, 0, W, H);
            gr.fillPath(gr.newBrush(gr.BrushType.SOLID_COLOR, C.card));

            // Obere Glanz-Linie
            gr.newPath(); gr.rectPath(1, 1, W - 2, 2);
            gr.fillPath(gr.newBrush(gr.BrushType.SOLID_COLOR, C.shine));

            // Rahmen
            gr.newPath(); gr.rectPath(0.5, 0.5, W - 1, H - 1);
            gr.strokePath(gr.newPen(gr.PenType.SOLID_COLOR, C.cardEdge, 1));
        };

        return g2;
    }

    // ── Abschnitts-Header ─────────────────────────────────────────────────────
    function sectionHeader(parent, title) {
        var hdr = parent.add("group");
        hdr.orientation   = "row";
        hdr.alignChildren = ["left", "center"];
        hdr.margins       = [14, 10, 10, 4];
        hdr.spacing       = 8;
        bg(hdr, C.card);

        // Akzent-Streifen links
        var bar = hdr.add("group");
        bar.preferredSize = [3, 14];
        bar.onDraw = function () {
            var gr = this.graphics;
            var W = this.size[0], H = this.size[1];
            gr.newPath(); gr.rectPath(0, 0, W, H);
            gr.fillPath(gr.newBrush(gr.BrushType.SOLID_COLOR, C.accent));
        };

        var lbl = hdr.add("statictext", undefined, title);
        fg(lbl, C.txtMid);

        // Trennlinie darunter
        var sep = parent.add("group");
        sep.margins = [14, 0, 14, 6];
        bg(sep, C.card);
        sep.onDraw = function () {
            var gr = this.graphics;
            gr.newPath(); gr.rectPath(0, 0, this.size[0], 1);
            gr.fillPath(gr.newBrush(gr.BrushType.SOLID_COLOR, C.sep));
        };
        sep.preferredSize.height = 1;
    }

    // ── Slider-Zeile ─────────────────────────────────────────────────────────
    function sliderRow(parent, label, val, lo, hi, unit) {
        var row = parent.add("group");
        row.orientation   = "row";
        row.alignChildren = ["left", "center"];
        row.spacing       = 8;
        row.margins       = [14, 3, 14, 3];
        bg(row, C.card);

        var lbl = row.add("statictext", undefined, label);
        lbl.preferredSize.width = 158;
        fg(lbl, C.txtHi);

        var sl = row.add("slider", undefined, val, lo, hi);
        sl.preferredSize.width = 108;

        var vl = row.add("statictext", undefined, val + unit);
        vl.preferredSize.width = 36;
        fg(vl, C.accent);

        sl.onChanging = function () { vl.text = Math.round(sl.value) + unit; };

        return { row: row, slider: sl, valLabel: vl, unit: unit };
    }

    // ── Haupt-UI ──────────────────────────────────────────────────────────────
    function buildUI(host) {
        var win = (host instanceof Panel)
            ? host
            : new Window("palette", "Glitch Preroll", undefined, { resizeable: true });

        win.orientation   = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing       = 10;
        win.margins       = 12;
        bg(win, C.bg);

        // ── Logo-Header ───────────────────────────────────────────────────────
        var logoBar = win.add("group");
        logoBar.orientation   = "row";
        logoBar.alignChildren = ["fill", "center"];
        logoBar.margins       = [10, 8, 10, 8];
        logoBar.spacing       = 0;
        bg(logoBar, C.bg);

        // Linke Akzentlinie
        var logoLine = logoBar.add("group");
        logoLine.preferredSize = [3, 22];
        logoLine.onDraw = function () {
            var gr = this.graphics, W = this.size[0], H = this.size[1];
            // Gradient simulation: two rects
            var top = Math.floor(H * 0.5);
            gr.newPath(); gr.rectPath(0, 0, W, top);
            gr.fillPath(gr.newBrush(gr.BrushType.SOLID_COLOR, C.accent));
            gr.newPath(); gr.rectPath(0, top, W, H - top);
            gr.fillPath(gr.newBrush(gr.BrushType.SOLID_COLOR, C.accentLo));
        };

        var logoGrp = logoBar.add("group");
        logoGrp.orientation   = "column";
        logoGrp.alignChildren = ["left", "top"];
        logoGrp.spacing       = 1;
        logoGrp.margins       = [8, 0, 0, 0];
        bg(logoGrp, C.bg);

        var title = logoGrp.add("statictext", undefined, "Glitch Preroll");
        fg(title, C.txtHi);

        var sub = logoGrp.add("statictext", undefined, "After Effects 2026");
        fg(sub, C.txtLo);

        // Trennlinie unter Header
        var topSep = win.add("group");
        topSep.margins = [0, 0, 0, 0];
        bg(topSep, C.bg);
        topSep.onDraw = function () {
            var gr = this.graphics;
            gr.newPath(); gr.rectPath(0, 0, this.size[0], 1);
            gr.fillPath(gr.newBrush(gr.BrushType.SOLID_COLOR, C.sep));
        };
        topSep.preferredSize.height = 1;

        // ── Karte: Layer ──────────────────────────────────────────────────────
        var cardL = glassCard(win);
        sectionHeader(cardL, "LAYER SETTINGS");

        var ctrlNum = sliderRow(cardL, "Number of Layers", DEF_NUM, 1, 5, "");

        var frameRows = [], frameSliders = [], frameLabels = [];
        for (var fi = 0; fi < 5; fi++) {
            var fr = sliderRow(cardL, "Layer " + (fi + 1) + "  –  Frames",
                               DEF_FR[fi], 1, 60, " f");
            frameRows.push(fr.row);
            frameSliders.push(fr.slider);
            frameLabels.push(fr.valLabel);
        }

        // Abstand unten in der Karte
        var padL = cardL.add("group"); padL.preferredSize.height = 6;
        bg(padL, C.card);

        // ── Karte: Masken ─────────────────────────────────────────────────────
        var cardM = glassCard(win);
        sectionHeader(cardM, "MASK SETTINGS");

        var ctrlDist = sliderRow(cardM, "Jump Distance",       DEF_DIST, 1, 40, " %");
        var ctrlFreq = sliderRow(cardM, "Jump Every N Frames", DEF_FREQ, 1, 15, " f");
        var ctrlSize = sliderRow(cardM, "Mask Size",           DEF_SIZE, 1, 60, " %");

        var padM = cardM.add("group"); padM.preferredSize.height = 6;
        bg(padM, C.card);

        // ── Button ────────────────────────────────────────────────────────────
        var btnWrap = win.add("group");
        btnWrap.orientation   = "column";
        btnWrap.alignChildren = ["fill", "center"];
        btnWrap.margins       = [0, 0, 0, 4];
        bg(btnWrap, C.bg);

        var btn = btnWrap.add("button", undefined, "Create Glitch Preroll");
        btn.preferredSize.height = 34;

        // Custom-Draw: blauer Glas-Button
        btn.onDraw = function () {
            var gr = this.graphics;
            var W = this.size[0], H = this.size[1];

            // Blaues Fundament
            gr.newPath(); gr.rectPath(0, 0, W, H);
            gr.fillPath(gr.newBrush(gr.BrushType.SOLID_COLOR, C.accent));

            // Obere Hälfte etwas heller (Glas-Shimmer)
            gr.newPath(); gr.rectPath(1, 1, W - 2, Math.floor(H / 2));
            gr.fillPath(gr.newBrush(gr.BrushType.SOLID_COLOR, C.accentLo));

            // 1px Rim
            gr.newPath(); gr.rectPath(0.5, 0.5, W - 1, H - 1);
            gr.strokePath(gr.newPen(gr.PenType.SOLID_COLOR, C.accent, 1));

            // Text zentriert
            var txt = "Create Glitch Preroll";
            var pen = gr.newPen(gr.PenType.SOLID_COLOR, C.white, 1);
            var ms  = gr.measureString(txt, gr.font, W);
            gr.drawString(txt, pen, (W - ms[0]) / 2, (H - ms[1]) / 2);
        };

        // ── Events ────────────────────────────────────────────────────────────
        function refreshRows() {
            var n = Math.round(ctrlNum.slider.value);
            ctrlNum.valLabel.text = n;
            for (var j = 0; j < 5; j++) {
                frameRows[j].enabled = (j < n);
                fg(frameLabels[j], j < n ? C.accent : C.txtLo);
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
        var w = layer.width,  h = layer.height;
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
            var rW = maskW * rs,  rH = maskH * rs;

            var s = new Shape();
            s.closed      = true;
            s.vertices    = [[cx-rW/2,cy-rH/2],[cx+rW/2,cy-rH/2],[cx+rW/2,cy+rH/2],[cx-rW/2,cy+rH/2]];
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
