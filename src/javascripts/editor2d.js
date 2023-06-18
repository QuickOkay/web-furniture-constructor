import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";

let WIDTH = 500;
let HEIGHT = 500;

let templateObjects = [];
let textObjects = [];

let params = window.BasicParams;

// THREE.JS Init
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WIDTH, HEIGHT);
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setClearColor(0xf7f7f7, 1);
document.getElementById("template-2d-canvas-placement").appendChild(renderer.domElement);

// Init Scene
const scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera();
//const camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT);
camera.position.set(0, 0, 0);
scene.add(camera);

let basicMaterial = new THREE.MeshBasicMaterial( { "color": 0x000000 } );
let basicBGMaterial = new THREE.MeshBasicMaterial( { "color": 0xffffff } );
let lineMaterial = new THREE.LineBasicMaterial( { "color": 0x808080 } );
let basicOutlineMaterial = new THREE.LineBasicMaterial( { "color": 0x808080 } );
let metricLineMaterial = new THREE.LineBasicMaterial( { "color": 0xff2626 } );
let outlineMaterial = new THREE.LineBasicMaterial( { "color": 0x000000, linewidth: 4 } );
let legsMaterial = new THREE.MeshBasicMaterial( { "color": 0x000000 } );

// Font Init
const matLite = new THREE.MeshBasicMaterial( {
    color: 0xff2626,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
} );
const loader = new FontLoader();
let fontFace;
loader.load('fonts/helvetiker_regular.typeface.json', function (font) {
    fontFace = font;
    RenderTemplate2D();
});

