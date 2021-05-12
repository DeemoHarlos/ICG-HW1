const Options = Vue.createApp({
	async mounted() {
		await Promise.all(this.models.map(async model => {
			model.data = await req(model.src, 'json')
		}))
		this.models.forEach(this.preProcess);
		await startWebGL('#ICG-canvas', [0.0, 0.1, 0.1, 1.0], this.models, (gl, sp, dt, dbg) => {
			this.models.forEach(model => {
				model.angle += 0.05 * dt
			})
			this.models.forEach(model => drawModel(gl, sp, model, this.opt, dbg))
		})
	},
	data() { return {
		models: [
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
		],
		shadings: [
			{ v: 0, name: 'No Shading' },
			{ v: 1, name: 'Flat Shading' },
			{ v: 2, name: 'Gouraud Shading' },
			{ v: 3, name: 'Phong Shading' },
		],
		opt: {
			// 0 No shading 1 FLAT 2 GOURAUD 3 PHONG
			shading: 3,
	
			// constants
			amb_c:  0.1,
			dif_c:  0.8,
			spc_c:  0.4,
			spc_p: 16.0,
			spc_p_log: 4.0,
	
			// Light source
			lightPos: [30, 30, -30],
			lightC: [1.0, .9, .65],
		},
	}},
	methods: {
		// some utils
		degToRad(deg) {
			return deg * Math.PI / 180
		},
		preProcess(model) {
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
			model.angle = 180
		},
	},
	watch: {
		'opt.spc_p_log'(v) {
			this.opt.spc_p = Math.pow(2, v).toFixed(2)
		},
	},
}).mount('#options')
