const request = require('request');
const liburl = require('url');
const _ = require('lodash');
const { JSDOM } = require('jsdom');
const { EventEmitter } = require('events');
const os = require('os');
const libpath = require('path');
const fs = require('fs-extra');

/**
 * @return {string}
 */
const genKey = () => {
	const { length } = __dirname;
	let ret = '';

	for (let i = 0; i < length; i += 1) {
		const a = __dirname.charCodeAt(i).toString(16);
		const { length: b } = a;

		ret += `${Array(2 - b).fill(0).join('')}${a}`;
	}

	return ret;
};

const STATE_DIR = libpath.join(os.homedir(), '.zelkova');
const STATE_PATH = libpath.join(STATE_DIR, `state${genKey()}.json`);
const INTERVAL = 1000 * 60 * 1;

if (!fs.existsSync(STATE_DIR)) {
	fs.mkdirSync(STATE_DIR);
}

if (!fs.existsSync(STATE_PATH)) {
	fs.writeFileSync(
		STATE_PATH,
		JSON.stringify({
			blog: null,
			news: null,
			schedule: null,
			message: null
		}),
		'utf-8'
	);
}

class Zelkova extends EventEmitter {

	/**
	 * @param {string} targetURL
	 */
	constructor(targetURL) {
		super();

		this.watch = this.watch.bind(this);
		this.state = fs.readJSONSync(STATE_PATH, 'utf-8');
		this.targetURL = targetURL;
		this.watch();
	}

	async save() {
		const { state } = this;

		return fs.writeFile(STATE_PATH, JSON.stringify(state), 'utf-8');
	}

	watch() {
		(async () => {
			const { state, targetURL } = this;
			const rets = await new Promise((resolve, reject) => {
				request(targetURL, (err, res, body) => {
					if (err) { return reject(err); }

					const { statusCode } = res;
					if (400 <= statusCode && statusCode < 600) { reject(`Status code: ${statusCode}`); }

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

			_.forEach(_.toPairs(state), ([key, value]) => {
				const ret = rets[key];

				if (!value) {
					this.state[key] = ret[0];
				} else {
					_.some(ret, (child, i) => {
						if (i === 0) {
							this.state[key] = child;
						}

						if (_.isEqual(value, child)) {
							return true;
						}

						this.emit(`update:${key}`, child);
					});
				}
			});

			await this.save();
		})().catch((err) => {
			this.emit('error', { error: err });
		}).then(() => setTimeout(this.watch, INTERVAL));
	}
}

module.exports = Zelkova;
