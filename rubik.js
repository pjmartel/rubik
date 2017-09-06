// Create heading at top of page
// var info = document.createElement('div') ;
// info.style.position = 'absolute';
// info.style.top = '10px';
// info.style.width = '100%';
// info.style.textAlign = 'center';
// info.style.color = "white" ;
// info.innerHTML = "<h2>Rubik's Cube Simulator</h2>";


//"use strict" ;
//global variables
var renderer ;
var scene ;
var camera ;
var stats ;
var speed = 0.01 ;
//var spotLight ;
var timer = 0 ;
var group = new THREE.Group() ;
var rubiksCube = [] ;
var faces = {} ;
var cube ;
var pivot = new THREE.Object3D() ;
var isMoving = false ;
var isSolving = false ;
var activeAxis ;
var deltaRot = 0.05 ;
var activeCubies = [] ;
var moveStack = [] ;
var moveList = [] ;
var keyDown = false ;
var theAxes = new THREE.Object3D() ;

function init() {
    //three.js initialization code
    scene = new THREE.Scene() ;

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight,0.1,1000);

    renderer = new THREE.WebGLRenderer({ antialias : true}) ;
    renderer.setClearColor(0x000000,1.0) ;
    renderer.setSize(window.innerWidth,window.innerHeight) ;
    renderer.shadowMap.enabled = true ;

    // Scene elements
    scene.add(pivot) ;
    // plane
    var planeGeometry = new THREE.PlaneGeometry(20,20) ;
    var planeMaterial = new THREE.MeshLambertMaterial({color: 0xcccccc}) ;
    var plane = new THREE.Mesh(planeGeometry,planeMaterial) ;
    plane.receiveShadow = true ;
    plane.rotation.x = -0.5 * Math.PI ;
    plane.position.x = 0 ;
    plane.position.y = -2 ;
    plane.position.z = 0 ;
    // scene.add(plane) ;


    faces = {
      "L" : [] ,
      "R" : [] ,
      "D" : [] ,
      "U" : [] ,
      "B" : [] ,
      "F" : [] ,
    }
    // var cc = addCubie({side:2.7,posX:0,posY:0,posZ:0}) ;
    var xAxis = new THREE.Vector3(1,0,0) ;
    var yAxis = new THREE.Vector3(0,1,0) ;
    var zAxis = new THREE.Vector3(0,0,1) ;
    qt = new THREE.Quaternion();
    // qc = new THREE.Quaternion();
    qt.setFromAxisAngle(xAxis,0.25 * Math.PI) ;

    //scene.add(group) ;
    // group.setRotationFromQuaternion(qt) ;
    makeCube() ;

    // Camera
    camera.position.x = 15 ;
    camera.position.y = 16 ;
    camera.position.z = 13 ;
    camera.lookAt(scene.position) ;

    // Axes
    // Should be a function.


    var cylinderGeometry = new THREE.CylinderGeometry(0.1,0.1,10,20) ;
    var redLambertMaterial = new THREE.MeshLambertMaterial({color : 0xff0000}) ;
    var greenLambertMaterial = new THREE.MeshLambertMaterial({color : 0x00ff00}) ;
    var blueLambertMaterial = new THREE.MeshLambertMaterial({color : 0x0000ff}) ;
    var coneGeometry = new THREE.CylinderGeometry(0.3,0,0.8,10) ;
    var xAxis = new THREE.Mesh(cylinderGeometry,redLambertMaterial) ;
    var xCone = new THREE.Mesh(coneGeometry,redLambertMaterial) ;
    xAxis.rotation.z = 0.5*Math.PI ;
    xAxis.position.x = 5 ;
    theAxes.add(xAxis) ;
    xCone.rotation.z = 0.5*Math.PI ;
    xCone.position.x = 10 ;
    theAxes.add(xCone) ;
    var yAxis = new THREE.Mesh(cylinderGeometry,greenLambertMaterial) ;
    var yCone = new THREE.Mesh(coneGeometry,greenLambertMaterial) ;
    yAxis.position.y = 5 ;
    theAxes.add(yAxis) ;
    yCone.rotation.x = Math.PI ;
    yCone.position.y = 10 ;
    theAxes.add(yCone) ;
    var zAxis = new THREE.Mesh(cylinderGeometry,blueLambertMaterial) ;
    var zCone = new THREE.Mesh(coneGeometry,blueLambertMaterial) ;
    zAxis.rotation.x = -0.5*Math.PI ;
    zAxis.position.z = 5 ;
    theAxes.add(zAxis) ;
    zCone.rotation.x = -0.5*Math.PI ;
    zCone.position.z = 10 ;
    theAxes.add(zCone) ;
    scene.add(theAxes) ;


    // Light
    var spotLight = new THREE.SpotLight(0xffffff) ;
    spotLight.position.set(10, 20, 20) ;
    spotLight.shadow.camera.near = 20;
    spotLight.shadow.camera.far = 50;
    spotLight.castShadow = true ;
    scene.add(spotLight) ;
    var spotLight2 = new THREE.SpotLight(0xffffff) ;
    spotLight2.position.set(-10, -20, -20) ;
    spotLight2.shadow.camera.near = 20;
    spotLight2.shadow.camera.far = 50;
    spotLight2.castShadow = true ;
    scene.add(spotLight2) ;

    // Camera Orbital Controls (mouse)
    // needs the OrbitalControl.js file
    var orbitControl = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControl.enablePan = false ;
    orbitControl.maxPolarAngle = Math.PI ;
    orbitControl.minPolarAngle = 0 ;
    document.body.appendChild(renderer.domElement) ;
    //document.body.appendChild(info) ;
    addStatsObject() ;
    // addVertices(cube);

    setupControlButtons() ;

    render() ;  // or requestAnimationFrame(render) ?
}

