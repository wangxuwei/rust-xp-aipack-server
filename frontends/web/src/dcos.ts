import { webRequest } from 'common/web-request.js';
import { Media, QueryOptions, Wks } from './bindings/entities.js';
import { BaseDco, dcoHub } from './dco-base.js';


class MediaDao extends BaseDco<Media, QueryOptions<Media>>{
	constructor() { super('Media') }

	async create(props: any & { file?: File }): Promise<Media> {
		const file = props.file;
		if (file) {
			const formData = new FormData();
			formData.append('file', file);
			// TODO - needs to change URL
			const webResult = await webRequest('POST', '/api/dse/Media', { body: formData });
			const media = (webResult.success) ? webResult.data as Media : null;

			if (media == null) {
				throw new Error(`MediaDao.create could not create the new media for ${file.name}`);
			}

			dcoHub.pub(this._entityType, 'create', media);
			return media;
		} else {
			return super.create(props);
		}
	}

	async listImages(): Promise<Media[]> {
		return super.list({ matching: { type: 'image' } });
	}

	async listVideos(): Promise<Media[]> {
		return super.list({ matching: { type: 'video' } });
	}
}


export const wksDco = new BaseDco<Wks, QueryOptions<Wks>>('Wks');


export const mediaDco = new MediaDao();;