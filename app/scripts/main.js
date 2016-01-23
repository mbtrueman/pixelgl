'use strict';

/* globals TWEEN, THREE, TweenMax */

var container;
var camera, scene, renderer, effect, mesh, lightMesh, geometry;
var spheres = [], positions = [], positions2 = [];
var directionalLight, pointLight;
var mouseX = 0, mouseY = 0;
var numParticles = 8000;
var current = 0;
var imageData, imageData2, imgWidth, imgHeight;
var images = [], colours = ['#460e10', '#2e1d35', '#15024b', '#000'];
var imageDatas = [];
var imageCount;
var IMAGE_SCALE = 1;
var doRender;
var currentPage = 0;
var animationActive = false;

function randInt(min, max) {
    return min + (Math.random() * (max - min));
}

function handleResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleMouseMove(event) {
    mouseX = event.clientX - window.innerWidth / 2;
    mouseY = event.clientY - window.innerHeight / 2;
}

function render() {
    camera.position.x += (mouseX - camera.position.x) * .05;
    camera.position.y += (-mouseY - camera.position.y) * .05;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
    geometry.verticesNeedUpdate = true;
}

function animate() {
    doRender = requestAnimationFrame(animate);
    TWEEN.update();
    render();
}

function scatter(complete) {
	var duration = 3000, completed = 0;
    for (var i = 0, j = 0; i < positions2.length; i++, j += 3) {
        var object = geometry.vertices[i];
        new TWEEN.Tween(object)
            .to({
                x: Math.random() * 2000 - 1000,
                y: Math.random() * 2000 - 1000,
                z: Math.random() * 2000 - 1000
            }, Math.random() * duration + duration)
            .interpolation(TWEEN.Interpolation.Bezier)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
            // .onComplete(function() {
            // 	++completed;
            // 	if (completed === numParticles) {///1.5) {
            // 		complete();
            // 	}
            // });
    }

    setTimeout(complete, 4000);
}

function transition(colour, willScatter) {
    // TweenMax.to($('body'), 8, {backgroundColor: colour, delay: 2});

    function assemble() {
        var duration = 3000;
        for (var i = 0, j = 0; i < positions.length; i++, j += 3) {
            var object = geometry.vertices[i];
            new TWEEN.Tween(object)
                .to({
                    x: positions[j],
                    y: positions[j + 1],
                    z: positions[j + 2]
                }, Math.random() * duration + duration)
                .interpolation(TWEEN.Interpolation.Bezier)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start();
        }
    }

    if (willScatter) scatter(assemble);
    else assemble();
}


function getPixelArray(imgData) {
    var data = imgData.data;
    var Z_SPREAD = 50;
    var amount = 20;
    var separation = 50;
    var offset = ((amount - 1) * separation) / 2;

    for (var y = 0; y < imgData.height; y = y + 3) {
        for (var x = 0; x < imgData.width; x = x + 3) {
            var index = (y * imgData.width + x) * 4;
            var r, g, b, a, offset = x * 4 + y * 4 * imgData.width;
            r = imgData.data[offset];
            if (r > 0) {
                var x1 = (x * 2) - imgData.width;
                var y1 = (y * 2) - imgData.height;
                var z1 = 0;
                positions.push(x1, y1, z1);
                // positions.push(x1, y1, z1 + 30); //add depth
            }
        }
    }
}

function getImgData(image) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);
    var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    return imgData;
}

function loadImages(array, callback) {
    var i, l, imgs = [];
    imgs.loadCount = 0;
    for (i = 0, l = array.length; i < l; ++i) {

        imgs[i] = new Image();
        imgs[i].loaded = 0;
        imgs[i].onload = function() {
            imgs.loadCount += 1;
            this.loaded = true;

            if (imgs.loadCount === l && callback) {
                callback();
            }

        };
        imgs[i].src = array[i];

    }

    return imgs;
}

function updateImage(num, sktr) {
    var idx = (num < images.length) ? num : 0;
    animationActive = true;
    positions2 = positions;
    positions = [];
    getPixelArray(getImgData(images[idx]));
    transition(colours[idx], sktr);

    setTimeout(updateImage, 15000, ++idx, true);
}

function setup() {
    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 5000);// first param was 65
    camera.position.set(600, 400, 1000);
    camera.lookAt(new THREE.Vector3());

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xFFFFFF, 0.01);

    geometry = new THREE.Geometry();

    var sprite = THREE.ImageUtils.loadTexture('images/snowflake.png');//preloaded this to cache it

    for (var i = 0; i < numParticles; i++) {
        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * 2000 - 1000;
        vertex.y = Math.random() * 2000 - 1000;
        vertex.z = Math.random() * 2000 - 1000;

        geometry.vertices.push(vertex);

    }

    var material = new THREE.PointsMaterial({
        size: 7,
        opacity: 1,
        sizeAttenuation: true,
        map: sprite,
        transparent: true
    });

    var particles = new THREE.Points(geometry, material);
    scene.add(particles);

    renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    var width = window.innerWidth || 2;
    var height = window.innerHeight || 2;

    renderer.setSize(width, height);

    document.addEventListener('mousemove', handleMouseMove, false);
    window.addEventListener('resize', handleResize, false);

    setTimeout(updateImage, 3000, 0, false);
}

function undulate() {
    var colour = colours[Math.round(randInt(0, colours.length - 1))];
    TweenMax.to(document.body, 12, {backgroundColor: colour, onComplete: undulate});
}

function imagesLoaded() {
    for (var i = 0; i < images.length; i++) {
        imageDatas.push(getImgData(images[i]));
    }

    setup();
    animate();
}

function init() {
    loadImages(['images/snowflake.png'], function() {
        images = loadImages(['images/fpg.png', 'images/zype.png'], imagesLoaded);
        undulate();
    });
}

init();
