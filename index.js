// alias
let listen = window.addEventListener
let getEle = sel => document.querySelector(sel)
let req = (url, type) => {
	return new Promise(resolve => {
		let request = new XMLHttpRequest()
		request.responseType = type
		request.open('GET', url)
		request.onreadystatechange = () => {
			if (request.readyState === 4) resolve(request.response)
		}
		request.send()
	})
}

// common variables
let gl
let shaderProgram

let SHADING = 3 // 0 NO SHADING 1 FLAT 2 GOURAUD 3 PHONG
let models = [
	{ src: 'model/Teapot.json' },
	// { src: 'model/Car_road.json' },
	// { src: 'model/Church_s.json' },
	// { src: 'model/Csie.json' },
	// { src: 'model/Easter.json' },
	// { src: 'model/Fighter.json' },
	// { src: 'model/Kangaroo.json' },
	// { src: 'model/Longteap.json' },
	// { src: 'model/Mercedes.json' },
	// { src: 'model/Mig27.json' },
	// { src: 'model/Patchair.json' },
	// { src: 'model/Plant.json' },
	// { src: 'model/Tomcat.json' }
]

let curTime = 0

// init GL
function initGL(canvas) {
	gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
	if (!gl) return console.error('Could not initialize WebGL!')
	if (!gl.getExtension('OES_standard_derivatives'))
		throw 'extension not support'
	gl.viewportWidth  = canvas.width
	gl.viewportHeight = canvas.height
}

// init shaders
async function getShader(url, shaderType) {
	let res = await req(url, 'text')
	if (!res) return
	let shader = gl.createShader(shaderType)
	if (!shader) return
	gl.shaderSource(shader, res)
	gl.compileShader(shader)
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error('Error in getting shader parameter.\n' + gl.getShaderInfoLog(shader))
		return
	}
	return shader
}

async function initShaders() {
	let vertexShader   = await getShader('shader/vertexShader.c'  , gl.VERTEX_SHADER  )
	let fragmentShader = await getShader('shader/fragmentShader.c', gl.FRAGMENT_SHADER)

	shaderProgram = gl.createProgram()
	gl.attachShader(shaderProgram, vertexShader)
	gl.attachShader(shaderProgram, fragmentShader)
	gl.linkProgram(shaderProgram)
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
		console.error('Could not initialise shaders')
	gl.useProgram(shaderProgram)

	shaderProgram.SHADING = gl.getUniformLocation(shaderProgram, 'SHADING')
	shaderProgram.pMatrixUniform  = gl.getUniformLocation(shaderProgram, 'Pmat')
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'Mmat')

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'srcPos')
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute)
	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, 'srcNorm');
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
	shaderProgram.vertexFrontColorAttribute = gl.getAttribLocation(shaderProgram, 'fColor')
	gl.enableVertexAttribArray(shaderProgram.vertexFrontColorAttribute)
}

// load
function bindData(data) {
	let buffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
	buffer.itemSize = 3
	buffer.numItems = data.length / 3
	return buffer
}

function bindObject(model) {
	model.buffer.vertexPosition   = bindData(model.data.vertexPositions  )
	model.buffer.vertexNormal     = bindData(model.data.vertexNormals    )
	model.buffer.vertexFrontColor = bindData(model.data.vertexFrontcolors)
}

async function loadModel(model) {
	model.buffer = {}
	model.data = await req(model.src, 'json')
	bindObject(model)
}

async function initModels() {
	await Promise.all(models.map(loadModel))
	models.forEach(model => {
		model.angle = 180
	})
}

// util
function degToRad(deg) {
	return deg * Math.PI / 180
}

function preProcess(model) {
	let positions = []
	let index = 0
	model.data.vertexPositions.forEach((e, i) => {
		if (i % 3 === 0) index = positions.push({}) - 1
		     if (i % 3 === 0) positions[index].x = e
		else if (i % 3 === 1) positions[index].y = e
		else if (i % 3 === 2) positions[index].z = e
	})
	let max = positions.reduce((r, e) => { return {
		x: Math.max(r.x, e.x),
		y: Math.max(r.y, e.y),
		z: Math.max(r.z, e.z)
	}})
	let min = positions.reduce((r, e) => { return {
		x: Math.min(r.x, e.x),
		y: Math.min(r.y, e.y),
		z: Math.min(r.z, e.z)
	}})
	model.data.bound = {
		max: max,
		min: min
	}
	model.data.center = {
		x: (max.x + min.x) / 2,
		y: (max.y + min.y) / 2,
		z: (max.z + min.z) / 2
	}
	model.data.size = {
		x: max.x - min.x,
		y: max.y - min.y,
		z: max.z - min.z
	}
}

/*
	TODO HERE:
	add two or more objects showing on the canvas
	(it needs at least three objects showing at the same time)
*/
function drawScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// Setup Projection Matrix
	let pMatrix  = mat4.create()
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix)
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix)

	models.forEach(drawModel)
}

function drawModel(model) {
	if (model.buffer.vertexPosition   == null || 
	    model.buffer.vertexNormal     == null || 
	    model.buffer.vertexFrontColor == null) return

	// Setup Projection Matrix
  let pMatrix = mat4.create();
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

	// Setup Model-View Matrix
	// Note that glMatrix uses the OpenGL/Web GL convention of Post-Multiplication.
	// Therefore the the code order is the opposite of the actual geometry operation.
	let mvMatrix = mat4.create()
	mat4.identity(mvMatrix)
	mat4.translate(mvMatrix, [0, 0, -40])
	mat4.rotate(mvMatrix, degToRad(model.angle), [0, 1, 0])
	mat4.translate(mvMatrix, [
		model.data.center.x,
		model.data.center.y,
		model.data.center.z
	])

	gl.uniform1i(shaderProgram.SHADING, [SHADING])
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix)

	// Setup teapot position data
	gl.bindBuffer(gl.ARRAY_BUFFER, model.buffer.vertexPosition)
	gl.vertexAttribPointer(
		shaderProgram.vertexPositionAttribute, 
		model.buffer.vertexPosition.itemSize, 
		gl.FLOAT, false, 0, 0
	)

	// Setup teapot front color data
	gl.bindBuffer(gl.ARRAY_BUFFER, model.buffer.vertexNormal)
	gl.vertexAttribPointer(
		shaderProgram.vertexNormalAttribute, 
		model.buffer.vertexNormal.itemSize, 
		gl.FLOAT, false, 0, 0
	)

	// Setup teapot front color data
	gl.bindBuffer(gl.ARRAY_BUFFER, model.buffer.vertexFrontColor)
	gl.vertexAttribPointer(
		shaderProgram.vertexFrontColorAttribute, 
		model.buffer.vertexFrontColor.itemSize, 
		gl.FLOAT, false, 0, 0
	)

	gl.drawArrays(gl.TRIANGLES, 0, model.buffer.vertexPosition.numItems)
	// console.log(model.src)
}

function animate(dt) {
	models.forEach(model => {
		model.angle += 0.05 * dt
	})
}

function tick(ms) {
	let dt = ms - curTime || 0
	animate(dt)
	drawScene(dt)
	curTime = ms
	requestAnimFrame(tick)
}

function webGLStart() {
	let canvas = document.getElementById('ICG-canvas')
	scaleToWindow(canvas)
	listen('resize', e=>{ scaleToWindow(canvas) })

	initGL(canvas)
	initShaders().then(async () => {
		await initModels()
		models.forEach(preProcess)
		gl.clearColor(0.0, 0.1, 0.1, 1.0)
		gl.enable(gl.DEPTH_TEST)
		tick()
	})
}