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