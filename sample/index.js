const Twitter = require('twitter');
const config = require('config');
const Keyakify = require('../');

const twitter = new Twitter({
	consumer_key: config.get('twitter.consumerKey'),
	consumer_secret: config.get('twitter.consumerSecret'),
	access_token_key: config.get('twitter.accessTokenKey'),
	access_token_secret: config.get('twitter.accessTokenSecret')
});
const keyakify = new Keyakify('http://www.keyakizaka46.com/s/k46o/diary/member/list?ima=0000&ct=28');
const target = config.get('target');

keyakify.on('update', ({ title, url }) => {
	twitter.post('direct_messages/new', { screen_name: target, text: `${title}\n${url}` }, (err) => {
		if (err) { return console.error(err); }

		console.log(`✨  Send a direct message to @${target}`);
	});
});
