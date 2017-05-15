const request = require('request');
const liburl = require('url');
const { JSDOM } = require('jsdom');
const { EventEmitter } = require('events');

class Keyakify extends EventEmitter {

	/**
	 * @param {string} targetURL
	 */
	constructor(targetURL) {
		super();

		this.watch = this.watch.bind(this);
		this.prev = '';
		this.targetURL = targetURL;
		this.watch();
	}

	watch() {
		(async () => {
			const { prev, targetURL } = this;
			const [title, url] = await new Promise((resolve, reject) => {
				request(targetURL, (err, res, body) => {
					if (err) {
						reject(err);
					}

					const $a = (new JSDOM(body)).window.document.querySelector('h3 a');
					const title = $a.textContent.trim();

					resolve([
						title,
						(prev !== '' && title !== prev) ? liburl.resolve(parent, $a.getAttribute('href')) : null
					]);
				});
			});

			if (url) {
				this.emit('update', { title, url });
			}

			this.prev = title;
		})().catch((err) => console.error(err)).then(() => {
			setTimeout(this.watch, 300000);
		});
	}
}

module.exports = Keyakify;