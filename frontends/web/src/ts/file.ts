export function download(url: string) {
	const iframe = document.createElement("iframe");
	iframe.style.display = "none";
	iframe.src = url;
	document.body.appendChild(iframe);

	setTimeout(() => {
		document.body.removeChild(iframe);
	}, 1000);
}
