# Keyakify

Keyakify watches the update of your favorite keyakizaka 46 member's blog.

## Usage

### `new Keyakify(url: string)`

Create the instance.

### `keyakify.on('update', {title: string, url: string})`

If there is the update, fire the event. `title` is the title and `url` is the url.

Sample is [here](./sample).