function RenderFrontView() {
    camera.position.set(0, 0, 3);

    let vCount = params["param-vsection"].currentValue;
    let hCount = params["param-hsection"].currentValue;
    let x = params["param-width"].currentValue / 1000;
    let y = params["param-height"].currentValue / 1000;
    let z = params["param-depth"].currentValue / 1000;
    let thickness = params["thickness"].value / 1000;

    let xCopy = x;
    let yCopy = y;
    let thicknessCopy = thickness;

    let plinthType = params["param-plinth"].type;
    let plinthLength = params["param-plinth"].currentValue / 1000;
    let lengthOffset = 0;

    if (plinthType !== "none") {
        lengthOffset = plinthLength;
    }

    let lengthOffsetCopy = lengthOffset;

    let offset = 0.04;

    let scale = 1.5;
    if (y >= x) {
        scale /= y;
    } else {
        scale /= x;
    }

    x *= scale;
    y *= scale;
    z *= scale;
    thickness *= scale;
    lengthOffset *= scale;
    offset *= scale;

    let leftBorder = AddCubeEdges(thickness, y - 2*thickness - lengthOffset, z, outlineMaterial);
    leftBorder.position.set(-(x / 2) + (thickness / 2), lengthOffset / 2, 0);

    let rightBorder = AddCubeEdges(thickness, y - 2*thickness - lengthOffset, z, outlineMaterial);
    rightBorder.position.set((x / 2) - (thickness / 2), lengthOffset / 2, 0);

    let topBorder = AddCubeEdges(x, thickness, z, outlineMaterial);
    topBorder.position.set(0, (y / 2) - (thickness / 2), 0);

    let bottomBorder = AddCubeEdges(x, thickness, z, outlineMaterial);
    bottomBorder.position.set(0, -(y / 2) + (thickness / 2) + lengthOffset, 0);

    // Width
    let lineOffset;

    lineOffset = (offset * 3)/scale;

    AddText(Math.trunc((x/scale)*1000) + "", 0, y/2 + lineOffset*1.15, 0,
        Deg2Rad(0), Deg2Rad(0), Deg2Rad(0), 0.045);
    MetricsLine(Point(-x/2, y/2, 0), Point(-x/2, y/2 + lineOffset, 0),
        Point(x/2, y/2 + lineOffset, 0), Point(x/2, y/2, 0), metricLineMaterial);

    // Height
    AddText(Math.trunc((y/scale)*1000) + "", x/2 + lineOffset*1.15, 0, 0,
        Deg2Rad(0), Deg2Rad(0), Deg2Rad(-90), 0.045);
    MetricsLine(Point(x/2, y/2, 0), Point(x/2+lineOffset, y/2, 0),
        Point(x/2+lineOffset, -y/2, 0), Point(x/2, -y/2, 0), metricLineMaterial);

    if (plinthType !== "none") {
        AddText(Math.trunc(plinthLength*1000) + "", x/2 + lineOffset*1.15, -y/2 + lengthOffset/2, 0,
            Deg2Rad(0), Deg2Rad(0), Deg2Rad(-90), 0.045);
        MetricsLine(Point(x/2, -y/2 + lengthOffset, 0), Point(x/2 + lineOffset, -y/2 + lengthOffset, 0),
            Point(x/2 + lineOffset, -y/2, 0), Point(x/2, -y/2, 0), metricLineMaterial);
    }

    if (plinthType === "normal") {
        let leftPlinthBorder = AddCubeEdges(thickness, lengthOffset, z - 0.03, outlineMaterial);
        leftPlinthBorder.position.set(-x/2 + thickness/2, -y/2 + lengthOffset/2, 0.015);

        let rightPlinthBorder = AddCubeEdges(thickness, lengthOffset, z - 0.03, outlineMaterial);
        rightPlinthBorder.position.set(x/2 - thickness/2, -y/2 + lengthOffset/2, 0.015);

        let forwardPlinthBorder = AddCubeEdges(x - 2*thickness, lengthOffset, thickness, outlineMaterial);
        forwardPlinthBorder.position.set(0, -y/2 + lengthOffset/2, z/2 - 0.03);

        let backPlinthBorder = AddCubeEdges(x - 2*thickness, lengthOffset, thickness, outlineMaterial);
        backPlinthBorder.position.set(0, -y/2 + lengthOffset/2, -z/2 + 0.05);
    }

    if (plinthType === "legs") {
        let legsRadius = 0.02*scale;
        let depthLength = (z - 4*legsRadius - 0.02) * scale;
        let pairsCount = 0;

        if (x >= 1.2) {
            pairsCount += Math.trunc(x / (0.6 * scale)) - 1;
        }

        // Create side legs
        let leftFLeg = AddCylinder(legsRadius, lengthOffset, 12, legsMaterial);
        leftFLeg.position.set(-x/2 + 0.02 + legsRadius, -y/2 + lengthOffset/2, z/2 - (0.02 + legsRadius));

        let rightFLeg = AddCylinder(legsRadius, lengthOffset, 12, legsMaterial);
        rightFLeg.position.set(x/2 - (0.02 + legsRadius), -y/2 + lengthOffset/2, z/2 - (0.02 + legsRadius));

        // Create inner legs
        let xLen = (x - (0.02+legsRadius*2)*2) / (pairsCount+1);
        for (let i = 0; i < pairsCount; i++) {
            let legForward = AddCylinder(legsRadius, lengthOffset, 12, legsMaterial);

            let xPos = -x/2 + 0.02 + legsRadius*2 + xLen * (i + 1);

            legForward.position.set(xPos, -y/2 + lengthOffset/2, z/2 - (0.02 + legsRadius));
        }
    }

    ////////////////
    /// Sections ///
    ////////////////

    // Vertical
    let innerWidth = x - thickness * 2;

    let len = ((innerWidth - thickness * (hCount-1)) / hCount) + thickness / 2;

    for (let i = 1; i < hCount; i++) {
        let shelf = AddCubeEdges(thickness, y-2*thickness - lengthOffset, z, outlineMaterial);
        shelf.position.set(((len + thickness/2) * i) - x/2 + thickness/2, lengthOffset / 2, 0);
    }

    let innerWidthForText = xCopy - thicknessCopy * 2;
    let widthOffset = (innerWidthForText - thicknessCopy * (hCount-1)) / hCount;

    len = (innerWidth - thickness * (hCount-1)) / hCount;

    for (let i = 1; i <= hCount; i++) {
        AddText(Math.trunc(widthOffset*1000) + "", (-x/2 + thickness + (len + thickness) * (i-1)) + (-x/2 + ((len + thickness)*i)-(-x/2 + thickness + (len + thickness) * (i-1)))/2, y/2 + lineOffset/2, 0,
            Deg2Rad(0), Deg2Rad(0), Deg2Rad(0), 0.045);
        MetricsLine(Point(-x/2 + thickness + (len + thickness) * (i-1), y/2, z/2), Point(-x/2 + thickness + (len + thickness) * (i-1), y/2 + lineOffset/3, z/2),
            Point(-x/2 + (len + thickness)*i, y/2 + lineOffset/3, z/2), Point(-x/2 + (len + thickness)*i, y/2, z/2), metricLineMaterial);
    }

    // Horizontal
    let innerHeight = y - thickness * 2 - lengthOffset;

    let heightOffset = ((innerHeight - thickness * (vCount-1)) / vCount);
    len = (innerWidth - thickness * (hCount-1)) / hCount;

    for (let i = 1; i < vCount; i++) {
        for (let j = 1; j <= hCount; j++) {
            let shelf = AddCubeEdges(len, thickness, z, outlineMaterial);
            shelf.position.set(-x/2 + thickness + len/2 + len*(j-1) + thickness*(j-1), y/2 - thickness/2 - (heightOffset + thickness) * i, 0);
        }
    }

    let innerHeightForText = yCopy - thicknessCopy * 2 - lengthOffsetCopy;
    let textHeight = ((innerHeightForText - thicknessCopy * (vCount-1)) / vCount);

    for (let i = 1; i <= vCount; i++) {
        AddText(Math.trunc(textHeight*1000) + "", x/2 + lineOffset/2, (y/2 - thickness - (heightOffset + thickness) * (i-1)) + ((y/2 - (heightOffset + thickness)*i) - (y/2 - thickness - (heightOffset + thickness) * (i-1)))/2, 0,
            Deg2Rad(0), Deg2Rad(0), Deg2Rad(-90), 0.045);
        MetricsLine(Point(x/2, y/2 - thickness - (heightOffset + thickness) * (i-1), z/2), Point(x/2 + lineOffset/3, y/2 - thickness - (heightOffset + thickness) * (i-1), z/2),
            Point(x/2 + lineOffset/3, y/2 - (heightOffset + thickness)*i, z/2), Point(x/2, y/2 - (heightOffset + thickness)*i, z/2), metricLineMaterial);
    }

    renderer.render( scene, camera );
}

