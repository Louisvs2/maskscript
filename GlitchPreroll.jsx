// GlitchPreroll.jsx  –  After Effects 2026 ExtendScript
//
// Workflow:
//   1. Clip duplizieren
//   2. Duplikat N Frames nach links verlängern  (inPoint = X - N*fd)
//   3. Duplikat bei X abschneiden               (outPoint = X)
//   4. Glitch-Maske aufbringen  (basierend auf RandomAnimatedMask-Logik)
//
// N = 10, 7, 4  →  drei Duplikate

app.beginUndoGroup("Glitch Preroll");

var comp = app.project.activeItem;

if (!(comp instanceof CompItem)) {
    alert("Bitte eine Komposition öffnen.");
} else if (comp.selectedLayers.length !== 1) {
    alert("Bitte genau EINEN Layer auswählen.");
} else {

    var orig   = comp.selectedLayers[0];
    var fps    = comp.frameRate;
    var fd     = 1 / fps;
    var X      = orig.inPoint;   // Startpunkt des Originalclips

    // Layer-Referenz 2 Positionen über dem Original im Stack (einmalig merken,
    // bevor Duplikate den Index verschieben).
    // Alle Duplikate werden vor diesen Layer geschoben → landen 2 über Original.
    var anchorLayer = (orig.index >= 3) ? comp.layer(orig.index - 2) : null;

    var nFramesList = [10, 7, 4];

    // Masken-Charakter pro Duplikat:
    //   offsetX  – horizontale Verschiebung relativ zur Mitte (0 = Mitte, -0.25 = links)
    //   offsetY  – vertikale Verschiebung relativ zur Mitte  (0 = Mitte, -0.25 = oben)
    //   scaleW   – Breiten-Faktor  (1 = normal, 1.8 = breiter/länger)
    //   scaleH   – Höhen-Faktor
    var maskConfigs = [
        { offsetX: -0.25, offsetY:  0.00, scaleW: 1.0, scaleH: 1.0 },  // Dup 1 (10f): links
        { offsetX:  0.00, offsetY:  0.00, scaleW: 1.8, scaleH: 0.5 },  // Dup 2 ( 7f): breiter/länger
        { offsetX:  0.00, offsetY: -0.25, scaleW: 1.0, scaleH: 1.0 }   // Dup 3 ( 4f): höher
    ];

    for (var i = 0; i < nFramesList.length; i++) {
        var nF     = nFramesList[i];
        var dupIn  = X - nF * fd;
        var dupOut = X;

        // ── 1 + 2 + 3: Duplizieren, links verlängern, rechts abschneiden ────
        var dup = orig.duplicate();
        // 2 Layer über dem Original einsortieren
        if (anchorLayer) {
            dup.moveBefore(anchorLayer);
        } else {
            dup.moveToBeginning();
        }
        dup.inPoint  = dupIn;    // N Frames nach links
        dup.outPoint = dupOut;   // endet exakt bei X

        // ── 4: Glitch-Maske ──────────────────────────────────────────────────
        applyGlitchMask(dup, dupIn, dupOut, fd, maskConfigs[i]);
    }
}

app.endUndoGroup();

// ─────────────────────────────────────────────────────────────────────────────
// Maske: springendes Rechteck, ~10% der Layerfläche, HOLD-Keyframes
// (Logik aus RandomAnimatedMask.jsx übernommen)
// ─────────────────────────────────────────────────────────────────────────────
function applyGlitchMask(layer, layerIn, layerOut, frameDur, cfg) {

    var w     = layer.width;
    var h     = layer.height;

    // ~10% der Layerfläche, skaliert durch den Masken-Charakter
    var base  = Math.sqrt(0.10);
    var maskW = w * base * cfg.scaleW;
    var maskH = h * base * cfg.scaleH;

    // Basis-Mittelpunkt mit festem Offset (+ zufälliger Streuung)
    var baseCX = w/2 + cfg.offsetX * w;
    var baseCY = h/2 + cfg.offsetY * h;

    var mask     = layer.Masks.addProperty("Mask");
    var pathProp = mask.property("Mask Path");

    // Harte Kanten, keine Abrundung
    mask.property("Mask Feather").setValue([0, 0]);

    // Jeden 1. oder 2. Frame einen neuen Keyframe setzen
    var t = layerIn;
    while (t <= layerOut + frameDur * 0.01) {

        var cx = baseCX + (Math.random() - 0.5) * w * 0.06;
        var cy = baseCY + (Math.random() - 0.5) * h * 0.06;

        // Zufällige Größe pro Keyframe: zwischen 50% und 150% der Basis-Maske
        var randScale = 0.5 + Math.random();
        var rW = maskW * randScale;
        var rH = maskH * randScale;

        var shape = new Shape();
        shape.vertices = [
            [cx - rW/2, cy - rH/2],
            [cx + rW/2, cy - rH/2],
            [cx + rW/2, cy + rH/2],
            [cx - rW/2, cy + rH/2]
        ];
        shape.inTangents  = [[0,0],[0,0],[0,0],[0,0]];
        shape.outTangents = [[0,0],[0,0],[0,0],[0,0]];
        shape.closed = true;

        pathProp.setValueAtTime(t, shape);

        t += (2 + Math.floor(Math.random() * 3)) * frameDur; // alle 2–4 Frames
    }

    // Alle Keyframes auf HOLD  →  harte Sprünge, keine Interpolation
    for (var k = 1; k <= pathProp.numKeys; k++) {
        pathProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);
    }
}
