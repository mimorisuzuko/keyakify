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
		this.prevNews = null;
		this.targetURL = targetURL;
		this.watch();
	}

	watch() {
		(async () => {
			const { prevBlog, prevNews, targetURL } = this;
			const { blogs, news } = await new Promise((resolve, reject) => {
				request(targetURL, (err, res, body) => {
					if (err) {
						reject(err);
					}

					/** @type {{window: {document: Document}}} */
					const { window: { document } } = (new JSDOM(body));

					resolve({
						blogs: _.map(document.querySelectorAll('.box-float .slider ul a'), ($a) => ({
							title: $a.querySelector('.ttl').textContent.trim(),
							url: liburl.resolve(targetURL, $a.getAttribute('href'))
						})),
						news: _.map(document.querySelectorAll('.memberNews li'), ($li) => ({
							url: liburl.resolve(targetURL, $li.querySelector('a').getAttribute('href')),
							date: new Date($li.querySelector('time').textContent.trim().replace(/\./g, '/')),
							category: $li.querySelector('p.category').textContent.trim(),
							content: $li.querySelector('p.ttl').textContent.trim()
						}))
					});
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

			if (!prevNews) {
				this.prevNews = news[0];
			} else {
				_.some(news, (child, i) => {
					if (i === 0) {
						this.prevNews = child;
					}

					if (_.isEqual(prevNews, child)) {
						return true;
					}

					this.emit('update:news', child);

					return false;
				});
			}
		})().catch((err) => console.error(err)).then(() => setTimeout(this.watch, INTERVAL));
	}
}

module.exports = Keyakify;