function RenderSideView() {
    camera.position.set(0, 0, 2);

    let y = params["param-height"].currentValue / 1000;
    let z = params["param-depth"].currentValue / 1000;
    let vCount = params["param-vsection"].currentValue;
    let hCount = params["param-hsection"].currentValue;
    let thickness = params["thickness"].value / 1000;
    let offset = 0.05;

    let yCopy = y;
    let thicknessCopy = thickness;

    let plinthType = params["param-plinth"].type;
    let plinthLength = params["param-plinth"].currentValue / 1000;
    let lengthOffset = 0;

    if (plinthType !== "none") {
        lengthOffset = plinthLength;
    }

    let lengthOffsetCopy = lengthOffset;

    let scale = 1.5;
    if (z >= y) {
        scale /= z;
    } else {
        scale /= y;
    }

    y *= scale;
    z *= scale;
    offset *= scale;
    thickness *= scale;
    lengthOffset *= scale;

    let frame = AddCubeEdges(z, y-lengthOffset-2*thickness, 0.1, outlineMaterial);
    frame.position.set(0, lengthOffset/2, 0);

    let topFrame = AddCubeEdges(z, thickness, 0.1, outlineMaterial);
    topFrame.position.set(0, y/2-thickness/2, 0);

    let bottomFrame = AddCubeEdges(z, thickness, 0.1, outlineMaterial);
    bottomFrame.position.set(0, -y/2+lengthOffset+thickness/2, 0);

    let lineOffset;

    lineOffset = (offset * 3)/scale;

    // Depth
    AddText(Math.trunc((z/scale)*1000) + "", 0, y/2+lineOffset*1.15, 0,
        Deg2Rad(0), Deg2Rad(0), Deg2Rad(0), 0.045);
    MetricsLine(Point(-z/2, y/2, 0), Point(-z/2, y/2 + lineOffset, 0),
        Point(z/2, y/2 + lineOffset, 0), Point(z/2, y/2, 0), metricLineMaterial);

    // Height
    AddText(Math.trunc((y/scale)*1000) + "", z/2 + lineOffset*1.15, lengthOffset/2, 0,
        Deg2Rad(0), Deg2Rad(0), Deg2Rad(-90), 0.045);
    MetricsLine(Point(z/2, y/2, 0), Point(z/2 + lineOffset, y/2, 0),
        Point(z/2 + lineOffset, -y/2+lengthOffset, 0), Point(z/2, -y/2+lengthOffset, 0), metricLineMaterial);

    if (plinthType !== "none") {
        AddText(Math.trunc(plinthLength*1000) + "", z/2 + lineOffset*1.15, -y/2+lengthOffset/2, 0,
            Deg2Rad(0), Deg2Rad(0), Deg2Rad(-90), 0.045);
        MetricsLine(Point(z/2, -y/2+lengthOffset, 0), Point(z/2 + lineOffset, -y/2+lengthOffset, 0),
            Point(z/2 + lineOffset, -y/2, 0), Point(z/2, -y/2, 0), metricLineMaterial);
    }

    if (plinthType === "normal") {
        let rightPlinthBorder = AddCubeEdges(z-0.03*scale, lengthOffset,0.1, outlineMaterial);
        rightPlinthBorder.position.set(-0.015*scale, -y/2 + lengthOffset/2, 0);

        let forwardPlinthBorder = AddCubeEdges(thickness, lengthOffset, 0.1, basicOutlineMaterial);
        forwardPlinthBorder.position.set(z/2 - 0.05*scale, -y/2 + lengthOffset/2, 0);

        let backPlinthBorder = AddCubeEdges(thickness, lengthOffset, 0.1, basicOutlineMaterial);
        backPlinthBorder.position.set(-z/2 + 0.03*scale, -y/2 + lengthOffset/2, 0);
    }

    if (plinthType === "legs") {
        let legsRadius = 0.02*scale;
        let depthLength = (z - 4*legsRadius - 0.02) * scale;

        // Create side legs
        let leftFLeg = AddCylinder(legsRadius, lengthOffset, 12, legsMaterial);
        leftFLeg.position.set(z/2 - (0.02 + legsRadius), -y/2 + lengthOffset/2, 0);

        let rightFLeg = AddCylinder(legsRadius, lengthOffset, 12, legsMaterial);
        rightFLeg.position.set(-z/2 + (0.02 + legsRadius), -y/2 + lengthOffset/2, 0);
    }

    ////////////////
    /// Sections ///
    ////////////////

    let innerHeight = y - thickness * 2 - lengthOffset;
    let heightOffset = ((innerHeight - thickness * (vCount-1)) / vCount);

    for (let i = 1; i < vCount; i++) {
        let shelf = AddCubeEdges(z, thickness, 0.1, basicOutlineMaterial);
        shelf.position.set(0, y/2 - thickness/2 - (heightOffset + thickness) * i, 0);
    }

    let innerHeightForText = yCopy - thicknessCopy * 2 - lengthOffsetCopy;
    let textHeight = ((innerHeightForText - thicknessCopy * (vCount-1)) / vCount);

    for (let i = 1; i <= vCount; i++) {
        AddText(Math.trunc(textHeight*1000) + "", z/2 + lineOffset/2, (y/2 - thickness - (heightOffset + thickness) * (i-1)) + ((y/2 - (heightOffset + thickness)*i) - (y/2 - thickness - (heightOffset + thickness) * (i-1)))/2, 0,
            Deg2Rad(0), Deg2Rad(0), Deg2Rad(-90), 0.045);
        MetricsLine(Point(z/2, y/2 - thickness - (heightOffset + thickness) * (i-1), 0), Point(z/2 + lineOffset/3, y/2 - thickness - (heightOffset + thickness) * (i-1), 0),
            Point(z/2 + lineOffset/3, y/2 - (heightOffset + thickness)*i, 0), Point(z/2, y/2 - (heightOffset + thickness)*i, 0), metricLineMaterial);
    }

    renderer.render( scene, camera );
}

