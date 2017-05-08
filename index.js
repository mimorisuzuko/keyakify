const co = require('co');
const cheerio = require('cheerio-httpcli');
const config = require('config');
const url = require('url');
const Twitter = require('twitter');

const parent = config.get('parent');
const target = config.get('target');
const twitter = new Twitter({
	consumer_key: config.get('consumerKey'),
	consumer_secret: config.get('consumerSecret'),
	access_token_key: config.get('accessTokenKey'),
	access_token_secret: config.get('accessTokenSecret')
});
let prevLastModified = '';

const loop = () => {
	co(function* () {
		const [lastModified, result] = yield cheerio.fetch(parent).then((result) => {
			const { response: { headers }, $ } = result;
			const lastModified = headers['last-modified'];

			return [
				lastModified,
				(prevLastModified !== '' && lastModified !== prevLastModified) ? url.resolve(parent, $('h3 > a').attr('href')) : null
			];
		});

		if (result) {
			console.log('更新された', result);
			yield new Promise((resolve, reject) => {
				twitter.post('direct_messages/new', { screen_name: target, text: result }, (err, tweets, res) => {
					if (err) {
						reject(err);
					}

					resolve(res);
				});
			});
		} else {
			console.log(prevLastModified, lastModified, '更新されてない');
		}

		return prevLastModified = lastModified;
	}).catch((err) => console.error(err)).then(() => {
		setTimeout(loop, 300000);
	});
};

loop();