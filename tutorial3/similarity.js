"use strict";

var gl;
var canvas;
var points;
var colours;
var tx, ty, tz, rx, ry, rz, sx, sy, sz;

window.onload = function init() {
    // Get A WebGL context
    canvas = document.getElementById("canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    // These are to make the 3D drawing look OK. Comment them out to see the effect
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // setup GLSL program
    var program = initShaders(gl, "3d-vertex-shader", "3d-fragment-shader");
    gl.useProgram(program);

    // Attributes
    var vertexLoc = gl.getAttribLocation(program, "position");
    var colourLoc = gl.getAttribLocation(program, "colour");
    var similarityLoc = gl.getUniformLocation(program, "matrix");

    makeShape();

    // Buffer to hold the vertex data
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(vertexLoc);
    gl.vertexAttribPointer(vertexLoc, 3, gl.FLOAT, false, 0, 0);

    // Buffer to hold the colours
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(colourLoc);

    // Colours given as bytes
    gl.vertexAttribPointer(colourLoc, 3, gl.UNSIGNED_BYTE, true, 0, 0);

    setColours(gl);

    var translation = [45, 150, 0];
    var rotation = [radians(40), radians(25), radians(325)];
    var scale = [1, 1, 1];
    tx = 45, ty = 150, tz = 0;
    rx = 40, ry = 25, rz = 325;
    sx = 1, sy = 1, sz = 1;

    render()

    document.getElementById("txSlider").onchange = function (event) {
        tx = parseFloat(event.target.value);
        render();
    };
    document.getElementById("tySlider").onchange = function (event) {
        ty = parseFloat(event.target.value);
        render();
    };
    document.getElementById("tzSlider").onchange = function (event) {
        tz = parseFloat(event.target.value);
        render();
    };
    document.getElementById("rxSlider").onchange = function (event) {
        rx = parseFloat(event.target.value);
        render();
    };
    document.getElementById("rySlider").onchange = function (event) {
        ry = parseFloat(event.target.value);
        render();
    };
    document.getElementById("rzSlider").onchange = function (event) {
        rz = parseFloat(event.target.value);
        render();
    };
    document.getElementById("sxSlider").onchange = function (event) {
        sx = parseFloat(event.target.value);
        render();
    };
    document.getElementById("sySlider").onchange = function (event) {
        sy = parseFloat(event.target.value);
        render();
    };
    document.getElementById("szSlider").onchange = function (event) {
        sz = parseFloat(event.target.value);
        render();
    };

    // Draw the scene.
    function render() {
        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Compute the matrices
        var projectionMatrix = make2DProjection(canvas.clientWidth, canvas.clientHeight, 400);
        var translationMatrix = makeTranslation(tx, ty, tz);
        var rotationXMatrix = makeXRotation(radians(rx));
        var rotationYMatrix = makeYRotation(radians(ry));
        var rotationZMatrix = makeZRotation(radians(rz));
        var scaleMatrix = makeScale(sx, sy, sz);

        // Multiply the matrices.
        var matrix = matrixMultiply(scaleMatrix, rotationZMatrix);
        matrix = matrixMultiply(matrix, rotationYMatrix);
        matrix = matrixMultiply(matrix, rotationXMatrix);
        matrix = matrixMultiply(matrix, translationMatrix);
        matrix = matrixMultiply(matrix, projectionMatrix);

        // Set the matrix.
        gl.uniformMatrix4fv(similarityLoc, false, matrix);

        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, 10 * 6);

        requestAnimFrame(render);
        animate();
    }
};


var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        rx += 0.05 * elapsed;
    }
    lastTime = timeNow;
}


function make2DProjection(width, height, depth) {
    return [
        2 / width, 0, 0, 0,
        0, -2 / height, 0, 0,
        0, 0, 2 / depth, 0,
        -1, 1, 0, 1,
    ];
}

function identity() {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1];
}
//
// function makeTranslation(tx, ty, tz) {
//     let id_mat = identity();
//     id_mat[3] = tx;
//     id_mat[7] = ty;
//     id_mat[11] = tz;
//     return id_mat;
// }
//
//
// function makeXRotation(theta) {
//     let id_mat = identity();
//     id_mat[5] = Math.cos(theta);
//     id_mat[6] = -Math.sin(theta);
//     id_mat[9] = Math.sin(theta);
//     id_mat[10] = Math.cos(theta);
//     return id_mat;
// }
//
// function makeYRotation(phi) {
//     let id_mat = identity();
//     id_mat[0] = Math.cos(phi);
//     id_mat[2] = Math.sin(phi);
//     id_mat[8] = -Math.sin(phi);
//     id_mat[9] = Math.cos(phi);
//     return identity();
//
// }
//
// function makeZRotation(psi) {
//     let id_mat = identity();
//     id_mat[0] =Math.cos(psi);
//     id_mat[1] = Math.sin(psi);
//     id_mat[4] = Math.sin(psi);
//     id_mat[5] = Math.cos(psi);
//     return id_mat;
// }
//
// function makeScale(sx, sy, sz) {
//     let id_mat = identity();
//     id_mat[0] = sx;
//     id_mat[5] = sy;
//     id_mat[10] = sz;
//     return id_mat;
// }

