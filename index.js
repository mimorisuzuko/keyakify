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
let prevTitle = '';

const loop = () => {
	co(function* () {
		const [title, result] = yield cheerio.fetch(parent).then(({ $ }) => {
			const $a = $('h3 > a');
			const title = $a.html();

			return [
				title,
				(prevTitle !== '' && title !== prevTitle) ? url.resolve(parent, $a.attr('href')) : null
			];
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