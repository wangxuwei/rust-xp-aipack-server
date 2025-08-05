

export function randomString(length?: number) {
	length = length || 6;
	const arr: string[] = [];
	for (let i = 0; i < length; i++) {
		let v = parseInt((Math.random() * 10).toString());
		arr.push(v.toString());
	}
	return arr.join("");
}

