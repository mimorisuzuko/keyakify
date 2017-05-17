# Keyakify

Keyakify watches the update of your favorite keyakizaka 46 member's blog.

## Usage

### `new Keyakify(url: string)`

Create the instance.

If there is a update, fire the following event

### `keyakify.on('update:blog', {title: string, url: string})`

### `keyakify.on('update:news', {date: Date, url: string, content: string, category: string})`

Sample is [here](./sample).