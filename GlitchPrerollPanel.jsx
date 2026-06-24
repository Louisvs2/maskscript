// GlitchPrerollPanel.jsx
//
// Installation:
//   Datei in den Ordner "ScriptUI Panels" kopieren:
//   Windows:  C:\Program Files\Adobe\Adobe After Effects 2026\Support Files\Scripts\ScriptUI Panels\
//   Mac:      /Applications/Adobe After Effects 2026/Scripts/ScriptUI Panels/
//   Danach AE neu starten → Panel unter Fenster-Menü verfügbar und andockbar.

(function (thisObj) {
    "use strict";

    // ── Standard-Werte ────────────────────────────────────────────────────────
    var DEF_NUM_LAYERS = 3;
    var DEF_FRAMES     = [10, 7, 4, 6, 3];   // Frame-Längen für bis zu 5 Layer
    var DEF_JUMP_DIST  = 6;                   // Sprungweite in % der Bildbreite
    var DEF_JUMP_FREQ  = 3;                   // Frames zwischen zwei Masken-Sprüngen
    var DEF_MASK_SIZE  = 10;                  // Maskengröße in % der Bildfläche

    // ── UI aufbauen ───────────────────────────────────────────────────────────
    function buildUI(thisObj) {

        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Glitch Preroll", undefined, { resizeable: true });

        win.orientation    = "column";
        win.alignChildren  = ["fill", "top"];
        win.spacing        = 10;
        win.margins        = 14;

        // ── Abschnitt: Layer ──────────────────────────────────────────────────
        var grpLayer = win.add("panel", undefined, "Layer-Einstellungen");
        grpLayer.orientation   = "column";
        grpLayer.alignChildren = ["fill", "top"];
        grpLayer.spacing       = 8;
        grpLayer.margins       = [12, 18, 12, 12];

        // Anzahl Layer
        var ctrlNum = makeSliderRow(grpLayer, "Anzahl Layer", DEF_NUM_LAYERS, 1, 5, "");

        // Frame-Längen pro Layer (bis zu 5)
        var frameRows    = [];
        var frameSliders = [];
        var frameLabels  = [];
        for (var fi = 0; fi < 5; fi++) {
            var fr = makeSliderRow(grpLayer, "Layer " + (fi + 1) + " – Frames",
                                   DEF_FRAMES[fi], 1, 60, " f");
            frameRows.push(fr.row);
            frameSliders.push(fr.slider);
            frameLabels.push(fr.valLabel);
        }

        // ── Abschnitt: Masken ─────────────────────────────────────────────────
        var grpMask = win.add("panel", undefined, "Masken-Einstellungen");
        grpMask.orientation   = "column";
        grpMask.alignChildren = ["fill", "top"];
        grpMask.spacing       = 8;
        grpMask.margins       = [12, 18, 12, 12];

        var ctrlDist = makeSliderRow(grpMask, "Sprungweite",      DEF_JUMP_DIST, 1,  40, " %");
        var ctrlFreq = makeSliderRow(grpMask, "Sprung alle N Frames", DEF_JUMP_FREQ, 1, 15, " f");
        var ctrlSize = makeSliderRow(grpMask, "Maskengroesse",    DEF_MASK_SIZE, 1,  60, " %");

        // ── Button ────────────────────────────────────────────────────────────
        var btn = win.add("button", undefined, "Glitch Preroll erstellen");
        btn.preferredSize.height = 32;

        // ── Logik: Sichtbarkeit der Frame-Slider ──────────────────────────────
        function refreshLayerRows() {
            var n = Math.round(ctrlNum.slider.value);
            ctrlNum.valLabel.text = n;
            for (var j = 0; j < 5; j++) {
                frameRows[j].enabled = (j < n);
            }
        }
        ctrlNum.slider.onChanging = refreshLayerRows;
        ctrlNum.slider.onChange   = refreshLayerRows;
        refreshLayerRows();

        // ── Button-Klick → Effekt anwenden ───────────────────────────────────
        btn.onClick = function () {
            var n      = Math.round(ctrlNum.slider.value);
            var frames = [];
            for (var j = 0; j < n; j++) {
                frames.push(Math.round(frameSliders[j].value));
            }
            runGlitchPreroll(
                n,
                frames,
                Math.round(ctrlDist.slider.value) / 100,
                Math.round(ctrlFreq.slider.value),
                Math.round(ctrlSize.slider.value) / 100
            );
        };

        win.layout.layout(true);
        win.layout.resize();
        return win;
    }

    // ── Slider-Zeile (Label | Slider | Wert-Anzeige) ──────────────────────────
    function makeSliderRow(parent, label, val, minVal, maxVal, unit) {
        var row = parent.add("group");
        row.orientation   = "row";
        row.alignChildren = ["left", "center"];
        row.spacing       = 6;

        var lbl = row.add("statictext", undefined, label + ":");
        lbl.preferredSize.width = 150;

        var sl = row.add("slider", undefined, val, minVal, maxVal);
        sl.preferredSize.width = 100;

        var vl = row.add("statictext", undefined, val + unit);
        vl.preferredSize.width = 38;

        sl.onChanging = function () {
            vl.text = Math.round(sl.value) + unit;
        };

        return { row: row, slider: sl, valLabel: vl, unit: unit };
    }

    // ── Hauptlogik ────────────────────────────────────────────────────────────
    function runGlitchPreroll(numLayers, frames, jumpDist, jumpFreq, maskSizePct) {

        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Bitte eine Komposition oeffnen.");
            return;
        }
        if (comp.selectedLayers.length !== 1) {
            alert("Bitte genau EINEN Layer auswaehlen.");
            return;
        }

        var orig = comp.selectedLayers[0];
        var fps  = comp.frameRate;
        var fd   = 1 / fps;
        var X    = orig.inPoint;

        // Anker-Layer 2 Positionen über dem Original merken (vor dem Duplizieren)
        var anchorLayer = (orig.index >= 3) ? comp.layer(orig.index - 2) : null;

        app.beginUndoGroup("Glitch Preroll");

        for (var i = 0; i < numLayers; i++) {
            var nF     = frames[i];
            var dupIn  = X - nF * fd;
            var dupOut = X;

            var dup = orig.duplicate();

            if (anchorLayer) {
                dup.moveBefore(anchorLayer);
            } else {
                dup.moveToBeginning();
            }

            dup.inPoint  = dupIn;
            dup.outPoint = dupOut;

            applyGlitchMask(dup, dupIn, dupOut, fd, jumpDist, jumpFreq, maskSizePct);
        }

        app.endUndoGroup();
    }

    // ── Glitch-Maske ─────────────────────────────────────────────────────────
    function applyGlitchMask(layer, layerIn, layerOut, frameDur,
                              jumpDist, jumpFreq, maskSizePct) {
        var w = layer.width;
        var h = layer.height;

        // Zufälliger Charakter pro Layer-Erstellung
        var offsetX = (Math.random() - 0.5) * 0.5;
        var offsetY = (Math.random() - 0.5) * 0.5;
        var scaleW  = 0.5 + Math.random() * 1.8;
        var scaleH  = 0.3 + Math.random() * 1.2;

        var base  = Math.sqrt(maskSizePct);
        var maskW = w * base * scaleW;
        var maskH = h * base * scaleH;
        var baseCX = w / 2 + offsetX * w;
        var baseCY = h / 2 + offsetY * h;

        var mask     = layer.Masks.addProperty("Mask");
        var pathProp = mask.property("Mask Path");
        mask.property("Mask Feather").setValue([0, 0]);

        var t = layerIn;
        while (t <= layerOut + frameDur * 0.01) {

            var cx = baseCX + (Math.random() - 0.5) * w * jumpDist;
            var cy = baseCY + (Math.random() - 0.5) * h * jumpDist;

            var rs = 0.5 + Math.random();   // Größen-Zufall pro Keyframe
            var rW = maskW * rs;
            var rH = maskH * rs;

            var shape         = new Shape();
            shape.closed      = true;
            shape.vertices    = [[cx - rW/2, cy - rH/2],
                                  [cx + rW/2, cy - rH/2],
                                  [cx + rW/2, cy + rH/2],
                                  [cx - rW/2, cy + rH/2]];
            shape.inTangents  = [[0,0],[0,0],[0,0],[0,0]];
            shape.outTangents = [[0,0],[0,0],[0,0],[0,0]];

            pathProp.setValueAtTime(t, shape);

            t += (jumpFreq + Math.floor(Math.random() * 2)) * frameDur;
        }

        for (var k = 1; k <= pathProp.numKeys; k++) {
            pathProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);
        }
    }

    // ── Panel starten ─────────────────────────────────────────────────────────
    var panel = buildUI(thisObj);
    if (panel instanceof Window) {
        panel.center();
        panel.show();
    }

}(this));
