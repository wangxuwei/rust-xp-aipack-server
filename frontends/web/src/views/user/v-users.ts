import { AVATAR_IMAGE } from "common/conf.js";
import { randomString } from "common/utils.js";
import { AvatarElement } from "components/c-avatar.js";
import { DgImageCrop } from "dialog/dg_image_crop.js";
import { OnEvent, all, customElement, first, onEvent, onHub, setAttr } from "dom-native";
import { PaginationView } from "pagination/v-pagination.js";
import { TableCell } from "table/v-table-cell.js";
import { getOrderBy, getUserAvatar } from "ts/app-helper.js";
import { userDco } from "ts/dcos.js";
import { asNum, isEmpty } from "utils-min";
import { User } from "../../bindings/User.js";
import { BaseLeafRoute } from "../route/v-leaf-route.js";
import { DgUser } from "./dg-user.js";

@customElement("v-users")
export class UsersView extends BaseLeafRoute {
	#pageIndex: number = 0;
	#pageSize: number = 20;
	#sortColumn = "username";
	#sortType = "id";

	//// Key elements
	private get paginationEl(): PaginationView {
		return first(this, "v-pagination") as PaginationView;
	}

	private get orderColumnEl(): TableCell {
		return first(this, `v-table-cell[sort-column='${this.#sortColumn}']`) as TableCell;
	}

	//#region    ---------- Events ----------
	@onEvent("click", ".btn-change-avatar")
	onChangeAvatar(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
		const userId = asNum(rowEl.dataset.id);
		const uuid = rowEl.dataset.uuid;
		let profile = rowEl.dataset.profile;
		if (!isEmpty(userId)) {
			const imageCropDialog = new DgImageCrop();
			imageCropDialog.callback = async (blob: Blob | null) => {
				if (blob) {
					try {
						const formData: any = {};
						formData["user_id"] = userId;
						formData["file"] = blob;
						await userDco.uploadUserAvatar(formData);
						const avatarEl = first(rowEl, "c-avatar") as AvatarElement;
						avatarEl.url = getUserAvatar(uuid!, AVATAR_IMAGE) + "?t=" + randomString();
					} catch (error: any) {
						console.log(error);
					}
				}
			};
			document.body.appendChild(imageCropDialog);
		}
	}

	@onEvent("click", ".btn-edit")
	onEditClick(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
		const userId = asNum(rowEl.dataset.id);
		if (!isEmpty(userId)) {
			this.showUserDialog(userId!);
		}
	}

	@onEvent("click", ".btn-delete")
	onDeleteClick(evt: MouseEvent & OnEvent) {
		const rowEl = evt.selectTarget.closest(".row") as HTMLElement;
		const userId = asNum(rowEl.dataset.id);
		if (!isEmpty(userId)) {
			userDco.delete(userId!).then(() => this.refresh());
		}
	}

	@onEvent("click", "button.add")
	onAddClick() {
		this.showUserDialog();
	}

	@onEvent("PAGE_CHANGE")
	onPageChange(evt: OnEvent) {
		this.#pageIndex = evt.detail.pageIndex;
		this.#pageSize = evt.detail.pageSize;
		this.refresh();
	}

	@onEvent("SORT_CHANGE")
	onSortChange(evt: OnEvent) {
		this.#sortColumn = evt.detail.sortColumn;
		this.#sortType = evt.detail.sortType;
		this.refresh();
	}
	//#endregion ---------- /Events ----------

	//#region    ---------- Hub Events ----------
	@onHub("dcoHub", "user", "create,update,delete")
	onUserChange() {
		this.refresh();
	}
	//#endregion ---------- /Hub Events ----------

	//#region    ---------- Lifecycle ----------
	init() {
		super.init();
		this.refresh();
	}

	async refresh() {
		const [users, count] = await userDco.listAndCount({
			list_options: {
				offset: this.#pageIndex * this.#pageSize,
				limit: this.#pageSize,
				order_bys: [getOrderBy(this.#sortColumn, this.#sortType)],
			},
		});
		this.innerHTML = _render(users);
		const paginationEl = this.paginationEl;
		paginationEl.refreshInfo(this.#pageIndex, count);
		const orderColumnEl = this.orderColumnEl;
		all(this, "v-table-cell").forEach((cellEl) => {
			setAttr(cellEl, "sort-type", null);
		});
		if (this.#sortType && orderColumnEl) {
			setAttr(orderColumnEl, "sort-type", this.#sortType);
		}
	}
	//#endregion ---------- /Lifecycle ----------

	//#region    ---------- Private Functions ----------
	private showUserDialog(userId?: number) {
		const dialog = document.createElement("dg-user") as DgUser;
		dialog.userId = userId;
		this.appendChild(dialog);
	}
	//#endregion ---------- /Private Functions ----------
}

function _render(users: User[]) {
	const rows = users
		.map(
			(user) => `
		<div class="row" data-id="${user.id}" data-uuid="${user.uuid}" ${user.profile ? "data-profile=" + user.profile : ""}>
			<div class="cell"><c-avatar url="${getUserAvatar(user.uuid, user.profile)}"></c-avatar>${user.username}</div>
			<div class="cell actions">
				<button class="btn-change-avatar prime">Change avatar</button>
				<button class="btn-edit prime">Edit</button>
				<button class="btn-delete danger">Delete</button>
			</div>
		</div>
		`
		)
		.join("");

	return `
		<div class="ui-breadcrumbs">
			<div class="breadcrumb-item">Users</div>
		</div>
		<div class="header">
			<button class="add default">Add User</button>
		</div>
		<div class="table-container">
			<div class="ui-table">
				<div class="thead row">
					<v-table-cell sort-column="username">Username</v-table-cell>
					<div class="cell">Actions</div>
				</div>
				<div class="tbody">
					${rows}
				</div>
				<div class="tfoot">
					<v-pagination></v-pagination>
				</div>
			</div>
		</div>
	`;
}
