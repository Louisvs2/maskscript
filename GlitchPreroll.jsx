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
        alert("Bitte genau EINEN Layer auswählen (aktuell: " + sel.length + ").");
        return;
    }

    var orig = sel[0];

    if (orig.stretch === 0) {
        alert("Layer hat Time-Stretch 0 % – nicht unterstützt.");
        return;
    }

    // ── basics ────────────────────────────────────────────────────────────────
    var fps           = comp.frameRate;
    var fd            = 1 / fps;           // one frame in seconds
    var X             = orig.inPoint;      // composition time of layer start
    var W             = comp.width;
    var H             = comp.height;
    var stretchFactor = orig.stretch / 100; // negative = reversed clip

    // Source time that appears at composition time X in the original layer.
    // If the original already uses Time Remapping we sample it directly,
    // otherwise we use the standard linear formula.
    var srcAtX;
    if (orig.timeRemapEnabled) {
        srcAtX = orig.timeRemap.valueAtTime(X, false);
    } else {
        srcAtX = (X - orig.startTime) / stretchFactor;
    }

    // ── mask geometry (~10 % of frame area, aspect-correct rectangle) ─────────
    var maskArea = 0.10 * W * H;
    var maskW    = Math.sqrt(maskArea * (W / H));   // width  in pixels
    var maskH    = Math.sqrt(maskArea / (W / H));   // height in pixels

    // ── create duplicates ─────────────────────────────────────────────────────
    app.beginUndoGroup("Glitch Preroll");

    var nFramesList = [10, 7, 4]; // longest first → stacked correctly

    for (var i = 0; i < nFramesList.length; i++) {
        var nF     = nFramesList[i];
        var dupDur = nF * fd;
        var dupIn  = X - dupDur;
        var dupOut = X;

        // Duplicate is placed directly above the original by AE
        var dup = orig.duplicate();

        // ── Time Remapping ────────────────────────────────────────────────────
        // Enables free placement of any source frame at any comp time and
        // guarantees a freeze hold when source material is exhausted.
        dup.timeRemapEnabled = true;

        var tr = dup.timeRemap; // "ADBE Time Remapping"

        // Remove the two auto-generated keyframes
        while (tr.numKeys > 0) {
            tr.removeKey(1);
        }

        // Set layer bounds first so keyframes fall within the visible range
        dup.inPoint  = dupIn;
        dup.outPoint = dupOut;

        // Source time that would appear at dupIn if we preserve original stretch
        // Formula:  src(t) = srcAtX + (t – X) / stretchFactor
        var srcAtDupIn = srcAtX + (dupIn - X) / stretchFactor;

        var srcMin = 0.0; // earliest valid source time (source starts at 0)

        // Detect whether source material is available for the full preroll
        var normalStart = srcAtDupIn;
        var needFreeze  = (stretchFactor > 0) && (srcAtDupIn < srcMin);

        if (needFreeze) {
            // Comp time at which source time srcMin naturally falls
            var ctSrcMin = orig.startTime + srcMin * stretchFactor;
            if (ctSrcMin < dupIn) {
                // Source already started before our window – clamp the value only
                tr.setValueAtTime(dupIn,  srcMin);
                tr.setValueAtTime(dupOut, srcAtX);
            } else {
                // Freeze at srcMin from dupIn until ctSrcMin, then play normally
                tr.setValueAtTime(dupIn,     srcMin);
                tr.setValueAtTime(ctSrcMin,  srcMin);
                tr.setValueAtTime(dupOut,    srcAtX);

                // First key: HOLD (freeze frame)
                tr.setInterpolationTypeAtKey(1, KeyframeInterpolationType.HOLD);
                // Second key transitions to LINEAR playback
                tr.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR);
            }
        } else {
            // Sufficient source material – simple linear remap
            tr.setValueAtTime(dupIn,  normalStart);
            tr.setValueAtTime(dupOut, srcAtX);
        }

        // ── Animated glitch mask ──────────────────────────────────────────────
        addGlitchMask(dup, dupIn, dupOut, fd, W, H, maskW, maskH);
    }

    app.endUndoGroup();

    // ── Animated glitch mask helper ───────────────────────────────────────────
    //
    // Adds a hard-edged rectangle mask that jumps to a new random position
    // (near composition centre) every one or two frames using HOLD keyframes.
    function addGlitchMask(layer, layerIn, layerOut, frameDur,
                            cW, cH, mW, mH) {

        var masks = layer.property("ADBE Mask Parade");
        var mask  = masks.addProperty("ADBE Mask Atom");

        mask.maskMode      = MaskMode.ADD;
        mask.maskFeather   = [0, 0];   // hard edges, no feather
        mask.maskOpacity   = 100;
        mask.maskExpansion = 0;
        mask.inverted      = false;

        var maskShape = mask.property("ADBE Mask Shape");

        var cx        = cW / 2;
        var cy        = cH / 2;
        var maxOffset = Math.min(cW, cH) * 0.20; // ±20 % of short side

        // Build list of keyframe times (every 1 or 2 frames, randomised)
        var times = [];
        var t     = layerIn;
        while (t <= layerOut + frameDur * 0.01) {
            times.push(t);
            t += (Math.random() < 0.5 ? 1 : 2) * frameDur;
        }
        // Guarantee a keyframe exactly at the layer's outPoint
        if (times[times.length - 1] < layerOut - frameDur * 0.01) {
            times.push(layerOut);
        }

        // Add a HOLD keyframe with a new random rectangle position at each time
        for (var j = 0; j < times.length; j++) {
            var rx = cx + (Math.random() - 0.5) * 2 * maxOffset;
            var ry = cy + (Math.random() - 0.5) * 2 * maxOffset;

            var shape        = new Shape();
            shape.closed     = true;
            // Vertices in comp-space pixels (top-left, top-right, bottom-right, bottom-left)
            shape.vertices   = [[rx - mW / 2, ry - mH / 2],
                                 [rx + mW / 2, ry - mH / 2],
                                 [rx + mW / 2, ry + mH / 2],
                                 [rx - mW / 2, ry + mH / 2]];
            // Zero tangents → straight lines, 90° corners, no rounding
            shape.inTangents  = [[0, 0], [0, 0], [0, 0], [0, 0]];
            shape.outTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];

            maskShape.setValueAtTime(times[j], shape);
        }

        // Switch every keyframe to HOLD – mask jumps, never interpolates
        for (var k = 1; k <= maskShape.numKeys; k++) {
            maskShape.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD);
        }
    }

}());
