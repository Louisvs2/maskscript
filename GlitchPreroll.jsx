// GlitchPreroll.jsx
// After Effects 2026 – ExtendScript
//
// Selects exactly one layer and generates three preroll duplicates
// (10 / 7 / 4 frames) that show the source frames immediately before
// the original layer's inPoint, each masked with a jumping glitch mask.

(function () {
    "use strict";

    // ── guards ────────────────────────────────────────────────────────────────
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Bitte eine aktive Komposition öffnen.");
        return;
    }

    var sel = comp.selectedLayers;
    if (sel.length !== 1) {
        alert("Bitte genau EINEN Layer auswaehlen (aktuell: " + sel.length + ").");
        return;
    }

    var orig = sel[0];

    if (orig.stretch === 0) {
        alert("Layer hat Time-Stretch 0 % - nicht unterstuetzt.");
        return;
    }

    // ── basics ────────────────────────────────────────────────────────────────
    var fps           = comp.frameRate;
    var fd            = 1 / fps;
    var X             = orig.inPoint;
    var W             = comp.width;
    var H             = comp.height;
    var stretchFactor = orig.stretch / 100;

    // Source time visible at composition time X.
    var srcAtX;
    if (orig.timeRemapEnabled) {
        srcAtX = orig.timeRemap.valueAtTime(X, false);
    } else {
        srcAtX = (X - orig.startTime) / stretchFactor;
    }

    // ── mask geometry (~10 % of frame area) ──────────────────────────────────
    var maskArea = 0.10 * W * H;
    var maskW    = Math.sqrt(maskArea * (W / H));
    var maskH    = Math.sqrt(maskArea / (W / H));

    // ── create duplicates ─────────────────────────────────────────────────────
    app.beginUndoGroup("Glitch Preroll");

    var nFramesList = [10, 7, 4];

    for (var i = 0; i < nFramesList.length; i++) {
        var nF     = nFramesList[i];
        var dupDur = nF * fd;
        var dupIn  = X - dupDur;
        var dupOut = X;

        var dup = orig.duplicate();

        // ── Step 1: set timing BEFORE enabling Time Remapping ─────────────────
        // AE allows inPoint/outPoint to be set freely even beyond source bounds.
        // This must happen first so that when we enable timeRemap AE creates
        // its automatic keyframes exactly at dupIn and dupOut.
        dup.outPoint = dupOut;
        dup.inPoint  = dupIn;

        // ── Step 2: enable Time Remapping ─────────────────────────────────────
        // AE now creates exactly two keyframes:
        //   key 1  at dupIn   with value = source time at dupIn
        //   key 2  at dupOut  with value = source time at dupOut
        dup.timeRemapEnabled = true;

        // Always re-fetch the property reference after structural changes.
        var tr = dup.property("ADBE Time Remapping");

        // ── Step 3: correct key values ────────────────────────────────────────
        // The auto-generated values may reference negative source time (when
        // the layer hasn't been on screen long enough before X).  We clamp
        // key 1 to 0 and freeze it if necessary.
        var srcAtDupIn = srcAtX + (dupIn - X) / stretchFactor;
        var srcMin     = 0.0;

        var k1time = tr.keyTime(1);
        var k2time = tr.keyTime(tr.numKeys); // last key = dupOut (or dupOut+1f)

        if (stretchFactor > 0 && srcAtDupIn < srcMin) {
            // Not enough source before X: freeze at first frame.
            tr.setValueAtTime(k1time, srcMin);
            tr.setInterpolationTypeAtKey(1, KeyframeInterpolationType.HOLD);
            tr.setValueAtTime(k2time, srcAtX);
        } else {
            // Enough source material: ensure linear playback to srcAtX.
            tr.setValueAtTime(k1time, srcAtDupIn);
            tr.setValueAtTime(k2time, srcAtX);
        }

        // ── Step 4: animated glitch mask ─────────────────────────────────────
        addGlitchMask(dup, dupIn, dupOut, fd, W, H, maskW, maskH);
    }

    app.endUndoGroup();

    // ── helper ────────────────────────────────────────────────────────────────
    function addGlitchMask(layer, layerIn, layerOut, frameDur,
                            cW, cH, mW, mH) {

        var mask = layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");

        mask.maskMode      = MaskMode.ADD;
        mask.maskFeather   = [0, 0];
        mask.maskOpacity   = 100;
        mask.maskExpansion = 0;
        mask.inverted      = false;

        var maskShape = mask.property("ADBE Mask Shape");

        var cx        = cW / 2;
        var cy        = cH / 2;
        var maxOffset = Math.min(cW, cH) * 0.20;

        // Keyframe times: every 1-2 frames, randomised
        var times = [];
        var t     = layerIn;
        while (t <= layerOut + frameDur * 0.01) {
            times.push(t);
            t += (Math.random() < 0.5 ? 1 : 2) * frameDur;
        }
        if (times[times.length - 1] < layerOut - frameDur * 0.01) {
            times.push(layerOut);
        }

        for (var j = 0; j < times.length; j++) {
            var rx = cx + (Math.random() - 0.5) * 2 * maxOffset;
            var ry = cy + (Math.random() - 0.5) * 2 * maxOffset;

            var shape         = new Shape();
            shape.closed      = true;
            shape.vertices    = [[rx - mW / 2, ry - mH / 2],
                                  [rx + mW / 2, ry - mH / 2],
                                  [rx + mW / 2, ry + mH / 2],
                                  [rx - mW / 2, ry + mH / 2]];
            shape.inTangents  = [[0, 0], [0, 0], [0, 0], [0, 0]];
            shape.outTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];

            maskShape.setValueAtTime(times[j], shape);
        }

        // HOLD on every mask-shape keyframe – hard jumps, no interpolation
        for (var k = 1; k <= maskShape.numKeys; k++) {
            maskShape.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);
        }
    }

}());