// Shuffling is done by playing a list of random moves. Shuffle count
// should be a parameter (DAT.gui ?)
function shuffleCube() {
  resetCube() ;
  if(isMoving) return ;
  var myMoves = ["L","R","l","r","U","D","u","d","B","F","b","f"] ;
  var shuffleCount = 10 ;
  for(var i=0 ; i < shuffleCount ; i++) {
    rotateFace(myMoves[Math.floor(Math.random()*myMoves.length)], faces, pivot) ;
    updateCubies(rubiksCube) ;
  }
}

function resetCube() {
  if(isMoving) return ; // don't destroy the cube while it's moving!...

  destroyCube() ;
  faces["L"] = [] ;
  faces["R"] = [] ;
  faces["D"] = [] ;
  faces["U"] = [] ;
  faces["B"] = [] ;
  faces["F"] = [] ;
  //scene.remove(pivot) ;
  moveStack = [] ;
  moveList = [] ;
  makeCube() ;

}

// This function solves the cube by simply playing the
// inverted move list backwards...
function solveCube() {
  var invRot ;
  //if(isSolving) return ;

  isSolving = true ;
  moveStack = [] ;
  console.log("Initial length of the movelist: ",moveList.length) ;
  while(moveList.length > 0) {
    // console.log(moveList) ;
    invRot = moveList.pop() ;
    // console.log("Intial rotation "+invRot) ;
    if(invRot == invRot.toUpperCase()) {
      invRot = invRot.toLowerCase() ;
    }
    else {
      invRot = invRot.toUpperCase() ;
    }
    // console.log("Inverse rotation "+invRot) ;
    invRot = invRot+"s" ;
    rotateFace(invRot,faces,pivot) ;
    updateCubies(rubiksCube) ;
  }
  console.log("Final length of the movelist: ",moveList.length) ;
  isSolving = false ;
}