function RenderTopView() {
    camera.position.set(0, 0, 2);

    let hCount = params["param-hsection"].currentValue;
    let x = params["param-width"].currentValue / 1000;
    let z = params["param-depth"].currentValue / 1000;
    let thickness = params["thickness"].value / 1000;
    let lineWidth = 0.007;
    let offset = 0.05;

    let xCopy = x;
    let thicknessCopy = thickness;

    let scale = 1.5;
    if (z >= x) {
        scale /= z;
    } else {
        scale /= x;
    }

    x *= scale;
    z *= scale;
    lineWidth *= scale;
    offset *= scale;

    let lineOffset;

    lineOffset = (offset * 3)/scale;

    AddCubeEdges(x, z, 0.1, outlineMaterial);
    let leftBorder = AddCubeEdges(thickness, z, 0.1, basicOutlineMaterial);
    leftBorder.position.set(-x/2 + thickness/2, 0, 0);

    let rightBorder = AddCubeEdges(thickness, z, 0.1, basicOutlineMaterial);
    rightBorder.position.set(x/2 - thickness/2, 0, 0);

    // Horizontal Metric
    AddText(Math.trunc((x/scale)*1000) + "", 0, z/2 + lineOffset*1.15, 0,
        Deg2Rad(0), Deg2Rad(0), Deg2Rad(0), 0.045);
    MetricsLine(Point(-x/2, z/2, 0), Point(-x/2, z/2 + lineOffset, 0),
        Point(x/2, z/2 + lineOffset, 0), Point(x/2, z/2, 0), metricLineMaterial);

    // Vertical Metric
    AddText(Math.trunc((z/scale)*1000) + "", x/2 + lineOffset*1.15, 0, 0,
        Deg2Rad(0), Deg2Rad(0), Deg2Rad(-90), 0.045);
    MetricsLine(Point(x/2, z/2, 0), Point(x/2 + lineOffset, z/2, 0),
        Point(x/2 + lineOffset, -z/2, 0), Point(x/2, -z/2, 0), metricLineMaterial);

    ////////////////
    /// Sections ///
    ////////////////

    let innerWidth = x - thickness * 2;
    let widthOffset = ((innerWidth - thickness * (hCount-1)) / hCount);

    for (let i = 1; i < hCount; i++) {
        let shelf = AddCubeEdges(thickness, z, 0.1, basicOutlineMaterial);
        shelf.position.set(x/2 - thickness/2 - (widthOffset + thickness) * i, 0, 0);
    }

    let innerWidthForText = xCopy - thicknessCopy * 2;
    let widthLen = (innerWidthForText - thicknessCopy * (hCount-1)) / hCount;

    let len = (innerWidth - thickness * (hCount-1)) / hCount;

    for (let i = 1; i <= hCount; i++) {
        AddText(Math.trunc(widthOffset*1000) + "", (-x/2 + thickness + (len + thickness) * (i-1)) + (-x/2 + ((len + thickness)*i)-(-x/2 + thickness + (len + thickness) * (i-1)))/2, z/2 + lineOffset/2, 0,
            Deg2Rad(0), Deg2Rad(0), Deg2Rad(0), 0.045);
        MetricsLine(Point(-x/2 + thickness + (len + thickness) * (i-1), z/2, 0), Point(-x/2 + thickness + (len + thickness) * (i-1), z/2 + lineOffset/3, 0),
            Point(-x/2 + (len + thickness)*i, z/2 + lineOffset/3, 0), Point(-x/2 + (len + thickness)*i, z/2, 0), metricLineMaterial);
    }

    renderer.render( scene, camera );
}

