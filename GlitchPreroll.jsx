// GlitchPreroll.jsx  –  After Effects 2026 ExtendScript
// Generates a 3-layer glitch preroll (10 / 7 / 4 frames) above the
// selected layer, each showing the source frames directly before its inPoint.

(function () {
    "use strict";

    // ── guards ────────────────────────────────────────────────────────────────
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Bitte eine aktive Komposition oeffnen.");
        return;
    }
    var sel = comp.selectedLayers;
    if (sel.length !== 1) {
        alert("Bitte genau EINEN Layer auswaehlen (aktuell: " + sel.length + ").");
        return;
    }
    var orig = sel[0];
    if (orig.stretch === 0) {
        alert("Time-Stretch 0 % wird nicht unterstuetzt.");
        return;
    }

    // ── project values ────────────────────────────────────────────────────────
    var fps           = comp.frameRate;
    var fd            = 1 / fps;
    var X             = orig.inPoint;           // comp time where original starts
    var W             = comp.width;
    var H             = comp.height;
    var SF            = orig.stretch / 100;     // stretch factor (neg = reversed)
    var origStartTime = orig.startTime;

    // Source time visible at comp time X in the original layer
    var srcAtX = orig.timeRemapEnabled
        ? orig.timeRemap.valueAtTime(X, false)
        : (X - origStartTime) / SF;

    // ── mask geometry (~10 % of frame area) ──────────────────────────────────
    var maskArea = 0.10 * W * H;
    var maskW    = Math.sqrt(maskArea * (W / H));
    var maskH    = Math.sqrt(maskArea / (W / H));

    // ─────────────────────────────────────────────────────────────────────────
    app.beginUndoGroup("Glitch Preroll");

    var nFramesList = [10, 7, 4];

    for (var i = 0; i < nFramesList.length; i++) {
        var nF    = nFramesList[i];
        var dupIn = X - nF * fd;   // preroll starts here
        var dupOut = X;            // preroll ends exactly at original inPoint

        // 1. Duplicate (lands directly above original, same timing as orig)
        var dup = orig.duplicate();

        // 2. Adjust inPoint / outPoint BEFORE touching Time Remapping.
        //    IMPORTANT: inPoint must be set first.
        //    If outPoint were set to X while inPoint is still X, the layer
        //    would momentarily have zero length and AE behaves unpredictably.
        dup.inPoint  = dupIn;   // extend backward  (safe: dupIn < current outPoint)
        dup.outPoint = dupOut;  // trim to X        (safe: dupOut <= current outPoint)

        // 3. Enable Time Remapping NOW (inPoint/outPoint are already correct).
        //    AE auto-creates two keyframes:
        //      key 1  at dupIn  with value = source-time at dupIn
        //      key 2  at dupOut (= X)  with value = source-time at dupOut
        dup.timeRemapEnabled = true;

        // Always re-fetch the property ref after structural changes.
        var tr     = dup.property("ADBE Time Remapping");
        var k1t    = tr.keyTime(1);              // should be dupIn
        var k2t    = tr.keyTime(tr.numKeys);     // should be X (or X + 1 frame)

        // Source time we want to show at the start of the preroll
        var srcAtDupIn = srcAtX + (dupIn - X) / SF;

        if (SF > 0 && srcAtDupIn < 0) {
            // Source exhausted: freeze on frame 0 and ramp to srcAtX
            tr.setValueAtTime(k1t, 0);
            tr.setInterpolationTypeAtKey(1, KeyframeInterpolationType.HOLD);
            tr.setValueAtTime(k2t, srcAtX);
        } else {
            // Normal case: show source frames leading up to X
            tr.setValueAtTime(k1t, srcAtDupIn);
            tr.setValueAtTime(k2t, srcAtX);
        }

        // 4. Animated glitch mask
        addGlitchMask(dup, dupIn, dupOut, fd, W, H, maskW, maskH);
    }

    app.endUndoGroup();

    // ── helper: jumping hard-edged rectangle mask ─────────────────────────────
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
        var maxOff    = Math.min(cW, cH) * 0.20;

        // One keyframe every 1-2 frames (random)
        var times = [];
        var t     = layerIn;
        while (t < layerOut + frameDur * 0.01) {
            times.push(t);
            t += (Math.random() < 0.5 ? 1 : 2) * frameDur;
        }
        if (times[times.length - 1] < layerOut - frameDur * 0.01) {
            times.push(layerOut);
        }

        for (var j = 0; j < times.length; j++) {
            var rx = cx + (Math.random() - 0.5) * 2 * maxOff;
            var ry = cy + (Math.random() - 0.5) * 2 * maxOff;
            var s  = new Shape();
            s.closed      = true;
            s.vertices    = [[rx - mW/2, ry - mH/2],
                              [rx + mW/2, ry - mH/2],
                              [rx + mW/2, ry + mH/2],
                              [rx - mW/2, ry + mH/2]];
            s.inTangents  = [[0,0],[0,0],[0,0],[0,0]];
            s.outTangents = [[0,0],[0,0],[0,0],[0,0]];
            maskShape.setValueAtTime(times[j], s);
        }

        // HOLD interpolation on every keyframe → hard jumps, no blending
        for (var k = 1; k <= maskShape.numKeys; k++) {
            maskShape.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);
        }
    }

}());
