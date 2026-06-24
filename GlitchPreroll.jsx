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

    var nFramesList = [10, 7, 4];

    for (var i = 0; i < nFramesList.length; i++) {
        var nF     = nFramesList[i];
        var dupIn  = X - nF * fd;
        var dupOut = X;

        // ── 1 + 2 + 3: Duplizieren, links verlängern, rechts abschneiden ────
        var dup = orig.duplicate();
        dup.inPoint  = dupIn;    // N Frames nach links
        dup.outPoint = dupOut;   // endet exakt bei X

        // ── 4: Glitch-Maske ──────────────────────────────────────────────────
        applyGlitchMask(dup, dupIn, dupOut, fd);
    }
}

app.endUndoGroup();

// ─────────────────────────────────────────────────────────────────────────────
// Maske: springendes Rechteck, ~10% der Layerfläche, HOLD-Keyframes
// (Logik aus RandomAnimatedMask.jsx übernommen)
// ─────────────────────────────────────────────────────────────────────────────
function applyGlitchMask(layer, layerIn, layerOut, frameDur) {

    var w     = layer.width;
    var h     = layer.height;

    // ~10% der Layerfläche  (gleiche Formel wie RandomAnimatedMask)
    var scale = Math.sqrt(0.10);
    var maskW = w * scale;
    var maskH = h * scale;

    var mask     = layer.Masks.addProperty("Mask");
    var pathProp = mask.property("Mask Path");

    // Harte Kanten, keine Abrundung
    mask.property("Mask Feather").setValue([0, 0]);

    // Jeden 1. oder 2. Frame einen neuen Keyframe setzen
    var t = layerIn;
    while (t <= layerOut + frameDur * 0.01) {

        var cx = w/2 + (Math.random() - 0.5) * w * 0.2;
        var cy = h/2 + (Math.random() - 0.5) * h * 0.2;

        var shape = new Shape();
        shape.vertices = [
            [cx - maskW/2, cy - maskH/2],
            [cx + maskW/2, cy - maskH/2],
            [cx + maskW/2, cy + maskH/2],
            [cx - maskW/2, cy + maskH/2]
        ];
        shape.inTangents  = [[0,0],[0,0],[0,0],[0,0]];
        shape.outTangents = [[0,0],[0,0],[0,0],[0,0]];
        shape.closed = true;

        pathProp.setValueAtTime(t, shape);

        t += (Math.random() < 0.5 ? 1 : 2) * frameDur;
    }

    // Alle Keyframes auf HOLD  →  harte Sprünge, keine Interpolation
    for (var k = 1; k <= pathProp.numKeys; k++) {
        pathProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);
    }
}
