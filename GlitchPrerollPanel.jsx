// GlitchPrerollPanel.jsx  –  Dockbares ScriptUI Panel für After Effects 2026
//
// Installation:
//   Datei kopieren nach:
//   Mac:  /Applications/Adobe After Effects 2026/Scripts/ScriptUI Panels/
//   Win:  ...\Adobe After Effects 2026\Support Files\Scripts\ScriptUI Panels\
//   AE neu starten → Fenster-Menü → GlitchPrerollPanel

(function (thisObj) {
    "use strict";

    // ── Defaults ──────────────────────────────────────────────────────────────
    var DEF_NUM  = 3;
    var DEF_FR   = [10, 7, 4, 6, 3];
    var DEF_DIST = 6;
    var DEF_FREQ = 3;
    var DEF_SIZE = 10;

    // ── Farben (0–1) ──────────────────────────────────────────────────────────
    var C = {
        bg:     [0.110, 0.114, 0.153, 1],   // #1C1D27
        card:   [0.145, 0.149, 0.200, 1],   // #252633
        accent: [0.224, 0.502, 0.957, 1],   // #3980F4
        txtHi:  [0.918, 0.922, 0.953, 1],   // #EAEBF3
        txtMid: [0.580, 0.592, 0.675, 1],   // #9497AC
        txtLo:  [0.380, 0.388, 0.455, 1],   // #616274
    };

    function setBg(el, col) {
        el.graphics.backgroundColor =
            el.graphics.newBrush(el.graphics.BrushType.SOLID_COLOR, col);
    }
    function setFg(el, col) {
        el.graphics.foregroundColor =
            el.graphics.newPen(el.graphics.PenType.SOLID_COLOR, col, 1);
    }

    // ── Slider-Zeile ─────────────────────────────────────────────────────────
    function sliderRow(parent, label, val, lo, hi, unit) {
        var row = parent.add("group");
        row.orientation   = "row";
        row.alignChildren = ["left", "center"];
        row.spacing       = 6;
        row.margins       = [0, 2, 0, 2];

        var lbl = row.add("statictext", undefined, label);
        lbl.preferredSize.width = 170;
        setFg(lbl, C.txtHi);

        var sl = row.add("slider", undefined, val, lo, hi);
        sl.preferredSize.width = 100;

        var vl = row.add("statictext", undefined, val + unit);
        vl.preferredSize.width = 36;
        setFg(vl, C.accent);

        sl.onChanging = function () { vl.text = Math.round(sl.value) + unit; };

        return { row: row, slider: sl, valLabel: vl, unit: unit };
    }

    // ── UI aufbauen ───────────────────────────────────────────────────────────
    function buildUI(host) {
        var win = (host instanceof Panel)
            ? host
            : new Window("palette", "Glitch Preroll", undefined, { resizeable: true });

        win.orientation   = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing       = 8;
        win.margins       = 10;
        setBg(win, C.bg);

        // ── Header ────────────────────────────────────────────────────────────
        var hdr = win.add("group");
        hdr.orientation   = "row";
        hdr.alignChildren = ["left", "center"];
        hdr.margins       = [6, 6, 6, 6];
        hdr.spacing       = 8;
        setBg(hdr, C.bg);

        var hTitle = hdr.add("statictext", undefined, "Glitch Preroll");
        setFg(hTitle, C.accent);

        var hSub = hdr.add("statictext", undefined, "— After Effects 2026");
        setFg(hSub, C.txtLo);

        // ── Sektion: Layer ────────────────────────────────────────────────────
        var secL = win.add("panel", undefined, "Layer-Einstellungen");
        secL.orientation   = "column";
        secL.alignChildren = ["fill", "top"];
        secL.spacing       = 6;
        secL.margins       = [10, 16, 10, 10];
        setBg(secL, C.card);
        setFg(secL, C.txtMid);

        var ctrlNum = sliderRow(secL, "Anzahl Layer", DEF_NUM, 1, 5, "");

        var frameRows = [], frameSliders = [], frameLabels = [];
        for (var fi = 0; fi < 5; fi++) {
            var fr = sliderRow(secL, "Layer " + (fi + 1) + "  –  Frames",
                               DEF_FR[fi], 1, 60, " f");
            frameRows.push(fr.row);
            frameSliders.push(fr.slider);
            frameLabels.push(fr.valLabel);
        }

        // ── Sektion: Masken ───────────────────────────────────────────────────
        var secM = win.add("panel", undefined, "Masken-Einstellungen");
        secM.orientation   = "column";
        secM.alignChildren = ["fill", "top"];
        secM.spacing       = 6;
        secM.margins       = [10, 16, 10, 10];
        setBg(secM, C.card);
        setFg(secM, C.txtMid);

        var ctrlDist = sliderRow(secM, "Sprungweite",          DEF_DIST, 1, 40, " %");
        var ctrlFreq = sliderRow(secM, "Sprung alle N Frames", DEF_FREQ, 1, 15, " f");
        var ctrlSize = sliderRow(secM, "Maskengrösse",         DEF_SIZE, 1, 60, " %");

        // ── Button ────────────────────────────────────────────────────────────
        var btn = win.add("button", undefined, "Create Glitch Preroll");
        btn.preferredSize.height = 32;

        // ── Events ────────────────────────────────────────────────────────────
        function refreshRows() {
            var n = Math.round(ctrlNum.slider.value);
            ctrlNum.valLabel.text = n;
            for (var j = 0; j < 5; j++) {
                frameRows[j].enabled = (j < n);
                setFg(frameLabels[j], j < n ? C.accent : C.txtLo);
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
