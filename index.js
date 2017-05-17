const request = require('request');
const liburl = require('url');
const _ = require('lodash');
const { JSDOM } = require('jsdom');
const { EventEmitter } = require('events');

const INTERVAL = 1000 * 60 * 5;

class Keyakify extends EventEmitter {

	/**
	 * @param {string} targetURL
	 */
	constructor(targetURL) {
		super();

		this.watch = this.watch.bind(this);
		this.prevBlog = null;
		this.targetURL = targetURL;
		this.watch();
	}

	watch() {
		(async () => {
			const { prevBlog, targetURL } = this;
			const blogs = await new Promise((resolve, reject) => {
				request(targetURL, (err, res, body) => {
					if (err) {
						reject(err);
					}

					/** @type {{window: {document: Document}}} */
					const { window: { document } } = (new JSDOM(body));
					resolve(
						_.map(document.querySelectorAll('.box-float .slider ul a'), ($a) => ({
							title: $a.querySelector('.ttl').textContent.trim(),
							url: liburl.resolve(targetURL, $a.getAttribute('href'))
						}))
					);
				});
			});

			if (!prevBlog) {
				this.prevBlog = blogs[0];
			} else {
				_.some(blogs, (blog, i) => {
					if (i === 0) {
						this.prevBlog = blog;
					}

					if (_.isEqual(prevBlog, blog)) {
						return true;
					}

					this.emit('update:blog', blog);

					return false;
				});
			}
		})().catch((err) => console.error(err)).then(() => setTimeout(this.watch, INTERVAL));
	}
}

module.exports = Keyakify;