function makeTranslation(tx, ty, tz) {
    return [
        1,  0,  0,  0,
        0,  1,  0,  0,
        0,  0,  1,  0,
        tx, ty, tz,  1
    ];
}

function makeXRotation(theta) {
    var c = Math.cos(theta);
    var s = Math.sin(theta);

    return [
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1
    ];
};

function makeYRotation(phi) {
    var c = Math.cos(phi);
    var s = Math.sin(phi);

    return [
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1
    ];
};

function makeZRotation(psi) {
    var c = Math.cos(psi);
    var s = Math.sin(psi);
    return [
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
}

function makeScale(sx, sy, sz) {
    return [
        sx, 0,  0,  0,
        0, sy,  0,  0,
        0,  0, sz,  0,
        0,  0,  0,  1,
    ];
}

function matrixMultiply(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
        a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
        a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
        a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
        a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
        a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
        a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
        a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
        a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
        a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
        a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
        a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
        a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
        a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
        a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
        a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33];
}

function makeShape() {
    points = [
        // upright front
        0, 0, 0,
        0, 150, 0,
        30, 0, 0,
        0, 150, 0,
        30, 150, 0,
        30, 0, 0,

        // bar front
        30, 0, 0,
        30, 30, 0,
        100, 0, 0,
        30, 30, 0,
        100, 30, 0,
        100, 0, 0,

        // upright back
        0, 0, 30,
        30, 0, 30,
        0, 150, 30,
        0, 150, 30,
        30, 0, 30,
        30, 150, 30,

        // bar back
        30, 0, 30,
        100, 0, 30,
        30, 30, 30,
        30, 30, 30,
        100, 0, 30,
        100, 30, 30,

        // top
        0, 0, 0,
        100, 0, 0,
        100, 0, 30,
        0, 0, 0,
        100, 0, 30,
        0, 0, 30,

        // bar right
        100, 0, 0,
        100, 30, 0,
        100, 30, 30,
        100, 0, 0,
        100, 30, 30,
        100, 0, 30,

        // bar bottom
        30, 30, 0,
        30, 30, 30,
        100, 30, 30,
        30, 30, 0,
        100, 30, 30,
        100, 30, 0,

        // bar right
        30, 30, 0,
        30, 150, 30,
        30, 30, 30,
        30, 30, 0,
        30, 150, 0,
        30, 150, 30,

        // upright bottom
        0, 150, 0,
        0, 150, 30,
        30, 150, 30,
        0, 150, 0,
        30, 150, 30,
        30, 150, 0,

        // upright side
        0, 0, 0,
        0, 0, 30,
        0, 150, 30,
        0, 0, 0,
        0, 150, 30,
        0, 150, 0];

}

function setColours(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Uint8Array([
            255, 0, 0,
            255, 0, 0,
            255, 0, 0,
            255, 0, 0,
            255, 0, 0,
            255, 0, 0,
            255, 0, 0,
            255, 0, 0,
            255, 0, 0,
            255, 0, 0,
            255, 0, 0,
            255, 0, 0,

            0, 255, 0,
            0, 255, 0,
            0, 255, 0,
            0, 255, 0,
            0, 255, 0,
            0, 255, 0,
            0, 255, 0,
            0, 255, 0,
            0, 255, 0,
            0, 255, 0,
            0, 255, 0,
            0, 255, 0,

            0, 0, 255,
            0, 0, 255,
            0, 0, 255,
            0, 0, 255,
            0, 0, 255,
            0, 0, 255,

            255, 255, 0,
            255, 255, 0,
            255, 255, 0,
            255, 255, 0,
            255, 255, 0,
            255, 255, 0,

            255, 0, 255,
            255, 0, 255,
            255, 0, 255,
            255, 0, 255,
            255, 0, 255,
            255, 0, 255,

            0, 255, 255,
            0, 255, 255,
            0, 255, 255,
            0, 255, 255,
            0, 255, 255,
            0, 255, 255,

            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,

            255, 255, 125,
            255, 255, 125,
            255, 255, 125,
            255, 255, 125,
            255, 255, 125,
            255, 255, 125,
        ]),
        gl.STATIC_DRAW);
}

