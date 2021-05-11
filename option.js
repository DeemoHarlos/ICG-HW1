const Options = Vue.createApp({
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
	
			// Light source
			lightPos: [30, 30, -30],
			lightC: [1.0, .9, .65],
		},
	}},
	async mounted() {
		models = this.models
		opt = this.opt
	}
})
