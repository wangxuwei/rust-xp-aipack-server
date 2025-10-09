import { first, on } from "dom-native";
import { apiPrx } from "../../../_common/src/conf.js";
import { webPost } from "../../../_common/src/web-request.js";

document.addEventListener("DOMContentLoaded", async function () {
	// Get the prp parameter from URL
	const urlParams = new URLSearchParams(window.location.search);
	const prp = urlParams.get("prp");

	const errorEl = first(document, ".error")!;
	if (!prp) {
		errorEl.textContent = "Invalid password reset link";
		errorEl.classList.remove("hide");
		return;
	}

	// First validate the prp
	try {
		let response = await webPost(`${apiPrx}/check-prp`, {
			body: { prp },
		});

		if (response.error != null) {
			errorEl.textContent = "Invalid password reset link";
			errorEl.classList.remove("hide");
		}
	} catch (e) {
		errorEl.textContent = "Invalid password reset link";
		errorEl.classList.remove("hide");
		return;
	}

	// Handle form submission
	const resetForm = first(document, ".reset-form")!;
	on(resetForm, "submit", async (e) => {
		e.preventDefault();
		errorEl.classList.add("hide");
		const passwordEl = first(resetForm, "[name='pwd_clear']") as HTMLInputElement;
		const repeatPasswordEl = first(resetForm, "[name='repeat_pwd']") as HTMLInputElement;
		const prpEl = first(resetForm, "[name='prp']") as HTMLInputElement;
		const password = passwordEl.value;
		const repeatPassword = repeatPasswordEl.value;
		const prp = prpEl.value;

		if (password !== repeatPassword) {
			errorEl.textContent = "Passwords do not match";
			errorEl.classList.remove("hide");
			return;
		}

		let response: any = await webPost(`${apiPrx}/reset-pwd`, {
			body: { prp, pwd_clear: password, repeat_pwd: repeatPassword },
		});

		if (response.error != null) {
			errorEl.textContent = response.error.message || "Failed to reset password";
			errorEl.classList.remove("hide");
		} else {
			const successCtnEl = first(document, ".success-ctn")!;
			const formCtnEl = first(document, ".form-ctn")!;
			successCtnEl.classList.remove("hide");
			formCtnEl.classList.add("hide");
		}
	});
});
