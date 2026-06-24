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
    var fps = comp.frameRate;
    var fd  = 1 / fps;
    var X   = orig.inPoint;     // comp time where original clip starts
    var W   = comp.width;
    var H   = comp.height;
    var SF  = orig.stretch / 100;

    // Source time visible at comp time X in the original layer
    var srcAtX = orig.timeRemapEnabled
        ? orig.timeRemap.valueAtTime(X, false)
        : (X - orig.startTime) / SF;

    // ── mask geometry (~10 % of frame area) ──────────────────────────────────
    var maskArea = 0.10 * W * H;
    var maskW    = Math.sqrt(maskArea * (W / H));
    var maskH    = Math.sqrt(maskArea / (W / H));

    // ─────────────────────────────────────────────────────────────────────────
    app.beginUndoGroup("Glitch Preroll");

    var nFramesList = [10, 7, 4];

    for (var i = 0; i < nFramesList.length; i++) {
        var nF      = nFramesList[i];
        var wantIn  = X - nF * fd;          // desired composition inPoint
        var dupIn   = Math.max(0, wantIn);  // clamped to comp start
        var dupOut  = X;

        // 1. Duplicate (same timing as original: inPoint=X, outPoint=orig.outPoint)
        var dup = orig.duplicate();

        // 2. Enable Time Remapping FIRST.
        //    This must happen before any inPoint/outPoint manipulation because:
        //    – without TR, AE clamps inPoint to the source's natural start
        //    – enabling TR can also reset inPoint to 0 in some builds, which
        //      is fine here since we fix it in step 5.
        dup.timeRemapEnabled = true;
        var tr = dup.property("ADBE Time Remapping");

        // 3. Calculate the source time we want at dupIn.
        //    Formula: src(t) = srcAtX + (t – X) / SF
        var srcAtDupIn = srcAtX + (dupIn - X) / SF;
        // Clamp to 0 if source doesn't reach that far back (freeze first frame).
        var startSrc = (SF > 0 && srcAtDupIn < 0) ? 0 : srcAtDupIn;

        // 4. Write time-remap keyframes.
        //    After enabling TR, the layer's visible range is determined by the
        //    existing auto-generated keys (at the original inPoint and outPoint).
        //    We overwrite / add values at exactly dupIn and X.
        //    Both times must lie within the layer's CURRENT in/out range.
        //
        //    Current state after step 2 (worst case):
        //      inPoint might be 0, outPoint might be orig.outPoint
        //      ⇒  dupIn ≥ 0  and  X ≤ orig.outPoint  → both within range ✓
        tr.setValueAtTime(dupIn, startSrc);
        tr.setValueAtTime(X,     srcAtX);

        // If we froze, make the first keyframe a hard HOLD.
        if (SF > 0 && srcAtDupIn < 0) {
            for (var k = 1; k <= tr.numKeys; k++) {
                if (Math.abs(tr.keyTime(k) - dupIn) < fd * 0.1) {
                    tr.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);
                    break;
                }
            }
        }

        // Remove any auto-generated keys that are NOT at dupIn or X.
        for (var k = tr.numKeys; k >= 1; k--) {
            var kt = tr.keyTime(k);
            if (Math.abs(kt - dupIn) > fd * 0.1 && Math.abs(kt - X) > fd * 0.1) {
                tr.removeKey(k);
            }
        }

        // 5. NOW set inPoint and outPoint.
        //    TR is active → AE is no longer constrained by source availability.
        dup.inPoint  = dupIn;
        dup.outPoint = dupOut;

        // 6. Animated glitch mask
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
        if (times.length === 0 || times[times.length - 1] < layerOut - frameDur * 0.01) {
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

        // HOLD on every keyframe → hard jumps, no blending
        for (var k = 1; k <= maskShape.numKeys; k++) {
            maskShape.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);
        }
    }

}());