window.addEventListener("RenderTemplate2D", RenderTemplate2D);

function RenderTemplate2D() {
    ClearScene();
    switch (params["param-template-2d"].view) {
        case "front":
            RenderFrontView();
            break;
        case "side":
            RenderSideView();
            break;
        case "top":
            RenderTopView();
            break;
    }
}

// Remove all template objects for recreate with other params
function ClearScene() {
    templateObjects.forEach(obj => {
        scene.remove(obj);
    });

    templateObjects = [];
    textObjects = [];
}

// Addition functions
function Point(x, y, z) {
    return new THREE.Vector3(x, y, z)
}

function MetricsLine(a, b, c, d, material=lineMaterial) {
    let points = [];
    points.push(a);
    points.push(b);
    points.push(c);
    points.push(d);

    let geometry = new THREE.BufferGeometry().setFromPoints(points);

    let line = new THREE.Line(geometry, material);
    templateObjects.push(line);
    scene.add(line);
}

function AddText(str="", x=0, y=0, z=0,
                 yaw=0, pitch=0, roll=0, fontSize=0.1, direction="horizontal") {
    if (fontFace == null) { return; }

    const shapes = fontFace.generateShapes(str, fontSize);
    const geometry = new THREE.ShapeGeometry(shapes);
    geometry.computeBoundingBox();
    const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    geometry.translate(xMid, 0, 0);

    const text = new THREE.Mesh( geometry, matLite );
    text.position.set(x, y, z);
    text.rotation.set(yaw, pitch, roll);

    let textObj = {
        mesh: text,
        direction: direction,
    }

    templateObjects.push(text);
    textObjects.push(textObj);
    scene.add(text);

    return text;
}

function Deg2Rad(deg=0) {
    return deg*(Math.PI/180);
}

function AddCube(width, height, depth, material) {
    let geometry = new THREE.BoxGeometry(width, height, depth);
    let mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);
    templateObjects.push(mesh);

    return mesh;
}

function AddCubeEdges(width, height, depth, material) {
    let geometry = new THREE.BoxGeometry(width, height, depth);
    let geo = new THREE.EdgesGeometry(geometry);
    let edges = new THREE.LineSegments(geo, material);

    scene.add(edges);
    templateObjects.push(edges);

    return edges;
}

function AddCylinder(radius, height, segments, material) {
    let geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
    let mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);
    templateObjects.push(mesh);

    return mesh;
}