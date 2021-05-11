// shader program binding variables
let unis = [
	'shading',
	'Pmat', 'Mmat',
	'lightPos', 'lightC',
	'amb_c', 'dif_c', 'spc_c', 'spc_p'
]

let attrs = [
	{ src: 'vertexPositions'  , dst: 'srcPos'  },
	{ src: 'vertexNormals'    , dst: 'srcNorm' },
	{ src: 'vertexFrontcolors', dst: 'fColor'  }
]

let curTime, frame

// init GL
function initGL(canvas) {
	gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
	if (!gl) return console.error('Could not initialize WebGL!')
	if (!gl.getExtension('OES_standard_derivatives'))
		throw 'OES_standard_derivatives extension not supported!'
	gl.viewportWidth  = canvas.width
	gl.viewportHeight = canvas.height
	return gl
}

// init shaders
async function getShader(gl, url, shaderType) {
	let res = await req(url, 'text')
	if (!res) return
	let shader = gl.createShader(shaderType)
	if (!shader) return
	gl.shaderSource(shader, res)
	gl.compileShader(shader)
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		return console.error('Error in getting shader parameter.\n' + gl.getShaderInfoLog(shader))
	return shader
}

async function initShaders(gl) {
	let vertexShader   = await getShader(gl, 'shader/vertexShader.c'  , gl.VERTEX_SHADER  )
	let fragmentShader = await getShader(gl, 'shader/fragmentShader.c', gl.FRAGMENT_SHADER)

	sp = gl.createProgram()
	gl.attachShader(sp, vertexShader)
	gl.attachShader(sp, fragmentShader)
	gl.linkProgram(sp)
	if (!gl.getProgramParameter(sp, gl.LINK_STATUS))
		console.error('Could not initialise shaders')
	gl.useProgram(sp)

	unis .forEach(uni  => linkUni (gl, sp, uni     ))
	attrs.forEach(attr => linkAttr(gl, sp, attr.dst))
}

// linking variables
function linkUni(gl, prog, name) {
	prog[name] = gl.getUniformLocation(prog, name)
}

function linkAttr(gl, prog, name) {
	prog[name] = gl.getAttribLocation(prog, name)
	gl.enableVertexAttribArray(prog[name])
}

function passUni(gl, prog, name, type, value, mat) {
	mat = mat || false
	let uniform = `uniform${mat ? 'Matrix' : ''}${type}`
	if (typeof gl[uniform] !== 'function')
		throw console.error('Invalid type!')
	if (mat) gl[uniform](prog[name], false, value)
	else gl[uniform](prog[name], value)
}

function passAttr(gl, prog, name, type, value, l) {
	gl.bindBuffer(gl.ARRAY_BUFFER, value)
	gl.vertexAttribPointer(prog[name], l, type, false, 0, 0)
}

// bind model data
async function bindModel(gl, model) {
	model.buffer = {}
	attrs.forEach(attr => {
		let src = model.data[attr.src]
		if (src) {
			let buffer = gl.createBuffer()
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(src), gl.STATIC_DRAW)
			buffer.itemSize = 3
			buffer.numItems = src.length / 3
			model.buffer[attr.src] = buffer
		} 
	})
}

// drawing
function initScene(gl) {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

function drawModel(gl, model) {
	for (attr of attrs) if (!model.buffer[attr.src]) return

	// Setup Projection Matrix
  let Pmat = mat4.create();
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, Pmat);

	// Setup Model-View Matrix
	// Note that glMatrix uses the OpenGL/Web GL convention of Post-Multiplication.
	// Therefore the the code order is the opposite of the actual geometry operation.
	let Mmat = mat4.create()
	mat4.identity(Mmat)
	mat4.rotate(Mmat, degToRad(30), [1, 0, 0])
	mat4.translate(Mmat, [0, -25, -40])
	mat4.rotate(Mmat, model.angle * Math.PI / 180, [0, 1, 0])
	mat4.translate(Mmat, [
		model.data.center.x,
		model.data.center.y,
		model.data.center.z
	])

	// pass in the variables and data
	passUni(gl, sp, 'shading',  '1i' , opt.shading)
	passUni(gl, sp, 'Pmat',     '4fv', Pmat, true)
	passUni(gl, sp, 'Mmat',     '4fv', Mmat, true)
	passUni(gl, sp, 'lightPos', '3fv', opt.lightPos)
	passUni(gl, sp, 'lightC',   '3fv', opt.lightC)
	passUni(gl, sp, 'amb_c',    '1f' , opt.amb_c)
	passUni(gl, sp, 'dif_c',    '1f' , opt.dif_c)
	passUni(gl, sp, 'spc_c',    '1f' , opt.spc_c)
	passUni(gl, sp, 'spc_p',    '1f' , opt.spc_p)

	attrs.forEach(attr => {
		let buf = model.buffer[attr.src]
		if (buf) passAttr(gl, sp, attr.dst, gl.FLOAT, buf, buf.itemSize, true)
	})

	gl.drawArrays(gl.TRIANGLES, 0, model.buffer.vertexPositions.numItems)
}

function tick(gl, ms, f) {
	let dt = (ms - curTime) || 0
	frame ++
	initScene(gl)
	f(dt)
	let fps = (1000 / dt).toFixed(2)
	if (frame % 60 === 0) console.log(`FPS: ${fps}`)
	curTime = ms
	requestAnimFrame(ms => tick(gl, ms, f))
}

function startWebGL(sel, color, models, f) {
	let canvas = getEle(sel)
	scaleToWindow(canvas)
	listen('resize', e=>{ scaleToWindow(canvas) })

	gl = initGL(canvas)
	
	models.forEach(model => {
		bindModel(gl, model)
	})
	initShaders(gl).then(() => {
		gl.clearColor(...color)
		gl.enable(gl.DEPTH_TEST)
		curTime = 0
		frame = 0
		tick(gl, 0, f)
	})
}