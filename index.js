const request = require('request');
const liburl = require('url');
const _ = require('lodash');
const { JSDOM } = require('jsdom');
const { EventEmitter } = require('events');

const INTERVAL = 1000 * 60 * 5;

class Zelkova extends EventEmitter {

	/**
	 * @param {string} targetURL
	 */
	constructor(targetURL) {
		super();

		this.watch = this.watch.bind(this);
		this.prevs = {
			blog: null,
			news: null,
			schedule: null,
			message: null
		};
		this.targetURL = targetURL;
		this.watch();
	}

	watch() {
		let catchedBody = null;

		(async () => {
			const { prevs, targetURL } = this;
			const rets = await new Promise((resolve, reject) => {
				request(targetURL, (err, res, body) => {
					if (err) { return reject(err); }

					catchedBody = body;
					/** @type {{window: {document: Document}}} */
					const { window: { document } } = (new JSDOM(body));

					resolve({
						blog: _.map(document.querySelectorAll('.box-float .slider ul a'), ($a) => ({
							title: $a.querySelector('.ttl').textContent.trim(),
							url: liburl.resolve(targetURL, $a.getAttribute('href')),
							thumbnail: $a.querySelector('.img img').getAttribute('src')
						})),
						news: _.map(document.querySelectorAll('.memberNews li'), ($li) => ({
							url: liburl.resolve(targetURL, $li.querySelector('a').getAttribute('href')),
							date: new Date($li.querySelector('time').textContent.trim().replace(/\./g, '/')),
							category: $li.querySelector('p.category').textContent.trim(),
							content: $li.querySelector('p.ttl').textContent.trim()
						})),
						schedule: _.map(document.querySelectorAll('.memberSche li a'), ($a) => ({
							url: liburl.resolve(targetURL, $a.getAttribute('href')),
							category: $a.querySelector('p.category').textContent.trim(),
							date: new Date($a.querySelector('time').textContent.trim().replace(/\./g, '/')),
							content: $a.querySelector('p.ttl').textContent.trim()
						})),
						message: [{ url: document.querySelector('.box-msg img').getAttribute('src') }]
					});
				});
			});

			_.forEach(_.toPairs(prevs), ([key, prev]) => {
				const ret = rets[key];

				if (!prev) {
					this.prevs[key] = ret[0];
				} else {
					_.some(ret, (child, i) => {
						if (i === 0) {
							this.prevs[key] = child;
						}

						if (_.isEqual(prev, child)) {
							return true;
						}

						this.emit(`update:${key}`, child);
					});
				}
			});
		})().catch((err) => {
			this.emit('error', { error: err, body: catchedBody });
		}).then(() => setTimeout(this.watch, INTERVAL));
	}
}

module.exports = Zelkova;