function render() {
    requestAnimationFrame(render) ; // moved this to the to of the loop,
    var endRot = false ;            // as recommended (?)
    //debugger ;
    // smoothly rotate the active face
    if(isMoving) {
      // debugger ;
      pivot.rotation[activeAxis] += deltaRot ;
      pivot.updateMatrixWorld();
      // console.log("Current rotation: "+pivot.rotation[activeAxis]) ;
      if(Math.abs(pivot.rotation[activeAxis]) >= 0.5*Math.PI) {
          pivot.rotation[activeAxis] = 0.5*Math.PI * Math.sign(deltaRot) ;
          pivot.updateMatrixWorld();
          // console.log("Current exact rotation: "+pivot.rotation[activeAxis]) ;
          isMoving = false ;
          endRot = true ;
        }
    }
    if(!isMoving && endRot) {
    //detach active cubies from the pivot and attach them to the scene
      for (var i=0 ; i < activeCubies.length ; i++ ) {
          activeCubies[i].updateMatrixWorld(); // if not done by the renderer
          THREE.SceneUtils.detach( activeCubies[i], pivot, scene );
          scene.add(activeCubies[i]) ;
      }
      // console.log("I was here...") ;
      pivot.updateMatrixWorld();
      //scene.remove(pivot) ;
      endRot = false ;
      var rot = moveStack.pop() ;
      updateCubies(rubiksCube) ;
      if(rot != undefined)
        rotateFace(rot,faces,pivot) ;
    }

    renderer.render(scene,camera) ;
    camera.lookAt(scene.position) ;
    // timer -= 1 ;
    stats.update() ;
    //requestAnimationFrame(render) ;
}


function addVertices(mesh) {
    var vertices = mesh.geometry.vertices ;
    var vertexMaterial = new THREE.MeshPhongMaterial({color: 0x00ff00}) ;

    // for each vertex, add a sphere
    vertices.forEach(function(vertex) {
        var vertexSphere = new THREE.SphereGeometry(0.15) ;
        var vertexMesh = new THREE.Mesh(vertexSphere, vertexMaterial) ;
        vertexMesh.position = vertex ;
        scene.add(vertexMesh) ;
    }) ;


}

// The cube if made of 27 cubies, and as they are created they are
// added to the corresponding faces. Could probably just call the
// the updateCubies function... oh well...
function makeCube() {
  var Cubie ;
  for(var i = -1 ; i < 2 ; i++)
      for(var j = -1 ; j < 2 ; j++)
          for(var k = -1 ; k < 2 ; k++) {
              Cubie = addCubie({side:2.7,posX:3*i,posY:3*j,posZ:3*k}) ;
              rubiksCube.push(Cubie) ;
              if(i == -1) faces["L"].push(rubiksCube[rubiksCube.length-1]) ;
              if(i ==  1) faces["R"].push(rubiksCube[rubiksCube.length-1]) ;
              if(j == -1) faces["D"].push(rubiksCube[rubiksCube.length-1]) ;
              if(j ==  1) faces["U"].push(rubiksCube[rubiksCube.length-1]) ;
              if(k == -1) faces["B"].push(rubiksCube[rubiksCube.length-1]) ;
              if(k ==  1) faces["F"].push(rubiksCube[rubiksCube.length-1]) ;
              // console.log(Cubie.geometry.vertices) ;
              //var position = new THREE.Vector3(0,0,0);
              Cubie.updateMatrixWorld() ;
              // Make the inner cubie faces black
              // ... this code is ugly and messy, but it works...
              // (to be improved)
              Cubie.geometry.faces.forEach(
                  function(f) {
                    var position = new THREE.Vector3(0,0,0);
                    var centroid = new THREE.Vector3(0,0,0);
                    //Cubie.updateMatrixWorld() ;

                    //calculat the centroid of each triangle face
                    var v1 = Cubie.geometry.vertices[ f.a ];
                    var v2 = Cubie.geometry.vertices[ f.b ];
                    var v3 = Cubie.geometry.vertices[ f.c ];
                    centroid.x = ( v1.x + v2.x + v3.x ) / 3;
                    centroid.y = ( v1.y + v2.y + v3.y ) / 3;
                    centroid.z = ( v1.z + v2.z + v3.z ) / 3;
                    // position.add(Cubie.geometry.vertices[1]) ;
                    position.add(centroid) ;
                    centroid.applyMatrix4(Cubie.matrixWorld) ;
                    centroid.multiply(centroid) ; // (x*x,y*y,z*z)
                    // If any of the (x,y,z) coordinates of a
                    // is smaller (sufficiently, beware of rounding)
                    // than the maximum distance, than that face is
                    // and inner face. Vector product is a trick to
                    // get all positive values.
                    // 18.9 = 4.37 * 4.37 sligth smaller than max
                    // distance. 
                    if(Math.max(...centroid.toArray()) < 18.9) {
                      f.color.set("black") ;
                      //console.log(Math.max(...centroid.toArray())) ;
                    }
                  }
              )
              //group.add(rubiksCube[rubiksCube.length-1]) ;
            }
}

