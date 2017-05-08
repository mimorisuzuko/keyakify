const co = require('co');
const request = require('request');
const config = require('config');
const url = require('url');
const Twitter = require('twitter');
const { JSDOM } = require('jsdom');

const parent = config.get('parent');
const target = config.get('target');
const twitter = new Twitter({
	consumer_key: config.get('consumerKey'),
	consumer_secret: config.get('consumerSecret'),
	access_token_key: config.get('accessTokenKey'),
	access_token_secret: config.get('accessTokenSecret')
});
let prevTitle = '';

const loop = () => {
	co(function* () {
		const [title, result] = yield new Promise((resolve, reject) => {
			request(parent, (err, res, body) => {
				if (err) {
					reject(err);
				}

				const $a = (new JSDOM(body)).window.document.querySelector('h3 a');
				const title = $a.textContent.trim();

				resolve([
					title,
					(prevTitle !== '' && title !== prevTitle) ? url.resolve(parent, $a.getAttribute('href')) : null
				]);
			});
		});

		if (result) {
			console.log(title, result);
			yield new Promise((resolve, reject) => {
				twitter.post('direct_messages/new', { screen_name: target, text: `${title}\n${result}` }, (err, tweets, res) => {
					if (err) {
						reject(err);
					}

					resolve(res);
				});
			});
		} else {
			console.log('更新されてない');
		}

		prevTitle = title;
	}).catch((err) => console.error(err)).then(() => {
		setTimeout(loop, 300000);
	});
};

loop();