// I'm not confortable with just removing objects from the scene.
// I whish there was some delete object function, but I couldn't find one...
function destroyCube() {
  if(!isMoving)
    rubiksCube.forEach(function(o){scene.remove(o)}) ;
  rubiksCube = [] ;
}

// Creates each of the 27 cubies. The inner faces should be black, that's
// somehtong to work on. Also, surface normals should be calculated for
// later use in collision detection ?... (need to ask Jakob about it)
function addCubie(data) {
    var rubikColors = ["red","red",           // postive x
                      "orange","orange",      // negative x
                      "white","white",        // posive y
                      "yellow","yellow",      // negative y
                      "green","green",        // positive z
                      "blue","blue"]          // negative z

    // Each color is called twice, because a cube's face is made of
    // two triangles, both must be the same color
    var cubeGeometry = new THREE.BoxGeometry(data.side,data.side,data.side) ;
    for(var i = 0 ; i < cubeGeometry.faces.length ; i++)
        {
          // cubeGeometry.faces[i].color.setHex( Math.random() * 0xffffff ) ;
          cubeGeometry.faces[i].color.set(rubikColors[i]);
          // debugger ;
        }

    var cubeMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors}) ;
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterial) ;
    //cube.castShadow = data.castShadow ; //nothing to cast shadow on!
    cube.position.x = data.posX ;
    cube.position.y = data.posY ;
    cube.position.z = data.posZ ;
    scene.add(cube) ;
    return cube ;
}

// this function will rebuild the face arrays after cubes have changed
// position. You absolutely must call it after every rotation, or the
// faces will be messed up.
function updateCubies(temp) {  //given that rubiksCube is a global variable,
  faces["L"] = [] ;            // this argument isn't really required
  faces["R"] = [] ;
  faces["D"] = [] ;
  faces["U"] = [] ;
  faces["B"] = [] ;
  faces["F"] = [] ;

  for(i=0 ; i < temp.length ; i++) {
      var r = temp[i] ;
      // determine which face array each cubie belongs to
      // Remember: this changes after every rotation
      if(r.position.x < -1) faces["L"].push(r) ;
      if(r.position.x > 1) faces["R"].push(r) ;
      if(r.position.y < -1) faces["D"].push(r) ;
      if(r.position.y > 1) faces["U"].push(r) ;
      if(r.position.z < -1) faces["B"].push(r) ;
      if(r.position.z > 1) faces["F"].push(r) ;
      //group.add(r) ;
  }
  //scene.add(group) ;
}

function rotateFace(rot,faces,obj) {
  var axis = {"R": "x","L":"x","U":"y","D":"y","B":"z","F":"z"} ;
  var s = 1 ;
  var p = 1 ;

  // if we are in the course of a rotation, isMoving is true and
  // this functino simply pushes the rotation to the stack and exits.
  if(isMoving) {
    moveStack.unshift(rot) ;
    return ;
  }
  // The below code is required because the rotation request in the solving
  // mode are assynchronous to the rendering process, so normal flags don't
  // work inside the render function...
  // The solving function appends an 's' to each rotation to signal it's a
  // a solving move and should not be added to the stack
  if(rot.length <2) { // Only push if there isn't a suffix
    moveList.push(rot) ;
    console.log("Shouldn't be here!") ;
  }
  rot = rot[0] ; // get rid of the suffix if it's there.
  obj.rotation.set(0,0,0) ;
  obj.updateMatrixWorld() ;

  if(rot == rot.toLowerCase()) p = -1 ; //why doesn't JS has a isLower() function??
  rot = rot.toUpperCase() ;
  activeCubies = faces[rot] ;
  activeAxis = axis[rot] ; // this needs to be passed to the render function

  // Check for invalid rotations (lower case is already taken care of)
  if(!["R","L","U","D","B","F"].includes(rot)) {
    alert(rot+" is not a valid rotation!") ;
    debugger;
  }
  if(["L","D","B"].includes(rot)) s = -1 ;

  // atach active cubies to the pivot ;
  for ( var i=0 ; i < faces[rot].length ; i++ ) {
        // The SceneUtils.attach function doesn't work for me,
        // don't know why... guess I need to understand transformations better
        //THREE.SceneUtils.attach(faces[rot][i], scene, obj );
        obj.add(faces[rot][i]) ;
  }
  deltaRot = -s*p*0.1 ; // the 0.1 just be an adjustable parameter,
  isMoving = true ;    // slider in DAT.gui interface ?
  // setting the isMoving flag to "true" will activate the render code
}




function rotateFace2(rot,faces,obj) {
  var axis = {"R": "x","L":"x","U":"y","D":"y","B":"z","F":"z"} ;
  var s = 1 ;
  var p = 1 ;

  activeAxis = axis[rot] ; // this needs to be passed to the render function

  //if(isMoving) return() ;

  obj.rotation.set(0,0,0) ;
  obj.updateMatrixWorld() ;

  if(rot == rot.toLowerCase()) p = -1 ;
  rot = rot.toUpperCase() ;
  activeCubies = faces[rot] ;
  //console.log(activeCubies) ;
  if(!["R","L","U","D","B","F"].includes(rot)) {
    alert(rot+" is not a valid rotation!") ;
    debugger;
  }
  if(["L","D","B"].includes(rot)) s = -1 ;

  // atach active cubies to the pivot ;
  for ( var i=0 ; i < faces[rot].length ; i++ ) {
        //THREE.SceneUtils.attach(faces["L"][i], scene,pivot  );
        obj.add(faces[rot][i]) ;
  }
  deltaRot = -s*p*0.02 ;
  // rotate the pivot around the proper axis
  obj.rotation[axis[rot]] += -0.5*Math.PI * s * p ,0,0  ;
  obj.updateMatrixWorld();

//detach active cubies from the pivot and attach them to the scene
  for (var i=0 ; i < faces[rot].length ; i++ ) {
      faces[rot][i].updateMatrixWorld(); // if not done by the renderer
      THREE.SceneUtils.detach( faces[rot][i], obj, scene );
      scene.add(faces[rot][i]) ;
  }
  obj.updateMatrixWorld();
  scene.remove(obj) ;
}

axesOnOff.toggleAxes = true ;
function axesOnOff() {
  this.toggleAxes = !this.toggleAxes ;
  if(!this.toggleAxes)
    scene.add(theAxes) ;
  else
    scene.remove(theAxes) ;
  console.log("toggleAxes: "+this.toggleAxes) ;
}
axesOnOff.toggleAxes = true ;
function addStatsObject() {
  stats = new Stats() ;
  stats.setMode(0) ;
  stats.domElement.style.position = 'absolute' ;
  stats.domElement.style.right = '300px' ;
  stats.domElement.style.top = '0px' ;
  document.body.appendChild(stats.domElement) ;
}

function setupControlButtons() {

   var startButton = document.getElementById("_shuffle") ;
   startButton.onclick = shuffleCube ;

   var clearButton = document.getElementById("_reset") ;
   clearButton.onclick = resetCube ;

   var solveButton = document.getElementById("_solve") ;
   solveButton.onclick = solveCube ;

   var axesButton = document.getElementById("_axes") ;
   axesButton.onclick = axesOnOff ;

   var helpButton = document.getElementById("_help") ;
   helpButton.onclick = helpFunction ;
}

function readKeys(event) {
  var keys = ["L","R","D","U","B","F"] ;
  var keyPressed ;

  if(keyDown) return ;

  keys.forEach(
    function(c) {
      if(event.keyCode == c.charCodeAt(0)) {
         keyPressed = c ;
         if(event.shiftKey) keyPressed = keyPressed.toLowerCase() ;
         console.log("This key was pressed: "+keyPressed) ;
         rotateFace(keyPressed,faces, pivot) ;
         if(event.repeat) {
           keyDown = true ;
           return ; }
       }
    }) ;
}


function blockRepeat(event) {
    keyDown = false ;
}

function helpFunction() {
  window.alert("Use the following keys for rotation: L,R,D,U,B,F (+shift for inverse rotations)") ;
}


/**
 * Function handles the resize event. This make sure the camera and the renderer
 * are updated at the correct moment.
 */
function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

window.addEventListener('resize', handleResize, false);
window.addEventListener('keydown',readKeys,false) ;
window.addEventListener('keyup',blockRepeat,false) ;
window.onload = init ;
// code
